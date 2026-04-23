// RFQ (Request For Quote) encoding/decoding.
//
// The cart + contact info serialize into URL params so any RFQ can be shared
// as a single link:
//   ?rfq=1:5,3:2&n=Drew&c=Co&e=x&p=281...&street=...&city=...&pm=ach&o=notes
//
// rfq=cart, n=name, c=company, e=email, p=phone, pm=payment, o=notes
// Address: street, street2, city, state, zip
// Legacy free-text delivery (pre-v16) stored in `d` — kept for back-compat.

const LS_RFQ = 'herban.rfq.v1'

export const EMPTY_RFQ = {
  cart: {},
  contact: {
    name: '',
    company: '',
    email: '',
    phone: '',
    // Structured address (v16+) — used when any field is filled
    street: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    // Legacy free-text fallback (pre-v16) — render only if structured all blank
    delivery: '',
    payment: '',  // 'cc' | 'ach' — required
    notes: '',
  },
}

// US phone validator: must contain at least 10 digits ignoring non-digit chars.
// Accepts "281-330-8004", "(281) 330-8004", "+1 281 330 8004", "2813308004", etc.
export function isValidPhone(raw) {
  if (!raw) return false
  const digits = String(raw).replace(/\D/g, '')
  return digits.length >= 10
}

export function readRFQFromURL() {
  if (typeof window === 'undefined') return null
  const sp = new URLSearchParams(window.location.search)
  const known = ['rfq', 'n', 'c', 'e', 'p', 'd', 'pm', 'o',
                 'street', 'street2', 'city', 'state', 'zip']
  if (!known.some((k) => sp.has(k))) return null

  const cart = {}
  if (sp.has('rfq')) {
    for (const pair of sp.get('rfq').split(',')) {
      const [id, qty] = pair.split(':').map(Number)
      if (!Number.isNaN(id) && !Number.isNaN(qty) && qty > 0) {
        cart[id] = qty
      }
    }
  }

  return {
    cart,
    contact: {
      name:     sp.get('n') || '',
      company:  sp.get('c') || '',
      email:    sp.get('e') || '',
      phone:    sp.get('p') || '',
      street:   sp.get('street') || '',
      street2:  sp.get('street2') || '',
      city:     sp.get('city') || '',
      state:    sp.get('state') || '',
      zip:      sp.get('zip') || '',
      delivery: sp.get('d') || '',
      payment:  sp.get('pm') || '',
      notes:    sp.get('o') || '',
    },
  }
}

export function buildRFQURL(rfq, baseURL) {
  const base = baseURL ?? `${window.location.origin}${window.location.pathname}`
  const sp = new URLSearchParams()

  const pairs = Object.entries(rfq.cart)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => `${id}:${qty}`)
  if (pairs.length) sp.set('rfq', pairs.join(','))

  const c = rfq.contact
  if (c.name)     sp.set('n', c.name)
  if (c.company)  sp.set('c', c.company)
  if (c.email)    sp.set('e', c.email)
  if (c.phone)    sp.set('p', c.phone)
  if (c.street)   sp.set('street', c.street)
  if (c.street2)  sp.set('street2', c.street2)
  if (c.city)     sp.set('city', c.city)
  if (c.state)    sp.set('state', c.state)
  if (c.zip)      sp.set('zip', c.zip)
  if (c.delivery) sp.set('d', c.delivery)
  if (c.payment)  sp.set('pm', c.payment)
  if (c.notes)    sp.set('o', c.notes)

  const qs = sp.toString()
  return qs ? `${base}?${qs}` : base
}

export function loadRFQ() {
  try {
    const raw = localStorage.getItem(LS_RFQ)
    if (!raw) return { ...EMPTY_RFQ, contact: { ...EMPTY_RFQ.contact } }
    const parsed = JSON.parse(raw)
    return {
      cart: parsed.cart || {},
      contact: { ...EMPTY_RFQ.contact, ...(parsed.contact || {}) },
    }
  } catch { return { ...EMPTY_RFQ, contact: { ...EMPTY_RFQ.contact } } }
}

export function saveRFQ(rfq) {
  try { localStorage.setItem(LS_RFQ, JSON.stringify(rfq)) } catch {}
}

export function clearRFQ() {
  try { localStorage.removeItem(LS_RFQ) } catch {}
}

export function rfqTotals(products, cart) {
  let lineCount = 0
  let unitCount = 0
  let wholesaleTotal = 0
  let msrpTotal = 0
  for (const p of products) {
    const qty = cart[p.id] || 0
    if (qty <= 0) continue
    lineCount += 1
    unitCount += qty
    if (p.wholesale) wholesaleTotal += qty * p.wholesale
    if (p.msrp && p.wholesale && p.msrp >= p.wholesale) msrpTotal += qty * p.msrp
  }
  return { lineCount, unitCount, wholesaleTotal, msrpTotal }
}

// Render structured address into multi-line block; falls back to legacy
// free-text if no structured fields are filled.
function formatAddress(c) {
  const hasStructured = c.street || c.city || c.state || c.zip
  if (hasStructured) {
    const lines = []
    if (c.street) lines.push(c.street)
    if (c.street2) lines.push(c.street2)
    const cityLine = [c.city, c.state, c.zip].filter(Boolean).join(', ').replace(', ' + (c.zip || ''), c.zip ? ' ' + c.zip : '')
    // Slightly cleaner approach: "City, ST 77002"
    const csz = c.city && c.state && c.zip ? `${c.city}, ${c.state} ${c.zip}`
              : [c.city, c.state, c.zip].filter(Boolean).join(' ')
    if (csz) lines.push(csz)
    return lines.join('\n')
  }
  return c.delivery || ''
}

function fmtMoney(n) {
  if (n == null) return 'TBD'
  return `$${n.toFixed(2)}`
}
function fmtMoneyPad(n, width) {
  return fmtMoney(n).padStart(width)
}

const LABEL_WIDTH = 22
function labeledLine(label, value) {
  const v = value == null || value === '' ? '—' : value
  return `${(label + ':').padEnd(LABEL_WIDTH)} ${v}`
}
function labeledBlock(label, value) {
  if (!value) return [labeledLine(label, '')]
  const lines = value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
  if (lines.length === 0) return [labeledLine(label, '')]
  const out = [labeledLine(label, lines[0])]
  const indent = ' '.repeat(LABEL_WIDTH + 1)
  for (let i = 1; i < lines.length; i++) out.push(indent + lines[i])
  return out
}

export function rfqAsText(products, rfq) {
  const lines = []
  const c = rfq.contact
  const SEP_HEAVY = '═'.repeat(70)
  const SEP_LIGHT = '─'.repeat(70)

  lines.push(SEP_HEAVY)
  lines.push('HERBAN BUD — REQUEST FOR QUOTE')
  lines.push(SEP_HEAVY)
  lines.push('')

  lines.push(labeledLine('Name', c.name))
  lines.push(labeledLine('Company', c.company))
  lines.push(labeledLine('Email', c.email))
  lines.push(labeledLine('Phone', c.phone))
  lines.push(...labeledBlock('Delivery address', formatAddress(c)))

  const paymentLabel =
    c.payment === 'cc'  ? 'Credit card (+4% fee)' :
    c.payment === 'ach' ? 'ACH / Wire (no fee)' : ''
  lines.push(labeledLine('Payment method', paymentLabel))
  lines.push('')

  if (c.notes && c.notes.trim()) {
    lines.push(SEP_LIGHT)
    lines.push('Notes from buyer:')
    for (const ln of c.notes.split(/\r?\n/)) {
      lines.push('  ' + ln)
    }
    lines.push('')
  }

  const QTY_W = 4
  const PROD_W = 44
  const SKU_W = 18
  const PRICE_W = 11

  lines.push(SEP_LIGHT)
  lines.push(
    'QTY'.padStart(QTY_W) + '  ' +
    'PRODUCT'.padEnd(PROD_W) + '  ' +
    'SKU'.padEnd(SKU_W) + '  ' +
    'PRICE'.padStart(PRICE_W),
  )
  lines.push(SEP_LIGHT)

  let total = 0
  let retail = 0
  for (const p of products) {
    const qty = rfq.cart[p.id] || 0
    if (qty <= 0) continue
    const hasPrice = p.wholesale != null
    const lineCost = hasPrice ? p.wholesale * qty : 0
    if (hasPrice) total += lineCost
    if (p.msrp && p.wholesale && p.msrp >= p.wholesale) retail += p.msrp * qty

    const prodCell = p.name.length > PROD_W
      ? p.name.slice(0, PROD_W - 1) + '…'
      : p.name.padEnd(PROD_W)
    const skuCell = (p.sku || '').padEnd(SKU_W)
    const priceCell = hasPrice ? fmtMoneyPad(lineCost, PRICE_W) : 'TBD'.padStart(PRICE_W)

    lines.push(
      String(qty).padStart(QTY_W) + '  ' +
      prodCell + '  ' +
      skuCell + '  ' +
      priceCell,
    )
  }
  lines.push(SEP_LIGHT)
  lines.push('')

  const TOTAL_VAL_W = 12
  const totalLine = (label, val) =>
    `${(label + ':').padEnd(LABEL_WIDTH)} ${val.padStart(TOTAL_VAL_W)}`
  lines.push(totalLine('Wholesale subtotal', fmtMoney(total)))
  if (c.payment === 'cc') {
    const fee = total * 0.04
    const grand = total + fee
    lines.push(totalLine('Credit card fee (4%)', fmtMoney(fee)))
    lines.push(totalLine('TOTAL DUE', fmtMoney(grand)))
  } else {
    lines.push(totalLine('TOTAL DUE', fmtMoney(total)))
  }
  if (retail > 0) {
    const baseGm = Math.round(((retail - total) / retail) * 100)
    lines.push(totalLine('Suggested retail value', fmtMoney(retail)))
    if (c.payment === 'cc') {
      const ccGm = Math.round(((retail - (total * 1.04)) / retail) * 100)
      lines.push(totalLine('Estimated gross margin', `${ccGm}%`))
    } else {
      lines.push(totalLine('Estimated gross margin', `${baseGm}%`))
    }
  }
  lines.push('')

  lines.push(SEP_LIGHT)
  lines.push('')
  lines.push('This is a request for quote, not an order. Requests are fielded')
  lines.push('at the product-style level — specific strains, cultivars, and')
  lines.push('hybrid/indica/sativa mixes are confirmed at fulfillment, subject')
  lines.push('to availability. Drew will follow up to finalize details.')
  lines.push('')
  lines.push(SEP_HEAVY)

  return lines.join('\n')
}
