// Curated "collections" — brand × category combos shown as thumbnails
// in the left sidebar, in Drew's priority order. Anything not listed
// here falls to the bottom in alphabetical order.

export const COLLECTION_ORDER = [
  { brand: 'Dope Pros',     category: 'Pre-Rolls',   label: 'Dope Pros — Pre-Rolls' },
  { brand: 'Dope Pros',     category: 'FLOWER',      label: 'Dope Pros — Flower' },
  { brand: 'Dope Pros',     category: 'SNOWCAPS',    label: 'Dope Pros — Snowcaps' },
  { brand: 'Dope Pros',     category: 'EDIBLES',     label: 'Dope Pros — Edibles' },
  { brand: 'Dope Pros',     category: 'Concentrate', label: 'Dope Pros — Concentrate' },
  { brand: 'Herban Bud',    category: 'EDIBLES',     label: 'Herban Bud — Edibles' },
  { brand: 'Herban Bud',    category: 'Pre-Rolls',   label: 'Herban Bud — Pre-Rolls' },
  { brand: 'Herban Bud',    category: 'FLOWER',      label: 'Herban Bud — Flower' },
  { brand: 'CaliGreenGold', category: 'Concentrate', label: 'CaliGreenGold — Concentrate' },
  { brand: 'FYRE',          category: 'FLOWER',      label: 'FYRE — Flower' },
  { brand: 'FYRE',          category: 'Pre-Rolls',   label: 'FYRE — Pre-Rolls' },
  { brand: 'FYRE',          category: 'VAPES',       label: 'FYRE — Vapes' },
  { brand: 'FYRE',          category: 'SNOWCAPS',    label: 'FYRE — Snowcaps' },
  { brand: 'FYRE',          category: 'EDIBLES',     label: 'FYRE — Edibles' },
  { brand: "Groovy's",      category: 'Pre-Rolls',   label: "Groovy's — Pre-Rolls" },
  { brand: "Groovy's",      category: 'FLOWER',      label: "Groovy's — Flower" },
  { brand: "Groovy's",      category: 'Concentrate', label: "Groovy's — Concentrate" },
]

// Build a key for brand×category lookup.
export const collectionKey = (brand, category) => `${brand}::${category}`

// Given the product list, return collections that actually exist,
// ordered by COLLECTION_ORDER, with product counts.
export function buildCollections(products) {
  const counts = new Map()
  for (const p of products) {
    const k = collectionKey(p.brand, p.category)
    counts.set(k, (counts.get(k) || 0) + 1)
  }

  const ranked = []
  const seen = new Set()

  // First: curated order
  for (const entry of COLLECTION_ORDER) {
    const k = collectionKey(entry.brand, entry.category)
    if (counts.has(k)) {
      ranked.push({ ...entry, key: k, count: counts.get(k) })
      seen.add(k)
    }
  }

  // Then: anything the curated list missed, alphabetical
  const orphans = []
  for (const p of products) {
    const k = collectionKey(p.brand, p.category)
    if (seen.has(k)) continue
    seen.add(k)
    orphans.push({
      brand: p.brand,
      category: p.category,
      label: `${p.brand} — ${p.category}`,
      key: k,
      count: counts.get(k),
    })
  }
  orphans.sort((a, b) => a.label.localeCompare(b.label))

  return [...ranked, ...orphans]
}

// Thumbnail glyph (emoji) per category. Keeps the sidebar scannable
// until real product photography replaces these.
export const CATEGORY_GLYPHS = {
  'Pre-Rolls':   '🚬',
  'FLOWER':      '🌿',
  'SNOWCAPS':    '❄️',
  'EDIBLES':     '🍬',
  'Concentrate': '💧',
  'VAPES':       '💨',
}
