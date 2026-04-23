// RFQ (Request For Quote) encoding/decoding.
//
// The cart + optional contact info serialize into URL params so any
// RFQ can be shared as a single link:
//   ?rfq=1:5,3:2,15:10&n=Drew&c=Drew+Co&e=drew@x.com&p=5551234&d=addr&o=notes
//
// rfq = product_id:qty comma-separated
// n=name, c=company, e=email, p=phone, d=delivery address, o=order notes

const LS_RFQ = 'herban.rfq.v1'

export const EMPTY_RFQ = {
  cart: {},       // { [productId]: qty }
  contact: {
    name: '',
    company: '',
    email: '',
    phone: '',
    delivery: '',
    payment: '',    // 'cc' | 'ach' — required to enable copy buttons
    notes: '',
  },
}

export function readRFQFromURL() {
  if (typeof window === 'undefined') return null
  const sp = new URLSearchParams(window.location.search)
  if (
    !sp.has('rfq') && !sp.has('n') && !sp.has('c') &&
    !sp.has('e') && !sp.has('p') && !sp.has('d') &&
    !sp.has('pm') && !sp.has('o')
  ) {
    return null
  }

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

  const { name, company, email, phone, delivery, payment, notes } = rfq.contact
  if (name)     sp.set('n', name)
  if (company)  sp.set('c', company)
  if (email)    sp.set('e', email)
  if (phone)    sp.set('p', phone)
  if (delivery) sp.set('d', delivery)
  if (payment)  sp.set('pm', payment)
  if (notes)    sp.set('o', notes)

  const qs = sp.toString()
  return qs ? `${base}?${qs}` : base
}

// RFQ persistence — so a buyer's in-progress cart survives a page reload
// even without a shareable link yet.
export function loadRFQ() {
  try {
    const raw = localStorage.getItem(LS_RFQ)
    if (!raw) return { ...EMPTY_RFQ, contact: { ...EMPTY_RFQ.contact } }
    const parsed = JSON.parse(raw)
    // Merge to ensure new fields exist if old localStorage data is loaded
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

// Count line items and compute totals from product list + cart.
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

// Plain-text RFQ for clipboard paste into Gmail / Messages / etc.
//
// Design choices:
//  - Every contact field is labeled, even if blank, so Drew can see at a glance
//    what info the buyer did/didn't provide. Empty fields render as "Label: —"
//  - Notes appear above the line items (sometimes notes change how to read
//    the order — e.g. "this is a top-up to last week's PO #1234")
//  - Line items columns: QTY | PRODUCT | SKU | PRICE
//  - Multi-line delivery address indents continuation lines under the label
//  - Money columns right-align with $ sign attached to digits, not the column
function fmtMoney(n) {
  if (n == null) return 'TBD'
  return `$${n.toFixed(2)}`
}

function fmtMoneyPad(n, width) {
  return fmtMoney(n).padStart(width)
}

// "Label:    value" — value column starts at fixed indent for alignment.
const LABEL_WIDTH = 22  // "Estimated gross margin" = 22 chars
function labeledLine(label, value) {
  const v = value == null || value === '' ? '—' : value
  return `${(label + ':').padEnd(LABEL_WIDTH)} ${v}`
}

// Multi-line value — first line gets the label, continuation lines indent
// to align under the value column.
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
  const { name, company, email, phone, delivery, payment, notes } = rfq.contact
  const SEP_HEAVY = '═'.repeat(70)
  const SEP_LIGHT = '─'.repeat(70)

  lines.push(SEP_HEAVY)
  lines.push('HERBAN BUD — REQUEST FOR QUOTE')
  lines.push(SEP_HEAVY)
  lines.push('')

  // Contact block — every field labeled, blanks shown as "—"
  lines.push(labeledLine('Name', name))
  lines.push(labeledLine('Company', company))
  lines.push(labeledLine('Email', email))
  lines.push(labeledLine('Phone', phone))
  lines.push(...labeledBlock('Delivery address', delivery))

  // Payment is required to enable copy buttons, so it'll always be set when
  // this output is generated. But still defend against it being blank.
  const paymentLabel =
    payment === 'cc'  ? 'Credit card (+4% fee)' :
    payment === 'ach' ? 'ACH / Wire (no fee)' :
    ''
  lines.push(labeledLine('Payment method', paymentLabel))
  lines.push('')

  // Notes appear here, above line items, when present
  if (notes && notes.trim()) {
    lines.push(SEP_LIGHT)
    lines.push('Notes from buyer:')
    for (const ln of notes.split(/\r?\n/)) {
      lines.push('  ' + ln)
    }
    lines.push('')
  }

  // Line items — QTY | PRODUCT | SKU | PRICE
  // Column widths chosen so output stays readable when pasted into a
  // monospace context (Gmail's "Plain text mode", SMS, terminal).
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

    // Truncate product name only if it overflows — leaves visible signal
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

  // Totals — labels left-aligned, money right-aligned in a fixed column
  // for clean visual scan.
  const TOTAL_VAL_W = 12
  const totalLine = (label, val) =>
    `${(label + ':').padEnd(LABEL_WIDTH)} ${val.padStart(TOTAL_VAL_W)}`
  lines.push(totalLine('Wholesale subtotal', fmtMoney(total)))
  if (payment === 'cc') {
    const fee = total * 0.04
    const grand = total + fee
    lines.push(totalLine('Credit card fee (4%)', fmtMoney(fee)))
    lines.push(totalLine('TOTAL DUE', fmtMoney(grand)))
  } else {
    lines.push(totalLine('TOTAL DUE', fmtMoney(total)))
  }
  if (retail > 0) {
    const gm = Math.round(((retail - total) / retail) * 100)
    lines.push(totalLine('Suggested retail value', fmtMoney(retail)))
    lines.push(totalLine('Estimated gross margin', `${gm}%`))
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
