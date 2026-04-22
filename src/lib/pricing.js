// Pricing math lives here so the UI stays dumb.
// Every product in products.json has: wholesale, msrp, grams (nullable).

const GRAMS_PER_EIGHTH = 3.5
const GRAMS_PER_OZ = 28

// Products where the source MSRP is obviously mis-keyed (per-unit value
// entered where pack MSRP was expected). We still display the raw value
// but flag it so Drew fixes upstream.
export function msrpLooksBroken(p) {
  if (p.msrp == null || p.wholesale == null) return false
  // MSRP below wholesale is non-physical at retail (would be a loss).
  return p.msrp < p.wholesale
}

export function perGram(amount, grams) {
  if (amount == null || !grams) return null
  return amount / grams
}

export function gmPerGram(p) {
  if (p.msrp == null || p.wholesale == null || !p.grams) return null
  return (p.msrp - p.wholesale) / p.grams
}

export function gmPercent(p) {
  if (p.msrp == null || p.wholesale == null || p.msrp === 0) return null
  if (msrpLooksBroken(p)) return null
  return (p.msrp - p.wholesale) / p.msrp
}

// UOM conversion for the toggle
export function convertPrice(amountPerUnit, grams, uom) {
  // amountPerUnit is the pack price; we express it in the chosen unit
  if (amountPerUnit == null) return null
  if (uom === 'pack') return amountPerUnit
  if (!grams) return null
  if (uom === 'gram') return amountPerUnit / grams
  if (uom === 'eighth') return (amountPerUnit / grams) * GRAMS_PER_EIGHTH
  if (uom === 'oz') return (amountPerUnit / grams) * GRAMS_PER_OZ
  return amountPerUnit
}

export function formatMoney(n, digits = 2) {
  if (n == null || Number.isNaN(n)) return '—'
  return `$${n.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`
}

export function formatPercent(n, digits = 1) {
  if (n == null || Number.isNaN(n)) return '—'
  return `${(n * 100).toFixed(digits)}%`
}

export function formatGrams(g) {
  if (g == null) return '—'
  if (g >= GRAMS_PER_OZ) {
    const oz = g / GRAMS_PER_OZ
    return `${oz % 1 === 0 ? oz.toFixed(0) : oz.toFixed(2)}oz`
  }
  if (g % 1 === 0) return `${g.toFixed(0)}g`
  return `${g}g`
}
