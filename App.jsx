import { useState } from "react";
import MommeeBeeApp from "./mommee-bee-app.jsx";
import MommeeVentas from "./mommee-bee-ventas.jsx";
import MommeeInventario from "./mommee-bee-inventario.jsx";
import MommeeImportaciones from "./mommee-bee-importaciones.jsx";
import MommeeReportes from "./mommee-bee-reportes.jsx";
import MommeeClientes from "./mommee-bee-clientes.jsx";

const SIDEBAR_W = 224;

const BeeLogo = () => (
  <svg width="38" height="38" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M44 40 C40 31 35 24 31 18" stroke="#B36A23" strokeWidth="2.2" strokeLinecap="round"/>
    <circle cx="30" cy="16" r="3" fill="#B36A23"/>
    <path d="M56 40 C60 31 65 24 69 18" stroke="#B36A23" strokeWidth="2.2" strokeLinecap="round"/>
    <circle cx="70" cy="16" r="3" fill="#B36A23"/>
    <path d="M50 44 C42 32 22 28 18 38 C15 46 26 52 40 48 C46 46 50 44 50 44" stroke="#B36A23" strokeWidth="2" fill="rgba(179,106,35,0.15)"/>
    <path d="M50 44 C42 42 30 42 26 46 C22 50 30 52 42 50" stroke="#B36A23" strokeWidth="1.2" fill="none"/>
    <path d="M50 44 C58 32 78 28 82 38 C85 46 74 52 60 48 C54 46 50 44 50 44" stroke="#B36A23" strokeWidth="2" fill="rgba(179,106,35,0.15)"/>
    <path d="M50 44 C58 42 70 42 74 46 C78 50 70 52 58 50" stroke="#B36A23" strokeWidth="1.2" fill="none"/>
    <ellipse cx="50" cy="78" rx="11" ry="19" fill="#B36A23"/>
    <rect x="39" y="71" width="22" height="2.5" rx="1.25" fill="white" opacity="0.85"/>
    <rect x="39" y="77" width="22" height="2.5" rx="1.25" fill="white" opacity="0.85"/>
    <rect x="39" y="83" width="22" height="2.5" rx="1.25" fill="white" opacity="0.85"/>
    <path d="M44 95 L50 106 L56 95" fill="#B36A23"/>
    <ellipse cx="50" cy="47" rx="7" ry="6" fill="#4C5155"/>
  </svg>
);

const IconDashboard = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
    <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
  </svg>
);
const IconSales = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 01-8 0"/>
  </svg>
);
const IconInventory = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);
const IconImports = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
    <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);
const IconClients = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
);
const IconReports = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);

const NAV_ITEMS = [
  { key: "Dashboard", label: "Dashboard", Icon: IconDashboard },
  { key: "Sales",     label: "Sales",     Icon: IconSales     },
  { key: "Inventory", label: "Inventory", Icon: IconInventory },
  { key: "Imports",   label: "Imports",   Icon: IconImports   },
  { key: "Clients",   label: "Clients",   Icon: IconClients   },
  { key: "Reports",   label: "Reports",   Icon: IconReports   },
];

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Bebas+Neue&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-thumb { background: #D9CCBD; border-radius: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }

  @keyframes dotBreathe    { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.4);opacity:0.6} }
  @keyframes moduleEnter   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes sidebarFadeIn { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
  @keyframes logoGlow      { 0%,100%{filter:drop-shadow(0 0 6px rgba(179,106,35,0))} 50%{filter:drop-shadow(0 0 12px rgba(179,106,35,0.5))} }

  .sb-item {
    width:100%; display:flex; align-items:center; gap:11px;
    padding:10px 14px; margin-bottom:3px;
    background:transparent; border:none;
    border-left:3px solid transparent; border-radius:9px;
    cursor:pointer; font-family:'DM Sans',sans-serif;
    font-size:13px; font-weight:500;
    color:#777; text-align:left; letter-spacing:0.02em;
    transition:background 0.2s cubic-bezier(.4,0,.2,1),
               color 0.2s cubic-bezier(.4,0,.2,1),
               border-color 0.2s cubic-bezier(.4,0,.2,1),
               transform 0.15s cubic-bezier(.4,0,.2,1),
               box-shadow 0.2s cubic-bezier(.4,0,.2,1);
    position:relative; overflow:hidden;
  }
  .sb-item::after {
    content:''; position:absolute; inset:0;
    background:linear-gradient(90deg, rgba(179,106,35,0.08) 0%, transparent 70%);
    opacity:0; transition:opacity 0.25s ease; border-radius:9px;
  }
  .sb-item:hover { background:rgba(255,255,255,0.04); color:#bbb; transform:translateX(3px); }
  .sb-item:hover svg { stroke:#bbb; }
  .sb-item.active {
    background:linear-gradient(90deg, rgba(179,106,35,0.18) 0%, rgba(179,106,35,0.05) 100%);
    color:#B36A23; border-left-color:#B36A23; font-weight:700;
    box-shadow:0 2px 12px rgba(179,106,35,0.15);
  }
  .sb-item.active::after { opacity:1; }
  .sb-item.active svg { stroke:#B36A23; filter:drop-shadow(0 0 4px rgba(179,106,35,0.5)); }
  .sb-item svg { flex-shrink:0; transition:stroke 0.2s, filter 0.2s; }

  .module-page { animation: moduleEnter 0.22s cubic-bezier(.4,0,.2,1) both; }
  .sidebar-animate { animation: sidebarFadeIn 0.3s cubic-bezier(.4,0,.2,1) both; }

  .module-content table tbody tr { transition:background 0.12s ease !important; }
  .module-content table tbody tr:hover { background:rgba(179,106,35,0.04) !important; }
  .module-content table thead th { border-bottom:2px solid #d0d0cf !important; letter-spacing:0.06em !important; }

  .module-content input, .module-content select, .module-content textarea {
    transition:border-color 0.18s ease, box-shadow 0.18s ease !important;
  }
  .module-content input:focus, .module-content select:focus {
    border-color:#B36A23 !important;
    box-shadow:0 0 0 3px rgba(179,106,35,0.12) !important;
    outline:none !important;
  }
  .module-content button {
    transition:background 0.15s ease, color 0.15s ease,
               transform 0.12s ease, box-shadow 0.15s ease !important;
  }
  .module-content button:active { transform:scale(0.97) !important; }
`;

export default function App() {
  const [activeModule, setActiveModule] = useState("Dashboard");
  const [clients, setClients] = useState([]);

  const renderModule = () => {
    const props = { onNavigate: setActiveModule, activeModule, clients, setClients };
    switch (activeModule) {
      case "Sales":     return <MommeeVentas {...props} />;
      case "Inventory": return <MommeeInventario {...props} />;
      case "Imports":   return <MommeeImportaciones {...props} />;
      case "Clients":   return <MommeeClientes {...props} />;
      case "Reports":   return <MommeeReportes {...props} />;
      default:          return <MommeeBeeApp {...props} />;
    }
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ display: "flex", minHeight: "100vh", background: "#EDEFEA" }}>

        {/* ── SIDEBAR ── */}
        <aside
          className="sidebar-animate"
          style={{
            width: `${SIDEBAR_W}px`, minWidth: `${SIDEBAR_W}px`,
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
            background: "linear-gradient(180deg,rgba(179,106,35,0.05) 0%,transparent 100%)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
              <div style={{ animation: "logoGlow 4s ease-in-out infinite", flexShrink: 0 }}>
                <BeeLogo />
              </div>
              <div>
                <div style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "17px", letterSpacing: "0.18em",
                  color: "#B36A23", lineHeight: 1,
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
            {NAV_ITEMS.map(({ key, label, Icon }) => (
              <button
                key={key}
                className={`sb-item${activeModule === key ? " active" : ""}`}
                onClick={() => setActiveModule(key)}
              >
                <Icon />
                <span>{label}</span>
                {activeModule === key && (
                  <div style={{
                    marginLeft: "auto", width: "5px", height: "5px",
                    borderRadius: "50%", background: "#B36A23",
                    boxShadow: "0 0 6px rgba(179,106,35,0.8)", flexShrink: 0,
                  }} />
                )}
              </button>
            ))}
          </nav>

          {/* Live status */}
          <div style={{
            padding: "16px 18px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            background: "linear-gradient(0deg,rgba(0,0,0,0.15) 0%,transparent 100%)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <div style={{
                width: "7px", height: "7px", background: "#16a34a", borderRadius: "50%",
                animation: "dotBreathe 2.5s ease-in-out infinite",
                boxShadow: "0 0 6px rgba(22,163,74,0.6)",
              }} />
              <span style={{ fontSize: "10px", color: "#4a4a4a" }}>Live · Supabase</span>
            </div>
            <div style={{ fontSize: "9px", color: "#333", letterSpacing: "0.08em" }}>MOMMEE BEE v1.0</div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <div
          className="module-content"
          style={{ marginLeft: `${SIDEBAR_W}px`, flex: 1, minWidth: 0, overflowX: "hidden" }}
        >
          <div key={activeModule} className="module-page" style={{ padding: "24px 28px" }}>
            {renderModule()}
          </div>
        </div>

      </div>
    </>
  );
}
