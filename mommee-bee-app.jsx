import { useState, useEffect } from "react";
import { supabase } from "./src/supabaseClient.js";

var C = {
  bg: "#EDEFEA", surface: "#ffffff", surfaceAlt: "#f3f3f2", border: "#d0d0cf",
  darkGray: "#1a1a1a", medGray: "#4a4a4a", mutedGray: "#888888",
  primary: "#CC9F75", primaryLight: "#f5efe8",
  green: "#16a34a", greenBg: "#dcfce7",
  red: "#dc2626", redBg: "#fee2e2",
  yellow: "#d97706", yellowBg: "#fef3c7",
  blue: "#2563eb", blueBg: "#dbeafe",
};

var Card = function(props) {
  return (
    <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "14px", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", ...(props.style || {}) }}>
      {props.children}
    </div>
  );
};

var SectionTitle = function(props) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "16px" }}>
      <div>
        <div style={{ fontSize: "9px", color: C.primary, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "2px" }}>{props.label}</div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "20px", letterSpacing: "0.06em", color: C.darkGray }}>{props.title}</div>
      </div>
      {props.action}
    </div>
  );
};

var MiniBar = function(props) {
  return (
    <div style={{ height: "6px", background: C.surfaceAlt, borderRadius: "3px", overflow: "hidden", flex: 1 }}>
      <div style={{ height: "100%", width: (props.pct || 0) + "%", background: props.color, borderRadius: "3px", transition: "width 0.5s" }} />
    </div>
  );
};

var iStyle = {
  width: "100%", background: C.surface, border: "1px solid " + C.border,
  borderRadius: "8px", padding: "9px 12px", color: C.darkGray, fontSize: "13px",
  fontFamily: "'DM Sans',sans-serif", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
};

var MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
var EXP_CATEGORIES = ["Advertising","Salaries","Services","Packaging","Transport","Rent","Taxes","Other"];

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
  var expFormState = useState({ date: new Date().toISOString().split("T")[0], category: "Advertising", desc: "", amount: "", recurring: false });
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
      setExpForm({ date: new Date().toISOString().split("T")[0], category: "Advertising", desc: "", amount: "", recurring: false });
      setShowExpenseForm(false);
    });
  };

  // ── Computations ──
  var now = new Date();
  var currentMonth = now.getMonth();
  var currentYear = now.getFullYear();
  var todayStr = now.toISOString().split("T")[0];
  var monthNames = MONTHS;

  // Today
  var todayDbSales = sales.filter(function(s) { return s.date === todayStr; });
  var todayGross = todayDbSales.reduce(function(s, v) { return s + (v.total_usd || 0); }, 0);
  var todayCount = todayDbSales.length;

  // Year totals
  var totalYearSales = sales.reduce(function(s, v) { return s + (v.total_usd || 0); }, 0);

  // Sales by month
  var salesByMonth = monthNames.map(function(month, i) {
    var monthSales = sales.filter(function(s) { return new Date(s.date).getMonth() === i; });
    return { month: month, sales: monthSales.reduce(function(sum, s) { return sum + (s.total_usd || 0); }, 0), active: monthSales.length > 0 };
  });

  // Current month
  var currentMonthSales = sales.filter(function(s) { return new Date(s.date).getMonth() === currentMonth; }).reduce(function(sum, s) { return sum + (s.total_usd || 0); }, 0);
  var currentMonthSaleIds = new Set(sales.filter(function(s) { return new Date(s.date).getMonth() === currentMonth; }).map(function(s) { return s.id; }));
  var monthItemsList = saleItems.filter(function(it) { return currentMonthSaleIds.has(it.sale_id); });

  // COGS
  var productMap = {};
  products.forEach(function(p) { productMap[p.id] = p; });
  var monthCogs = monthItemsList.reduce(function(s, it) {
    var p = productMap[it.product_id];
    return s + (it.quantity || 0) * (p ? (parseFloat(p.cost) || 0) : (it.unit_cost || 0));
  }, 0);

  // OPEX
  var totalOpex = expenses.filter(function(e) { return new Date(e.date).getMonth() === currentMonth; }).reduce(function(s, e) { return s + (e.amount || 0); }, 0);

  // P&L
  var grossProfit = currentMonthSales - monthCogs;
  var netProfit = grossProfit - totalOpex;
  var grossMargin = monthCogs > 0 ? ((grossProfit / monthCogs) * 100).toFixed(1) : 0;
  var netMargin = monthCogs > 0 ? ((netProfit / monthCogs) * 100).toFixed(1) : 0;

  // Top products
  var topProductsMap = {};
  monthItemsList.forEach(function(it) {
    var name = it.product_name || "Product";
    if (!topProductsMap[name]) topProductsMap[name] = { name: name, sales: 0, units: 0 };
    topProductsMap[name].sales += (it.quantity || 0) * (it.unit_price || 0);
    topProductsMap[name].units += it.quantity || 0;
  });
  var topProducts = Object.values(topProductsMap).sort(function(a, b) { return b.sales - a.sales; }).slice(0, 5);

  // Platforms
  var platformTotals = ["Instagram","WhatsApp","Website","Boutique","Marketplace"].map(function(name) {
    var total = sales.filter(function(s) { return s.platform === name && new Date(s.date).getMonth() === currentMonth; }).reduce(function(sum, s) { return sum + (s.total_usd || 0); }, 0);
    return { name: name, sales: total, pct: currentMonthSales > 0 ? Math.round((total / currentMonthSales) * 100) : 0 };
  });

  // Imports
  var activeImports = imports.filter(function(i) { return i.status !== "Received"; });

  var marginColor = function(v) { return parseFloat(v) > 80 ? C.green : parseFloat(v) > 40 ? C.yellow : C.red; };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "36px", color: C.primary, letterSpacing: "6px", marginBottom: "8px" }}>LOADING</div>
          <div style={{ color: C.mutedGray, fontSize: "13px" }}>Connecting to Supabase...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", color: C.darkGray }}>
      <style>{"\n        @keyframes slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}\n        @keyframes fadeIn{from{opacity:0}to{opacity:1}}\n        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}\n        @keyframes pop{0%{transform:scale(0.95);opacity:0}100%{transform:scale(1);opacity:1}}\n        .btn-orange:hover{background:#b8895f!important;transform:translateY(-1px);box-shadow:0 4px 16px rgba(204,159,117,0.3)!important}\n        .btn-ghost:hover{border-color:#CC9F75!important;color:#CC9F75!important}\n        .row-hover:hover{background:#f8f8f7!important}\n        .toggle-btn:hover{opacity:0.85}\n        .exp-row:hover{background:#f8f8f7!important}\n        .alert-row:hover{background:#f0f0ef!important;cursor:default}\n      "}</style>

      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>

        {/* PAGE HEADER */}
        <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: "10px", color: C.primary, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "4px" }}>◆ Main Panel</div>
            <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "34px", letterSpacing: "0.06em", color: C.darkGray, lineHeight: 1, margin: 0 }}>DASHBOARD</h1>
            <p style={{ color: C.mutedGray, fontSize: "12px", marginTop: "4px" }}>
              {now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <button
            onClick={function() { setRefreshKey(function(k) { return k + 1; }); }}
            className="btn-ghost"
            style={{ background: "none", border: "1px solid " + C.border, borderRadius: "8px", padding: "8px 14px", fontSize: "12px", color: C.medGray, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s" }}
          >
            ↻ Refresh
          </button>
        </div>

        {/* ── ROW 1: KPIs TODAY + MONTH ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>

          <Card>
            <SectionTitle label="Today" title="DAILY SUMMARY" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px" }}>
              {[
                { label: "Gross Sales", val: "$" + todayGross.toFixed(2), color: C.primary },
                { label: "Transactions", val: String(todayCount), color: C.blue },
                { label: "Avg. Ticket", val: todayCount > 0 ? "$" + (todayGross / todayCount).toFixed(2) : "$0.00", color: C.green },
                { label: "Month Sales", val: "$" + currentMonthSales.toFixed(2), color: C.medGray },
              ].map(function(k) {
                return (
                  <div key={k.label} style={{ background: C.surfaceAlt, borderRadius: "10px", padding: "12px", border: "1px solid " + C.border }}>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "22px", color: k.color, letterSpacing: "0.04em" }}>{k.val}</div>
                    <div style={{ fontSize: "10px", color: C.mutedGray, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "2px" }}>{k.label}</div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <SectionTitle label={monthNames[currentMonth] + " " + currentYear} title="MONTHLY SUMMARY" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px" }}>
              {[
                { label: "Gross Sales", val: "$" + currentMonthSales.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), color: C.primary },
                { label: "COGS", val: "-$" + monthCogs.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), color: C.red },
                { label: "Gross Profit", val: "$" + grossProfit.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), color: C.green },
                { label: "Net Profit", val: "$" + netProfit.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), color: netProfit >= 0 ? C.green : C.red },
              ].map(function(k) {
                return (
                  <div key={k.label} style={{ background: C.surfaceAlt, borderRadius: "10px", padding: "12px", border: "1px solid " + C.border }}>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "22px", color: k.color, letterSpacing: "0.04em" }}>{k.val}</div>
                    <div style={{ fontSize: "10px", color: C.mutedGray, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "2px" }}>{k.label}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* ── ROW 2: P&L + ALERTS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>

          <Card style={{ borderLeft: "3px solid " + C.primary }}>
            <SectionTitle label="Income Statement" title="MONTHLY P&L" />
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {[
                { label: "Gross Sales", val: currentMonthSales, indent: 0, color: C.darkGray, bold: false },
                { label: "(-) COGS", val: -monthCogs, indent: 1, color: C.red, bold: false },
                { label: "= Gross Profit", val: grossProfit, indent: 0, color: C.green, bold: true, divider: true, pct: grossMargin },
                { label: "(-) Operating Expenses", val: -totalOpex, indent: 1, color: C.red, bold: false },
                { label: "= NET PROFIT", val: netProfit, indent: 0, color: netProfit >= 0 ? C.green : C.red, bold: true, divider: true, pct: netMargin, highlight: true },
              ].map(function(row, i) {
                return (
                  <div key={i}>
                    {row.divider && <div style={{ height: "1px", background: C.border, margin: "4px 0" }} />}
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: row.highlight ? "10px 12px" : "6px 12px",
                      background: row.highlight ? C.darkGray : "transparent",
                      borderRadius: row.highlight ? "8px" : "0",
                      paddingLeft: (12 + (row.indent || 0) * 16) + "px",
                    }}>
                      <span style={{ fontSize: row.bold ? "13px" : "12px", fontWeight: row.bold ? 700 : 400, color: row.highlight ? "#ccc" : C.medGray }}>{row.label}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {row.pct && <span style={{ fontSize: "11px", fontWeight: 700, color: row.color, background: row.color + "18", padding: "2px 8px", borderRadius: "10px" }}>{row.pct}%</span>}
                        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: row.bold ? "20px" : "16px", letterSpacing: "0.04em", color: row.highlight ? C.primary : row.color }}>
                          {row.val < 0 ? "-$" + Math.abs(row.val).toLocaleString() : "$" + row.val.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <SectionTitle label="Notifications" title="ALERTS" />
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {products.filter(function(p) { return p.status === "Active" && p.stock <= (p.min_stock || 0); }).length > 0 && (
                <div className="alert-row" style={{
                  background: C.redBg, border: "1px solid " + C.red,
                  borderRadius: "8px", padding: "10px 14px", fontSize: "12px", color: C.darkGray,
                  display: "flex", alignItems: "flex-start", gap: "8px", transition: "background 0.1s",
                }}>
                  <span style={{ flexShrink: 0 }}>🔴</span>
                  <span style={{ lineHeight: 1.4 }}>{products.filter(function(p) { return p.status === "Active" && p.stock <= (p.min_stock || 0); }).length} products below minimum stock level</span>
                </div>
              )}
              {sales.filter(function(s) { return s.payment_status === "Pending"; }).length > 0 && (
                <div className="alert-row" style={{
                  background: C.yellowBg, border: "1px solid " + C.yellow,
                  borderRadius: "8px", padding: "10px 14px", fontSize: "12px", color: C.darkGray,
                  display: "flex", alignItems: "flex-start", gap: "8px", transition: "background 0.1s",
                }}>
                  <span style={{ flexShrink: 0 }}>🟡</span>
                  <span style={{ lineHeight: 1.4 }}>{sales.filter(function(s) { return s.payment_status === "Pending"; }).length} pending payments totaling ${sales.filter(function(s) { return s.payment_status === "Pending"; }).reduce(function(sum, s) { return sum + (s.total_usd || 0); }, 0).toFixed(2)}</span>
                </div>
              )}
              {activeImports.length > 0 && (
                <div className="alert-row" style={{
                  background: C.blueBg, border: "1px solid " + C.blue,
                  borderRadius: "8px", padding: "10px 14px", fontSize: "12px", color: C.darkGray,
                  display: "flex", alignItems: "flex-start", gap: "8px", transition: "background 0.1s",
                }}>
                  <span style={{ flexShrink: 0 }}>📦</span>
                  <span style={{ lineHeight: 1.4 }}>{activeImports.length} active import orders in transit</span>
                </div>
              )}
              {products.filter(function(p) { return p.status === "Active" && p.stock <= (p.min_stock || 0); }).length === 0 && sales.filter(function(s) { return s.payment_status === "Pending"; }).length === 0 && activeImports.length === 0 && (
                <div style={{ fontSize: "13px", color: C.green, padding: "12px 0", textAlign: "center" }}>✓ All systems normal</div>
              )}
            </div>
          </Card>
        </div>

        {/* ── ROW 3: YEAR + IMPORTS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>

          <Card style={{ borderLeft: "3px solid " + C.primary }}>
            <SectionTitle label={"Year " + currentYear} title="ANNUAL SUMMARY" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px", marginBottom: "16px" }}>
              {[
                { label: "Sales YTD", val: "$" + totalYearSales.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), color: C.primary },
                { label: "Transactions", val: String(sales.length), color: C.medGray },
                { label: "Clients", val: String(clients.length), color: C.green },
              ].map(function(k) {
                return (
                  <div key={k.label} style={{ background: C.surfaceAlt, borderRadius: "10px", padding: "10px 12px", border: "1px solid " + C.border }}>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "20px", color: k.color, letterSpacing: "0.04em" }}>{k.val}</div>
                    <div style={{ fontSize: "10px", color: C.mutedGray, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "2px" }}>{k.label}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: C.medGray }}>Sales YTD</span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: C.primary }}>${totalYearSales.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div style={{ height: "8px", background: C.surfaceAlt, borderRadius: "4px", overflow: "hidden", border: "1px solid " + C.border }}>
                <div style={{ height: "100%", width: Math.min((currentMonthSales / (totalYearSales || 1)) * 100 * 12, 100) + "%", background: "linear-gradient(90deg, " + C.primary + ", #e0c4a8)", borderRadius: "4px", transition: "width 0.5s" }} />
              </div>
              <div style={{ fontSize: "10px", color: C.mutedGray, marginTop: "4px" }}>{sales.length} transactions recorded this year</div>
            </div>
            <div>
              <div style={{ fontSize: "10px", color: C.mutedGray, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>Sales by Month</div>
              <div style={{ display: "flex", gap: "4px", alignItems: "flex-end", height: "60px" }}>
                {salesByMonth.map(function(m, i) {
                  var maxSales = Math.max.apply(null, salesByMonth.map(function(x) { return x.sales; }).concat([1]));
                  var h = m.active ? Math.max((m.sales / maxSales) * 52, 4) : 4;
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                      <div style={{ width: "100%", height: h + "px", background: m.active ? C.primary : C.border, borderRadius: "3px 3px 0 0", transition: "height 0.4s" }} />
                      <span style={{ fontSize: "8px", color: m.active ? C.darkGray : C.border, fontWeight: m.active ? 700 : 400 }}>{m.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          <Card style={{ borderLeft: "3px solid " + C.yellow }}>
            <SectionTitle label="Committed Capital" title="IMPORTS" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px", marginBottom: "16px" }}>
              {[
                { label: "In Transit", val: "$" + activeImports.reduce(function(s, i) { return s + (parseFloat(i.total_cost) || 0); }, 0).toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), color: C.yellow },
                { label: "Active Orders", val: String(activeImports.length), color: C.medGray },
                { label: "Received " + currentYear, val: String(imports.filter(function(i) { return i.status === "Received"; }).length), color: C.green },
              ].map(function(k) {
                return (
                  <div key={k.label} style={{ background: C.surfaceAlt, borderRadius: "10px", padding: "10px 12px", border: "1px solid " + C.border }}>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "20px", color: k.color, letterSpacing: "0.04em" }}>{k.val}</div>
                    <div style={{ fontSize: "10px", color: C.mutedGray, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "2px" }}>{k.label}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginBottom: "14px" }}>
              <div style={{ fontSize: "10px", color: C.mutedGray, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>Active Orders</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {activeImports.length === 0 ? (
                  <div style={{ fontSize: "13px", color: C.mutedGray, padding: "12px 0" }}>No active imports.</div>
                ) : activeImports.map(function(imp, i) {
                  var sc = imp.status === "In Customs" ? { color: "#7c3aed", bg: "#ede9fe" } : { color: C.yellow, bg: C.yellowBg };
                  return (
                    <div key={i} style={{ background: C.surfaceAlt, border: "1px solid " + C.border, borderLeft: "3px solid " + sc.color, borderRadius: "8px", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                          <span style={{ fontFamily: "monospace", fontSize: "11px", color: C.medGray }}>#{imp.id}</span>
                          <span style={{ background: sc.bg, color: sc.color, padding: "1px 8px", borderRadius: "20px", fontSize: "10px", fontWeight: 700 }}>{imp.status}</span>
                        </div>
                        <div style={{ fontSize: "12px", fontWeight: 600 }}>{imp.notes || "Import order"}</div>
                        <div style={{ fontSize: "11px", color: C.mutedGray, marginTop: "2px" }}>
                          <span style={{ background: C.darkGray, color: C.primary, padding: "1px 6px", borderRadius: "3px", fontSize: "10px", fontWeight: 700, marginRight: "6px" }}>{imp.supplier || "—"}</span>
                          {imp.date}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "20px", color: C.yellow }}>${(parseFloat(imp.total_cost) || 0).toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div style={{ fontSize: "10px", color: C.mutedGray }}>invested</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ background: C.darkGray, borderRadius: "8px", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", letterSpacing: "0.08em" }}>Total invested in imports {currentYear}</span>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "20px", color: C.primary }}>${imports.reduce(function(s, i) { return s + (parseFloat(i.total_cost) || 0); }, 0).toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </Card>
        </div>

        {/* ── ROW 4: TOP PRODUCTS + PLATFORMS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>

          <Card>
            <SectionTitle label="This Month" title="TOP 5 PRODUCTS" />
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {topProducts.length === 0 ? (
                <div style={{ fontSize: "13px", color: C.mutedGray, padding: "12px 0" }}>No sales recorded this month.</div>
              ) : topProducts.map(function(p, i) {
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "20px", color: i === 0 ? C.primary : C.border, width: "24px", textAlign: "center" }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "180px" }}>{p.name}</span>
                        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "16px", color: C.primary }}>${p.sales.toFixed(2)}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <MiniBar pct={(p.sales / (topProducts[0].sales || 1)) * 100} color={i === 0 ? C.primary : C.border} />
                        <span style={{ fontSize: "10px", color: C.mutedGray, whiteSpace: "nowrap" }}>{p.units} u.</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <SectionTitle label="Sales by Channel" title="PLATFORMS" />
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {platformTotals.filter(function(p) { return p.sales > 0; }).length === 0 ? (
                <div style={{ fontSize: "13px", color: C.mutedGray, padding: "12px 0" }}>No sales data yet.</div>
              ) : platformTotals.map(function(p, i) {
                var colors = [C.primary, C.blue, C.green, C.yellow, "#7c3aed"];
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: colors[i], flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600 }}>{p.name}</span>
                        <div style={{ display: "flex", gap: "10px" }}>
                          <span style={{ fontSize: "12px", color: C.mutedGray }}>{p.pct}%</span>
                          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "16px", color: colors[i] }}>${p.sales.toFixed(2)}</span>
                        </div>
                      </div>
                      <MiniBar pct={p.pct} color={colors[i]} />
                    </div>
                  </div>
                );
              })}
              <div style={{ borderTop: "1px solid " + C.border, paddingTop: "10px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: C.mutedGray }}>Total gross sales</span>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "18px", color: C.primary }}>${currentMonthSales.toLocaleString()}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* ── ROW 5: RECENT SALES + EXPENSES ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

          <Card>
            <SectionTitle label="Today" title="LATEST SALES"
              action={<span onClick={function() { onNavigate("Sales"); }} style={{ fontSize: "11px", color: C.primary, fontWeight: 600, cursor: "pointer" }}>View all →</span>}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {todayDbSales.length === 0 ? (
                <div style={{ fontSize: "13px", color: C.mutedGray, padding: "12px 0" }}>No sales recorded today.</div>
              ) : todayDbSales.slice(0, 8).map(function(s, i) {
                return (
                  <div key={s.id} className="row-hover" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 8px", borderTop: i > 0 ? "1px solid " + C.border : "none", transition: "background 0.1s", borderRadius: "6px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "12px", fontWeight: 600 }}>{s.customer_name || "Client"}</div>
                      <div style={{ fontSize: "11px", color: C.mutedGray }}>{s.platform} · {s.payment_method}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "16px", color: C.primary }}>${(s.total_usd || 0).toFixed(2)}</div>
                    </div>
                    <span style={{
                      background: s.payment_status === "Paid" ? C.greenBg : C.yellowBg,
                      color: s.payment_status === "Paid" ? C.green : C.yellow,
                      border: "1px solid " + (s.payment_status === "Paid" ? C.green : C.yellow),
                      padding: "2px 8px", borderRadius: "20px", fontSize: "10px", fontWeight: 700,
                    }}>{s.payment_status}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <SectionTitle label="Operating Expenses" title="MONTHLY EXPENSES"
              action={
                <button onClick={function() { setShowExpenseForm(function(v) { return !v; }); }} className="btn-ghost" style={{
                  background: "transparent", border: "1px solid " + C.border, color: C.mutedGray,
                  padding: "5px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 600,
                  cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s",
                }}>＋ Add</button>
              }
            />

            {showExpenseForm && (
              <div style={{ background: C.primaryLight, border: "1px solid " + C.primary, borderRadius: "10px", padding: "14px", marginBottom: "14px", animation: "slideIn 0.2s ease" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.mutedGray, marginBottom: "4px" }}>Category</label>
                    <select value={expForm.category} onChange={setE("category")} style={Object.assign({}, iStyle, { appearance: "none" })}>
                      {EXP_CATEGORIES.map(function(c) { return <option key={c}>{c}</option>; })}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.mutedGray, marginBottom: "4px" }}>Amount ($)</label>
                    <input type="number" value={expForm.amount} onChange={setE("amount")} placeholder="0.00" style={iStyle} step="0.01" />
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.mutedGray, marginBottom: "4px" }}>Description</label>
                    <input value={expForm.desc} onChange={setE("desc")} placeholder="Ex: Instagram Ads March" style={iStyle} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.mutedGray, marginBottom: "4px" }}>Date</label>
                    <input type="date" value={expForm.date} onChange={setE("date")} style={iStyle} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "18px" }}>
                    <input type="checkbox" id="recurring" checked={expForm.recurring} onChange={function(e) { setExpForm(function(f) { var n = {}; for (var x in f) n[x] = f[x]; n.recurring = e.target.checked; return n; }); }} style={{ width: "16px", height: "16px", accentColor: C.primary }} />
                    <label htmlFor="recurring" style={{ fontSize: "12px", color: C.medGray, cursor: "pointer" }}>Monthly recurring expense</label>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={saveExpense} className="btn-orange" style={{ background: C.primary, border: "none", color: "#fff", padding: "8px 18px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s" }}>Save Expense</button>
                  <button onClick={function() { setShowExpenseForm(false); }} style={{ background: "transparent", border: "1px solid " + C.border, color: C.mutedGray, padding: "8px 14px", borderRadius: "8px", fontSize: "12px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Cancel</button>
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "0", maxHeight: "300px", overflowY: "auto" }}>
              {expenses.filter(function(e) { return new Date(e.date).getMonth() === currentMonth; }).map(function(e, i) {
                return (
                  <div key={e.id} className="exp-row" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 8px", borderTop: i > 0 ? "1px solid " + C.border : "none", transition: "background 0.1s", borderRadius: "6px" }}>
                    <span style={{ background: C.surfaceAlt, border: "1px solid " + C.border, color: C.medGray, padding: "2px 8px", borderRadius: "20px", fontSize: "10px", fontWeight: 600, whiteSpace: "nowrap" }}>{e.category}</span>
                    <div style={{ flex: 1, fontSize: "12px", color: C.medGray }}>{e.desc}</div>
                    <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "16px", color: C.red, letterSpacing: "0.04em" }}>-${e.amount}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ borderTop: "2px solid " + C.border, marginTop: "10px", paddingTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: C.medGray, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Expenses</span>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "22px", color: C.red, letterSpacing: "0.04em" }}>-${totalOpex.toLocaleString()}</span>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
