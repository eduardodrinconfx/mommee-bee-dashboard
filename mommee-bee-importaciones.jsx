import { useState, useEffect } from "react";
import { supabase } from "./src/supabaseClient.js";

var MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
var STATUSES = ["Ordered", "In Transit", "In Customs", "Received"];
var ORIGINS = ["China", "USA", "Colombia", "Europe", "Local", "Other"];
var SUPPLIERS_LIST = ["Local Artisan", "China Direct", "US Supplier", "Colombia Source", "Generic"];

var EMPTY_FORM = {
  date: new Date().toISOString().split("T")[0],
  supplier: "",
  invoice_number: "",
  origin: "China",
  freight_cost: "",
  taxes: "",
  notes: "",
};

var EMPTY_ITEM = { product_code: "", product_name: "", quantity: 1, unit_cost: 0, unit_price: 0, shipping_fee: 0, product_id: null };

function fmtD(v) { return "$" + v.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

export default function MommeeImportaciones(props) {
  var onNavigate = props.onNavigate || function() {};

  var importsState = useState([]);       var imports = importsState[0];        var setImports = importsState[1];
  var iiState = useState([]);            var importItems = iiState[0];         var setImportItems = iiState[1];
  var productsState = useState([]);      var products = productsState[0];      var setProducts = productsState[1];
  var loadingState = useState(true);     var loading = loadingState[0];        var setLoading = loadingState[1];
  var savingState = useState(false);     var saving = savingState[0];          var setSaving = savingState[1];
  var showFormState = useState(false);   var showForm = showFormState[0];      var setShowForm = showFormState[1];
  var selState = useState(null);         var selectedImport = selState[0];     var setSelectedImport = selState[1];
  var formState = useState(EMPTY_FORM);  var form = formState[0];             var setForm = formState[1];
  var itemsState = useState([EMPTY_ITEM]); var items = itemsState[0];          var setItems = itemsState[1];
  var msgState = useState("");           var msg = msgState[0];                var setMsg = msgState[1];
  var psState = useState({});            var prodSearch = psState[0];          var setProdSearch = psState[1];
  var ddState = useState({});            var showDropdown = ddState[0];        var setShowDropdown = ddState[1];

  useEffect(function() { loadData(); }, []);

  function loadData() {
    setLoading(true);
    var year = new Date().getFullYear();
    var yearStart = year + "-01-01";
    Promise.all([
      supabase.from("imports").select("*").gte("date", yearStart).order("date", { ascending: false }),
      supabase.from("import_items").select("*"),
      supabase.from("products").select("*").eq("status", "Active"),
    ]).then(function(results) {
      if (results[0].data) setImports(results[0].data);
      if (results[1].data) setImportItems(results[1].data);
      if (results[2].data) setProducts(results[2].data);
      setLoading(false);
    });
  }

  function setF(key) {
    return function(e) {
      setForm(function(f) { var n = {}; for (var k in f) n[k] = f[k]; n[key] = e.target.value; return n; });
    };
  }

  function calcTotal() {
    var itemsTotal = items.reduce(function(sum, it) { return sum + ((parseInt(it.quantity) || 0) * (parseFloat(it.unit_cost) || 0)); }, 0);
    return itemsTotal + (parseFloat(form.freight_cost) || 0) + (parseFloat(form.taxes) || 0);
  }

  function addItem() {
    var copy = {}; for (var k in EMPTY_ITEM) copy[k] = EMPTY_ITEM[k];
    setItems(function(prev) { return prev.concat([copy]); });
  }

  function removeItem(idx) {
    setItems(function(prev) { return prev.filter(function(_, i) { return i !== idx; }); });
  }

  function updateItem(idx, field, value) {
    setItems(function(prev) {
      return prev.map(function(it, i) {
        if (i === idx) { var n = {}; for (var k in it) n[k] = it[k]; n[field] = value; return n; }
        return it;
      });
    });
  }

  function selectProductForItem(idx, p) {
    setItems(function(prev) {
      return prev.map(function(it, i) {
        if (i === idx) {
          var n = {}; for (var k in it) n[k] = it[k];
          n.product_id = p.id; n.product_code = p.code; n.product_name = p.name;
          n.unit_price = parseFloat(p.price_detal) || 0;
          return n;
        }
        return it;
      });
    });
    var ps = {}; for (var k in prodSearch) ps[k] = prodSearch[k]; ps[idx] = p.code + " — " + p.name; setProdSearch(ps);
    var dd = {}; for (var k in showDropdown) dd[k] = showDropdown[k]; dd[idx] = false; setShowDropdown(dd);
  }

  function handleSubmit(e) {
    if (e) e.preventDefault();
    if (!form.supplier) { setMsg("Supplier is required."); return; }
    if (items.filter(function(it) { return it.product_code; }).length === 0) { setMsg("Add at least one product."); return; }
    setSaving(true);
    setMsg("");

    var total = calcTotal();
    supabase.from("imports").insert({
      date: form.date, supplier: form.supplier, invoice_number: form.invoice_number,
      origin: form.origin, freight_cost: parseFloat(form.freight_cost) || 0,
      taxes: parseFloat(form.taxes) || 0, total_cost: total, status: "Ordered", notes: form.notes,
    }).select().single().then(function(res) {
      if (res.error) { setMsg("Error: " + res.error.message); setSaving(false); return; }
      var impData = res.data;
      var validItems = items.filter(function(it) { return it.product_code && it.quantity > 0; });
      var dbItems = validItems.map(function(it) {
        return {
          import_id: impData.id, product_id: it.product_id, product_code: it.product_code,
          product_name: it.product_name, quantity: parseInt(it.quantity) || 1,
          unit_cost: parseFloat(it.unit_cost) || 0, unit_price: parseFloat(it.unit_price) || 0,
          shipping_fee: parseFloat(it.shipping_fee) || 0,
        };
      });
      supabase.from("import_items").insert(dbItems).then(function() {
        setImports(function(prev) { return [impData].concat(prev); });
        setImportItems(function(prev) { return prev.concat(dbItems.map(function(d, i) { var n = {}; for (var k in d) n[k] = d[k]; n.id = Date.now() + i; return n; })); });
        setForm(EMPTY_FORM);
        setItems([EMPTY_ITEM]);
        setProdSearch({});
        setShowForm(false);
        setMsg("Import order created successfully!");
        setTimeout(function() { setMsg(""); }, 3000);
        setSaving(false);
      });
    });
  }

  function advanceStatus(imp) {
    var nextMap = { "Ordered": "In Transit", "In Transit": "In Customs", "In Customs": "Received" };
    var nextStatus = nextMap[imp.status];
    if (!nextStatus) return;

    supabase.from("imports").update({ status: nextStatus }).eq("id", imp.id).select().single().then(function(res) {
      if (!res.data) return;
      if (nextStatus === "Received") {
        var orderItems = importItems.filter(function(ii) { return ii.import_id === imp.id; });
        var updates = orderItems.map(function(item) {
          if (item.product_id) {
            var prod = products.find(function(p) { return p.id === item.product_id; });
            if (prod) {
              var newStock = (prod.stock || 0) + (item.quantity || 0);
              return supabase.from("products").update({ stock: newStock, updated_at: new Date().toISOString() }).eq("id", item.product_id);
            }
          }
          return Promise.resolve();
        });
        Promise.all(updates);
      }
      setImports(function(prev) { return prev.map(function(i) { if (i.id === imp.id) { var n = {}; for (var k in i) n[k] = i[k]; n.status = nextStatus; return n; } return i; }); });
      if (selectedImport && selectedImport.id === imp.id) {
        setSelectedImport(function(prev) { var n = {}; for (var k in prev) n[k] = prev[k]; n.status = nextStatus; return n; });
      }
    });
  }

  // Computations
  var now = new Date();
  var cm = now.getMonth();
  var cy = now.getFullYear();
  var dateLabel = MONTHS[cm] + " " + (now.getDate() < 10 ? "0" : "") + now.getDate() + ", " + cy;

  var activeImports = imports.filter(function(i) { return i.status !== "Received"; });
  var receivedImports = imports.filter(function(i) { return i.status === "Received"; });
  var activeValue = activeImports.reduce(function(sum, i) { return sum + (parseFloat(i.total_cost) || 0); }, 0);
  var yearValue = imports.reduce(function(sum, i) { return sum + (parseFloat(i.total_cost) || 0); }, 0);

  var selectedItems = selectedImport ? importItems.filter(function(ii) { return ii.import_id === selectedImport.id; }) : [];

  var filteredProds = function(idx) {
    var q = ((prodSearch[idx] || "").toLowerCase());
    if (!q) return products.slice(0, 8);
    return products.filter(function(p) {
      return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
    }).slice(0, 8);
  };

  var statusColor = function(status) {
    if (status === "Ordered") return "var(--blue)";
    if (status === "In Transit") return "var(--orange)";
    if (status === "In Customs") return "var(--purple)";
    if (status === "Received") return "var(--green)";
    return "var(--muted)";
  };

  var statusBdg = function(status) {
    if (status === "Ordered") return "bdg-bl";
    if (status === "In Transit") return "bdg-or";
    if (status === "In Customs") return "bdg-bl";
    if (status === "Received") return "bdg-gn";
    return "bdg-or";
  };

  var nextStatus = function(status) {
    if (status === "Ordered") return "In Transit";
    if (status === "In Transit") return "In Customs";
    if (status === "In Customs") return "Received";
    return null;
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: "28px", fontWeight: 500, color: "var(--accent)", letterSpacing: "-0.04em", marginBottom: "8px" }}>LOADING</div>
          <div style={{ color: "var(--muted)", fontSize: "13px" }}>Loading imports...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <style>{"\n        .imp-card:hover{border-color:var(--accent)!important;box-shadow:var(--sh-md)!important}\n        .imp-dd-item:hover{background:rgba(0,0,0,.03)!important}\n      "}</style>

      {/* Header */}
      <div className="hdr">
        <div className="hdr-left">
          <div className="hdr-title">Importaciones</div>
          <div className="hdr-date">{dateLabel}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button className="btn" onClick={function() { setShowForm(function(v) { return !v; }); setSelectedImport(null); }} style={{ gap: "6px" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "12px", height: "12px" }}>
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {showForm ? "Cancel" : "New Import"}
          </button>
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
            { label: "Ordenes Activas", val: String(activeImports.length), sub: "In progress",
              icon: function() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="6" width="22" height="12" rx="2"/><path d="M1 10h22"/></svg>; } },
            { label: "Inversion Activa", val: "$" + activeValue.toFixed(0), sub: "In transit / customs", orange: true,
              icon: function() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>; } },
            { label: "Recibidas " + cy, val: String(receivedImports.length), sub: "Completed orders", green: true,
              icon: function() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>; } },
            { label: "Inversion " + cy, val: "$" + yearValue.toFixed(0), sub: "Total " + cy,
              icon: function() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>; } },
          ].map(function(kpi) {
            return (
              <div key={kpi.label} className="kpi">
                <div className="kpi-ico">{kpi.icon()}</div>
                <div className="kpi-lbl">{kpi.label}</div>
                <div className="kpi-val" style={kpi.orange ? { color: "var(--orange)" } : kpi.green ? { color: "var(--green)" } : {}}>{kpi.val}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", marginTop: "4px" }}>{kpi.sub}</div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: selectedImport || showForm ? "1fr 1fr" : "1fr", gap: "16px" }}>
          {/* Left: Import List */}
          <div className="card">
            <div className="card-h">
              <div>
                <div className="card-t">Ordenes de Importacion</div>
                <div className="card-sub">{imports.length + " orders · " + activeImports.length + " active"}</div>
              </div>
            </div>
            <div className="card-b">
              {imports.map(function(imp) {
                var impItems = importItems.filter(function(ii) { return ii.import_id === imp.id; });
                var isSelected = selectedImport && selectedImport.id === imp.id;
                var ns = nextStatus(imp.status);
                return (
                  <div
                    key={imp.id}
                    className="imp-card"
                    onClick={function() { setSelectedImport(isSelected ? null : imp); setShowForm(false); }}
                    style={{
                      padding: "14px 16px", borderRadius: "var(--rs)", marginBottom: "10px",
                      border: "1px solid " + (isSelected ? "var(--accent)" : "var(--border)"),
                      background: isSelected ? "var(--accent-light)" : "rgba(0,0,0,.015)",
                      cursor: "pointer", transition: "all 0.25s var(--ease)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 600, letterSpacing: "-0.01em" }}>{imp.supplier || "—"}</div>
                        <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)" }}>
                          {(imp.invoice_number || "No invoice") + " · " + (imp.origin || "—") + " · " + imp.date}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div className="mono" style={{ fontSize: "15px", fontWeight: 600 }}>{"$" + (parseFloat(imp.total_cost) || 0).toFixed(2)}</div>
                        <span className={"bdg " + statusBdg(imp.status)}>{imp.status}</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)" }}>{impItems.length + " products"}</span>
                      {ns && (
                        <button
                          className="btn btn-primary"
                          onClick={function(e) { e.stopPropagation(); advanceStatus(imp); }}
                          style={{ padding: "4px 12px", fontSize: "10px" }}
                        >
                          {"→ " + ns}
                        </button>
                      )}
                    </div>

                    {/* Status progress bar */}
                    <div style={{ display: "flex", gap: "3px", marginTop: "10px" }}>
                      {STATUSES.map(function(s, i) {
                        var currentIdx = STATUSES.indexOf(imp.status);
                        return (
                          <div key={s} style={{
                            flex: 1, height: "3px", borderRadius: "2px",
                            background: i <= currentIdx ? statusColor(imp.status) : "var(--border)",
                            opacity: i <= currentIdx ? 1 : 0.3,
                            transition: "all 0.3s var(--ease)",
                          }} />
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {imports.length === 0 && !showForm && (
                <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: "32px", height: "32px", margin: "0 auto 8px", display: "block", opacity: 0.3 }}>
                    <rect x="1" y="6" width="22" height="12" rx="2"/><path d="M1 10h22"/>
                  </svg>
                  No imports this year
                </div>
              )}
            </div>
          </div>

          {/* Right: Detail */}
          {selectedImport && !showForm && (
            <div className="card">
              <div className="card-h">
                <div>
                  <div className="card-t">{"Import #" + selectedImport.id}</div>
                  <div className="card-sub">Order details</div>
                </div>
                <button className="btn" onClick={function() { setSelectedImport(null); }} style={{ padding: "4px 10px" }}>×</button>
              </div>
              <div className="card-b">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                  {[
                    { label: "Supplier", value: selectedImport.supplier },
                    { label: "Invoice", value: selectedImport.invoice_number || "—" },
                    { label: "Date", value: selectedImport.date },
                    { label: "Origin", value: selectedImport.origin },
                    { label: "Freight", value: "$" + (parseFloat(selectedImport.freight_cost) || 0).toFixed(2) },
                    { label: "Taxes", value: "$" + (parseFloat(selectedImport.taxes) || 0).toFixed(2) },
                  ].map(function(row) {
                    return (
                      <div key={row.label} style={{ padding: "10px 14px", background: "rgba(0,0,0,.02)", borderRadius: "var(--rs)" }}>
                        <div className="form-label" style={{ marginBottom: "2px" }}>{row.label}</div>
                        <div style={{ fontSize: "13px", fontWeight: 500, letterSpacing: "-0.01em" }}>{row.value}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Status banner */}
                <div className="summary-bar" style={{ marginBottom: "16px" }}>
                  <div className="summary-item">
                    <div className="summary-label">Status</div>
                    <div className="summary-value" style={{ color: statusColor(selectedImport.status) }}>{selectedImport.status}</div>
                  </div>
                  <div className="summary-spacer" />
                  <div className="summary-item">
                    <div className="summary-label">Total</div>
                    <div className="summary-value accent">{"$" + (parseFloat(selectedImport.total_cost) || 0).toFixed(2)}</div>
                  </div>
                </div>

                {/* Items table */}
                <table className="dt">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Unit Cost</th>
                      <th style={{ textAlign: "right" }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItems.map(function(it, i) {
                      return (
                        <tr key={i}>
                          <td><span className="bdg bdg-or">{it.product_code}</span></td>
                          <td>{it.product_name}</td>
                          <td className="mono" style={{ fontSize: "11px" }}>{it.quantity}</td>
                          <td className="mono" style={{ fontSize: "11px" }}>{"$" + (parseFloat(it.unit_cost) || 0).toFixed(2)}</td>
                          <td className="mono" style={{ textAlign: "right", fontWeight: 600, fontSize: "11px" }}>{"$" + ((it.quantity || 0) * (parseFloat(it.unit_cost) || 0)).toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {selectedImport.notes && (
                  <div style={{ marginTop: "14px", padding: "10px 14px", background: "rgba(0,0,0,.02)", borderRadius: "var(--rs)", fontSize: "12px", color: "var(--muted)" }}>
                    <span style={{ fontWeight: 600, color: "var(--dark)" }}>Notes: </span>{selectedImport.notes}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Right: New Import Form */}
          {showForm && (
            <div className="card">
              <div className="card-h">
                <div>
                  <div className="card-t">Nueva Importacion</div>
                  <div className="card-sub">Create order</div>
                </div>
              </div>
              <div className="card-b">
                <form onSubmit={handleSubmit}>
                  <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
                    <div className="form-group">
                      <label className="form-label">Date</label>
                      <input className="form-input" type="date" value={form.date} onChange={setF("date")} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Supplier *</label>
                      <input className="form-input" type="text" placeholder="Supplier name" value={form.supplier} onChange={setF("supplier")} list="suppliers-list" />
                      <datalist id="suppliers-list">{SUPPLIERS_LIST.map(function(s) { return <option key={s} value={s} />; })}</datalist>
                    </div>
                  </div>
                  <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
                    <div className="form-group">
                      <label className="form-label">Invoice Number</label>
                      <input className="form-input" type="text" placeholder="INV-001" value={form.invoice_number} onChange={setF("invoice_number")} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Origin</label>
                      <select className="form-input" value={form.origin} onChange={setF("origin")}>
                        {ORIGINS.map(function(o) { return <option key={o} value={o}>{o}</option>; })}
                      </select>
                    </div>
                  </div>
                  <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
                    <div className="form-group">
                      <label className="form-label">Freight Cost (USD)</label>
                      <input className="form-input" type="number" step="0.01" min="0" placeholder="0.00" value={form.freight_cost} onChange={setF("freight_cost")} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Taxes (USD)</label>
                      <input className="form-input" type="number" step="0.01" min="0" placeholder="0.00" value={form.taxes} onChange={setF("taxes")} />
                    </div>
                  </div>

                  <div className="form-label" style={{ marginBottom: "10px", marginTop: "4px" }}>Products</div>

                  {items.map(function(item, idx) {
                    return (
                      <div key={idx} style={{ padding: "12px", border: "1px solid var(--border)", borderRadius: "var(--rs)", marginBottom: "10px", background: "rgba(0,0,0,.015)" }}>
                        <div style={{ position: "relative", marginBottom: "8px" }}>
                          <input
                            className="form-input"
                            type="text"
                            placeholder="Search product by name or code..."
                            value={prodSearch[idx] || ""}
                            onChange={function(e) {
                              var ps = {}; for (var k in prodSearch) ps[k] = prodSearch[k]; ps[idx] = e.target.value; setProdSearch(ps);
                              var dd = {}; for (var k in showDropdown) dd[k] = showDropdown[k]; dd[idx] = true; setShowDropdown(dd);
                              updateItem(idx, "product_code", "");
                            }}
                            onFocus={function() {
                              var dd = {}; for (var k in showDropdown) dd[k] = showDropdown[k]; dd[idx] = true; setShowDropdown(dd);
                            }}
                            style={{ width: "100%" }}
                          />
                          {showDropdown[idx] && (
                            <div style={{
                              position: "absolute", top: "100%", left: 0, right: 0,
                              background: "var(--white)", border: "1px solid var(--border)",
                              borderRadius: "var(--rs)", boxShadow: "var(--sh-lg)",
                              zIndex: 50, maxHeight: "180px", overflowY: "auto", marginTop: "4px",
                            }}>
                              {filteredProds(idx).map(function(p) {
                                return (
                                  <div
                                    key={p.id}
                                    className="imp-dd-item"
                                    onClick={function() { selectProductForItem(idx, p); }}
                                    style={{
                                      padding: "8px 12px", cursor: "pointer", fontSize: "12px",
                                      borderBottom: "1px solid var(--sep)", display: "flex", alignItems: "center", gap: "8px",
                                      transition: "background 0.2s",
                                    }}
                                  >
                                    <span className="bdg bdg-or">{p.code}</span>
                                    <span style={{ flex: 1 }}>{p.name}</span>
                                    <span className="mono" style={{ fontSize: "10px", color: "var(--muted)" }}>{"Stock: " + p.stock}</span>
                                  </div>
                                );
                              })}
                              {filteredProds(idx).length === 0 && (
                                <div style={{ padding: "10px 12px", color: "var(--muted)", fontSize: "12px" }}>No products found.</div>
                              )}
                            </div>
                          )}
                        </div>
                        {!item.product_id && (
                          <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
                            <div className="form-group">
                              <input className="form-input" type="text" placeholder="Product Code" value={item.product_code} onChange={function(e) { updateItem(idx, "product_code", e.target.value); }} />
                            </div>
                            <div className="form-group">
                              <input className="form-input" type="text" placeholder="Product Name" value={item.product_name} onChange={function(e) { updateItem(idx, "product_name", e.target.value); }} />
                            </div>
                          </div>
                        )}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "8px", alignItems: "end" }}>
                          <div className="form-group">
                            <label className="form-label">Qty</label>
                            <input className="form-input" type="number" min="1" value={item.quantity} onChange={function(e) { updateItem(idx, "quantity", e.target.value); }} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Unit Cost</label>
                            <input className="form-input" type="number" step="0.01" min="0" value={item.unit_cost} onChange={function(e) { updateItem(idx, "unit_cost", e.target.value); }} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Retail Price</label>
                            <input className="form-input" type="number" step="0.01" min="0" value={item.unit_price} onChange={function(e) { updateItem(idx, "unit_price", e.target.value); }} />
                          </div>
                          <button
                            type="button"
                            className="btn"
                            onClick={function() { removeItem(idx); }}
                            disabled={items.length === 1}
                            style={{ padding: "6px 10px", color: "var(--red)", background: "rgba(255,59,48,.06)", border: "none" }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    className="btn"
                    onClick={addItem}
                    style={{ width: "100%", marginBottom: "14px", border: "1px dashed var(--border)" }}
                  >
                    + Add Product
                  </button>

                  {/* Total summary */}
                  <div className="summary-bar" style={{ marginBottom: "14px" }}>
                    <div className="summary-item">
                      <div className="summary-label">Items</div>
                      <div className="summary-value">{"$" + items.reduce(function(s, it) { return s + ((parseInt(it.quantity) || 0) * (parseFloat(it.unit_cost) || 0)); }, 0).toFixed(2)}</div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-label">Freight</div>
                      <div className="summary-value">{"$" + (parseFloat(form.freight_cost) || 0).toFixed(2)}</div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-label">Taxes</div>
                      <div className="summary-value">{"$" + (parseFloat(form.taxes) || 0).toFixed(2)}</div>
                    </div>
                    <div className="summary-spacer" />
                    <div className="summary-item">
                      <div className="summary-label">Total</div>
                      <div className="summary-value accent">{"$" + calcTotal().toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: "14px" }}>
                    <label className="form-label">Notes</label>
                    <input className="form-input" type="text" placeholder="Additional notes..." value={form.notes} onChange={setF("notes")} style={{ width: "100%" }} />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                    style={{
                      width: "100%", padding: "14px 20px", fontSize: "13px",
                      opacity: saving ? 0.4 : 1,
                      cursor: saving ? "not-allowed" : "pointer",
                    }}
                  >
                    {saving ? "Creating Order..." : "Create Import · $" + calcTotal().toFixed(2)}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
