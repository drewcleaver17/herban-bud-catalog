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

// Dope Pros quality tiers + Core (FYRE/Groovy's baseline) + Live Rosin
// (premium craft edibles for Herban Bud / FYRE).
// Rank order (higher = better) for sorting. Live Rosin sits at 3 alongside
// Exotic because both are craft-tier offerings — slightly different
// categories but similar prestige level.
export const TIER_ORDER = ['Snowcaps', 'Exotic', 'Live Rosin', 'Premium', 'Core']
export const TIER_RANK = { 'Snowcaps': 4, 'Exotic': 3, 'Live Rosin': 3, 'Premium': 2, 'Core': 1 }

// Tier badge styling. Snowcaps is icy blue, Exotic is lavender,
// Live Rosin is warm amber/honey (evokes rosin itself — premium craft),
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
  'Live Rosin': {
    // Warm amber/honey — matches the resin color of actual live rosin extract
    text: 'text-[#E6A84B]',
    bg:   'bg-[#E6A84B]/10',
    border: 'border-[#E6A84B]/30',
    label: '✦ Live Rosin',
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

// ─── Product type (hybrid / indica / sativa / blend / cbd) ───
// Traditional industry color conventions:
//   Indica  — purple spectrum (calming, nighttime association)
//   Sativa  — green (energizing, matches accent-green used elsewhere)
//   Hybrid  — gold (accent-warm, balanced, matches our brand accent)
//   Blend   — muted neutral (for edibles / multi-strain products)
//   CBD     — blue (therapeutic, distinct from THC-dominant types)
//
// "Type" (not "strain") — strain implies specific cultivar like "OG Kush";
// these are effect-type categories that stay constant across harvests.
// Blank/null type renders as "—" in the table.
export const TYPE_ORDER = ['hybrid', 'indica', 'sativa', 'blend', 'cbd']
export const TYPE_LABEL = {
  hybrid: 'Hybrid',
  indica: 'Indica',
  sativa: 'Sativa',
  blend:  'Blend',
  cbd:    'CBD',
}

export const TYPE_STYLES = {
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
    // Muted neutral — for edibles, tinctures, multi-strain products
    text: 'text-paper/60',
    bg:   'bg-paper/5',
    border: 'border-paper/15',
    label: 'Blend',
  },
  cbd: {
    // Cool blue — therapeutic, distinct from all THC-dominant type colors
    text: 'text-[#7FB3D5]',
    bg:   'bg-[#7FB3D5]/10',
    border: 'border-[#7FB3D5]/30',
    label: 'CBD',
  },
}

// Count products per type for the sidebar filter. Returns ALL types in
// TYPE_ORDER (including those with count=0) so the filter UI always shows
// the full set of options, even before products exist in a given type.
export function buildTypeCounts(products) {
  const counts = new Map()
  for (const p of products) {
    if (!p.type) continue
    const key = String(p.type).toLowerCase()
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  return TYPE_ORDER.map((type) => ({
    type,
    label: TYPE_LABEL[type],
    count: counts.get(type) || 0,
  }))
}
