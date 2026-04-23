// Filter state → URL (shareable) + named views → localStorage.

const LS_VIEWS = 'herban.views.v3'
const LS_PREFS = 'herban.prefs.v3'
const LS_PRICES = 'herban.prices.v1'

export const DEFAULT_FILTERS = {
  q: '',
  // Multi-select: empty array = All Products. Array of category strings narrows down.
  categories: [],
  brands: [],        // secondary brand narrow-down
  types: [],         // product type filter: hybrid, indica, sativa, blend, cbd — empty = all
  sort: { key: 'curated', dir: 'asc' },
}

export function readFromURL() {
  if (typeof window === 'undefined') return DEFAULT_FILTERS
  const sp = new URLSearchParams(window.location.search)
  const f = { ...DEFAULT_FILTERS }
  if (sp.has('q'))   f.q = sp.get('q') || ''
  if (sp.has('cat')) f.categories = sp.get('cat').split(',').filter(Boolean)
  if (sp.has('b'))   f.brands = sp.get('b').split(',').filter(Boolean)
  if (sp.has('ty'))  f.types = sp.get('ty').split(',').filter(Boolean).map((s) => s.toLowerCase())
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
  if (filters.categories.length) sp.set('cat', filters.categories.join(','))
  if (filters.brands.length) sp.set('b', filters.brands.join(','))
  if (filters.types.length) sp.set('ty', filters.types.join(','))
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
