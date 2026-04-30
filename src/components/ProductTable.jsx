import { useMemo } from 'react'
import {
  formatMoney,
  formatPercent,
  gmPercentAt,
  msrpLooksBroken,
} from '../lib/pricing'
import { TIER_RANK, TIER_STYLES, TYPE_STYLES } from '../lib/categories'

const CATEGORY_COLORS = {
  'Pre-Rolls':   'text-[#CDB4DB]',
  'FLOWER':      'text-[#9FD8A5]',
  'EDIBLES':     'text-[#F6BD60]',
  'Concentrate': 'text-[#F28482]',
  'VAPES':       'text-[#E8B86B]',
}

// Short product name for dense table & card views. Strips the "{Brand} — "
// prefix and any leading tier word (Snowcaps/Exotic/Premium/Core), since
// both have their own columns. The original `name` is kept intact on the
// product object for RFQ/admin/email/mobile card header.
function shortName(p) {
  let n = p.name || ''
  const prefix = `${p.brand} — `
  if (n.startsWith(prefix)) n = n.slice(prefix.length)
  // Strip leading tier word if it matches this product's tier
  if (p.tier) {
    const re = new RegExp(`^${p.tier}\\s+`, 'i')
    n = n.replace(re, '')
  }
  return n
}

function SortHeader({ label, sortKey, currentSort, onSort, align = 'left', title, numeric, width }) {
  const active = currentSort.key === sortKey
  const dir = active ? currentSort.dir : null
  const alignClass =
    align === 'right'  ? 'text-right'  :
    align === 'center' ? 'text-center' :
    'text-left'
  return (
    <th
      scope="col"
      title={title}
      style={width ? { width } : undefined}
      className={`${alignClass} sticky top-0 z-10 bg-indigo-800 text-paper/60 font-mono text-2xs font-medium uppercase tracking-wider px-3 py-2 border-b border-paper/10 whitespace-nowrap select-none`}
    >
      <button
        onClick={() => onSort(sortKey)}
        className={`flex items-center gap-1 ${
          align === 'right'  ? 'ml-auto' :
          align === 'center' ? 'mx-auto' :
          ''
        } hover:text-paper transition-colors ${active ? 'text-paper' : ''}`}
      >
        <span className={numeric ? 'num' : ''}>{label}</span>
        <span className="w-2 text-[9px] text-paper/40">
          {dir === 'asc' ? '▲' : dir === 'desc' ? '▼' : ''}
        </span>
      </button>
    </th>
  )
}

function TierBadge({ tier }) {
  if (!tier) return <span className="text-paper/20 text-xs">—</span>
  const s = TIER_STYLES[tier]
  if (!s) return <span className="text-paper/60 text-2xs">{tier}</span>
  return (
    <span
      className={`inline-block px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-sm border ${s.text} ${s.bg} ${s.border}`}
    >
      {s.label}
    </span>
  )
}

// Type badge — indica purple, sativa green, hybrid gold, blend muted, cbd blue.
// Products without a type render as "—" (no badge), consistent with how
// Tier handles absent values.
function TypeBadge({ type }) {
  if (!type) return <span className="text-paper/20 text-xs">—</span>
  const key = String(type).toLowerCase()
  const s = TYPE_STYLES[key]
  if (!s) return <span className="text-paper/60 text-2xs">{type}</span>
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

export default function ProductTable({
  products,
  filters,
  setFilters,
  cart,
  setQty,
  buyerPrices,
  setBuyerPrice,
}) {
  // Effective MSRP for a product = buyer override if present, else catalog MSRP.
  const msrpFor = (p) => (buyerPrices[p.id] ?? p.msrp)

  const sorted = useMemo(() => {
    const { key, dir } = filters.sort
    const mult = dir === 'desc' ? -1 : 1
    const getVal = (p) => {
      switch (key) {
        case 'curated':    return p.sortRank ?? 9999
        case 'brand':      return p.brand
        case 'category':   return p.category
        case 'tier':       return TIER_RANK[p.tier] ?? -1
        case 'type':       return (p.type || '').toLowerCase()
        case 'sku':        return p.sku
        case 'name':       return shortName(p)
        case 'qty':        return cart[p.id] || 0
        case 'wholesale':  return p.wholesale ?? -Infinity
        case 'msrp':       return msrpFor(p) ?? -Infinity
        case 'gm_pct':     return gmPercentAt(p.wholesale, msrpFor(p)) ?? -Infinity
        case 'line_total': return (p.wholesale || 0) * (cart[p.id] || 0)
        default:           return 0
      }
    }
    const primary = [...products].sort((a, b) => {
      const va = getVal(a)
      const vb = getVal(b)
      if (typeof va === 'string' && typeof vb === 'string') {
        return va.localeCompare(vb) * mult
      }
      return ((va ?? 0) - (vb ?? 0)) * mult
    })
    // When curated is active, apply a stable secondary sort by wholesale asc
    // within same rank so rows group naturally (smallest unit first).
    if (key === 'curated') {
      return primary
    }
    return primary
  }, [products, filters.sort, cart, buyerPrices])

  const handleSort = (key) => {
    setFilters({
      ...filters,
      sort: {
        key,
        dir: filters.sort.key === key && filters.sort.dir === 'asc' ? 'desc' : 'asc',
      },
    })
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="font-display text-xl text-paper/60 mb-2">No products match.</p>
        <p className="text-2xs font-mono text-paper/40 uppercase tracking-wider">
          Try clearing filters or search.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse font-sans table-fixed">
        <colgroup>
          <col style={{ width: '86px' }} />{/* Category — "Concentrate" (11ch at 2xs mono) */}
          <col style={{ width: '98px' }} />{/* Brand — "CaliGreenGold" (13ch at xs medium) */}
          <col />{/* Product — flexible, absorbs remaining slack */}
          <col style={{ width: '80px' }} />{/* Type — "HYBRID" + center padding */}
          <col style={{ width: '184px' }} />{/* SKU — longest "DP-FLW-PRM-28X1G-TUB-IND" (24ch) must never truncate */}
          <col style={{ width: '72px' }} />{/* Qty — number input */}
          <col style={{ width: '82px' }} />{/* Wholesale — "$125.00" */}
          <col style={{ width: '92px' }} />{/* MSRP (editable) — input + $ + reset button */}
          <col style={{ width: '56px' }} />{/* GM% — "77%" */}
          <col style={{ width: '86px' }} />{/* Line — "$225.00" */}
        </colgroup>
        <thead>
          <tr>
            <SortHeader label="Category"  sortKey="category"  currentSort={filters.sort} onSort={handleSort} />
            <SortHeader label="Brand"     sortKey="brand"     currentSort={filters.sort} onSort={handleSort} />
            <SortHeader label="Product"   sortKey="name"      currentSort={filters.sort} onSort={handleSort} />
            <SortHeader label="Type"      sortKey="type"      currentSort={filters.sort} onSort={handleSort} align="center" title="Hybrid / Indica / Sativa / Blend / CBD" />
            <SortHeader label="SKU"       sortKey="sku"       currentSort={filters.sort} onSort={handleSort} />
            <SortHeader label="Qty"       sortKey="qty"       currentSort={filters.sort} onSort={handleSort} align="right" numeric title="Quantity for RFQ" />
            <SortHeader label="Wholesale" sortKey="wholesale" currentSort={filters.sort} onSort={handleSort} align="right" numeric />
            <SortHeader label="MSRP"      sortKey="msrp"      currentSort={filters.sort} onSort={handleSort} align="right" numeric title="Your retail price — editable" />
            <SortHeader label="GM%"       sortKey="gm_pct"    currentSort={filters.sort} onSort={handleSort} align="right" numeric title="Gross margin % at your MSRP" />
            <SortHeader label="Line"      sortKey="line_total" currentSort={filters.sort} onSort={handleSort} align="right" numeric title="Qty × wholesale" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => {
            const effectiveMSRP = msrpFor(p)
            const isOverridden = buyerPrices[p.id] != null && buyerPrices[p.id] !== p.msrp
            const catalogBroken = msrpLooksBroken(p)
            const gmPct = gmPercentAt(p.wholesale, effectiveMSRP)
            const qty = cart[p.id] || 0
            const lineTotal = (p.wholesale || 0) * qty
            const catColor = CATEGORY_COLORS[p.category] || 'text-paper/70'
            const inCart = qty > 0

            return (
              <tr
                key={p.id}
                className={`group border-b border-paper/5 transition-colors ${
                  inCart ? 'bg-accent-warm/[0.04]' : 'hover:bg-paper/[0.03]'
                }`}
              >
                <td className={`px-3 py-2 text-2xs font-mono uppercase tracking-wider truncate ${catColor}`}>
                  {p.category}
                </td>
                <td className="px-3 py-2 text-xs font-medium text-paper truncate">
                  {p.brand}
                </td>
                <td className="px-3 py-2 text-xs text-paper">
                  <span className="block truncate" title={p.name}>
                    {shortName(p)}
                  </span>
                  {p.notes && !p.notes.toUpperCase().includes('DISCONTINUED') && !p.notes.toUpperCase().includes('NOT AVAILABLE') && (
                    <span className="block text-[10px] text-paper/40 font-mono truncate mt-0.5" title={p.notes}>
                      {p.notes}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-center">
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-center">
                  <TypeBadge type={p.type} />
                </td>
                <td className="px-3 py-2 text-[11px] font-mono text-paper/80 whitespace-nowrap" title={p.sku}>
                  {p.sku}
                </td>
                <td className="px-3 py-2 text-right">
                  <div className={`inline-flex items-center rounded-sm border transition-colors ${
                    inCart
                      ? 'bg-accent-warm/10 border-accent-warm/40'
                      : 'bg-indigo-950/40 border-paper/15 focus-within:border-accent-warm'
                  }`}>
                    <input
                      type="number"
                      min="0"
                      value={qty || ''}
                      placeholder="0"
                      onChange={(e) => setQty(p.id, e.target.value === '' ? 0 : Number(e.target.value))}
                      className="w-14 bg-transparent text-right px-1.5 py-1 text-xs font-mono num text-paper focus:outline-none placeholder:text-paper/30"
                      aria-label={`Quantity for ${p.sku}`}
                    />
                  </div>
                </td>
                <td className="px-3 py-2 text-right text-xs font-mono num text-paper whitespace-nowrap">
                  {formatMoney(p.wholesale)}
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <div className={`inline-flex items-center rounded-sm border transition-colors ${
                    isOverridden
                      ? 'bg-accent-warm/10 border-accent-warm/40'
                      : 'bg-indigo-950/40 border-paper/15 focus-within:border-accent-warm'
                  }`}>
                    <span className={`text-[10px] pl-1.5 ${isOverridden ? 'text-accent-warm' : 'text-paper/40'}`}>$</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={effectiveMSRP ?? ''}
                      onChange={(e) => {
                        const v = e.target.value
                        setBuyerPrice(p.id, v === '' ? null : Number(v))
                      }}
                      className={`w-16 bg-transparent text-right px-1 py-1 text-xs font-mono num focus:outline-none ${
                        isOverridden ? 'text-accent-warm' : 'text-paper/80'
                      }`}
                      aria-label="Your MSRP"
                      title={catalogBroken && !isOverridden
                        ? 'Catalog MSRP is below wholesale — likely a data-entry issue. Override with your own price.'
                        : undefined}
                    />
                    {isOverridden && (
                      <button
                        onClick={() => setBuyerPrice(p.id, null)}
                        className="text-[10px] text-paper/30 hover:text-paper pr-1"
                        title="Reset to catalog MSRP"
                        aria-label="Reset MSRP"
                      >
                        ↺
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 text-right text-xs font-mono num whitespace-nowrap">
                  {gmPct == null ? (
                    <span className="text-paper/30">—</span>
                  ) : (
                    <span className={marginColorClass(gmPct)}>
                      {formatPercent(gmPct, 0)}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right text-xs font-mono num whitespace-nowrap">
                  {qty > 0 ? (
                    <span className="text-paper">{formatMoney(lineTotal)}</span>
                  ) : (
                    <span className="text-paper/20">—</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
