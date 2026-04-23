// Mobile-only read-only RFQ view that renders when someone opens a shared
// link on a phone. Replaces the catalog entirely. Designed to look like a
// receipt/quote — no browse, no edit, no MSRP overrides, no admin.
//
// Routing decision happens in main.jsx based on viewport at mount. Once
// rendered, QuoteView never switches back to the catalog (no reactive
// resize handling — would be jarring mid-scroll).
//
// Sections (top to bottom):
//   1. Hero header — brand name, "REQUEST FOR QUOTE", company, line/unit
//      count, total due, payment tag. Like a receipt header.
//   2. Submitted timestamp
//   3. Order — one card per line item, kitchen-ticket style
//   4. Contact — buyer info + delivery address + payment method
//   5. Totals — subtotal, CC fee (if applicable), total due, retail value,
//      margin (with CC-vs-ACH nudge when CC selected)
//   6. Disclaimer
//   7. Sticky bottom bar — single "Copy as text" button

import { useMemo, useState } from 'react'
import { rfqAsText } from '../lib/rfq'
import { TYPE_STYLES } from '../lib/categories'

// ─── Money formatter (matches text format conventions) ───
function fmtMoney(n) {
  if (n == null) return 'TBD'
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ─── Strip "Brand — Tier " prefix from product name (line-item description) ───
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

// ─── Format submitted-at timestamp human-friendly ───
function formatSubmitted(d) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const m = months[d.getMonth()]
  const day = d.getDate()
  const yr = d.getFullYear()
  let h = d.getHours()
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${m} ${day}, ${yr} · ${h}:${mm} ${ampm}`
}

export default function QuoteView({ products, rfq }) {
  const c = rfq.contact
  const [copied, setCopied] = useState(false)
  const submittedAt = useMemo(() => new Date(), [])

  // Build the line items array with computed cost data
  const lineItems = useMemo(() => {
    const out = []
    for (const p of products) {
      const qty = rfq.cart[p.id] || 0
      if (qty <= 0) continue
      const hasPrice = p.wholesale != null
      out.push({
        product: p,
        qty,
        hasPrice,
        unit: p.wholesale,
        line: hasPrice ? p.wholesale * qty : null,
      })
    }
    return out
  }, [products, rfq.cart])

  // Aggregated totals
  const totals = useMemo(() => {
    let subtotal = 0
    let retail = 0
    let unitCount = 0
    for (const li of lineItems) {
      unitCount += li.qty
      if (li.hasPrice) subtotal += li.line
      const p = li.product
      if (p.msrp && p.wholesale && p.msrp >= p.wholesale) {
        retail += p.msrp * li.qty
      }
    }
    const ccFee = c.payment === 'cc' ? subtotal * 0.04 : 0
    const totalDue = subtotal + ccFee
    let ccMargin = null
    let achMargin = null
    if (retail > 0) {
      ccMargin = Math.round(((retail - subtotal * 1.04) / retail) * 100)
      achMargin = Math.round(((retail - subtotal) / retail) * 100)
    }
    return {
      subtotal,
      ccFee,
      totalDue,
      retail,
      ccMargin,
      achMargin,
      lineCount: lineItems.length,
      unitCount,
    }
  }, [lineItems, c.payment])

  const paymentLabel =
    c.payment === 'cc'  ? 'Credit card (+4% fee)' :
    c.payment === 'ach' ? 'ACH / Wire (no fee)' :
    'Not yet selected'

  const paymentTag = c.payment === 'cc' ? 'CC' : c.payment === 'ach' ? 'ACH' : '?'
  const buyerLabel = c.company || c.name || 'Pending buyer info'

  // Build full delivery address as ordered lines
  const addressLines = useMemo(() => {
    const out = []
    if (c.street) out.push(c.street)
    if (c.street2) out.push(c.street2)
    const cityStateZip = [c.city, c.state, c.zip].filter(Boolean).join(', ').replace(/, (\d)/, ' $1')
    if (cityStateZip) out.push(cityStateZip)
    // Legacy free-text fallback if structured fields are blank
    if (out.length === 0 && c.delivery) return c.delivery.split(/\r?\n/).filter(Boolean)
    return out
  }, [c])

  const handleCopy = async () => {
    const text = rfqAsText(products, rfq, { now: submittedAt })
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: show prompt for manual copy if clipboard API unavailable
      window.prompt('Copy this RFQ:', text)
    }
  }

  // Empty cart edge case — link with no items
  if (lineItems.length === 0) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-6 text-center">
        <h1 className="font-display text-2xl text-paper mb-2">Empty quote</h1>
        <p className="font-mono text-xs text-paper/60 max-w-xs">
          This RFQ link has no items. Contact Drew at{' '}
          <a href="mailto:drew@herbanbud.com" className="text-accent-warm underline">
            drew@herbanbud.com
          </a>{' '}
          for help.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-full flex flex-col bg-indigo-950 text-paper pb-24">
      {/* ─── HERO HEADER ─── */}
      <header className="px-5 pt-6 pb-5 border-b border-paper/10">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-paper/50 mb-1">
          Herban Bud
        </div>
        <h1 className="font-display text-3xl text-paper leading-tight">
          Request for Quote
        </h1>
        <div className="mt-4 space-y-0.5">
          <div className="font-display text-xl text-accent-warm">{buyerLabel}</div>
          <div className="font-mono text-xs text-paper/70">
            {totals.lineCount} {totals.lineCount === 1 ? 'line' : 'lines'} · {totals.unitCount} {totals.unitCount === 1 ? 'unit' : 'units'}
          </div>
          <div className="font-mono text-2xl text-paper mt-2">
            {fmtMoney(totals.totalDue)}{' '}
            <span className="text-base text-paper/50">({paymentTag})</span>
          </div>
        </div>
        <div className="mt-3 font-mono text-[10px] uppercase tracking-wider text-paper/40">
          Submitted {formatSubmitted(submittedAt)}
        </div>
      </header>

      {/* ─── ORDER ─── */}
      <section className="px-5 pt-6">
        <SectionLabel>Order</SectionLabel>
        <div className="mt-3 space-y-3">
          {lineItems.map((li, i) => (
            <LineItemCard key={li.product.id} index={i + 1} item={li} />
          ))}
        </div>
      </section>

      {/* ─── CONTACT ─── */}
      <section className="px-5 pt-7">
        <SectionLabel>Contact</SectionLabel>
        <div className="mt-3 font-mono text-sm text-paper/85 space-y-0.5">
          {c.name && <div>{c.name}</div>}
          {c.company && c.company !== c.name && <div>{c.company}</div>}
          {c.email && (
            <div>
              <a href={`mailto:${c.email}`} className="text-accent-warm">
                {c.email}
              </a>
            </div>
          )}
          {c.phone && (
            <div>
              <a href={`tel:${c.phone.replace(/\D/g, '')}`} className="text-accent-warm">
                {c.phone}
              </a>
            </div>
          )}
          {addressLines.length > 0 && (
            <div className="pt-2 text-paper/75">
              {addressLines.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          )}
          <div className="pt-2 text-paper/75">
            <span className="text-paper/50">Pay:</span> {paymentLabel}
          </div>
        </div>
      </section>

      {/* ─── NOTES (only if present) ─── */}
      {c.notes && c.notes.trim() && (
        <section className="px-5 pt-7">
          <SectionLabel>Notes</SectionLabel>
          <div className="mt-3 font-mono text-sm text-paper/85 whitespace-pre-wrap">
            {c.notes}
          </div>
        </section>
      )}

      {/* ─── TOTALS ─── */}
      <section className="px-5 pt-7">
        <SectionLabel>Totals</SectionLabel>
        <div className="mt-3 space-y-1.5 font-mono text-sm">
          <TotalRow label="Subtotal" value={fmtMoney(totals.subtotal)} />
          {c.payment === 'cc' && (
            <TotalRow label="CC fee (4%)" value={fmtMoney(totals.ccFee)} />
          )}
          <TotalRow label="Total due" value={fmtMoney(totals.totalDue)} bold />
          {totals.retail > 0 && (
            <>
              <div className="h-2" />
              <TotalRow
                label="Retail value"
                value={fmtMoney(totals.retail)}
                muted
              />
              {c.payment === 'cc' ? (
                <>
                  <TotalRow
                    label="Margin"
                    value={`${totals.ccMargin}% (CC, after 4% fee)`}
                    muted
                  />
                  <TotalRow
                    label="Margin if ACH"
                    value={`${totals.achMargin}% (+${totals.achMargin - totals.ccMargin} pts saved)`}
                    accent
                  />
                </>
              ) : (
                <TotalRow
                  label="Margin"
                  value={`${totals.achMargin}%`}
                  muted
                />
              )}
            </>
          )}
        </div>
      </section>

      {/* ─── DISCLAIMER ─── */}
      <section className="px-5 pt-7 pb-6">
        <p className="font-mono text-[11px] text-paper/50 leading-relaxed border-t border-paper/10 pt-4">
          Request for quote, not an order. Strains/cultivars/mixes
          confirmed at fulfillment, subject to availability.
        </p>
        <p className="font-mono text-[10px] text-paper/35 mt-3 text-center">
          bud.drewcleaver.com
        </p>
      </section>

      {/* ─── STICKY BOTTOM ACTION BAR ─── */}
      <div className="fixed bottom-0 inset-x-0 bg-indigo-950/95 backdrop-blur border-t border-paper/15 px-4 py-3 z-50">
        <button
          onClick={handleCopy}
          className={`w-full py-3 rounded-sm font-mono text-xs uppercase tracking-[0.18em] transition-colors ${
            copied
              ? 'bg-accent-green text-indigo-950'
              : 'bg-paper text-indigo-900 hover:bg-paper/90'
          }`}
        >
          {copied ? 'Copied to clipboard' : 'Copy as text'}
        </button>
      </div>
    </div>
  )
}

// ─── Subcomponents ───

function SectionLabel({ children }) {
  return (
    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-paper/50">
      {children}
    </div>
  )
}

function LineItemCard({ index, item }) {
  const { product: p, qty, hasPrice, unit, line } = item
  const cat = (p.category || '').toUpperCase()
  const brandTier = p.tier ? `${p.brand} ${p.tier}` : p.brand
  // Resolve type style for the inline chip (right of category/brand line)
  const typeKey = p.type ? String(p.type).toLowerCase() : null
  const typeStyle = typeKey ? TYPE_STYLES[typeKey] : null

  return (
    <article className="border border-paper/10 rounded-sm p-3 bg-paper/[0.02]">
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="font-mono text-[10px] text-paper/40 tabular-nums">
          {String(index).padStart(2, '0')}
        </span>
        <span className="font-mono text-sm text-paper">
          {qty} × <span className="text-accent-warm">{p.sku}</span>
        </span>
      </div>
      {hasPrice ? (
        <div className="font-mono text-sm text-paper/85 mb-2 ml-6">
          {fmtMoney(unit)} ea = <span className="text-paper">{fmtMoney(line)}</span>
        </div>
      ) : (
        <div className="font-mono text-sm text-paper/60 mb-2 ml-6">
          Pricing TBD
        </div>
      )}
      <div className="flex items-center gap-2 flex-wrap ml-6">
        <div className="font-mono text-[11px] uppercase tracking-wider text-paper/55">
          {cat} <span className="text-paper/30">/</span> {brandTier}
        </div>
        {typeStyle && (
          <span
            className={`inline-block px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-sm border ${typeStyle.text} ${typeStyle.bg} ${typeStyle.border}`}
          >
            {typeStyle.label}
          </span>
        )}
      </div>
      <div className="font-sans text-sm text-paper/80 ml-6 mt-0.5">
        {shortName(p)}
      </div>
      {p.notes && p.notes.trim() &&
        !p.notes.toUpperCase().includes('DISCONTINUED') &&
        !p.notes.toUpperCase().includes('NOT AVAILABLE') && (
          <div className="font-mono text-[11px] text-paper/55 ml-6 mt-1.5 italic">
            {p.notes}
          </div>
        )}
    </article>
  )
}

function TotalRow({ label, value, bold, muted, accent }) {
  const valueClass = bold
    ? 'text-paper text-base font-semibold'
    : accent
    ? 'text-accent-green'
    : muted
    ? 'text-paper/65'
    : 'text-paper'
  const labelClass = bold ? 'text-paper' : 'text-paper/55'
  return (
    <div className="flex items-baseline justify-between">
      <span className={labelClass}>{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  )
}
