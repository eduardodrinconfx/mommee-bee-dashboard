import { useState } from "react";
import MommeeBeeApp from "./mommee-bee-app.jsx";
import MommeeVentas from "./mommee-bee-ventas.jsx";
import MommeeInventario from "./mommee-bee-inventario.jsx";
import MommeeImportaciones from "./mommee-bee-importaciones.jsx";
import MommeeReportes from "./mommee-bee-reportes.jsx";
import MommeeClientes from "./mommee-bee-clientes.jsx";

var SIDEBAR_W = 240;

var BeeLogo = function() {
  return (
    <svg width="38" height="38" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M44 40 C40 31 35 24 31 18" stroke="#CC9F75" strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx="30" cy="16" r="3" fill="#CC9F75"/>
      <path d="M56 40 C60 31 65 24 69 18" stroke="#CC9F75" strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx="70" cy="16" r="3" fill="#CC9F75"/>
      <path d="M50 44 C42 32 22 28 18 38 C15 46 26 52 40 48 C46 46 50 44 50 44" stroke="#CC9F75" strokeWidth="2" fill="rgba(204,159,117,0.15)"/>
      <path d="M50 44 C42 42 30 42 26 46 C22 50 30 52 42 50" stroke="#CC9F75" strokeWidth="1.2" fill="none"/>
      <path d="M50 44 C58 32 78 28 82 38 C85 46 74 52 60 48 C54 46 50 44 50 44" stroke="#CC9F75" strokeWidth="2" fill="rgba(204,159,117,0.15)"/>
      <path d="M50 44 C58 42 70 42 74 46 C78 50 70 52 58 50" stroke="#CC9F75" strokeWidth="1.2" fill="none"/>
      <ellipse cx="50" cy="78" rx="11" ry="19" fill="#B36A23"/>
      <rect x="39" y="71" width="22" height="2.5" rx="1.25" fill="white" opacity="0.85"/>
      <rect x="39" y="77" width="22" height="2.5" rx="1.25" fill="white" opacity="0.85"/>
      <rect x="39" y="83" width="22" height="2.5" rx="1.25" fill="white" opacity="0.85"/>
      <path d="M44 95 L50 106 L56 95" fill="#B36A23"/>
      <ellipse cx="50" cy="47" rx="7" ry="6" fill="#4C5155"/>
    </svg>
  );
};

var IconDashboard = function() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  );
};
var IconSales = function() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 01-8 0"/>
    </svg>
  );
};
var IconInventory = function() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  );
};
var IconImports = function() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  );
};
var IconClients = function() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  );
};
var IconReports = function() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  );
};
var IconSearch = function() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
};
var IconLogout = function() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
};

var NAV_ITEMS = [
  { key: "Dashboard", label: "Dashboard",     Icon: IconDashboard },
  { key: "Sales",     label: "Ventas",         Icon: IconSales     },
  { key: "Inventory", label: "Inventario",     Icon: IconInventory },
  { key: "Imports",   label: "Importaciones",  Icon: IconImports   },
  { key: "Clients",   label: "Clientes",       Icon: IconClients   },
  { key: "Reports",   label: "Reportes",       Icon: IconReports   },
];

var GLOBAL_CSS = "\n\
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Bebas+Neue&display=swap');\n\
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }\n\
  body { font-family: 'DM Sans', sans-serif; }\n\
\n\
  /* Scrollbar */\n\
  ::-webkit-scrollbar { width: 4px; height: 4px; }\n\
  ::-webkit-scrollbar-thumb { background: #D9CCBD; border-radius: 4px; }\n\
  ::-webkit-scrollbar-track { background: transparent; }\n\
\n\
  /* Keyframes */\n\
  @keyframes pulse         { 0%,100%{opacity:1} 50%{opacity:0.3} }\n\
  @keyframes dotBreathe    { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.4);opacity:0.6} }\n\
  @keyframes moduleEnter   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }\n\
  @keyframes sidebarFadeIn { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }\n\
  @keyframes logoGlow      { 0%,100%{filter:drop-shadow(0 0 6px rgba(204,159,117,0))} 50%{filter:drop-shadow(0 0 12px rgba(204,159,117,0.45))} }\n\
  @keyframes slideIn       { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }\n\
  @keyframes fadeIn        { from{opacity:0} to{opacity:1} }\n\
  @keyframes pop           { 0%{transform:scale(0.95);opacity:0} 100%{transform:scale(1);opacity:1} }\n\
\n\
  /* Sidebar nav button */\n\
  .sb-item {\n\
    width:100%; display:flex; align-items:center; gap:11px;\n\
    padding:10px 14px; margin-bottom:3px;\n\
    background:transparent; border:none;\n\
    border-left:3px solid transparent; border-radius:9px;\n\
    cursor:pointer; font-family:'DM Sans',sans-serif;\n\
    font-size:13px; font-weight:500;\n\
    color:#666; text-align:left; letter-spacing:0.02em;\n\
    transition:background 0.2s cubic-bezier(.4,0,.2,1),\n\
               color 0.2s cubic-bezier(.4,0,.2,1),\n\
               border-color 0.2s cubic-bezier(.4,0,.2,1),\n\
               transform 0.15s cubic-bezier(.4,0,.2,1),\n\
               box-shadow 0.2s cubic-bezier(.4,0,.2,1);\n\
    position:relative; overflow:hidden;\n\
  }\n\
  .sb-item::after {\n\
    content:''; position:absolute; inset:0;\n\
    background:linear-gradient(90deg, rgba(204,159,117,0.08) 0%, transparent 70%);\n\
    opacity:0; transition:opacity 0.25s ease; border-radius:9px;\n\
  }\n\
  .sb-item:hover { background:rgba(255,255,255,0.055); color:#bbb; transform:translateX(3px); }\n\
  .sb-item:hover svg { stroke:#bbb; }\n\
  .sb-item.active {\n\
    background:linear-gradient(90deg, rgba(204,159,117,0.18) 0%, rgba(204,159,117,0.05) 100%);\n\
    color:#CC9F75; border-left-color:#CC9F75; font-weight:700;\n\
    box-shadow:0 2px 12px rgba(204,159,117,0.15);\n\
  }\n\
  .sb-item.active::after { opacity:1; }\n\
  .sb-item.active svg { stroke:#CC9F75; filter:drop-shadow(0 0 4px rgba(204,159,117,0.5)); }\n\
  .sb-item svg { flex-shrink:0; transition:stroke 0.2s, filter 0.2s; }\n\
\n\
  /* Module animations */\n\
  .module-page { animation: moduleEnter 0.22s cubic-bezier(.4,0,.2,1) both; }\n\
  .sidebar-animate { animation: sidebarFadeIn 0.3s cubic-bezier(.4,0,.2,1) both; }\n\
\n\
  /* Global table improvements */\n\
  .module-content table tbody tr { transition:background 0.12s ease !important; }\n\
  .module-content table tbody tr:hover { background:rgba(204,159,117,0.04) !important; }\n\
  .module-content table thead th { border-bottom:2px solid #d0d0cf !important; letter-spacing:0.06em !important; }\n\
\n\
  /* Inputs & buttons */\n\
  .module-content input, .module-content select, .module-content textarea {\n\
    transition:border-color 0.18s ease, box-shadow 0.18s ease !important;\n\
  }\n\
  .module-content input:focus, .module-content select:focus, .module-content textarea:focus {\n\
    border-color:#CC9F75 !important;\n\
    box-shadow:0 0 0 3px rgba(204,159,117,0.15) !important;\n\
    outline:none !important;\n\
  }\n\
  input::placeholder { color:#bbb; }\n\
  select option { background:#fff; color:#1a1a1a; }\n\
\n\
  .module-content button {\n\
    transition:background 0.15s ease, color 0.15s ease, border-color 0.15s ease,\n\
               transform 0.12s ease, box-shadow 0.15s ease !important;\n\
  }\n\
  .module-content button:active { transform:scale(0.97) !important; }\n\
\n\
  /* Button variants */\n\
  .btn-primary:hover { background:#b8895f !important; transform:translateY(-1px); box-shadow:0 4px 16px rgba(204,159,117,0.3) !important; }\n\
  .btn-ghost:hover { border-color:#CC9F75 !important; color:#CC9F75 !important; }\n\
  .btn-accent:hover { background:#a05c1c !important; transform:translateY(-1px); box-shadow:0 4px 16px rgba(179,106,35,0.3) !important; }\n\
\n\
  /* Row hover */\n\
  .row-hover:hover { background:#f8f8f7 !important; }\n\
  .exp-row:hover { background:#f8f8f7 !important; }\n\
  .alert-row:hover { background:#f0f0ef !important; cursor:default; }\n\
\n\
  /* Toggle / Tab buttons */\n\
  .toggle-btn:hover { opacity:0.85; }\n\
\n\
  /* Search bar */\n\
  .header-search { transition:border-color 0.2s, box-shadow 0.2s; }\n\
  .header-search:focus { border-color:#CC9F75 !important; box-shadow:0 0 0 3px rgba(204,159,117,0.15) !important; outline:none; }\n\
\n\
  /* Logout button */\n\
  .logout-btn { transition:all 0.15s ease !important; }\n\
  .logout-btn:hover { background:rgba(220,38,38,0.12) !important; color:#dc2626 !important; border-color:rgba(220,38,38,0.3) !important; }\n\
";

export default function App() {
  var activeModule = useState("Dashboard");
  var setActiveModule = activeModule[1];
  activeModule = activeModule[0];
  var clientsState = useState([]);
  var clients = clientsState[0];
  var setClients = clientsState[1];
  var searchState = useState("");
  var searchVal = searchState[0];
  var setSearchVal = searchState[1];

  var renderModule = function() {
    var props = { onNavigate: setActiveModule, activeModule: activeModule, clients: clients, setClients: setClients };
    switch (activeModule) {
      case "Sales":     return <MommeeVentas {...props} />;
      case "Inventory": return <MommeeInventario {...props} />;
      case "Imports":   return <MommeeImportaciones {...props} />;
      case "Clients":   return <MommeeClientes {...props} />;
      case "Reports":   return <MommeeReportes {...props} />;
      default:          return <MommeeBeeApp {...props} />;
    }
  };

  var now = new Date();
  var dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  var moduleTitle = function() {
    switch (activeModule) {
      case "Sales": return "Ventas";
      case "Inventory": return "Inventario";
      case "Imports": return "Importaciones";
      case "Clients": return "Clientes";
      case "Reports": return "Reportes";
      default: return "Dashboard";
    }
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ display: "flex", minHeight: "100vh", background: "#EDEFEA" }}>

        {/* SIDEBAR */}
        <aside
          className="sidebar-animate"
          style={{
            width: SIDEBAR_W + "px", minWidth: SIDEBAR_W + "px",
            background: "linear-gradient(180deg, #1c1c1c 0%, #161616 100%)",
            display: "flex", flexDirection: "column",
            position: "fixed", top: 0, left: 0, height: "100vh",
            zIndex: 300,
            boxShadow: "4px 0 30px rgba(0,0,0,0.35)",
            borderRight: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          {/* Logo area */}
          <div style={{
            padding: "22px 18px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "linear-gradient(180deg,rgba(204,159,117,0.05) 0%,transparent 100%)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
              <div style={{ animation: "logoGlow 4s ease-in-out infinite", flexShrink: 0 }}>
                <BeeLogo />
              </div>
              <div>
                <div style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "17px", letterSpacing: "0.18em",
                  color: "#CC9F75", lineHeight: 1,
                }}>
                  MOMMEE BEE
                </div>
                <div style={{
                  fontSize: "8px", color: "#4a4a4a",
                  letterSpacing: "0.22em", textTransform: "uppercase", marginTop: "4px",
                }}>
                  Business Dashboard
                </div>
              </div>
            </div>
          </div>

          {/* Section divider */}
          <div style={{ padding: "20px 18px 8px" }}>
            <div style={{
              fontSize: "9px", color: "#3a3a3a", fontWeight: 700,
              letterSpacing: "0.2em", textTransform: "uppercase",
              display: "flex", alignItems: "center", gap: "8px",
            }}>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.05)" }} />
              MENU
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.05)" }} />
            </div>
          </div>

          {/* Nav items */}
          <nav style={{ flex: 1, padding: "0 10px", display: "flex", flexDirection: "column" }}>
            {NAV_ITEMS.map(function(item) {
              var key = item.key;
              var label = item.label;
              var Icon = item.Icon;
              return (
                <button
                  key={key}
                  className={"sb-item" + (activeModule === key ? " active" : "")}
                  onClick={function() { setActiveModule(key); }}
                >
                  <Icon />
                  <span>{label}</span>
                  {activeModule === key && (
                    <div style={{
                      marginLeft: "auto", width: "5px", height: "5px",
                      borderRadius: "50%", background: "#CC9F75",
                      boxShadow: "0 0 6px rgba(204,159,117,0.8)", flexShrink: 0,
                    }} />
                  )}
                </button>
              );
            })}
          </nav>

          {/* User profile section */}
          <div style={{
            padding: "16px 14px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            background: "linear-gradient(0deg,rgba(0,0,0,0.2) 0%,transparent 100%)",
          }}>
            {/* User info */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div style={{
                width: "34px", height: "34px", borderRadius: "50%",
                background: "linear-gradient(135deg, #CC9F75, #B36A23)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "13px", fontWeight: 700, color: "#fff",
                boxShadow: "0 2px 8px rgba(204,159,117,0.4)",
                flexShrink: 0,
              }}>
                MB
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "12px", color: "#ccc", fontWeight: 600, lineHeight: 1.2 }}>Mommee Bee</div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "3px" }}>
                  <div style={{
                    width: "6px", height: "6px", background: "#16a34a", borderRadius: "50%",
                    animation: "dotBreathe 2.5s ease-in-out infinite",
                    boxShadow: "0 0 4px rgba(22,163,74,0.5)",
                  }} />
                  <span style={{ fontSize: "9px", color: "#16a34a", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Conectado</span>
                </div>
              </div>
            </div>

            {/* Logout button */}
            <button
              className="logout-btn"
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px", padding: "8px 12px",
                color: "#666", fontSize: "11px", fontWeight: 600,
                letterSpacing: "0.1em", textTransform: "uppercase",
                cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
              }}
            >
              <IconLogout />
              Cerrar Sesion
            </button>

            {/* Version */}
            <div style={{ fontSize: "9px", color: "#333", letterSpacing: "0.08em", marginTop: "10px", textAlign: "center" }}>MOMMEE BEE v1.0</div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <div
          className="module-content"
          style={{ marginLeft: SIDEBAR_W + "px", flex: 1, minWidth: 0, overflowX: "hidden" }}
        >
          {/* Top header bar */}
          <div style={{
            padding: "16px 28px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            borderBottom: "1px solid #d0d0cf",
            background: "#fff",
            position: "sticky", top: 0, zIndex: 200,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <h2 style={{
                fontFamily: "'Bebas Neue',sans-serif", fontSize: "22px",
                letterSpacing: "0.06em", color: "#1a1a1a", margin: 0, lineHeight: 1,
              }}>{moduleTitle()}</h2>
              <span style={{
                background: "#CC9F75", color: "#fff",
                padding: "3px 12px", borderRadius: "20px",
                fontSize: "10px", fontWeight: 700, letterSpacing: "0.04em",
              }}>{dateStr}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#999", pointerEvents: "none" }}>
                  <IconSearch />
                </div>
                <input
                  className="header-search"
                  type="text"
                  placeholder="Buscar..."
                  value={searchVal}
                  onChange={function(e) { setSearchVal(e.target.value); }}
                  style={{
                    width: "220px", padding: "8px 12px 8px 32px",
                    border: "1px solid #d0d0cf", borderRadius: "8px",
                    fontSize: "12px", fontFamily: "'DM Sans',sans-serif",
                    color: "#1a1a1a", background: "#f8f8f7",
                    outline: "none",
                  }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{
                  width: "7px", height: "7px", background: "#16a34a", borderRadius: "50%",
                  animation: "dotBreathe 2.5s ease-in-out infinite",
                  boxShadow: "0 0 6px rgba(22,163,74,0.6)",
                }} />
                <span style={{ fontSize: "11px", color: "#888" }}>Live</span>
              </div>
            </div>
          </div>

          <div key={activeModule} className="module-page" style={{ padding: "24px 28px" }}>
            {renderModule()}
          </div>
        </div>

      </div>
    </>
  );
}
