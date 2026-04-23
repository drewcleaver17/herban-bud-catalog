# Herban Bud — SKU Naming Convention (Path C)

This document is the authoritative reference for how Herban Bud SKUs are constructed and read. Every SKU in the catalog follows this scheme. Keep it consistent across Shopify, Quickbooks, warehouse pick lists, RFQs, and 3PL labeling.

## Quick read

A SKU like **`DP-FLW-EXO-3.5G`** decodes as:

| Segment | Value | Meaning |
|---|---|---|
| `DP` | Brand | Dope Pros |
| `FLW` | Category | Flower |
| `EXO` | Tier | Exotic |
| `3.5G` | Size | 3.5 grams |

A SKU like **`HB-ED-CAR-125X20MG-TUB`** decodes as:

| Segment | Value | Meaning |
|---|---|---|
| `HB` | Brand | Herban Bud |
| `ED` | Category | Edibles |
| `CAR` | Form | Caramels |
| `125X20MG` | Count × dose | 125 pieces, 20mg each |
| `TUB` | Packaging | Plastic tub |

## Universal rules

1. **Segments are separated by hyphens.** Never spaces, never underscores, never dots inside segments.
2. **All-uppercase, ASCII only.** No special characters.
3. **Sizes always carry a unit suffix.** `3.5G`, `1OZ`, `30MG`, `2G` — never bare numbers.
4. **`X` always means "count × size per unit."** `5X0.7G` = 5 prerolls of 0.7g each. `15X20MG` = 15 caramels at 20mg each. `1X1.5G` for singles, for consistency.
5. **Packaging marker (`-TUB`, `-JAR`, `-MYL`, `-DIS`, `-CART`, `-RSN`) goes at the end** when meaningful and not implied by the form.
6. **Tier slot is always present** for every brand, even single-tier brands (use `-COR` for FYRE/Groovy's). This keeps the slot-position consistent across all SKUs.

## Per-category schemas

Each category has its own slot pattern. Within a category, the schema is fixed.

### Pre-Rolls — `{BRAND}-PR-{TIER}-{COUNT}X{SIZE}[-PACKAGING]`

Examples:
- `DP-PR-EXO-1X1.5G` — Dope Pros, Exotic single preroll, 1.5g
- `DP-PR-PRM-30X1.5G-TUB` — Dope Pros, Premium 30-pack tub, 1.5g each
- `GRV-PR-COR-1X2G-RSN` — Groovy's rosin-infused preroll, 2g
- `HB-PR-1X1.5G` — Herban Bud single preroll, 1.5g (no tier — use `1X` notation always)

Notes:
- Herban Bud pre-rolls have no tier segment (HB has no tier system at all)
- The `-RSN` suffix marks rosin-infused pre-rolls (distinct from regular flower-only)

### Flower — `{BRAND}-FLW-{TIER}-{SIZE}[-PACKAGING]`

Examples:
- `DP-FLW-SNO-3.5G` — Dope Pros, Snowcaps tier, 3.5g eighth
- `DP-FLW-EXO-1OZ` — Dope Pros, Exotic, 1 ounce
- `GRV-FLW-COR-3.5G-MYL` — Groovy's, Core, 3.5g in mylar bag
- `DP-FLW-PRM-28X1G-TUB` — Dope Pros, Premium, 28 of 1g each in a tub

Notes:
- Use `1OZ` instead of `28G` because the industry trades ounces, not 28g portions
- Multi-pack tubs use `NX1G-TUB` notation (always 1g per unit in flower tubs)

### Edibles — `{BRAND}-ED-{FORM}-{COUNT}X{DOSE}[-PACKAGING]`

Examples:
- `HB-ED-GUM-10X30MG` — Herban Bud, gummies, 10 pieces × 30mg
- `HB-ED-CAR-125X20MG-TUB` — Herban Bud, caramels, 125 pieces × 20mg in tub
- `DP-ED-GUM-10X30MG` — Dope Pros, gummies (no tier — DP edibles aren't tiered)

Notes:
- Edibles have no tier slot — only Form (gummies vs caramels vs taffy etc.)
- Dose is always `MG` per piece, not total mg

### Concentrates — `{BRAND}-CON-{TIER}-{TYPE}-{SIZE}` or `{BRAND}-CON-{TYPE}-{SIZE}` (CGG)

Examples:
- `CGG-CON-TCA-3G` — CaliGreenGold, THCa concentrate, 3g (CGG has no tier — uses `BRAND-CON-TYPE-SIZE`)
- `GRV-CON-COR-ROS-1G` — Groovy's, Core tier, Rosin, 1g

Notes:
- CaliGreenGold concentrates skip the tier slot (CGG has no tier system)
- Groovy's concentrates carry the `-COR` tier for parallelism with their other lines

### Vapes — `{BRAND}-VAP-{TIER}-{FORM}-{COUNT}X{SIZE}`

Examples:
- `FYR-VAP-COR-DIS-5X2G` — FYRE, Core, Disposable, 5-pack of 2g vapes

Notes:
- Form marker required: `DIS` (disposable), `CART` (cartridge — not currently in catalog)

## Code lookups

### Brand codes (2-3 letters)
- `DP` — Dope Pros
- `HB` — Herban Bud
- `FYR` — FYRE
- `CGG` — CaliGreenGold
- `GRV` — Groovy's

### Category codes (2-3 letters)
- `PR` — Pre-Rolls
- `FLW` — Flower
- `ED` — Edibles
- `CON` — Concentrate
- `VAP` — Vapes

### Tier codes (3 letters, when applicable)
- `SNO` — Snowcaps (Dope Pros only — top tier)
- `EXO` — Exotic (Dope Pros)
- `PRM` — Premium (Dope Pros)
- `COR` — Core (FYRE, Groovy's — single-tier brands; included for parallelism)

### Form / Type codes (3 letters, when applicable)
**Edibles:**
- `GUM` — Gummies
- `CAR` — Caramels
- `TAF` — Taffy

**Concentrates:**
- `TCA` — THCa concentrate
- `GEM` — Gems (THCa)
- `SUG` — Sugar (THCa)
- `BAD` — Badder (THCa)
- `ROS` — Rosin (live rosin)

**Vapes:**
- `DIS` — Disposable
- `CART` — Cartridge (reserved, not yet in catalog)

### Packaging codes (when meaningful, at end of SKU)
- `TUB` — Plastic tub (multi-unit container)
- `JAR` — Glass jar
- `MYL` — Mylar bag
- `RSN` — Rosin-infused (pre-rolls only — flower + rosin combo)

### Size formats
- `3.5G`, `7G`, `14G` — grams (decimal allowed, e.g. `0.7G`)
- `1OZ` — ounces (use only for full-ounce flower)
- `30MG`, `20MG` — milligrams (edibles dose per piece)
- `1X1.5G` — count × size; always use this format even for single-unit packs (`1X` is intentional)

## When you add a new product

1. Identify the brand and category — that determines the prefix
2. If the brand has tiers, identify the tier; otherwise use the brand's standing convention (`-COR` for FYRE/Groovy's, omit for HB/CGG depending on category)
3. Determine count × size in standard units (`G` or `MG`)
4. Add packaging marker only if the product comes in a non-default container (tub vs default loose, mylar vs default jar, etc.)
5. Verify the new SKU is unique against the existing catalog
6. Add the row to `data/products.csv` with all required columns

## When you add a new brand

Reserve a 2-3 letter brand code that doesn't conflict with existing codes or category codes (e.g. don't use `PR` since that's pre-rolls).

## When you add a new product type

If the new type doesn't fit existing form codes, propose a new 3-letter code in this doc and update the CSV. Don't reuse a code that means something else in another category.

## Migration history

- **v1 (initial):** ad-hoc scheme, mostly `{BRAND}-{CAT}-{TIER}-{SIZE}` with inconsistencies
- **v17 (current):** Path C — fixed slot positions per category, all sizes carry units, packaging markers explicit, `-COR` retained for parallelism, `1X` notation for singles
