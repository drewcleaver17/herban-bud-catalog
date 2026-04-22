import { CATEGORY_GLYPHS, CATEGORY_LABEL } from '../lib/categories'

const CATEGORY_ACCENT = {
  'Pre-Rolls':   'from-[#CDB4DB]/10 to-[#CDB4DB]/5 border-[#CDB4DB]/20',
  'FLOWER':      'from-[#9FD8A5]/10 to-[#9FD8A5]/5 border-[#9FD8A5]/20',
  'EDIBLES':     'from-[#F6BD60]/10 to-[#F6BD60]/5 border-[#F6BD60]/20',
  'Concentrate': 'from-[#F28482]/10 to-[#F28482]/5 border-[#F28482]/20',
  'VAPES':       'from-[#E8B86B]/10 to-[#E8B86B]/5 border-[#E8B86B]/20',
}

function CategoryTile({ category, label, count, active, onClick }) {
  const glyph = CATEGORY_GLYPHS[category] || '•'
  const accent = CATEGORY_ACCENT[category] || 'from-paper/10 to-paper/5 border-paper/15'
  return (
    <button
      onClick={onClick}
      className={`group w-full text-left rounded-sm border transition-all p-2.5 flex items-center gap-3 bg-gradient-to-br ${accent} ${
        active
          ? 'ring-1 ring-accent-warm border-accent-warm/60'
          : 'hover:border-paper/30'
      }`}
    >
      <div className="w-10 h-10 rounded-sm bg-indigo-950/40 flex items-center justify-center text-lg shrink-0">
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

export default function Sidebar({ categories, filters, setFilters, brands }) {
  const clearCategory = () => setFilters({ ...filters, category: null })

  return (
    <aside className="w-64 shrink-0 border-r border-paper/10 bg-indigo-950/40 flex flex-col">
      <div className="px-4 pt-4 pb-3 border-b border-paper/10">
        <button onClick={() => setFilters({ ...filters, category: null, brands: [], q: '' })} className="block text-left w-full">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-paper leading-tight">
            Herban
          </h1>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/50">
            wholesale catalog
          </span>
        </button>
      </div>

      <div className="overflow-y-auto flex-1 py-3">
        <div className="px-2 pb-2">
          <button
            onClick={clearCategory}
            className={`w-full text-left rounded-sm border transition-all p-2.5 flex items-center gap-3 ${
              filters.category === null
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
              active={filters.category === c.category}
              onClick={() =>
                setFilters({
                  ...filters,
                  category: filters.category === c.category ? null : c.category,
                })
              }
            />
          ))}
        </div>

        {/* Secondary brand filter */}
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
                  onClick={() =>
                    setFilters({
                      ...filters,
                      brands: active
                        ? filters.brands.filter((x) => x !== b)
                        : [...filters.brands, b],
                    })
                  }
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
      </div>
    </aside>
  )
}
