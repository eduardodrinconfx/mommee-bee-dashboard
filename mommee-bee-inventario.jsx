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

const CATEGORIES = ["All", "Clothing", "Accessories", "Nursery", "Care", "Gift Sets", "Others"];
const SUPPLIERS = ["All", "Local Artisan", "China Direct", "US Supplier", "Colombia Source", "Generic"];
const STATUS_OPTIONS = ["Active", "Inactive", "Discontinued"];

const EMPTY_PRODUCT = {
  code: "", name: "", category: "Clothing", unit: "Piece",
  cost: 0, price_detal: 0, price_mayor: 0,
  stock: 0, min_stock: 5, min_mayor: 6,
  supplier: "Local Artisan", origin: "Local", status: "Active",
};

export default function MommeeInventario({ onNavigate }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [filterSupp, setFilterSupp] = useState("All");
  const [filterStatus, setFilterStatus] = useState("Active");
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [newProd, setNewProd] = useState(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => { loadProducts(); }, []);

  async function loadProducts() {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").order("category").order("name");
    if (data) setProducts(data);
    setLoading(false);
  }

  const filtered = products.filter(p => {
    if (filterCat !== "All" && p.category !== filterCat) return false;
    if (filterSupp !== "All" && p.supplier !== filterSupp) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || (p.supplier && p.supplier.toLowerCase().includes(q));
    }
    return true;
  });

  const activeProducts = products.filter(p => p.status === "Active");
  const inventoryValue = activeProducts.reduce((sum, p) => sum + ((p.stock || 0) * (parseFloat(p.cost) || 0)), 0);
  const retailValue = activeProducts.reduce((sum, p) => sum + ((p.stock || 0) * (parseFloat(p.price_detal) || 0)), 0);
  const criticalCount = activeProducts.filter(p => p.stock <= p.min_stock).length;

  function startEdit(p) {
    setEditingId(p.id);
    setEditData({ ...p });
  }

  async function saveEdit() {
    setSaving(true);
    const { error } = await supabase.from("products").update({
      name: editData.name,
      category: editData.category,
      cost: parseFloat(editData.cost) || 0,
      price_detal: parseFloat(editData.price_detal) || 0,
      price_mayor: parseFloat(editData.price_mayor) || 0,
      stock: parseInt(editData.stock) || 0,
      min_stock: parseInt(editData.min_stock) || 0,
      supplier: editData.supplier,
      origin: editData.origin,
      status: editData.status,
      updated_at: new Date().toISOString(),
    }).eq("id", editingId);

    if (!error) {
      setProducts(prev => prev.map(p => p.id === editingId ? { ...p, ...editData } : p));
      setEditingId(null);
      setEditData({});
    }
    setSaving(false);
  }

  async function addProduct() {
    if (!newProd.code || !newProd.name) { setMsg("Code and name are required."); return; }
    setSaving(true);
    const { data, error } = await supabase.from("products").insert({
      code: newProd.code,
      name: newProd.name,
      category: newProd.category,
      unit: newProd.unit,
      cost: parseFloat(newProd.cost) || 0,
      price_detal: parseFloat(newProd.price_detal) || 0,
      price_mayor: parseFloat(newProd.price_mayor) || 0,
      stock: parseInt(newProd.stock) || 0,
      min_stock: parseInt(newProd.min_stock) || 0,
      min_mayor: parseInt(newProd.min_mayor) || 1,
      supplier: newProd.supplier,
      origin: newProd.origin,
      status: newProd.status,
    }).select().single();

    if (!error && data) {
      setProducts(prev => [...prev, data]);
      setNewProd(EMPTY_PRODUCT);
      setShowAdd(false);
      setMsg("Product added successfully!");
      setTimeout(() => setMsg(""), 3000);
    } else if (error) {
      setMsg("Error: " + error.message);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: C.primary, letterSpacing: 4 }}>LOADING...</div>
      </div>
    );
  }

  return (
    <div style={{ animation: "slideIn 0.3s ease both" }}>
      <div style={{ fontSize: 10, color: C.primary, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4 }}>◆ Product Management</div>
      <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 34, letterSpacing: "0.06em", color: C.darkGray, lineHeight: 1, margin: 0 }}>INVENTORY</h1>
      <p style={{ color: C.mutedGray, fontSize: 12, marginTop: 4 }}>Product catalog and stock management</p>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
        <Card>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: C.primary, fontWeight: 700, marginBottom: 4 }}>Active SKUs</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 38, color: C.darkGray }}>{activeProducts.length}</div>
          <div style={{ fontSize: 12, color: C.mutedGray }}>{products.length} total products</div>
        </Card>
        <Card>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: C.primary, fontWeight: 700, marginBottom: 4 }}>Inventory Value</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: C.darkGray }}>${inventoryValue.toFixed(0)}</div>
          <div style={{ fontSize: 12, color: C.mutedGray }}>At cost price</div>
        </Card>
        <Card>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: C.primary, fontWeight: 700, marginBottom: 4 }}>Retail Value</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: C.green }}>${retailValue.toFixed(0)}</div>
          <div style={{ fontSize: 12, color: C.mutedGray }}>At retail price</div>
        </Card>
        <Card>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: C.primary, fontWeight: 700, marginBottom: 4 }}>Critical Stock</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 38, color: criticalCount > 0 ? C.red : C.green }}>{criticalCount}</div>
          <div style={{ fontSize: 12, color: C.mutedGray }}>Below minimum</div>
        </Card>
      </div>

      {/* Filters + Actions */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search by name, code or supplier..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...iStyle, width: 280 }}
          />
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ ...iStyle, width: 160 }}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterSupp} onChange={e => setFilterSupp(e.target.value)} style={{ ...iStyle, width: 170 }}>
            {SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...iStyle, width: 140 }}>
            <option value="">All Status</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div style={{ marginLeft: "auto" }}>
            <button
              className="btn-primary"
              onClick={() => setShowAdd(!showAdd)}
              style={{
                background: C.primary,
                color: "white",
                border: "none",
                borderRadius: 8,
                padding: "9px 18px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {showAdd ? "Cancel" : "+ Add Product"}
            </button>
          </div>
        </div>

        {msg && (
          <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: msg.includes("Error") ? C.redBg : C.greenBg, color: msg.includes("Error") ? C.red : C.green, fontSize: 13, fontWeight: 600 }}>
            {msg}
          </div>
        )}
      </Card>

      {/* Add Product Form */}
      {showAdd && (
        <Card style={{ marginBottom: 16, border: `2px solid ${C.primary}` }}>
          <SectionTitle label="New Product" title="Add to Catalog" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: C.mutedGray, fontWeight: 600, display: "block", marginBottom: 4 }}>Code *</label>
              <input type="text" placeholder="MB-XXX" value={newProd.code} onChange={e => setNewProd(p => ({ ...p, code: e.target.value }))} style={iStyle} />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: 11, color: C.mutedGray, fontWeight: 600, display: "block", marginBottom: 4 }}>Product Name *</label>
              <input type="text" placeholder="e.g. Organic Cotton Onesie" value={newProd.name} onChange={e => setNewProd(p => ({ ...p, name: e.target.value }))} style={iStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: C.mutedGray, fontWeight: 600, display: "block", marginBottom: 4 }}>Category</label>
              <select value={newProd.category} onChange={e => setNewProd(p => ({ ...p, category: e.target.value }))} style={iStyle}>
                {CATEGORIES.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 12 }}>
            {[
              { key: "cost", label: "Cost (USD)" },
              { key: "price_detal", label: "Retail Price" },
              { key: "price_mayor", label: "Wholesale Price" },
              { key: "stock", label: "Initial Stock" },
              { key: "min_stock", label: "Min Stock" },
              { key: "min_mayor", label: "Min Wholesale" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label style={{ fontSize: 11, color: C.mutedGray, fontWeight: 600, display: "block", marginBottom: 4 }}>{label}</label>
                <input type="number" step="0.01" min="0" value={newProd[key]} onChange={e => setNewProd(p => ({ ...p, [key]: e.target.value }))} style={iStyle} />
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: C.mutedGray, fontWeight: 600, display: "block", marginBottom: 4 }}>Supplier</label>
              <select value={newProd.supplier} onChange={e => setNewProd(p => ({ ...p, supplier: e.target.value }))} style={iStyle}>
                {SUPPLIERS.filter(s => s !== "All").map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: C.mutedGray, fontWeight: 600, display: "block", marginBottom: 4 }}>Origin</label>
              <select value={newProd.origin} onChange={e => setNewProd(p => ({ ...p, origin: e.target.value }))} style={iStyle}>
                {["Local","China","USA","Colombia","Europe","Other"].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: C.mutedGray, fontWeight: 600, display: "block", marginBottom: 4 }}>Unit</label>
              <select value={newProd.unit} onChange={e => setNewProd(p => ({ ...p, unit: e.target.value }))} style={iStyle}>
                {["Piece","Set","Kit","Pack","Unit","Box"].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button
                className="btn-primary"
                onClick={addProduct}
                disabled={saving}
                style={{
                  width: "100%",
                  background: saving ? C.mutedGray : C.primary,
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: saving ? "not-allowed" : "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {saving ? "Saving..." : "Add Product"}
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Products Table */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: C.primary, fontWeight: 700, marginBottom: 2 }}>Catalog</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: C.darkGray, letterSpacing: 1 }}>
              Product Inventory ({filtered.length})
            </div>
          </div>
          {editingId && (
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-ghost" onClick={() => { setEditingId(null); setEditData({}); }} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 14px", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
              <button className="btn-primary" onClick={saveEdit} disabled={saving} style={{ background: C.primary, color: "white", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", minWidth: 1000 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                {["Code", "Name", "Category", "Stock", "Min", "Cost", "Retail", "Wholesale", "Supplier", "Origin", "Status"].map(h => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: C.mutedGray, fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8, whiteSpace: "nowrap" }}>{h}</th>
                ))}
                <th style={{ padding: "8px 10px", color: C.mutedGray, fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>Edit</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr className="row-hover"><td colSpan={12} style={{ padding: 24, textAlign: "center", color: C.mutedGray }}>No products found</td></tr>
              )}
              {filtered.map(p => {
                const isCritical = p.stock <= p.min_stock && p.status === "Active";
                const isEditing = editingId === p.id;
                return (
                  <tr key={p.id} className="row-hover" style={{ borderBottom: `1px solid ${C.border}`, background: isCritical ? `${C.red}06` : "transparent" }}>
                    <td style={{ padding: "9px 10px", color: C.primary, fontWeight: 700 }}>{p.code}</td>
                    <td style={{ padding: "9px 10px" }}>
                      {isEditing
                        ? <input type="text" value={editData.name} onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} style={{ ...iStyle, padding: "5px 8px" }} />
                        : <span style={{ color: C.darkGray, fontWeight: 500 }}>{p.name}</span>
                      }
                    </td>
                    <td style={{ padding: "9px 10px" }}>
                      {isEditing
                        ? <select value={editData.category} onChange={e => setEditData(d => ({ ...d, category: e.target.value }))} style={{ ...iStyle, padding: "5px 8px" }}>
                            {CATEGORIES.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        : <span style={{ color: C.medGray }}>{p.category}</span>
                      }
                    </td>
                    <td style={{ padding: "9px 10px" }}>
                      {isEditing
                        ? <input type="number" min="0" value={editData.stock} onChange={e => setEditData(d => ({ ...d, stock: e.target.value }))} style={{ ...iStyle, padding: "5px 8px", width: 80 }} />
                        : <span style={{ color: isCritical ? C.red : C.darkGray, fontWeight: isCritical ? 700 : 400 }}>{p.stock}{isCritical && " ⚠"}</span>
                      }
                    </td>
                    <td style={{ padding: "9px 10px", color: C.mutedGray }}>{p.min_stock}</td>
                    <td style={{ padding: "9px 10px" }}>
                      {isEditing
                        ? <input type="number" step="0.01" min="0" value={editData.cost} onChange={e => setEditData(d => ({ ...d, cost: e.target.value }))} style={{ ...iStyle, padding: "5px 8px", width: 90 }} />
                        : <span style={{ color: C.medGray }}>${parseFloat(p.cost).toFixed(2)}</span>
                      }
                    </td>
                    <td style={{ padding: "9px 10px" }}>
                      {isEditing
                        ? <input type="number" step="0.01" min="0" value={editData.price_detal} onChange={e => setEditData(d => ({ ...d, price_detal: e.target.value }))} style={{ ...iStyle, padding: "5px 8px", width: 90 }} />
                        : <span style={{ color: C.darkGray, fontWeight: 600 }}>${parseFloat(p.price_detal).toFixed(2)}</span>
                      }
                    </td>
                    <td style={{ padding: "9px 10px" }}>
                      {isEditing
                        ? <input type="number" step="0.01" min="0" value={editData.price_mayor} onChange={e => setEditData(d => ({ ...d, price_mayor: e.target.value }))} style={{ ...iStyle, padding: "5px 8px", width: 90 }} />
                        : <span style={{ color: C.medGray }}>${parseFloat(p.price_mayor).toFixed(2)}</span>
                      }
                    </td>
                    <td style={{ padding: "9px 10px", color: C.medGray }}>{p.supplier}</td>
                    <td style={{ padding: "9px 10px", color: C.medGray }}>{p.origin}</td>
                    <td style={{ padding: "9px 10px" }}>
                      {isEditing
                        ? <select value={editData.status} onChange={e => setEditData(d => ({ ...d, status: e.target.value }))} style={{ ...iStyle, padding: "5px 8px" }}>
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        : <span style={{
                            background: p.status === "Active" ? C.greenBg : C.surfaceAlt,
                            color: p.status === "Active" ? C.green : C.mutedGray,
                            borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600,
                          }}>
                            {p.status}
                          </span>
                      }
                    </td>
                    <td style={{ padding: "9px 10px" }}>
                      {isEditing
                        ? null
                        : <button
                            className="btn-ghost"
                            onClick={() => startEdit(p)}
                            style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", color: C.medGray, fontFamily: "'DM Sans', sans-serif" }}
                          >
                            Edit
                          </button>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
