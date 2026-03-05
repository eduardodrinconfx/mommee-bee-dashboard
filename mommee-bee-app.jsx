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
      <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: C.primary, fontWeight: 700, marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: C.darkGray, letterSpacing: 1 }}>
        {title}
      </div>
    </div>
    {action && action}
  </div>
);

const MiniBar = ({ value, max, color }) => (
  <div style={{ background: C.surfaceAlt, borderRadius: 3, height: 6, overflow: "hidden" }}>
    <div style={{
      width: `${Math.min(100, max > 0 ? (value / max) * 100 : 0)}%`,
      height: "100%",
      background: color || C.primary,
      borderRadius: 3,
      transition: "width 0.4s ease",
    }} />
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

const ANNUAL_GOAL = 60000;
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const EXP_CATEGORIES = ["Advertising","Salaries","Services","Packaging","Transport","Rent","Taxes","Other"];

export default function MommeeBeeApp({ onNavigate, clients, setClients }) {
  const [sales, setSales] = useState([]);
  const [saleItems, setSaleItems] = useState([]);
  const [imports, setImports] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().split("T")[0];
  const [expForm, setExpForm] = useState({ date: todayStr, category: "Other", description: "", amount_usd: "" });
  const [expSaving, setExpSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const year = new Date().getFullYear();
    const yearStart = `${year}-01-01`;

    const [sR, siR, iR, eR, cR, pR] = await Promise.all([
      supabase.from("sales").select("*").gte("date", yearStart).order("date", { ascending: false }),
      supabase.from("sale_items").select("*"),
      supabase.from("imports").select("*").gte("date", yearStart).order("date", { ascending: false }),
      supabase.from("expenses").select("*").gte("date", yearStart).order("date", { ascending: false }),
      supabase.from("clients").select("*"),
      supabase.from("products").select("*"),
    ]);

    if (sR.data) setSales(sR.data);
    if (siR.data) setSaleItems(siR.data);
    if (iR.data) setImports(iR.data);
    if (eR.data) setExpenses(eR.data);
    if (cR.data) setClients(cR.data);
    if (pR.data) setProducts(pR.data);
    setLoading(false);
  }

  async function handleExpSubmit(e) {
    e.preventDefault();
    if (!expForm.amount_usd || parseFloat(expForm.amount_usd) <= 0) return;
    setExpSaving(true);
    const { data, error } = await supabase.from("expenses").insert({
      date: expForm.date,
      category: expForm.category,
      description: expForm.description,
      amount_usd: parseFloat(expForm.amount_usd),
    }).select().single();
    if (!error && data) {
      setExpenses(prev => [data, ...prev]);
      setExpForm({ date: todayStr, category: "Other", description: "", amount_usd: "" });
    }
    setExpSaving(false);
  }

  // ---- Computations ----
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const todaySales = sales.filter(s => s.date === todayStr);
  const todayTotal = todaySales.reduce((sum, s) => sum + (parseFloat(s.total_usd) || 0), 0);
  const todayTxns = todaySales.length;
  const todayAvgTicket = todayTxns > 0 ? todayTotal / todayTxns : 0;

  const paymentMap = {};
  todaySales.forEach(s => {
    const pm = s.payment_method || "Unknown";
    paymentMap[pm] = (paymentMap[pm] || 0) + 1;
  });
  const topPaymentArr = Object.entries(paymentMap).sort((a, b) => b[1] - a[1]);
  const topPayment = topPaymentArr.length > 0 ? topPaymentArr[0][0] : "—";

  const monthSales = sales.filter(s => {
    if (!s.date) return false;
    const d = new Date(s.date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });
  const monthGross = monthSales.reduce((sum, s) => sum + (parseFloat(s.total_usd) || 0), 0);

  const productMap = {};
  products.forEach(p => { productMap[p.id] = p; });

  const monthSaleIds = new Set(monthSales.map(s => s.id));
  const monthItems = saleItems.filter(si => monthSaleIds.has(si.sale_id));
  const monthCOGS = monthItems.reduce((sum, si) => {
    const p = productMap[si.product_id];
    const cost = p ? (parseFloat(p.cost) || 0) : 0;
    return sum + (si.quantity * cost);
  }, 0);

  const monthExpenses = expenses.filter(e => {
    if (!e.date) return false;
    const d = new Date(e.date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });
  const monthOPEX = monthExpenses.reduce((sum, e) => sum + (parseFloat(e.amount_usd) || 0), 0);

  const monthGrossProfit = monthGross - monthCOGS;
  const monthNetProfit = monthGrossProfit - monthOPEX;

  const yearTotal = sales.reduce((sum, s) => sum + (parseFloat(s.total_usd) || 0), 0);
  const goalProgress = Math.min(100, (yearTotal / ANNUAL_GOAL) * 100);

  const platformMap = {};
  monthSales.forEach(s => {
    const plat = s.platform || "Other";
    platformMap[plat] = (platformMap[plat] || 0) + (parseFloat(s.total_usd) || 0);
  });
  const platformArr = Object.entries(platformMap).sort((a, b) => b[1] - a[1]);
  const maxPlatform = platformArr.length > 0 ? platformArr[0][1] : 1;

  const productSalesMap = {};
  monthItems.forEach(si => {
    const key = si.product_code + "|||" + si.product_name;
    if (!productSalesMap[key]) productSalesMap[key] = { revenue: 0, qty: 0 };
    productSalesMap[key].revenue += parseFloat(si.subtotal) || (si.quantity * parseFloat(si.unit_price));
    productSalesMap[key].qty += si.quantity;
  });
  const top5 = Object.entries(productSalesMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)
    .map(([key, val]) => ({
      name: key.split("|||")[1],
      code: key.split("|||")[0],
      revenue: val.revenue,
      qty: val.qty,
    }));
  const maxRevenue = top5.length > 0 ? top5[0].revenue : 1;

  const activeImports = imports.filter(i => i.status !== "Received");
  const activeImportValue = activeImports.reduce((sum, i) => sum + (parseFloat(i.total_cost) || 0), 0);

  const monthlySummary = MONTHS.map((m, idx) => {
    const mSales = sales.filter(s => {
      if (!s.date) return false;
      const d = new Date(s.date);
      return d.getMonth() === idx && d.getFullYear() === thisYear;
    });
    const mTotal = mSales.reduce((sum, s) => sum + (parseFloat(s.total_usd) || 0), 0);
    const mIds = new Set(mSales.map(s => s.id));
    const mItems = saleItems.filter(si => mIds.has(si.sale_id));
    const mCOGS = mItems.reduce((sum, si) => {
      const p = productMap[si.product_id];
      return sum + si.quantity * (p ? parseFloat(p.cost) || 0 : 0);
    }, 0);
    const mExp = expenses.filter(e => {
      if (!e.date) return false;
      const d = new Date(e.date);
      return d.getMonth() === idx && d.getFullYear() === thisYear;
    });
    const mOPEX = mExp.reduce((sum, e) => sum + (parseFloat(e.amount_usd) || 0), 0);
    return { month: m, sales: mTotal, cogs: mCOGS, opex: mOPEX, gross: mTotal - mCOGS, net: mTotal - mCOGS - mOPEX, txns: mSales.length };
  });
  const maxMonthSales = Math.max(...monthlySummary.map(m => m.sales), 1);

  const criticalStock = products.filter(p => p.status === "Active" && p.stock <= p.min_stock);
  const pendingPayments = sales.filter(s => s.payment_status === "Pending" || s.payment_status === "Partial");
  const pendingTotal = pendingPayments.reduce((sum, s) => sum + (parseFloat(s.total_usd) || 0), 0);

  const STATUS_COLORS = { "Ordered": C.blue, "In Transit": C.yellow, "In Customs": C.purple, "Received": C.green };
  const STATUS_ICONS = { "Ordered": "📋", "In Transit": "🚢", "In Customs": "🏛", "Received": "✅" };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: C.primary, letterSpacing: 6, marginBottom: 8 }}>
            LOADING
          </div>
          <div style={{ color: C.mutedGray, fontSize: 13 }}>Connecting to Supabase...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: "slideIn 0.3s ease both" }}>
      {/* PAGE HEADER */}
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 10, color: C.primary, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4 }}>◆ Main Panel</div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 34, letterSpacing: "0.06em", color: C.darkGray, lineHeight: 1, margin: 0 }}>DASHBOARD</h1>
          <p style={{ color: C.mutedGray, fontSize: 12, marginTop: 4 }}>
            {now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <button
          className="btn-ghost"
          onClick={function() { loadData(); }}
          style={{ background: "none", border: "1px solid " + C.border, borderRadius: 8, padding: "8px 14px", fontSize: 12, color: C.medGray, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "'DM Sans', sans-serif" }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* ROW 1 — Today KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
        <Card>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: C.primary, fontWeight: 700, marginBottom: 4 }}>Today Sales</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 38, color: C.darkGray, letterSpacing: 1 }}>${todayTotal.toFixed(2)}</div>
          <div style={{ fontSize: 12, color: C.mutedGray }}>{now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</div>
        </Card>
        <Card>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: C.primary, fontWeight: 700, marginBottom: 4 }}>Transactions</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 38, color: C.darkGray, letterSpacing: 1 }}>{todayTxns}</div>
          <div style={{ fontSize: 12, color: C.mutedGray }}>Sales processed today</div>
        </Card>
        <Card>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: C.primary, fontWeight: 700, marginBottom: 4 }}>Avg Ticket</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 38, color: C.darkGray, letterSpacing: 1 }}>${todayAvgTicket.toFixed(2)}</div>
          <div style={{ fontSize: 12, color: C.mutedGray }}>Per transaction</div>
        </Card>
        <Card>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: C.primary, fontWeight: 700, marginBottom: 4 }}>Top Payment</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, color: C.darkGray, letterSpacing: 1, lineHeight: 1.2 }}>{topPayment}</div>
          <div style={{ fontSize: 12, color: C.mutedGray, marginTop: 6 }}>Most used today</div>
        </Card>
      </div>

      {/* ROW 2 — Month KPIs + P&L */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <Card>
          <SectionTitle label={`${MONTHS[thisMonth]} ${thisYear}`} title="Monthly Performance" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: C.mutedGray, marginBottom: 4 }}>Gross Sales</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 30, color: C.darkGray }}>${monthGross.toFixed(0)}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: C.mutedGray, marginBottom: 4 }}>Net Profit</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 30, color: monthNetProfit >= 0 ? C.green : C.red }}>
                ${monthNetProfit.toFixed(0)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: C.mutedGray, marginBottom: 4 }}>Annual Goal</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 30, color: C.darkGray }}>{goalProgress.toFixed(0)}%</div>
            </div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.mutedGray, marginBottom: 6 }}>
              <span>Annual Progress (${ANNUAL_GOAL.toLocaleString()} goal)</span>
              <span style={{ fontWeight: 700, color: C.primary }}>${yearTotal.toFixed(0)}</span>
            </div>
            <MiniBar value={yearTotal} max={ANNUAL_GOAL} color={C.primary} />
          </div>
        </Card>

        <Card>
          <SectionTitle label="Income Statement" title="P & L — This Month" />
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <tbody>
              {[
                { label: "Gross Sales", value: monthGross, indent: 0, bold: false, sub: false },
                { label: "Discounts", value: 0, indent: 1, bold: false, sub: true },
                { label: "Net Sales", value: monthGross, indent: 0, bold: true, sub: false },
                { label: "Cost of Goods (COGS)", value: monthCOGS, indent: 1, bold: false, sub: true },
                { label: "Gross Profit", value: monthGrossProfit, indent: 0, bold: true, sub: false, colored: true },
                { label: "Operating Expenses (OPEX)", value: monthOPEX, indent: 1, bold: false, sub: true },
                { label: "Net Profit", value: monthNetProfit, indent: 0, bold: true, sub: false, colored: true, large: true },
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{
                    padding: "7px 0",
                    paddingLeft: row.indent * 16,
                    color: row.colored ? (row.value >= 0 ? C.green : C.red) : (row.sub ? C.medGray : C.darkGray),
                    fontWeight: row.bold ? 700 : 400,
                    fontSize: row.large ? 14 : 13,
                  }}>
                    {row.sub && <span style={{ color: C.mutedGray, marginRight: 4 }}>−</span>}
                    {row.label}
                  </td>
                  <td style={{
                    textAlign: "right",
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: row.large ? 20 : 15,
                    color: row.colored ? (row.value >= 0 ? C.green : C.red) : C.darkGray,
                  }}>
                    ${Math.abs(row.value).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* ROW 3 — Platform Performance + Top Products */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <Card>
          <SectionTitle label="Sales Channels" title="Platform Performance" />
          {platformArr.length === 0 && (
            <div style={{ color: C.mutedGray, fontSize: 13, textAlign: "center", padding: "24px 0" }}>No sales this month yet</div>
          )}
          {platformArr.map(([plat, total]) => (
            <div key={plat} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                <span style={{ color: C.medGray, fontWeight: 500 }}>{plat}</span>
                <span style={{ color: C.darkGray, fontWeight: 700 }}>
                  ${total.toFixed(2)}
                  <span style={{ color: C.mutedGray, fontWeight: 400, marginLeft: 6 }}>
                    ({((total / (monthGross || 1)) * 100).toFixed(0)}%)
                  </span>
                </span>
              </div>
              <MiniBar value={total} max={maxPlatform} color={C.primary} />
            </div>
          ))}
        </Card>

        <Card>
          <SectionTitle label="This Month" title="Top 5 Products" />
          {top5.length === 0 && (
            <div style={{ color: C.mutedGray, fontSize: 13, textAlign: "center", padding: "24px 0" }}>No sales data available</div>
          )}
          {top5.map((p, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                <span style={{ color: C.medGray }}>
                  <span style={{ color: C.primary, fontWeight: 700, marginRight: 8, fontFamily: "'Bebas Neue', sans-serif", fontSize: 16 }}>#{i + 1}</span>
                  {p.name}
                </span>
                <span style={{ color: C.darkGray, fontWeight: 700 }}>${p.revenue.toFixed(2)}</span>
              </div>
              <MiniBar value={p.revenue} max={maxRevenue} color={i === 0 ? C.primary : C.lightAmber} />
              <div style={{ fontSize: 10, color: C.mutedGray, marginTop: 3 }}>{p.qty} units sold</div>
            </div>
          ))}
        </Card>
      </div>

      {/* ROW 4 — Annual Summary */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle label={`Full Year ${thisYear}`} title="Annual Summary" />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", minWidth: 860 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                {["Month", "Gross Sales", "COGS", "Gross Profit", "OPEX", "Net Profit", "Txns", "Progress"].map(h => (
                  <th key={h} style={{
                    padding: "8px 8px",
                    textAlign: h === "Month" ? "left" : "right",
                    color: C.mutedGray,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    fontSize: 10,
                    letterSpacing: 0.8,
                    whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthlySummary.map((m, i) => (
                <tr key={i} style={{
                  borderBottom: `1px solid ${C.border}`,
                  background: i === thisMonth ? `${C.primary}08` : "transparent",
                }}>
                  <td style={{ padding: "9px 8px", color: i === thisMonth ? C.primary : C.darkGray, fontWeight: i === thisMonth ? 700 : 400 }}>{m.month}</td>
                  <td style={{ textAlign: "right", padding: "9px 8px", color: C.darkGray }}>${m.sales.toFixed(0)}</td>
                  <td style={{ textAlign: "right", padding: "9px 8px", color: C.red }}>${m.cogs.toFixed(0)}</td>
                  <td style={{ textAlign: "right", padding: "9px 8px", color: m.gross >= 0 ? C.darkGray : C.red }}>${m.gross.toFixed(0)}</td>
                  <td style={{ textAlign: "right", padding: "9px 8px", color: C.yellow }}>${m.opex.toFixed(0)}</td>
                  <td style={{ textAlign: "right", padding: "9px 8px", fontWeight: 700, color: m.net >= 0 ? C.green : C.red }}>${m.net.toFixed(0)}</td>
                  <td style={{ textAlign: "right", padding: "9px 8px", color: C.blue }}>{m.txns}</td>
                  <td style={{ padding: "9px 8px", minWidth: 100 }}>
                    <MiniBar value={m.sales} max={maxMonthSales} color={i === thisMonth ? C.primary : C.beige} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ROW 5 — Active Imports + Alerts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <Card>
          <SectionTitle
            label="Logistics"
            title="Active Imports"
            action={
              <button onClick={() => onNavigate("Imports")} style={{ fontSize: 12, color: C.primary, background: "transparent", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                View All →
              </button>
            }
          />
          {activeImports.length === 0 && (
            <div style={{ color: C.mutedGray, fontSize: 13, textAlign: "center", padding: "24px 0" }}>No active imports</div>
          )}
          {activeImports.slice(0, 5).map(imp => {
            const color = STATUS_COLORS[imp.status] || C.mutedGray;
            return (
              <div key={imp.id} style={{ padding: "10px 0", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, color: C.darkGray, fontWeight: 500 }}>{imp.supplier || "—"}</div>
                  <div style={{ fontSize: 11, color: C.mutedGray }}>{imp.invoice_number || "No invoice"} · {imp.origin || "—"} · {imp.date}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color, fontWeight: 600 }}>{STATUS_ICONS[imp.status] || ""} {imp.status}</div>
                  <div style={{ fontSize: 13, color: C.darkGray, fontWeight: 700 }}>${(parseFloat(imp.total_cost) || 0).toFixed(2)}</div>
                </div>
              </div>
            );
          })}
          {activeImports.length > 0 && (
            <div style={{ marginTop: 14, padding: "10px 14px", background: `${C.primary}10`, borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: C.medGray }}>{activeImports.length} active · Total investment</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.primary }}>${activeImportValue.toFixed(2)}</span>
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle label="System" title="Alerts" />
          {criticalStock.length === 0 && pendingPayments.length === 0 && (
            <div style={{ color: C.green, fontSize: 13, textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
              All systems normal
            </div>
          )}
          {criticalStock.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", color: C.red, fontWeight: 700, marginBottom: 8 }}>
                Critical Stock ({criticalStock.length} products)
              </div>
              {criticalStock.slice(0, 4).map(p => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 12px", background: C.redBg, borderRadius: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: C.darkGray }}>{p.name}</span>
                  <span style={{ fontSize: 12, color: C.red, fontWeight: 700 }}>Stock: {p.stock} / Min: {p.min_stock}</span>
                </div>
              ))}
              {criticalStock.length > 4 && (
                <div style={{ fontSize: 11, color: C.red, textAlign: "right", marginTop: 4 }}>+{criticalStock.length - 4} more</div>
              )}
            </div>
          )}
          {pendingPayments.length > 0 && (
            <div>
              <div style={{ fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", color: C.yellow, fontWeight: 700, marginBottom: 8 }}>
                Pending Payments ({pendingPayments.length})
              </div>
              {pendingPayments.slice(0, 3).map(s => (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 12px", background: C.yellowBg, borderRadius: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: C.darkGray }}>{s.customer_name || "Client"} · {s.date}</span>
                  <span style={{ fontSize: 12, color: C.yellow, fontWeight: 700 }}>${(parseFloat(s.total_usd) || 0).toFixed(2)}</span>
                </div>
              ))}
              <div style={{ fontSize: 12, color: C.medGray, marginTop: 8, textAlign: "right" }}>
                Total pending: <strong style={{ color: C.yellow }}>${pendingTotal.toFixed(2)}</strong>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ROW 6 — Recent Sales Today + Expense Form */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <Card>
          <SectionTitle
            label="Today"
            title="Recent Sales"
            action={
              <button onClick={() => onNavigate("Sales")} style={{ fontSize: 12, background: C.primary, color: "white", border: "none", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                + New Sale
              </button>
            }
          />
          {todaySales.length === 0 && (
            <div style={{ color: C.mutedGray, fontSize: 13, textAlign: "center", padding: "24px 0" }}>No sales recorded today</div>
          )}
          {todaySales.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                    {["#", "Customer", "Platform", "Payment", "Status", "Total"].map(h => (
                      <th key={h} style={{ padding: "6px 8px", textAlign: "left", color: C.mutedGray, fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {todaySales.slice(0, 10).map(s => {
                    const ss = s.payment_status === "Paid" ? { color: C.green, bg: C.greenBg } :
                               s.payment_status === "Pending" ? { color: C.red, bg: C.redBg } :
                               { color: C.yellow, bg: C.yellowBg };
                    return (
                      <tr key={s.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: "9px 8px", color: C.mutedGray, fontSize: 11 }}>#{s.id}</td>
                        <td style={{ padding: "9px 8px", color: C.darkGray, fontWeight: 500 }}>{s.customer_name || "—"}</td>
                        <td style={{ padding: "9px 8px", color: C.medGray }}>{s.platform}</td>
                        <td style={{ padding: "9px 8px", color: C.medGray }}>{s.payment_method}</td>
                        <td style={{ padding: "9px 8px" }}>
                          <span style={{ background: ss.bg, color: ss.color, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>
                            {s.payment_status}
                          </span>
                        </td>
                        <td style={{ padding: "9px 8px", color: C.darkGray, fontWeight: 700 }}>${(parseFloat(s.total_usd) || 0).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle label="Operations" title="Log Expense" />
          <form onSubmit={handleExpSubmit}>
            <div style={{ display: "grid", gap: 10 }}>
              <input
                type="date"
                value={expForm.date}
                onChange={e => setExpForm(f => ({ ...f, date: e.target.value }))}
                style={iStyle}
              />
              <select
                value={expForm.category}
                onChange={e => setExpForm(f => ({ ...f, category: e.target.value }))}
                style={iStyle}
              >
                {EXP_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                type="text"
                placeholder="Description (optional)"
                value={expForm.description}
                onChange={e => setExpForm(f => ({ ...f, description: e.target.value }))}
                style={iStyle}
              />
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Amount (USD)"
                value={expForm.amount_usd}
                onChange={e => setExpForm(f => ({ ...f, amount_usd: e.target.value }))}
                style={iStyle}
              />
              <button
                type="submit"
                disabled={expSaving}
                style={{
                  background: expSaving ? C.mutedGray : C.primary,
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: expSaving ? "not-allowed" : "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {expSaving ? "Saving..." : "Log Expense"}
              </button>
            </div>
          </form>

          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: C.mutedGray, marginBottom: 10 }}>
              Recent Expenses · {MONTHS[thisMonth]}
            </div>
            {monthExpenses.slice(0, 5).map(e => (
              <div key={e.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ color: C.medGray }}>
                  <span style={{ fontWeight: 600, color: C.darkGray }}>{e.category}</span>
                  {e.description ? ` · ${e.description}` : ""}
                </span>
                <span style={{ color: C.red, fontWeight: 600 }}>−${(parseFloat(e.amount_usd) || 0).toFixed(2)}</span>
              </div>
            ))}
            {monthExpenses.length === 0 && (
              <div style={{ color: C.mutedGray, fontSize: 12 }}>No expenses this month</div>
            )}
            <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: C.darkGray, textAlign: "right" }}>
              Total OPEX: <span style={{ color: C.red }}>${monthOPEX.toFixed(2)}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
