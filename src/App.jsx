import { useEffect, useMemo, useState } from 'react'
import sourceProducts from './data/products.json'
import FilterBar from './components/FilterBar'
import ProductTable from './components/ProductTable'
import AdminDrawer, { loadOverrides } from './components/AdminDrawer'
import {
  DEFAULT_FILTERS,
  loadViews,
  readFromURL,
  saveViews,
  writeToURL,
} from './lib/state'

export default function App() {
  // Products: source-of-truth is src/data/products.json. If admin has made
  // unpublished local edits we prefer those (they preview live).
  const [products, setProducts] = useState(() => loadOverrides() ?? sourceProducts)
  const [filters, setFilters] = useState(() => readFromURL())
  const [views, setViews] = useState(() => loadViews())
  const [adminOpen, setAdminOpen] = useState(false)

  // Detect admin entry: ?admin=1 on URL, or Cmd/Ctrl+Shift+E
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    if (sp.get('admin') === '1') setAdminOpen(true)
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault()
        setAdminOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Sync filter state to URL
  useEffect(() => {
    writeToURL(filters)
  }, [filters])

  const brands = useMemo(
    () => [...new Set(products.map((p) => p.brand))].sort(),
    [products],
  )
  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category))].sort(),
    [products],
  )

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase()
    return products.filter((p) => {
      if (filters.brands.length && !filters.brands.includes(p.brand)) return false
      if (filters.categories.length && !filters.categories.includes(p.category)) return false
      if (filters.availability !== 'all' && p.availability !== filters.availability) return false
      if (q) {
        const hay = `${p.brand} ${p.category} ${p.sku} ${p.notes || ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [products, filters])

  const handleSaveView = (name) => {
    const next = [
      ...views.filter((v) => v.name !== name),
      { name, filters: { ...filters } },
    ]
    setViews(next)
    saveViews(next)
  }

  const handleLoadView = (name) => {
    const view = views.find((v) => v.name === name)
    if (view) setFilters({ ...DEFAULT_FILTERS, ...view.filters })
  }

  const handleDeleteView = (name) => {
    const next = views.filter((v) => v.name !== name)
    setViews(next)
    saveViews(next)
  }

  const handleShareURL = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      // Brief affordance without a toast library
      const el = document.createElement('div')
      el.textContent = 'Link copied'
      el.className =
        'fixed bottom-6 left-1/2 -translate-x-1/2 bg-paper text-indigo-900 px-4 py-2 rounded-sm font-medium text-xs z-50 shadow-lg'
      document.body.appendChild(el)
      setTimeout(() => el.remove(), 1400)
    } catch {
      prompt('Copy this link:', window.location.href)
    }
  }

  return (
    <div className="min-h-full flex flex-col">
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        brands={brands}
        categories={categories}
        views={views}
        onSaveView={handleSaveView}
        onLoadView={handleLoadView}
        onDeleteView={handleDeleteView}
        onShareURL={handleShareURL}
        resultCount={filtered.length}
      />

      <main className="flex-1">
        <ProductTable products={filtered} filters={filters} setFilters={setFilters} />
      </main>

      <footer className="px-5 py-4 border-t border-paper/10 flex items-center justify-between text-2xs font-mono text-paper/40">
        <span>
          {products.length} SKUs · {brands.length} brands ·{' '}
          <span className="text-paper/50">bud.drewcleaver.com</span>
        </span>
        <span>
          Prices subject to change. Contact Drew for current availability.
        </span>
      </footer>

      <AdminDrawer
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
        products={products}
        setProducts={setProducts}
        originalProducts={sourceProducts}
      />
    </div>
  )
}
