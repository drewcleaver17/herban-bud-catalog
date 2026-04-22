// Category-first navigation. Brand is now a secondary filter.
// Order matters: this is Drew's priority order for the sidebar.

export const CATEGORY_ORDER = [
  'Pre-Rolls',
  'FLOWER',
  'EDIBLES',
  'Concentrate',
  'VAPES',
]

export const CATEGORY_LABEL = {
  'Pre-Rolls':   'Pre-Rolls',
  'FLOWER':      'Flower',
  'EDIBLES':     'Edibles',
  'Concentrate': 'Concentrate',
  'VAPES':       'Vapes',
}

export const CATEGORY_GLYPHS = {
  'Pre-Rolls':   '🚬',
  'FLOWER':      '🌿',
  'EDIBLES':     '🍬',
  'Concentrate': '💧',
  'VAPES':       '💨',
}

// Dope Pros quality tiers + Core (FYRE/Groovy's baseline).
// Rank order (higher = better) for sorting.
export const TIER_ORDER = ['Snowcaps', 'Exotic', 'Premium', 'Core']
export const TIER_RANK = { 'Snowcaps': 4, 'Exotic': 3, 'Premium': 2, 'Core': 1 }

// Tier badge styling. Snowcaps is icy blue, Exotic is lavender,
// Premium is neutral, Core is the most muted (baseline offering).
export const TIER_STYLES = {
  'Snowcaps': {
    text: 'text-[#A9D6E5]',
    bg:   'bg-[#A9D6E5]/10',
    border: 'border-[#A9D6E5]/30',
    label: '❄ Snowcaps',
  },
  'Exotic': {
    text: 'text-[#CDB4DB]',
    bg:   'bg-[#CDB4DB]/10',
    border: 'border-[#CDB4DB]/30',
    label: 'Exotic',
  },
  'Premium': {
    text: 'text-paper/70',
    bg:   'bg-paper/5',
    border: 'border-paper/15',
    label: 'Premium',
  },
  'Core': {
    text: 'text-paper/50',
    bg:   'bg-paper/[0.02]',
    border: 'border-paper/10',
    label: 'Core',
  },
}

// Count products per category (respecting whatever list is passed in).
export function buildCategoryCounts(products) {
  const counts = new Map()
  for (const p of products) {
    counts.set(p.category, (counts.get(p.category) || 0) + 1)
  }
  // Return in curated order; orphan categories appended at end
  const result = []
  const seen = new Set()
  for (const cat of CATEGORY_ORDER) {
    if (counts.has(cat)) {
      result.push({ category: cat, label: CATEGORY_LABEL[cat] || cat, count: counts.get(cat) })
      seen.add(cat)
    }
  }
  for (const [cat, count] of counts) {
    if (!seen.has(cat)) {
      result.push({ category: cat, label: cat, count })
    }
  }
  return result
}
