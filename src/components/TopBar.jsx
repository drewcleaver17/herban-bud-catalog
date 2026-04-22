import { useState } from 'react'

export default function TopBar({
  filters,
  setFilters,
  views,
  onSaveView,
  onLoadView,
  onDeleteView,
  onShareURL,
  resultCount,
  activeLabel,
  rfqLineCount,
  onOpenRFQ,
}) {
  const [viewName, setViewName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  return (
    <div className="sticky top-0 z-20 bg-indigo-900/95 backdrop-blur border-b border-paper/10">
      <div className="flex flex-wrap items-center gap-3 px-5 py-3">
        <div className="flex items-baseline gap-2 shrink-0">
          <span className="font-mono text-2xs uppercase tracking-[0.18em] text-paper/50">
            viewing
          </span>
          <span className="font-display text-base text-paper">
            {activeLabel}
          </span>
          <span className="font-mono text-2xs text-paper/50 tabular-nums">
            · {resultCount}
          </span>
        </div>

        <div className="flex-1 min-w-[220px]">
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

          {/* RFQ button — prominent */}
          <button
            onClick={onOpenRFQ}
            className={`ml-2 px-3 py-1.5 text-xs font-medium rounded-sm transition-colors flex items-center gap-1.5 ${
              rfqLineCount > 0
                ? 'bg-accent-warm text-indigo-900 hover:bg-accent-warm/90'
                : 'bg-paper/10 text-paper hover:bg-paper/20'
            }`}
          >
            <span>RFQ</span>
            {rfqLineCount > 0 && (
              <span className="bg-indigo-900 text-accent-warm font-mono text-[10px] px-1.5 py-0.5 rounded-sm num">
                {rfqLineCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {showSaveDialog && (
        <div className="flex items-center gap-2 px-5 pb-3">
          <input
            autoFocus
            placeholder="View name (e.g., 'Dope Pros Pre-Rolls for ABC Smoke Shop')"
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
              <div className="absolute right-0 top-full mt-1 bg-indigo-800 border border-paper/15 rounded-sm p-2 min-w-[220px] z-30">
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
    </div>
  )
}
