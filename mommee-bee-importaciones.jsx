import { useState, useEffect } from "react";
import { supabase } from "./src/supabaseClient.js";

const C = {
  primary: "#CC9F75",
  accent: "#B36A23",
  dark: "#4C5155",
  bg: "#EDEFEA",
  surface: "#ffffff",
  surfaceAlt: "#f3f3f2",
  border: "#d0d0cf",
  darkGray: "#1a1a1a",
  medGray: "#4a4a4a",
  mutedGray: "#888888",
  green: "#16a34a",    greenBg: "#dcfce7",
  red: "#dc2626",      redBg: "#fee2e2",
  yellow: "#d97706",   yellowBg: "#fef3c7",
  blue: "#2563eb",     blueBg: "#dbeafe",
  purple: "#7c3aed",   purpleBg: "#ede9fe",
  beige: "#D9CCBD",
  lightBlue: "#CEDBE6",
  gray: "#727375",
};

const Card = ({ children, style }) => (
  <div style={{
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 14,
    padding: 20,
    boxShadow: "0 1px 6px rgba(76,81,85,0.06)",
    ...style,
  }}>
    {children}
  </div>
);

const SectionTitle = ({ label, title, action }) => (
  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
    <div>
      <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: C.primary, fontWeight: 700, marginBottom: 2 }}>{label}</div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: C.darkGray, letterSpacing: 1 }}>{title}</div>
    </div>
    {action && action}
  </div>
);

const iStyle = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  padding: "9px 12px",
  fontSize: 13,
  fontFamily: "'DM Sans', sans-serif",
  color: C.darkGray,
  outline: "none",
  width: "100%",
};

const STATUSES = ["Ordered", "In Transit", "In Customs", "Received"];
const ORIGINS = ["China", "USA", "Colombia", "Europe", "Local", "Other"];
const SUPPLIERS_LIST = ["Local Artisan", "China Direct", "US Supplier", "Colombia Source", "Generic"];

const STATUS_META = {
  "Ordered":    { color: C.blue,   bg: C.blueBg,   icon: "📋", next: "In Transit" },
  "In Transit": { color: C.yellow, bg: C.yellowBg, icon: "🚢", next: "In Customs" },
  "In Customs": { color: C.purple, bg: C.purpleBg, icon: "🏛", next: "Received" },
  "Received":   { color: C.green,  bg: C.greenBg,  icon: "✅", next: null },
};

const EMPTY_FORM = {
  date: new Date().toISOString().split("T")[0],
  supplier: "",
  invoice_number: "",
  origin: "China",
  freight_cost: "",
  taxes: "",
  notes: "",
};

const EMPTY_ITEM = { product_code: "", product_name: "", quantity: 1, unit_cost: 0, unit_price: 0, shipping_fee: 0, product_id: null };

export default function MommeeImportaciones({ onNavigate }) {
  const [imports, setImports] = useState([]);
  const [importItems, setImportItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedImport, setSelectedImport] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [items, setItems] = useState([EMPTY_ITEM]);
  const [msg, setMsg] = useState("");
  const [prodSearch, setProdSearch] = useState({});
  const [showDropdown, setShowDropdown] = useState({});

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const year = new Date().getFullYear();
    const yearStart = `${year}-01-01`;
    const [iR, iiR, pR] = await Promise.all([
      supabase.from("imports").select("*").gte("date", yearStart).order("date", { ascending: false }),
      supabase.from("import_items").select("*"),
      supabase.from("products").select("*").eq("status", "Active"),
    ]);
    if (iR.data) setImports(iR.data);
    if (iiR.data) setImportItems(iiR.data);
    if (pR.data) setProducts(pR.data);
    setLoading(false);
  }

  function calcTotal() {
    const itemsTotal = items.reduce((sum, it) => sum + ((parseInt(it.quantity) || 0) * (parseFloat(it.unit_cost) || 0)), 0);
    return itemsTotal + (parseFloat(form.freight_cost) || 0) + (parseFloat(form.taxes) || 0);
  }

  function addItem() {
    setItems(prev => [...prev, { ...EMPTY_ITEM }]);
  }

  function removeItem(idx) {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx, field, value) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  }

  function selectProductForItem(idx, p) {
    setItems(prev => prev.map((it, i) => i === idx ? {
      ...it,
      product_id: p.id,
      product_code: p.code,
      product_name: p.name,
      unit_price: parseFloat(p.price_detal) || 0,
    } : it));
    setProdSearch(prev => ({ ...prev, [idx]: p.code + " — " + p.name }));
    setShowDropdown(prev => ({ ...prev, [idx]: false }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.supplier) { setMsg("Supplier is required."); return; }
    if (items.filter(it => it.product_code).length === 0) { setMsg("Add at least one product."); return; }
    setSaving(true);
    setMsg("");

    const total = calcTotal();

    const { data: impData, error: impErr } = await supabase.from("imports").insert({
      date: form.date,
      supplier: form.supplier,
      invoice_number: form.invoice_number,
      origin: form.origin,
      freight_cost: parseFloat(form.freight_cost) || 0,
      taxes: parseFloat(form.taxes) || 0,
      total_cost: total,
      status: "Ordered",
      notes: form.notes,
    }).select().single();

    if (impErr) { setMsg("Error: " + impErr.message); setSaving(false); return; }

    const validItems = items.filter(it => it.product_code && it.quantity > 0);
    const dbItems = validItems.map(it => ({
      import_id: impData.id,
      product_id: it.product_id,
      product_code: it.product_code,
      product_name: it.product_name,
      quantity: parseInt(it.quantity) || 1,
      unit_cost: parseFloat(it.unit_cost) || 0,
      unit_price: parseFloat(it.unit_price) || 0,
      shipping_fee: parseFloat(it.shipping_fee) || 0,
    }));

    await supabase.from("import_items").insert(dbItems);

    setImports(prev => [impData, ...prev]);
    setImportItems(prev => [...prev, ...dbItems.map((d, i) => ({ ...d, id: Date.now() + i }))]);
    setForm(EMPTY_FORM);
    setItems([EMPTY_ITEM]);
    setProdSearch({});
    setShowForm(false);
    setMsg("Import order created successfully!");
    setTimeout(() => setMsg(""), 3000);
    setSaving(false);
  }

  async function advanceStatus(imp) {
    const meta = STATUS_META[imp.status];
    if (!meta || !meta.next) return;
    const nextStatus = meta.next;

    const { data: updated } = await supabase.from("imports").update({ status: nextStatus }).eq("id", imp.id).select().single();
    if (!updated) return;

    if (nextStatus === "Received") {
      const orderItems = importItems.filter(ii => ii.import_id === imp.id);
      for (const item of orderItems) {
        if (item.product_id) {
          const prod = products.find(p => p.id === item.product_id);
          if (prod) {
            const newStock = (prod.stock || 0) + (item.quantity || 0);
            await supabase.from("products").update({ stock: newStock, updated_at: new Date().toISOString() }).eq("id", item.product_id);
          }
        }
      }
    }

    setImports(prev => prev.map(i => i.id === imp.id ? { ...i, status: nextStatus } : i));
    if (selectedImport && selectedImport.id === imp.id) {
      setSelectedImport(prev => ({ ...prev, status: nextStatus }));
    }
  }

  // Computations
  const year = new Date().getFullYear();
  const activeImports = imports.filter(i => i.status !== "Received");
  const receivedImports = imports.filter(i => i.status === "Received");
  const activeValue = activeImports.reduce((sum, i) => sum + (parseFloat(i.total_cost) || 0), 0);
  const yearValue = imports.reduce((sum, i) => sum + (parseFloat(i.total_cost) || 0), 0);

  const selectedItems = selectedImport ? importItems.filter(ii => ii.import_id === selectedImport.id) : [];

  const filteredProds = (idx) => {
    const q = ((prodSearch[idx] || "").toLowerCase());
    if (!q) return products.slice(0, 8);
    return products.filter(p =>
      p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
    ).slice(0, 8);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: C.primary, letterSpacing: 4 }}>LOADING...</div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", color: C.darkGray }}>
      <style>{`
        @keyframes slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .btn-orange:hover{background:#b8895f!important;transform:translateY(-1px);box-shadow:0 4px 16px rgba(204,159,117,0.3)!important}
        .btn-ghost:hover{border-color:#CC9F75!important;color:#CC9F75!important}
        .row-hover:hover{background:#f8f8f7!important}
      `}</style>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
      <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: "10px", color: C.primary, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "4px" }}>◆ Logistics</div>
          <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "34px", letterSpacing: "0.06em", color: C.darkGray, lineHeight: 1, margin: 0 }}>IMPORTS</h1>
          <p style={{ color: C.mutedGray, fontSize: "12px", marginTop: "4px" }}>{imports.length} orders · {activeImports.length} active</p>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
        <Card>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: C.primary, fontWeight: 700, marginBottom: 4 }}>Active Orders</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 38, color: C.darkGray }}>{activeImports.length}</div>
          <div style={{ fontSize: 12, color: C.mutedGray }}>In progress</div>
        </Card>
        <Card>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: C.primary, fontWeight: 700, marginBottom: 4 }}>Active Investment</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: C.yellow }}>${activeValue.toFixed(0)}</div>
          <div style={{ fontSize: 12, color: C.mutedGray }}>In transit / customs</div>
        </Card>
        <Card>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: C.primary, fontWeight: 700, marginBottom: 4 }}>Received {year}</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 38, color: C.green }}>{receivedImports.length}</div>
          <div style={{ fontSize: 12, color: C.mutedGray }}>Completed orders</div>
        </Card>
        <Card>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: C.primary, fontWeight: 700, marginBottom: 4 }}>Year Investment</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: C.darkGray }}>${yearValue.toFixed(0)}</div>
          <div style={{ fontSize: 12, color: C.mutedGray }}>Total {year}</div>
        </Card>
      </div>

      {msg && (
        <div style={{ padding: "12px 16px", borderRadius: 10, marginBottom: 16, background: msg.includes("Error") ? C.redBg : C.greenBg, color: msg.includes("Error") ? C.red : C.green, fontSize: 13, fontWeight: 600 }}>
          {msg}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: selectedImport ? "1fr 1fr" : "1fr", gap: 20 }}>
        {/* Left: Import List + Form */}
        <div>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: C.primary, fontWeight: 700, marginBottom: 2 }}>Orders</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: C.darkGray }}>Import Orders ({imports.length})</div>
              </div>
              <button
                className="btn-primary"
                onClick={() => { setShowForm(!showForm); setSelectedImport(null); }}
                style={{ background: C.primary, color: "white", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
              >
                {showForm ? "Cancel" : "+ New Import"}
              </button>
            </div>

            {imports.map(imp => {
              const meta = STATUS_META[imp.status] || { color: C.mutedGray, bg: C.surfaceAlt, icon: "?", next: null };
              const impItems = importItems.filter(ii => ii.import_id === imp.id);
              return (
                <div
                  key={imp.id}
                  onClick={() => { setSelectedImport(selectedImport && selectedImport.id === imp.id ? null : imp); setShowForm(false); }}
                  style={{
                    padding: "14px 16px",
                    borderRadius: 10,
                    marginBottom: 10,
                    border: `1px solid ${selectedImport && selectedImport.id === imp.id ? C.primary : C.border}`,
                    background: selectedImport && selectedImport.id === imp.id ? `${C.primary}06` : C.surfaceAlt,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, color: C.darkGray, fontWeight: 600 }}>{imp.supplier || "—"}</div>
                      <div style={{ fontSize: 11, color: C.mutedGray }}>
                        {imp.invoice_number || "No invoice"} · {imp.origin || "—"} · {imp.date}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 16, fontFamily: "'Bebas Neue', sans-serif", color: C.darkGray }}>${(parseFloat(imp.total_cost) || 0).toFixed(2)}</div>
                      <span style={{ background: meta.bg, color: meta.color, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>
                        {meta.icon} {imp.status}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: C.mutedGray }}>{impItems.length} products</span>
                    {meta.next && (
                      <button
                        onClick={e => { e.stopPropagation(); advanceStatus(imp); }}
                        style={{
                          background: meta.color,
                          color: "white",
                          border: "none",
                          borderRadius: 6,
                          padding: "5px 12px",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        → {meta.next}
                      </button>
                    )}
                  </div>

                  {/* Status progress bar */}
                  <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
                    {STATUSES.map((s, i) => {
                      const currentIdx = STATUSES.indexOf(imp.status);
                      return (
                        <div key={s} style={{
                          flex: 1,
                          height: 4,
                          borderRadius: 2,
                          background: i <= currentIdx ? meta.color : C.border,
                          opacity: i <= currentIdx ? 1 : 0.4,
                        }} />
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {imports.length === 0 && !showForm && (
              <div style={{ color: C.mutedGray, fontSize: 13, textAlign: "center", padding: "24px 0" }}>No imports this year. Create your first order!</div>
            )}
          </Card>
        </div>

        {/* Right: Detail or Form */}
        {selectedImport && !showForm && (
          <Card>
            <SectionTitle
              label={`Import #${selectedImport.id}`}
              title="Order Details"
              action={
                <button onClick={() => setSelectedImport(null)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: C.mutedGray }}>×</button>
              }
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[
                { label: "Supplier", value: selectedImport.supplier },
                { label: "Invoice", value: selectedImport.invoice_number || "—" },
                { label: "Date", value: selectedImport.date },
                { label: "Origin", value: selectedImport.origin },
                { label: "Freight", value: `$${(parseFloat(selectedImport.freight_cost) || 0).toFixed(2)}` },
                { label: "Taxes", value: `$${(parseFloat(selectedImport.taxes) || 0).toFixed(2)}` },
              ].map(({ label, value }) => (
                <div key={label} style={{ padding: "10px 14px", background: C.surfaceAlt, borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: C.mutedGray, fontWeight: 600, marginBottom: 2, textTransform: "uppercase" }}>{label}</div>
                  <div style={{ fontSize: 13, color: C.darkGray, fontWeight: 500 }}>{value}</div>
                </div>
              ))}
            </div>

            {(() => {
              const meta = STATUS_META[selectedImport.status] || { color: C.mutedGray, bg: C.surfaceAlt, icon: "?" };
              return (
                <div style={{ padding: "12px 16px", background: meta.bg, borderRadius: 8, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: meta.color }}>{meta.icon} {selectedImport.status}</span>
                  <span style={{ fontSize: 20, fontFamily: "'Bebas Neue', sans-serif", color: C.darkGray }}>TOTAL: ${(parseFloat(selectedImport.total_cost) || 0).toFixed(2)}</span>
                </div>
              );
            })()}

            <div style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: C.mutedGray, fontWeight: 600, marginBottom: 12 }}>
              Products ({selectedItems.length})
            </div>

            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  {["Code", "Product", "Qty", "Unit Cost", "Subtotal"].map(h => (
                    <th key={h} style={{ padding: "6px 8px", textAlign: "left", color: C.mutedGray, fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedItems.map((it, i) => (
                  <tr key={i} className="row-hover" style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "8px 8px", color: C.primary, fontWeight: 700 }}>{it.product_code}</td>
                    <td style={{ padding: "8px 8px", color: C.darkGray }}>{it.product_name}</td>
                    <td style={{ padding: "8px 8px", color: C.medGray }}>{it.quantity}</td>
                    <td style={{ padding: "8px 8px", color: C.medGray }}>${(parseFloat(it.unit_cost) || 0).toFixed(2)}</td>
                    <td style={{ padding: "8px 8px", color: C.darkGray, fontWeight: 700 }}>${((it.quantity || 0) * (parseFloat(it.unit_cost) || 0)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {selectedImport.notes && (
              <div style={{ marginTop: 14, padding: "10px 14px", background: C.surfaceAlt, borderRadius: 8, fontSize: 12, color: C.medGray }}>
                <span style={{ fontWeight: 600, color: C.darkGray }}>Notes: </span>{selectedImport.notes}
              </div>
            )}
          </Card>
        )}

        {/* New Import Form */}
        {showForm && (
          <Card>
            <SectionTitle label="New Order" title="Create Import" />
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 11, color: C.mutedGray, fontWeight: 600, display: "block", marginBottom: 4 }}>Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={iStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: C.mutedGray, fontWeight: 600, display: "block", marginBottom: 4 }}>Supplier *</label>
                  <input type="text" placeholder="Supplier name" value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} style={iStyle} list="suppliers-list" />
                  <datalist id="suppliers-list">{SUPPLIERS_LIST.map(s => <option key={s} value={s} />)}</datalist>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: C.mutedGray, fontWeight: 600, display: "block", marginBottom: 4 }}>Invoice Number</label>
                  <input type="text" placeholder="INV-001" value={form.invoice_number} onChange={e => setForm(f => ({ ...f, invoice_number: e.target.value }))} style={iStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: C.mutedGray, fontWeight: 600, display: "block", marginBottom: 4 }}>Origin</label>
                  <select value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value }))} style={iStyle}>
                    {ORIGINS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: C.mutedGray, fontWeight: 600, display: "block", marginBottom: 4 }}>Freight Cost (USD)</label>
                  <input type="number" step="0.01" min="0" placeholder="0.00" value={form.freight_cost} onChange={e => setForm(f => ({ ...f, freight_cost: e.target.value }))} style={iStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: C.mutedGray, fontWeight: 600, display: "block", marginBottom: 4 }}>Taxes (USD)</label>
                  <input type="number" step="0.01" min="0" placeholder="0.00" value={form.taxes} onChange={e => setForm(f => ({ ...f, taxes: e.target.value }))} style={iStyle} />
                </div>
              </div>

              <div style={{ fontSize: 11, color: C.mutedGray, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Products</div>

              {items.map((item, idx) => (
                <div key={idx} style={{ padding: 12, border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 10, background: C.surfaceAlt }}>
                  <div style={{ position: "relative", marginBottom: 8 }}>
                    <input
                      type="text"
                      placeholder="Search product by name or code..."
                      value={prodSearch[idx] || ""}
                      onChange={e => {
                        setProdSearch(prev => ({ ...prev, [idx]: e.target.value }));
                        setShowDropdown(prev => ({ ...prev, [idx]: true }));
                        updateItem(idx, "product_code", "");
                      }}
                      onFocus={() => setShowDropdown(prev => ({ ...prev, [idx]: true }))}
                      style={{ ...iStyle, background: C.surface }}
                    />
                    {showDropdown[idx] && (
                      <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 50, maxHeight: 180, overflowY: "auto", marginTop: 4 }}>
                        {filteredProds(idx).map(p => (
                          <div
                            key={p.id}
                            onClick={() => selectProductForItem(idx, p)}
                            style={{ padding: "8px 12px", cursor: "pointer", fontSize: 12, borderBottom: `1px solid ${C.border}` }}
                            onMouseEnter={e => e.currentTarget.style.background = C.surfaceAlt}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          >
                            <span style={{ color: C.primary, fontWeight: 700, marginRight: 8 }}>{p.code}</span>{p.name}
                            <span style={{ float: "right", color: C.mutedGray }}>Stock: {p.stock}</span>
                          </div>
                        ))}
                        {filteredProds(idx).length === 0 && <div style={{ padding: "10px 12px", color: C.mutedGray, fontSize: 12 }}>No products found. You can type manually.</div>}
                      </div>
                    )}
                  </div>
                  {!item.product_id && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                      <input type="text" placeholder="Product Code" value={item.product_code} onChange={e => updateItem(idx, "product_code", e.target.value)} style={{ ...iStyle, padding: "7px 10px" }} />
                      <input type="text" placeholder="Product Name" value={item.product_name} onChange={e => updateItem(idx, "product_name", e.target.value)} style={{ ...iStyle, padding: "7px 10px" }} />
                    </div>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8, alignItems: "end" }}>
                    <div>
                      <label style={{ fontSize: 10, color: C.mutedGray, fontWeight: 600, display: "block", marginBottom: 3 }}>Qty</label>
                      <input type="number" min="1" value={item.quantity} onChange={e => updateItem(idx, "quantity", e.target.value)} style={{ ...iStyle, padding: "7px 10px" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: C.mutedGray, fontWeight: 600, display: "block", marginBottom: 3 }}>Unit Cost (USD)</label>
                      <input type="number" step="0.01" min="0" value={item.unit_cost} onChange={e => updateItem(idx, "unit_cost", e.target.value)} style={{ ...iStyle, padding: "7px 10px" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: C.mutedGray, fontWeight: 600, display: "block", marginBottom: 3 }}>Retail Price</label>
                      <input type="number" step="0.01" min="0" value={item.unit_price} onChange={e => updateItem(idx, "unit_price", e.target.value)} style={{ ...iStyle, padding: "7px 10px" }} />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      disabled={items.length === 1}
                      style={{ background: C.redBg, border: "none", color: C.red, borderRadius: 6, padding: "7px 12px", cursor: "pointer", fontWeight: 700, fontSize: 14 }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addItem}
                style={{ background: "transparent", border: `1px dashed ${C.border}`, borderRadius: 8, padding: "9px 16px", fontSize: 13, cursor: "pointer", color: C.medGray, fontFamily: "'DM Sans', sans-serif", width: "100%", marginBottom: 14 }}
              >
                + Add Product
              </button>

              <div style={{ padding: "12px 16px", background: `${C.primary}10`, borderRadius: 8, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: C.medGray }}>Items subtotal</span>
                  <span>${items.reduce((s, it) => s + ((parseInt(it.quantity) || 0) * (parseFloat(it.unit_cost) || 0)), 0).toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: C.medGray }}>Freight</span>
                  <span>${(parseFloat(form.freight_cost) || 0).toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: C.medGray }}>Taxes</span>
                  <span>${(parseFloat(form.taxes) || 0).toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700, borderTop: `1px solid ${C.border}`, marginTop: 8, paddingTop: 8 }}>
                  <span style={{ color: C.darkGray }}>TOTAL</span>
                  <span style={{ color: C.primary, fontFamily: "'Bebas Neue', sans-serif", fontSize: 22 }}>${calcTotal().toFixed(2)}</span>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, color: C.mutedGray, fontWeight: 600, display: "block", marginBottom: 4 }}>Notes</label>
                <input type="text" placeholder="Additional notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={iStyle} />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
                style={{ width: "100%", background: saving ? C.mutedGray : C.primary, color: "white", border: "none", borderRadius: 10, padding: "13px 20px", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif" }}
              >
                {saving ? "Creating Order..." : `Create Import · $${calcTotal().toFixed(2)}`}
              </button>
            </form>
          </Card>
        )}
      </div>
      </div>
    </div>
  );
}
