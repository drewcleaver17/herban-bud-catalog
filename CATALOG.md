# Updating the Catalog

The catalog data lives in **`data/products.csv`**. Edit that file to add, remove, or change products. The website rebuilds automatically when you push changes.

## Quick workflow (Google Sheets)

1. Open Google Sheets, paste the current `products.csv` contents into a new sheet (or keep a permanent working sheet)
2. Edit freely — add rows, change prices, update names
3. When ready to publish: **File → Download → Comma-separated values (.csv)**
4. Replace `data/products.csv` in the repo with the downloaded file
   - Easiest: drag the CSV onto the GitHub web UI at [github.com/drewcleaver17/herban-bud-catalog/tree/main/data](https://github.com/drewcleaver17/herban-bud-catalog/tree/main/data) — GitHub auto-commits
   - Or: replace the file locally, commit, push
5. GitHub Actions rebuilds the site in ~90 seconds
6. If the CSV has errors, the build fails loudly — check the Actions tab on GitHub for the specific error, fix in the sheet, re-upload

## CSV schema

Columns **must** match exactly. The build script validates every row and fails if anything is off.

| Column | Required | Type | Notes |
|---|---|---|---|
| `id` | yes | integer | Unique across all rows. Never reuse an id after deleting — pick a new one. |
| `sortRank` | yes | integer | Controls "All Products" default order. Lower = shown first. See ranking guide below. |
| `brand` | yes | string | e.g. `Dope Pros`, `Herban Bud`, `FYRE`, `CaliGreenGold`, `Groovy's` |
| `category` | yes | enum | One of: `Pre-Rolls`, `FLOWER`, `EDIBLES`, `Concentrate`, `VAPES` |
| `tier` | optional | enum | One of: `Snowcaps`, `Exotic`, `Premium`, `Core`, or blank |
| `sku` | yes | string | Unique. Use the brand-category-tier-size convention (e.g. `DP-FLW-EXO-3.5`) |
| `name` | yes | string | Customer-facing product name (e.g. `Dope Pros — Exotic Flower, 3.5g`) |
| `grams` | optional | number | Total grams in package. Powers per-gram math. Blank for non-weight items. |
| `wholesale` | optional | number | Your cost in dollars. Blank = "inquire for pricing" |
| `msrp` | optional | number | Suggested retail. Blank = hidden |
| `availability` | optional | enum | `available`, `preorder`, `unavailable`, `discontinued`. Blank defaults to `available`. |
| `notes` | optional | string | Free text shown under product name (flavors, warnings, etc.) |

### Sort rank conventions

The default view shows products in this curated order. When adding a new product, pick a rank that places it correctly:

| Rank | Block |
|---|---|
| 100–129 | Dope Pros Pre-Rolls (100 = Snowcaps, 110 = Exotic, 120 = Premium) |
| 200–229 | Dope Pros Flower (same tier sub-ranking) |
| 300–399 | Dope Pros Edibles |
| 500–599 | Herban Bud Edibles |
| 600–699 | Herban Bud Pre-Rolls |
| 800–899 | CaliGreenGold Concentrate |
| 900–999 | FYRE (910 = Pre-Rolls, 920 = Flower, 930 = Vapes) |
| 1000–1099 | Groovy's (1000 = Pre-Rolls, 1010 = Flower, 1020 = Concentrate) |

Leave gaps (rank 115 between 110 and 120) so new rows slot in without renumbering existing products.

## Test locally before pushing

```bash
npm run build:data     # Validates CSV, regenerates src/data/products.json
npm run dev            # Preview the site
```

If `build:data` prints errors, the CSV has problems — fix them before pushing. The same script runs on GitHub Actions, so if it passes locally it'll pass in CI.

## Removing products

Two options:

- **Hard delete** — remove the row from the CSV entirely. Customers never see it. Best for products you're permanently dropping.
- **Soft delete** — set `availability` to `discontinued`. Product stays in the catalog (so past RFQ links still work) but renders dimmed.

## Admin editor still works

The in-browser admin at `?admin=1` or **Cmd+Shift+E** still edits a local copy and exports `products.json`. That's still useful for quick tests, but the **source of truth is now `data/products.csv`**. Don't commit a `products.json` that disagrees with the CSV — the next build will overwrite it.
