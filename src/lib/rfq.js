// RFQ (Request For Quote) encoding/decoding.
//
// The cart + optional contact info serialize into URL params so any
// RFQ can be shared as a single link:
//   ?rfq=1:5,3:2,15:10&n=Drew&c=Drew+Co&e=drew@x.com&p=5551234&o=notes
//
// rfq = product_id:qty comma-separated
// n=name, c=company, e=email, p=phone, o=order notes

const LS_RFQ = 'herban.rfq.v1'

export const EMPTY_RFQ = {
  cart: {},       // { [productId]: qty }
  contact: {
    name: '',
    company: '',
    email: '',
    phone: '',
    notes: '',
  },
}

export function readRFQFromURL() {
  if (typeof window === 'undefined') return null
  const sp = new URLSearchParams(window.location.search)
  if (!sp.has('rfq') && !sp.has('n') && !sp.has('c') && !sp.has('e') && !sp.has('p')) {
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
      name:    sp.get('n') || '',
      company: sp.get('c') || '',
      email:   sp.get('e') || '',
      phone:   sp.get('p') || '',
      notes:   sp.get('o') || '',
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

  const { name, company, email, phone, notes } = rfq.contact
  if (name)    sp.set('n', name)
  if (company) sp.set('c', company)
  if (email)   sp.set('e', email)
  if (phone)   sp.set('p', phone)
  if (notes)   sp.set('o', notes)

  const qs = sp.toString()
  return qs ? `${base}?${qs}` : base
}

// RFQ persistence — so a buyer's in-progress cart survives a page reload
// even without a shareable link yet.
export function loadRFQ() {
  try {
    const raw = localStorage.getItem(LS_RFQ)
    return raw ? JSON.parse(raw) : { ...EMPTY_RFQ }
  } catch { return { ...EMPTY_RFQ } }
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
    if (p.msrp && p.msrp >= p.wholesale) msrpTotal += qty * p.msrp
  }

  return { lineCount, unitCount, wholesaleTotal, msrpTotal }
}

// Plain-text RFQ (for mailto, SMS, or clipboard copy).
export function rfqAsText(products, rfq) {
  const lines = []
  const { name, company, email, phone, notes } = rfq.contact

  if (company || name) {
    lines.push(`RFQ — ${company || ''}${company && name ? ' / ' : ''}${name || ''}`.trim())
  } else {
    lines.push('Request for Quote')
  }
  if (email || phone) {
    lines.push([email, phone].filter(Boolean).join(' · '))
  }
  lines.push('')
  lines.push(`${'SKU'.padEnd(22)} ${'QTY'.padStart(4)}  ${'COST'.padStart(8)}  PRODUCT`)
  lines.push('-'.repeat(70))

  let total = 0
  let retail = 0
  for (const p of products) {
    const qty = rfq.cart[p.id] || 0
    if (qty <= 0) continue
    const lineCost = (p.wholesale || 0) * qty
    total += lineCost
    if (p.msrp && p.msrp >= p.wholesale) retail += p.msrp * qty
    lines.push(
      `${p.sku.padEnd(22)} ${String(qty).padStart(4)}  $${lineCost.toFixed(2).padStart(7)}  ${p.name}`,
    )
  }
  lines.push('-'.repeat(70))
  lines.push(`WHOLESALE TOTAL:         $${total.toFixed(2)}`)
  if (retail > 0) {
    const gm = Math.round(((retail - total) / retail) * 100)
    lines.push(`RETAIL VALUE:            $${retail.toFixed(2)}`)
    lines.push(`ESTIMATED GROSS MARGIN:  ${gm}%`)
  }
  lines.push('')
  lines.push('Request for quote, not an order. Product styles only —')
  lines.push('specific strains confirmed at fulfillment, subject to availability.')
  if (notes) {
    lines.push('')
    lines.push(`Notes: ${notes}`)
  }
  return lines.join('\n')
}
