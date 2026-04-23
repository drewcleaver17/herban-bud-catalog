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

// ─── Strain type (hybrid / indica / sativa / blend) ───
// Traditional industry color conventions:
//   Indica  — purple spectrum (calming, nighttime association)
//   Sativa  — green (energizing, matches accent-green used elsewhere)
//   Hybrid  — gold (accent-warm, balanced, matches our brand accent)
//   Blend   — muted neutral (for mixed/multi-strain products like edibles)
//
// Not all products have a strain — edibles, tinctures, and some concentrates
// may be blends or unclassified. Blank/null strain renders as "—" in the table.
export const STRAIN_ORDER = ['hybrid', 'indica', 'sativa', 'blend']
export const STRAIN_LABEL = {
  hybrid: 'Hybrid',
  indica: 'Indica',
  sativa: 'Sativa',
  blend:  'Blend',
}

export const STRAIN_STYLES = {
  hybrid: {
    // Gold (accent-warm) — balanced between indica/sativa, matches brand accent
    text: 'text-accent-warm',
    bg:   'bg-accent-warm/10',
    border: 'border-accent-warm/30',
    label: 'Hybrid',
  },
  indica: {
    // Purple — traditional indica color; using a warm lavender that reads
    // clearly against the indigo background without clashing with Exotic tier
    text: 'text-[#C4A7E7]',
    bg:   'bg-[#C4A7E7]/10',
    border: 'border-[#C4A7E7]/30',
    label: 'Indica',
  },
  sativa: {
    // Green (accent-green) — traditional sativa color, matches our accent used
    // elsewhere for positive/active signals (GM% positive, ACH savings nudge)
    text: 'text-accent-green',
    bg:   'bg-accent-green/10',
    border: 'border-accent-green/30',
    label: 'Sativa',
  },
  blend: {
    // Muted neutral — not a specific strain family, doesn't need color
    text: 'text-paper/60',
    bg:   'bg-paper/5',
    border: 'border-paper/15',
    label: 'Blend',
  },
}

// Count products per strain for the sidebar filter. Only counts products that
// have a strain set; blanks/nulls are excluded from each strain bucket but
// still appear in the catalog when "All" is the active filter mode.
export function buildStrainCounts(products) {
  const counts = new Map()
  for (const p of products) {
    if (!p.strain) continue
    const key = String(p.strain).toLowerCase()
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  const result = []
  for (const strain of STRAIN_ORDER) {
    if (counts.has(strain)) {
      result.push({ strain, label: STRAIN_LABEL[strain], count: counts.get(strain) })
    }
  }
  return result
}
