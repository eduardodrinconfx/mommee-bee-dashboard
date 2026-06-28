import { useState, useEffect } from "react";
import { supabase } from "./src/supabaseClient.js";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from "recharts";

var MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
var PLATFORMS = ["All", "Instagram", "WhatsApp", "Website", "Boutique", "Marketplace"];
var PIE_COLORS = ["var(--accent)", "#D9CCBD", "#CC9F75", "#CEDBE6", "#ff9500", "#34c759", "#007aff", "#af52de"];
var PIE_HEX = ["#CC9F75", "#D9CCBD", "#B36A23", "#CEDBE6", "#ff9500", "#34c759", "#007aff", "#af52de"];

function fmtD(v) { return "$" + v.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
// Parse from "YYYY-MM-DD" directly to avoid UTC timezone shifts at month boundaries
function monthOf(dateStr) { return dateStr ? parseInt(String(dateStr).substring(5, 7), 10) - 1 : -1; }
function yearOf(dateStr) { return dateStr ? parseInt(String(dateStr).substring(0, 4), 10) : -1; }

function CustomTooltip(props) {
  var active = props.active;
  var payload = props.payload;
  var label = props.label;
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "var(--white)", border: "1px solid var(--border)",
        borderRadius: "var(--rs)", padding: "10px 14px", boxShadow: "var(--sh-md)",
        fontFamily: "var(--font)",
      }}>
        <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "4px", letterSpacing: "-0.01em" }}>{label}</div>
        {payload.map(function(entry, i) {
          return (
            <div key={i} style={{ fontSize: "12px", color: entry.color, fontFamily: "var(--mono)" }}>
              {entry.name + ": $" + (entry.value || 0).toFixed(2)}
            </div>
          );
        })}
      </div>
    );
  }
  return null;
}

export default function MommeeReportes(props) {
  var onNavigate = props.onNavigate || function() {};

  var salesState = useState([]);        var sales = salesState[0];           var setSales = salesState[1];
  var siState = useState([]);           var saleItems = siState[0];          var setSaleItems = siState[1];
  var expState = useState([]);          var expenses = expState[0];          var setExpenses = expState[1];
  var prodState = useState([]);         var products = prodState[0];         var setProducts = prodState[1];
  var sponsorsState = useState([]);     var sponsors = sponsorsState[0];     var setSponsors = sponsorsState[1];
  var ticketsState = useState([]);      var tickets = ticketsState[0];       var setTickets = ticketsState[1];
  var loadingState = useState(true);    var loading = loadingState[0];       var setLoading = loadingState[1];

  var year = new Date().getFullYear();
  var fpState = useState("All");        var filterPlatform = fpState[0];     var setFilterPlatform = fpState[1];
  var ftState = useState("All");        var filterType = ftState[0];         var setFilterType = ftState[1];
  var dfState = useState(year + "-01-01"); var dateFrom = dfState[0];        var setDateFrom = dfState[1];
  var dtState = useState(new Date().toISOString().split("T")[0]); var dateTo = dtState[0]; var setDateTo = dtState[1];

  var now = new Date();
  var cm = now.getMonth();
  var cy = now.getFullYear();
  var dateLabel = MONTHS[cm] + " " + (now.getDate() < 10 ? "0" : "") + now.getDate() + ", " + cy;

  useEffect(function() { loadData(); }, []);

  function loadData() {
    setLoading(true);
    var yearStart = year + "-01-01";
    Promise.all([
      supabase.from("sales").select("*").gte("date", yearStart).order("date"),
      supabase.from("sale_items").select("*"),
      supabase.from("expenses").select("*").gte("date", yearStart),
      supabase.from("products").select("id,cost"),
      supabase.from("sponsors").select("*").gte("date", yearStart).order("date"),
      supabase.from("ticket_sales").select("*").gte("date", yearStart).order("date"),
    ]).then(function(results) {
      if (results[0].data) setSales(results[0].data);
      if (results[1].data) setSaleItems(results[1].data);
      if (results[2].data) setExpenses(results[2].data);
      if (results[3].data) setProducts(results[3].data);
      if (results[4].data) setSponsors(results[4].data);
      if (results[5].data) setTickets(results[5].data);
      setLoading(false);
    });
  }

  // Filtered sales
  var filteredSales = sales.filter(function(s) {
    if (s.date < dateFrom || s.date > dateTo) return false;
    if (filterPlatform !== "All" && s.platform !== filterPlatform) return false;
    if (filterType !== "All" && s.sale_type !== filterType) return false;
    return true;
  });

  var filteredExpenses = expenses.filter(function(e) { return e.date >= dateFrom && e.date <= dateTo; });
  var filteredSponsors = sponsors.filter(function(s) { return s.date >= dateFrom && s.date <= dateTo; });
  var filteredTickets = tickets.filter(function(t) { return t.date >= dateFrom && t.date <= dateTo; });

  // Product cost map
  var costMap = {};
  products.forEach(function(p) { costMap[p.id] = parseFloat(p.cost) || 0; });

  // Monthly data for charts
  var monthlyData = MONTHS.map(function(m, idx) {
    var mSales = filteredSales.filter(function(s) { return monthOf(s.date) === idx && yearOf(s.date) === year; });
    var mGross = mSales.reduce(function(sum, s) { return sum + (parseFloat(s.total_usd) || 0); }, 0);
    var mSaleIds = new Set(mSales.map(function(s) { return s.id; }));
    var mItems = saleItems.filter(function(si) { return mSaleIds.has(si.sale_id); });
    var mCOGS = mItems.reduce(function(sum, si) { return sum + si.quantity * (costMap[si.product_id] || 0); }, 0);
    var mExp = filteredExpenses.filter(function(e) { return monthOf(e.date) === idx && yearOf(e.date) === year; });
    var mOPEX = mExp.reduce(function(sum, e) { return sum + (parseFloat(e.amount_usd) || 0); }, 0);
    var mSpon = filteredSponsors.filter(function(s) { return monthOf(s.date) === idx && yearOf(s.date) === year; });
    var mSponsors = mSpon.reduce(function(sum, s) { return sum + (parseFloat(s.amount_usd) || 0); }, 0);
    var mTick = filteredTickets.filter(function(t) { return monthOf(t.date) === idx && yearOf(t.date) === year; });
    var mTickets = mTick.reduce(function(sum, t) { return sum + ((parseInt(t.quantity, 10) || 0) * (parseFloat(t.price_usd) || 0)); }, 0);
    return { month: m, sales: mGross, profit: mGross - mCOGS - mOPEX + mSponsors + mTickets, cogs: mCOGS, opex: mOPEX, sponsors: mSponsors, tickets: mTickets, txns: mSales.length };
  });

  // Platform distribution
  var platformMap = {};
  filteredSales.forEach(function(s) { var plat = s.platform || "Other"; platformMap[plat] = (platformMap[plat] || 0) + (parseFloat(s.total_usd) || 0); });
  var platformData = Object.entries(platformMap).sort(function(a, b) { return b[1] - a[1]; }).map(function(entry) { return { name: entry[0], value: parseFloat(entry[1].toFixed(2)) }; });

  // Top products
  var prodSalesMap = {};
  var filteredSaleIds = new Set(filteredSales.map(function(s) { return s.id; }));
  saleItems.filter(function(si) { return filteredSaleIds.has(si.sale_id); }).forEach(function(si) {
    var key = si.product_name || si.product_code;
    if (!prodSalesMap[key]) prodSalesMap[key] = { revenue: 0, qty: 0 };
    prodSalesMap[key].revenue += parseFloat(si.subtotal) || (si.quantity * parseFloat(si.unit_price));
    prodSalesMap[key].qty += si.quantity;
  });
  var topProducts = Object.entries(prodSalesMap).sort(function(a, b) { return b[1].revenue - a[1].revenue; }).slice(0, 8).map(function(entry) {
    var name = entry[0].length > 20 ? entry[0].substring(0, 20) + "..." : entry[0];
    return { name: name, revenue: parseFloat(entry[1].revenue.toFixed(2)), qty: entry[1].qty };
  });

  // Summary KPIs
  var totalSales = filteredSales.reduce(function(sum, s) { return sum + (parseFloat(s.total_usd) || 0); }, 0);
  var periodItems = saleItems.filter(function(si) { return filteredSaleIds.has(si.sale_id); });
  var totalCOGS = periodItems.reduce(function(sum, si) { return sum + si.quantity * (costMap[si.product_id] || 0); }, 0);
  var totalOPEX = filteredExpenses.reduce(function(sum, e) { return sum + (parseFloat(e.amount_usd) || 0); }, 0);
  var totalSponsors = filteredSponsors.reduce(function(sum, s) { return sum + (parseFloat(s.amount_usd) || 0); }, 0);
  var totalTickets = filteredTickets.reduce(function(sum, t) { return sum + ((parseInt(t.quantity, 10) || 0) * (parseFloat(t.price_usd) || 0)); }, 0);
  var totalProfit = totalSales - totalCOGS - totalOPEX + totalSponsors + totalTickets;
  var avgTicket = filteredSales.length > 0 ? totalSales / filteredSales.length : 0;
  var margin = totalSales > 0 ? ((totalProfit / totalSales) * 100) : 0;

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: "28px", fontWeight: 500, color: "var(--accent)", letterSpacing: "-0.04em", marginBottom: "8px" }}>LOADING</div>
          <div style={{ color: "var(--muted)", fontSize: "13px" }}>Loading reports...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh" }}>

      {/* Header */}
      <div className="hdr">
        <div className="hdr-left">
          <div className="hdr-title">Reportes</div>
          <div className="hdr-date">{dateLabel}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button className="btn" onClick={function() { setDateFrom(year + "-01-01"); setDateTo(new Date().toISOString().split("T")[0]); setFilterPlatform("All"); setFilterType("All"); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "12px", height: "12px" }}>
              <path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
              <path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
            </svg>
            Reset
          </button>
        </div>
      </div>

      <div className="content">

        {/* Filters */}
        <div className="card" style={{ marginBottom: "16px" }}>
          <div className="card-b" style={{ padding: "12px 22px" }}>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
              <div className="form-group">
                <label className="form-label">From</label>
                <input className="form-input" type="date" value={dateFrom} onChange={function(e) { setDateFrom(e.target.value); }} style={{ width: "155px" }} />
              </div>
              <div className="form-group">
                <label className="form-label">To</label>
                <input className="form-input" type="date" value={dateTo} onChange={function(e) { setDateTo(e.target.value); }} style={{ width: "155px" }} />
              </div>
              <div className="form-group">
                <label className="form-label">Platform</label>
                <select className="form-input" value={filterPlatform} onChange={function(e) { setFilterPlatform(e.target.value); }} style={{ width: "155px" }}>
                  {PLATFORMS.map(function(p) { return <option key={p} value={p}>{p}</option>; })}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Sale Type</label>
                <select className="form-input" value={filterType} onChange={function(e) { setFilterType(e.target.value); }} style={{ width: "155px" }}>
                  <option value="All">All Types</option>
                  <option value="Retail">Retail</option>
                  <option value="Wholesale">Wholesale</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "14px", marginBottom: "20px" }}>
          {[
            { label: "Total Ventas", val: "$" + totalSales.toFixed(0), sub: filteredSales.length + " transactions",
              icon: function() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>; } },
            { label: "COGS", val: "$" + totalCOGS.toFixed(0), sub: "Cost of goods", red: true,
              icon: function() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>; } },
            { label: "OPEX", val: "$" + totalOPEX.toFixed(0), sub: (totalSponsors + totalTickets) > 0 ? "Ingresos extra: +$" + (totalSponsors + totalTickets).toFixed(0) : "Expenses", orange: true,
              icon: function() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>; } },
            { label: "Net Profit", val: "$" + totalProfit.toFixed(0), sub: "Margin: " + margin.toFixed(1) + "%", green: totalProfit >= 0, red2: totalProfit < 0,
              icon: function() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>; } },
            { label: "Avg Ticket", val: "$" + avgTicket.toFixed(2), sub: "Per transaction",
              icon: function() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>; } },
          ].map(function(kpi) {
            var color = kpi.red ? "var(--red)" : kpi.orange ? "var(--orange)" : kpi.green ? "var(--green)" : kpi.red2 ? "var(--red)" : "var(--dark)";
            return (
              <div key={kpi.label} className="kpi">
                <div className="kpi-ico">{kpi.icon()}</div>
                <div className="kpi-lbl">{kpi.label}</div>
                <div className="kpi-val" style={{ color: color }}>{kpi.val}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", marginTop: "4px" }}>{kpi.sub}</div>
              </div>
            );
          })}
        </div>

        {/* Charts Row 1: Bar + Pie */}
        <div className="g21">
          <div className="card">
            <div className="card-h">
              <div>
                <div className="card-t">Ventas vs Profit Mensual</div>
                <div className="card-sub">{"Year " + year}</div>
              </div>
            </div>
            <div className="card-b">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,.06)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#86868b", fontFamily: "'JetBrains Mono', monospace" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#86868b", fontFamily: "'JetBrains Mono', monospace" }} tickFormatter={function(v) { return "$" + v; }} />
                  <Tooltip content={CustomTooltip} />
                  <Legend wrapperStyle={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }} />
                  <Bar dataKey="sales" name="Sales" fill="#CC9F75" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" name="Net Profit" fill="#4C5155" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-h">
              <div>
                <div className="card-t">Plataformas</div>
                <div className="card-sub">Distribucion por canal</div>
              </div>
            </div>
            <div className="card-b">
              {platformData.length === 0 && (
                <div style={{ color: "var(--muted)", fontSize: "13px", textAlign: "center", padding: "60px 0" }}>No data for selected period</div>
              )}
              {platformData.length > 0 && (
                <div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={platformData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                        {platformData.map(function(entry, i) { return <Cell key={i} fill={PIE_HEX[i % PIE_HEX.length]} />; })}
                      </Pie>
                      <Tooltip formatter={function(value) { return ["$" + value.toFixed(2), "Revenue"]; }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="donut-leg" style={{ marginTop: "8px" }}>
                    {platformData.map(function(entry, i) {
                      return (
                        <div key={i} className="donut-li">
                          <div className="donut-dot" style={{ background: PIE_HEX[i % PIE_HEX.length] }} />
                          <span className="donut-ll">{entry.name}</span>
                          <span className="donut-lv">{"$" + entry.value.toFixed(0) + " (" + ((entry.value / (totalSales || 1)) * 100).toFixed(0) + "%)"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Charts Row 2: Line + Top Products */}
        <div className="g2">
          <div className="card">
            <div className="card-h">
              <div>
                <div className="card-t">Tendencia</div>
                <div className="card-sub">Sales vs Profit Line</div>
              </div>
            </div>
            <div className="card-b">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,.06)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#86868b", fontFamily: "'JetBrains Mono', monospace" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#86868b", fontFamily: "'JetBrains Mono', monospace" }} tickFormatter={function(v) { return "$" + v; }} />
                  <Tooltip content={CustomTooltip} />
                  <Legend wrapperStyle={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }} />
                  <Line type="monotone" dataKey="sales" name="Sales" stroke="#CC9F75" strokeWidth={2.5} dot={{ fill: "#CC9F75", r: 4 }} />
                  <Line type="monotone" dataKey="profit" name="Net Profit" stroke="#4C5155" strokeWidth={2.5} dot={{ fill: "#4C5155", r: 4 }} strokeDasharray="6 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-h">
              <div>
                <div className="card-t">Top Productos</div>
                <div className="card-sub">By revenue</div>
              </div>
            </div>
            <div className="card-b">
              {topProducts.length === 0 && (
                <div style={{ color: "var(--muted)", fontSize: "13px", textAlign: "center", padding: "60px 0" }}>No product data available</div>
              )}
              {topProducts.length > 0 && (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,.06)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#86868b", fontFamily: "'JetBrains Mono', monospace" }} tickFormatter={function(v) { return "$" + v; }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#4C5155" }} width={110} />
                    <Tooltip formatter={function(value) { return ["$" + value.toFixed(2), "Revenue"]; }} />
                    <Bar dataKey="revenue" name="Revenue" fill="#CC9F75" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* P&L Monthly Table */}
        <div className="card">
          <div className="card-h">
            <div>
              <div className="card-t">P&L Mensual</div>
              <div className="card-sub">{"Financials — " + year}</div>
            </div>
          </div>
          <div className="card-b" style={{ padding: 0 }}>
            <div style={{ overflowX: "auto" }}>
              <table className="dt">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th style={{ textAlign: "right" }}>Gross Sales</th>
                    <th style={{ textAlign: "right" }}>COGS</th>
                    <th style={{ textAlign: "right" }}>Gross Profit</th>
                    <th style={{ textAlign: "right" }}>Margin</th>
                    <th style={{ textAlign: "right" }}>OPEX</th>
                    <th style={{ textAlign: "right" }}>Sponsors</th>
                    <th style={{ textAlign: "right" }}>Entradas</th>
                    <th style={{ textAlign: "right" }}>Net Profit</th>
                    <th style={{ textAlign: "right" }}>Net %</th>
                    <th style={{ textAlign: "right" }}>Txns</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map(function(m, i) {
                    var grossMargin = m.sales > 0 ? (((m.sales - m.cogs) / m.sales) * 100) : 0;
                    var netMargin = m.sales > 0 ? ((m.profit / m.sales) * 100) : 0;
                    var isCurrentMonth = i === new Date().getMonth();
                    return (
                      <tr key={i} style={isCurrentMonth ? { background: "var(--accent-light)" } : {}}>
                        <td style={isCurrentMonth ? { color: "var(--accent)", fontWeight: 600 } : {}}>{m.month}</td>
                        <td className="mono" style={{ textAlign: "right", fontSize: "11px" }}>{"$" + m.sales.toFixed(2)}</td>
                        <td className="mono" style={{ textAlign: "right", fontSize: "11px", color: "var(--red)" }}>{"$" + m.cogs.toFixed(2)}</td>
                        <td className="mono" style={{ textAlign: "right", fontSize: "11px" }}>{"$" + (m.sales - m.cogs).toFixed(2)}</td>
                        <td style={{ textAlign: "right" }}>
                          <span className={"bdg " + (grossMargin >= 40 ? "bdg-gn" : grossMargin >= 20 ? "bdg-or" : "bdg-rd")}>{grossMargin.toFixed(1) + "%"}</span>
                        </td>
                        <td className="mono" style={{ textAlign: "right", fontSize: "11px", color: "var(--orange)" }}>{"$" + m.opex.toFixed(2)}</td>
                        <td className="mono" style={{ textAlign: "right", fontSize: "11px", color: m.sponsors > 0 ? "var(--green)" : "var(--muted)" }}>{m.sponsors > 0 ? "+$" + m.sponsors.toFixed(2) : "—"}</td>
                        <td className="mono" style={{ textAlign: "right", fontSize: "11px", color: m.tickets > 0 ? "var(--green)" : "var(--muted)" }}>{m.tickets > 0 ? "+$" + m.tickets.toFixed(2) : "—"}</td>
                        <td className="mono" style={{ textAlign: "right", fontSize: "11px", fontWeight: 600, color: m.profit >= 0 ? "var(--green)" : "var(--red)" }}>{"$" + m.profit.toFixed(2)}</td>
                        <td style={{ textAlign: "right" }}>
                          <span className={"bdg " + (netMargin >= 15 ? "bdg-gn" : netMargin >= 5 ? "bdg-or" : "bdg-rd")}>{netMargin.toFixed(1) + "%"}</span>
                        </td>
                        <td className="mono" style={{ textAlign: "right", fontSize: "11px", color: "var(--blue)" }}>{m.txns}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: "rgba(0,0,0,.03)", borderTop: "2px solid var(--border)" }}>
                    <td style={{ fontWeight: 700 }}>TOTAL</td>
                    <td className="mono" style={{ textAlign: "right", fontWeight: 600, fontSize: "11px" }}>{"$" + monthlyData.reduce(function(s, m) { return s + m.sales; }, 0).toFixed(2)}</td>
                    <td className="mono" style={{ textAlign: "right", fontWeight: 600, fontSize: "11px", color: "var(--red)" }}>{"$" + monthlyData.reduce(function(s, m) { return s + m.cogs; }, 0).toFixed(2)}</td>
                    <td className="mono" style={{ textAlign: "right", fontWeight: 600, fontSize: "11px" }}>{"$" + monthlyData.reduce(function(s, m) { return s + m.sales - m.cogs; }, 0).toFixed(2)}</td>
                    <td style={{ textAlign: "right", color: "var(--muted)" }}>—</td>
                    <td className="mono" style={{ textAlign: "right", fontWeight: 600, fontSize: "11px", color: "var(--orange)" }}>{"$" + monthlyData.reduce(function(s, m) { return s + m.opex; }, 0).toFixed(2)}</td>
                    <td className="mono" style={{ textAlign: "right", fontWeight: 600, fontSize: "11px", color: "var(--green)" }}>{totalSponsors > 0 ? "+$" + totalSponsors.toFixed(2) : "—"}</td>
                    <td className="mono" style={{ textAlign: "right", fontWeight: 600, fontSize: "11px", color: "var(--green)" }}>{totalTickets > 0 ? "+$" + totalTickets.toFixed(2) : "—"}</td>
                    <td className="mono" style={{ textAlign: "right", fontWeight: 600, fontSize: "11px", color: totalProfit >= 0 ? "var(--green)" : "var(--red)" }}>{"$" + monthlyData.reduce(function(s, m) { return s + m.profit; }, 0).toFixed(2)}</td>
                    <td style={{ textAlign: "right", color: "var(--muted)" }}>—</td>
                    <td className="mono" style={{ textAlign: "right", fontWeight: 600, fontSize: "11px", color: "var(--blue)" }}>{filteredSales.length}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Summary Bar */}
        <div className="summary-bar" style={{ marginTop: "16px" }}>
          <div className="summary-item"><div className="summary-label">Revenue</div><div className="summary-value">{"$" + totalSales.toFixed(0)}</div></div>
          <div className="summary-item"><div className="summary-label">COGS</div><div className="summary-value">{"$" + totalCOGS.toFixed(0)}</div></div>
          <div className="summary-item"><div className="summary-label">OPEX</div><div className="summary-value">{"$" + totalOPEX.toFixed(0)}</div></div>
          {totalSponsors > 0 && <div className="summary-item"><div className="summary-label">Sponsors</div><div className="summary-value" style={{ color: "var(--green)" }}>{"+$" + totalSponsors.toFixed(0)}</div></div>}
          {totalTickets > 0 && <div className="summary-item"><div className="summary-label">Entradas</div><div className="summary-value" style={{ color: "var(--green)" }}>{"+$" + totalTickets.toFixed(0)}</div></div>}
          <div className="summary-spacer" />
          <div className="summary-item"><div className="summary-label">Net Profit</div><div className="summary-value accent">{"$" + totalProfit.toFixed(0)}</div></div>
        </div>

      </div>
    </div>
  );
}
