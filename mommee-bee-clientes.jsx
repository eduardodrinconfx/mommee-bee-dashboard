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
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 14, padding: 20,
    boxShadow: "0 1px 6px rgba(76,81,85,0.06)", ...style,
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
  background: C.surface, border: `1px solid ${C.border}`,
  borderRadius: 8, padding: "9px 12px", fontSize: 13,
  fontFamily: "'DM Sans', sans-serif", color: C.darkGray,
  outline: "none", width: "100%",
};

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming","International",
];

const EMPTY_FORM = {
  name: "", phone: "", email: "", vz_state: "Florida",
  tipo: "Retail", status: "Active", credit_limit: "0", credit_days: "0", notes: "",
};

function getABC(total) {
  if (total >= 5000) return "A";
  if (total >= 1000) return "B";
  return "C";
}

function daysSince(dateStr) {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr + "T00:00:00")) / 86400000);
}

const ABC_STYLE = {
  A: { color: C.green,  bg: C.greenBg,  label: "🥇 A" },
  B: { color: C.blue,   bg: C.blueBg,   label: "🥈 B" },
  C: { color: C.mutedGray, bg: C.surfaceAlt, label: "🥉 C" },
};

export default function MommeeClientes({ onNavigate, clients, setClients }) {
  const [sales, setSales] = useState([]);
  const [saleItems, setSaleItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("All");
  const [filterStatus, setFilterStatus] = useState("Active");
  const [sortBy, setSortBy] = useState("total");
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [expandedSale, setExpandedSale] = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [cR, sR] = await Promise.all([
      supabase.from("clients").select("*"),
      supabase.from("sales").select("id,customer_name,client_id,total_usd,date,sale_type,platform,payment_method,payment_status"),
    ]);
    if (cR.data) setClients(cR.data);
    if (sR.data) setSales(sR.data);
    setLoading(false);
  }

  function clientSalesOf(client) {
    const cName = (client.name || "").toLowerCase().trim();
    return sales.filter(s => {
      if (s.client_id != null && s.client_id === client.id) return true;
      if (!s.client_id) {
        const sName = (s.customer_name || "").toLowerCase().trim();
        return sName === cName;
      }
      return false;
    });
  }

  function getMetrics(client) {
    const cSales = clientSalesOf(client).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    const total = cSales.reduce((s, x) => s + (parseFloat(x.total_usd) || 0), 0);
    const count = cSales.length;
    const avgTicket = count > 0 ? total / count : 0;
    const lastSale = cSales[0];
    const ds = lastSale ? daysSince(lastSale.date) : null;
    const pendingSales = cSales.filter(s => s.payment_status === "Pending" || s.payment_status === "Partial");
    const pendingTotal = pendingSales.reduce((s, x) => s + (parseFloat(x.total_usd) || 0), 0);
    return { cSales, total, count, avgTicket, lastSale, daysSince: ds, pendingSales, pendingTotal };
  }

  async function selectClient(client) {
    if (selectedClient && selectedClient.id === client.id) {
      setSelectedClient(null); setSaleItems({}); setExpandedSale(null); return;
    }
    setSelectedClient(client); setExpandedSale(null);
    const cSales = clientSalesOf(client);
    if (cSales.length === 0) { setSaleItems({}); return; }
    setLoadingDetail(true);
    const { data: items } = await supabase.from("sale_items")
      .select("sale_id,product_name,quantity,unit_price")
      .in("sale_id", cSales.map(s => s.id));
    const grouped = {};
    (items || []).forEach(it => {
      const key = String(it.sale_id);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(it);
    });
    setSaleItems(grouped);
    setLoadingDetail(false);
  }

  function openModal(client) {
    if (client) {
      setEditClient(client);
      setForm({
        name: client.name || "", phone: client.phone || "",
        email: client.email || "", vz_state: client.vz_state || "Florida",
        tipo: client.tipo || "Retail", status: client.status || "Active",
        credit_limit: String(client.credit_limit || 0),
        credit_days: String(client.credit_days || 0),
        notes: client.notes || "",
      });
    } else {
      setEditClient(null);
      setForm(EMPTY_FORM);
    }
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name) { setMsg("Name is required."); return; }
    setSaving(true); setMsg("");

    const payload = {
      name: form.name, phone: form.phone, email: form.email,
      vz_state: form.vz_state, tipo: form.tipo, status: form.status,
      credit_limit: parseFloat(form.credit_limit) || 0,
      credit_days: parseInt(form.credit_days) || 0,
      notes: form.notes,
      updated_at: new Date().toISOString(),
    };

    if (editClient) {
      const { data, error } = await supabase.from("clients").update(payload).eq("id", editClient.id).select().single();
      if (!error && data) {
        setClients(prev => prev.map(c => c.id === editClient.id ? data : c));
        setSelectedClient(data);
        setMsg("Client updated!");
      } else if (error) { setMsg("Error: " + error.message); }
    } else {
      const { data, error } = await supabase.from("clients").insert({ ...payload, created_at: new Date().toISOString() }).select().single();
      if (!error && data) {
        setClients(prev => [...prev, data]);
        setMsg("Client created!");
      } else if (error) { setMsg("Error: " + error.message); }
    }

    setSaving(false);
    setTimeout(() => { setMsg(""); setShowModal(false); }, 1500);
  }

  // Filtered + sorted clients
  const allClientsWithMetrics = clients.map(c => ({ ...c, metrics: getMetrics(c) }));

  const filtered = allClientsWithMetrics.filter(c => {
    if (filterTipo !== "All" && c.tipo !== filterTipo) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (c.name || "").toLowerCase().includes(q) ||
             (c.phone || "").includes(q) ||
             (c.vz_state || "").toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === "total") return b.metrics.total - a.metrics.total;
    if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
    if (sortBy === "recent") return (b.metrics.lastSale ? b.metrics.lastSale.date : "") > (a.metrics.lastSale ? a.metrics.lastSale.date : "") ? 1 : -1;
    return 0;
  });

  const totalClients = clients.filter(c => c.status === "Active").length;
  const totalRevenue = allClientsWithMetrics.reduce((s, c) => s + c.metrics.total, 0);
  const totalPending = allClientsWithMetrics.reduce((s, c) => s + c.metrics.pendingTotal, 0);
  const classA = allClientsWithMetrics.filter(c => getABC(c.metrics.total) === "A").length;

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: C.primary, letterSpacing: 4 }}>LOADING...</div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", color: C.darkGray }}>
      <style>{`
        @keyframes slideIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .client-row:hover{background:#f8f8f7!important;cursor:pointer}
        .client-row-active{background:rgba(204,159,117,0.08)!important;border-left:3px solid #CC9F75!important}
        .tab-btn:hover{color:#CC9F75!important}
        .btn-orange:hover{background:#b8895f!important;transform:translateY(-1px)}
        .btn-ghost:hover{border-color:#CC9F75!important;color:#CC9F75!important}
      `}</style>
      <div style={{ maxWidth: "1300px", margin: "0 auto" }}>
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: "10px", color: C.primary, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "4px" }}>◆ Database</div>
          <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "34px", letterSpacing: "0.06em", color: C.darkGray, lineHeight: 1, margin: 0 }}>CLIENTS</h1>
          <p style={{ color: C.mutedGray, fontSize: "12px", marginTop: "4px" }}>{clients.length} registered clients</p>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 }}>
        <Card>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: C.primary, fontWeight: 700, marginBottom: 4 }}>Active Clients</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 38, color: C.darkGray }}>{totalClients}</div>
          <div style={{ fontSize: 12, color: C.mutedGray }}>{clients.length} total registered</div>
        </Card>
        <Card>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: C.primary, fontWeight: 700, marginBottom: 4 }}>Total Revenue</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: C.darkGray }}>${totalRevenue.toFixed(0)}</div>
          <div style={{ fontSize: 12, color: C.mutedGray }}>All time</div>
        </Card>
        <Card>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: C.primary, fontWeight: 700, marginBottom: 4 }}>Pending Payments</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: C.red }}>${totalPending.toFixed(0)}</div>
          <div style={{ fontSize: 12, color: C.mutedGray }}>To collect</div>
        </Card>
        <Card>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: C.primary, fontWeight: 700, marginBottom: 4 }}>Class A Clients</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 38, color: C.green }}>{classA}</div>
          <div style={{ fontSize: 12, color: C.mutedGray }}>+$5,000 total</div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selectedClient ? "1fr 380px" : "1fr", gap: 20 }}>
        {/* Client List */}
        <Card>
          <SectionTitle
            label="CRM"
            title={`Clients (${filtered.length})`}
            action={
              <button className="btn-primary" onClick={() => openModal(null)} style={{ background: C.primary, color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                + New Client
              </button>
            }
          />

          {/* Filters */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <input type="text" placeholder="Search name, phone, region..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...iStyle, width: 260 }} />
            <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} style={{ ...iStyle, width: 140 }}>
              <option value="All">All Types</option>
              <option value="Retail">Retail</option>
              <option value="Wholesale">Wholesale</option>
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...iStyle, width: 140 }}>
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...iStyle, width: 150 }}>
              <option value="total">Sort: Revenue</option>
              <option value="name">Sort: Name</option>
              <option value="recent">Sort: Recent</option>
            </select>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  {["Client", "Type", "Region", "Revenue", "Orders", "Pending", "Last Sale", "ABC"].map(h => (
                    <th key={h} style={{ padding: "7px 10px", textAlign: "left", color: C.mutedGray, fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: 24, textAlign: "center", color: C.mutedGray }}>No clients found</td></tr>
                )}
                {filtered.map(c => {
                  const m = c.metrics;
                  const abc = getABC(m.total);
                  const abcS = ABC_STYLE[abc];
                  const isSelected = selectedClient && selectedClient.id === c.id;
                  const hasPending = m.pendingTotal > 0;
                  const creditPct = c.credit_limit > 0 ? Math.min(100, (m.pendingTotal / c.credit_limit) * 100) : 0;
                  return (
                    <tr
                      key={c.id}
                      className="row-hover"
                      onClick={() => selectClient(c)}
                      style={{
                        borderBottom: `1px solid ${C.border}`,
                        background: isSelected ? `${C.primary}08` : "transparent",
                        cursor: "pointer",
                      }}
                    >
                      <td style={{ padding: "10px 10px" }}>
                        <div style={{ fontWeight: 600, color: C.darkGray }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: C.mutedGray }}>{c.phone || "—"}</div>
                      </td>
                      <td style={{ padding: "10px 10px" }}>
                        <span style={{ background: c.tipo === "Wholesale" ? C.purpleBg : C.blueBg, color: c.tipo === "Wholesale" ? C.purple : C.blue, borderRadius: 4, padding: "2px 7px", fontSize: 11, fontWeight: 600 }}>
                          {c.tipo}
                        </span>
                      </td>
                      <td style={{ padding: "10px 10px", color: C.medGray }}>{c.vz_state || "—"}</td>
                      <td style={{ padding: "10px 10px", fontWeight: 700, color: C.darkGray }}>${m.total.toFixed(0)}</td>
                      <td style={{ padding: "10px 10px", color: C.medGray }}>{m.count}</td>
                      <td style={{ padding: "10px 10px" }}>
                        {hasPending
                          ? <span style={{ color: C.yellow, fontWeight: 700 }}>${m.pendingTotal.toFixed(0)}</span>
                          : <span style={{ color: C.green }}>—</span>
                        }
                      </td>
                      <td style={{ padding: "10px 10px", color: C.medGray, whiteSpace: "nowrap" }}>
                        {m.lastSale ? (
                          <span>
                            {m.lastSale.date}
                            {m.daysSince !== null && m.daysSince > 30 && (
                              <span style={{ color: C.red, marginLeft: 4 }}>({m.daysSince}d)</span>
                            )}
                          </span>
                        ) : "—"}
                      </td>
                      <td style={{ padding: "10px 10px" }}>
                        <span style={{ background: abcS.bg, color: abcS.color, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
                          {abcS.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Client Detail Panel */}
        {selectedClient && (
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: C.primary, fontWeight: 700, marginBottom: 4 }}>Client Profile</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: C.darkGray, letterSpacing: 1 }}>{selectedClient.name}</div>
                <div style={{ fontSize: 12, color: C.mutedGray }}>{selectedClient.phone || ""} {selectedClient.email ? "· " + selectedClient.email : ""}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => openModal(selectedClient)} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 7, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Edit</button>
                <button onClick={() => setSelectedClient(null)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: C.mutedGray }}>×</button>
              </div>
            </div>

            {/* Metrics */}
            {(() => {
              const m = getMetrics(selectedClient);
              const abc = getABC(m.total);
              const abcS = ABC_STYLE[abc];
              const creditPct = selectedClient.credit_limit > 0 ? Math.min(100, (m.pendingTotal / selectedClient.credit_limit) * 100) : 0;
              return (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                    {[
                      { label: "Total Revenue", value: `$${m.total.toFixed(2)}`, color: C.darkGray },
                      { label: "Orders", value: m.count, color: C.darkGray },
                      { label: "Avg Ticket", value: `$${m.avgTicket.toFixed(2)}`, color: C.darkGray },
                      { label: "Pending", value: m.pendingTotal > 0 ? `$${m.pendingTotal.toFixed(2)}` : "Clear", color: m.pendingTotal > 0 ? C.yellow : C.green },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ padding: "10px 14px", background: C.surfaceAlt, borderRadius: 8 }}>
                        <div style={{ fontSize: 10, color: C.mutedGray, fontWeight: 600, marginBottom: 2, textTransform: "uppercase" }}>{label}</div>
                        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ background: abcS.bg, color: abcS.color, borderRadius: 6, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>
                      {abcS.label} Client
                    </span>
                    <span style={{ background: selectedClient.tipo === "Wholesale" ? C.purpleBg : C.blueBg, color: selectedClient.tipo === "Wholesale" ? C.purple : C.blue, borderRadius: 6, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>
                      {selectedClient.tipo}
                    </span>
                    <span style={{ fontSize: 12, color: C.medGray }}>{selectedClient.vz_state || "—"}</span>
                  </div>

                  {selectedClient.credit_limit > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.mutedGray, marginBottom: 5 }}>
                        <span>Credit Used</span>
                        <span style={{ color: creditPct > 80 ? C.red : C.darkGray, fontWeight: 700 }}>
                          ${m.pendingTotal.toFixed(0)} / ${selectedClient.credit_limit}
                        </span>
                      </div>
                      <div style={{ background: C.surfaceAlt, borderRadius: 3, height: 6, overflow: "hidden" }}>
                        <div style={{ width: `${creditPct}%`, height: "100%", background: creditPct > 80 ? C.red : C.primary, borderRadius: 3, transition: "width 0.4s ease" }} />
                      </div>
                    </div>
                  )}

                  {/* Purchase history */}
                  <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: C.mutedGray, fontWeight: 600, marginBottom: 10 }}>
                    Purchase History ({m.count})
                  </div>

                  {loadingDetail && <div style={{ color: C.mutedGray, fontSize: 13, textAlign: "center", padding: "12px 0" }}>Loading...</div>}

                  <div style={{ maxHeight: 300, overflowY: "auto" }}>
                    {m.cSales.slice(0, 10).map(s => {
                      const items = saleItems[String(s.id)] || [];
                      const isExp = expandedSale === s.id;
                      const ss = s.payment_status === "Paid"
                        ? { color: C.green, bg: C.greenBg }
                        : s.payment_status === "Pending"
                        ? { color: C.red, bg: C.redBg }
                        : { color: C.yellow, bg: C.yellowBg };
                      return (
                        <div key={s.id} style={{ borderBottom: `1px solid ${C.border}`, marginBottom: 4 }}>
                          <div
                            onClick={() => setExpandedSale(isExp ? null : s.id)}
                            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", cursor: "pointer" }}
                          >
                            <div>
                              <div style={{ fontSize: 12, color: C.darkGray, fontWeight: 500 }}>{s.date} · {s.platform}</div>
                              <div style={{ fontSize: 11, color: C.mutedGray }}>{s.payment_method}</div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: C.darkGray }}>${(parseFloat(s.total_usd) || 0).toFixed(2)}</div>
                              <span style={{ background: ss.bg, color: ss.color, borderRadius: 4, padding: "1px 7px", fontSize: 10, fontWeight: 600 }}>{s.payment_status}</span>
                            </div>
                          </div>
                          {isExp && items.length > 0 && (
                            <div style={{ paddingBottom: 8 }}>
                              {items.map((it, i) => (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "3px 10px", background: C.surfaceAlt, borderRadius: 4, marginBottom: 2 }}>
                                  <span style={{ color: C.medGray }}>{it.product_name}</span>
                                  <span style={{ color: C.darkGray }}>{it.quantity} × ${parseFloat(it.unit_price).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {selectedClient.notes && (
                    <div style={{ marginTop: 12, padding: "10px 14px", background: C.surfaceAlt, borderRadius: 8, fontSize: 12, color: C.medGray }}>
                      <span style={{ fontWeight: 700, color: C.darkGray }}>Notes: </span>{selectedClient.notes}
                    </div>
                  )}
                </>
              );
            })()}
          </Card>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: C.surface, borderRadius: 16, padding: 28, width: 560, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: C.primary, fontWeight: 700, marginBottom: 2 }}>CRM</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: C.darkGray }}>
                  {editClient ? "Edit Client" : "New Client"}
                </div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: C.mutedGray }}>×</button>
            </div>

            {msg && (
              <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 14, background: msg.includes("Error") ? C.redBg : C.greenBg, color: msg.includes("Error") ? C.red : C.green, fontSize: 13, fontWeight: 600 }}>
                {msg}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ fontSize: 11, color: C.mutedGray, fontWeight: 600, display: "block", marginBottom: 4 }}>Full Name *</label>
                  <input type="text" placeholder="e.g. María García" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={iStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: C.mutedGray, fontWeight: 600, display: "block", marginBottom: 4 }}>Phone</label>
                  <input type="text" placeholder="+58 412 000 0000" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={iStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: C.mutedGray, fontWeight: 600, display: "block", marginBottom: 4 }}>Email</label>
                  <input type="email" placeholder="email@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={iStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: C.mutedGray, fontWeight: 600, display: "block", marginBottom: 4 }}>Region</label>
                  <select value={form.vz_state} onChange={e => setForm(f => ({ ...f, vz_state: e.target.value }))} style={iStyle}>
                    {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: C.mutedGray, fontWeight: 600, display: "block", marginBottom: 4 }}>Type</label>
                  <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} style={iStyle}>
                    <option value="Retail">Retail</option>
                    <option value="Wholesale">Wholesale</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: C.mutedGray, fontWeight: 600, display: "block", marginBottom: 4 }}>Credit Limit (USD)</label>
                  <input type="number" min="0" value={form.credit_limit} onChange={e => setForm(f => ({ ...f, credit_limit: e.target.value }))} style={iStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: C.mutedGray, fontWeight: 600, display: "block", marginBottom: 4 }}>Credit Days</label>
                  <input type="number" min="0" value={form.credit_days} onChange={e => setForm(f => ({ ...f, credit_days: e.target.value }))} style={iStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: C.mutedGray, fontWeight: 600, display: "block", marginBottom: 4 }}>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={iStyle}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ fontSize: 11, color: C.mutedGray, fontWeight: 600, display: "block", marginBottom: 4 }}>Notes</label>
                  <input type="text" placeholder="Additional notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={iStyle} />
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={saving} style={{ width: "100%", background: saving ? C.mutedGray : C.primary, color: "white", border: "none", borderRadius: 9, padding: "12px 20px", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                {saving ? "Saving..." : editClient ? "Save Changes" : "Create Client"}
              </button>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
