import { useState, useEffect } from "react";
import { supabase } from "./src/supabaseClient.js";

var MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
var CATEGORIES = ["All", "Clothing", "Accessories", "Nursery", "Care", "Gift Sets", "Others"];
var SUPPLIERS = ["All", "Local Artisan", "China Direct", "US Supplier", "Colombia Source", "Generic"];
var STATUS_OPTIONS = ["Active", "Inactive", "Discontinued"];

var EMPTY_PRODUCT = {
  code: "", name: "", category: "Clothing", unit: "Piece",
  cost: 0, price_detal: 0, price_mayor: 0,
  stock: 0, min_stock: 5, min_mayor: 6,
  supplier: "Local Artisan", origin: "Local", status: "Active",
};

function fmtD(v) { return "$" + v.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

export default function MommeeInventario(props) {
  var onNavigate = props.onNavigate || function() {};

  var productsState = useState([]);      var products = productsState[0];      var setProducts = productsState[1];
  var loadingState = useState(true);     var loading = loadingState[0];        var setLoading = loadingState[1];
  var searchState = useState("");        var search = searchState[0];          var setSearch = searchState[1];
  var fcState = useState("All");         var filterCat = fcState[0];           var setFilterCat = fcState[1];
  var fsState = useState("All");         var filterSupp = fsState[0];          var setFilterSupp = fsState[1];
  var fstState = useState("Active");     var filterStatus = fstState[0];       var setFilterStatus = fstState[1];
  var editIdState = useState(null);      var editingId = editIdState[0];       var setEditingId = editIdState[1];
  var editDataState = useState({});      var editData = editDataState[0];      var setEditData = editDataState[1];
  var showAddState = useState(false);    var showAdd = showAddState[0];        var setShowAdd = showAddState[1];
  var newProdState = useState(EMPTY_PRODUCT); var newProd = newProdState[0];    var setNewProd = newProdState[1];
  var savingState = useState(false);     var saving = savingState[0];          var setSaving = savingState[1];
  var msgState = useState("");           var msg = msgState[0];                var setMsg = msgState[1];

  useEffect(function() { loadProducts(); }, []);

  function loadProducts() {
    setLoading(true);
    supabase.from("products").select("*").order("name").then(function(res) {
      if (res.data) setProducts(res.data);
      setLoading(false);
    });
  }

  var filtered = products.filter(function(p) {
    if (filterCat !== "All" && p.category !== filterCat) return false;
    if (filterSupp !== "All" && p.supplier !== filterSupp) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    if (search) {
      var q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || (p.supplier && p.supplier.toLowerCase().includes(q));
    }
    return true;
  });

  var activeProducts = products.filter(function(p) { return p.status === "Active"; });
  var inventoryValue = activeProducts.reduce(function(sum, p) { return sum + ((p.stock || 0) * (parseFloat(p.cost) || 0)); }, 0);
  var retailValue = activeProducts.reduce(function(sum, p) { return sum + ((p.stock || 0) * (parseFloat(p.price_detal) || 0)); }, 0);
  var criticalCount = activeProducts.filter(function(p) { return p.stock <= p.min_stock; }).length;
  var totalUnits = activeProducts.reduce(function(sum, p) { return sum + (p.stock || 0); }, 0);

  var now = new Date();
  var cm = now.getMonth();
  var cy = now.getFullYear();
  var dateLabel = MONTHS[cm] + " " + (now.getDate() < 10 ? "0" : "") + now.getDate() + ", " + cy;

  function startEdit(p) {
    setEditingId(p.id);
    var copy = {}; for (var k in p) copy[k] = p[k];
    setEditData(copy);
  }

  function setED(key) {
    return function(e) {
      setEditData(function(d) {
        var n = {}; for (var k in d) n[k] = d[k];
        n[key] = e.target.value;
        return n;
      });
    };
  }

  function setNP(key) {
    return function(e) {
      setNewProd(function(p) {
        var n = {}; for (var k in p) n[k] = p[k];
        n[key] = e.target.value;
        return n;
      });
    };
  }

  function saveEdit() {
    setSaving(true);
    supabase.from("products").update({
      code: editData.code,
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
    }).eq("id", editingId).then(function(res) {
      if (!res.error) {
        setProducts(function(prev) {
          return prev.map(function(p) {
            if (p.id === editingId) {
              var n = {}; for (var k in p) n[k] = p[k]; for (var k in editData) n[k] = editData[k];
              return n;
            }
            return p;
          });
        });
        setEditingId(null);
        setEditData({});
      }
      setSaving(false);
    });
  }

  function addProduct() {
    if (!newProd.code || !newProd.name) { setMsg("Code and name are required."); return; }
    setSaving(true);
    supabase.from("products").insert({
      code: newProd.code, name: newProd.name, category: newProd.category, unit: newProd.unit,
      cost: parseFloat(newProd.cost) || 0, price_detal: parseFloat(newProd.price_detal) || 0,
      price_mayor: parseFloat(newProd.price_mayor) || 0, stock: parseInt(newProd.stock) || 0,
      min_stock: parseInt(newProd.min_stock) || 0, min_mayor: parseInt(newProd.min_mayor) || 1,
      supplier: newProd.supplier, origin: newProd.origin, status: newProd.status,
    }).select().single().then(function(res) {
      if (!res.error && res.data) {
        setProducts(function(prev) { return prev.concat([res.data]); });
        setNewProd(EMPTY_PRODUCT);
        setShowAdd(false);
        setMsg("Product added successfully!");
        setTimeout(function() { setMsg(""); }, 3000);
      } else if (res.error) {
        setMsg("Error: " + res.error.message);
      }
      setSaving(false);
    });
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: "28px", fontWeight: 500, color: "var(--accent)", letterSpacing: "-0.04em", marginBottom: "8px" }}>LOADING</div>
          <div style={{ color: "var(--muted)", fontSize: "13px" }}>Loading inventory...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh" }}>

      {/* Header */}
      <div className="hdr">
        <div className="hdr-left">
          <div className="hdr-title">Inventario</div>
          <div className="hdr-date">{dateLabel}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button className="btn" onClick={function() { setShowAdd(function(v) { return !v; }); }} style={{ gap: "6px" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "12px", height: "12px" }}>
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {showAdd ? "Cancel" : "Add Product"}
          </button>
          <div className="hdr-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Search products..." value={search} onChange={function(e) { setSearch(e.target.value); }} />
          </div>
        </div>
      </div>

      <div className="content">

        {msg && (
          <div style={{
            padding: "10px 16px", borderRadius: "var(--rs)", marginBottom: "16px",
            background: msg.includes("Error") ? "rgba(255,59,48,.07)" : "rgba(52,199,89,.07)",
            color: msg.includes("Error") ? "var(--red)" : "var(--green)",
            fontSize: "13px", fontWeight: 500, fontFamily: "var(--mono)", letterSpacing: "-0.01em",
            animation: "slideIn 0.2s ease",
          }}>
            {msg}
          </div>
        )}

        {/* KPIs */}
        <div className="g4">
          {[
            { label: "SKUs Activos", val: String(activeProducts.length), sub: products.length + " total",
              icon: function() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>; } },
            { label: "Valor Inventario", val: "$" + inventoryValue.toFixed(0), sub: "At cost price",
              icon: function() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>; } },
            { label: "Valor Retail", val: "$" + retailValue.toFixed(0), sub: "At retail price", green: true,
              icon: function() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>; } },
            { label: "Stock Critico", val: String(criticalCount), sub: "Below minimum", red: criticalCount > 0,
              icon: function() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; } },
          ].map(function(kpi) {
            return (
              <div key={kpi.label} className="kpi">
                <div className="kpi-ico">{kpi.icon()}</div>
                <div className="kpi-lbl">{kpi.label}</div>
                <div className="kpi-val" style={kpi.red ? { color: "var(--red)" } : kpi.green ? { color: "var(--green)" } : {}}>{kpi.val}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", marginTop: "4px" }}>{kpi.sub}</div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: "16px" }}>
          <div className="card-b" style={{ padding: "12px 22px" }}>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              <select className="form-input" value={filterCat} onChange={function(e) { setFilterCat(e.target.value); }} style={{ width: "160px" }}>
                {CATEGORIES.map(function(c) { return <option key={c} value={c}>{c}</option>; })}
              </select>
              <select className="form-input" value={filterSupp} onChange={function(e) { setFilterSupp(e.target.value); }} style={{ width: "170px" }}>
                {SUPPLIERS.map(function(s) { return <option key={s} value={s}>{s}</option>; })}
              </select>
              <select className="form-input" value={filterStatus} onChange={function(e) { setFilterStatus(e.target.value); }} style={{ width: "140px" }}>
                <option value="">All Status</option>
                {STATUS_OPTIONS.map(function(s) { return <option key={s} value={s}>{s}</option>; })}
              </select>
              {editingId && (
                <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
                  <button className="btn" onClick={function() { setEditingId(null); setEditData({}); }}>Cancel</button>
                  <button className="btn btn-primary" onClick={saveEdit} disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Product Form */}
        {showAdd && (
          <div className="card" style={{ marginBottom: "16px", borderColor: "var(--accent)" }}>
            <div className="card-h">
              <div>
                <div className="card-t">Nuevo Producto</div>
                <div className="card-sub">Add to catalog</div>
              </div>
            </div>
            <div className="card-b">
              <div className="form-row" style={{ gridTemplateColumns: "1fr 2fr 1fr" }}>
                <div className="form-group">
                  <label className="form-label">Code *</label>
                  <input className="form-input" type="text" placeholder="MB-XXX" value={newProd.code} onChange={setNP("code")} />
                </div>
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input className="form-input" type="text" placeholder="e.g. Organic Cotton Onesie" value={newProd.name} onChange={setNP("name")} />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-input" value={newProd.category} onChange={setNP("category")}>
                    {CATEGORIES.filter(function(c) { return c !== "All"; }).map(function(c) { return <option key={c} value={c}>{c}</option>; })}
                  </select>
                </div>
              </div>

              <div className="form-row" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
                {[
                  { key: "cost", label: "Cost (USD)" },
                  { key: "price_detal", label: "Retail Price" },
                  { key: "price_mayor", label: "Wholesale Price" },
                  { key: "stock", label: "Initial Stock" },
                  { key: "min_stock", label: "Min Stock" },
                  { key: "min_mayor", label: "Min Wholesale" },
                ].map(function(f) {
                  return (
                    <div key={f.key} className="form-group">
                      <label className="form-label">{f.label}</label>
                      <input className="form-input" type="number" step="0.01" min="0" value={newProd[f.key]} onChange={setNP(f.key)} />
                    </div>
                  );
                })}
              </div>

              <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
                <div className="form-group">
                  <label className="form-label">Supplier</label>
                  <select className="form-input" value={newProd.supplier} onChange={setNP("supplier")}>
                    {SUPPLIERS.filter(function(s) { return s !== "All"; }).map(function(s) { return <option key={s} value={s}>{s}</option>; })}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Origin</label>
                  <select className="form-input" value={newProd.origin} onChange={setNP("origin")}>
                    {["Local","China","USA","Colombia","Europe","Other"].map(function(o) { return <option key={o} value={o}>{o}</option>; })}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <select className="form-input" value={newProd.unit} onChange={setNP("unit")}>
                    {["Piece","Set","Kit","Pack","Unit","Box"].map(function(u) { return <option key={u} value={u}>{u}</option>; })}
                  </select>
                </div>
                <div className="form-group" style={{ display: "flex", alignItems: "flex-end" }}>
                  <button className="btn btn-primary" onClick={addProduct} disabled={saving} style={{ width: "100%" }}>
                    {saving ? "Saving..." : "Add Product"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="card">
          <div className="card-h">
            <div>
              <div className="card-t">Catalogo de Productos</div>
              <div className="card-sub">{filtered.length + " products · " + totalUnits + " total units"}</div>
            </div>
          </div>
          <div className="card-b" style={{ padding: 0 }}>
            <div style={{ overflowX: "auto" }}>
              <table className="dt" style={{ minWidth: "1000px" }}>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Stock</th>
                    <th>Min</th>
                    <th>Cost</th>
                    <th>Retail</th>
                    <th>Wholesale</th>
                    <th>Supplier</th>
                    <th>Origin</th>
                    <th>Status</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={12} style={{ textAlign: "center", color: "var(--muted)", padding: "24px" }}>No products found</td></tr>
                  )}
                  {filtered.map(function(p) {
                    var isCritical = p.stock <= p.min_stock && p.status === "Active";
                    var isEditing = editingId === p.id;
                    return (
                      <tr key={p.id} style={isCritical ? { background: "rgba(255,59,48,.03)" } : {}}>
                        <td>
                          {isEditing
                            ? <input className="form-input" type="text" value={editData.code} onChange={setED("code")} style={{ padding: "5px 8px", width: "120px" }} />
                            : <span className="bdg bdg-or">{p.code}</span>
                          }
                        </td>
                        <td>
                          {isEditing
                            ? <input className="form-input" type="text" value={editData.name} onChange={setED("name")} style={{ padding: "5px 8px" }} />
                            : <span style={{ fontWeight: 500 }}>{p.name}</span>
                          }
                        </td>
                        <td>
                          {isEditing
                            ? <select className="form-input" value={editData.category} onChange={setED("category")} style={{ padding: "5px 8px" }}>
                                {CATEGORIES.filter(function(c) { return c !== "All"; }).map(function(c) { return <option key={c} value={c}>{c}</option>; })}
                              </select>
                            : p.category
                          }
                        </td>
                        <td>
                          {isEditing
                            ? <input className="form-input" type="number" min="0" value={editData.stock} onChange={setED("stock")} style={{ padding: "5px 8px", width: "70px" }} />
                            : <span style={isCritical ? { color: "var(--red)", fontWeight: 600 } : {}}>{p.stock}{isCritical ? " !" : ""}</span>
                          }
                        </td>
                        <td>
                          {isEditing
                            ? <input className="form-input" type="number" min="0" value={editData.min_stock} onChange={setED("min_stock")} style={{ padding: "5px 8px", width: "60px" }} />
                            : <span className="mono" style={{ color: "var(--muted)", fontSize: "11px" }}>{p.min_stock}</span>
                          }
                        </td>
                        <td>
                          {isEditing
                            ? <input className="form-input" type="number" step="0.01" min="0" value={editData.cost} onChange={setED("cost")} style={{ padding: "5px 8px", width: "80px" }} />
                            : <span className="mono" style={{ fontSize: "11px" }}>{"$" + parseFloat(p.cost).toFixed(2)}</span>
                          }
                        </td>
                        <td>
                          {isEditing
                            ? <input className="form-input" type="number" step="0.01" min="0" value={editData.price_detal} onChange={setED("price_detal")} style={{ padding: "5px 8px", width: "80px" }} />
                            : <span className="mono" style={{ fontWeight: 600, fontSize: "11px" }}>{"$" + parseFloat(p.price_detal).toFixed(2)}</span>
                          }
                        </td>
                        <td>
                          {isEditing
                            ? <input className="form-input" type="number" step="0.01" min="0" value={editData.price_mayor} onChange={setED("price_mayor")} style={{ padding: "5px 8px", width: "80px" }} />
                            : <span className="mono" style={{ fontSize: "11px", color: "var(--muted)" }}>{"$" + parseFloat(p.price_mayor).toFixed(2)}</span>
                          }
                        </td>
                        <td>
                          {isEditing
                            ? <select className="form-input" value={editData.supplier} onChange={setED("supplier")} style={{ padding: "5px 8px" }}>
                                {SUPPLIERS.filter(function(s) { return s !== "All"; }).map(function(s) { return <option key={s} value={s}>{s}</option>; })}
                              </select>
                            : p.supplier
                          }
                        </td>
                        <td>
                          {isEditing
                            ? <select className="form-input" value={editData.origin} onChange={setED("origin")} style={{ padding: "5px 8px" }}>
                                {["Local","China","USA","Colombia","Europe","Other"].map(function(o) { return <option key={o} value={o}>{o}</option>; })}
                              </select>
                            : p.origin
                          }
                        </td>
                        <td>
                          {isEditing
                            ? <select className="form-input" value={editData.status} onChange={setED("status")} style={{ padding: "5px 8px" }}>
                                {STATUS_OPTIONS.map(function(s) { return <option key={s} value={s}>{s}</option>; })}
                              </select>
                            : <span className={"bdg " + (p.status === "Active" ? "bdg-gn" : p.status === "Inactive" ? "bdg-or" : "bdg-rd")}>{p.status}</span>
                          }
                        </td>
                        <td>
                          {!isEditing && (
                            <button className="btn" onClick={function() { startEdit(p); }} style={{ padding: "4px 10px", fontSize: "10px" }}>
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Summary Bar */}
        <div className="summary-bar" style={{ marginTop: "16px" }}>
          <div className="summary-item"><div className="summary-label">Active SKUs</div><div className="summary-value">{String(activeProducts.length)}</div></div>
          <div className="summary-item"><div className="summary-label">Total Units</div><div className="summary-value">{String(totalUnits)}</div></div>
          <div className="summary-item"><div className="summary-label">Cost Value</div><div className="summary-value">{"$" + inventoryValue.toFixed(0)}</div></div>
          <div className="summary-spacer" />
          <div className="summary-item"><div className="summary-label">Retail Value</div><div className="summary-value accent">{"$" + retailValue.toFixed(0)}</div></div>
        </div>

      </div>
    </div>
  );
}
