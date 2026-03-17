import { useState, useEffect } from "react";
import { supabase } from "./src/supabaseClient.js";

var MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

var US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming","International",
];

var EMPTY_FORM = {
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

function setFormField(setForm, key) {
  return function(e) {
    setForm(function(f) { var n = {}; for (var k in f) n[k] = f[k]; n[key] = e.target.value; return n; });
  };
}

export default function MommeeClientes(props) {
  var onNavigate = props.onNavigate || function() {};
  var clients = props.clients || [];
  var setClients = props.setClients || function() {};

  var salesState = useState([]);          var sales = salesState[0];            var setSales = salesState[1];
  var siState = useState({});             var saleItems = siState[0];           var setSaleItems = siState[1];
  var loadingState = useState(true);      var loading = loadingState[0];        var setLoading = loadingState[1];
  var searchState = useState("");         var search = searchState[0];          var setSearch = searchState[1];
  var ftState = useState("All");          var filterTipo = ftState[0];          var setFilterTipo = ftState[1];
  var fsState = useState("Active");       var filterStatus = fsState[0];        var setFilterStatus = fsState[1];
  var sbState = useState("total");        var sortBy = sbState[0];             var setSortBy = sbState[1];
  var smState = useState(false);          var showModal = smState[0];           var setShowModal = smState[1];
  var ecState = useState(null);           var editClient = ecState[0];          var setEditClient = ecState[1];
  var formState = useState(EMPTY_FORM);   var form = formState[0];             var setForm = formState[1];
  var savingState = useState(false);      var saving = savingState[0];          var setSaving = savingState[1];
  var msgState = useState("");            var msg = msgState[0];                var setMsg = msgState[1];
  var scState = useState(null);           var selectedClient = scState[0];      var setSelectedClient = scState[1];
  var ldState = useState(false);          var loadingDetail = ldState[0];       var setLoadingDetail = ldState[1];
  var esState = useState(null);           var expandedSale = esState[0];        var setExpandedSale = esState[1];

  var now = new Date();
  var cm = now.getMonth();
  var cy = now.getFullYear();
  var dateLabel = MONTHS[cm] + " " + (now.getDate() < 10 ? "0" : "") + now.getDate() + ", " + cy;

  useEffect(function() { loadData(); }, []);

  function loadData() {
    setLoading(true);
    Promise.all([
      supabase.from("clients").select("*"),
      supabase.from("sales").select("id,customer_name,client_id,total_usd,date,sale_type,platform,payment_method,payment_status"),
    ]).then(function(results) {
      if (results[0].data) setClients(results[0].data);
      if (results[1].data) setSales(results[1].data);
      setLoading(false);
    });
  }

  function clientSalesOf(client) {
    var cName = (client.name || "").toLowerCase().trim();
    return sales.filter(function(s) {
      if (s.client_id != null && s.client_id === client.id) return true;
      if (!s.client_id) {
        var sName = (s.customer_name || "").toLowerCase().trim();
        return sName === cName;
      }
      return false;
    });
  }

  function getMetrics(client) {
    var cSales = clientSalesOf(client).sort(function(a, b) { return (b.date || "").localeCompare(a.date || ""); });
    var total = cSales.reduce(function(s, x) { return s + (parseFloat(x.total_usd) || 0); }, 0);
    var count = cSales.length;
    var avgTicket = count > 0 ? total / count : 0;
    var lastSale = cSales[0];
    var ds = lastSale ? daysSince(lastSale.date) : null;
    var pendingSales = cSales.filter(function(s) { return s.payment_status === "Pending" || s.payment_status === "Partial"; });
    var pendingTotal = pendingSales.reduce(function(s, x) { return s + (parseFloat(x.total_usd) || 0); }, 0);
    return { cSales: cSales, total: total, count: count, avgTicket: avgTicket, lastSale: lastSale, daysSince: ds, pendingSales: pendingSales, pendingTotal: pendingTotal };
  }

  function selectClient(client) {
    if (selectedClient && selectedClient.id === client.id) {
      setSelectedClient(null); setSaleItems({}); setExpandedSale(null); return;
    }
    setSelectedClient(client); setExpandedSale(null);
    var cSales = clientSalesOf(client);
    if (cSales.length === 0) { setSaleItems({}); return; }
    setLoadingDetail(true);
    supabase.from("sale_items")
      .select("sale_id,product_name,quantity,unit_price")
      .in("sale_id", cSales.map(function(s) { return s.id; }))
      .then(function(res) {
        var grouped = {};
        (res.data || []).forEach(function(it) {
          var key = String(it.sale_id);
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(it);
        });
        setSaleItems(grouped);
        setLoadingDetail(false);
      });
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

  function handleSave(e) {
    if (e) e.preventDefault();
    if (!form.name) { setMsg("Name is required."); return; }
    setSaving(true); setMsg("");

    var payload = {
      name: form.name, phone: form.phone, email: form.email,
      vz_state: form.vz_state, tipo: form.tipo, status: form.status,
      credit_limit: parseFloat(form.credit_limit) || 0,
      credit_days: parseInt(form.credit_days) || 0,
      notes: form.notes,
      updated_at: new Date().toISOString(),
    };

    if (editClient) {
      supabase.from("clients").update(payload).eq("id", editClient.id).select().single().then(function(res) {
        if (!res.error && res.data) {
          setClients(function(prev) { return prev.map(function(c) { return c.id === editClient.id ? res.data : c; }); });
          setSelectedClient(res.data);
          setMsg("Client updated!");
        } else if (res.error) { setMsg("Error: " + res.error.message); }
        setSaving(false);
        setTimeout(function() { setMsg(""); setShowModal(false); }, 1500);
      });
    } else {
      payload.created_at = new Date().toISOString();
      supabase.from("clients").insert(payload).select().single().then(function(res) {
        if (!res.error && res.data) {
          setClients(function(prev) { return prev.concat([res.data]); });
          setMsg("Client created!");
        } else if (res.error) { setMsg("Error: " + res.error.message); }
        setSaving(false);
        setTimeout(function() { setMsg(""); setShowModal(false); }, 1500);
      });
    }
  }

  // Filtered + sorted clients
  var allClientsWithMetrics = clients.map(function(c) {
    var copy = {}; for (var k in c) copy[k] = c[k];
    copy.metrics = getMetrics(c);
    return copy;
  });

  var filtered = allClientsWithMetrics.filter(function(c) {
    if (filterTipo !== "All" && c.tipo !== filterTipo) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    if (search) {
      var q = search.toLowerCase();
      return (c.name || "").toLowerCase().includes(q) ||
             (c.phone || "").includes(q) ||
             (c.vz_state || "").toLowerCase().includes(q);
    }
    return true;
  }).sort(function(a, b) {
    if (sortBy === "total") return b.metrics.total - a.metrics.total;
    if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
    if (sortBy === "recent") return (b.metrics.lastSale ? b.metrics.lastSale.date : "") > (a.metrics.lastSale ? a.metrics.lastSale.date : "") ? 1 : -1;
    return 0;
  });

  var totalClients = clients.filter(function(c) { return c.status === "Active"; }).length;
  var totalRevenue = allClientsWithMetrics.reduce(function(s, c) { return s + c.metrics.total; }, 0);
  var totalPending = allClientsWithMetrics.reduce(function(s, c) { return s + c.metrics.pendingTotal; }, 0);
  var classA = allClientsWithMetrics.filter(function(c) { return getABC(c.metrics.total) === "A"; }).length;

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: "28px", fontWeight: 500, color: "var(--accent)", letterSpacing: "-0.04em", marginBottom: "8px" }}>LOADING</div>
          <div style={{ color: "var(--muted)", fontSize: "13px" }}>Loading clients...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <style>{"\n        .client-row:hover{background:rgba(0,0,0,.015)!important;cursor:pointer}\n      "}</style>

      {/* Header */}
      <div className="hdr">
        <div className="hdr-left">
          <div className="hdr-title">Clientes</div>
          <div className="hdr-date">{dateLabel}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button className="btn btn-primary" onClick={function() { openModal(null); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "12px", height: "12px" }}>
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Client
          </button>
          <div className="hdr-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Search clients..." value={search} onChange={function(e) { setSearch(e.target.value); }} />
          </div>
        </div>
      </div>

      <div className="content">

        {/* KPIs */}
        <div className="g4">
          {[
            { label: "Clientes Activos", val: String(totalClients), sub: clients.length + " total",
              icon: function() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>; } },
            { label: "Revenue Total", val: "$" + totalRevenue.toFixed(0), sub: "All time",
              icon: function() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>; } },
            { label: "Pagos Pendientes", val: "$" + totalPending.toFixed(0), sub: "To collect", red: totalPending > 0,
              icon: function() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>; } },
            { label: "Clientes Clase A", val: String(classA), sub: "+$5,000 total", green: true,
              icon: function() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>; } },
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

        <div style={{ display: "grid", gridTemplateColumns: selectedClient ? "1fr 380px" : "1fr", gap: "16px" }}>
          {/* Client List */}
          <div className="card">
            <div className="card-h">
              <div>
                <div className="card-t">CRM — Clientes</div>
                <div className="card-sub">{filtered.length + " clients"}</div>
              </div>
            </div>
            <div className="card-b" style={{ paddingTop: "12px" }}>
              {/* Filters */}
              <div style={{ display: "flex", gap: "10px", marginBottom: "14px", flexWrap: "wrap" }}>
                <select className="form-input" value={filterTipo} onChange={function(e) { setFilterTipo(e.target.value); }} style={{ width: "140px" }}>
                  <option value="All">All Types</option>
                  <option value="Retail">Retail</option>
                  <option value="Wholesale">Wholesale</option>
                </select>
                <select className="form-input" value={filterStatus} onChange={function(e) { setFilterStatus(e.target.value); }} style={{ width: "140px" }}>
                  <option value="">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <select className="form-input" value={sortBy} onChange={function(e) { setSortBy(e.target.value); }} style={{ width: "150px" }}>
                  <option value="total">Sort: Revenue</option>
                  <option value="name">Sort: Name</option>
                  <option value="recent">Sort: Recent</option>
                </select>
              </div>

              {/* Table */}
              <div style={{ overflowX: "auto" }}>
                <table className="dt">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Type</th>
                      <th>Region</th>
                      <th>Revenue</th>
                      <th>Orders</th>
                      <th>Pending</th>
                      <th>Last Sale</th>
                      <th>ABC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--muted)", padding: "24px" }}>No clients found</td></tr>
                    )}
                    {filtered.map(function(c) {
                      var m = c.metrics;
                      var abc = getABC(m.total);
                      var isSelected = selectedClient && selectedClient.id === c.id;
                      var abcClass = abc === "A" ? "bdg-gn" : abc === "B" ? "bdg-bl" : "bdg-or";
                      var typeClass = c.tipo === "Wholesale" ? "bdg-bl" : "bdg-or";
                      return (
                        <tr
                          key={c.id}
                          className="client-row"
                          onClick={function() { selectClient(c); }}
                          style={isSelected ? { background: "var(--accent-light)" } : {}}
                        >
                          <td>
                            <div style={{ fontWeight: 600, letterSpacing: "-0.01em" }}>{c.name}</div>
                            <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)" }}>{c.phone || "—"}</div>
                          </td>
                          <td><span className={"bdg " + typeClass}>{c.tipo}</span></td>
                          <td>{c.vz_state || "—"}</td>
                          <td className="mono" style={{ fontWeight: 600, fontSize: "12px" }}>{"$" + m.total.toFixed(0)}</td>
                          <td className="mono" style={{ fontSize: "11px" }}>{m.count}</td>
                          <td>
                            {m.pendingTotal > 0
                              ? <span style={{ color: "var(--orange)", fontWeight: 600, fontFamily: "var(--mono)", fontSize: "11px" }}>{"$" + m.pendingTotal.toFixed(0)}</span>
                              : <span style={{ color: "var(--green)", fontFamily: "var(--mono)", fontSize: "11px" }}>—</span>
                            }
                          </td>
                          <td style={{ whiteSpace: "nowrap" }}>
                            {m.lastSale ? (
                              <span>
                                <span style={{ fontFamily: "var(--mono)", fontSize: "11px" }}>{m.lastSale.date}</span>
                                {m.daysSince !== null && m.daysSince > 30 && (
                                  <span style={{ color: "var(--red)", marginLeft: "4px", fontFamily: "var(--mono)", fontSize: "10px" }}>{"(" + m.daysSince + "d)"}</span>
                                )}
                              </span>
                            ) : <span style={{ color: "var(--muted)" }}>—</span>}
                          </td>
                          <td><span className={"bdg " + abcClass}>{abc}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Client Detail Panel */}
          {selectedClient && (
            <div className="card">
              <div className="card-h">
                <div>
                  <div className="card-t">{selectedClient.name}</div>
                  <div className="card-sub">{(selectedClient.phone || "") + (selectedClient.email ? " · " + selectedClient.email : "")}</div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="btn" onClick={function() { openModal(selectedClient); }} style={{ padding: "4px 10px" }}>Edit</button>
                  <button className="btn" onClick={function() { setSelectedClient(null); }} style={{ padding: "4px 10px" }}>×</button>
                </div>
              </div>
              <div className="card-b">
                {(function() {
                  var m = getMetrics(selectedClient);
                  var abc = getABC(m.total);
                  var abcClass = abc === "A" ? "bdg-gn" : abc === "B" ? "bdg-bl" : "bdg-or";
                  var creditPct = selectedClient.credit_limit > 0 ? Math.min(100, (m.pendingTotal / selectedClient.credit_limit) * 100) : 0;
                  return (
                    <div>
                      {/* Metrics grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                        {[
                          { label: "Total Revenue", value: "$" + m.total.toFixed(2) },
                          { label: "Orders", value: String(m.count) },
                          { label: "Avg Ticket", value: "$" + m.avgTicket.toFixed(2) },
                          { label: "Pending", value: m.pendingTotal > 0 ? "$" + m.pendingTotal.toFixed(2) : "Clear", color: m.pendingTotal > 0 ? "var(--orange)" : "var(--green)" },
                        ].map(function(row) {
                          return (
                            <div key={row.label} style={{ padding: "10px 14px", background: "rgba(0,0,0,.02)", borderRadius: "var(--rs)" }}>
                              <div className="form-label" style={{ marginBottom: "2px" }}>{row.label}</div>
                              <div className="mono" style={{ fontSize: "18px", fontWeight: 600, color: row.color || "var(--dark)" }}>{row.value}</div>
                            </div>
                          );
                        })}
                      </div>

                      <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                        <span className={"bdg " + abcClass}>{abc + " Client"}</span>
                        <span className={"bdg " + (selectedClient.tipo === "Wholesale" ? "bdg-bl" : "bdg-or")}>{selectedClient.tipo}</span>
                        <span className="bdg" style={{ background: "rgba(0,0,0,.04)", color: "var(--muted)" }}>{selectedClient.vz_state || "—"}</span>
                      </div>

                      {selectedClient.credit_limit > 0 && (
                        <div style={{ marginBottom: "14px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                            <span style={{ fontFamily: "var(--mono)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)" }}>Credit Used</span>
                            <span className="mono" style={{ fontSize: "11px", fontWeight: 600, color: creditPct > 80 ? "var(--red)" : "var(--dark)" }}>
                              {"$" + m.pendingTotal.toFixed(0) + " / $" + selectedClient.credit_limit}
                            </span>
                          </div>
                          <div style={{ background: "rgba(0,0,0,.04)", borderRadius: "3px", height: "5px", overflow: "hidden" }}>
                            <div style={{ width: creditPct + "%", height: "100%", background: creditPct > 80 ? "var(--red)" : "var(--accent)", borderRadius: "3px", transition: "width 0.4s var(--ease)" }} />
                          </div>
                        </div>
                      )}

                      {/* Purchase history */}
                      <div className="form-label" style={{ marginBottom: "10px" }}>
                        {"Purchase History (" + m.count + ")"}
                      </div>

                      {loadingDetail && <div style={{ color: "var(--muted)", fontSize: "13px", textAlign: "center", padding: "12px 0" }}>Loading...</div>}

                      <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                        {m.cSales.slice(0, 10).map(function(s) {
                          var items = saleItems[String(s.id)] || [];
                          var isExp = expandedSale === s.id;
                          var statusClass = s.payment_status === "Paid" ? "bdg-gn" : s.payment_status === "Pending" ? "bdg-rd" : "bdg-or";
                          return (
                            <div key={s.id} style={{ borderBottom: "1px solid var(--sep)", marginBottom: "4px" }}>
                              <div
                                onClick={function() { setExpandedSale(isExp ? null : s.id); }}
                                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", cursor: "pointer" }}
                              >
                                <div>
                                  <div style={{ fontSize: "12px", fontWeight: 500, letterSpacing: "-0.01em" }}>{s.date + " · " + s.platform}</div>
                                  <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)" }}>{s.payment_method}</div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                  <div className="mono" style={{ fontSize: "13px", fontWeight: 600 }}>{"$" + (parseFloat(s.total_usd) || 0).toFixed(2)}</div>
                                  <span className={"bdg " + statusClass}>{s.payment_status}</span>
                                </div>
                              </div>
                              {isExp && items.length > 0 && (
                                <div style={{ paddingBottom: "8px" }}>
                                  {items.map(function(it, i) {
                                    return (
                                      <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", padding: "3px 10px", background: "rgba(0,0,0,.02)", borderRadius: "4px", marginBottom: "2px" }}>
                                        <span>{it.product_name}</span>
                                        <span className="mono" style={{ fontSize: "10px" }}>{it.quantity + " × $" + parseFloat(it.unit_price).toFixed(2)}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {selectedClient.notes && (
                        <div style={{ marginTop: "12px", padding: "10px 14px", background: "rgba(0,0,0,.02)", borderRadius: "var(--rs)", fontSize: "12px", color: "var(--muted)" }}>
                          <span style={{ fontWeight: 600, color: "var(--dark)" }}>Notes: </span>{selectedClient.notes}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Summary Bar */}
        <div className="summary-bar" style={{ marginTop: "16px" }}>
          <div className="summary-item"><div className="summary-label">Active Clients</div><div className="summary-value">{String(totalClients)}</div></div>
          <div className="summary-item"><div className="summary-label">Revenue</div><div className="summary-value">{"$" + totalRevenue.toFixed(0)}</div></div>
          <div className="summary-item"><div className="summary-label">Pending</div><div className="summary-value" style={{ color: "var(--red)" }}>{"$" + totalPending.toFixed(0)}</div></div>
          <div className="summary-spacer" />
          <div className="summary-item"><div className="summary-label">Class A</div><div className="summary-value accent">{String(classA)}</div></div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <div style={{
            background: "var(--white)", borderRadius: "var(--r)", padding: "28px", width: "560px",
            maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", boxShadow: "var(--sh-lg)",
            animation: "slideIn 0.2s ease",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <div className="form-label" style={{ marginBottom: "2px" }}>CRM</div>
                <div style={{ fontSize: "17px", fontWeight: 600, letterSpacing: "-0.03em" }}>
                  {editClient ? "Edit Client" : "New Client"}
                </div>
              </div>
              <button className="btn" onClick={function() { setShowModal(false); }} style={{ padding: "4px 10px" }}>×</button>
            </div>

            {msg && (
              <div style={{
                padding: "10px 14px", borderRadius: "var(--rs)", marginBottom: "14px",
                background: msg.includes("Error") ? "rgba(255,59,48,.07)" : "rgba(52,199,89,.07)",
                color: msg.includes("Error") ? "var(--red)" : "var(--green)",
                fontSize: "13px", fontWeight: 500, fontFamily: "var(--mono)",
              }}>
                {msg}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div className="form-row" style={{ gridTemplateColumns: "1fr" }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" type="text" placeholder="e.g. María García" value={form.name} onChange={setFormField(setForm, "name")} />
                </div>
              </div>
              <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" type="text" placeholder="+58 412 000 0000" value={form.phone} onChange={setFormField(setForm, "phone")} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" placeholder="email@example.com" value={form.email} onChange={setFormField(setForm, "email")} />
                </div>
              </div>
              <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div className="form-group">
                  <label className="form-label">Region</label>
                  <select className="form-input" value={form.vz_state} onChange={setFormField(setForm, "vz_state")}>
                    {US_STATES.map(function(s) { return <option key={s} value={s}>{s}</option>; })}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-input" value={form.tipo} onChange={setFormField(setForm, "tipo")}>
                    <option value="Retail">Retail</option>
                    <option value="Wholesale">Wholesale</option>
                  </select>
                </div>
              </div>
              <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                <div className="form-group">
                  <label className="form-label">Credit Limit</label>
                  <input className="form-input" type="number" min="0" value={form.credit_limit} onChange={setFormField(setForm, "credit_limit")} />
                </div>
                <div className="form-group">
                  <label className="form-label">Credit Days</label>
                  <input className="form-input" type="number" min="0" value={form.credit_days} onChange={setFormField(setForm, "credit_days")} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status} onChange={setFormField(setForm, "status")}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="form-row" style={{ gridTemplateColumns: "1fr" }}>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input className="form-input" type="text" placeholder="Additional notes..." value={form.notes} onChange={setFormField(setForm, "notes")} />
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
                style={{
                  width: "100%", padding: "12px 20px", fontSize: "13px", marginTop: "8px",
                  opacity: saving ? 0.4 : 1, cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Saving..." : editClient ? "Save Changes" : "Create Client"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
