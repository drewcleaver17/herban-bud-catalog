import { useMemo, useState } from 'react'
import { buildRFQURL, rfqAsText } from '../lib/rfq'
import { formatMoney } from '../lib/pricing'

// Totals computed with buyer's MSRP overrides applied.
function totalsWithOverrides(products, cart, buyerPrices) {
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
    const effMSRP = buyerPrices[p.id] ?? p.msrp
    if (effMSRP && effMSRP >= p.wholesale) msrpTotal += qty * effMSRP
  }
  return { lineCount, unitCount, wholesaleTotal, msrpTotal }
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
  const [copied, setCopied] = useState(null)

  const cartLines = useMemo(
    () =>
      products
        .filter((p) => (rfq.cart[p.id] || 0) > 0)
        .map((p) => ({
          p,
          qty: rfq.cart[p.id],
          lineTotal: (p.wholesale || 0) * rfq.cart[p.id],
        })),
    [products, rfq.cart],
  )

  const totals = useMemo(
    () => totalsWithOverrides(products, rfq.cart, buyerPrices),
    [products, rfq.cart, buyerPrices],
  )

  const copyLink = async () => {
    const url = buildRFQURL(rfq)
    try {
      await navigator.clipboard.writeText(url)
      setCopied('link')
      setTimeout(() => setCopied(null), 1600)
    } catch {
      prompt('Copy this RFQ link:', url)
    }
  }

  const copyText = async () => {
    const text = rfqAsText(products, rfq)
    try {
      await navigator.clipboard.writeText(text)
      setCopied('text')
      setTimeout(() => setCopied(null), 1600)
    } catch {
      prompt('Copy this RFQ text:', text)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex">
      <div
        className="flex-1 bg-indigo-950/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <aside className="w-full max-w-xl bg-indigo-900 border-l border-paper/10 flex flex-col h-full shadow-2xl">
        <div className="px-5 py-3 border-b border-paper/10 flex items-center gap-3 shrink-0">
          <h2 className="font-display text-xl text-paper">Your RFQ</h2>
          <span className="font-mono text-2xs text-paper/50">
            {totals.lineCount} {totals.lineCount === 1 ? 'line' : 'lines'} ·{' '}
            {totals.unitCount} units
          </span>
          <button
            onClick={onClose}
            className="ml-auto px-2 py-1 text-paper/60 hover:text-paper text-sm"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {cartLines.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <p className="font-display text-lg text-paper/60 mb-2">No items yet.</p>
            <p className="text-2xs font-mono text-paper/40 uppercase tracking-wider max-w-xs">
              Add quantities to rows in the catalog to start building your quote request.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-paper/50 font-mono text-2xs uppercase tracking-wider border-b border-paper/10">
                  <th className="px-3 py-2 text-left">SKU / Product</th>
                  <th className="px-3 py-2 text-right w-16">Qty</th>
                  <th className="px-3 py-2 text-right w-20">Line</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {cartLines.map(({ p, qty, lineTotal }) => (
                  <tr key={p.id} className="border-b border-paper/5">
                    <td className="px-3 py-2">
                      <div className="font-mono text-[11px] text-paper">{p.sku}</div>
                      <div className="text-[10px] text-paper/50 truncate max-w-xs">
                        {p.name}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        min="0"
                        value={qty}
                        onChange={(e) =>
                          setQty(p.id, e.target.value === '' ? 0 : Number(e.target.value))
                        }
                        className="w-14 bg-indigo-950/40 border border-paper/15 rounded-sm px-1.5 py-1 text-right text-xs font-mono num text-paper focus:border-accent-warm focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-xs font-mono num text-paper whitespace-nowrap">
                      {formatMoney(lineTotal)}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => setQty(p.id, 0)}
                        className="text-paper/40 hover:text-accent-red text-xs"
                        aria-label="Remove"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-indigo-950/40">
                  <td className="px-3 py-2 font-mono text-2xs uppercase tracking-wider text-paper/60">
                    Wholesale subtotal
                  </td>
                  <td></td>
                  <td className="px-3 py-2 text-right text-sm font-mono num text-paper">
                    {formatMoney(totals.wholesaleTotal)}
                  </td>
                  <td></td>
                </tr>
                {rfq.contact.payment === 'cc' && (
                  <>
                    <tr>
                      <td className="px-3 py-1 font-mono text-2xs uppercase tracking-wider text-paper/60">
                        Credit card fee (4%)
                      </td>
                      <td></td>
                      <td className="px-3 py-1 text-right text-xs font-mono num text-paper/80">
                        {formatMoney(totals.wholesaleTotal * 0.04)}
                      </td>
                      <td></td>
                    </tr>
                    <tr className="bg-accent-warm/[0.06]">
                      <td className="px-3 py-2 font-mono text-2xs uppercase tracking-wider text-paper">
                        Total due
                      </td>
                      <td></td>
                      <td className="px-3 py-2 text-right text-sm font-mono num text-paper font-semibold">
                        {formatMoney(totals.wholesaleTotal * 1.04)}
                      </td>
                      <td></td>
                    </tr>
                  </>
                )}
                {totals.msrpTotal > 0 && (
                  <>
                    <tr>
                      <td className="px-3 py-1 font-mono text-2xs uppercase tracking-wider text-paper/40">
                        Retail value
                      </td>
                      <td></td>
                      <td className="px-3 py-1 text-right text-xs font-mono num text-paper/60">
                        {formatMoney(totals.msrpTotal)}
                      </td>
                      <td></td>
                    </tr>
                    <tr>
                      <td className="px-3 py-1 pb-2 font-mono text-2xs uppercase tracking-wider text-paper/40">
                        Estimated gross margin
                      </td>
                      <td></td>
                      <td className="px-3 py-1 pb-2 text-right text-xs font-mono num text-accent-green">
                        {totals.msrpTotal > 0
                          ? `${Math.round(((totals.msrpTotal - totals.wholesaleTotal) / totals.msrpTotal) * 100)}%`
                          : '—'}
                      </td>
                      <td></td>
                    </tr>
                  </>
                )}
              </tfoot>
            </table>
          </div>
        )}

        {/* Friendly disclaimer — sets expectations before they send */}
        {cartLines.length > 0 && (
          <div className="border-t border-paper/10 px-4 py-3 bg-accent-warm/[0.04] shrink-0">
            <p className="text-[11px] leading-relaxed text-paper/70">
              This is a request for quote, not an order. Requests are fielded at the product-style
              level — specific strains, cultivars, and hybrid/indica/sativa mixes are confirmed at
              fulfillment, subject to availability. Drew will follow up to finalize details.
            </p>
          </div>
        )}

        <div className="border-t border-paper/10 p-4 space-y-2 shrink-0">
          <div className="font-mono text-2xs uppercase tracking-wider text-paper/40 mb-2">
            Contact (optional)
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Name"
              value={rfq.contact.name}
              onChange={(e) => updateContact('name', e.target.value)}
              className="bg-indigo-950/40 border border-paper/15 rounded-sm px-2 py-1.5 text-xs text-paper focus:border-accent-warm focus:outline-none"
            />
            <input
              placeholder="Company"
              value={rfq.contact.company}
              onChange={(e) => updateContact('company', e.target.value)}
              className="bg-indigo-950/40 border border-paper/15 rounded-sm px-2 py-1.5 text-xs text-paper focus:border-accent-warm focus:outline-none"
            />
            <input
              type="email"
              placeholder="Email"
              value={rfq.contact.email}
              onChange={(e) => updateContact('email', e.target.value)}
              className="bg-indigo-950/40 border border-paper/15 rounded-sm px-2 py-1.5 text-xs text-paper focus:border-accent-warm focus:outline-none"
            />
            <input
              type="tel"
              placeholder="Phone"
              value={rfq.contact.phone}
              onChange={(e) => updateContact('phone', e.target.value)}
              className="bg-indigo-950/40 border border-paper/15 rounded-sm px-2 py-1.5 text-xs text-paper focus:border-accent-warm focus:outline-none"
            />
          </div>
          <textarea
            placeholder="Delivery address"
            value={rfq.contact.delivery}
            onChange={(e) => updateContact('delivery', e.target.value)}
            rows={3}
            className="w-full bg-indigo-950/40 border border-paper/15 rounded-sm px-2 py-1.5 text-xs text-paper focus:border-accent-warm focus:outline-none resize-none"
          />
          <textarea
            placeholder="Notes (timing, mix preferences, anything else)"
            value={rfq.contact.notes}
            onChange={(e) => updateContact('notes', e.target.value)}
            rows={2}
            className="w-full bg-indigo-950/40 border border-paper/15 rounded-sm px-2 py-1.5 text-xs text-paper focus:border-accent-warm focus:outline-none resize-none"
          />
        </div>

        {/* Payment method — required */}
        <div className="border-t border-paper/10 px-4 pt-3 pb-4 shrink-0">
          <div className="font-mono text-2xs uppercase tracking-wider text-paper/40 mb-2">
            Payment method <span className="text-accent-warm normal-case">— required</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className={`flex items-center gap-2 px-3 py-2 rounded-sm border cursor-pointer transition-colors ${
              rfq.contact.payment === 'cc'
                ? 'bg-accent-warm/10 border-accent-warm/60 text-paper'
                : 'bg-indigo-950/40 border-paper/15 text-paper/70 hover:border-paper/40'
            }`}>
              <input
                type="radio"
                name="payment"
                value="cc"
                checked={rfq.contact.payment === 'cc'}
                onChange={() => updateContact('payment', 'cc')}
                className="accent-accent-warm shrink-0"
              />
              <span className="text-xs">
                <div className="font-medium">Credit card</div>
                <div className="text-[10px] text-paper/50 font-mono">+4% fee</div>
              </span>
            </label>
            <label className={`flex items-center gap-2 px-3 py-2 rounded-sm border cursor-pointer transition-colors ${
              rfq.contact.payment === 'ach'
                ? 'bg-accent-warm/10 border-accent-warm/60 text-paper'
                : 'bg-indigo-950/40 border-paper/15 text-paper/70 hover:border-paper/40'
            }`}>
              <input
                type="radio"
                name="payment"
                value="ach"
                checked={rfq.contact.payment === 'ach'}
                onChange={() => updateContact('payment', 'ach')}
                className="accent-accent-warm shrink-0"
              />
              <span className="text-xs">
                <div className="font-medium">ACH / Wire</div>
                <div className="text-[10px] text-paper/50 font-mono">no fee</div>
              </span>
            </label>
          </div>
        </div>

        <div className="border-t border-paper/10 p-4 flex flex-wrap gap-2 shrink-0">
          {(() => {
            const ready = cartLines.length > 0 && !!rfq.contact.payment
            const blockedReason = cartLines.length === 0
              ? 'Add at least one product'
              : !rfq.contact.payment
              ? 'Select a payment method above'
              : ''
            return (
              <>
                <button
                  onClick={copyLink}
                  disabled={!ready}
                  title={blockedReason}
                  className="flex-1 min-w-[160px] px-3 py-2 text-xs font-medium rounded-sm bg-accent-warm text-indigo-900 hover:bg-accent-warm/90 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {copied === 'link' ? '✓ Link copied' : 'Copy shareable link'}
                </button>
                <button
                  onClick={copyText}
                  disabled={!ready}
                  title={blockedReason}
                  className="flex-1 min-w-[140px] px-3 py-2 text-xs font-medium rounded-sm border border-paper/20 text-paper hover:border-paper/40 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {copied === 'text' ? '✓ Text copied' : 'Copy order as text'}
                </button>
              </>
            )
          })()}
          {cartLines.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Clear all items from your RFQ?')) onClearRFQ()
              }}
              className="px-3 py-2 text-xs font-medium rounded-sm text-accent-red/80 hover:text-accent-red"
            >
              Clear
            </button>
          )}
        </div>
      </aside>
    </div>
  )
}
