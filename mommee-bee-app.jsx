import { useState, useEffect } from "react";
import { supabase } from "./src/supabaseClient.js";

var MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
var EXP_CATEGORIES = ["Advertising","Salaries","Services","Platform Fees","Subscriptions","Packaging","Transport","Rent","Taxes","Other"];
var PLATFORMS = ["Instagram","WhatsApp","Website","Boutique","Marketplace"];
var PLAT_COLORS = ["var(--accent)","var(--blue)","var(--green)","#ff9500","var(--purple)"];

function fmtK(v) { return v >= 1000 ? "$" + (v / 1000).toFixed(1) + "k" : "$" + v.toFixed(0); }
function fmtD(v) { return "$" + v.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
// Parse 0-based month directly from "YYYY-MM-DD" to avoid UTC timezone shifts at month boundaries
function monthOf(dateStr) { return dateStr ? parseInt(String(dateStr).substring(5, 7), 10) - 1 : -1; }
// Clasifica un gasto en COGS / OPEX / EVENT segun su categoria.
function classifyExpense(category) {
  if (category === "Evento") return "EVENT";
  if (category === "Packaging" || category === "Taxes" || category === "Other") return "COGS";
  return "OPEX";
}

export default function MommeeBeeApp(props) {
  var onNavigate = props.onNavigate || function() {};
  var clients = props.clients || [];
  var setClients = props.setClients || function() {};

  var salesState = useState([]);       var sales = salesState[0];       var setSales = salesState[1];
  var itemsState = useState([]);       var saleItems = itemsState[0];   var setSaleItems = itemsState[1];
  var importsState = useState([]);     var imports = importsState[0];   var setImports = importsState[1];
  var expensesState = useState([]);    var expenses = expensesState[0]; var setExpenses = expensesState[1];
  var recurringState = useState([]);   var recurringExpenses = recurringState[0]; var setRecurringExpenses = recurringState[1];
  var productsState = useState([]);    var products = productsState[0]; var setProducts = productsState[1];
  var loadingState = useState(true);   var loading = loadingState[0];   var setLoading = loadingState[1];
  var showExpFormState = useState(false); var showExpenseForm = showExpFormState[0]; var setShowExpenseForm = showExpFormState[1];
  var expFormState = useState({ date: new Date().toISOString().split("T")[0], category: "Advertising", desc: "", amount: "" });
  var expForm = expFormState[0]; var setExpForm = expFormState[1];
  var refreshState = useState(0); var refreshKey = refreshState[0]; var setRefreshKey = refreshState[1];

  var decisionsState = useState([]); var decisions = decisionsState[0]; var setDecisions = decisionsState[1];
  var showDecFormState = useState(false); var showDecForm = showDecFormState[0]; var setShowDecForm = showDecFormState[1];
  var decFormState = useState({ text: "", priority: "Media" }); var decForm = decFormState[0]; var setDecForm = decFormState[1];
  var taskInputState = useState({ decId: null, text: "", dueDate: "" }); var taskInput = taskInputState[0]; var setTaskInput = taskInputState[1];
  var editingDecState = useState({ id: null, text: "" }); var editingDec = editingDecState[0]; var setEditingDec = editingDecState[1];
  var editingTaskState = useState({ decId: null, taskId: null, text: "", dueDate: "" }); var editingTask = editingTaskState[0]; var setEditingTask = editingTaskState[1];
  var dragIdxState = useState(null); var dragIdx = dragIdxState[0]; var setDragIdx = dragIdxState[1];
  var showAllExpState = useState(false); var showAllExp = showAllExpState[0]; var setShowAllExp = showAllExpState[1];
  var eventExpState = useState([]); var eventExpenses = eventExpState[0]; var setEventExpenses = eventExpState[1];
  var abonoState = useState({ id: null, amount: "" }); var abonoInput = abonoState[0]; var setAbonoInput = abonoState[1];
  var showEventFormState = useState(false); var showEventForm = showEventFormState[0]; var setShowEventForm = showEventFormState[1];
  var eventFormState = useState({ description: "", total_amount: "" }); var eventForm = eventFormState[0]; var setEventForm = eventFormState[1];
  var sponsorsState = useState([]); var sponsors = sponsorsState[0]; var setSponsors = sponsorsState[1];
  var showSponsorFormState = useState(false); var showSponsorForm = showSponsorFormState[0]; var setShowSponsorForm = showSponsorFormState[1];
  var sponsorFormState = useState({ name: "", amount: "" }); var sponsorForm = sponsorFormState[0]; var setSponsorForm = sponsorFormState[1];
  var ticketsState = useState([]); var tickets = ticketsState[0]; var setTickets = ticketsState[1];
  var showTicketFormState = useState(false); var showTicketForm = showTicketFormState[0]; var setShowTicketForm = showTicketFormState[1];
  var ticketFormState = useState({ buyer: "", quantity: "", price: "" }); var ticketForm = ticketFormState[0]; var setTicketForm = ticketFormState[1];

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
      supabase.from("recurring_expenses").select("*").eq("active", true).order("category"),
      supabase.from("decisions").select("*").order("position", { ascending: true }),
      supabase.from("event_expenses").select("*").order("created_at", { ascending: true }),
      supabase.from("sponsors").select("*").order("created_at", { ascending: false }),
      supabase.from("ticket_sales").select("*").order("created_at", { ascending: false }),
    ]).then(function(results) {
      if (results[0].data) setSales(results[0].data);
      if (results[1].data) setSaleItems(results[1].data);
      if (results[2].data) setImports(results[2].data);
      if (results[4].data) setClients(results[4].data);
      if (results[5].data) setProducts(results[5].data);
      if (results[7].data) setDecisions(results[7].data.map(function(d) { return { id: d.id, text: d.text, priority: d.priority, status: d.status, date: d.date, tasks: d.tasks || [] }; }));
      if (results[8].data) setEventExpenses(results[8].data);
      if (results[9].data) setSponsors(results[9].data);
      if (results[10].data) setTickets(results[10].data);

      var allExpenses = results[3].data || [];
      var recurring = results[6].data || [];
      if (recurring.length > 0) setRecurringExpenses(recurring.map(function(e) { return { id: e.id, category: e.category, desc: e.description || "", amount: parseFloat(e.amount_usd) || 0 }; }));

      var now = new Date();
      var monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      var monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
      var monthExp   = allExpenses.filter(function(e) { return e.date >= monthStart && e.date <= monthEnd; });

      var toInsert = recurring.filter(function(r) {
        return !monthExp.some(function(e) {
          return e.category === r.category && (e.description || "") === (r.description || "");
        });
      });

      function applyExpenses(list) {
setExpenses(list.map(function(e) { return { id: e.id, date: e.date, category: e.category, desc: e.description || "", amount: parseFloat(e.amount_usd) || 0, type: e.expense_type || classifyExpense(e.category) }; }));        setLoading(false);
      }

      if (toInsert.length > 0) {
        var yr = now.getFullYear();
        var mo = String(now.getMonth() + 1).padStart(2, "0");
        var rows = toInsert.map(function(r) {
          var day = String(r.day_of_month || 1).padStart(2, "0");
return { date: yr + "-" + mo + "-" + day, category: r.category, description: r.description, amount_usd: r.amount_usd, expense_type: classifyExpense(r.category) };        });
        supabase.from("expenses").insert(rows).select().then(function(res) {
          if (res.error) { console.error("Error inserting recurring expenses:", res.error); }
          applyExpenses(res.data ? allExpenses.concat(res.data) : allExpenses);
        });
      } else {
        applyExpenses(allExpenses);
      }
    });
  }

  var setE = function(k) { return function(e) { setExpForm(function(f) { var n = {}; for (var x in f) n[x] = f[x]; n[k] = e.target.value; return n; }); }; };
  var setD = function(k) { return function(e) { setDecForm(function(f) { var n = {}; for (var x in f) n[x] = f[x]; n[k] = e.target.value; return n; }); }; };

  var addDecision = function() {
    if (!decForm.text.trim()) return;
    var row = { text: decForm.text.trim(), priority: decForm.priority, status: "Pendiente", date: new Date().toISOString().split("T")[0], tasks: [] };
    supabase.from("decisions").insert(row).select().single().then(function(res) {
      if (res.data) setDecisions(function(ds) { return [{ id: res.data.id, text: res.data.text, priority: res.data.priority, status: res.data.status, date: res.data.date, tasks: res.data.tasks || [] }].concat(ds); });
    });
    setDecForm({ text: "", priority: "Media" });
    setShowDecForm(false);
  };

  var setDecisionStatus = function(id, status) {
    supabase.from("decisions").update({ status: status }).eq("id", id).then(function() {});
    setDecisions(function(ds) { return ds.map(function(d) { if (d.id !== id) return d; var n = {}; for (var x in d) n[x] = d[x]; n.status = status; return n; }); });
  };

  var deleteDecision = function(id) {
    supabase.from("decisions").delete().eq("id", id).then(function() {});
    setDecisions(function(ds) { return ds.filter(function(d) { return d.id !== id; }); });
  };

  var updateDecisionText = function(id, text) {
    if (!text.trim()) return;
    supabase.from("decisions").update({ "text": text.trim() }).eq("id", id).then(function() {});
    setDecisions(function(ds) { return ds.map(function(d) { if (d.id !== id) return d; var n = {}; for (var x in d) n[x] = d[x]; n.text = text.trim(); return n; }); });
    setEditingDec({ id: null, text: "" });
  };

  var reorderDecisions = function(fromIdx, toIdx) {
    if (fromIdx === toIdx) return;
    var arr = decisions.slice();
    var moved = arr.splice(fromIdx, 1)[0];
    arr.splice(toIdx, 0, moved);
    setDecisions(arr);
    arr.forEach(function(d, i) {
      supabase.from("decisions").update({ position: i }).eq("id", d.id).then(function() {});
    });
  };

  var updateTaskContent = function(decId, taskId, newText, newDueDate) {
    if (!newText.trim()) return;
    var dec = decisions.filter(function(d) { return d.id === decId; })[0];
    if (!dec) return;
    var newTasks = (dec.tasks || []).map(function(t) { if (t.id !== taskId) return t; var nt = {}; for (var x in t) nt[x] = t[x]; nt.text = newText.trim(); nt.dueDate = newDueDate || ""; return nt; });
    updateDecTasks(decId, newTasks);
    setEditingTask({ decId: null, taskId: null, text: "", dueDate: "" });
  };

  var updateDecTasks = function(decId, newTasks) {
    supabase.from("decisions").update({ tasks: newTasks }).eq("id", decId).then(function() {});
    setDecisions(function(ds) { return ds.map(function(d) { if (d.id !== decId) return d; var n = {}; for (var x in d) n[x] = d[x]; n.tasks = newTasks; return n; }); });
  };

  var addTask = function(decId) {
    if (!taskInput.text.trim()) return;
    var dec = decisions.filter(function(d) { return d.id === decId; })[0];
    if (!dec) return;
    var newTask = { id: Date.now(), text: taskInput.text.trim(), status: "Pendiente", dueDate: taskInput.dueDate || "" };
    updateDecTasks(decId, (dec.tasks || []).concat([newTask]));
    setTaskInput({ decId: decId, text: "", dueDate: "" });
  };

  var setTaskStatus = function(decId, taskId, status) {
    var dec = decisions.filter(function(d) { return d.id === decId; })[0];
    if (!dec) return;
    var newTasks = (dec.tasks || []).map(function(t) { if (t.id !== taskId) return t; var nt = {}; for (var x in t) nt[x] = t[x]; nt.status = status; return nt; });
    updateDecTasks(decId, newTasks);
  };

  var deleteTask = function(decId, taskId) {
    var dec = decisions.filter(function(d) { return d.id === decId; })[0];
    if (!dec) return;
    updateDecTasks(decId, (dec.tasks || []).filter(function(t) { return t.id !== taskId; }));
  };

  var deleteExpense = function(id) {
    supabase.from("expenses").delete().eq("id", id).then(function() {});
    setExpenses(function(ex) { return ex.filter(function(e) { return e.id !== id; }); });
  };

  var addAbono = function(id, amount) {
    var amt = parseFloat(amount) || 0;
    if (amt <= 0) return;
    var ev = eventExpenses.filter(function(e) { return e.id === id; })[0];
    if (!ev) return;
    var newPaid = (parseFloat(ev.paid_amount) || 0) + amt;
    supabase.from("event_expenses").update({ paid_amount: newPaid }).eq("id", id).then(function() {});
    var today = new Date().toISOString().split("T")[0];
    supabase.from("expenses").insert({ date: today, category: "Evento", description: ev.description + " - Abono", amount_usd: amt }).select().single().then(function(res) {
      if (res.data) setExpenses(function(ex) { return [{ id: res.data.id, date: today, category: "Evento", desc: ev.description + " - Abono", amount: amt }].concat(ex); });
    });
    setEventExpenses(function(evs) { return evs.map(function(e) { if (e.id !== id) return e; var n = {}; for (var x in e) n[x] = e[x]; n.paid_amount = newPaid; return n; }); });
    setAbonoInput({ id: null, amount: "" });
  };

  var addEventExpense = function() {
    if (!eventForm.description.trim() || !parseFloat(eventForm.total_amount)) return;
    var row = { description: eventForm.description.trim(), total_amount: parseFloat(eventForm.total_amount), paid_amount: 0 };
    supabase.from("event_expenses").insert(row).select().single().then(function(res) {
      if (res.data) setEventExpenses(function(evs) { return evs.concat([res.data]); });
    });
    setEventForm({ description: "", total_amount: "" });
    setShowEventForm(false);
  };

  var deleteEventExpense = function(id) {
    supabase.from("event_expenses").delete().eq("id", id).then(function() {});
    setEventExpenses(function(evs) { return evs.filter(function(e) { return e.id !== id; }); });
  };

  var addSponsor = function() {
    if (!sponsorForm.name.trim() || !parseFloat(sponsorForm.amount)) return;
    var row = { name: sponsorForm.name.trim(), amount_usd: parseFloat(sponsorForm.amount), date: new Date().toISOString().split("T")[0] };
    supabase.from("sponsors").insert(row).select().single().then(function(res) {
      if (res.data) setSponsors(function(sp) { return [res.data].concat(sp); });
    });
    setSponsorForm({ name: "", amount: "" });
    setShowSponsorForm(false);
  };

  var deleteSponsor = function(id) {
    supabase.from("sponsors").delete().eq("id", id).then(function() {});
    setSponsors(function(sp) { return sp.filter(function(s) { return s.id !== id; }); });
  };

  var addTicketSale = function() {
    var qty = parseInt(ticketForm.quantity, 10);
    var price = parseFloat(ticketForm.price);
    if (!ticketForm.buyer.trim() || !qty || !price) return;
    var row = { buyer: ticketForm.buyer.trim(), quantity: qty, price_usd: price, date: new Date().toISOString().split("T")[0] };
    supabase.from("ticket_sales").insert(row).select().single().then(function(res) {
      if (res.data) setTickets(function(t) { return [res.data].concat(t); });
    });
    setTicketForm({ buyer: "", quantity: "", price: "" });
    setShowTicketForm(false);
  };

  var deleteTicketSale = function(id) {
    supabase.from("ticket_sales").delete().eq("id", id).then(function() {});
    setTickets(function(t) { return t.filter(function(s) { return s.id !== id; }); });
  };

  var getDecProgress = function(dec) {
    var tasks = dec.tasks || [];
    if (tasks.length === 0) return -1;
    var done = tasks.filter(function(t) { return t.status === "Completado"; }).length;
    return Math.round((done / tasks.length) * 100);
  };

  var DEC_PRIORITY_COLORS = { "Alta": "var(--red)", "Media": "var(--accent)", "Baja": "var(--green)" };
  var DEC_STATUS_STYLES = {
    "Pendiente":   { bg: "#fff",    border: "var(--border)", opacity: 1,   strike: false },
    "Completado":  { bg: "#f0faf4", border: "#86efac",       opacity: 1,   strike: true  },
    "Descartado":  { bg: "#f8f8f7", border: "#e5e5e5",       opacity: 0.55, strike: true  }
  };

  var saveExpense = function() {
    var amount = parseFloat(expForm.amount) || 0;
    if (amount <= 0) return;
var etype = classifyExpense(expForm.category);
    var row = { date: expForm.date, category: expForm.category, description: expForm.desc, amount_usd: amount, expense_type: etype };    supabase.from("expenses").insert(row).select().single().then(function(res) {
      var d = res.data || {};
setExpenses(function(ex) { return [{ id: d.id || Date.now(), date: expForm.date, category: expForm.category, desc: expForm.desc, amount: amount, type: etype }].concat(ex); });      setExpForm({ date: new Date().toISOString().split("T")[0], category: "Advertising", desc: "", amount: "" });
      setShowExpenseForm(false);
    });
  };

  // Computations
  var now = new Date();
  var cm = now.getMonth();
  var cy = now.getFullYear();
  var todayStr = cy + "-" + String(cm + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
  var monthPrefix = cy + "-" + String(cm + 1).padStart(2, "0") + "-";
  var dateLabel = MONTHS[cm] + " " + (now.getDate() < 10 ? "0" : "") + now.getDate() + ", " + cy;

  // Today
  var todaySales = sales.filter(function(s) { return s.date === todayStr; });
  var todayGross = todaySales.reduce(function(s, v) { return s + (v.total_usd || 0); }, 0);
  var todayCount = todaySales.length;

  // Yesterday (for "Ventas Hoy" change)
  var yd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  var yesterdayStr = yd.getFullYear() + "-" + String(yd.getMonth() + 1).padStart(2, "0") + "-" + String(yd.getDate()).padStart(2, "0");
  var yesterdayGross = sales.filter(function(s) { return s.date === yesterdayStr; }).reduce(function(s, v) { return s + (v.total_usd || 0); }, 0);
  var todayChangePct = yesterdayGross > 0 ? (((todayGross - yesterdayGross) / yesterdayGross) * 100).toFixed(1) : "0";

  // Year
  var totalYearSales = sales.reduce(function(s, v) { return s + (v.total_usd || 0); }, 0);

  // By month
  var salesByMonth = MONTHS.map(function(month, i) {
    var ms = sales.filter(function(s) { return monthOf(s.date) === i; });
    return { month: month, sales: ms.reduce(function(sum, s) { return sum + (s.total_usd || 0); }, 0), active: ms.length > 0 };
  });

  // Current month
  var monthSalesTotal = sales.filter(function(s) { return monthOf(s.date) === cm; }).reduce(function(sum, s) { return sum + (s.total_usd || 0); }, 0);
  var monthSaleIds = new Set(sales.filter(function(s) { return monthOf(s.date) === cm; }).map(function(s) { return s.id; }));
  var monthItems = saleItems.filter(function(it) { return monthSaleIds.has(it.sale_id); });
  var monthSaleCount = sales.filter(function(s) { return monthOf(s.date) === cm; }).length;

  // Prev month for change
  var pm = cm === 0 ? 11 : cm - 1;
  var prevMonthTotal = sales.filter(function(s) { return monthOf(s.date) === pm; }).reduce(function(sum, s) { return sum + (s.total_usd || 0); }, 0);
  var monthChangePct = prevMonthTotal > 0 ? (((monthSalesTotal - prevMonthTotal) / prevMonthTotal) * 100).toFixed(1) : "0";

  // COGS
  var productMap = {};
  products.forEach(function(p) { productMap[p.id] = p; });
  var monthCogs = monthItems.reduce(function(s, it) {
    var p = productMap[it.product_id];
    return s + (it.quantity || 0) * (p ? (parseFloat(p.cost) || 0) : (it.unit_cost || 0));
  }, 0);

  // OPEX
  var monthExpenses = expenses.filter(function(e) { return e.date && e.date.startsWith(monthPrefix); });
  var recurringKeys = recurringExpenses.map(function(r) { return r.category + "|" + r.desc; });
  var fixedExpenses = monthExpenses.filter(function(e) { return recurringKeys.indexOf(e.category + "|" + e.desc) >= 0; });
  var variableExpenses = monthExpenses.filter(function(e) { return recurringKeys.indexOf(e.category + "|" + e.desc) < 0; });
  var recurringTotal = fixedExpenses.reduce(function(s, e) { return s + (e.amount || 0); }, 0);
  // Separar gastos por tipo: SOLO OPEX cuenta como gasto operativo.
  var opexExpenses      = monthExpenses.filter(function(e) { return (e.type || "OPEX") === "OPEX"; });
  var inventoryExpenses = monthExpenses.filter(function(e) { return e.type === "COGS"; });
  var eventOpExpenses   = monthExpenses.filter(function(e) { return e.type === "EVENT"; });
  var totalOpex      = opexExpenses.reduce(function(s, e) { return s + (e.amount || 0); }, 0);
  var totalInventory = inventoryExpenses.reduce(function(s, e) { return s + (e.amount || 0); }, 0);
  var totalEventOp   = eventOpExpenses.reduce(function(s, e) { return s + (e.amount || 0); }, 0);
  // Sponsors (current month) — must be before P&L
  var monthSponsors = sponsors.filter(function(s) { return s.date && s.date.startsWith(monthPrefix); });
  var totalSponsors = monthSponsors.reduce(function(s, sp) { return s + (parseFloat(sp.amount_usd) || 0); }, 0);

  // Ticket sales (current month) — must be before P&L
  var monthTickets = tickets.filter(function(t) { return t.date && t.date.startsWith(monthPrefix); });
  var totalTicketsQty = monthTickets.reduce(function(s, t) { return s + (parseInt(t.quantity, 10) || 0); }, 0);
  var totalTickets = monthTickets.reduce(function(s, t) { return s + ((parseInt(t.quantity, 10) || 0) * (parseFloat(t.price_usd) || 0)); }, 0);

  // P&L
  var grossProfit = monthSalesTotal - monthCogs;
  var netProfit = grossProfit - totalOpex + totalSponsors + totalTickets;
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
    var total = sales.filter(function(s) { return s.platform === name && monthOf(s.date) === cm; }).reduce(function(sum, s) { return sum + (s.total_usd || 0); }, 0);
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

  // Alerts (low stock + active imports) — drives the Alerts card count
  var lowStockCount = products.filter(function(p) { return p.status === "Active" && p.stock <= (p.min_stock || 0); }).length;
  var alertCount = (lowStockCount > 0 ? 1 : 0) + (activeImports.length > 0 ? 1 : 0);

  // Event expenses
  var totalEventAmount = eventExpenses.reduce(function(s, e) { return s + (parseFloat(e.total_amount) || 0); }, 0);
  var totalEventPaid = eventExpenses.reduce(function(s, e) { return s + (parseFloat(e.paid_amount) || 0); }, 0);
  var totalEventPending = totalEventAmount - totalEventPaid;

  // Sparkline bars helper
  var sparkBars = function(data) {
    var max = Math.max.apply(null, data.concat([1]));
    return data.map(function(v, i) {
      var h = Math.max((v / max) * 24, 4);
      return { height: h + "px", animationDelay: (i * 40) + "ms" };
    });
  };

  // Generate 12-point data for sparklines (deterministic wave so bars don't flicker on re-render)
  var spark12 = function(base, variance) {
    var arr = [];
    for (var i = 0; i < 12; i++) {
      arr.push(base + Math.round(variance * (Math.sin(i * 1.3) * 0.5 + 0.5)));
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
        </div>
      </div>

      <div className="content">

        {/* ROW 1: KPI Cards */}
        <div className="g4">
          {[
            { label: "Ventas Hoy", val: fmtD(todayGross), change: (parseFloat(todayChangePct) >= 0 ? "+" : "") + todayChangePct + "% vs ayer", up: parseFloat(todayChangePct) >= 0,
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
            { label: "Gastos Netos", val: "$" + Math.max(0, totalOpex - totalSponsors).toFixed(0), change: totalSponsors > 0 ? "-$" + totalSponsors.toFixed(0) + " sponsors" : "-$" + totalOpex.toFixed(0), up: totalSponsors > 0,
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
                  {totalSponsors > 0 && <tr><td style={{ paddingLeft: "16px" }}>(+) Sponsor Income</td><td style={{ color: "var(--green)" }}>{"+$" + totalSponsors.toLocaleString()}</td></tr>}
                  {totalTickets > 0 && <tr><td style={{ paddingLeft: "16px" }}>(+) Ticket Sales</td><td style={{ color: "var(--green)" }}>{"+$" + totalTickets.toLocaleString()}</td></tr>}
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
                <div className="card-sub">{alertCount + (alertCount === 1 ? " notification" : " notifications")}</div>
              </div>
            </div>
            <div className="card-b">
              {lowStockCount > 0 && (
                <div className="alert-row">
                  <div className="alert-icon warn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "14px", height: "14px" }}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  </div>
                  <span>{lowStockCount + " products below minimum stock"}</span>
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
              {lowStockCount === 0 && activeImports.length === 0 && (
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
                <div className="card-sub">{showAllExp ? "Historial completo " + new Date().getFullYear() : "Expenses this month"}</div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn" onClick={function() { setShowAllExp(function(v) { return !v; }); }} style={{ padding: "6px 14px", background: showAllExp ? "var(--accent)" : "", color: showAllExp ? "#fff" : "" }}>{showAllExp ? "Este mes" : "Ver todos"}</button>
                <button className="btn" onClick={function() { setShowExpenseForm(function(v) { return !v; }); }} style={{ padding: "6px 14px" }}>+ Add</button>
              </div>
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
                      <input className="form-input" type="text" inputMode="decimal" value={expForm.amount} onChange={setE("amount")} placeholder="0.00" />
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

              <div style={{ maxHeight: showAllExp ? "520px" : "320px", overflowY: "auto" }}>
                {!showAllExp && (
                  <div>
                    {fixedExpenses.length > 0 && (
                      <div>
                        <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", padding: "4px 0 6px" }}>Gastos Fijos Mensuales</div>
                        {fixedExpenses.map(function(e) {
                          return (
                            <div key={"r" + e.id} className="exp-row">
                              <span className="bdg" style={{ background: "#eef2ff", color: "#4f46e5", border: "1px solid #c7d2fe", fontSize: "10px" }}>{e.category}</span>
                              <div style={{ flex: 1, fontSize: "12px", color: "var(--muted)" }}>{e.desc}</div>
                              <span style={{ fontSize: "9px", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: "4px", padding: "1px 6px", marginRight: "6px", fontWeight: 600 }}>Fijo</span>
                              <span className="mono" style={{ color: "var(--red)" }}>{"-$" + e.amount.toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {variableExpenses.length > 0 && (
                      <div>
                        <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", padding: "10px 0 6px" }}>Gastos Variables</div>
                        {variableExpenses.map(function(e) {
                          return (
                            <div key={e.id} className="exp-row">
                              <span className="bdg bdg-or">{e.category}</span>
                              <div style={{ flex: 1, fontSize: "12px", color: "var(--muted)" }}>{e.desc}</div>
                              <span className="mono" style={{ color: "var(--red)", marginRight: "8px" }}>{"-$" + e.amount}</span>
                              <button onClick={function() { deleteExpense(e.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: "0", lineHeight: 1, flexShrink: 0 }} title="Eliminar">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "13px", height: "13px" }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {monthExpenses.length === 0 && (
                      <div style={{ textAlign: "center", color: "var(--muted)", fontSize: "13px", padding: "24px 0" }}>No hay gastos este mes</div>
                    )}
                  </div>
                )}
                {showAllExp && (
                  <div>
                    {(function() {
                      var grouped = {};
                      expenses.forEach(function(e) {
                        var key = e.date ? e.date.substring(0, 7) : "Unknown";
                        if (!grouped[key]) grouped[key] = [];
                        grouped[key].push(e);
                      });
                      var keys = Object.keys(grouped).sort(function(a, b) { return b.localeCompare(a); });
                      if (keys.length === 0) return <div style={{ textAlign: "center", color: "var(--muted)", fontSize: "13px", padding: "24px 0" }}>No hay gastos registrados</div>;
                      return keys.map(function(monthKey) {
                        var monthTotal = grouped[monthKey].reduce(function(s, e) { return s + (e.amount || 0); }, 0);
                        var parts = monthKey.split("-");
                        var label = MONTHS[parseInt(parts[1], 10) - 1] + " " + parts[0];
                        return (
                          <div key={monthKey} style={{ marginBottom: "10px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", padding: "6px 0 4px", borderBottom: "1px solid var(--border)" }}>
                              <span>{label}</span>
                              <span className="mono" style={{ color: "var(--red)" }}>{"-$" + monthTotal.toFixed(2)}</span>
                            </div>
                            {grouped[monthKey].map(function(e) {
                              var isFijo = recurringKeys.indexOf(e.category + "|" + e.desc) >= 0;
                              return (
                                <div key={e.id} className="exp-row">
                                  <span className="bdg" style={isFijo ? { background: "#eef2ff", color: "#4f46e5", border: "1px solid #c7d2fe", fontSize: "10px" } : {}}>{e.category}</span>
                                  <div style={{ flex: 1, fontSize: "12px", color: "var(--muted)" }}>{e.desc}</div>
                                  <div style={{ fontSize: "11px", color: "var(--muted)", marginRight: "8px" }}>{e.date}</div>
                                  {isFijo && <span style={{ fontSize: "9px", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: "4px", padding: "1px 6px", marginRight: "6px", fontWeight: 600 }}>Fijo</span>}
                                  <span className="mono" style={{ color: "var(--red)", marginRight: isFijo ? "0" : "8px" }}>{"-$" + (e.amount || 0).toFixed(2)}</span>
                                  {!isFijo && (
                                    <button onClick={function() { deleteExpense(e.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: "0", lineHeight: 1, flexShrink: 0 }} title="Eliminar">
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "13px", height: "13px" }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>

              <div className="summary-bar" style={{ marginTop: "12px" }}>
                {showAllExp ? (
                  <div className="summary-item"><div className="summary-label">Total {new Date().getFullYear()}</div><div className="summary-value" style={{ color: "var(--red)" }}>{"-$" + expenses.reduce(function(s, e) { return s + (e.amount || 0); }, 0).toFixed(2)}</div></div>
                ) : (
                  <div className="summary-item"><div className="summary-label">Total Expenses</div><div className="summary-value" style={{ color: "var(--red)" }}>{"-$" + totalOpex.toFixed(2)}</div></div>
                )}
                {!showAllExp && totalSponsors > 0 && <div className="summary-item"><div className="summary-label">Sponsors</div><div className="summary-value" style={{ color: "var(--green)" }}>{"+$" + totalSponsors.toFixed(2)}</div></div>}
                <div className="summary-spacer" />
                {!showAllExp && <div className="summary-item"><div className="summary-label">Neto</div><div className="summary-value" style={{ color: Math.max(0, totalOpex - totalSponsors) === 0 ? "var(--green)" : "var(--red)" }}>{"-$" + Math.max(0, totalOpex - totalSponsors).toFixed(2)}</div></div>}
              </div>
            </div>
          </div>
        </div>

        {/* ROW 6b: Pagos Pendientes + Sponsors + Ventas de Entradas */}
        <div className="g3">
        <div className="card">
          <div className="card-h">
            <div>
              <div className="card-t">Pagos Pendientes</div>
              <div className="card-sub">{eventExpenses.length + " gastos \u00B7 $" + totalEventPending.toFixed(2) + " pendiente"}</div>
            </div>
            <button className="btn" onClick={function() { setShowEventForm(function(v) { return !v; }); }} style={{ padding: "6px 14px" }}>+ Agregar</button>
          </div>
          <div className="card-b">
            <div className="summary-bar" style={{ marginBottom: "16px" }}>
              <div className="summary-item"><div className="summary-label">Total</div><div className="summary-value">{"$" + totalEventAmount.toFixed(2)}</div></div>
              <div className="summary-item"><div className="summary-label">Abonado</div><div className="summary-value" style={{ color: "var(--green)" }}>{"$" + totalEventPaid.toFixed(2)}</div></div>
              <div className="summary-spacer" />
              <div className="summary-item"><div className="summary-label">Pendiente</div><div className="summary-value" style={{ color: "var(--red)" }}>{"$" + totalEventPending.toFixed(2)}</div></div>
            </div>

            {showEventForm && (
              <div style={{ background: "var(--accent-light)", border: "1px solid var(--accent)", borderRadius: "var(--rs)", padding: "14px", marginBottom: "14px", animation: "slideIn 0.2s ease" }}>
                <div className="form-row">
                  <div className="form-group" style={{ gridColumn: "span 2" }}>
                    <label className="form-label">Descripcion</label>
                    <input className="form-input" value={eventForm.description} onChange={function(e) { setEventForm({ description: e.target.value, total_amount: eventForm.total_amount }); }} placeholder="Ej: Estacion de cafe" onKeyDown={function(e) { if (e.key === "Enter") addEventExpense(); }} autoFocus />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Monto Total ($)</label>
                    <input className="form-input" type="text" inputMode="decimal" value={eventForm.total_amount} onChange={function(e) { setEventForm({ description: eventForm.description, total_amount: e.target.value }); }} placeholder="0.00" onKeyDown={function(e) { if (e.key === "Enter") addEventExpense(); }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                  <button className="btn btn-primary" onClick={addEventExpense}>Guardar</button>
                  <button className="btn" onClick={function() { setShowEventForm(false); }}>Cancelar</button>
                </div>
              </div>
            )}

            {eventExpenses.length === 0 && (
              <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: "32px", height: "32px", margin: "0 auto 8px", display: "block", opacity: 0.3 }}>
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                </svg>
                No hay pagos de evento. Agrega el primero.
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {eventExpenses.map(function(ev) {
                var total = parseFloat(ev.total_amount) || 0;
                var paid = parseFloat(ev.paid_amount) || 0;
                var pct = total > 0 ? Math.min(Math.round((paid / total) * 100), 100) : 0;
                var done = paid >= total && total > 0;
                var showAbono = abonoInput.id === ev.id;
                return (
                  <div key={ev.id} style={{ padding: "12px 14px", background: done ? "#f0fdf4" : "#fff", border: "1px solid", borderColor: done ? "#86efac" : "var(--border)", borderRadius: "var(--rs)", transition: "all 0.2s" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <div style={{ flex: 1, fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{ev.description}</div>
                      {done && <span style={{ fontSize: "10px", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: "4px", padding: "1px 6px", fontWeight: 600 }}>✓ Pagado</span>}
                      <button onClick={function() { deleteEventExpense(ev.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: "0", lineHeight: 1 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "13px", height: "13px" }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>

                    <div style={{ marginBottom: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontSize: "11px", color: "var(--muted)" }}>{"Abonado: $" + paid.toFixed(2) + " / $" + total.toFixed(2)}</span>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: done ? "#16a34a" : "var(--accent)" }}>{pct + "%"}</span>
                      </div>
                      <div style={{ height: "6px", background: "#e5e5e5", borderRadius: "99px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: pct + "%", background: done ? "#16a34a" : "var(--accent)", borderRadius: "99px", transition: "width 0.4s ease" }} />
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <span style={{ fontSize: "11px", color: "var(--muted)" }}>{"Pendiente: "}<strong style={{ color: done ? "#16a34a" : "var(--red)" }}>{done ? "$0.00" : ("$" + (total - paid).toFixed(2))}</strong></span>
                      {!done && (
                        showAbono ? (
                          <div style={{ display: "flex", gap: "6px", alignItems: "center", marginLeft: "auto" }}>
                            <input className="form-input" type="text" inputMode="decimal" style={{ width: "90px", padding: "4px 8px", fontSize: "12px" }} placeholder="Monto" value={abonoInput.amount} onChange={function(e) { setAbonoInput({ id: ev.id, amount: e.target.value }); }} autoFocus onKeyDown={function(e) { if (e.key === "Enter") addAbono(ev.id, abonoInput.amount); if (e.key === "Escape") setAbonoInput({ id: null, amount: "" }); }} />
                            <button className="btn btn-primary" onClick={function() { addAbono(ev.id, abonoInput.amount); }} style={{ padding: "4px 10px", fontSize: "12px" }}>✓</button>
                            <button className="btn" onClick={function() { setAbonoInput({ id: null, amount: "" }); }} style={{ padding: "4px 10px", fontSize: "12px" }}>✕</button>
                          </div>
                        ) : (
                          <button className="btn" onClick={function() { setAbonoInput({ id: ev.id, amount: "" }); }} style={{ marginLeft: "auto", padding: "4px 12px", fontSize: "12px" }}>+ Abonar</button>
                        )
                      )}
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
              <div className="card-t">Pago de Sponsors</div>
              <div className="card-sub">{monthSponsors.length + " sponsors · $" + totalSponsors.toFixed(2) + " recibido"}</div>
            </div>
            <button className="btn" onClick={function() { setShowSponsorForm(function(v) { return !v; }); }} style={{ padding: "6px 14px" }}>+ Agregar</button>
          </div>
          <div className="card-b">
            <div className="summary-bar" style={{ marginBottom: "16px" }}>
              <div className="summary-item"><div className="summary-label">Recibido</div><div className="summary-value" style={{ color: "var(--green)" }}>{"$" + totalSponsors.toFixed(2)}</div></div>
              <div className="summary-spacer" />
              <div className="summary-item"><div className="summary-label">Sponsors</div><div className="summary-value">{String(monthSponsors.length)}</div></div>
            </div>

            {showSponsorForm && (
              <div style={{ background: "var(--accent-light)", border: "1px solid var(--accent)", borderRadius: "var(--rs)", padding: "14px", marginBottom: "14px", animation: "slideIn 0.2s ease" }}>
                <div className="form-row">
                  <div className="form-group" style={{ gridColumn: "span 2" }}>
                    <label className="form-label">Nombre del Sponsor</label>
                    <input className="form-input" value={sponsorForm.name} onChange={function(e) { setSponsorForm({ name: e.target.value, amount: sponsorForm.amount }); }} placeholder="Ej: Marca ABC" onKeyDown={function(e) { if (e.key === "Enter") addSponsor(); }} autoFocus />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Monto ($)</label>
                    <input className="form-input" type="text" inputMode="decimal" value={sponsorForm.amount} onChange={function(e) { setSponsorForm({ name: sponsorForm.name, amount: e.target.value }); }} placeholder="0.00" onKeyDown={function(e) { if (e.key === "Enter") addSponsor(); }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                  <button className="btn btn-primary" onClick={addSponsor}>Guardar</button>
                  <button className="btn" onClick={function() { setShowSponsorForm(false); }}>Cancelar</button>
                </div>
              </div>
            )}

            {monthSponsors.length === 0 && (
              <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: "32px", height: "32px", margin: "0 auto 8px", display: "block", opacity: 0.3 }}>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                No hay sponsors este mes. Agrega el primero.
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {monthSponsors.map(function(sp) {
                return (
                  <div key={sp.id} style={{ padding: "12px 14px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "var(--rs)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ flex: 1, fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{sp.name}</div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#16a34a" }}>{"$" + (parseFloat(sp.amount_usd) || 0).toFixed(2)}</div>
                      <button onClick={function() { deleteSponsor(sp.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: "0", lineHeight: 1 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "13px", height: "13px" }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
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
              <div className="card-t">Ventas de Entradas</div>
              <div className="card-sub">{totalTicketsQty + " entradas · $" + totalTickets.toFixed(2) + " recibido"}</div>
            </div>
            <button className="btn" onClick={function() { setShowTicketForm(function(v) { return !v; }); }} style={{ padding: "6px 14px" }}>+ Agregar</button>
          </div>
          <div className="card-b">
            <div className="summary-bar" style={{ marginBottom: "16px" }}>
              <div className="summary-item"><div className="summary-label">Recibido</div><div className="summary-value" style={{ color: "var(--green)" }}>{"$" + totalTickets.toFixed(2)}</div></div>
              <div className="summary-spacer" />
              <div className="summary-item"><div className="summary-label">Entradas</div><div className="summary-value">{String(totalTicketsQty)}</div></div>
            </div>

            {showTicketForm && (
              <div style={{ background: "var(--accent-light)", border: "1px solid var(--accent)", borderRadius: "var(--rs)", padding: "14px", marginBottom: "14px", animation: "slideIn 0.2s ease" }}>
                <div className="form-row">
                  <div className="form-group" style={{ gridColumn: "span 2" }}>
                    <label className="form-label">Comprador</label>
                    <input className="form-input" value={ticketForm.buyer} onChange={function(e) { setTicketForm({ buyer: e.target.value, quantity: ticketForm.quantity, price: ticketForm.price }); }} placeholder="Ej: Maria Perez" onKeyDown={function(e) { if (e.key === "Enter") addTicketSale(); }} autoFocus />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cantidad</label>
                    <input className="form-input" type="text" inputMode="numeric" value={ticketForm.quantity} onChange={function(e) { setTicketForm({ buyer: ticketForm.buyer, quantity: e.target.value, price: ticketForm.price }); }} placeholder="0" onKeyDown={function(e) { if (e.key === "Enter") addTicketSale(); }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Precio x Entrada ($)</label>
                    <input className="form-input" type="text" inputMode="decimal" value={ticketForm.price} onChange={function(e) { setTicketForm({ buyer: ticketForm.buyer, quantity: ticketForm.quantity, price: e.target.value }); }} placeholder="0.00" onKeyDown={function(e) { if (e.key === "Enter") addTicketSale(); }} />
                  </div>
                </div>
                {parseInt(ticketForm.quantity, 10) > 0 && parseFloat(ticketForm.price) > 0 && (
                  <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "8px" }}>{"Total: "}<strong style={{ color: "#16a34a" }}>{"$" + (parseInt(ticketForm.quantity, 10) * parseFloat(ticketForm.price)).toFixed(2)}</strong></div>
                )}
                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                  <button className="btn btn-primary" onClick={addTicketSale}>Guardar</button>
                  <button className="btn" onClick={function() { setShowTicketForm(false); }}>Cancelar</button>
                </div>
              </div>
            )}

            {monthTickets.length === 0 && (
              <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: "32px", height: "32px", margin: "0 auto 8px", display: "block", opacity: 0.3 }}>
                  <path d="M3 7v2a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z"/><path d="M13 5v14"/>
                </svg>
                No hay ventas de entradas este mes. Agrega la primera.
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {monthTickets.map(function(t) {
                var qty = parseInt(t.quantity, 10) || 0;
                var price = parseFloat(t.price_usd) || 0;
                return (
                  <div key={t.id} style={{ padding: "12px 14px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "var(--rs)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{t.buyer}</div>
                        <div style={{ fontSize: "11px", color: "var(--muted)" }}>{qty + " x $" + price.toFixed(2)}</div>
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#16a34a" }}>{"$" + (qty * price).toFixed(2)}</div>
                      <button onClick={function() { deleteTicketSale(t.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: "0", lineHeight: 1 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "13px", height: "13px" }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        </div>

        {/* ROW 7: Proximas Decisiones */}
        <div className="card">
          <div className="card-h">
            <div>
              <div className="card-t">Proximas Decisiones</div>
              <div className="card-sub">{decisions.filter(function(d) { return d.status === "Pendiente"; }).length + " pendientes \u00B7 " + decisions.filter(function(d) { return d.status === "Completado"; }).length + " completadas \u00B7 " + decisions.filter(function(d) { return d.status === "Descartado"; }).length + " descartadas"}</div>
            </div>
            <button className="btn" onClick={function() { setShowDecForm(function(v) { return !v; }); }} style={{ padding: "6px 14px" }}>+ Agregar</button>
          </div>
          <div className="card-b">
            {showDecForm && (
              <div style={{ background: "var(--accent-light)", border: "1px solid var(--accent)", borderRadius: "var(--rs)", padding: "14px", marginBottom: "14px", animation: "slideIn 0.2s ease" }}>
                <div className="form-row">
                  <div className="form-group" style={{ gridColumn: "span 2" }}>
                    <label className="form-label">Descripcion</label>
                    <input className="form-input" value={decForm.text} onChange={setD("text")} placeholder="Ej: Evaluar nuevo proveedor de empaques" onKeyDown={function(e) { if (e.key === "Enter") addDecision(); }} autoFocus />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Prioridad</label>
                    <select className="form-input" value={decForm.priority} onChange={setD("priority")}>
                      <option>Alta</option>
                      <option>Media</option>
                      <option>Baja</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                  <button className="btn btn-primary" onClick={addDecision}>Guardar</button>
                  <button className="btn" onClick={function() { setShowDecForm(false); }}>Cancelar</button>
                </div>
              </div>
            )}

            {decisions.length === 0 && (
              <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: "32px", height: "32px", margin: "0 auto 8px", display: "block", opacity: 0.3 }}>
                  <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                </svg>
                No hay decisiones pendientes
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px" }}>
              {decisions.map(function(dec, decIdx) {
                var st = DEC_STATUS_STYLES[dec.status] || DEC_STATUS_STYLES["Pendiente"];
                var tasks = dec.tasks || [];
                var progress = getDecProgress(dec);
                var showTaskInput = taskInput.decId === dec.id;
                var taskColors = { "Pendiente": "var(--accent)", "Completado": "var(--green)", "Descartado": "var(--muted)" };
                return (
                  <div key={dec.id} draggable={true} onDragStart={function() { setDragIdx(decIdx); }} onDragOver={function(e) { e.preventDefault(); }} onDrop={function() { reorderDecisions(dragIdx, decIdx); setDragIdx(null); }} style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "12px 14px", background: st.bg, border: "1px solid", borderColor: dragIdx === decIdx ? "var(--accent)" : st.border, borderRadius: "var(--rs)", opacity: dragIdx !== null && dragIdx !== decIdx ? 0.6 : st.opacity, transition: "all 0.2s", cursor: "grab" }}>

                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      <div style={{ flex: 1 }}>
                        {editingDec.id === dec.id ? (
                          <input
                            autoFocus
                            className="form-input"
                            style={{ fontSize: "13px", fontWeight: 500, padding: "2px 6px", width: "100%", lineHeight: 1.4 }}
                            value={editingDec.text}
                            onChange={function(e) { setEditingDec({ id: dec.id, text: e.target.value }); }}
                            onBlur={function() { updateDecisionText(dec.id, editingDec.text); }}
                            onKeyDown={function(e) { if (e.key === "Enter") updateDecisionText(dec.id, editingDec.text); if (e.key === "Escape") setEditingDec({ id: null, text: "" }); }}
                          />
                        ) : (
                          <div onClick={function() { setEditingDec({ id: dec.id, text: dec.text }); }} title="Click para editar" style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", textDecoration: st.strike ? "line-through" : "none", lineHeight: 1.4, cursor: "text", borderRadius: "4px", padding: "2px 4px", margin: "-2px -4px" }}>{dec.text}</div>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "5px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 600, color: DEC_PRIORITY_COLORS[dec.priority] || "var(--accent)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{dec.priority}</span>
                          <span style={{ fontSize: "11px", color: "var(--muted)" }}>{dec.date}</span>
                        </div>
                      </div>
                      <button onClick={function() { deleteDecision(dec.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: "0", lineHeight: 1, flexShrink: 0 }} title="Eliminar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "13px", height: "13px" }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>

                    {/* Progress bar */}
                    {progress >= 0 && (
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                          <span style={{ fontSize: "10px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Progreso</span>
                          <span style={{ fontSize: "10px", color: progress === 100 ? "var(--green)" : "var(--accent)", fontWeight: 700 }}>{progress}%</span>
                        </div>
                        <div style={{ height: "4px", background: "#e5e5e5", borderRadius: "99px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: progress + "%", background: progress === 100 ? "var(--green)" : "var(--accent)", borderRadius: "99px", transition: "width 0.3s ease" }} />
                        </div>
                      </div>
                    )}

                    {/* Mini tasks */}
                    {tasks.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {tasks.map(function(t) {
                          return (
                            <div key={t.id} style={{ padding: "5px 8px", background: "rgba(0,0,0,0.03)", borderRadius: "6px" }}>
                              {editingTask.decId === dec.id && editingTask.taskId === t.id ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                                  <input
                                    autoFocus
                                    className="form-input"
                                    style={{ fontSize: "12px", padding: "3px 7px", width: "100%" }}
                                    value={editingTask.text}
                                    onChange={function(e) { setEditingTask({ decId: dec.id, taskId: t.id, text: e.target.value, dueDate: editingTask.dueDate }); }}
                                    onKeyDown={function(e) { if (e.key === "Enter") updateTaskContent(dec.id, t.id, editingTask.text, editingTask.dueDate); if (e.key === "Escape") setEditingTask({ decId: null, taskId: null, text: "", dueDate: "" }); }}
                                  />
                                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                    <span style={{ fontSize: "10px", color: "var(--muted)", whiteSpace: "nowrap" }}>Vence:</span>
                                    <input type="date" className="form-input" style={{ fontSize: "11px", padding: "2px 5px", flex: 1 }} value={editingTask.dueDate} onChange={function(e) { setEditingTask({ decId: dec.id, taskId: t.id, text: editingTask.text, dueDate: e.target.value }); }} />
                                    <button className="btn btn-primary" onClick={function() { updateTaskContent(dec.id, t.id, editingTask.text, editingTask.dueDate); }} style={{ padding: "2px 8px", fontSize: "11px" }}>Guardar</button>
                                    <button className="btn" onClick={function() { setEditingTask({ decId: null, taskId: null, text: "", dueDate: "" }); }} style={{ padding: "2px 7px", fontSize: "11px" }}>✕</button>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <div style={{ flex: 1, cursor: "pointer" }} onClick={function() { setEditingTask({ decId: dec.id, taskId: t.id, text: t.text, dueDate: t.dueDate || "" }); }}>
                                    <div style={{ fontSize: "12px", color: t.status === "Completado" ? "var(--muted)" : "var(--text)", textDecoration: t.status === "Completado" ? "line-through" : "none" }}>{t.text}</div>
                                    <div style={{ fontSize: "10px", marginTop: "2px", color: t.dueDate && t.status !== "Completado" && t.dueDate < new Date().toISOString().split("T")[0] ? "#ef4444" : "var(--muted)", fontWeight: t.dueDate && t.status !== "Completado" && t.dueDate < new Date().toISOString().split("T")[0] ? 600 : 400 }}>
                                      {t.dueDate ? ("Vence: " + t.dueDate) : "+ agregar fecha"}
                                    </div>
                                  </div>
                                  <div style={{ display: "flex", gap: "3px" }}>
                                    {["Pendiente", "Completado", "Descartado"].map(function(s) {
                                      var active = t.status === s;
                                      var short = { "Pendiente": "P", "Completado": "✓", "Descartado": "✕" };
                                      return (
                                        <button key={s} title={s} onClick={function() { setTaskStatus(dec.id, t.id, s); }} style={{ width: "18px", height: "18px", fontSize: "10px", borderRadius: "4px", border: "1px solid", borderColor: active ? taskColors[s] : "#e5e5e5", background: active ? taskColors[s] : "transparent", color: active ? "#fff" : "var(--muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, transition: "all 0.15s", flexShrink: 0 }}>
                                          {short[s]}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <button onClick={function() { deleteTask(dec.id, t.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: "0", lineHeight: 1, flexShrink: 0 }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "11px", height: "11px" }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add task input */}
                    {showTaskInput ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <input
                            autoFocus
                            className="form-input"
                            style={{ flex: 1, fontSize: "12px", padding: "4px 8px" }}
                            placeholder="Nueva tarea..."
                            value={taskInput.text}
                            onChange={function(e) { setTaskInput({ decId: dec.id, text: e.target.value, dueDate: taskInput.dueDate }); }}
                            onKeyDown={function(e) { if (e.key === "Enter") addTask(dec.id); if (e.key === "Escape") setTaskInput({ decId: null, text: "", dueDate: "" }); }}
                          />
                          <button className="btn btn-primary" onClick={function() { addTask(dec.id); }} style={{ padding: "4px 10px", fontSize: "12px" }}>+</button>
                          <button className="btn" onClick={function() { setTaskInput({ decId: null, text: "", dueDate: "" }); }} style={{ padding: "4px 10px", fontSize: "12px" }}>✕</button>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "11px", color: "var(--muted)", whiteSpace: "nowrap" }}>Vence:</span>
                          <input
                            type="date"
                            className="form-input"
                            style={{ fontSize: "11px", padding: "3px 6px", flex: 1 }}
                            value={taskInput.dueDate}
                            onChange={function(e) { setTaskInput({ decId: dec.id, text: taskInput.text, dueDate: e.target.value }); }}
                          />
                        </div>
                      </div>
                    ) : (
                      <button onClick={function() { setTaskInput({ decId: dec.id, text: "" }); }} style={{ background: "none", border: "1px dashed #d1d5db", borderRadius: "6px", padding: "4px 8px", fontSize: "11px", color: "var(--muted)", cursor: "pointer", textAlign: "left", width: "100%" }}>
                        + agregar tarea
                      </button>
                    )}

                    {/* Status buttons */}
                    <div style={{ display: "flex", gap: "6px" }}>
                      {["Pendiente", "Completado", "Descartado"].map(function(s) {
                        var active = dec.status === s;
                        var colors = { "Pendiente": "var(--accent)", "Completado": "var(--green)", "Descartado": "var(--muted)" };
                        return (
                          <button key={s} onClick={function() { setDecisionStatus(dec.id, s); }} style={{ flex: 1, fontSize: "11px", fontWeight: active ? 700 : 500, padding: "4px 0", borderRadius: "4px", border: "1px solid", borderColor: active ? colors[s] : "#e5e5e5", background: active ? colors[s] : "transparent", color: active ? "#fff" : "var(--muted)", cursor: "pointer", transition: "all 0.15s", letterSpacing: "0.02em" }}>
                            {s}
                          </button>
                        );
                      })}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
