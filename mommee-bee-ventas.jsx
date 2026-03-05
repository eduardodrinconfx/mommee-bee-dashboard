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

const PLATFORMS = ["Instagram", "WhatsApp", "Website", "Boutique", "Marketplace"];
const PAYMENT_METHODS = ["Mobile Payment", "Transfer", "Zelle", "Cash USD", "Cash Bs"];
const PAYMENT_STATUSES = ["Paid", "Pending", "Partial"];
const REGIONS = [
  "Amazonas","Anzoátegui","Apure","Aragua","Barinas","Bolívar","Carabobo",
  "Cojedes","Delta Amacuro","Distrito Capital","Falcón","Guárico","Lara",
  "Mérida","Miranda","Monagas","Nueva Esparta","Portuguesa","Sucre",
  "Táchira","Trujillo","Vargas","Yaracuy","Zulia","International"
];

const INITIAL_FORM = {
  date: new Date().toISOString().split("T")[0],
  customerName: "",
  customerPhone: "",
  platform: "Instagram",
  paymentMethod: "Zelle",
  paymentStatus: "Paid",
  saleType: "Retail",
  region: "Distrito Capital",
  notes: "",
};

export default function MommeeVentas({ onNavigate, clients, setClients }) {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [saleItems, setSaleItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(INITIAL_FORM);
  const [cart, setCart] = useState([]);
  const [prodSearch, setProdSearch] = useState("");
  const [selectedProd, setSelectedProd] = useState(null);
  const [qty, setQty] = useState(1);
  const [showDropdown, setShowDropdown] = useState(false);

  const [filterDate, setFilterDate] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [activeTab, setActiveTab] = useState("form");
  const [msg, setMsg] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const year = new Date().getFullYear();
    const yearStart = `${year}-01-01`;
    const [pR, sR, siR] = await Promise.all([
      supabase.from("products").select("*").eq("status", "Active").order("name"),
      supabase.from("sales").select("*").gte("date", yearStart).order("date", { ascending: false }),
      supabase.from("sale_items").select("*"),
    ]);
    if (pR.data) setProducts(pR.data);
    if (sR.data) setSales(sR.data);
    if (siR.data) setSaleItems(siR.data);
    setLoading(false);
  }

  const filteredProds = products.filter(p => {
    if (!prodSearch) return true;
    const q = prodSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
  });

  function selectProduct(p) {
    setSelectedProd(p);
    setProdSearch(p.code + " — " + p.name);
    setShowDropdown(false);
  }

  function addToCart() {
    if (!selectedProd) return;
    const price = form.saleType === "Wholesale"
      ? parseFloat(selectedProd.price_mayor)
      : parseFloat(selectedProd.price_detal);
    const q = parseInt(qty) || 1;

    setCart(prev => {
      const existing = prev.find(item => item.product_id === selectedProd.id);
      if (existing) {
        return prev.map(item =>
          item.product_id === selectedProd.id
            ? { ...item, quantity: item.quantity + q }
            : item
        );
      }
      return [...prev, {
        product_id: selectedProd.id,
        product_code: selectedProd.code,
        product_name: selectedProd.name,
        quantity: q,
        unit_price: price,
        cost: parseFloat(selectedProd.cost) || 0,
      }];
    });

    setSelectedProd(null);
    setProdSearch("");
    setQty(1);
  }

  function removeFromCart(productId) {
    setCart(prev => prev.filter(item => item.product_id !== productId));
  }

  function updateCartQty(productId, newQty) {
    const q = parseInt(newQty) || 1;
    setCart(prev => prev.map(item =>
      item.product_id === productId ? { ...item, quantity: q } : item
    ));
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  async function handleSubmit(e) {
    e.preventDefault();
    if (cart.length === 0) { setMsg("Add at least one product to the cart."); return; }
    setSaving(true);
    setMsg("");

    let clientId = null;
    if (form.customerPhone) {
      const found = clients.find(c => c.phone === form.customerPhone);
      if (found) {
        clientId = found.id;
      } else if (form.customerName) {
        const { data: newClient } = await supabase.from("clients").insert({
          name: form.customerName,
          phone: form.customerPhone,
          vz_state: form.region,
          tipo: form.saleType,
          status: "Active",
        }).select().single();
        if (newClient) {
          clientId = newClient.id;
          setClients(prev => [...prev, newClient]);
        }
      }
    }

    const { data: saleData, error: saleErr } = await supabase.from("sales").insert({
      date: form.date,
      client_id: clientId,
      customer_name: form.customerName,
      platform: form.platform,
      payment_method: form.paymentMethod,
      payment_status: form.paymentStatus,
      sale_type: form.saleType,
      vz_state: form.region,
      notes: form.notes,
      total_usd: cartTotal,
    }).select().single();

    if (saleErr) { setMsg("Error saving sale: " + saleErr.message); setSaving(false); return; }

    const items = cart.map(item => ({
      sale_id: saleData.id,
      product_id: item.product_id,
      product_code: item.product_code,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));
    await supabase.from("sale_items").insert(items);

    for (const item of cart) {
      const prod = products.find(p => p.id === item.product_id);
      if (prod) {
        const newStock = Math.max(0, (prod.stock || 0) - item.quantity);
        await supabase.from("products").update({ stock: newStock, updated_at: new Date().toISOString() }).eq("id", item.product_id);
        setProducts(prev => prev.map(p => p.id === item.product_id ? { ...p, stock: newStock } : p));
      }
    }

    setMsg("Sale saved successfully!");
    setCart([]);
    setForm(INITIAL_FORM);
    setSaving(false);
    loadData();
    setTimeout(() => setMsg(""), 3000);
  }

  const filteredSales = sales.filter(s => {
    if (filterDate && s.date !== filterDate) return false;
    if (filterPlatform && s.platform !== filterPlatform) return false;
    if (filterStatus && s.payment_status !== filterStatus) return false;
    return true;
  });

  const totalFiltered = filteredSales.reduce((sum, s) => sum + (parseFloat(s.total_usd) || 0), 0);
  const pendingFiltered = filteredSales.filter(s => s.payment_status === "Pending" || s.payment_status === "Partial");
  const pendingAmt = pendingFiltered.reduce((sum, s) => sum + (parseFloat(s.total_usd) || 0), 0);
  const avgTicket = filteredSales.length > 0 ? totalFiltered / filteredSales.length : 0;

  const STATUS_STYLE = {
    Paid: { color: C.green, bg: C.greenBg },
    Pending: { color: C.red, bg: C.redBg },
    Partial: { color: C.yellow, bg: C.yellowBg },
  };

  return (
    <div style={{ animation: "slideIn 0.3s ease both" }}>
      {/* PAGE HEADER */}
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 10, color: C.primary, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4 }}>◆ Sales Module</div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 34, letterSpacing: "0.06em", color: C.darkGray, lineHeight: 1, margin: 0 }}>SALES</h1>
          <p style={{ color: C.mutedGray, fontSize: 12, marginTop: 4 }}>Manage and track all transactions</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[["form", "New Sale"], ["history", "Sales History"]].map(([key, label]) => (
          <button
            key={key}
            className={activeTab === key ? "btn-primary" : "btn-ghost"}
            onClick={() => setActiveTab(key)}
            style={{
              background: activeTab === key ? C.primary : C.surface,
              color: activeTab === key ? "white" : C.medGray,
              border: `1px solid ${activeTab === key ? C.primary : C.border}`,
              borderRadius: 8,
              padding: "9px 20px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "form" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20 }}>
          {/* Sale Form */}
          <Card>
            <SectionTitle label="New Transaction" title="Register Sale" />
            {msg && (
              <div style={{
                padding: "10px 14px",
                borderRadius: 8,
                marginBottom: 16,
                background: msg.includes("Error") ? C.redBg : C.greenBg,
                color: msg.includes("Error") ? C.red : C.green,
                fontSize: 13,
                fontWeight: 600,
              }}>
                {msg}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 11, color: C.mutedGray, fontWeight: 600, display: "block", marginBottom: 5 }}>Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={iStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: C.mutedGray, fontWeight: 600, display: "block", marginBottom: 5 }}>Sale Type</label>
                  <select value={form.saleType} onChange={e => setForm(f => ({ ...f, saleType: e.target.value }))} style={iStyle}>
                    <option value="Retail">Retail</option>
                    <option value="Wholesale">Wholesale</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: C.mutedGray, fontWeight: 600, display: "block", marginBottom: 5 }}>Platform</label>
                  <select value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))} style={iStyle}>
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 11, color: C.mutedGray, fontWeight: 600, display: "block", marginBottom: 5 }}>Customer Name</label>
                  <input type="text" placeholder="e.g. María García" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} style={iStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: C.mutedGray, fontWeight: 600, display: "block", marginBottom: 5 }}>Phone (for CRM)</label>
                  <input type="text" placeholder="e.g. +58 412 000 0000" value={form.customerPhone} onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))} style={iStyle} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 11, color: C.mutedGray, fontWeight: 600, display: "block", marginBottom: 5 }}>Payment Method</label>
                  <select value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))} style={iStyle}>
                    {PAYMENT_METHODS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: C.mutedGray, fontWeight: 600, display: "block", marginBottom: 5 }}>Payment Status</label>
                  <select value={form.paymentStatus} onChange={e => setForm(f => ({ ...f, paymentStatus: e.target.value }))} style={iStyle}>
                    {PAYMENT_STATUSES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: C.mutedGray, fontWeight: 600, display: "block", marginBottom: 5 }}>Region</label>
                  <select value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} style={iStyle}>
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              {/* Product Search */}
              <div style={{ background: C.surfaceAlt, borderRadius: 10, padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: C.mutedGray, fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
                  Add Products to Cart
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: 1, position: "relative" }}>
                    <input
                      type="text"
                      placeholder="Search by name or code..."
                      value={prodSearch}
                      onChange={e => { setProdSearch(e.target.value); setSelectedProd(null); setShowDropdown(true); }}
                      onFocus={() => setShowDropdown(true)}
                      style={{ ...iStyle, background: C.surface }}
                    />
                    {showDropdown && prodSearch && filteredProds.length > 0 && (
                      <div style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        background: C.surface,
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                        zIndex: 50,
                        maxHeight: 220,
                        overflowY: "auto",
                        marginTop: 4,
                      }}>
                        {filteredProds.map(p => (
                          <div
                            key={p.id}
                            onClick={() => selectProduct(p)}
                            style={{
                              padding: "10px 14px",
                              cursor: "pointer",
                              borderBottom: `1px solid ${C.border}`,
                              fontSize: 13,
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = C.surfaceAlt}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          >
                            <span style={{ color: C.primary, fontWeight: 700, marginRight: 8 }}>{p.code}</span>
                            <span style={{ color: C.darkGray }}>{p.name}</span>
                            <span style={{ color: C.mutedGray, marginLeft: 8 }}>
                              ${form.saleType === "Wholesale" ? parseFloat(p.price_mayor).toFixed(2) : parseFloat(p.price_detal).toFixed(2)}
                            </span>
                            <span style={{ float: "right", fontSize: 11, color: p.stock <= p.min_stock ? C.red : C.mutedGray }}>
                              Stock: {p.stock}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={e => setQty(e.target.value)}
                    style={{ ...iStyle, width: 80, textAlign: "center" }}
                  />
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={addToCart}
                    disabled={!selectedProd}
                    style={{
                      background: selectedProd ? C.primary : C.mutedGray,
                      color: "white",
                      border: "none",
                      borderRadius: 8,
                      padding: "9px 18px",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: selectedProd ? "pointer" : "not-allowed",
                      fontFamily: "'DM Sans', sans-serif",
                      whiteSpace: "nowrap",
                    }}
                  >
                    + Add
                  </button>
                </div>
                {selectedProd && (
                  <div style={{ marginTop: 8, fontSize: 12, color: C.primary }}>
                    Selected: <strong>{selectedProd.name}</strong> · Price: <strong>${form.saleType === "Wholesale" ? parseFloat(selectedProd.price_mayor).toFixed(2) : parseFloat(selectedProd.price_detal).toFixed(2)}</strong>
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: 11, color: C.mutedGray, fontWeight: 600, display: "block", marginBottom: 5 }}>Notes (optional)</label>
                <input type="text" placeholder="Additional notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={iStyle} />
              </div>
            </form>
          </Card>

          {/* Cart */}
          <div>
            <Card style={{ marginBottom: 16 }}>
              <SectionTitle label="Cart" title="Order Summary" />
              {cart.length === 0 && (
                <div style={{ color: C.mutedGray, fontSize: 13, textAlign: "center", padding: "16px 0" }}>
                  No products added yet
                </div>
              )}
              {cart.map(item => (
                <div key={item.product_id} style={{ padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: C.darkGray, fontWeight: 600 }}>{item.product_name}</div>
                      <div style={{ fontSize: 11, color: C.mutedGray }}>{item.product_code} · ${item.unit_price.toFixed(2)} each</div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product_id)}
                      style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 16, padding: "0 4px" }}
                    >
                      ×
                    </button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={e => updateCartQty(item.product_id, e.target.value)}
                      style={{ ...iStyle, width: 70, padding: "6px 10px", textAlign: "center" }}
                    />
                    <span style={{ fontSize: 12, color: C.mutedGray }}>×</span>
                    <span style={{ fontSize: 12, color: C.medGray }}>${item.unit_price.toFixed(2)}</span>
                    <span style={{ marginLeft: "auto", fontSize: 14, fontWeight: 700, color: C.darkGray }}>
                      ${(item.quantity * item.unit_price).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}

              {cart.length > 0 && (
                <div style={{ marginTop: 14, padding: "12px 14px", background: `${C.primary}10`, borderRadius: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: C.medGray }}>{cart.reduce((s, i) => s + i.quantity, 0)} items</span>
                    <span style={{ fontSize: 12, color: C.mutedGray }}>Subtotal</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: C.mutedGray }}>{form.saleType} pricing</span>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: C.primary }}>
                      ${cartTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </Card>

            {/* Sale Info Summary */}
            {cart.length > 0 && (
              <Card style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: C.mutedGray, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span>Customer</span><span style={{ color: C.darkGray, fontWeight: 600 }}>{form.customerName || "—"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span>Platform</span><span style={{ color: C.darkGray, fontWeight: 600 }}>{form.platform}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span>Payment</span><span style={{ color: C.darkGray, fontWeight: 600 }}>{form.paymentMethod}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Status</span>
                    <span style={{ color: form.paymentStatus === "Paid" ? C.green : form.paymentStatus === "Pending" ? C.red : C.yellow, fontWeight: 700 }}>
                      {form.paymentStatus}
                    </span>
                  </div>
                </div>
              </Card>
            )}

            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={saving || cart.length === 0}
              style={{
                width: "100%",
                background: saving || cart.length === 0 ? C.mutedGray : C.primary,
                color: "white",
                border: "none",
                borderRadius: 10,
                padding: "14px 20px",
                fontSize: 15,
                fontWeight: 700,
                cursor: saving || cart.length === 0 ? "not-allowed" : "pointer",
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: 0.5,
              }}
            >
              {saving ? "Saving..." : `Confirm Sale · $${cartTotal.toFixed(2)}`}
            </button>
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div>
          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
            <Card>
              <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: C.primary, fontWeight: 700, marginBottom: 4 }}>Total Sales</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: C.darkGray }}>${totalFiltered.toFixed(2)}</div>
              <div style={{ fontSize: 12, color: C.mutedGray }}>{filteredSales.length} transactions</div>
            </Card>
            <Card>
              <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: C.primary, fontWeight: 700, marginBottom: 4 }}>Avg Ticket</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: C.darkGray }}>${avgTicket.toFixed(2)}</div>
              <div style={{ fontSize: 12, color: C.mutedGray }}>Per transaction</div>
            </Card>
            <Card>
              <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: C.primary, fontWeight: 700, marginBottom: 4 }}>Pending</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: C.red }}>${pendingAmt.toFixed(2)}</div>
              <div style={{ fontSize: 12, color: C.mutedGray }}>{pendingFiltered.length} unpaid</div>
            </Card>
            <Card>
              <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: C.primary, fontWeight: 700, marginBottom: 4 }}>Showing</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: C.darkGray }}>{filteredSales.length}</div>
              <div style={{ fontSize: 12, color: C.mutedGray }}>of {sales.length} total</div>
            </Card>
          </div>

          {/* Filters */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ ...iStyle, width: 180 }} />
              <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)} style={{ ...iStyle, width: 180 }}>
                <option value="">All Platforms</option>
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...iStyle, width: 160 }}>
                <option value="">All Statuses</option>
                {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {(filterDate || filterPlatform || filterStatus) && (
                <button
                  className="btn-ghost"
                  onClick={() => { setFilterDate(""); setFilterPlatform(""); setFilterStatus(""); }}
                  style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 14px", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", color: C.medGray }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </Card>

          {/* Sales Table */}
          <Card>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                    {["#", "Date", "Customer", "Platform", "Type", "Payment", "Status", "Region", "Total"].map(h => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: C.mutedGray, fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.length === 0 && (
                    <tr className="row-hover">
                      <td colSpan={9} style={{ padding: 24, textAlign: "center", color: C.mutedGray }}>No sales found</td>
                    </tr>
                  )}
                  {filteredSales.map(s => {
                    const ss = STATUS_STYLE[s.payment_status] || { color: C.mutedGray, bg: C.surfaceAlt };
                    return (
                      <tr key={s.id} className="row-hover" style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: "9px 10px", color: C.mutedGray }}>#{s.id}</td>
                        <td style={{ padding: "9px 10px", color: C.darkGray, whiteSpace: "nowrap" }}>{s.date}</td>
                        <td style={{ padding: "9px 10px", color: C.darkGray, fontWeight: 500 }}>{s.customer_name || "—"}</td>
                        <td style={{ padding: "9px 10px", color: C.medGray }}>{s.platform}</td>
                        <td style={{ padding: "9px 10px" }}>
                          <span style={{ background: s.sale_type === "Wholesale" ? C.purpleBg : C.blueBg, color: s.sale_type === "Wholesale" ? C.purple : C.blue, borderRadius: 4, padding: "2px 7px", fontSize: 11, fontWeight: 600 }}>
                            {s.sale_type}
                          </span>
                        </td>
                        <td style={{ padding: "9px 10px", color: C.medGray }}>{s.payment_method}</td>
                        <td style={{ padding: "9px 10px" }}>
                          <span style={{ background: ss.bg, color: ss.color, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>
                            {s.payment_status}
                          </span>
                        </td>
                        <td style={{ padding: "9px 10px", color: C.medGray }}>{s.vz_state || "—"}</td>
                        <td style={{ padding: "9px 10px", color: C.darkGray, fontWeight: 700 }}>${(parseFloat(s.total_usd) || 0).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
