import { CATEGORY_GLYPHS, TYPE_ORDER, TYPE_LABEL, TYPE_STYLES, buildTypeCounts } from '../lib/categories'

const CATEGORY_ACCENT = {
  'Pre-Rolls':   'from-[#CDB4DB]/10 to-[#CDB4DB]/5 border-[#CDB4DB]/20',
  'FLOWER':      'from-[#9FD8A5]/10 to-[#9FD8A5]/5 border-[#9FD8A5]/20',
  'EDIBLES':     'from-[#F6BD60]/10 to-[#F6BD60]/5 border-[#F6BD60]/20',
  'Concentrate': 'from-[#F28482]/10 to-[#F28482]/5 border-[#F28482]/20',
  'VAPES':       'from-[#E8B86B]/10 to-[#E8B86B]/5 border-[#E8B86B]/20',
}

function CategoryTile({ category, label, count, active, onClick, compact }) {
  const glyph = CATEGORY_GLYPHS[category] || '•'
  const accent = CATEGORY_ACCENT[category] || 'from-paper/10 to-paper/5 border-paper/15'
  return (
    <button
      onClick={onClick}
      className={`group w-full text-left rounded-sm border transition-all ${compact ? 'p-2' : 'p-2.5'} flex items-center gap-3 bg-gradient-to-br ${accent} ${
        active
          ? 'ring-1 ring-accent-warm border-accent-warm/60'
          : 'hover:border-paper/30'
      }`}
    >
      <div className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} rounded-sm bg-indigo-950/40 flex items-center justify-center text-lg shrink-0`}>
        {glyph}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-paper truncate">{label}</div>
      </div>
      <div className="text-[10px] font-mono text-paper/40 tabular-nums shrink-0">
        {count}
      </div>
    </button>
  )
}

export default function Sidebar({ categories, filters, setFilters, brands, products = [], variant = 'desktop', onNavigate }) {
  const isAllProducts = filters.categories.length === 0
  const typeCounts = buildTypeCounts(products)

  const selectAllProducts = () => {
    setFilters({ ...filters, categories: [] })
    if (onNavigate) onNavigate()
  }

  const toggleCategory = (cat) => {
    const has = filters.categories.includes(cat)
    const next = has
      ? filters.categories.filter((c) => c !== cat)
      : [...filters.categories, cat]
    setFilters({ ...filters, categories: next })
  }

  const toggleBrand = (b) => {
    const active = filters.brands.includes(b)
    setFilters({
      ...filters,
      brands: active
        ? filters.brands.filter((x) => x !== b)
        : [...filters.brands, b],
    })
  }

  const toggleType = (t) => {
    const active = filters.types.includes(t)
    setFilters({
      ...filters,
      types: active
        ? filters.types.filter((x) => x !== t)
        : [...filters.types, t],
    })
  }

  const isMobile = variant === 'mobile'

  return (
    <aside className={`${isMobile ? 'w-full' : 'w-64 shrink-0 border-r border-paper/10'} bg-indigo-950/40 flex flex-col`}>
      {!isMobile && (
        <div className="px-4 pt-4 pb-3 border-b border-paper/10">
          <button onClick={() => { setFilters({ ...filters, categories: [], brands: [], types: [], q: '' }); onNavigate?.() }} className="block text-left w-full">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-paper leading-tight">
              Herban
            </h1>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/50">
              wholesale catalog
            </span>
          </button>
        </div>
      )}

      <div className={`${isMobile ? '' : 'overflow-y-auto'} flex-1 py-3`}>
        <div className="px-2 pb-2">
          <button
            onClick={selectAllProducts}
            className={`w-full text-left rounded-sm border transition-all p-2.5 flex items-center gap-3 ${
              isAllProducts
                ? 'ring-1 ring-accent-warm border-accent-warm/60 bg-paper/5'
                : 'border-paper/15 bg-paper/[0.02] hover:border-paper/30'
            }`}
          >
            <div className="w-10 h-10 rounded-sm bg-indigo-950/40 flex items-center justify-center text-lg shrink-0">
              📋
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-paper truncate">All products</div>
            </div>
            <div className="text-[10px] font-mono text-paper/40 tabular-nums shrink-0">
              {categories.reduce((sum, c) => sum + c.count, 0)}
            </div>
          </button>
        </div>

        <div className="px-2 space-y-1.5">
          {categories.map((c) => (
            <CategoryTile
              key={c.category}
              category={c.category}
              label={c.label}
              count={c.count}
              active={filters.categories.includes(c.category)}
              onClick={() => toggleCategory(c.category)}
            />
          ))}
        </div>

        <div className="px-4 pt-4 pb-3 border-t border-paper/10 mt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-paper/40">
              Filter by brand
            </span>
            {filters.brands.length > 0 && (
              <button
                onClick={() => setFilters({ ...filters, brands: [] })}
                className="text-[10px] text-paper/40 hover:text-paper underline-offset-2 hover:underline"
              >
                clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {brands.map((b) => {
              const active = filters.brands.includes(b)
              return (
                <button
                  key={b}
                  onClick={() => toggleBrand(b)}
                  className={`text-[11px] px-2 py-1 rounded-sm border transition-colors ${
                    active
                      ? 'bg-paper text-indigo-900 border-paper'
                      : 'bg-transparent text-paper/70 border-paper/15 hover:border-paper/40'
                  }`}
                >
                  {b}
                </button>
              )
            })}
          </div>
        </div>

        {/* ─── Filter by type (hybrid / indica / sativa / blend / cbd) ─── */}
        {/* Empty types array = "All" (default). Each pill uses its own type
             color (indica purple, sativa green, hybrid gold, blend neutral,
             cbd blue). Active pills show a ring; inactive show an outline.
             All 5 types always render, even with count=0 — keeps the filter
             layout stable as the catalog grows (e.g. CBD products coming). */}
        <div className="px-4 pt-4 pb-3 border-t border-paper/10 mt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-paper/40">
              Filter by type
            </span>
            {filters.types.length > 0 && (
              <button
                onClick={() => setFilters({ ...filters, types: [] })}
                className="text-[10px] text-paper/40 hover:text-paper underline-offset-2 hover:underline"
              >
                clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {typeCounts.map(({ type, label, count }) => {
              const active = filters.types.includes(type)
              const isEmpty = count === 0
              const s = TYPE_STYLES[type]
              // Empty-count pills get dimmed styling and are still clickable
              // (so users can pre-select before products exist in that type)
              return (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  disabled={isEmpty && !active}
                  className={`text-[11px] px-2 py-1 rounded-sm border transition-colors flex items-center gap-1.5 ${
                    active
                      ? `${s.bg} ${s.text} ${s.border} ring-1 ring-current`
                      : isEmpty
                      ? `bg-transparent ${s.text} ${s.border} opacity-30 cursor-not-allowed`
                      : `bg-transparent ${s.text} ${s.border} hover:bg-paper/5`
                  }`}
                >
                  <span>{label}</span>
                  <span className="text-[10px] text-paper/40 tabular-nums">{count}</span>
                </button>
              )
            })}
          </div>
        </div>

        {isMobile && (
          <div className="px-4 pt-4 pb-3 border-t border-paper/10 mt-3">
            <button
              onClick={onNavigate}
              className="w-full px-3 py-2 text-xs font-medium rounded-sm bg-accent-warm text-indigo-900"
            >
              Apply &amp; view products
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
