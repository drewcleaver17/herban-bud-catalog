// Filter state → URL (shareable) + named views → localStorage.

const LS_VIEWS = 'herban.views.v3'
const LS_PREFS = 'herban.prefs.v3'
const LS_PRICES = 'herban.prices.v1'

export const DEFAULT_FILTERS = {
  q: '',
  category: null,    // null = All Products; otherwise a category string
  brands: [],        // secondary brand narrow-down
  sort: { key: 'brand', dir: 'asc' },
}

export function readFromURL() {
  if (typeof window === 'undefined') return DEFAULT_FILTERS
  const sp = new URLSearchParams(window.location.search)
  const f = { ...DEFAULT_FILTERS }
  if (sp.has('q'))   f.q = sp.get('q') || ''
  if (sp.has('cat')) f.category = sp.get('cat') || null
  if (sp.has('b'))   f.brands = sp.get('b').split(',').filter(Boolean)
  if (sp.has('s')) {
    const [key, dir] = sp.get('s').split(':')
    if (key) f.sort = { key, dir: dir === 'desc' ? 'desc' : 'asc' }
  }
  return f
}

export function writeToURL(filters) {
  if (typeof window === 'undefined') return
  const sp = new URLSearchParams()
  if (filters.q)          sp.set('q', filters.q)
  if (filters.category)   sp.set('cat', filters.category)
  if (filters.brands.length) sp.set('b', filters.brands.join(','))
  if (filters.sort.key !== DEFAULT_FILTERS.sort.key || filters.sort.dir !== 'asc') {
    sp.set('s', `${filters.sort.key}:${filters.sort.dir}`)
  }
  const qs = sp.toString()
  const url = qs ? `?${qs}` : window.location.pathname
  window.history.replaceState(null, '', url)
}

export function loadViews() {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LS_VIEWS)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveViews(views) {
  try { localStorage.setItem(LS_VIEWS, JSON.stringify(views)) } catch {}
}

export function loadPrefs() {
  try {
    const raw = localStorage.getItem(LS_PREFS)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

export function savePrefs(prefs) {
  try { localStorage.setItem(LS_PREFS, JSON.stringify(prefs)) } catch {}
}

// Custom selling price overrides, persisted per product id.
export function loadBuyerPrices() {
  try {
    const raw = localStorage.getItem(LS_PRICES)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

export function saveBuyerPrices(prices) {
  try { localStorage.setItem(LS_PRICES, JSON.stringify(prices)) } catch {}
}
