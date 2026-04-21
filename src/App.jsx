import { useState, useMemo, useRef, useEffect } from "react";
import {
  Search, ChevronUp, ChevronDown, X, Upload, FileText, Sparkles,
  Edit2, Check, Package, AlertCircle, Plus, Eye, Settings,
} from "lucide-react";

const BRAND = {
  ink: "#292663", inkSoft: "#3d3a7a", paper: "#FAF8F3", line: "#E8E4D9",
  gold: "#C9A961", sage: "#6B8E6F", dust: "#B8A99A",
};
const MARKUP = 2.0;

const INITIAL_PRODUCTS = [
  { sku: "DP-PR-EX-1.5-1", brand: "Dope Pros", category: "Pre-Rolls", name: "Exotic Preroll (Single)", pack: "1 × 1.5g", weight_g: 1.5, cost: 6.0, tier: "Exotic", compliance: "THCa", coa: true, stock: 48 },
  { sku: "DP-PR-PR-1.5-15T", brand: "Dope Pros", category: "Pre-Rolls", name: "Premium Prerolls Tub (15ct)", pack: "15 × 1.5g", weight_g: 22.5, cost: 35.0, tier: "Premium", compliance: "THCa", coa: true, stock: 12 },
  { sku: "DP-PR-PR-1.5-30T", brand: "Dope Pros", category: "Pre-Rolls", name: "Premium Prerolls Tub (30ct)", pack: "30 × 1.5g", weight_g: 45.0, cost: 75.0, tier: "Premium", compliance: "THCa", coa: true, stock: 6 },
  { sku: "DP-PR-BC-0.7-5", brand: "Dope Pros", category: "Pre-Rolls", name: "Baby Cowboys Prerolls (5ct)", pack: "5 × 0.7g", weight_g: 3.5, cost: 16.0, tier: "Premium", compliance: "THCa", coa: true, stock: 3 },
  { sku: "HB-PR-BJ-0.7-5", brand: "Herban Bud", category: "Pre-Rolls", name: "Baby J's Prerolls (5ct)", pack: "5 × 0.7g", weight_g: 3.5, cost: 16.0, tier: "Premium", compliance: "THCa", coa: true, stock: 24 },
  { sku: "FY-PR-PR-1.5-2", brand: "FYRE", category: "Pre-Rolls", name: "Premium Prerolls (2ct)", pack: "2 × 1.5g", weight_g: 3.0, cost: 8.0, tier: "Premium", compliance: "THCa", coa: true, stock: 0 },
  { sku: "GR-PR-HH-2.0-1", brand: "Groovy's", category: "Pre-Rolls", name: "Hash Hole Pre-Roll", pack: "1 × 2g", weight_g: 2.0, cost: 15.0, tier: "Top-Shelf", compliance: "THCa", coa: true, stock: 18 },
  { sku: "DP-FL-PR-3.5", brand: "Dope Pros", category: "Flower", name: "Premium Flower — 3.5g", pack: "3.5g", weight_g: 3.5, cost: 16.0, tier: "Premium", compliance: "THCa", coa: true, stock: 32 },
  { sku: "DP-FL-PR-28", brand: "Dope Pros", category: "Flower", name: "Premium Flower — 1oz", pack: "28g", weight_g: 28.0, cost: 95.0, tier: "Premium", compliance: "THCa", coa: true, stock: 8 },
  { sku: "DP-FL-EX-3.5", brand: "Dope Pros", category: "Flower", name: "Exotic Flower — 3.5g", pack: "3.5g", weight_g: 3.5, cost: 20.0, tier: "Exotic", compliance: "THCa", coa: true, stock: 21 },
  { sku: "HB-FL-PR-3.5", brand: "Herban Bud", category: "Flower", name: "Premium Flower — 3.5g", pack: "3.5g", weight_g: 3.5, cost: 15.0, tier: "Premium", compliance: "THCa", coa: true, stock: 40 },
  { sku: "HB-FL-EX-3.5", brand: "Herban Bud", category: "Flower", name: "Exotic Flower — 3.5g", pack: "3.5g", weight_g: 3.5, cost: 18.5, tier: "Exotic", compliance: "THCa", coa: true, stock: 2 },
  { sku: "FY-FL-PR-3.5", brand: "FYRE", category: "Flower", name: "Premium Flower — 3.5g", pack: "3.5g", weight_g: 3.5, cost: 12.5, tier: "Premium", compliance: "THCa", coa: true, stock: 15 },
  { sku: "GR-FL-EX-3.5", brand: "Groovy's", category: "Flower", name: "8th Exotic Flower", pack: "3.5g", weight_g: 3.5, cost: 18.0, tier: "Exotic", compliance: "THCa", coa: true, stock: 11 },
  { sku: "DP-SC-3.5", brand: "Dope Pros", category: "Snowcaps", name: "Snowcaps — 3.5g", pack: "3.5g", weight_g: 3.5, cost: 25.0, tier: "Top-Shelf", compliance: "THCa", coa: true, stock: 14 },
  { sku: "DP-SC-14T", brand: "Dope Pros", category: "Snowcaps", name: "Snowcaps Tub (14ct)", pack: "14 × 1g", weight_g: 14.0, cost: 105.0, tier: "Top-Shelf", compliance: "THCa", coa: true, stock: 5 },
  { sku: "FY-SC-3.5", brand: "FYRE", category: "Snowcaps", name: "Snowcaps — 3.5g", pack: "3.5g", weight_g: 3.5, cost: 20.0, tier: "Top-Shelf", compliance: "THCa", coa: true, stock: 0 },
  { sku: "FY-VP-TA-2-5", brand: "FYRE", category: "Vapes", name: "2g THCa Disposable (5ct)", pack: "5 × 2g", weight_g: 10.0, cost: 127.5, tier: "Premium", compliance: "THCa", coa: true, stock: 7 },
  { sku: "DP-ED-LR-30-10", brand: "Dope Pros", category: "Edibles", name: "30mg D9 Live Rosin Gummies (10ct)", pack: "10 × 30mg", weight_g: null, cost: 12.5, tier: "Premium", compliance: "D9", coa: true, stock: 50 },
  { sku: "HB-ED-CA-20-15", brand: "Herban Bud", category: "Edibles", name: "20mg D9 Caramels (15ct)", pack: "15 × 20mg", weight_g: null, cost: 18.75, tier: "Core", compliance: "D9", coa: true, stock: 22 },
  { sku: "HB-ED-TF-20-125T", brand: "Herban Bud", category: "Edibles", name: "20mg Variety Taffy Tub (125ct)", pack: "125 × 20mg", weight_g: null, cost: 156.25, tier: "Core", compliance: "D9", coa: true, stock: 4 },
  { sku: "FY-ED-CB-5-30T", brand: "FYRE", category: "Edibles", name: "5mg THC/CBD Gummy Tub (30ct)", pack: "30 × 5mg", weight_g: null, cost: 60.0, tier: "Core", compliance: "D9", coa: true, stock: 9 },
  { sku: "DP-CN-RO-1", brand: "Dope Pros", category: "Concentrate", name: "1g Rosin", pack: "1g", weight_g: 1.0, cost: 30.0, tier: "Top-Shelf", compliance: "THCa", coa: true, stock: 13 },
  { sku: "CG-CN-CO-3", brand: "CaliGreenGold", category: "Concentrate", name: "3g THCa Concentrate", pack: "3g", weight_g: 3.0, cost: 28.0, tier: "Premium", compliance: "THCa", coa: true, stock: 17 },
  { sku: "GR-CN-LR-1", brand: "Groovy's", category: "Concentrate", name: "Tier 1 Live Rosin", pack: "1g", weight_g: 1.0, cost: 25.0, tier: "Top-Shelf", compliance: "THCa", coa: true, stock: 1 },
];

const fmtMoney = (n) => (n == null ? "—" : `$${n.toFixed(2)}`);
const fmtDpg = (n) => (n == null ? "—" : `$${n.toFixed(2)}/g`);
const fmtPct = (n) => (n == null ? "—" : `${(n * 100).toFixed(0)}%`);
const stockState = (s) => {
  if (s === 0) return { label: "Out", color: "#B04040", bg: "#F5E6E6" };
  if (s <= 5) return { label: "Low", color: BRAND.gold, bg: "#F7EFD9" };
  return { label: "In Stock", color: BRAND.sage, bg: "#E8EFE8" };
};
const unique = (arr) => Array.from(new Set(arr)).sort();

function simulateCoaExtraction(filename) {
  const strains = ["Gelato #33", "Blue Dream", "Wedding Cake", "Zkittlez", "Runtz", "Sour Diesel", "Purple Punch"];
  const terps = ["Limonene-dominant", "Myrcene-dominant", "Caryophyllene-dominant", "Pinene-forward", "Linalool-heavy"];
  const effects = [
    "Euphoric, creative, focused — great for daytime use",
    "Relaxed, calming, sleepy — ideal evening strain",
    "Uplifted, social, energizing — perfect for activities",
    "Balanced hybrid, cerebral + body — anytime use",
  ];
  const descriptions = [
    "A balanced hybrid with bright citrus notes and a smooth, creamy finish. Dense, frost-coated buds deliver an even-keeled high that starts heady and settles into full-body calm.",
    "Dessert-forward terps meet a classic indica backbone. Sweet vanilla and ripe berry dominate the nose, with flavor that carries through every pull. A customer favorite.",
    "Gas-forward aroma with bright lemon-rind top notes. Sticky trichome coverage and a dense structure. Hits hard up front, mellows into a sustained, creative headspace.",
    "Old-school sativa energy with modern shelf appeal. Diesel and skunk lead, with subtle floral undertones. Fast onset, long tail.",
  ];
  const flavors = ["Citrus · Cream · Earthy Pine", "Berry · Vanilla · Gas", "Lemon · Diesel · Pepper", "Tropical · Floral · Herbal"];
  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
  return {
    strain: rand(strains),
    thc: (22 + Math.random() * 10).toFixed(2),
    total_cannabinoids: (26 + Math.random() * 8).toFixed(2),
    dominant_terpene: rand(terps),
    terpene_list: "β-Caryophyllene, Limonene, Linalool, Myrcene, α-Pinene",
    effect: rand(effects),
    description: rand(descriptions),
    flavor_notes: rand(flavors),
    lab_name: "Kaycha Labs",
    test_date: "2026-04-15",
    batch_id: `HB-${Math.floor(Math.random() * 90000) + 10000}`,
    suggested_tier: rand(["Premium", "Exotic", "Top-Shelf"]),
    suggested_category: "Flower",
  };
}

export default function App() {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [view, setView] = useState("employee");

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.paper, color: BRAND.ink, fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&display=swap');
        .mono { font-family: 'JetBrains Mono', monospace; }
        .serif { font-family: 'Fraunces', Georgia, serif; }
        input:focus, select:focus, textarea:focus { outline: 2px solid ${BRAND.ink}; outline-offset: -1px; }
      `}</style>

      <header className="border-b sticky top-0 z-30" style={{ borderColor: BRAND.line, backgroundColor: BRAND.paper }}>
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <div className="serif text-2xl font-bold tracking-tight" style={{ color: BRAND.ink }}>Herban Bud</div>
            <div className="text-[10px] uppercase tracking-[0.25em] font-semibold" style={{ color: BRAND.dust }}>Inventory & Catalog</div>
          </div>
          <div className="flex items-center rounded-full p-1 border" style={{ borderColor: BRAND.line, backgroundColor: "white" }}>
            <button onClick={() => setView("employee")}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12px] font-semibold uppercase tracking-wider transition-all"
              style={{ backgroundColor: view === "employee" ? BRAND.ink : "transparent", color: view === "employee" ? "white" : BRAND.dust }}>
              <Settings size={12} /> Employee
            </button>
            <button onClick={() => setView("customer")}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12px] font-semibold uppercase tracking-wider transition-all"
              style={{ backgroundColor: view === "customer" ? BRAND.ink : "transparent", color: view === "customer" ? "white" : BRAND.dust }}>
              <Eye size={12} /> Customer
            </button>
          </div>
        </div>
      </header>

      {view === "employee" ? <EmployeeView products={products} setProducts={setProducts} /> : <CustomerView products={products} />}
    </div>
  );
}

function EmployeeView({ products, setProducts }) {
  const [coaOpen, setCoaOpen] = useState(false);
  const [search, setSearch] = useState("");

  const totalSkus = products.length;
  const inStock = products.filter((p) => p.stock > 5).length;
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;
  const totalUnits = products.reduce((s, p) => s + p.stock, 0);
  const inventoryValue = products.reduce((s, p) => s + p.stock * (p.cost || 0), 0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => `${p.sku} ${p.brand} ${p.name}`.toLowerCase().includes(q));
  }, [products, search]);

  const updateProduct = (sku, patch) => setProducts((prev) => prev.map((p) => (p.sku === sku ? { ...p, ...patch } : p)));
  const addProduct = (np) => setProducts((prev) => [np, ...prev]);

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-6">
      <div className="grid grid-cols-5 gap-3 mb-6">
        <StatCard label="Total SKUs" value={totalSkus} />
        <StatCard label="In Stock" value={inStock} tint={BRAND.sage} />
        <StatCard label="Low Stock" value={lowStock} tint={BRAND.gold} emphasis={lowStock > 0} />
        <StatCard label="Out of Stock" value={outOfStock} tint="#B04040" emphasis={outOfStock > 0} />
        <StatCard label="Inventory Value" value={`$${inventoryValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <button onClick={() => setCoaOpen(true)}
          className="group relative overflow-hidden border-2 border-dashed p-6 text-left transition-all hover:shadow-md"
          style={{ borderColor: BRAND.ink, backgroundColor: "white" }}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 flex items-center justify-center rounded-full shrink-0" style={{ backgroundColor: BRAND.ink }}>
              <Sparkles size={20} color="white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="serif text-xl font-bold" style={{ color: BRAND.ink }}>Add Product from COA</div>
                <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.gold, color: "white" }}>AI</span>
              </div>
              <div className="text-[13px] leading-relaxed" style={{ color: BRAND.dust }}>
                Drop a Certificate of Analysis PDF. Lab data, strain info, and customer-facing marketing copy auto-populate. Review, edit, publish.
              </div>
            </div>
          </div>
        </button>

        <div className="border p-6" style={{ borderColor: BRAND.line, backgroundColor: "white" }}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 flex items-center justify-center rounded-full shrink-0" style={{ backgroundColor: BRAND.paper, border: `1px solid ${BRAND.line}` }}>
              <Package size={20} color={BRAND.ink} />
            </div>
            <div className="flex-1">
              <div className="serif text-xl font-bold mb-1" style={{ color: BRAND.ink }}>Quick Inventory Adjust</div>
              <div className="text-[13px] leading-relaxed mb-3" style={{ color: BRAND.dust }}>
                Update stock counts and prices inline below. Changes push to the customer catalog immediately.
              </div>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: BRAND.dust }} />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Find SKU to adjust…"
                  className="w-full pl-9 pr-3 py-2 border text-[13px] mono"
                  style={{ borderColor: BRAND.line, backgroundColor: BRAND.paper }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border overflow-hidden" style={{ borderColor: BRAND.line, backgroundColor: "white" }}>
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: BRAND.line, backgroundColor: BRAND.paper }}>
          <div className="flex items-center gap-3">
            <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: BRAND.ink }}>Live Inventory</div>
            <div className="text-[11px] mono" style={{ color: BRAND.dust }}>{filtered.length} of {totalSkus} SKUs · {totalUnits} units total</div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: BRAND.sage }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: BRAND.sage }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: BRAND.sage }} />
            </span>
            Live
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: BRAND.line, backgroundColor: BRAND.paper }}>
                <Th>SKU</Th><Th>Product</Th><Th>Brand</Th><Th>Category</Th>
                <Th align="right">Stock</Th><Th align="right">Cost</Th><Th align="right">MSRP</Th><Th>Status</Th><Th>COA</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => <EmployeeRow key={p.sku} product={p} even={i % 2 === 1} onUpdate={(patch) => updateProduct(p.sku, patch)} />)}
            </tbody>
          </table>
        </div>
      </div>

      {coaOpen && <CoaUploadModal onClose={() => setCoaOpen(false)} onPublish={(np) => { addProduct(np); setCoaOpen(false); }} />}
    </div>
  );
}

function StatCard({ label, value, tint, emphasis }) {
  return (
    <div className="border px-4 py-3" style={{ borderColor: emphasis ? tint : BRAND.line, backgroundColor: "white", borderLeftWidth: emphasis ? 4 : 1 }}>
      <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: BRAND.dust }}>{label}</div>
      <div className="serif text-2xl font-bold" style={{ color: tint || BRAND.ink }}>{value}</div>
    </div>
  );
}

function Th({ children, align = "left" }) {
  return <th className={`px-3 py-2 text-[10px] uppercase tracking-wider font-semibold ${align === "right" ? "text-right" : "text-left"}`} style={{ color: BRAND.dust }}>{children}</th>;
}

function EmployeeRow({ product, even, onUpdate }) {
  const [editingStock, setEditingStock] = useState(false);
  const [editingCost, setEditingCost] = useState(false);
  const [stockVal, setStockVal] = useState(product.stock);
  const [costVal, setCostVal] = useState(product.cost);
  const s = stockState(product.stock);

  const commitStock = () => { const n = Math.max(0, parseInt(stockVal) || 0); onUpdate({ stock: n }); setStockVal(n); setEditingStock(false); };
  const commitCost = () => { const n = Math.max(0, parseFloat(costVal) || 0); onUpdate({ cost: n }); setCostVal(n); setEditingCost(false); };

  const msrp = product.cost ? product.cost * MARKUP : null;

  return (
    <tr className="border-b" style={{ borderColor: BRAND.line, backgroundColor: even ? BRAND.paper : "white" }}>
      <td className="px-3 py-2 mono text-[11px]" style={{ color: BRAND.ink }}>{product.sku}</td>
      <td className="px-3 py-2 font-medium">{product.name}</td>
      <td className="px-3 py-2" style={{ color: BRAND.dust }}>{product.brand}</td>
      <td className="px-3 py-2" style={{ color: BRAND.dust }}>{product.category}</td>
      <td className="px-3 py-2 text-right">
        {editingStock ? (
          <div className="flex items-center justify-end gap-1">
            <input type="number" value={stockVal} onChange={(e) => setStockVal(e.target.value)} onBlur={commitStock}
              onKeyDown={(e) => e.key === "Enter" && commitStock()} autoFocus
              className="w-16 px-2 py-0.5 text-right mono border" style={{ borderColor: BRAND.ink }} />
            <button onClick={commitStock}><Check size={14} color={BRAND.sage} /></button>
          </div>
        ) : (
          <button onClick={() => setEditingStock(true)} className="mono font-semibold hover:underline flex items-center justify-end gap-1.5 w-full"
            style={{ color: product.stock === 0 ? "#B04040" : BRAND.ink }}>
            {product.stock}<Edit2 size={10} style={{ color: BRAND.dust }} />
          </button>
        )}
      </td>
      <td className="px-3 py-2 text-right">
        {editingCost ? (
          <div className="flex items-center justify-end gap-1">
            <input type="number" step="0.01" value={costVal} onChange={(e) => setCostVal(e.target.value)} onBlur={commitCost}
              onKeyDown={(e) => e.key === "Enter" && commitCost()} autoFocus
              className="w-20 px-2 py-0.5 text-right mono border" style={{ borderColor: BRAND.ink }} />
            <button onClick={commitCost}><Check size={14} color={BRAND.sage} /></button>
          </div>
        ) : (
          <button onClick={() => setEditingCost(true)} className="mono hover:underline flex items-center justify-end gap-1.5 w-full" style={{ color: BRAND.ink }}>
            {fmtMoney(product.cost)}<Edit2 size={10} style={{ color: BRAND.dust }} />
          </button>
        )}
      </td>
      <td className="px-3 py-2 text-right mono" style={{ color: BRAND.dust }}>{fmtMoney(msrp)}</td>
      <td className="px-3 py-2">
        <span className="inline-block text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5" style={{ color: s.color, backgroundColor: s.bg }}>{s.label}</span>
      </td>
      <td className="px-3 py-2 text-center">
        {product.coa ? <FileText size={14} style={{ color: BRAND.sage }} /> : <AlertCircle size={14} style={{ color: BRAND.gold }} />}
      </td>
    </tr>
  );
}

function CoaUploadModal({ onClose, onPublish }) {
  const [stage, setStage] = useState("upload");
  const [filename, setFilename] = useState("");
  const [form, setForm] = useState(null);
  const fileInput = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    setFilename(file.name);
    setStage("processing");
    setTimeout(() => {
      const data = simulateCoaExtraction(file.name);
      setForm({
        sku: `HB-${data.suggested_category.slice(0, 2).toUpperCase()}-${Math.floor(Math.random() * 900) + 100}`,
        name: `${data.strain} — 3.5g`,
        brand: "Herban Bud",
        category: data.suggested_category,
        tier: data.suggested_tier,
        pack: "3.5g",
        weight_g: 3.5,
        cost: 18.0,
        strain: data.strain,
        thc: parseFloat(data.thc),
        total_cannabinoids: parseFloat(data.total_cannabinoids),
        terpene: data.dominant_terpene,
        terpene_list: data.terpene_list,
        effect: data.effect,
        description: data.description,
        flavor_notes: data.flavor_notes,
        compliance: "THCa",
        coa: true,
        stock: 0,
        batch_id: data.batch_id,
        lab_name: data.lab_name,
        test_date: data.test_date,
      });
      setStage("review");
    }, 2200);
  };

  const handleDrop = (e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ backgroundColor: "rgba(41, 38, 99, 0.4)" }} onClick={onClose}>
      <div className="relative max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" style={{ backgroundColor: BRAND.paper }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: BRAND.line, backgroundColor: BRAND.paper }}>
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: BRAND.gold }} />
            <div className="serif text-lg font-bold" style={{ color: BRAND.ink }}>
              {stage === "upload" && "Upload COA"}
              {stage === "processing" && "Analyzing COA…"}
              {stage === "review" && "Review & Publish"}
            </div>
          </div>
          <button onClick={onClose} className="hover:opacity-60" style={{ color: BRAND.ink }}><X size={18} /></button>
        </div>

        <div className="p-6">
          {stage === "upload" && (
            <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed p-12 text-center cursor-pointer hover:bg-white transition-colors"
              style={{ borderColor: BRAND.ink }} onClick={() => fileInput.current?.click()}>
              <input ref={fileInput} type="file" accept=".pdf" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
              <Upload size={32} className="mx-auto mb-3" style={{ color: BRAND.ink }} />
              <div className="serif text-lg font-semibold mb-1" style={{ color: BRAND.ink }}>Drop a COA PDF here</div>
              <div className="text-[13px] mb-4" style={{ color: BRAND.dust }}>or click to browse</div>
              <div className="text-[11px] max-w-sm mx-auto leading-relaxed" style={{ color: BRAND.dust }}>
                AI will extract cannabinoid profile, terpenes, and batch info, then generate a customer-facing description, flavor notes, and effect profile for budtender education.
              </div>
            </div>
          )}

          {stage === "processing" && (
            <div className="py-16 text-center">
              <div className="relative w-16 h-16 mx-auto mb-5">
                <div className="absolute inset-0 rounded-full border-2 animate-ping" style={{ borderColor: BRAND.ink, opacity: 0.3 }} />
                <div className="absolute inset-2 rounded-full flex items-center justify-center" style={{ backgroundColor: BRAND.ink }}>
                  <Sparkles size={20} color="white" />
                </div>
              </div>
              <div className="serif text-lg font-semibold mb-2" style={{ color: BRAND.ink }}>Reading {filename}</div>
              <div className="space-y-1 text-[12px] mono" style={{ color: BRAND.dust }}>
                <ProcessingLine delay={0}>Extracting cannabinoid profile…</ProcessingLine>
                <ProcessingLine delay={600}>Parsing terpene data…</ProcessingLine>
                <ProcessingLine delay={1100}>Matching strain lineage…</ProcessingLine>
                <ProcessingLine delay={1600}>Generating marketing copy…</ProcessingLine>
              </div>
            </div>
          )}

          {stage === "review" && form && (
            <div className="space-y-5">
              <div className="px-4 py-3 border-l-4 text-[12px]" style={{ borderColor: BRAND.gold, backgroundColor: "white", color: BRAND.ink }}>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={12} style={{ color: BRAND.gold }} />
                  <span className="font-semibold uppercase tracking-wider text-[10px]">AI-generated — review before publishing</span>
                </div>
                Extracted from <span className="mono">{filename}</span> · Batch <span className="mono">{form.batch_id}</span> · {form.lab_name} · {form.test_date}
              </div>

              <FormSection title="Core Details">
                <FormField label="SKU" value={form.sku} onChange={(v) => setForm({ ...form, sku: v })} mono />
                <FormField label="Product Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                <FormField label="Brand" value={form.brand} onChange={(v) => setForm({ ...form, brand: v })} />
                <FormField label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
                <FormField label="Tier" value={form.tier} onChange={(v) => setForm({ ...form, tier: v })} />
                <FormField label="Pack Size" value={form.pack} onChange={(v) => setForm({ ...form, pack: v })} />
                <FormField label="Cost ($)" value={form.cost} onChange={(v) => setForm({ ...form, cost: parseFloat(v) || 0 })} type="number" />
                <FormField label="Starting Stock" value={form.stock} onChange={(v) => setForm({ ...form, stock: parseInt(v) || 0 })} type="number" />
              </FormSection>

              <FormSection title="Lab Data (from COA)" aiTag>
                <FormField label="Strain" value={form.strain} onChange={(v) => setForm({ ...form, strain: v })} />
                <FormField label="THC %" value={form.thc} onChange={(v) => setForm({ ...form, thc: parseFloat(v) || 0 })} type="number" />
                <FormField label="Total Cannabinoids %" value={form.total_cannabinoids} onChange={(v) => setForm({ ...form, total_cannabinoids: parseFloat(v) || 0 })} type="number" />
                <FormField label="Dominant Terpene" value={form.terpene} onChange={(v) => setForm({ ...form, terpene: v })} />
                <FormField label="Full Terpene List" value={form.terpene_list} onChange={(v) => setForm({ ...form, terpene_list: v })} span={2} />
              </FormSection>

              <FormSection title="Customer-Facing Copy" aiTag>
                <FormField label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} span={2} multiline />
                <FormField label="Flavor Notes" value={form.flavor_notes} onChange={(v) => setForm({ ...form, flavor_notes: v })} span={2} />
                <FormField label="Effect Profile" value={form.effect} onChange={(v) => setForm({ ...form, effect: v })} span={2} multiline />
              </FormSection>

              <div className="pt-4 flex items-center justify-between border-t" style={{ borderColor: BRAND.line }}>
                <button onClick={onClose} className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: BRAND.dust }}>Cancel</button>
                <button onClick={() => onPublish(form)}
                  className="px-5 py-2.5 text-[12px] font-semibold uppercase tracking-wider flex items-center gap-2"
                  style={{ backgroundColor: BRAND.ink, color: "white" }}>
                  <Plus size={14} /> Publish to Catalog
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProcessingLine({ children, delay }) {
  const [shown, setShown] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShown(true), delay); return () => clearTimeout(t); }, [delay]);
  return <div style={{ opacity: shown ? 1 : 0.3, transition: "opacity 0.4s" }}>{shown ? "✓ " : "· "}{children}</div>;
}

function FormSection({ title, aiTag, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: BRAND.ink }}>{title}</div>
        {aiTag && <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.gold, color: "white" }}>AI</span>}
      </div>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function FormField({ label, value, onChange, type = "text", span = 1, mono, multiline }) {
  return (
    <div className={span === 2 ? "col-span-2" : ""}>
      <label className="block text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: BRAND.dust }}>{label}</label>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3}
          className={`w-full px-3 py-2 border text-[13px] ${mono ? "mono" : ""}`}
          style={{ borderColor: BRAND.line, backgroundColor: "white", color: BRAND.ink }} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
          className={`w-full px-3 py-2 border text-[13px] ${mono ? "mono" : ""}`}
          style={{ borderColor: BRAND.line, backgroundColor: "white", color: BRAND.ink }} />
      )}
    </div>
  );
}

function CustomerView({ products }) {
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [selectedBrands, setSelectedBrands] = useState(new Set());
  const [selectedTiers, setSelectedTiers] = useState(new Set());
  const [inStockOnly, setInStockOnly] = useState(true);
  const [sortKey, setSortKey] = useState("category");
  const [sortDir, setSortDir] = useState("asc");

  const categories = useMemo(() => unique(products.map((p) => p.category)), [products]);
  const brands = useMemo(() => unique(products.map((p) => p.brand)), [products]);
  const tiers = ["Core", "Premium", "Exotic", "Top-Shelf"];

  const enriched = useMemo(() => products.map((p) => {
    const dpg = p.weight_g && p.cost ? p.cost / p.weight_g : null;
    const msrp = p.cost ? p.cost * MARKUP : null;
    const gm_pct = p.cost && msrp ? (msrp - p.cost) / msrp : null;
    return { ...p, dpg, msrp, gm_pct };
  }), [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enriched.filter((p) => {
      if (q && !`${p.sku} ${p.brand} ${p.name} ${p.category}`.toLowerCase().includes(q)) return false;
      if (selectedCategories.size && !selectedCategories.has(p.category)) return false;
      if (selectedBrands.size && !selectedBrands.has(p.brand)) return false;
      if (selectedTiers.size && !selectedTiers.has(p.tier)) return false;
      if (inStockOnly && p.stock === 0) return false;
      return true;
    });
  }, [enriched, search, selectedCategories, selectedBrands, selectedTiers, inStockOnly]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "string") { const r = av.localeCompare(bv); return sortDir === "asc" ? r : -r; }
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const toggleSet = (setter, current, value) => { const next = new Set(current); if (next.has(value)) next.delete(value); else next.add(value); setter(next); };
  const clearAll = () => { setSearch(""); setSelectedCategories(new Set()); setSelectedBrands(new Set()); setSelectedTiers(new Set()); };
  const handleSort = (key) => { if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc"); else { setSortKey(key); setSortDir("asc"); } };

  const SortHeader = ({ col, label, align = "left" }) => {
    const active = sortKey === col;
    return (
      <button onClick={() => handleSort(col)}
        className={`flex items-center gap-1 w-full text-[10px] uppercase tracking-wider font-semibold ${align === "right" ? "justify-end" : "justify-start"}`}
        style={{ color: active ? BRAND.ink : BRAND.dust }}>
        <span>{label}</span>
        {active && (sortDir === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
      </button>
    );
  };

  const FacetGroup = ({ title, items, selected, setter }) => (
    <div className="mb-5">
      <div className="text-[10px] uppercase tracking-wider font-semibold mb-2 pb-1 border-b" style={{ color: BRAND.ink, borderColor: BRAND.line }}>{title}</div>
      <div className="space-y-1.5">
        {items.map((item) => (
          <label key={item} className="flex items-center gap-2 text-[13px] cursor-pointer hover:opacity-70" style={{ color: BRAND.ink }}>
            <input type="checkbox" checked={selected.has(item)} onChange={() => toggleSet(setter, selected, item)}
              className="w-3.5 h-3.5" style={{ accentColor: BRAND.ink }} />
            <span>{item}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const anyFilter = search || selectedCategories.size || selectedBrands.size || selectedTiers.size;

  return (
    <div className="max-w-[1600px] mx-auto flex">
      <aside className="w-60 shrink-0 border-r px-5 py-5" style={{ borderColor: BRAND.line }}>
        <div className="relative mb-5">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: BRAND.dust }} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search catalog…"
            className="w-full pl-9 pr-3 py-2 border text-[13px] mono" style={{ borderColor: BRAND.line, backgroundColor: "white" }} />
        </div>
        {anyFilter && (
          <button onClick={clearAll} className="mb-4 flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold" style={{ color: BRAND.ink }}>
            <X size={11} /> Clear filters
          </button>
        )}
        <FacetGroup title="Category" items={categories} selected={selectedCategories} setter={setSelectedCategories} />
        <FacetGroup title="Tier" items={tiers} selected={selectedTiers} setter={setSelectedTiers} />
        <FacetGroup title="Brand" items={brands} selected={selectedBrands} setter={setSelectedBrands} />
        <div className="mb-5">
          <div className="text-[10px] uppercase tracking-wider font-semibold mb-2 pb-1 border-b" style={{ color: BRAND.ink, borderColor: BRAND.line }}>Availability</div>
          <label className="flex items-center gap-2 text-[13px] cursor-pointer" style={{ color: BRAND.ink }}>
            <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="w-3.5 h-3.5" style={{ accentColor: BRAND.ink }} />
            <span>In stock only</span>
          </label>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: BRAND.line, backgroundColor: BRAND.paper }}>
          <div className="text-[11px] mono" style={{ color: BRAND.dust }}>Showing {sorted.length} of {products.length} SKUs</div>
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: BRAND.sage }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: BRAND.sage }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: BRAND.sage }} />
            </span>
            Live inventory
          </div>
        </div>

        <div className="overflow-x-auto" style={{ backgroundColor: "white" }}>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b" style={{ borderColor: BRAND.line, backgroundColor: BRAND.paper }}>
                <th className="text-left px-3 py-2 w-[130px]"><SortHeader col="sku" label="SKU" /></th>
                <th className="text-left px-3 py-2"><SortHeader col="name" label="Product" /></th>
                <th className="text-left px-3 py-2 w-[110px]"><SortHeader col="brand" label="Brand" /></th>
                <th className="text-left px-3 py-2 w-[100px]"><SortHeader col="category" label="Category" /></th>
                <th className="text-left px-3 py-2 w-[95px]"><SortHeader col="tier" label="Tier" /></th>
                <th className="text-left px-3 py-2 w-[95px]"><SortHeader col="pack" label="Pack" /></th>
                <th className="text-right px-3 py-2 w-[80px]"><SortHeader col="cost" label="Cost" align="right" /></th>
                <th className="text-right px-3 py-2 w-[80px]"><SortHeader col="dpg" label="$/g" align="right" /></th>
                <th className="text-right px-3 py-2 w-[90px]"><SortHeader col="msrp" label="MSRP" align="right" /></th>
                <th className="text-right px-3 py-2 w-[70px]"><SortHeader col="gm_pct" label="GM %" align="right" /></th>
                <th className="text-left px-3 py-2 w-[110px]"><SortHeader col="stock" label="Stock" /></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => {
                const s = stockState(p.stock);
                return (
                  <tr key={p.sku} className="border-b" style={{ borderColor: BRAND.line, backgroundColor: i % 2 === 1 ? BRAND.paper : "white", opacity: p.stock === 0 ? 0.5 : 1 }}>
                    <td className="px-3 py-2 mono text-[11px]" style={{ color: BRAND.ink }}>{p.sku}</td>
                    <td className="px-3 py-2 font-medium">{p.name}</td>
                    <td className="px-3 py-2" style={{ color: BRAND.dust }}>{p.brand}</td>
                    <td className="px-3 py-2" style={{ color: BRAND.dust }}>{p.category}</td>
                    <td className="px-3 py-2">
                      <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 border" style={{ borderColor: BRAND.line, color: BRAND.ink }}>{p.tier}</span>
                    </td>
                    <td className="px-3 py-2 mono text-[11px]" style={{ color: BRAND.dust }}>{p.pack}</td>
                    <td className="px-3 py-2 text-right mono font-medium" style={{ color: BRAND.ink }}>{fmtMoney(p.cost)}</td>
                    <td className="px-3 py-2 text-right mono" style={{ color: BRAND.dust }}>{fmtDpg(p.dpg)}</td>
                    <td className="px-3 py-2 text-right mono" style={{ color: BRAND.ink }}>{fmtMoney(p.msrp)}</td>
                    <td className="px-3 py-2 text-right mono font-semibold" style={{ color: BRAND.ink }}>{fmtPct(p.gm_pct)}</td>
                    <td className="px-3 py-2">
                      <span className="inline-block text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5" style={{ color: s.color, backgroundColor: s.bg }}>
                        {s.label}{p.stock > 0 && p.stock <= 5 && ` (${p.stock})`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t text-[10px] mono uppercase tracking-wider flex justify-between" style={{ borderColor: BRAND.line, color: BRAND.dust }}>
          <div>MSRP = wholesale × {MARKUP.toFixed(1)} · GM = (MSRP − Cost) / MSRP</div>
          <div>Updated {new Date().toLocaleString()}</div>
        </div>
      </main>
    </div>
  );
}
