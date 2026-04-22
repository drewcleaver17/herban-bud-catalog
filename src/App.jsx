import { useEffect, useMemo, useState } from 'react'
import sourceProducts from './data/products.json'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import ProductTable from './components/ProductTable'
import RFQDrawer from './components/RFQDrawer'
import AdminDrawer, { loadOverrides } from './components/AdminDrawer'
import {
  DEFAULT_FILTERS,
  loadBuyerPrices,
  loadViews,
  readFromURL,
  saveBuyerPrices,
  saveViews,
  writeToURL,
} from './lib/state'
import {
  EMPTY_RFQ,
  loadRFQ,
  readRFQFromURL,
  saveRFQ,
} from './lib/rfq'
import { buildCategoryCounts, CATEGORY_LABEL } from './lib/categories'

export default function App() {
  const [products, setProducts] = useState(() => loadOverrides() ?? sourceProducts)
  const [filters, setFilters] = useState(() => readFromURL())
  const [views, setViews] = useState(() => loadViews())
  const [buyerPrices, setBuyerPrices] = useState(() => loadBuyerPrices())

  // RFQ: URL params take priority (a shared link), else localStorage
  const [rfq, setRFQ] = useState(() => readRFQFromURL() ?? loadRFQ())
  const [rfqOpen, setRFQOpen] = useState(() => !!readRFQFromURL())

  const [adminOpen, setAdminOpen] = useState(false)

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

  useEffect(() => { writeToURL(filters) }, [filters])
  useEffect(() => { saveRFQ(rfq) }, [rfq])

  const brands = useMemo(
    () => [...new Set(products.map((p) => p.brand))].sort(),
    [products],
  )

  const categories = useMemo(() => buildCategoryCounts(products), [products])

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase()
    return products.filter((p) => {
      if (filters.category && p.category !== filters.category) return false
      if (filters.brands.length && !filters.brands.includes(p.brand)) return false
      if (q) {
        const hay = `${p.brand} ${p.category} ${p.sku} ${p.name} ${p.notes || ''} ${p.tier || ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [products, filters])

  const activeLabel = useMemo(() => {
    const catLabel = filters.category ? (CATEGORY_LABEL[filters.category] || filters.category) : null
    const brandLabel = filters.brands.length === 1
      ? filters.brands[0]
      : filters.brands.length > 1
      ? `${filters.brands.length} brands`
      : null
    if (catLabel && brandLabel) return `${catLabel} · ${brandLabel}`
    if (catLabel) return catLabel
    if (brandLabel) return brandLabel
    return 'All products'
  }, [filters.category, filters.brands])

  const rfqLineCount = useMemo(
    () => Object.values(rfq.cart).filter((q) => q > 0).length,
    [rfq.cart],
  )

  const setQty = (productId, qty) => {
    setRFQ((prev) => {
      const nextCart = { ...prev.cart }
      if (qty > 0) nextCart[productId] = qty
      else delete nextCart[productId]
      return { ...prev, cart: nextCart }
    })
  }

  const setBuyerPrice = (id, price) => {
    const next = { ...buyerPrices }
    if (price == null) delete next[id]
    else next[id] = price
    setBuyerPrices(next)
    saveBuyerPrices(next)
  }

  const updateContact = (field, value) => {
    setRFQ((prev) => ({ ...prev, contact: { ...prev.contact, [field]: value } }))
  }

  const clearRFQ = () => setRFQ({ ...EMPTY_RFQ, contact: { ...EMPTY_RFQ.contact } })

  const handleSaveView = (name) => {
    const next = [...views.filter((v) => v.name !== name), { name, filters: { ...filters } }]
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
      toast('Link copied')
    } catch {
      prompt('Copy this link:', window.location.href)
    }
  }

  return (
    <div className="min-h-full flex">
      <Sidebar
        categories={categories}
        filters={filters}
        setFilters={setFilters}
        brands={brands}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          filters={filters}
          setFilters={setFilters}
          views={views}
          onSaveView={handleSaveView}
          onLoadView={handleLoadView}
          onDeleteView={handleDeleteView}
          onShareURL={handleShareURL}
          resultCount={filtered.length}
          activeLabel={activeLabel}
          rfqLineCount={rfqLineCount}
          onOpenRFQ={() => setRFQOpen(true)}
        />

        <main className="flex-1">
          <ProductTable
            products={filtered}
            filters={filters}
            setFilters={setFilters}
            cart={rfq.cart}
            setQty={setQty}
            buyerPrices={buyerPrices}
            setBuyerPrice={setBuyerPrice}
          />
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
      </div>

      <RFQDrawer
        open={rfqOpen}
        onClose={() => setRFQOpen(false)}
        products={products}
        rfq={rfq}
        setQty={setQty}
        updateContact={updateContact}
        onClearRFQ={clearRFQ}
        buyerPrices={buyerPrices}
      />

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

function toast(msg) {
  const el = document.createElement('div')
  el.textContent = msg
  el.className =
    'fixed bottom-6 left-1/2 -translate-x-1/2 bg-paper text-indigo-900 px-4 py-2 rounded-sm font-medium text-xs z-50 shadow-lg'
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 1400)
}
