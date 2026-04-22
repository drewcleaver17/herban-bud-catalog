import { useMemo, useState } from 'react'

function Chip({ active, onClick, children, tone = 'default' }) {
  const base = 'px-2.5 py-1 text-2xs font-medium rounded-sm border transition-colors select-none'
  const tones = {
    default: active
      ? 'bg-paper text-indigo-900 border-paper'
      : 'bg-transparent text-paper/70 border-paper/15 hover:border-paper/40 hover:text-paper',
    warm: active
      ? 'bg-accent-warm text-indigo-900 border-accent-warm'
      : 'bg-transparent text-paper/70 border-paper/15 hover:border-accent-warm/60 hover:text-paper',
  }
  return (
    <button type="button" onClick={onClick} className={`${base} ${tones[tone]}`}>
      {children}
    </button>
  )
}

function toggleIn(arr, val) {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]
}

export default function FilterBar({
  filters,
  setFilters,
  brands,
  categories,
  views,
  onSaveView,
  onLoadView,
  onDeleteView,
  onShareURL,
  resultCount,
}) {
  const [viewName, setViewName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  const clearAll = () => {
    setFilters({
      ...filters,
      q: '',
      brands: [],
      categories: [],
      availability: 'all',
    })
  }

  const hasFilters = useMemo(
    () => filters.q || filters.brands.length || filters.categories.length || filters.availability !== 'all',
    [filters],
  )

  return (
    <div className="sticky top-0 z-20 bg-indigo-900/95 backdrop-blur border-b border-paper/10">
      {/* Row 1: brand + search + UOM + views */}
      <div className="flex flex-wrap items-center gap-3 px-5 pt-4 pb-3">
        <div className="flex items-baseline gap-3 mr-2">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-paper">Herban</h1>
          <span className="font-mono text-2xs uppercase tracking-[0.18em] text-paper/50">
            wholesale catalog
          </span>
        </div>

        <div className="flex-1 min-w-[240px]">
          <div className="relative">
            <input
              type="search"
              placeholder="Search SKUs, brands, categories…"
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              className="w-full bg-indigo-800/60 border border-paper/15 rounded-sm px-3 py-2 text-sm text-paper placeholder:text-paper/40 focus:border-accent-warm focus:outline-none"
            />
            {filters.q && (
              <button
                onClick={() => setFilters({ ...filters, q: '' })}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-paper/40 hover:text-paper text-xs"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* UOM toggle */}
        <div className="flex rounded-sm overflow-hidden border border-paper/15 text-2xs font-mono">
          {[
            ['pack', 'Pack'],
            ['gram', '/g'],
            ['eighth', '/8th'],
            ['oz', '/oz'],
          ].map(([v, label]) => (
            <button
              key={v}
              onClick={() => setFilters({ ...filters, uom: v })}
              className={`px-2.5 py-1.5 transition-colors ${
                filters.uom === v
                  ? 'bg-paper text-indigo-900'
                  : 'bg-transparent text-paper/60 hover:text-paper hover:bg-paper/5'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Views */}
        <div className="flex items-center gap-1">
          {views.length > 0 && (
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) onLoadView(e.target.value)
                e.target.value = ''
              }}
              className="bg-indigo-800/60 border border-paper/15 rounded-sm px-2 py-1.5 text-2xs text-paper/80"
            >
              <option value="">Load view…</option>
              {views.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => setShowSaveDialog((s) => !s)}
            className="px-2.5 py-1.5 text-2xs font-medium rounded-sm border border-paper/15 text-paper/70 hover:text-paper hover:border-paper/40"
          >
            Save view
          </button>
          <button
            onClick={onShareURL}
            className="px-2.5 py-1.5 text-2xs font-medium rounded-sm border border-paper/15 text-paper/70 hover:text-paper hover:border-paper/40"
            title="Copy shareable link"
          >
            Share
          </button>
        </div>
      </div>

      {showSaveDialog && (
        <div className="flex items-center gap-2 px-5 pb-3">
          <input
            autoFocus
            placeholder="View name (e.g., 'Flower under $30/8th')"
            value={viewName}
            onChange={(e) => setViewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && viewName.trim()) {
                onSaveView(viewName.trim())
                setViewName('')
                setShowSaveDialog(false)
              }
              if (e.key === 'Escape') setShowSaveDialog(false)
            }}
            className="flex-1 bg-indigo-800/60 border border-paper/15 rounded-sm px-2.5 py-1.5 text-xs text-paper"
          />
          <button
            onClick={() => {
              if (viewName.trim()) {
                onSaveView(viewName.trim())
                setViewName('')
                setShowSaveDialog(false)
              }
            }}
            className="px-3 py-1.5 text-2xs font-medium rounded-sm bg-accent-warm text-indigo-900 hover:bg-accent-warm/90"
          >
            Save
          </button>
          {views.length > 0 && (
            <details className="relative">
              <summary className="cursor-pointer px-2.5 py-1.5 text-2xs text-paper/60 hover:text-paper list-none">
                Manage
              </summary>
              <div className="absolute right-0 top-full mt-1 bg-indigo-800 border border-paper/15 rounded-sm p-2 min-w-[200px] z-30">
                {views.map((v) => (
                  <div
                    key={v.name}
                    className="flex items-center justify-between gap-2 px-2 py-1 text-2xs text-paper hover:bg-paper/5"
                  >
                    <span className="truncate">{v.name}</span>
                    <button
                      onClick={() => onDeleteView(v.name)}
                      className="text-accent-red hover:text-accent-red/80 text-xs"
                      aria-label={`Delete ${v.name}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Row 2: brand chips */}
      <div className="flex flex-wrap items-center gap-1.5 px-5 pb-2">
        <span className="font-mono text-2xs uppercase tracking-wider text-paper/40 mr-1">
          Brand
        </span>
        {brands.map((b) => (
          <Chip
            key={b}
            active={filters.brands.includes(b)}
            onClick={() => setFilters({ ...filters, brands: toggleIn(filters.brands, b) })}
          >
            {b}
          </Chip>
        ))}
      </div>

      {/* Row 3: category + availability + count */}
      <div className="flex flex-wrap items-center gap-1.5 px-5 pb-3">
        <span className="font-mono text-2xs uppercase tracking-wider text-paper/40 mr-1">
          Category
        </span>
        {categories.map((c) => (
          <Chip
            key={c}
            active={filters.categories.includes(c)}
            onClick={() =>
              setFilters({ ...filters, categories: toggleIn(filters.categories, c) })
            }
          >
            {c}
          </Chip>
        ))}
        <span className="mx-2 h-4 w-px bg-paper/15" />
        <span className="font-mono text-2xs uppercase tracking-wider text-paper/40 mr-1">
          Status
        </span>
        {[
          ['all', 'All'],
          ['available', 'Available'],
          ['preorder', 'Pre-order'],
        ].map(([v, label]) => (
          <Chip
            key={v}
            tone="warm"
            active={filters.availability === v}
            onClick={() => setFilters({ ...filters, availability: v })}
          >
            {label}
          </Chip>
        ))}

        <div className="ml-auto flex items-center gap-3">
          {hasFilters && (
            <button
              onClick={clearAll}
              className="text-2xs text-paper/50 hover:text-paper underline-offset-2 hover:underline"
            >
              Clear all
            </button>
          )}
          <span className="font-mono text-2xs text-paper/50">
            {resultCount} {resultCount === 1 ? 'product' : 'products'}
          </span>
        </div>
      </div>
    </div>
  )
}
