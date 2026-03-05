import { useState, useEffect } from "react";
import { supabase } from "./src/supabaseClient.js";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from "recharts";

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

const PIE_COLORS = [C.primary, C.beige, C.primary, C.beige, C.lightBlue, C.yellow, C.green, C.blue];

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

const SectionTitle = ({ label, title }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: C.primary, fontWeight: 700, marginBottom: 2 }}>{label}</div>
    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: C.darkGray, letterSpacing: 1 }}>{title}</div>
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
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const PLATFORMS = ["All", "Instagram", "WhatsApp", "Website", "Boutique", "Marketplace"];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.darkGray, marginBottom: 4 }}>{label}</div>
        {payload.map((entry, i) => (
          <div key={i} style={{ fontSize: 12, color: entry.color }}>
            {entry.name}: <strong>${(entry.value || 0).toFixed(2)}</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function MommeeReportes({ onNavigate }) {
  const [sales, setSales] = useState([]);
  const [saleItems, setSaleItems] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const year = new Date().getFullYear();
  const [filterPlatform, setFilterPlatform] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [dateFrom, setDateFrom] = useState(`${year}-01-01`);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const yearStart = `${year}-01-01`;
    const [sR, siR, eR, pR] = await Promise.all([
      supabase.from("sales").select("*").gte("date", yearStart).order("date"),
      supabase.from("sale_items").select("*"),
      supabase.from("expenses").select("*").gte("date", yearStart),
      supabase.from("products").select("id,cost"),
    ]);
    if (sR.data) setSales(sR.data);
    if (siR.data) setSaleItems(siR.data);
    if (eR.data) setExpenses(eR.data);
    if (pR.data) setProducts(pR.data);
    setLoading(false);
  }

  // Filtered sales
  const filteredSales = sales.filter(s => {
    if (s.date < dateFrom || s.date > dateTo) return false;
    if (filterPlatform !== "All" && s.platform !== filterPlatform) return false;
    if (filterType !== "All" && s.sale_type !== filterType) return false;
    return true;
  });

  const filteredExpenses = expenses.filter(e => e.date >= dateFrom && e.date <= dateTo);

  // Product cost map
  const costMap = {};
  products.forEach(p => { costMap[p.id] = parseFloat(p.cost) || 0; });

  // Monthly data for charts
  const monthlyData = MONTHS.map((m, idx) => {
    const mSales = filteredSales.filter(s => {
      const d = new Date(s.date);
      return d.getMonth() === idx && d.getFullYear() === year;
    });
    const mGross = mSales.reduce((sum, s) => sum + (parseFloat(s.total_usd) || 0), 0);

    const mSaleIds = new Set(mSales.map(s => s.id));
    const mItems = saleItems.filter(si => mSaleIds.has(si.sale_id));
    const mCOGS = mItems.reduce((sum, si) => {
      const cost = costMap[si.product_id] || 0;
      return sum + si.quantity * cost;
    }, 0);

    const mExp = filteredExpenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === idx && d.getFullYear() === year;
    });
    const mOPEX = mExp.reduce((sum, e) => sum + (parseFloat(e.amount_usd) || 0), 0);

    const mProfit = mGross - mCOGS - mOPEX;

    return { month: m, sales: mGross, profit: mProfit, cogs: mCOGS, opex: mOPEX, txns: mSales.length };
  });

  // Platform distribution
  const platformMap = {};
  filteredSales.forEach(s => {
    const plat = s.platform || "Other";
    platformMap[plat] = (platformMap[plat] || 0) + (parseFloat(s.total_usd) || 0);
  });
  const platformData = Object.entries(platformMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }));

  // Top products
  const prodSalesMap = {};
  const filteredSaleIds = new Set(filteredSales.map(s => s.id));
  saleItems.filter(si => filteredSaleIds.has(si.sale_id)).forEach(si => {
    const key = si.product_name || si.product_code;
    if (!prodSalesMap[key]) prodSalesMap[key] = { revenue: 0, qty: 0 };
    prodSalesMap[key].revenue += parseFloat(si.subtotal) || (si.quantity * parseFloat(si.unit_price));
    prodSalesMap[key].qty += si.quantity;
  });
  const topProducts = Object.entries(prodSalesMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 8)
    .map(([name, val]) => ({ name: name.length > 20 ? name.substring(0, 20) + "…" : name, revenue: parseFloat(val.revenue.toFixed(2)), qty: val.qty }));

  // Summary KPIs for filtered period
  const totalSales = filteredSales.reduce((sum, s) => sum + (parseFloat(s.total_usd) || 0), 0);
  const filteredSaleIdsArr = Array.from(filteredSaleIds);
  const periodItems = saleItems.filter(si => filteredSaleIds.has(si.sale_id));
  const totalCOGS = periodItems.reduce((sum, si) => sum + si.quantity * (costMap[si.product_id] || 0), 0);
  const totalOPEX = filteredExpenses.reduce((sum, e) => sum + (parseFloat(e.amount_usd) || 0), 0);
  const totalProfit = totalSales - totalCOGS - totalOPEX;
  const avgTicket = filteredSales.length > 0 ? totalSales / filteredSales.length : 0;
  const margin = totalSales > 0 ? ((totalProfit / totalSales) * 100) : 0;

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: C.primary, letterSpacing: 4 }}>LOADING...</div>
      </div>
    );
  }

  return (
    <div style={{ animation: "slideIn 0.3s ease both" }}>
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, color: C.primary, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4 }}>◆ Analytics</div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 34, letterSpacing: "0.06em", color: C.darkGray, lineHeight: 1, margin: 0 }}>REPORTS</h1>
        <p style={{ color: C.mutedGray, fontSize: 12, marginTop: 4 }}>Data analytics and performance metrics</p>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <label style={{ fontSize: 10, color: C.mutedGray, fontWeight: 600, display: "block", marginBottom: 4, textTransform: "uppercase" }}>From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ ...iStyle, width: 160 }} />
          </div>
          <div>
            <label style={{ fontSize: 10, color: C.mutedGray, fontWeight: 600, display: "block", marginBottom: 4, textTransform: "uppercase" }}>To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ ...iStyle, width: 160 }} />
          </div>
          <div>
            <label style={{ fontSize: 10, color: C.mutedGray, fontWeight: 600, display: "block", marginBottom: 4, textTransform: "uppercase" }}>Platform</label>
            <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)} style={{ ...iStyle, width: 160 }}>
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 10, color: C.mutedGray, fontWeight: 600, display: "block", marginBottom: 4, textTransform: "uppercase" }}>Sale Type</label>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ ...iStyle, width: 160 }}>
              <option value="All">All Types</option>
              <option value="Retail">Retail</option>
              <option value="Wholesale">Wholesale</option>
            </select>
          </div>
          <button
            onClick={() => { setDateFrom(`${year}-01-01`); setDateTo(new Date().toISOString().split("T")[0]); setFilterPlatform("All"); setFilterType("All"); }}
            style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 14px", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", color: C.medGray, marginTop: 18 }}
          >
            Reset
          </button>
        </div>
      </Card>

      {/* Summary KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginBottom: 20 }}>
        <Card>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: C.primary, fontWeight: 700, marginBottom: 4 }}>Total Sales</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 30, color: C.darkGray }}>${totalSales.toFixed(0)}</div>
          <div style={{ fontSize: 11, color: C.mutedGray }}>{filteredSales.length} transactions</div>
        </Card>
        <Card>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: C.primary, fontWeight: 700, marginBottom: 4 }}>COGS</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 30, color: C.red }}>${totalCOGS.toFixed(0)}</div>
          <div style={{ fontSize: 11, color: C.mutedGray }}>Cost of goods</div>
        </Card>
        <Card>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: C.primary, fontWeight: 700, marginBottom: 4 }}>OPEX</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 30, color: C.yellow }}>${totalOPEX.toFixed(0)}</div>
          <div style={{ fontSize: 11, color: C.mutedGray }}>Expenses</div>
        </Card>
        <Card>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: C.primary, fontWeight: 700, marginBottom: 4 }}>Net Profit</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 30, color: totalProfit >= 0 ? C.green : C.red }}>${totalProfit.toFixed(0)}</div>
          <div style={{ fontSize: 11, color: C.mutedGray }}>Margin: {margin.toFixed(1)}%</div>
        </Card>
        <Card>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: C.primary, fontWeight: 700, marginBottom: 4 }}>Avg Ticket</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 30, color: C.darkGray }}>${avgTicket.toFixed(2)}</div>
          <div style={{ fontSize: 11, color: C.mutedGray }}>Per transaction</div>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 20 }}>
        <Card>
          <SectionTitle label={`Year ${year}`} title="Monthly Sales vs Profit" />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.mutedGray }} />
              <YAxis tick={{ fontSize: 11, fill: C.mutedGray }} tickFormatter={v => `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="sales" name="Sales" fill={C.primary} radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name="Net Profit" fill={C.dark} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle label="Channels" title="By Platform" />
          {platformData.length === 0 && (
            <div style={{ color: C.mutedGray, fontSize: 13, textAlign: "center", paddingTop: 80 }}>No data for selected period</div>
          )}
          {platformData.length > 0 && (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={platformData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {platformData.map((entry, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, "Revenue"]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 8 }}>
                {platformData.map((entry, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span style={{ fontSize: 12, color: C.medGray }}>{entry.name}</span>
                    </div>
                    <div style={{ fontSize: 12 }}>
                      <span style={{ fontWeight: 700, color: C.darkGray }}>${entry.value.toFixed(0)}</span>
                      <span style={{ color: C.mutedGray, marginLeft: 6 }}>({((entry.value / (totalSales || 1)) * 100).toFixed(0)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <Card>
          <SectionTitle label="Trend" title="Sales vs Profit Line" />
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.mutedGray }} />
              <YAxis tick={{ fontSize: 11, fill: C.mutedGray }} tickFormatter={v => `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="sales" name="Sales" stroke={C.primary} strokeWidth={2.5} dot={{ fill: C.primary, r: 4 }} />
              <Line type="monotone" dataKey="profit" name="Net Profit" stroke={C.dark} strokeWidth={2.5} dot={{ fill: C.dark, r: 4 }} strokeDasharray="6 3" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle label="Products" title="Top Sellers" />
          {topProducts.length === 0 && (
            <div style={{ color: C.mutedGray, fontSize: 13, textAlign: "center", paddingTop: 80 }}>No product data available</div>
          )}
          {topProducts.length > 0 && (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: C.mutedGray }} tickFormatter={v => `$${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: C.medGray }} width={110} />
                <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, "Revenue"]} />
                <Bar dataKey="revenue" name="Revenue" fill={C.primary} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* P&L Monthly Table */}
      <Card>
        <SectionTitle label="Financials" title={`Monthly P&L — ${year}`} />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                {["Month", "Gross Sales", "COGS", "Gross Profit", "Gross Margin", "OPEX", "Net Profit", "Net Margin", "Txns"].map(h => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: h === "Month" ? "left" : "right", color: C.mutedGray, fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((m, i) => {
                const grossMargin = m.sales > 0 ? (((m.sales - m.cogs) / m.sales) * 100) : 0;
                const netMargin = m.sales > 0 ? ((m.profit / m.sales) * 100) : 0;
                const isCurrentMonth = i === new Date().getMonth();
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: isCurrentMonth ? `${C.primary}08` : "transparent" }}>
                    <td style={{ padding: "9px 10px", color: isCurrentMonth ? C.primary : C.darkGray, fontWeight: isCurrentMonth ? 700 : 400 }}>{m.month}</td>
                    <td style={{ textAlign: "right", padding: "9px 10px", color: C.darkGray }}>${m.sales.toFixed(2)}</td>
                    <td style={{ textAlign: "right", padding: "9px 10px", color: C.red }}>${m.cogs.toFixed(2)}</td>
                    <td style={{ textAlign: "right", padding: "9px 10px", color: C.darkGray }}>${(m.sales - m.cogs).toFixed(2)}</td>
                    <td style={{ textAlign: "right", padding: "9px 10px", color: grossMargin >= 40 ? C.green : grossMargin >= 20 ? C.yellow : C.red }}>{grossMargin.toFixed(1)}%</td>
                    <td style={{ textAlign: "right", padding: "9px 10px", color: C.yellow }}>${m.opex.toFixed(2)}</td>
                    <td style={{ textAlign: "right", padding: "9px 10px", fontWeight: 700, color: m.profit >= 0 ? C.green : C.red }}>${m.profit.toFixed(2)}</td>
                    <td style={{ textAlign: "right", padding: "9px 10px", color: netMargin >= 15 ? C.green : netMargin >= 5 ? C.yellow : C.red }}>{netMargin.toFixed(1)}%</td>
                    <td style={{ textAlign: "right", padding: "9px 10px", color: C.blue }}>{m.txns}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: `2px solid ${C.border}`, background: C.surfaceAlt }}>
                <td style={{ padding: "10px 10px", fontWeight: 700, color: C.darkGray }}>TOTAL</td>
                <td style={{ textAlign: "right", padding: "10px 10px", fontWeight: 700, color: C.darkGray }}>${monthlyData.reduce((s, m) => s + m.sales, 0).toFixed(2)}</td>
                <td style={{ textAlign: "right", padding: "10px 10px", fontWeight: 700, color: C.red }}>${monthlyData.reduce((s, m) => s + m.cogs, 0).toFixed(2)}</td>
                <td style={{ textAlign: "right", padding: "10px 10px", fontWeight: 700, color: C.darkGray }}>${monthlyData.reduce((s, m) => s + m.sales - m.cogs, 0).toFixed(2)}</td>
                <td style={{ textAlign: "right", padding: "10px 10px", color: C.mutedGray }}>—</td>
                <td style={{ textAlign: "right", padding: "10px 10px", fontWeight: 700, color: C.yellow }}>${monthlyData.reduce((s, m) => s + m.opex, 0).toFixed(2)}</td>
                <td style={{ textAlign: "right", padding: "10px 10px", fontWeight: 700, color: totalProfit >= 0 ? C.green : C.red }}>${monthlyData.reduce((s, m) => s + m.profit, 0).toFixed(2)}</td>
                <td style={{ textAlign: "right", padding: "10px 10px", color: C.mutedGray }}>—</td>
                <td style={{ textAlign: "right", padding: "10px 10px", fontWeight: 700, color: C.blue }}>{filteredSales.length}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
