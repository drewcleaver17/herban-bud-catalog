import { useEffect, useState } from 'react'

// Admin is client-side only: it edits a working copy in localStorage,
// preserves the original products.json from build, and exports a new
// products.json that Drew commits back to the repo. No auth, no backend,
// no customer ever sees this unless they know the shortcut.

const LS_OVERRIDES = 'herban.admin.overrides.v1'

export function loadOverrides() {
  try {
    const raw = localStorage.getItem(LS_OVERRIDES)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveOverrides(products) {
  localStorage.setItem(LS_OVERRIDES, JSON.stringify(products))
}

export function clearOverrides() {
  localStorage.removeItem(LS_OVERRIDES)
}

function EditRow({ product, onChange, onDelete }) {
  const up = (field, value) => onChange({ ...product, [field]: value })
  const num = (v) => (v === '' || v == null ? null : Number(v))
  return (
    <tr className="border-b border-paper/10">
      <td className="p-1">
        <input
          value={product.brand}
          onChange={(e) => up('brand', e.target.value)}
          className="w-28 bg-indigo-900/60 border border-paper/10 rounded-sm px-1.5 py-1 text-2xs text-paper"
        />
      </td>
      <td className="p-1">
        <input
          value={product.category}
          onChange={(e) => up('category', e.target.value)}
          className="w-24 bg-indigo-900/60 border border-paper/10 rounded-sm px-1.5 py-1 text-2xs text-paper"
        />
      </td>
      <td className="p-1">
        <input
          value={product.sku}
          onChange={(e) => up('sku', e.target.value)}
          className="w-36 bg-indigo-900/60 border border-paper/10 rounded-sm px-1.5 py-1 text-2xs text-paper font-mono"
          placeholder="SKU code"
        />
      </td>
      <td className="p-1">
        <input
          value={product.name ?? ''}
          onChange={(e) => up('name', e.target.value)}
          className="w-full bg-indigo-900/60 border border-paper/10 rounded-sm px-1.5 py-1 text-2xs text-paper"
          placeholder="Display name"
        />
      </td>
      <td className="p-1">
        <input
          type="number"
          step="0.1"
          value={product.grams ?? ''}
          onChange={(e) => up('grams', num(e.target.value))}
          className="w-16 bg-indigo-900/60 border border-paper/10 rounded-sm px-1.5 py-1 text-2xs text-paper text-right num"
        />
      </td>
      <td className="p-1">
        <input
          type="number"
          step="0.01"
          value={product.wholesale ?? ''}
          onChange={(e) => up('wholesale', num(e.target.value))}
          className="w-20 bg-indigo-900/60 border border-paper/10 rounded-sm px-1.5 py-1 text-2xs text-paper text-right num"
        />
      </td>
      <td className="p-1">
        <input
          type="number"
          step="0.01"
          value={product.msrp ?? ''}
          onChange={(e) => up('msrp', num(e.target.value))}
          className="w-20 bg-indigo-900/60 border border-paper/10 rounded-sm px-1.5 py-1 text-2xs text-paper text-right num"
        />
      </td>
      <td className="p-1">
        <select
          value={product.tier ?? ''}
          onChange={(e) => up('tier', e.target.value || null)}
          className="bg-indigo-900/60 border border-paper/10 rounded-sm px-1.5 py-1 text-2xs text-paper"
        >
          <option value="">—</option>
          <option value="Snowcaps">Snowcaps</option>
          <option value="Exotic">Exotic</option>
          <option value="Premium">Premium</option>
        </select>
      </td>
      <td className="p-1">
        <input
          value={product.notes ?? ''}
          onChange={(e) => up('notes', e.target.value)}
          className="w-full bg-indigo-900/60 border border-paper/10 rounded-sm px-1.5 py-1 text-2xs text-paper"
          placeholder="flavors, etc."
        />
      </td>
      <td className="p-1">
        <button
          onClick={onDelete}
          className="px-2 py-1 text-2xs text-accent-red/80 hover:text-accent-red"
        >
          ✕
        </button>
      </td>
    </tr>
  )
}

export default function AdminDrawer({ open, onClose, products, setProducts, originalProducts }) {
  const [dirty, setDirty] = useState(false)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    if (open) setShowBanner(true)
  }, [open])

  const updateProduct = (updated) => {
    setProducts(products.map((p) => (p.id === updated.id ? updated : p)))
    saveOverrides(products.map((p) => (p.id === updated.id ? updated : p)))
    setDirty(true)
  }

  const deleteProduct = (id) => {
    if (!confirm('Delete this product?')) return
    const next = products.filter((p) => p.id !== id)
    setProducts(next)
    saveOverrides(next)
    setDirty(true)
  }

  const addProduct = () => {
    const maxId = products.reduce((m, p) => Math.max(m, p.id), 0)
    const next = [
      ...products,
      {
        id: maxId + 1,
        brand: 'Herban Bud',
        category: 'FLOWER',
        sku: 'HB-FLW-NEW',
        name: 'New product',
        grams: null,
        wholesale: null,
        msrp: null,
        notes: '',
        availability: 'available',
        tier: null,
      },
    ]
    setProducts(next)
    saveOverrides(next)
    setDirty(true)
  }

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(products, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'products.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const resetToSource = () => {
    if (!confirm('Discard all local edits and reset to the version shipped with the site?')) return
    clearOverrides()
    setProducts(originalProducts)
    setDirty(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-indigo-950/95 backdrop-blur-sm overflow-y-auto">
      <div className="sticky top-0 bg-indigo-900 border-b border-paper/15 px-5 py-3 flex items-center gap-3 z-10">
        <h2 className="font-display text-xl text-paper">Product editor</h2>
        <span className="font-mono text-2xs uppercase tracking-wider text-accent-warm">
          admin
        </span>
        <span className="text-2xs text-paper/50 ml-2">
          {products.length} products · edits stored locally
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={addProduct}
            className="px-3 py-1.5 text-2xs font-medium rounded-sm bg-paper/10 text-paper hover:bg-paper/20"
          >
            + Add row
          </button>
          <button
            onClick={resetToSource}
            className="px-3 py-1.5 text-2xs font-medium rounded-sm border border-paper/15 text-paper/70 hover:text-paper hover:border-paper/40"
          >
            Reset
          </button>
          <button
            onClick={exportJSON}
            className="px-3 py-1.5 text-2xs font-medium rounded-sm bg-accent-warm text-indigo-900 hover:bg-accent-warm/90"
          >
            Export products.json
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-2xs text-paper/70 hover:text-paper"
          >
            Close
          </button>
        </div>
      </div>

      {showBanner && (
        <div className="mx-5 mt-4 p-3 bg-accent-warm/10 border border-accent-warm/30 rounded-sm text-xs text-paper">
          <div className="flex items-start gap-2">
            <span className="text-accent-warm">ⓘ</span>
            <div className="flex-1">
              Edits save to your browser immediately so you can preview them live (close this drawer to see). To publish:
              click <strong>Export products.json</strong>, then commit the downloaded file to <span className="font-mono text-2xs">src/data/products.json</span> in the repo.
            </div>
            <button onClick={() => setShowBanner(false)} className="text-paper/50 hover:text-paper">✕</button>
          </div>
        </div>
      )}

      <div className="p-5">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-2xs font-mono uppercase tracking-wider text-paper/50">
              <th className="p-1">Brand</th>
              <th className="p-1">Category</th>
              <th className="p-1">SKU</th>
              <th className="p-1">Name</th>
              <th className="p-1 text-right">Grams</th>
              <th className="p-1 text-right">Wholesale</th>
              <th className="p-1 text-right">MSRP</th>
              <th className="p-1">Tier</th>
              <th className="p-1">Notes</th>
              <th className="p-1 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <EditRow
                key={p.id}
                product={p}
                onChange={updateProduct}
                onDelete={() => deleteProduct(p.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
