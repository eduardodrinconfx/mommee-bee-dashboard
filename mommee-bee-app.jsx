import { useState, useEffect } from "react";
import { supabase } from "./src/supabaseClient.js";

var MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
var EXP_CATEGORIES = ["Advertising","Salaries","Services","Packaging","Transport","Rent","Taxes","Other"];
var PLATFORMS = ["Instagram","WhatsApp","Website","Boutique","Marketplace"];
var PLAT_COLORS = ["var(--accent)","var(--blue)","var(--green)","#ff9500","var(--purple)"];

function fmtK(v) { return v >= 1000 ? "$" + (v / 1000).toFixed(1) + "k" : "$" + v.toFixed(0); }
function fmtD(v) { return "$" + v.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

export default function MommeeBeeApp(props) {
  var onNavigate = props.onNavigate || function() {};
  var clients = props.clients || [];
  var setClients = props.setClients || function() {};

  var salesState = useState([]);       var sales = salesState[0];       var setSales = salesState[1];
  var itemsState = useState([]);       var saleItems = itemsState[0];   var setSaleItems = itemsState[1];
  var importsState = useState([]);     var imports = importsState[0];   var setImports = importsState[1];
  var expensesState = useState([]);    var expenses = expensesState[0]; var setExpenses = expensesState[1];
  var productsState = useState([]);    var products = productsState[0]; var setProducts = productsState[1];
  var loadingState = useState(true);   var loading = loadingState[0];   var setLoading = loadingState[1];
  var showExpFormState = useState(false); var showExpenseForm = showExpFormState[0]; var setShowExpenseForm = showExpFormState[1];
  var expFormState = useState({ date: new Date().toISOString().split("T")[0], category: "Advertising", desc: "", amount: "" });
  var expForm = expFormState[0]; var setExpForm = expFormState[1];
  var refreshState = useState(0); var refreshKey = refreshState[0]; var setRefreshKey = refreshState[1];

  useEffect(function() { loadData(); }, [refreshKey]);

  function loadData() {
    setLoading(true);
    var year = new Date().getFullYear();
    var start = year + "-01-01";
    Promise.all([
      supabase.from("sales").select("*").gte("date", start).order("date", { ascending: false }),
      supabase.from("sale_items").select("*"),
      supabase.from("imports").select("*").gte("date", start).order("date", { ascending: false }),
      supabase.from("expenses").select("*").gte("date", start).order("date", { ascending: false }),
      supabase.from("clients").select("*").order("name"),
      supabase.from("products").select("*"),
    ]).then(function(results) {
      if (results[0].data) setSales(results[0].data);
      if (results[1].data) setSaleItems(results[1].data);
      if (results[2].data) setImports(results[2].data);
      if (results[3].data) setExpenses(results[3].data.map(function(e) { return { id: e.id, date: e.date, category: e.category, desc: e.description || "", amount: e.amount_usd || 0 }; }));
      if (results[4].data) setClients(results[4].data);
      if (results[5].data) setProducts(results[5].data);
      setLoading(false);
    });
  }

  var setE = function(k) { return function(e) { setExpForm(function(f) { var n = {}; for (var x in f) n[x] = f[x]; n[k] = e.target.value; return n; }); }; };

  var saveExpense = function() {
    var amount = parseFloat(expForm.amount) || 0;
    if (amount <= 0) return;
    var row = { date: expForm.date, category: expForm.category, description: expForm.desc, amount_usd: amount };
    supabase.from("expenses").insert(row).select().single().then(function(res) {
      var d = res.data || {};
      setExpenses(function(ex) { return [{ id: d.id || Date.now(), date: expForm.date, category: expForm.category, desc: expForm.desc, amount: amount }].concat(ex); });
      setExpForm({ date: new Date().toISOString().split("T")[0], category: "Advertising", desc: "", amount: "" });
      setShowExpenseForm(false);
    });
  };

  // Computations
  var now = new Date();
  var cm = now.getMonth();
  var cy = now.getFullYear();
  var todayStr = now.toISOString().split("T")[0];
  var dateLabel = MONTHS[cm] + " " + (now.getDate() < 10 ? "0" : "") + now.getDate() + ", " + cy;

  // Today
  var todaySales = sales.filter(function(s) { return s.date === todayStr; });
  var todayGross = todaySales.reduce(function(s, v) { return s + (v.total_usd || 0); }, 0);
  var todayCount = todaySales.length;

  // Year
  var totalYearSales = sales.reduce(function(s, v) { return s + (v.total_usd || 0); }, 0);

  // By month
  var salesByMonth = MONTHS.map(function(month, i) {
    var ms = sales.filter(function(s) { return new Date(s.date).getMonth() === i; });
    return { month: month, sales: ms.reduce(function(sum, s) { return sum + (s.total_usd || 0); }, 0), active: ms.length > 0 };
  });

  // Current month
  var monthSalesTotal = sales.filter(function(s) { return new Date(s.date).getMonth() === cm; }).reduce(function(sum, s) { return sum + (s.total_usd || 0); }, 0);
  var monthSaleIds = new Set(sales.filter(function(s) { return new Date(s.date).getMonth() === cm; }).map(function(s) { return s.id; }));
  var monthItems = saleItems.filter(function(it) { return monthSaleIds.has(it.sale_id); });
  var monthSaleCount = sales.filter(function(s) { return new Date(s.date).getMonth() === cm; }).length;

  // Prev month for change
  var pm = cm === 0 ? 11 : cm - 1;
  var prevMonthTotal = sales.filter(function(s) { return new Date(s.date).getMonth() === pm; }).reduce(function(sum, s) { return sum + (s.total_usd || 0); }, 0);
  var salesChangePct = prevMonthTotal > 0 ? (((monthSalesTotal - prevMonthTotal) / prevMonthTotal) * 100).toFixed(1) : "0";
  var monthChangePct = prevMonthTotal > 0 ? (((monthSalesTotal - prevMonthTotal) / prevMonthTotal) * 100).toFixed(1) : "0";

  // COGS
  var productMap = {};
  products.forEach(function(p) { productMap[p.id] = p; });
  var monthCogs = monthItems.reduce(function(s, it) {
    var p = productMap[it.product_id];
    return s + (it.quantity || 0) * (p ? (parseFloat(p.cost) || 0) : (it.unit_cost || 0));
  }, 0);

  // OPEX
  var monthExpenses = expenses.filter(function(e) { return new Date(e.date).getMonth() === cm; });
  var totalOpex = monthExpenses.reduce(function(s, e) { return s + (e.amount || 0); }, 0);

  // P&L
  var grossProfit = monthSalesTotal - monthCogs;
  var netProfit = grossProfit - totalOpex;
  var grossMargin = monthSalesTotal > 0 ? ((grossProfit / monthSalesTotal) * 100).toFixed(1) : "0";
  var netMargin = monthSalesTotal > 0 ? ((netProfit / monthSalesTotal) * 100).toFixed(1) : "0";

  // Top products
  var topMap = {};
  monthItems.forEach(function(it) {
    var nm = it.product_name || "Product";
    if (!topMap[nm]) topMap[nm] = { name: nm, sales: 0, units: 0 };
    topMap[nm].sales += (it.quantity || 0) * (it.unit_price || 0);
    topMap[nm].units += it.quantity || 0;
  });
  var topProducts = Object.values(topMap).sort(function(a, b) { return b.sales - a.sales; }).slice(0, 5);
  var topMax = topProducts.length > 0 ? topProducts[0].sales : 1;

  // Platforms
  var platTotals = PLATFORMS.map(function(name) {
    var total = sales.filter(function(s) { return s.platform === name && new Date(s.date).getMonth() === cm; }).reduce(function(sum, s) { return sum + (s.total_usd || 0); }, 0);
    return { name: name, sales: total, pct: monthSalesTotal > 0 ? Math.round((total / monthSalesTotal) * 100) : 0 };
  });
  var activePlatforms = platTotals.filter(function(p) { return p.sales > 0; }).length;

  // Donut
  var circ = 2 * Math.PI * 54;
  var platOffset = 0;
  var donutSegs = platTotals.map(function(p, i) {
    var dash = (p.pct / 100) * circ;
    var seg = { dash: dash, gap: circ - dash, offset: -platOffset, color: PLAT_COLORS[i] };
    platOffset += dash;
    return seg;
  });

  // Active imports
  var activeImports = imports.filter(function(i) { return i.status !== "Received"; });

  // Sparkline bars helper
  var sparkBars = function(data) {
    var max = Math.max.apply(null, data.concat([1]));
    return data.map(function(v, i) {
      var h = Math.max((v / max) * 24, 4);
      return { height: h + "px", animationDelay: (i * 40) + "ms" };
    });
  };

  // Generate 12-point data for sparklines
  var spark12 = function(base, variance) {
    var arr = [];
    for (var i = 0; i < 12; i++) {
      arr.push(base + Math.round(Math.random() * variance * (i + 1) / 12));
    }
    return arr;
  };

  // Max bar for year chart
  var maxMonthSales = Math.max.apply(null, salesByMonth.map(function(m) { return m.sales; }).concat([1]));

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: "28px", fontWeight: 500, color: "var(--accent)", letterSpacing: "-0.04em", marginBottom: "8px" }}>LOADING</div>
          <div style={{ color: "var(--muted)", fontSize: "13px" }}>Connecting to Supabase...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <style>{"\n        .btn-orange:hover{background:#b8895f!important;transform:translateY(-1px)}\n        .btn-ghost:hover{border-color:var(--accent)!important;color:var(--accent)!important}\n        .row-hover:hover{background:#fafafa!important}\n        .exp-row:hover{background:#fafafa!important}\n      "}</style>

      {/* Header */}
      <div className="hdr">
        <div className="hdr-left">
          <div className="hdr-title">Dashboard</div>
          <div className="hdr-date">{dateLabel}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button className="btn" onClick={function() { setRefreshKey(function(k) { return k + 1; }); }} style={{ gap: "6px" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "12px", height: "12px" }}>
              <path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
              <path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
            </svg>
            Refresh
          </button>
          <div className="hdr-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Buscar productos, clientes..." />
          </div>
        </div>
      </div>

      <div className="content">

        {/* ROW 1: KPI Cards */}
        <div className="g4">
          {[
            { label: "Ventas Hoy", val: fmtD(todayGross), change: "+" + salesChangePct + "%", up: parseFloat(salesChangePct) >= 0,
              icon: function() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>; } },
            { label: "Ordenes Hoy", val: String(todayCount), change: "+" + todayCount, up: true,
              icon: function() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>; } },
            { label: "Ventas Mes", val: fmtD(monthSalesTotal), change: "+" + monthChangePct + "%", up: parseFloat(monthChangePct) >= 0,
              icon: function() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>; } },
            { label: "Margen Bruto", val: grossMargin + "%", change: parseFloat(grossMargin) > 0 ? "+" : "", up: parseFloat(grossMargin) >= 0,
              icon: function() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>; } },
          ].map(function(kpi) {
            var bars = sparkBars(spark12(8, 16));
            return (
              <div key={kpi.label} className="kpi">
                <div className="kpi-ico">{kpi.icon()}</div>
                <div className="kpi-lbl">{kpi.label}</div>
                <div className="kpi-val">{kpi.val}</div>
                <div className="kpi-foot">
                  <div className={"kpi-trend " + (kpi.up ? "up" : "down")}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      {kpi.up
                        ? <polyline points="18 15 12 9 6 15"/>
                        : <polyline points="6 9 12 15 18 9"/>}
                    </svg>
                    {kpi.change}
                  </div>
                  <div className="kpi-spark">
                    {bars.map(function(b, i) {
                      return <div key={i} className="kpi-spark-bar" style={{ height: b.height, animationDelay: b.animationDelay }} />;
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ROW 2: More KPIs */}
        <div className="g4">
          {[
            { label: "Imports Activas", val: String(activeImports.length), change: String(activeImports.length), up: true,
              icon: function() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="6" width="22" height="12" rx="2"/><path d="M1 10h22"/></svg>; } },
            { label: "SKUs Activos", val: String(products.filter(function(p) { return p.status === "Active"; }).length), change: "+" + products.length, up: true,
              icon: function() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>; } },
            { label: "Clientes", val: String(clients.length), change: "+" + clients.length, up: true,
              icon: function() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>; } },
            { label: "Gastos Mes", val: "$" + totalOpex.toFixed(0), change: "-$" + totalOpex.toFixed(0), up: false,
              icon: function() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>; } },
          ].map(function(kpi) {
            var bars = sparkBars(spark12(6, 12));
            return (
              <div key={kpi.label} className="kpi">
                <div className="kpi-ico">{kpi.icon()}</div>
                <div className="kpi-lbl">{kpi.label}</div>
                <div className="kpi-val">{kpi.val}</div>
                <div className="kpi-foot">
                  <div className={"kpi-trend " + (kpi.up ? "up" : "down")}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      {kpi.up
                        ? <polyline points="18 15 12 9 6 15"/>
                        : <polyline points="6 9 12 15 18 9"/>}
                    </svg>
                    {kpi.change}
                  </div>
                  <div className="kpi-spark">
                    {bars.map(function(b, i) {
                      return <div key={i} className="kpi-spark-bar" style={{ height: b.height, animationDelay: b.animationDelay }} />;
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ROW 3: P&L + Alerts */}
        <div className="g2">
          <div className="card">
            <div className="card-h">
              <div>
                <div className="card-t">Monthly P&L</div>
                <div className="card-sub">{"Income Statement \u2014 " + MONTHS[cm] + " " + cy}</div>
              </div>
            </div>
            <div className="card-b">
              <table className="pnl-tbl">
                <tbody>
                  <tr><td>Gross Sales</td><td>{"$" + monthSalesTotal.toLocaleString()}</td></tr>
                  <tr><td style={{ paddingLeft: "16px" }}>(-) COGS</td><td style={{ color: "var(--red)" }}>{"-$" + monthCogs.toLocaleString()}</td></tr>
                  <tr className="total"><td>{"= Gross Profit "}<span className="bdg bdg-gn" style={{ marginLeft: "8px" }}>{grossMargin + "%"}</span></td><td style={{ color: "var(--green)" }}>{"$" + grossProfit.toLocaleString()}</td></tr>
                  <tr><td style={{ paddingLeft: "16px" }}>(-) Operating Expenses</td><td style={{ color: "var(--red)" }}>{"-$" + totalOpex.toLocaleString()}</td></tr>
                  <tr className="total"><td>{"= Net Profit "}<span className={netProfit >= 0 ? "bdg bdg-gn" : "bdg bdg-rd"} style={{ marginLeft: "8px" }}>{netMargin + "%"}</span></td><td style={{ color: netProfit >= 0 ? "var(--green)" : "var(--red)" }}>{"$" + netProfit.toLocaleString()}</td></tr>
                </tbody>
              </table>
              <div className="summary-bar" style={{ marginTop: "16px" }}>
                <div className="summary-item"><div className="summary-label">Revenue</div><div className="summary-value">{"$" + monthSalesTotal.toLocaleString()}</div></div>
                <div className="summary-item"><div className="summary-label">COGS</div><div className="summary-value">{"$" + monthCogs.toLocaleString()}</div></div>
                <div className="summary-item"><div className="summary-label">OPEX</div><div className="summary-value">{"$" + totalOpex.toLocaleString()}</div></div>
                <div className="summary-spacer" />
                <div className="summary-item"><div className="summary-label">Net Profit</div><div className="summary-value accent">{"$" + netProfit.toLocaleString()}</div></div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-h">
              <div>
                <div className="card-t">Alerts</div>
                <div className="card-sub">{"0 notifications"}</div>
              </div>
            </div>
            <div className="card-b">
              {products.filter(function(p) { return p.status === "Active" && p.stock <= (p.min_stock || 0); }).length > 0 && (
                <div className="alert-row">
                  <div className="alert-icon warn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "14px", height: "14px" }}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  </div>
                  <span>{products.filter(function(p) { return p.status === "Active" && p.stock <= (p.min_stock || 0); }).length + " products below minimum stock"}</span>
                </div>
              )}
              {activeImports.length > 0 && (
                <div className="alert-row">
                  <div className="alert-icon info">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "14px", height: "14px" }}><rect x="1" y="6" width="22" height="12" rx="2"/><path d="M1 10h22"/></svg>
                  </div>
                  <span>{activeImports.length + " active import orders"}</span>
                </div>
              )}
              {products.filter(function(p) { return p.status === "Active" && p.stock <= (p.min_stock || 0); }).length === 0 && activeImports.length === 0 && (
                <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: "32px", height: "32px", margin: "0 auto 8px", display: "block", opacity: 0.3 }}>
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                  No alerts at this time
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ROW 4: Bar chart + Donut */}
        <div className="g21">
          <div className="card">
            <div className="card-h">
              <div>
                <div className="card-t">Ventas por Mes</div>
                <div className="card-sub">{cy + " \u2014 " + fmtD(totalYearSales) + " YTD"}</div>
              </div>
              <span className="card-a" onClick={function() { onNavigate("Sales"); }}>View all</span>
            </div>
            <div className="card-b">
              <div className="bars">
                {salesByMonth.map(function(m, i) {
                  var h = m.active ? Math.max((m.sales / maxMonthSales) * 100, 3) : 3;
                  return (
                    <div key={i} className="bar-col">
                      <div className="bar-val">{m.sales > 0 ? fmtK(m.sales) : ""}</div>
                      <div className={"bar " + (i === cm ? "hi" : "gy")} style={{ height: h + "%", animationDelay: (i * 60) + "ms" }} />
                      <div className="bar-lbl">{m.month}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-h">
              <div>
                <div className="card-t">Plataformas</div>
                <div className="card-sub">Distribucion de ventas</div>
              </div>
            </div>
            <div className="card-b">
              <div className="donut-wrap">
                <div className="donut-box">
                  <svg viewBox="0 0 120 120">
                    {donutSegs.map(function(seg, i) {
                      return <circle key={i} cx="60" cy="60" r="54" stroke={seg.color} strokeDasharray={seg.dash + " " + seg.gap} strokeDashoffset={seg.offset} />;
                    })}
                  </svg>
                  <div className="donut-ctr">
                    <div className="donut-cv">{activePlatforms}</div>
                    <div className="donut-cl">Channels</div>
                  </div>
                </div>
                <div className="donut-leg">
                  {platTotals.map(function(p, i) {
                    return (
                      <div key={i} className="donut-li">
                        <div className="donut-dot" style={{ background: PLAT_COLORS[i] }} />
                        <span className="donut-ll">{p.name}</span>
                        <span className="donut-lv">{p.pct + "%"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 5: Top Products + Platform bars */}
        <div className="g2">
          <div className="card">
            <div className="card-h">
              <div>
                <div className="card-t">Top Productos</div>
                <div className="card-sub">{MONTHS[cm] + " \u2014 por ventas"}</div>
              </div>
            </div>
            <div className="card-b">
              {topProducts.length === 0 ? (
                <div style={{ fontSize: "13px", color: "var(--muted)", padding: "12px 0" }}>No sales recorded this month.</div>
              ) : topProducts.map(function(p, i) {
                return (
                  <div key={i} className="hb-row">
                    <div className="hb-lbl">{p.name}</div>
                    <div className="hb-trk">
                      <div className="hb-fill" style={{ width: ((p.sales / topMax) * 100) + "%", background: i === 0 ? "var(--accent)" : "var(--blue)" }} />
                    </div>
                    <div className="hb-val">{"$" + p.sales.toFixed(0)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="card-h">
              <div>
                <div className="card-t">Plataformas</div>
                <div className="card-sub">Rendimiento por canal</div>
              </div>
            </div>
            <div className="card-b">
              {platTotals.map(function(p, i) {
                return (
                  <div key={i} className="hb-row">
                    <div className="hb-lbl">{p.name}</div>
                    <div className="hb-trk">
                      <div className="hb-fill" style={{ width: p.pct + "%", background: PLAT_COLORS[i] }} />
                    </div>
                    <div className="hb-val">{"$" + p.sales.toFixed(0)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ROW 6: Activity + Expenses */}
        <div className="g2">
          <div className="card">
            <div className="card-h">
              <div>
                <div className="card-t">Actividad Reciente</div>
                <div className="card-sub">Ultimas transacciones</div>
              </div>
              <span className="card-a" onClick={function() { onNavigate("Sales"); }}>Ver todo</span>
            </div>
            <div className="card-b">
              <div className="af">
                {todaySales.length === 0 ? (
                  <div style={{ fontSize: "13px", color: "var(--muted)", padding: "12px 0" }}>No sales recorded today.</div>
                ) : todaySales.slice(0, 6).map(function(s, i) {
                  return (
                    <div key={s.id} className="af-item">
                      <div className={"af-dot " + (i % 2 === 0 ? "gn" : "or")} />
                      <div>
                        <div className="af-txt">
                          {"Venta "}<strong>{"$" + (s.total_usd || 0).toFixed(2)}</strong>{" via "}<strong>{s.platform || "Direct"}</strong>
                        </div>
                        <div className="af-time">{s.date + " \u00B7 " + (s.payment_method || "")}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-h">
              <div>
                <div className="card-t">Gastos Operativos</div>
                <div className="card-sub">Expenses this month</div>
              </div>
              <button className="btn" onClick={function() { setShowExpenseForm(function(v) { return !v; }); }} style={{ padding: "6px 14px" }}>+ Add</button>
            </div>
            <div className="card-b">
              {showExpenseForm && (
                <div style={{ background: "var(--accent-light)", border: "1px solid var(--accent)", borderRadius: "var(--rs)", padding: "14px", marginBottom: "14px", animation: "slideIn 0.2s ease" }}>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select className="form-input" value={expForm.category} onChange={setE("category")}>
                        {EXP_CATEGORIES.map(function(c) { return <option key={c}>{c}</option>; })}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Amount ($)</label>
                      <input className="form-input" type="number" value={expForm.amount} onChange={setE("amount")} placeholder="0.00" step="0.01" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group" style={{ gridColumn: "span 2" }}>
                      <label className="form-label">Description</label>
                      <input className="form-input" value={expForm.desc} onChange={setE("desc")} placeholder="Ex: Instagram Ads March" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Date</label>
                      <input className="form-input" type="date" value={expForm.date} onChange={setE("date")} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                    <button className="btn btn-primary" onClick={saveExpense}>Save Expense</button>
                    <button className="btn" onClick={function() { setShowExpenseForm(false); }}>Cancel</button>
                  </div>
                </div>
              )}

              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                {monthExpenses.map(function(e, i) {
                  return (
                    <div key={e.id} className="exp-row">
                      <span className="bdg bdg-or">{e.category}</span>
                      <div style={{ flex: 1, fontSize: "12px", color: "var(--muted)" }}>{e.desc}</div>
                      <span className="mono" style={{ color: "var(--red)" }}>{"-$" + e.amount}</span>
                    </div>
                  );
                })}
              </div>

              <div className="summary-bar" style={{ marginTop: "12px" }}>
                <div className="summary-item"><div className="summary-label">Total Expenses</div><div className="summary-value" style={{ color: "var(--red)" }}>{"-$" + totalOpex.toLocaleString()}</div></div>
                <div className="summary-spacer" />
                <div className="summary-item"><div className="summary-label">Categories</div><div className="summary-value">{new Set(monthExpenses.map(function(e) { return e.category; })).size}</div></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
