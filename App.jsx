import { useState } from "react";
import MommeeBeeApp from "./mommee-bee-app.jsx";
import MommeeVentas from "./mommee-bee-ventas.jsx";
import MommeeInventario from "./mommee-bee-inventario.jsx";
import MommeeImportaciones from "./mommee-bee-importaciones.jsx";
import MommeeReportes from "./mommee-bee-reportes.jsx";
import MommeeClientes from "./mommee-bee-clientes.jsx";

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

var NAV_ITEMS = [
  {
    key: "Dashboard", label: "Dashboard",
    icon: function() {
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
    },
  },
  {
    key: "Sales", label: "Ventas",
    icon: function() {
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
    },
  },
  {
    key: "Inventory", label: "Inventario",
    icon: function() {
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
    },
  },
  {
    key: "Imports", label: "Importaciones",
    icon: function() {
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="6" width="22" height="12" rx="2"/><path d="M1 10h22"/><path d="M6 14h4"/></svg>;
    },
  },
  {
    key: "Clients", label: "Clientes",
    icon: function() {
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
    },
  },
  {
    key: "Reports", label: "Reportes",
    icon: function() {
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
    },
  },
];

export default function App() {
  var activeModule = useState("Dashboard");
  var setActiveModule = activeModule[1];
  activeModule = activeModule[0];
  var clientsState = useState([]);
  var clients = clientsState[0];
  var setClients = clientsState[1];

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
  var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var dateStr = months[now.getMonth()] + " " + (now.getDate() < 10 ? "0" : "") + now.getDate() + ", " + now.getFullYear();

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
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>

      {/* SIDEBAR */}
      <aside
        className="sidebar-animate"
        style={{
          width: "240px", minWidth: "240px",
          background: "linear-gradient(180deg, #1d1d1f 0%, #161617 100%)",
          display: "flex", flexDirection: "column",
          position: "fixed", top: 0, left: 0, height: "100vh",
          zIndex: 300,
          borderRight: "1px solid rgba(255,255,255,.04)",
        }}
      >
        {/* Logo */}
        <div style={{ padding: "28px 28px 36px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "10px",
            background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden",
          }}>
            <BeeLogo />
          </div>
          <div>
            <div style={{
              fontSize: "19px", fontWeight: 600, letterSpacing: "-0.03em",
              color: "#fff", lineHeight: 1,
            }}>
              MOMMEE<span style={{ color: "var(--accent)", fontWeight: 400 }}>BEE</span>
            </div>
          </div>
        </div>

        {/* Menu label */}
        <div style={{
          fontFamily: "var(--mono)", fontSize: "9px", textTransform: "uppercase",
          letterSpacing: "0.14em", color: "rgba(255,255,255,0.2)",
          padding: "0 28px 10px",
        }}>
          Menu
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1 }}>
          {NAV_ITEMS.map(function(item) {
            return (
              <button
                key={item.key}
                className={"sb-item" + (activeModule === item.key ? " active" : "")}
                onClick={function() { setActiveModule(item.key); }}
              >
                {item.icon()}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User profile */}
        <div style={{
          padding: "14px 28px 18px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
            <div style={{
              width: "34px", height: "34px", borderRadius: "50%",
              background: "var(--accent)", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 600, color: "#1a1a1a",
            }}>
              MB
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: "12px", fontWeight: 500, color: "#fff",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                Mommee Bee
              </div>
              <div style={{
                fontFamily: "var(--mono)", fontSize: "9px",
                color: "rgba(255,255,255,0.35)", textTransform: "uppercase",
                letterSpacing: "0.1em", marginTop: "2px",
              }}>
                Conectado
              </div>
            </div>
            <div style={{
              width: "7px", height: "7px", borderRadius: "50%",
              background: "var(--accent)", animation: "pulse 3s ease-in-out infinite",
              flexShrink: 0,
            }} />
          </div>
          <button style={{
            width: "100%", padding: "8px", borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.1)", background: "transparent",
            color: "rgba(255,255,255,0.4)", fontFamily: "var(--mono)",
            fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em",
            cursor: "pointer", transition: "0.2s",
          }}>
            Cerrar sesion
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="module-content" style={{ marginLeft: "240px", flex: 1, minWidth: 0, overflowX: "hidden" }}>
        <div key={activeModule} className="module-page">
          {renderModule()}
        </div>
      </div>
    </div>
  );
}
