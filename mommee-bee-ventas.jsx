import { useState, useEffect } from "react";
import { supabase } from "./src/supabaseClient.js";

var PLATFORMS = ["Instagram", "WhatsApp", "Website", "Boutique", "Marketplace", "Amazon", "Shopify", "P2P"];
var PAYMENT_METHODS = ["Mobile Payment", "Transfer", "Zelle", "Cash USD", "Cash Bs"];
var PAYMENT_STATUSES = ["Paid", "Pending", "Partial"];
var REGIONS = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming","International"
];

var MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

var INITIAL_FORM = {
  date: new Date().toISOString().split("T")[0],
  customerName: "",
  customerPhone: "",
  platform: "Instagram",
  paymentMethod: "Zelle",
  paymentStatus: "Paid",
  saleType: "Retail",
  region: "Florida",
  fee: "",
  shipping: "",
  notes: "",
};

function fmtD(v) { return "$" + v.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

export default function MommeeVentas(props) {
  var onNavigate = props.onNavigate || function() {};
  var clients = props.clients || [];
  var setClients = props.setClients || function() {};

  var productsState = useState([]);     var products = productsState[0];     var setProducts = productsState[1];
  var salesState = useState([]);        var sales = salesState[0];           var setSales = salesState[1];
  var saleItemsState = useState([]);    var saleItems = saleItemsState[0];   var setSaleItems = saleItemsState[1];
  var loadingState = useState(true);    var loading = loadingState[0];       var setLoading = loadingState[1];
  var savingState = useState(false);    var saving = savingState[0];         var setSaving = savingState[1];

  var formState = useState(INITIAL_FORM); var form = formState[0]; var setForm = formState[1];
  var cartState = useState([]);         var cart = cartState[0];             var setCart = cartState[1];
  var searchState = useState("");       var prodSearch = searchState[0];     var setProdSearch = searchState[1];
  var selState = useState(null);        var selectedProd = selState[0];      var setSelectedProd = selState[1];
  var qtyState = useState(1);           var qty = qtyState[0];              var setQty = qtyState[1];
  var cpState = useState("");           var customPrice = cpState[0];        var setCustomPrice = cpState[1];
  var ddState = useState(false);        var showDropdown = ddState[0];       var setShowDropdown = ddState[1];

  var fdState = useState("");           var filterDate = fdState[0];         var setFilterDate = fdState[1];
  var fpState = useState("");           var filterPlatform = fpState[0];     var setFilterPlatform = fpState[1];
  var fsState = useState("");           var filterStatus = fsState[0];       var setFilterStatus = fsState[1];

  var tabState = useState("form");      var activeTab = tabState[0];         var setActiveTab = tabState[1];
  var msgState = useState("");          var msg = msgState[0];               var setMsg = msgState[1];

  useEffect(function() { loadData(); }, []);

  useEffect(function() {
    if (form.platform === "Shopify") {
      var af = cartTotal > 0 ? (cartTotal * 0.029 + 0.30).toFixed(2) : "";
      setForm(function(f) { var n = {}; for (var k in f) n[k] = f[k]; n.fee = af; return n; });
    } else if (form.platform === "Amazon") {
      var af = cartTotal > 0 ? (cartTotal * 0.15 + 0.30).toFixed(2) : "";
      setForm(function(f) { var n = {}; for (var k in f) n[k] = f[k]; n.fee = af; return n; });
    }
  }, [form.platform, cartTotal]);

  function loadData() {
    setLoading(true);
    var year = new Date().getFullYear();
    var yearStart = year + "-01-01";
    Promise.all([
      supabase.from("products").select("*").eq("status", "Active").order("name"),
      supabase.from("sales").select("*").gte("date", yearStart).order("date", { ascending: false }),
      supabase.from("sale_items").select("*"),
    ]).then(function(results) {
      if (results[0].data) setProducts(results[0].data);
      if (results[1].data) setSales(results[1].data);
      if (results[2].data) setSaleItems(results[2].data);
      setLoading(false);
    });
  }

  var filteredProds = products.filter(function(p) {
    if (!prodSearch) return true;
    var q = prodSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
  });

  function selectProduct(p) {
    setSelectedProd(p);
    setProdSearch(p.code + " — " + p.name);
    setShowDropdown(false);
    var defaultPrice = form.saleType === "Wholesale" ? parseFloat(p.price_mayor) : parseFloat(p.price_detal);
    setCustomPrice(defaultPrice.toFixed(2));
  }

  function addToCart() {
    if (!selectedProd) return;
    var price = parseFloat(customPrice) || (form.saleType === "Wholesale"
      ? parseFloat(selectedProd.price_mayor)
      : parseFloat(selectedProd.price_detal));
    var q = parseInt(qty) || 1;

    setCart(function(prev) {
      var existing = prev.find(function(item) { return item.product_id === selectedProd.id; });
      if (existing) {
        return prev.map(function(item) {
          if (item.product_id === selectedProd.id) {
            var copy = {}; for (var k in item) copy[k] = item[k];
            copy.quantity = item.quantity + q;
            return copy;
          }
          return item;
        });
      }
      return prev.concat([{
        product_id: selectedProd.id,
        product_code: selectedProd.code,
        product_name: selectedProd.name,
        quantity: q,
        unit_price: price,
        cost: parseFloat(selectedProd.cost) || 0,
      }]);
    });

    setSelectedProd(null);
    setProdSearch("");
    setQty(1);
    setCustomPrice("");
  }

  function removeFromCart(productId) {
    setCart(function(prev) { return prev.filter(function(item) { return item.product_id !== productId; }); });
  }

  function updateCartQty(productId, newQty) {
    var q = parseInt(newQty) || 1;
    setCart(function(prev) {
      return prev.map(function(item) {
        if (item.product_id === productId) {
          var copy = {}; for (var k in item) copy[k] = item[k];
          copy.quantity = q;
          return copy;
        }
        return item;
      });
    });
  }

  function updateCartPrice(productId, newPrice) {
    var p = parseFloat(newPrice) || 0;
    setCart(function(prev) {
      return prev.map(function(item) {
        if (item.product_id === productId) {
          var copy = {}; for (var k in item) copy[k] = item[k];
          copy.unit_price = p;
          return copy;
        }
        return item;
      });
    });
  }

  var cartTotal = cart.reduce(function(sum, item) { return sum + item.quantity * item.unit_price; }, 0);

  function handleSubmit(e) {
    if (e) e.preventDefault();
    if (cart.length === 0) { setMsg("Add at least one product to the cart."); return; }
    setSaving(true);
    setMsg("");

    var clientId = null;
    var doSave = function() {
      var saleRow = {
        date: form.date,
        client_id: clientId,
        customer_name: form.customerName,
        platform: form.platform,
        payment_method: form.paymentMethod,
        payment_status: form.paymentStatus,
        sale_type: form.saleType,
        vz_state: form.region,
        notes: form.notes,
        fee: parseFloat(form.fee) || 0,
        shipping: parseFloat(form.shipping) || 0,
        total_usd: cartTotal,
      };
      supabase.from("sales").insert(saleRow).select().single().then(function(res) {
        if (res.error) { setMsg("Error saving sale: " + res.error.message); setSaving(false); return; }
        var saleData = res.data;
        var items = cart.map(function(item) {
          return {
            sale_id: saleData.id,
            product_id: item.product_id,
            product_code: item.product_code,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
          };
        });
        supabase.from("sale_items").insert(items).then(function() {
          var updates = cart.map(function(item) {
            var prod = products.find(function(p) { return p.id === item.product_id; });
            if (prod) {
              var newStock = Math.max(0, (prod.stock || 0) - item.quantity);
              return supabase.from("products").update({ stock: newStock, updated_at: new Date().toISOString() }).eq("id", item.product_id);
            }
            return Promise.resolve();
          });
          Promise.all(updates).then(function() {
            setMsg("Sale saved successfully!");
            setCart([]);
            setForm(INITIAL_FORM);
            setSaving(false);
            loadData();
            setTimeout(function() { setMsg(""); }, 3000);
          });
        });
      });
    };

    if (form.customerPhone) {
      var found = clients.find(function(c) { return c.phone === form.customerPhone; });
      if (found) {
        clientId = found.id;
        doSave();
      } else if (form.customerName) {
        supabase.from("clients").insert({
          name: form.customerName,
          phone: form.customerPhone,
          vz_state: form.region,
          tipo: form.saleType,
          status: "Active",
        }).select().single().then(function(res) {
          if (res.data) {
            clientId = res.data.id;
            setClients(function(prev) { return prev.concat([res.data]); });
          }
          doSave();
        });
      } else {
        doSave();
      }
    } else {
      doSave();
    }
  }

  var filteredSales = sales.filter(function(s) {
    if (filterDate && s.date !== filterDate) return false;
    if (filterPlatform && s.platform !== filterPlatform) return false;
    if (filterStatus && s.payment_status !== filterStatus) return false;
    return true;
  });

  var totalFiltered = filteredSales.reduce(function(sum, s) { return sum + (parseFloat(s.total_usd) || 0); }, 0);
  var pendingFiltered = filteredSales.filter(function(s) { return s.payment_status === "Pending" || s.payment_status === "Partial"; });
  var pendingAmt = pendingFiltered.reduce(function(sum, s) { return sum + (parseFloat(s.total_usd) || 0); }, 0);
  var avgTicket = filteredSales.length > 0 ? totalFiltered / filteredSales.length : 0;

  var now = new Date();
  var cm = now.getMonth();
  var cy = now.getFullYear();
  var dateLabel = MONTHS[cm] + " " + (now.getDate() < 10 ? "0" : "") + now.getDate() + ", " + cy;

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: "28px", fontWeight: 500, color: "var(--accent)", letterSpacing: "-0.04em", marginBottom: "8px" }}>LOADING</div>
          <div style={{ color: "var(--muted)", fontSize: "13px" }}>Loading sales data...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <style>{"\n        .sale-dd-item:hover{background:rgba(0,0,0,.03)!important}\n        .cart-item:hover{background:rgba(0,0,0,.015)}\n      "}</style>

      {/* Header */}
      <div className="hdr">
        <div className="hdr-left">
          <div className="hdr-title">Ventas</div>
          <div className="hdr-date">{dateLabel}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button className={"btn" + (activeTab === "form" ? " btn-primary" : "")} onClick={function() { setActiveTab("form"); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "12px", height: "12px" }}>
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nueva Venta
          </button>
          <button className={"btn" + (activeTab === "history" ? " btn-primary" : "")} onClick={function() { setActiveTab("history"); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "12px", height: "12px" }}>
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            Historial
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

        {activeTab === "form" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "16px" }}>
            {/* Sale Form */}
            <div className="card">
              <div className="card-h">
                <div>
                  <div className="card-t">Registrar Venta</div>
                  <div className="card-sub">New transaction</div>
                </div>
              </div>
              <div className="card-b">
                <form onSubmit={handleSubmit}>
                  <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                    <div className="form-group">
                      <label className="form-label">Date</label>
                      <input className="form-input" type="date" value={form.date} onChange={function(e) { setForm(function(f) { var n = {}; for (var k in f) n[k] = f[k]; n.date = e.target.value; return n; }); }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Sale Type</label>
                      <select className="form-input" value={form.saleType} onChange={function(e) { setForm(function(f) { var n = {}; for (var k in f) n[k] = f[k]; n.saleType = e.target.value; return n; }); }}>
                        <option value="Retail">Retail</option>
                        <option value="Wholesale">Wholesale</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Platform</label>
                      <select className="form-input" value={form.platform} onChange={function(e) { setForm(function(f) { var n = {}; for (var k in f) n[k] = f[k]; n.platform = e.target.value; return n; }); }}>
                        {PLATFORMS.map(function(p) { return <option key={p} value={p}>{p}</option>; })}
                      </select>
                    </div>
                  </div>

                  <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
                    <div className="form-group">
                      <label className="form-label">Customer Name</label>
                      <input className="form-input" type="text" placeholder="e.g. María García" value={form.customerName} onChange={function(e) { setForm(function(f) { var n = {}; for (var k in f) n[k] = f[k]; n.customerName = e.target.value; return n; }); }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone (CRM)</label>
                      <input className="form-input" type="text" placeholder="e.g. +58 412 000 0000" value={form.customerPhone} onChange={function(e) { setForm(function(f) { var n = {}; for (var k in f) n[k] = f[k]; n.customerPhone = e.target.value; return n; }); }} />
                    </div>
                  </div>

                  <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                    <div className="form-group">
                      <label className="form-label">Payment Method</label>
                      <select className="form-input" value={form.paymentMethod} onChange={function(e) { setForm(function(f) { var n = {}; for (var k in f) n[k] = f[k]; n.paymentMethod = e.target.value; return n; }); }}>
                        {PAYMENT_METHODS.map(function(p) { return <option key={p} value={p}>{p}</option>; })}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Payment Status</label>
                      <select className="form-input" value={form.paymentStatus} onChange={function(e) { setForm(function(f) { var n = {}; for (var k in f) n[k] = f[k]; n.paymentStatus = e.target.value; return n; }); }}>
                        {PAYMENT_STATUSES.map(function(p) { return <option key={p} value={p}>{p}</option>; })}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Region</label>
                      <select className="form-input" value={form.region} onChange={function(e) { setForm(function(f) { var n = {}; for (var k in f) n[k] = f[k]; n.region = e.target.value; return n; }); }}>
                        {REGIONS.map(function(r) { return <option key={r} value={r}>{r}</option>; })}
                      </select>
                    </div>
                  </div>

                  {/* Product Search */}
                  <div style={{ background: "var(--accent-light)", border: "1px solid var(--border)", borderRadius: "var(--rs)", padding: "16px", marginBottom: "12px" }}>
                    <div className="form-label" style={{ marginBottom: "10px" }}>Add Products to Cart</div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <div style={{ flex: 1, position: "relative" }}>
                        <input
                          className="form-input"
                          type="text"
                          placeholder="Search by name or code..."
                          value={prodSearch}
                          onChange={function(e) { setProdSearch(e.target.value); setSelectedProd(null); setShowDropdown(true); }}
                          onFocus={function() { setShowDropdown(true); }}
                          style={{ width: "100%" }}
                        />
                        {showDropdown && prodSearch && filteredProds.length > 0 && (
                          <div style={{
                            position: "absolute", top: "100%", left: 0, right: 0,
                            background: "var(--white)", border: "1px solid var(--border)",
                            borderRadius: "var(--rs)", boxShadow: "var(--sh-lg)",
                            zIndex: 50, maxHeight: "220px", overflowY: "auto", marginTop: "4px",
                          }}>
                            {filteredProds.map(function(p) {
                              var priceVal = form.saleType === "Wholesale" ? parseFloat(p.price_mayor).toFixed(2) : parseFloat(p.price_detal).toFixed(2);
                              return (
                                <div
                                  key={p.id}
                                  className="sale-dd-item"
                                  onClick={function() { selectProduct(p); }}
                                  style={{
                                    padding: "10px 14px", cursor: "pointer",
                                    borderBottom: "1px solid var(--sep)", fontSize: "13px",
                                    display: "flex", alignItems: "center", gap: "8px",
                                    transition: "background 0.2s",
                                  }}
                                >
                                  <span className="bdg bdg-or">{p.code}</span>
                                  <span style={{ flex: 1, letterSpacing: "-0.01em" }}>{p.name}</span>
                                  <span className="mono" style={{ color: "var(--accent)" }}>{"$" + priceVal}</span>
                                  <span className="mono" style={{ fontSize: "10px", color: p.stock <= p.min_stock ? "var(--red)" : "var(--muted)" }}>
                                    {"Stock: " + p.stock}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <input
                        className="form-input"
                        type="number"
                        min="1"
                        value={qty}
                        onChange={function(e) { setQty(e.target.value); }}
                        style={{ width: "70px", textAlign: "center" }}
                        placeholder="Qty"
                      />
                      <input
                        className="form-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={customPrice}
                        onChange={function(e) { setCustomPrice(e.target.value); }}
                        style={{ width: "90px", textAlign: "right" }}
                        placeholder="Precio"
                        disabled={!selectedProd}
                      />
                      <button
                        type="button"
                        className={"btn" + (selectedProd ? " btn-primary" : "")}
                        onClick={addToCart}
                        disabled={!selectedProd}
                        style={selectedProd ? {} : { opacity: 0.4, cursor: "not-allowed" }}
                      >
                        + Add
                      </button>
                    </div>
                    {selectedProd && (
                      <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--accent)", fontFamily: "var(--mono)" }}>
                        {"Selected: " + selectedProd.name + " · $" + (form.saleType === "Wholesale" ? parseFloat(selectedProd.price_mayor).toFixed(2) : parseFloat(selectedProd.price_detal).toFixed(2))}
                      </div>
                    )}
                  </div>

                  <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
                    <div className="form-group">
                      <label className="form-label">
                        {"Fee ($)"}
                        {form.platform === "Shopify" && <span style={{ marginLeft: "6px", fontSize: "10px", fontFamily: "var(--mono)", color: "var(--accent)", background: "rgba(179,106,35,.1)", padding: "1px 5px", borderRadius: "3px" }}>{"2.9% + $0.30 · auto"}</span>}
                        {form.platform === "Amazon" && <span style={{ marginLeft: "6px", fontSize: "10px", fontFamily: "var(--mono)", color: "var(--accent)", background: "rgba(179,106,35,.1)", padding: "1px 5px", borderRadius: "3px" }}>{"15% + $0.30 · auto"}</span>}
                      </label>
                      <input
                        className="form-input"
                        type="number" min="0" step="0.01" placeholder="0.00"
                        value={form.fee}
                        readOnly={form.platform === "Shopify" || form.platform === "Amazon"}
                        style={form.platform === "Shopify" || form.platform === "Amazon" ? { background: "var(--accent-light)", cursor: "default", color: "var(--accent)", fontWeight: 600 } : {}}
                        onChange={function(e) { setForm(function(f) { var n = {}; for (var k in f) n[k] = f[k]; n.fee = e.target.value; return n; }); }}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Shipping ($)</label>
                      <input className="form-input" type="number" min="0" step="0.01" placeholder="0.00" value={form.shipping} onChange={function(e) { setForm(function(f) { var n = {}; for (var k in f) n[k] = f[k]; n.shipping = e.target.value; return n; }); }} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Notes (optional)</label>
                    <input className="form-input" type="text" placeholder="Additional notes..." value={form.notes} onChange={function(e) { setForm(function(f) { var n = {}; for (var k in f) n[k] = f[k]; n.notes = e.target.value; return n; }); }} style={{ width: "100%" }} />
                  </div>
                </form>
              </div>
            </div>

            {/* Cart */}
            <div>
              <div className="card" style={{ marginBottom: "16px" }}>
                <div className="card-h">
                  <div>
                    <div className="card-t">Carrito</div>
                    <div className="card-sub">Order summary</div>
                  </div>
                  {cart.length > 0 && (
                    <span className="bdg bdg-or">{cart.reduce(function(s, i) { return s + i.quantity; }, 0) + " items"}</span>
                  )}
                </div>
                <div className="card-b">
                  {cart.length === 0 && (
                    <div style={{ textAlign: "center", padding: "24px 0", color: "var(--muted)" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: "28px", height: "28px", margin: "0 auto 8px", display: "block", opacity: 0.3 }}>
                        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
                      </svg>
                      <div style={{ fontSize: "13px" }}>No products added yet</div>
                    </div>
                  )}
                  {cart.map(function(item) {
                    return (
                      <div key={item.product_id} className="cart-item" style={{ padding: "10px 0", borderBottom: "1px solid var(--sep)", transition: "background 0.2s" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "-0.01em" }}>{item.product_name}</div>
                            <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)" }}>{item.product_code + " · $" + item.unit_price.toFixed(2) + " each"}</div>
                          </div>
                          <button
                            onClick={function() { removeFromCart(item.product_id); }}
                            className="btn"
                            style={{ padding: "2px 8px", fontSize: "14px", color: "var(--red)", border: "none", background: "rgba(255,59,48,.06)" }}
                          >
                            ×
                          </button>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <input
                            className="form-input"
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={function(e) { updateCartQty(item.product_id, e.target.value); }}
                            style={{ width: "58px", padding: "5px 8px", textAlign: "center" }}
                          />
                          <span style={{ fontSize: "12px", color: "var(--muted)" }}>×</span>
                          <input
                            className="form-input"
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={function(e) { updateCartPrice(item.product_id, e.target.value); }}
                            style={{ width: "78px", padding: "5px 8px", textAlign: "right" }}
                          />
                          <span className="mono" style={{ marginLeft: "auto", fontSize: "14px", fontWeight: 600, color: "var(--dark)" }}>
                            {"$" + (item.quantity * item.unit_price).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {cart.length > 0 && (
                    <div style={{ marginTop: "14px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                          <span style={{ fontFamily: "var(--mono)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>Subtotal</span>
                          <span className="mono" style={{ fontSize: "13px", fontWeight: 500 }}>{"$" + cartTotal.toFixed(2)}</span>
                        </div>
                        {parseFloat(form.fee) > 0 && (
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                            <span style={{ fontFamily: "var(--mono)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>Fee</span>
                            <span className="mono" style={{ fontSize: "13px", color: "var(--red)" }}>{"-$" + parseFloat(form.fee).toFixed(2)}</span>
                          </div>
                        )}
                        {parseFloat(form.shipping) > 0 && (
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                            <span style={{ fontFamily: "var(--mono)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>Shipping</span>
                            <span className="mono" style={{ fontSize: "13px", color: "var(--red)" }}>{"-$" + parseFloat(form.shipping).toFixed(2)}</span>
                          </div>
                        )}
                        <div style={{ borderTop: "1px solid var(--sep)", paddingTop: "6px", display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontFamily: "var(--mono)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>Net</span>
                          <span className="mono" style={{ fontSize: "14px", fontWeight: 700, color: "var(--accent)" }}>{"$" + (cartTotal - (parseFloat(form.fee) || 0) - (parseFloat(form.shipping) || 0)).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sale Info Summary */}
              {cart.length > 0 && (
                <div className="card" style={{ marginBottom: "16px" }}>
                  <div className="card-b" style={{ padding: "14px 22px" }}>
                    {[
                      { label: "Customer", value: form.customerName || "—" },
                      { label: "Platform", value: form.platform },
                      { label: "Payment", value: form.paymentMethod },
                      { label: "Fee", value: parseFloat(form.fee) > 0 ? "$" + parseFloat(form.fee).toFixed(2) : "—" },
                      { label: "Shipping", value: parseFloat(form.shipping) > 0 ? "$" + parseFloat(form.shipping).toFixed(2) : "—" },
                    ].map(function(row) {
                      return (
                        <div key={row.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                          <span style={{ fontFamily: "var(--mono)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>{row.label}</span>
                          <span style={{ fontSize: "13px", fontWeight: 500, letterSpacing: "-0.01em" }}>{row.value}</span>
                        </div>
                      );
                    })}
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>Status</span>
                      <span className={"bdg " + (form.paymentStatus === "Paid" ? "bdg-gn" : form.paymentStatus === "Pending" ? "bdg-rd" : "bdg-or")}>
                        {form.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={saving || cart.length === 0}
                style={{
                  width: "100%", padding: "14px 20px", fontSize: "13px",
                  opacity: (saving || cart.length === 0) ? 0.4 : 1,
                  cursor: (saving || cart.length === 0) ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Saving..." : "Confirm Sale · $" + cartTotal.toFixed(2)}
              </button>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div>
            {/* KPIs */}
            <div className="g4">
              {[
                { label: "Total Ventas", val: fmtD(totalFiltered), sub: filteredSales.length + " transactions",
                  icon: function() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>; } },
                { label: "Ticket Promedio", val: fmtD(avgTicket), sub: "Per transaction",
                  icon: function() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>; } },
                { label: "Pendiente", val: fmtD(pendingAmt), sub: pendingFiltered.length + " unpaid", red: true,
                  icon: function() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>; } },
                { label: "Mostrando", val: String(filteredSales.length), sub: "of " + sales.length + " total",
                  icon: function() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>; } },
              ].map(function(kpi) {
                return (
                  <div key={kpi.label} className="kpi">
                    <div className="kpi-ico">{kpi.icon()}</div>
                    <div className="kpi-lbl">{kpi.label}</div>
                    <div className="kpi-val" style={kpi.red ? { color: "var(--red)" } : {}}>{kpi.val}</div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", marginTop: "4px" }}>{kpi.sub}</div>
                  </div>
                );
              })}
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: "16px" }}>
              <div className="card-b" style={{ padding: "12px 22px" }}>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                  <input className="form-input" type="date" value={filterDate} onChange={function(e) { setFilterDate(e.target.value); }} style={{ width: "170px" }} />
                  <select className="form-input" value={filterPlatform} onChange={function(e) { setFilterPlatform(e.target.value); }} style={{ width: "170px" }}>
                    <option value="">All Platforms</option>
                    {PLATFORMS.map(function(p) { return <option key={p} value={p}>{p}</option>; })}
                  </select>
                  <select className="form-input" value={filterStatus} onChange={function(e) { setFilterStatus(e.target.value); }} style={{ width: "160px" }}>
                    <option value="">All Statuses</option>
                    {PAYMENT_STATUSES.map(function(s) { return <option key={s} value={s}>{s}</option>; })}
                  </select>
                  {(filterDate || filterPlatform || filterStatus) && (
                    <button className="btn" onClick={function() { setFilterDate(""); setFilterPlatform(""); setFilterStatus(""); }}>
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Sales Table */}
            <div className="card">
              <div className="card-h">
                <div>
                  <div className="card-t">Historial de Ventas</div>
                  <div className="card-sub">{filteredSales.length + " transactions · " + fmtD(totalFiltered)}</div>
                </div>
              </div>
              <div className="card-b" style={{ padding: 0 }}>
                <div style={{ overflowX: "auto" }}>
                  <table className="dt">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Platform</th>
                        <th>Type</th>
                        <th>Payment</th>
                        <th>Status</th>
                        <th>Region</th>
                        <th style={{ textAlign: "right" }}>Fee</th>
                        <th style={{ textAlign: "right" }}>Shipping</th>
                        <th style={{ textAlign: "right" }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSales.length === 0 && (
                        <tr>
                          <td colSpan={11} style={{ textAlign: "center", color: "var(--muted)", padding: "24px" }}>No sales found</td>
                        </tr>
                      )}
                      {filteredSales.map(function(s) {
                        var statusClass = s.payment_status === "Paid" ? "bdg-gn" : s.payment_status === "Pending" ? "bdg-rd" : "bdg-or";
                        var typeClass = s.sale_type === "Wholesale" ? "bdg-bl" : "bdg-or";
                        return (
                          <tr key={s.id}>
                            <td className="mono" style={{ color: "var(--muted)", fontSize: "11px" }}>{"#" + s.id}</td>
                            <td style={{ whiteSpace: "nowrap" }}>{s.date}</td>
                            <td style={{ fontWeight: 500 }}>{s.customer_name || "—"}</td>
                            <td>{s.platform}</td>
                            <td><span className={"bdg " + typeClass}>{s.sale_type}</span></td>
                            <td>{s.payment_method}</td>
                            <td><span className={"bdg " + statusClass}>{s.payment_status}</span></td>
                            <td>{s.vz_state || "—"}</td>
                            <td className="mono" style={{ textAlign: "right", color: "var(--red)" }}>{parseFloat(s.fee) > 0 ? "$" + parseFloat(s.fee).toFixed(2) : "—"}</td>
                            <td className="mono" style={{ textAlign: "right", color: "var(--red)" }}>{parseFloat(s.shipping) > 0 ? "$" + parseFloat(s.shipping).toFixed(2) : "—"}</td>
                            <td className="mono" style={{ textAlign: "right", fontWeight: 600 }}>{"$" + (parseFloat(s.total_usd) || 0).toFixed(2)}</td>
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
              <div className="summary-item"><div className="summary-label">Total Sales</div><div className="summary-value">{fmtD(totalFiltered)}</div></div>
              <div className="summary-item"><div className="summary-label">Avg Ticket</div><div className="summary-value">{fmtD(avgTicket)}</div></div>
              <div className="summary-item"><div className="summary-label">Pending</div><div className="summary-value" style={{ color: "var(--red)" }}>{fmtD(pendingAmt)}</div></div>
              <div className="summary-spacer" />
              <div className="summary-item"><div className="summary-label">Transactions</div><div className="summary-value accent">{String(filteredSales.length)}</div></div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
