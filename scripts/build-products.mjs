#!/usr/bin/env node
// Build script: reads data/products.csv → writes src/data/products.json.
// Runs during GitHub Actions deploy (see .github/workflows/deploy.yml)
// and can also be run locally via `npm run build:data`.
//
// Fails the build loudly if the CSV has schema problems, so bad data
// never reaches production.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const CSV_PATH = path.join(ROOT, 'data', 'products.csv')
const JSON_PATH = path.join(ROOT, 'src', 'data', 'products.json')

const REQUIRED_COLUMNS = [
  'id', 'sortRank', 'brand', 'category', 'tier', 'sku', 'name',
  'grams', 'wholesale', 'msrp', 'availability', 'notes', 'strain_type',
]

const VALID_CATEGORIES = new Set(['Pre-Rolls', 'FLOWER', 'EDIBLES', 'Concentrate', 'VAPES'])
const VALID_TIERS       = new Set(['Snowcaps', 'Exotic', 'Premium', 'Core', ''])
const VALID_AVAILABILITY = new Set(['available', 'preorder', 'unavailable', 'discontinued', ''])
// strain_type is lowercased before validation; blank is allowed because not
// every product has a strain classification (e.g. edibles, blends, tinctures).
const VALID_STRAINS = new Set(['hybrid', 'indica', 'sativa', 'blend', ''])

// Minimal CSV parser that handles quoted fields with embedded commas and quotes.
// Good enough for the Google Sheets CSV export format. If the CSV grows more
// exotic (multi-line cells, etc.) swap for `papaparse`.
function parseCSV(text) {
  const rows = []
  let cur = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') inQuotes = false
      else field += c
    } else {
      if (c === '"') inQuotes = true
      else if (c === ',') { cur.push(field); field = '' }
      else if (c === '\r') { /* skip */ }
      else if (c === '\n') { cur.push(field); rows.push(cur); cur = []; field = '' }
      else field += c
    }
  }
  if (field.length > 0 || cur.length > 0) { cur.push(field); rows.push(cur) }
  return rows.filter((r) => r.length > 0 && !(r.length === 1 && r[0] === ''))
}

function toNum(v) {
  if (v === '' || v == null) return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

function toStringOrNull(v) {
  if (v === '' || v == null) return null
  return String(v).trim()
}

function die(msg) {
  console.error(`\n❌ BUILD FAILED\n   ${msg}\n`)
  process.exit(1)
}

function main() {
  if (!fs.existsSync(CSV_PATH)) die(`CSV not found at ${CSV_PATH}`)
  const text = fs.readFileSync(CSV_PATH, 'utf8')
  const rows = parseCSV(text)
  if (rows.length < 2) die('CSV has no data rows.')

  const header = rows[0].map((h) => h.trim())
  const missing = REQUIRED_COLUMNS.filter((c) => !header.includes(c))
  if (missing.length) die(`CSV missing required columns: ${missing.join(', ')}`)

  const idx = Object.fromEntries(REQUIRED_COLUMNS.map((c) => [c, header.indexOf(c)]))
  const products = []
  const seenIds = new Set()
  const seenSKUs = new Set()
  const errors = []

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]
    if (row.every((f) => f === '')) continue  // blank row
    const lineNum = r + 1  // human line number

    const id       = toNum(row[idx.id])
    const sortRank = toNum(row[idx.sortRank])
    const brand    = (row[idx.brand] || '').trim()
    const category = (row[idx.category] || '').trim()
    const tier     = (row[idx.tier] || '').trim()
    const sku      = (row[idx.sku] || '').trim()
    const name     = (row[idx.name] || '').trim()
    const grams    = toNum(row[idx.grams])
    const wholesale = toNum(row[idx.wholesale])
    const msrp     = toNum(row[idx.msrp])
    const availability = (row[idx.availability] || '').trim()
    const notes    = (row[idx.notes] || '').trim()
    // Strain type is normalized to lowercase before validation + storage so
    // "Hybrid" / "HYBRID" / "hybrid" in the CSV all become "hybrid" in JSON.
    const strainRaw = (row[idx.strain_type] || '').trim()
    const strain    = strainRaw.toLowerCase()

    // Validations — collect all errors before bailing, so one build surfaces
    // everything wrong at once instead of whack-a-mole.
    if (id == null)       errors.push(`Line ${lineNum}: missing/invalid id`)
    else if (seenIds.has(id)) errors.push(`Line ${lineNum}: duplicate id ${id}`)
    else seenIds.add(id)

    if (!brand)    errors.push(`Line ${lineNum}: missing brand`)
    if (!category) errors.push(`Line ${lineNum}: missing category`)
    else if (!VALID_CATEGORIES.has(category))
      errors.push(`Line ${lineNum}: invalid category "${category}" (valid: ${[...VALID_CATEGORIES].join(', ')})`)

    if (!VALID_TIERS.has(tier))
      errors.push(`Line ${lineNum}: invalid tier "${tier}" (valid: Snowcaps, Exotic, Premium, Core, or blank)`)

    if (!sku) errors.push(`Line ${lineNum}: missing sku`)
    else if (seenSKUs.has(sku)) errors.push(`Line ${lineNum}: duplicate sku "${sku}"`)
    else seenSKUs.add(sku)

    if (!name) errors.push(`Line ${lineNum}: missing name`)

    if (availability && !VALID_AVAILABILITY.has(availability))
      errors.push(`Line ${lineNum}: invalid availability "${availability}" (valid: available, preorder, unavailable, discontinued)`)

    if (!VALID_STRAINS.has(strain))
      errors.push(`Line ${lineNum}: invalid strain_type "${strainRaw}" (valid: hybrid, indica, sativa, blend, or blank)`)

    products.push({
      id,
      sortRank: sortRank ?? 9999,
      brand,
      category,
      tier: tier || null,
      sku,
      name,
      grams,
      wholesale,
      msrp,
      availability: availability || 'available',
      notes,
      strain: strain || null,
    })
  }

  if (errors.length) {
    console.error(`\n❌ BUILD FAILED — ${errors.length} error(s) in ${CSV_PATH}:\n`)
    for (const e of errors) console.error(`   ${e}`)
    console.error('')
    process.exit(1)
  }

  // Sort by sortRank for stable output (optional but makes diffs cleaner)
  products.sort((a, b) => (a.sortRank - b.sortRank) || (a.id - b.id))

  fs.mkdirSync(path.dirname(JSON_PATH), { recursive: true })
  fs.writeFileSync(JSON_PATH, JSON.stringify(products, null, 2) + '\n', 'utf8')
  console.log(`✅ Wrote ${products.length} products to ${path.relative(ROOT, JSON_PATH)}`)
}

main()
