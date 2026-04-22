// Minimal state serializer: we keep filter state in the URL (?q=...&b=...)
// so links are shareable, and we keep named views in localStorage.

const LS_VIEWS = 'herban.views.v1'
const LS_PREFS = 'herban.prefs.v1'

export const DEFAULT_FILTERS = {
  q: '',
  brands: [],       // [] = all
  categories: [],   // [] = all
  availability: 'all', // 'all' | 'available' | 'preorder' | 'discontinued'
  sort: { key: 'brand', dir: 'asc' },
  uom: 'pack',      // 'pack' | 'gram' | 'eighth' | 'oz'
}

export function readFromURL() {
  if (typeof window === 'undefined') return DEFAULT_FILTERS
  const sp = new URLSearchParams(window.location.search)
  const f = { ...DEFAULT_FILTERS }
  if (sp.has('q')) f.q = sp.get('q') || ''
  if (sp.has('b')) f.brands = sp.get('b').split(',').filter(Boolean)
  if (sp.has('c')) f.categories = sp.get('c').split(',').filter(Boolean)
  if (sp.has('av')) f.availability = sp.get('av') || 'all'
  if (sp.has('s')) {
    const [key, dir] = sp.get('s').split(':')
    if (key) f.sort = { key, dir: dir === 'desc' ? 'desc' : 'asc' }
  }
  if (sp.has('u')) f.uom = sp.get('u')
  return f
}

export function writeToURL(filters) {
  if (typeof window === 'undefined') return
  const sp = new URLSearchParams()
  if (filters.q) sp.set('q', filters.q)
  if (filters.brands.length) sp.set('b', filters.brands.join(','))
  if (filters.categories.length) sp.set('c', filters.categories.join(','))
  if (filters.availability !== 'all') sp.set('av', filters.availability)
  if (filters.sort.key !== DEFAULT_FILTERS.sort.key || filters.sort.dir !== 'asc') {
    sp.set('s', `${filters.sort.key}:${filters.sort.dir}`)
  }
  if (filters.uom !== 'pack') sp.set('u', filters.uom)
  const qs = sp.toString()
  const url = qs ? `?${qs}` : window.location.pathname
  window.history.replaceState(null, '', url)
}

export function loadViews() {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LS_VIEWS)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveViews(views) {
  try {
    localStorage.setItem(LS_VIEWS, JSON.stringify(views))
  } catch {
    /* quota or disabled — no-op */
  }
}

export function loadPrefs() {
  try {
    const raw = localStorage.getItem(LS_PREFS)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function savePrefs(prefs) {
  try {
    localStorage.setItem(LS_PREFS, JSON.stringify(prefs))
  } catch {
    /* ignore */
  }
}
