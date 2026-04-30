import { useMemo, useState } from 'react'
import {
  formatMoney,
  formatPercent,
  gmPercentAt,
  msrpLooksBroken,
} from '../lib/pricing'
import { TIER_STYLES, TYPE_STYLES } from '../lib/categories'

const CATEGORY_COLORS = {
  'Pre-Rolls':   'text-[#CDB4DB]',
  'FLOWER':      'text-[#9FD8A5]',
  'EDIBLES':     'text-[#F6BD60]',
  'Concentrate': 'text-[#F28482]',
  'VAPES':       'text-[#E8B86B]',
}

// Short product name for dense views. Strips brand prefix + leading tier word.
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
    <span
      className={`inline-block px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-sm border ${s.text} ${s.bg} ${s.border}`}
    >
      {s.label}
    </span>
  )
}

function TypeBadge({ type }) {
  if (!type) return null
  const key = String(type).toLowerCase()
  const s = TYPE_STYLES[key]
  if (!s) return null
  return (
    <span
      className={`inline-block px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-sm border ${s.text} ${s.bg} ${s.border}`}
    >
      {s.label}
    </span>
  )
}

function marginColorClass(pct) {
  if (pct == null) return 'text-paper/30'
  if (pct >= 0.5) return 'text-accent-green'
  if (pct >= 0.3) return 'text-paper'
  if (pct >= 0) return 'text-accent-red/90'
  return 'text-accent-red'
}

function ProductCard({ p, qty, onQty, effectiveMSRP, isOverridden, onMSRP, onResetMSRP }) {
  const [expanded, setExpanded] = useState(false)
  const gmPct = gmPercentAt(p.wholesale, effectiveMSRP)
  const catColor = CATEGORY_COLORS[p.category] || 'text-paper/70'
  const inCart = qty > 0
  const broken = msrpLooksBroken(p)

  return (
    <article className={`rounded-sm border transition-colors ${
      inCart ? 'bg-accent-warm/[0.05] border-accent-warm/30' : 'bg-paper/[0.02] border-paper/10'
    }`}>
      <div className="p-3">
        <div className="flex items-start gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-2xs font-mono uppercase tracking-wider ${catColor}`}>
                {p.category}
              </span>
              <TypeBadge type={p.type} />
            </div>
            <div className="font-medium text-sm text-paper">{p.brand}</div>
            <div className="text-[13px] text-paper/80 leading-snug">{shortName(p)}</div>
            <div className="font-mono text-[10px] text-paper/40 mt-1">{p.sku}</div>
            {p.notes && !p.notes.toUpperCase().includes('DISCONTINUED') && !p.notes.toUpperCase().includes('NOT AVAILABLE') && (
              <div className="text-[10px] text-paper/40 font-mono mt-1">{p.notes}</div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-paper/40">
              Wholesale
            </div>
            <div className="text-base font-mono num text-paper">
              {formatMoney(p.wholesale)}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-paper/40">
              MSRP
            </div>
            <div className="text-base font-mono num text-paper/80">
              {broken && !isOverridden ? (
                <span className="text-accent-warm">{formatMoney(p.msrp)} ⚠</span>
              ) : (
                formatMoney(effectiveMSRP)
              )}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-paper/40">
              GM%
            </div>
            <div className={`text-base font-mono num ${marginColorClass(gmPct)}`}>
              {gmPct == null ? '—' : formatPercent(gmPct, 0)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onQty(Math.max(0, qty - 1))}
              className="w-8 h-8 rounded-sm bg-indigo-950/60 border border-paper/15 text-paper/70 text-base"
              aria-label="Decrease quantity"
            >−</button>
            <input
              type="number"
              min="0"
              value={qty || ''}
              placeholder="0"
              onChange={(e) => onQty(e.target.value === '' ? 0 : Number(e.target.value))}
              className={`w-14 h-8 text-center text-sm font-mono num rounded-sm border ${
                inCart
                  ? 'bg-accent-warm/10 border-accent-warm/40 text-paper'
                  : 'bg-indigo-950/60 border-paper/15 text-paper'
              }`}
            />
            <button
              onClick={() => onQty(qty + 1)}
              className="w-8 h-8 rounded-sm bg-indigo-950/60 border border-paper/15 text-paper/70 text-base"
              aria-label="Increase quantity"
            >+</button>
          </div>
          <div className="flex-1 text-right">
            {inCart && p.wholesale && (
              <div className="text-sm font-mono num text-paper">
                {formatMoney(p.wholesale * qty)}
              </div>
            )}
          </div>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-[10px] font-mono uppercase tracking-wider text-paper/50 hover:text-paper px-2"
          >
            {expanded ? 'Less' : 'Edit MSRP'}
          </button>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-paper/10 flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-paper/40">
              Your MSRP
            </span>
            <div className={`flex-1 inline-flex items-center rounded-sm border ${
              isOverridden
                ? 'bg-accent-warm/10 border-accent-warm/40'
                : 'bg-indigo-950/60 border-paper/15'
            }`}>
              <span className={`text-[11px] pl-2 ${isOverridden ? 'text-accent-warm' : 'text-paper/40'}`}>$</span>
              <input
                type="number"
                step="1"
                min="0"
                value={effectiveMSRP ?? ''}
                onChange={(e) => onMSRP(e.target.value === '' ? null : Number(e.target.value))}
                className={`flex-1 bg-transparent px-2 py-1.5 text-sm font-mono num focus:outline-none ${
                  isOverridden ? 'text-accent-warm' : 'text-paper/80'
                }`}
              />
              {isOverridden && (
                <button
                  onClick={onResetMSRP}
                  className="text-[10px] text-paper/40 hover:text-paper px-2"
                  aria-label="Reset MSRP"
                >↺</button>
              )}
            </div>
          </div>
        )}
      </div>
    </article>
  )
}

export default function ProductCards({ products, filters, cart, setQty, buyerPrices, setBuyerPrice }) {
  const msrpFor = (p) => (buyerPrices[p.id] ?? p.msrp)

  const sorted = useMemo(() => {
    return [...products].sort((a, b) => (a.sortRank ?? 9999) - (b.sortRank ?? 9999))
  }, [products])

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <p className="font-display text-lg text-paper/60 mb-2">No products match.</p>
        <p className="text-2xs font-mono text-paper/40 uppercase tracking-wider">
          Try clearing filters or search.
        </p>
      </div>
    )
  }

  return (
    <div className="p-3 space-y-2.5">
      {sorted.map((p) => (
        <ProductCard
          key={p.id}
          p={p}
          qty={cart[p.id] || 0}
          onQty={(q) => setQty(p.id, q)}
          effectiveMSRP={msrpFor(p)}
          isOverridden={buyerPrices[p.id] != null && buyerPrices[p.id] !== p.msrp}
          onMSRP={(v) => setBuyerPrice(p.id, v)}
          onResetMSRP={() => setBuyerPrice(p.id, null)}
        />
      ))}
    </div>
  )
}
