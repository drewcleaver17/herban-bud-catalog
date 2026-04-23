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

// Strip the "{Brand} — " prefix and leading tier word from product names.
// In the new text format, Brand and Tier have their own columns, so the
// product cell only needs the actual product description.
function shortName(p) {
  let n = p.name || ''
  const prefix = `${p.brand} — `
  if (n.startsWith(prefix)) n = n.slice(prefix.length)
  if (p.tier) {
    const re = new RegExp(`^${p.tier}\\s+`, 'i')
    n = n.replace(re, '')
  }
  return n
}

// Generate a stable, semi-unique RFQ ID for archival/reference.
// Format: RFQ-YYYYMMDD-HHMM-XXXX where XXXX is a 4-char hash of the cart+contact
// payload. Same RFQ generates same ID within a minute, so a buyer reloading the
// link doesn't get a new ID. Different RFQs (different items, different person)
// get distinct IDs even at the same minute.
function rfqId(rfq, now = new Date()) {
  const yyyy = now.getUTCFullYear()
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(now.getUTCDate()).padStart(2, '0')
  const hh = String(now.getUTCHours()).padStart(2, '0')
  const min = String(now.getUTCMinutes()).padStart(2, '0')
  // Tiny non-cryptographic hash (djb2) of the payload, base-36 truncated.
  // Good enough to disambiguate parallel RFQs within the same minute.
  const payload = JSON.stringify({ cart: rfq.cart, c: rfq.contact })
  let h = 5381
  for (let i = 0; i < payload.length; i++) {
    h = ((h * 33) ^ payload.charCodeAt(i)) >>> 0
  }
  const hash = h.toString(36).toUpperCase().padStart(4, '0').slice(-4)
  return `RFQ-${yyyy}${mm}${dd}-${hh}${min}-${hash}`
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

export function rfqAsText(products, rfq, options = {}) {
  const lines = []
  const c = rfq.contact
  const now = options.now || new Date()
  const id = rfqId(rfq, now)

  // Width: ~118 chars total. Wide enough for the 7-column line item table,
  // narrow enough to render readably in a desktop email composer.
  const WIDTH = 118
  const SEP_HEAVY = '═'.repeat(WIDTH)
  const SEP_LIGHT = '─'.repeat(WIDTH)

  // Pre-compute totals so they can appear in the suggested subject line.
  let total = 0
  let retail = 0
  let lineCount = 0
  let unitCount = 0
  for (const p of products) {
    const qty = rfq.cart[p.id] || 0
    if (qty <= 0) continue
    lineCount += 1
    unitCount += qty
    if (p.wholesale != null) total += p.wholesale * qty
    if (p.msrp && p.wholesale && p.msrp >= p.wholesale) retail += p.msrp * qty
  }
  const totalDue = c.payment === 'cc' ? total * 1.04 : total
  const paymentTag = c.payment === 'cc' ? 'CC' : c.payment === 'ach' ? 'ACH' : '?'
  const buyerLabel = c.company || c.name || '(no name given)'
  const subjectSuggestion = `RFQ — ${buyerLabel} — ${lineCount} ${lineCount === 1 ? 'line' : 'lines'} / ${unitCount} units / ${fmtMoney(totalDue)} (${paymentTag})`

  // ─── HEADER ───
  lines.push(SEP_HEAVY)
  lines.push('HERBAN BUD — REQUEST FOR QUOTE')
  lines.push(SEP_HEAVY)
  // Identifier metadata for archival + email subject suggestion
  lines.push(labeledLine('RFQ ID', id))
  lines.push(labeledLine('Submitted', formatTimestamp(now)))
  lines.push(labeledLine('Suggested subject', subjectSuggestion))
  lines.push('')

  // ─── CONTACT BLOCK (single column, same as before) ───
  lines.push(SEP_LIGHT)
  lines.push('CONTACT')
  lines.push(SEP_LIGHT)
  lines.push(labeledLine('Name', c.name))
  lines.push(labeledLine('Company', c.company))
  lines.push(labeledLine('Email', c.email))
  lines.push(labeledLine('Phone', c.phone))
  lines.push(...labeledBlock('Delivery address', formatAddress(c)))

  const paymentLabel =
    c.payment === 'cc'  ? 'Credit card (+4% fee)' :
    c.payment === 'ach' ? 'ACH / Wire (no fee)' : '—'
  lines.push(labeledLine('Payment method', paymentLabel))
  lines.push('')

  // ─── NOTES ───
  lines.push(SEP_LIGHT)
  lines.push('NOTES FROM BUYER')
  lines.push(SEP_LIGHT)
  if (c.notes && c.notes.trim()) {
    for (const ln of c.notes.split(/\r?\n/)) {
      lines.push('  ' + ln)
    }
  } else {
    lines.push('  (none)')
  }
  lines.push('')

  // ─── LINE ITEMS — 7 columns mirroring the on-screen RFQ ───
  // Column widths chosen to fit ~118 chars total. Order matches the screen:
  // Category | Brand | Product | Tier | SKU | Qty | Wholesale | MSRP | GM% | Line
  // (10 visual columns, but Wholesale/MSRP/GM%/Line are tight numerics so they
  //  share the right side compactly.)
  const W = {
    cat:    11,  // PRE-ROLLS, FLOWER, EDIBLES, Concentrate, VAPES
    brand:  14,  // CaliGreenGold = 13 chars
    prod:   34,  // truncated with … if longer
    tier:   9,   // SNOWCAPS = 8
    sku:    23,  // longest is GRV-FLW-COR-3.5G-MYL = 20; pad to 23
    qty:    4,
    whole:  9,
    msrp:   9,
    gm:     5,
    line:   10,
  }

  const headerCells = [
    'CATEGORY'.padEnd(W.cat),
    'BRAND'.padEnd(W.brand),
    'PRODUCT'.padEnd(W.prod),
    'TIER'.padEnd(W.tier),
    'SKU'.padEnd(W.sku),
    'QTY'.padStart(W.qty),
    'WHOLESALE'.padStart(W.whole),
    'MSRP'.padStart(W.msrp),
    'GM%'.padStart(W.gm),
    'LINE'.padStart(W.line),
  ]
  lines.push(SEP_LIGHT)
  lines.push('LINE ITEMS')
  lines.push(SEP_LIGHT)
  lines.push(headerCells.join(' '))
  lines.push(SEP_LIGHT)

  for (const p of products) {
    const qty = rfq.cart[p.id] || 0
    if (qty <= 0) continue
    const hasPrice = p.wholesale != null
    const lineCost = hasPrice ? p.wholesale * qty : 0
    const effectiveMsrp = p.msrp
    // GM% on a per-line basis at MSRP
    let gmStr = '—'
    if (hasPrice && effectiveMsrp && effectiveMsrp >= p.wholesale) {
      const gm = Math.round(((effectiveMsrp - p.wholesale) / effectiveMsrp) * 100)
      gmStr = `${gm}%`
    }

    const prodText = shortName(p)
    const prodCell = prodText.length > W.prod
      ? prodText.slice(0, W.prod - 1) + '…'
      : prodText.padEnd(W.prod)

    const cells = [
      (p.category || '').toUpperCase().padEnd(W.cat),
      (p.brand || '').padEnd(W.brand),
      prodCell,
      (p.tier || '').toUpperCase().padEnd(W.tier),
      (p.sku || '').padEnd(W.sku),
      String(qty).padStart(W.qty),
      (hasPrice ? fmtMoney(p.wholesale) : '—').padStart(W.whole),
      (effectiveMsrp != null ? fmtMoney(effectiveMsrp) : '—').padStart(W.msrp),
      gmStr.padStart(W.gm),
      (hasPrice ? fmtMoney(lineCost) : 'TBD').padStart(W.line),
    ]
    lines.push(cells.join(' '))
  }
  lines.push(SEP_LIGHT)
  lines.push('')

  // ─── TOTALS ───
  lines.push(SEP_LIGHT)
  lines.push('TOTALS')
  lines.push(SEP_LIGHT)
  // Wider value column so "62% (+2 pts)" doesn't get awkwardly squeezed
  const TOTAL_VAL_W = 16
  const totalLine = (label, val) =>
    `${(label + ':').padEnd(LABEL_WIDTH)} ${val.padStart(TOTAL_VAL_W)}`
  lines.push(totalLine('Wholesale subtotal', fmtMoney(total)))
  if (c.payment === 'cc') {
    const fee = total * 0.04
    lines.push(totalLine('Credit card fee (4%)', fmtMoney(fee)))
  }
  lines.push(totalLine('TOTAL DUE', fmtMoney(totalDue)))
  if (retail > 0) {
    lines.push('')
    lines.push(totalLine('Suggested retail value', fmtMoney(retail)))
    if (c.payment === 'cc') {
      const ccGm = Math.round(((retail - (total * 1.04)) / retail) * 100)
      const achGm = Math.round(((retail - total) / retail) * 100)
      lines.push(totalLine('Estimated gross margin', `${ccGm}% (CC)`))
      lines.push(totalLine('GM% if ACH/Wire', `${achGm}% (+${achGm - ccGm} pts)`))
    } else {
      const baseGm = Math.round(((retail - total) / retail) * 100)
      lines.push(totalLine('Estimated gross margin', `${baseGm}%`))
    }
  }
  lines.push('')

  // ─── DISCLAIMER ───
  lines.push(SEP_LIGHT)
  lines.push('This is a request for quote, not an order. Strains/cultivars/mixes')
  lines.push('confirmed at fulfillment, subject to availability.')
  lines.push(SEP_HEAVY)

  return lines.join('\n')
}

// ISO-ish timestamp in a humans-can-read format: "2026-04-22 19:37 UTC"
function formatTimestamp(d) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`
}
