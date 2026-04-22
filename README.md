# Herban — Wholesale Catalog

Drew Cleaver's B2B sales tool. Customer-facing catalog live at **bud.drewcleaver.com**.

Covers all 5 brands in Drew's book: Dope Pros, Herban Bud, FYRE, CaliGreenGold, Groovy's.

## Stack

- Vite 5 + React 18
- Tailwind CSS 3 (dark-only, indigo/paper palette)
- Fraunces (display) + Inter (body) + JetBrains Mono (SKUs), loaded from Google Fonts
- Deploys to GitHub Pages via `.github/workflows/deploy.yml`
- No backend, no database, no auth — product data is a static JSON file

## Local development

```bash
npm install
npm run dev
```

Dev server runs at `http://localhost:5173`.

## Build & deploy

Push to `main`. The GitHub Action builds and deploys to Pages automatically. DNS is handled via Hover → the `CNAME` file in `public/` pins the site to `bud.drewcleaver.com`.

```bash
npm run build     # produces dist/
npm run preview   # serve the production build locally
```

## Editing the product catalog

Two ways, pick whichever is more convenient:

### Option A — Admin editor in the browser (recommended)

1. Go to `https://bud.drewcleaver.com/?admin=1` (or press **Cmd/Ctrl + Shift + E** anywhere on the site)
2. Edit rows inline — brand, category, SKU, grams, wholesale, MSRP, status, notes
3. Add new rows with **+ Add row**
4. Edits save to your browser's localStorage instantly and preview live when you close the drawer. Customers never see them — they're local to your browser.
5. When you're happy, click **Export products.json**
6. Replace `src/data/products.json` in the repo with the downloaded file, commit, push
7. GitHub Actions redeploys in ~1 min

The admin panel is not secret — anyone who knows the shortcut can open it. But all it does is let them edit a local copy; it can't push anything to the live site.

### Option B — Edit the JSON directly

`src/data/products.json` is the source of truth. Each product looks like:

```json
{
  "id": 1,
  "brand": "Dope Pros",
  "category": "Pre-Rolls",
  "sku": "Dope Pros - (Single) Exotic Prerolls (1.5g)",
  "master_distro": 3.0,
  "distro": 4.0,
  "wholesale": 6.0,
  "msrp": 12.99,
  "grams": 1.5,
  "notes": "",
  "availability": "available"
}
```

Fields:

- `id` — unique integer. Just pick the next one.
- `brand` — string, free-form. Used for the Brand column and filter chips.
- `category` — string. Categories are derived from this field; adding a new one automatically gets its own chip.
- `sku` — full product name. Shown in the Product column (brand prefix stripped automatically).
- `master_distro`, `distro`, `wholesale` — pricing tiers. Only `wholesale` is displayed to customers right now; the others are kept in the JSON in case you want to expose tier-switching later.
- `msrp` — suggested retail.
- `grams` — total grams in the package (e.g. 5-count × 1.5g = `7.5`). Powers the $/g math and the UOM toggle. Set to `null` if non-applicable (edibles, vapes).
- `notes` — free-text. Shown as a small line under the SKU. Flavors, warnings, etc.
- `availability` — `"available"` | `"preorder"` | `"unavailable"` | `"discontinued"`

GM% and $/g are computed at render time, never stored.

## Features

- **Dense sortable table** — every column sorts, McMaster-Carr style
- **Full pricing transparency** — cost, MSRP, $/g, GM $/g, GM%
- **UOM toggle** — flip between Pack / $/g / $/8th / $/oz. Sorting respects the active unit.
- **Saved views** — name a filter combo and recall it later (stored in localStorage per-device)
- **Shareable URLs** — every filter/sort/UOM combo is a URL you can text a buyer
- **Availability filter** — hide discontinued, show only pre-orders, etc.
- **Data sanity flags** — MSRP rows that are below wholesale get a ⚠ icon. Fix them in the admin editor.
- **Dark-mode-only** — indigo #292663 background, paper #FAF8F3 text. No light mode.

## Known data issues in the source masterlist

These are shipped as-is and flagged with ⚠ in the UI. Fix via the admin editor when you have a sec:

- Herban 125ct Variety Taffy Tub — MSRP shows $3 (wholesale is $156.25)
- Herban 125ct Caramel Tub — same pattern
- FYRE 28ct 1g Premium Flower Tub — MSRP shows $9.99 (wholesale is $100)
- Dope Pros 2ct Two Lil' Guys Prerolls — all prices marked `?`, row is skipped

## File structure

```
src/
  App.jsx                      Top-level shell, filter pipeline, keyboard shortcuts
  main.jsx                     React entry
  index.css                    Tailwind + base styles
  components/
    FilterBar.jsx              Search, chips, UOM toggle, saved views
    ProductTable.jsx           The sortable table
    AdminDrawer.jsx            Hidden editor (Cmd+Shift+E)
  lib/
    pricing.js                 GM, $/g, UOM conversions, money/percent formatting
    state.js                   URL serialization + localStorage persistence
  data/
    products.json              The catalog. Source of truth.
public/
  CNAME                        Custom domain binding
  favicon.svg
.github/workflows/
  deploy.yml                   Build & push to Pages on main
```
