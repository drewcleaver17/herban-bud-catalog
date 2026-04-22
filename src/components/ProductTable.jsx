import { useMemo } from 'react'
import {
  convertPrice,
  formatGrams,
  formatMoney,
  formatPercent,
  gmPercent,
  gmPerGram,
  msrpLooksBroken,
  perGram,
} from '../lib/pricing'

// Short product name: strip the "Brand - " prefix since it's in its own column.
function shortName(p) {
  const prefix = `${p.brand} - `
  if (p.sku.startsWith(prefix)) return p.sku.slice(prefix.length)
  // Handle "Herban Bud" naming mismatches etc.
  const firstDash = p.sku.indexOf(' - ')
  if (firstDash > 0) return p.sku.slice(firstDash + 3)
  return p.sku
}

const UOM_LABELS = {
  pack: 'Pack',
  gram: '/g',
  eighth: '/8th',
  oz: '/oz',
}

const CATEGORY_COLORS = {
  'Pre-Rolls':   'text-[#CDB4DB]',
  'FLOWER':      'text-[#9FD8A5]',
  'SNOWCAPS':    'text-[#A9D6E5]',
  'EDIBLES':     'text-[#F6BD60]',
  'Concentrate': 'text-[#F28482]',
  'VAPES':       'text-[#E8B86B]',
}

function SortHeader({ label, sortKey, currentSort, onSort, align = 'left', title, numeric }) {
  const active = currentSort.key === sortKey
  const dir = active ? currentSort.dir : null
  const alignClass = align === 'right' ? 'text-right' : 'text-left'
  return (
    <th
      scope="col"
      title={title}
      className={`${alignClass} sticky top-0 z-10 bg-indigo-800 text-paper/60 font-mono text-2xs font-medium uppercase tracking-wider px-3 py-2 border-b border-paper/10 whitespace-nowrap select-none`}
    >
      <button
        onClick={() => onSort(sortKey)}
        className={`flex items-center gap-1 ${
          align === 'right' ? 'ml-auto' : ''
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

function AvailabilityPill({ availability }) {
  if (availability === 'preorder') {
    return (
      <span className="inline-block px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wide rounded-sm bg-accent-warm/15 text-accent-warm border border-accent-warm/30">
        Pre-order
      </span>
    )
  }
  if (availability === 'discontinued') {
    return (
      <span className="inline-block px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wide rounded-sm bg-accent-red/10 text-accent-red/80 border border-accent-red/20">
        Disc.
      </span>
    )
  }
  if (availability === 'unavailable') {
    return (
      <span className="inline-block px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wide rounded-sm bg-paper/5 text-paper/50 border border-paper/15">
        Out
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wide text-accent-green">
      <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
      In stock
    </span>
  )
}

export default function ProductTable({ products, filters, setFilters }) {
  const sorted = useMemo(() => {
    const { key, dir } = filters.sort
    const mult = dir === 'desc' ? -1 : 1
    const getVal = (p) => {
      switch (key) {
        case 'brand':        return p.brand
        case 'category':     return p.category
        case 'sku':          return shortName(p)
        case 'grams':        return p.grams ?? -Infinity
        case 'wholesale':    return convertPrice(p.wholesale, p.grams, filters.uom) ?? -Infinity
        case 'msrp':         return convertPrice(p.msrp, p.grams, filters.uom) ?? -Infinity
        case 'cost_per_g':   return perGram(p.wholesale, p.grams) ?? Infinity
        case 'gm_per_g':     return gmPerGram(p) ?? -Infinity
        case 'gm_pct':       return gmPercent(p) ?? -Infinity
        case 'availability': return p.availability
        default:             return 0
      }
    }
    return [...products].sort((a, b) => {
      const va = getVal(a)
      const vb = getVal(b)
      if (typeof va === 'string' && typeof vb === 'string') {
        return va.localeCompare(vb) * mult
      }
      return ((va ?? 0) - (vb ?? 0)) * mult
    })
  }, [products, filters.sort, filters.uom])

  const handleSort = (key) => {
    setFilters({
      ...filters,
      sort: {
        key,
        dir: filters.sort.key === key && filters.sort.dir === 'asc' ? 'desc' : 'asc',
      },
    })
  }

  const uomLabel = UOM_LABELS[filters.uom]
  const priceLabel = filters.uom === 'pack' ? 'Pack' : uomLabel

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
      <table className="min-w-full border-collapse font-sans">
        <thead>
          <tr>
            <SortHeader label="Brand"     sortKey="brand"        currentSort={filters.sort} onSort={handleSort} />
            <SortHeader label="Category"  sortKey="category"     currentSort={filters.sort} onSort={handleSort} />
            <SortHeader label="Product"   sortKey="sku"          currentSort={filters.sort} onSort={handleSort} />
            <SortHeader label="Size"      sortKey="grams"        currentSort={filters.sort} onSort={handleSort} align="right" numeric />
            <SortHeader label={`Cost ${priceLabel}`}  sortKey="wholesale"    currentSort={filters.sort} onSort={handleSort} align="right" numeric title="Your wholesale cost" />
            <SortHeader label={`MSRP ${priceLabel}`}  sortKey="msrp"         currentSort={filters.sort} onSort={handleSort} align="right" numeric title="Suggested retail" />
            <SortHeader label="$/g cost"  sortKey="cost_per_g"   currentSort={filters.sort} onSort={handleSort} align="right" numeric title="Wholesale cost per gram" />
            <SortHeader label="GM $/g"    sortKey="gm_per_g"     currentSort={filters.sort} onSort={handleSort} align="right" numeric title="Gross margin dollars per gram at MSRP" />
            <SortHeader label="GM %"      sortKey="gm_pct"       currentSort={filters.sort} onSort={handleSort} align="right" numeric title="Gross margin % at MSRP" />
            <SortHeader label="Status"    sortKey="availability" currentSort={filters.sort} onSort={handleSort} />
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => {
            const broken = msrpLooksBroken(p)
            const costShown = convertPrice(p.wholesale, p.grams, filters.uom)
            const msrpShown = convertPrice(p.msrp, p.grams, filters.uom)
            const gmPct = gmPercent(p)
            const gmG = gmPerGram(p)
            const cpg = perGram(p.wholesale, p.grams)
            const dimmed = p.availability === 'discontinued' || p.availability === 'unavailable'
            const catColor = CATEGORY_COLORS[p.category] || 'text-paper/70'

            return (
              <tr
                key={p.id}
                className={`group border-b border-paper/5 hover:bg-paper/[0.03] transition-colors ${
                  dimmed ? 'opacity-50' : ''
                }`}
              >
                <td className="px-3 py-2 text-xs font-medium text-paper whitespace-nowrap">
                  {p.brand}
                </td>
                <td className={`px-3 py-2 text-2xs font-mono uppercase tracking-wider ${catColor}`}>
                  {p.category}
                </td>
                <td className="px-3 py-2 text-xs text-paper max-w-md">
                  <span className="block truncate" title={p.sku}>
                    {shortName(p)}
                  </span>
                  {p.notes && !p.notes.toUpperCase().includes('DISCONTINUED') && !p.notes.toUpperCase().includes('NOT AVAILABLE') && !p.notes.toUpperCase().includes('PRE-ORDER') && (
                    <span className="block text-[10px] text-paper/40 font-mono truncate mt-0.5" title={p.notes}>
                      {p.notes}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right text-xs font-mono num text-paper/80 whitespace-nowrap">
                  {formatGrams(p.grams)}
                </td>
                <td className="px-3 py-2 text-right text-xs font-mono num text-paper whitespace-nowrap">
                  {formatMoney(costShown)}
                </td>
                <td className="px-3 py-2 text-right text-xs font-mono num text-paper/80 whitespace-nowrap">
                  {broken ? (
                    <span
                      className="text-accent-warm cursor-help"
                      title="MSRP is below wholesale — likely a data-entry issue in the source sheet."
                    >
                      {formatMoney(msrpShown)} ⚠
                    </span>
                  ) : (
                    formatMoney(msrpShown)
                  )}
                </td>
                <td className="px-3 py-2 text-right text-2xs font-mono num text-paper/60 whitespace-nowrap">
                  {formatMoney(cpg, 2)}
                </td>
                <td className="px-3 py-2 text-right text-2xs font-mono num text-paper/60 whitespace-nowrap">
                  {formatMoney(gmG, 2)}
                </td>
                <td className="px-3 py-2 text-right text-xs font-mono num whitespace-nowrap">
                  {gmPct == null ? (
                    <span className="text-paper/30">—</span>
                  ) : (
                    <span
                      className={
                        gmPct >= 0.5
                          ? 'text-accent-green'
                          : gmPct >= 0.3
                          ? 'text-paper'
                          : 'text-accent-red/90'
                      }
                    >
                      {formatPercent(gmPct, 0)}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <AvailabilityPill availability={p.availability} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
