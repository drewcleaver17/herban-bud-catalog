import { useEffect, useMemo, useState } from 'react'
import { formatMoney, formatPercent, gmPercentAt } from '../lib/pricing'
import { buildRFQURL, isValidPhone, rfqAsText, rfqTotals } from '../lib/rfq'
import { TIER_STYLES, STRAIN_STYLES } from '../lib/categories'

// US state list for the address dropdown — short codes only.
const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC','PR',
]

// Mirror the catalog table's category accent colors so the RFQ cart reads
// as a continuation of the same visual language.
const CATEGORY_COLORS = {
  'Pre-Rolls':   'text-[#CDB4DB]',
  'FLOWER':      'text-[#9FD8A5]',
  'EDIBLES':     'text-[#F6BD60]',
  'Concentrate': 'text-[#F28482]',
  'VAPES':       'text-[#E8B86B]',
}

// Strip the "{Brand} — " prefix and leading tier word from product names
// for the dense column view (Brand & Tier already have their own columns).
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

function TierBadge({ tier }) {
  if (!tier) return null
  const s = TIER_STYLES[tier]
  if (!s) return null
  return (
    <span className={`inline-block px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-sm border ${s.text} ${s.bg} ${s.border}`}>
      {s.label}
    </span>
  )
}

function StrainBadge({ strain }) {
  if (!strain) return <span className="text-paper/20 text-xs">—</span>
  const key = String(strain).toLowerCase()
  const s = STRAIN_STYLES[key]
  if (!s) return <span className="text-paper/60 text-2xs">{strain}</span>
  return (
    <span className={`inline-block px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-sm border ${s.text} ${s.bg} ${s.border}`}>
      {s.label}
    </span>
  )
}

export default function RFQDrawer({
  open,
  onClose,
  products,
  rfq,
  setQty,
  updateContact,
  onClearRFQ,
  buyerPrices,
}) {
  const totals = useMemo(() => rfqTotals(products, rfq.cart), [products, rfq.cart])
  const [copied, setCopied] = useState(null)

  const cartLines = useMemo(() => {
    const list = []
    for (const p of products) {
      const qty = rfq.cart[p.id] || 0
      if (qty <= 0) continue
      const effectiveMSRP = buyerPrices?.[p.id] ?? p.msrp
      const gmPct = gmPercentAt(p.wholesale, effectiveMSRP)
      list.push({
        p, qty, effectiveMSRP, gmPct,
        lineTotal: (p.wholesale || 0) * qty,
      })
    }
    return list
  }, [products, rfq.cart, buyerPrices])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const copyLink = async () => {
    const url = buildRFQURL(rfq)
    try {
      await navigator.clipboard.writeText(url)
      setCopied('link'); setTimeout(() => setCopied(null), 1400)
    } catch { prompt('Copy this link:', url) }
  }
  const copyText = async () => {
    const txt = rfqAsText(products, rfq)
    try {
      await navigator.clipboard.writeText(txt)
      setCopied('text'); setTimeout(() => setCopied(null), 1400)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0'
      document.body.appendChild(ta); ta.select()
      try { document.execCommand('copy') } catch {}
      ta.remove()
      setCopied('text'); setTimeout(() => setCopied(null), 1400)
    }
  }

  if (!open) return null

  // Validation: phone must be valid US 10+ digit number to enable copy.
  const phoneValid = isValidPhone(rfq.contact.phone)
  const hasPhone = rfq.contact.phone.trim().length > 0
  const ready = cartLines.length > 0 && !!rfq.contact.payment && phoneValid
  const blockedReason =
    cartLines.length === 0   ? 'Add at least one product' :
    !rfq.contact.payment      ? 'Select a payment method' :
    !hasPhone                 ? 'Enter a phone number (required)' :
    !phoneValid               ? 'Phone must contain at least 10 digits' :
    ''

  // Margin math
  const ccFee = totals.wholesaleTotal * 0.04
  const totalDueACH = totals.wholesaleTotal
  const totalDueCC = totals.wholesaleTotal + ccFee
  const gmACH = totals.msrpTotal > 0
    ? Math.round(((totals.msrpTotal - totalDueACH) / totals.msrpTotal) * 100)
    : null
  const gmCC = totals.msrpTotal > 0
    ? Math.round(((totals.msrpTotal - totalDueCC) / totals.msrpTotal) * 100)
    : null
  const marginPointsLost = (gmACH != null && gmCC != null) ? gmACH - gmCC : null
  const isCC  = rfq.contact.payment === 'cc'
  const isACH = rfq.contact.payment === 'ach'

  // Phone styling — red border when entered but invalid
  const phoneError = hasPhone && !phoneValid

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-indigo-950/60 backdrop-blur-sm" onClick={onClose} />

      <aside className="w-full max-w-3xl lg:max-w-[calc(100vw-16rem)] bg-indigo-900 border-l border-paper/10 flex flex-col h-full shadow-2xl">

        {/* HEADER */}
        <div className="px-5 py-2.5 border-b border-paper/10 flex items-center gap-3 shrink-0">
          <h2 className="font-display text-xl text-paper">Your RFQ</h2>
          <span className="font-mono text-2xs text-paper/50">
            {totals.lineCount} {totals.lineCount === 1 ? 'line' : 'lines'} · {totals.unitCount} units
          </span>
          <button onClick={onClose} className="ml-auto px-2 py-1 text-paper/60 hover:text-paper text-sm" aria-label="Close">✕</button>
        </div>

        {cartLines.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <p className="font-display text-lg text-paper/60 mb-2">No items yet.</p>
            <p className="text-2xs font-mono text-paper/40 uppercase tracking-wider max-w-xs">
              Add quantities to rows in the catalog to start building your quote request.
            </p>
          </div>
        ) : (
          <>
            {/* SCROLLABLE CART */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-indigo-900 z-10">
                  <tr className="text-paper/50 font-mono text-2xs uppercase tracking-wider border-b border-paper/10">
                    <th className="px-3 py-1.5 text-left w-24">Category</th>
                    <th className="px-3 py-1.5 text-left w-24">Brand</th>
                    <th className="px-3 py-1.5 text-left">Product</th>
                    <th className="px-3 py-1.5 text-left w-20">Tier</th>
                    <th className="px-3 py-1.5 text-left w-20">Strain</th>
                    <th className="px-3 py-1.5 text-left w-44">SKU</th>
                    <th className="px-3 py-1.5 text-right w-14">Qty</th>
                    <th className="px-3 py-1.5 text-right w-20">Wholesale</th>
                    <th className="px-3 py-1.5 text-right w-20">MSRP</th>
                    <th className="px-3 py-1.5 text-right w-14">GM%</th>
                    <th className="px-3 py-1.5 text-right w-20">Line</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {cartLines.map(({ p, qty, effectiveMSRP, gmPct, lineTotal }) => {
                    const catColor = CATEGORY_COLORS[p.category] || 'text-paper/70'
                    return (
                      <tr key={p.id} className="border-b border-paper/5 hover:bg-paper/[0.02]">
                        <td className={`px-3 py-1.5 text-2xs font-mono uppercase tracking-wider ${catColor}`}>
                          {p.category}
                        </td>
                        <td className="px-3 py-1.5 text-xs font-medium text-paper">{p.brand}</td>
                        <td className="px-3 py-1.5 text-sm text-paper">
                          {shortName(p)}
                          {p.notes && !p.notes.toUpperCase().includes('DISCONTINUED') && !p.notes.toUpperCase().includes('NOT AVAILABLE') && (
                            <span className="block text-[10px] text-paper/40 font-mono mt-0.5">{p.notes}</span>
                          )}
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap"><TierBadge tier={p.tier} /></td>
                        <td className="px-3 py-1.5 whitespace-nowrap"><StrainBadge strain={p.strain} /></td>
                        <td className="px-3 py-1.5 font-mono text-[11px] text-paper/80 whitespace-nowrap">{p.sku}</td>
                        <td className="px-3 py-1.5 text-right">
                          <input
                            type="number" min="0" value={qty}
                            onChange={(e) => setQty(p.id, e.target.value === '' ? 0 : Number(e.target.value))}
                            className="w-12 bg-indigo-950/40 border border-paper/15 rounded-sm px-1.5 py-0.5 text-right text-xs font-mono num text-paper focus:border-accent-warm focus:outline-none"
                            aria-label={`Quantity for ${p.sku}`}
                          />
                        </td>
                        <td className="px-3 py-1.5 text-right text-xs font-mono num text-paper whitespace-nowrap">{formatMoney(p.wholesale)}</td>
                        <td className="px-3 py-1.5 text-right text-xs font-mono num text-paper/70 whitespace-nowrap">{formatMoney(effectiveMSRP)}</td>
                        <td className={`px-3 py-1.5 text-right text-xs font-mono num whitespace-nowrap ${
                          gmPct == null ? 'text-paper/30'
                          : gmPct >= 0.5 ? 'text-accent-green'
                          : gmPct >= 0.3 ? 'text-paper/70'
                          : 'text-accent-red/80'
                        }`}>{gmPct == null ? '—' : formatPercent(gmPct, 0)}</td>
                        <td className="px-3 py-1.5 text-right text-xs font-mono num text-paper whitespace-nowrap">{p.wholesale != null ? formatMoney(lineTotal) : 'TBD'}</td>
                        <td className="px-3 py-1.5">
                          <button onClick={() => setQty(p.id, 0)} className="text-paper/40 hover:text-accent-red text-xs" aria-label={`Remove ${p.sku}`} title="Remove from RFQ">✕</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* ─── FIXED FOOTER — 3-column grid (Contact | Logistics | Payment+Totals) ─── */}
            <div className="border-t border-paper/10 shrink-0 grid grid-cols-1 lg:grid-cols-3 gap-px bg-paper/10">

              {/* COL 1 — Contact essentials */}
              <div className="px-3 py-2 bg-indigo-950/30">
                <div className="font-mono text-2xs uppercase tracking-wider text-paper/40 mb-1.5">
                  Contact
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    placeholder="Name"
                    value={rfq.contact.name}
                    onChange={(e) => updateContact('name', e.target.value)}
                    className="bg-indigo-950/60 border border-paper/15 rounded-sm px-2 py-1 text-xs text-paper focus:border-accent-warm focus:outline-none"
                  />
                  <input
                    placeholder="Company"
                    value={rfq.contact.company}
                    onChange={(e) => updateContact('company', e.target.value)}
                    className="bg-indigo-950/60 border border-paper/15 rounded-sm px-2 py-1 text-xs text-paper focus:border-accent-warm focus:outline-none"
                  />
                  <input
                    type="email" placeholder="Email"
                    value={rfq.contact.email}
                    onChange={(e) => updateContact('email', e.target.value)}
                    className="bg-indigo-950/60 border border-paper/15 rounded-sm px-2 py-1 text-xs text-paper focus:border-accent-warm focus:outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="Phone (required)"
                    value={rfq.contact.phone}
                    onChange={(e) => updateContact('phone', e.target.value)}
                    className={`bg-indigo-950/60 border rounded-sm px-2 py-1 text-xs text-paper focus:outline-none ${
                      phoneError
                        ? 'border-accent-red/60 focus:border-accent-red'
                        : 'border-paper/15 focus:border-accent-warm'
                    }`}
                    title={phoneError ? 'Phone must contain at least 10 digits' : 'Required for RFQ submission'}
                  />
                </div>
                {phoneError && (
                  <div className="text-[10px] text-accent-red/80 font-mono mt-1">
                    Phone needs 10+ digits
                  </div>
                )}
              </div>

              {/* COL 2 — Logistics: structured FedEx-style address + notes */}
              <div className="px-3 py-2 bg-indigo-950/30">
                <div className="font-mono text-2xs uppercase tracking-wider text-paper/40 mb-1.5">
                  Delivery address
                </div>
                <div className="space-y-1.5">
                  {/* Street + Suite on one row */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <input
                      placeholder="Street address"
                      value={rfq.contact.street}
                      onChange={(e) => updateContact('street', e.target.value)}
                      className="col-span-2 bg-indigo-950/60 border border-paper/15 rounded-sm px-2 py-1 text-xs text-paper focus:border-accent-warm focus:outline-none"
                    />
                    <input
                      placeholder="Apt/Suite"
                      value={rfq.contact.street2}
                      onChange={(e) => updateContact('street2', e.target.value)}
                      className="bg-indigo-950/60 border border-paper/15 rounded-sm px-2 py-1 text-xs text-paper focus:border-accent-warm focus:outline-none"
                    />
                  </div>
                  {/* City | State | ZIP */}
                  <div className="grid grid-cols-6 gap-1.5">
                    <input
                      placeholder="City"
                      value={rfq.contact.city}
                      onChange={(e) => updateContact('city', e.target.value)}
                      className="col-span-3 bg-indigo-950/60 border border-paper/15 rounded-sm px-2 py-1 text-xs text-paper focus:border-accent-warm focus:outline-none"
                    />
                    <select
                      value={rfq.contact.state}
                      onChange={(e) => updateContact('state', e.target.value)}
                      className="col-span-1 bg-indigo-950/60 border border-paper/15 rounded-sm px-1 py-1 text-xs text-paper focus:border-accent-warm focus:outline-none"
                    >
                      <option value="">ST</option>
                      {US_STATES.map((s) => (<option key={s} value={s}>{s}</option>))}
                    </select>
                    <input
                      placeholder="ZIP"
                      value={rfq.contact.zip}
                      onChange={(e) => updateContact('zip', e.target.value)}
                      maxLength={10}
                      className="col-span-2 bg-indigo-950/60 border border-paper/15 rounded-sm px-2 py-1 text-xs text-paper focus:border-accent-warm focus:outline-none"
                    />
                  </div>
                  {/* Notes textarea */}
                  <textarea
                    placeholder="Notes (timing, mix preferences, etc.)"
                    value={rfq.contact.notes}
                    onChange={(e) => updateContact('notes', e.target.value)}
                    rows={2}
                    className="w-full bg-indigo-950/60 border border-paper/15 rounded-sm px-2 py-1 text-xs text-paper focus:border-accent-warm focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* COL 3 — Payment + Totals (fixed height regardless of selection) */}
              <div className="px-3 py-2 bg-indigo-950/40">
                <div className="font-mono text-2xs uppercase tracking-wider text-paper/40 mb-1.5">
                  Payment <span className="text-accent-warm normal-case">— required</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  <label className={`flex items-center gap-1.5 px-2 py-1 rounded-sm border cursor-pointer transition-colors ${
                    isCC
                      ? 'bg-accent-warm/10 border-accent-warm/60 text-paper'
                      : 'bg-indigo-950/60 border-paper/15 text-paper/70 hover:border-paper/40'
                  }`}>
                    <input type="radio" name="payment" value="cc" checked={isCC}
                      onChange={() => updateContact('payment', 'cc')}
                      className="accent-accent-warm shrink-0"
                    />
                    <span className="text-xs leading-tight">
                      <div className="font-medium">Credit card</div>
                      <div className="text-[10px] text-paper/50 font-mono">+4% fee</div>
                    </span>
                  </label>
                  <label className={`flex items-center gap-1.5 px-2 py-1 rounded-sm border cursor-pointer transition-colors ${
                    isACH
                      ? 'bg-accent-warm/10 border-accent-warm/60 text-paper'
                      : 'bg-indigo-950/60 border-paper/15 text-paper/70 hover:border-paper/40'
                  }`}>
                    <input type="radio" name="payment" value="ach" checked={isACH}
                      onChange={() => updateContact('payment', 'ach')}
                      className="accent-accent-warm shrink-0"
                    />
                    <span className="text-xs leading-tight">
                      <div className="font-medium">ACH / Wire</div>
                      <div className="text-[10px] text-paper/50 font-mono">no fee</div>
                    </span>
                  </label>
                </div>

                {/* Totals — ALWAYS the same row count regardless of payment selection.
                    CC fee + GM-CC + GM-if-ACH all render with greyed values when
                    not applicable, so the footer height never jumps. */}
                <div className="space-y-0.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xs uppercase tracking-wider text-paper/60">Wholesale subtotal</span>
                    <span className="font-mono num text-paper">{formatMoney(totals.wholesaleTotal)}</span>
                  </div>
                  <div className={`flex items-center justify-between ${isCC ? '' : 'opacity-30'}`}>
                    <span className="font-mono text-2xs uppercase tracking-wider text-paper/60">CC fee (4%)</span>
                    <span className="font-mono num text-paper/80">{formatMoney(isCC ? ccFee : 0)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 mt-0.5 border-t border-paper/10 bg-accent-warm/[0.06] -mx-3 px-3 py-1">
                    <span className="font-mono text-2xs uppercase tracking-wider text-paper">Total due</span>
                    <span className="font-mono num text-base text-paper font-semibold">
                      {formatMoney(isCC ? totalDueCC : totalDueACH)}
                    </span>
                  </div>

                  {totals.msrpTotal > 0 && (
                    <div className="pt-1 mt-0.5 border-t border-paper/10 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-2xs uppercase tracking-wider text-paper/40">Suggested retail</span>
                        <span className="font-mono num text-paper/60">{formatMoney(totals.msrpTotal)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-2xs uppercase tracking-wider text-paper/40">
                          Est. GM {isCC ? '(CC)' : isACH ? '' : '(no fee)'}
                        </span>
                        <span className="font-mono num text-paper">
                          {isCC ? `${gmCC}%` : `${gmACH}%`}
                        </span>
                      </div>
                      {/* ACH nudge — always rendered, greyed when not CC */}
                      <div className={`flex items-center justify-between -mx-3 px-3 py-0.5 border-l-2 ${
                        isCC
                          ? 'bg-accent-green/[0.08] border-accent-green/60'
                          : 'border-transparent opacity-30'
                      }`}>
                        <span className={`font-mono text-2xs uppercase tracking-wider ${
                          isCC ? 'text-accent-green/90' : 'text-paper/40'
                        }`}>GM% if ACH</span>
                        <span className={`font-mono num ${
                          isCC ? 'text-accent-green' : 'text-paper/40'
                        }`}>
                          {gmACH}%
                          {isCC && marginPointsLost > 0 && (
                            <span className="text-2xs text-accent-green/70 ml-1.5">(+{marginPointsLost} pts)</span>
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ONE-LINE DISCLAIMER + BUTTONS — combined into single row to save vertical space */}
            <div className="border-t border-paper/10 px-3 py-2 shrink-0 flex flex-wrap items-center gap-2 bg-accent-warm/[0.04]">
              <p className="text-[10px] leading-snug text-paper/60 flex-1 min-w-[200px]">
                Request for quote, not an order. Strains/cultivars/mixes confirmed at fulfillment. Drew will follow up.
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={copyLink}
                  disabled={!ready}
                  title={blockedReason}
                  className="px-3 py-1.5 text-xs font-medium rounded-sm bg-accent-warm text-indigo-900 hover:bg-accent-warm/90 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {copied === 'link' ? '✓ Link copied' : 'Copy shareable link'}
                </button>
                <button
                  onClick={copyText}
                  disabled={!ready}
                  title={blockedReason}
                  className="px-3 py-1.5 text-xs font-medium rounded-sm border border-paper/20 text-paper hover:border-paper/40 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {copied === 'text' ? '✓ Text copied' : 'Copy order as text'}
                </button>
                <button
                  onClick={() => { if (confirm('Clear all items from your RFQ?')) onClearRFQ() }}
                  className="px-3 py-1.5 text-xs font-medium rounded-sm text-accent-red/80 hover:text-accent-red"
                >
                  Clear
                </button>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
