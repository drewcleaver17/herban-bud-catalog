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

// Render "Label: value" pairs. In proportional fonts, padding labels with
// spaces just makes inconsistent visual gaps. Instead we use a single space
// after the colon — looks normal in any font, recipient sees clean K/V.
function labeledLine(label, value) {
  const v = value == null || value === '' ? '—' : value
  return `${label}: ${v}`
}
function labeledBlock(label, value) {
  if (!value) return [labeledLine(label, '')]
  const lines = value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
  if (lines.length === 0) return [labeledLine(label, '')]
  const out = [labeledLine(label, lines[0])]
  // Continuation lines: indent slightly so they read as "still part of address"
  for (let i = 1; i < lines.length; i++) out.push(`  ${lines[i]}`)
  return out
}

export function rfqAsText(products, rfq, options = {}) {
  const lines = []
  const c = rfq.contact
  const now = options.now || new Date()

  // Pre-compute totals so they can appear in the suggested subject line.
  // MSRP/retail/GM% are aggregated only — never per-line — and shown at the
  // bottom as an order-level "score" the buyer's team can reference internally.
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

  // Section header: short line, name, short line. Reads as a clean break
  // in any font without over-relying on monospace alignment.
  const sectionHeader = (title) => {
    lines.push('')
    lines.push(`━━━ ${title} ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  }

  // ─── HEADER ───
  lines.push('═══════════════════════════════════════════════════════════════════')
  lines.push('  HERBAN BUD — REQUEST FOR QUOTE')
  lines.push('═══════════════════════════════════════════════════════════════════')
  lines.push('')
  lines.push(labeledLine('Submitted', formatTimestamp(now)))
  lines.push(labeledLine('Suggested subject', subjectSuggestion))

  // ─── CONTACT BLOCK ───
  sectionHeader('CONTACT')
  lines.push(labeledLine('Name', c.name))
  lines.push(labeledLine('Company', c.company))
  lines.push(labeledLine('Email', c.email))
  lines.push(labeledLine('Phone', c.phone))
  lines.push(...labeledBlock('Delivery address', formatAddress(c)))

  const paymentLabel =
    c.payment === 'cc'  ? 'Credit card (+4% fee)' :
    c.payment === 'ach' ? 'ACH / Wire (no fee)' : '—'
  lines.push(labeledLine('Payment method', paymentLabel))

  // ─── NOTES ───
  sectionHeader('NOTES FROM BUYER')
  if (c.notes && c.notes.trim()) {
    for (const ln of c.notes.split(/\r?\n/)) {
      lines.push('  ' + ln)
    }
  } else {
    lines.push('  (none)')
  }

  // ─── LINE ITEMS — Option A: 3-line stack per item ───
  // Layout per item:
  //   ITEM N
  //   {qty} × {SKU} — ${wholesale_unit} ea — Line ${line_total}
  //   {Brand} · {Tier} · {ProductDesc}, {size} · [{CATEGORY}]
  //
  // Designed for the customer's outbound RFQ email to Drew. Strips MSRP and
  // GM% — those are the buyer's internal margin math, not data that belongs
  // in their quote-request to the supplier.
  sectionHeader('LINE ITEMS')

  let itemNum = 0
  for (const p of products) {
    const qty = rfq.cart[p.id] || 0
    if (qty <= 0) continue
    itemNum += 1
    const hasPrice = p.wholesale != null
    const lineCost = hasPrice ? p.wholesale * qty : 0

    // Line 1: item label
    lines.push(`ITEM ${itemNum}`)

    // Line 2: commercial primaries — qty leftmost, then SKU, then unit price
    // and line total. This is the "what am I ordering and what does it cost"
    // line. Format chosen to read naturally as "Quantity × SKU at price".
    if (hasPrice) {
      lines.push(`${qty} × ${p.sku} — ${fmtMoney(p.wholesale)} ea — Line ${fmtMoney(lineCost)}`)
    } else {
      lines.push(`${qty} × ${p.sku} — Pricing TBD`)
    }

    // Line 3: human-readable description. [CATEGORY] · Brand · Tier · ProductDesc
    // Category goes leftmost — matches how warehouses physically segment
    // inventory and how buyers think about ordering ("show me your flowers").
    // Using shortName() to avoid duplicating "Dope Pros — " since brand is
    // already its own segment in this line.
    const descParts = [`[${(p.category || '').toUpperCase()}]`, p.brand]
    if (p.tier) descParts.push(p.tier)
    descParts.push(shortName(p))
    lines.push(descParts.join(' · '))

    // Per-line product notes (e.g. flavor lists, warnings) get their own
    // indented continuation so the buyer's intent passes through unchanged.
    if (p.notes && p.notes.trim() &&
        !p.notes.toUpperCase().includes('DISCONTINUED') &&
        !p.notes.toUpperCase().includes('NOT AVAILABLE')) {
      lines.push(`Notes: ${p.notes}`)
    }
    lines.push('')
  }
  // Trim trailing blank line before the totals section
  if (lines[lines.length - 1] === '') lines.pop()

  // ─── TOTALS ───
  // Wholesale + payment math up top. Then aggregated retail value + gross
  // margin as an order-level "score" the buyer's team can reference when
  // forwarding the quote internally for approval. Per-line MSRP/GM% is
  // intentionally NOT shown — that level of detail is buyer-internal.
  // Showing the GM-impact-of-CC vs GM-if-ACH framing makes the 4% credit
  // card fee feel trivial in margin terms (~2 pts), nudging buyers toward
  // ACH without being preachy.
  sectionHeader('TOTALS')
  lines.push(labeledLine('Wholesale subtotal', fmtMoney(total)))
  if (c.payment === 'cc') {
    const fee = total * 0.04
    lines.push(labeledLine('Credit card fee (4%)', fmtMoney(fee)))
  }
  lines.push(labeledLine('TOTAL DUE', fmtMoney(totalDue)))

  if (retail > 0) {
    lines.push('')
    lines.push(labeledLine('Suggested retail value', fmtMoney(retail)))
    if (c.payment === 'cc') {
      const ccGm = Math.round(((retail - (total * 1.04)) / retail) * 100)
      const achGm = Math.round(((retail - total) / retail) * 100)
      const ptsSaved = achGm - ccGm
      lines.push(labeledLine('Estimated gross margin', `${ccGm}% (CC, after 4% fee)`))
      lines.push(labeledLine('Gross margin if ACH', `${achGm}% (+${ptsSaved} pts saved)`))
    } else {
      const baseGm = Math.round(((retail - total) / retail) * 100)
      lines.push(labeledLine('Estimated gross margin', `${baseGm}%`))
    }
  }

  // ─── DISCLAIMER ───
  lines.push('')
  lines.push('—')
  lines.push('This is a request for quote, not an order. Strains/cultivars/mixes')
  lines.push('confirmed at fulfillment, subject to availability.')
  lines.push('═══════════════════════════════════════════════════════════════════')

  return lines.join('\n')
}

// ISO-ish timestamp in a humans-can-read format: "2026-04-22 19:37 UTC"
function formatTimestamp(d) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`
}
