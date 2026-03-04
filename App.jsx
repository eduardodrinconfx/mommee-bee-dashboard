import { useState } from "react";
import MommeeBeeApp from "./mommee-bee-app.jsx";
import MommeeVentas from "./mommee-bee-ventas.jsx";
import MommeeInventario from "./mommee-bee-inventario.jsx";
import MommeeImportaciones from "./mommee-bee-importaciones.jsx";
import MommeeReportes from "./mommee-bee-reportes.jsx";

const C = {
  primary: "#B36A23",
  dark: "#4C5155",
  bg: "#EDEFEA",
  surface: "#ffffff",
  border: "#d0d0cf",
  darkGray: "#1a1a1a",
  medGray: "#4a4a4a",
  mutedGray: "#888888",
  beige: "#D9CCBD",
};

const BeeLogo = ({ size }) => {
  const w = size || 38;
  return (
    <svg viewBox="0 0 100 120" width={w} height={w * 1.2} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M44 40 C40 31 35 24 31 18" stroke={C.dark} strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx="30" cy="16" r="3" fill={C.dark}/>
      <path d="M56 40 C60 31 65 24 69 18" stroke={C.dark} strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx="70" cy="16" r="3" fill={C.dark}/>
      <path d="M50 44 C42 32 22 28 18 38 C15 46 26 52 40 48 C46 46 50 44 50 44" stroke={C.dark} strokeWidth="2" fill="rgba(179,106,35,0.1)"/>
      <path d="M50 44 C42 42 30 42 26 46 C22 50 30 52 42 50" stroke={C.dark} strokeWidth="1.2" fill="none"/>
      <path d="M50 44 C58 32 78 28 82 38 C85 46 74 52 60 48 C54 46 50 44 50 44" stroke={C.dark} strokeWidth="2" fill="rgba(179,106,35,0.1)"/>
      <path d="M50 44 C58 42 70 42 74 46 C78 50 70 52 58 50" stroke={C.dark} strokeWidth="1.2" fill="none"/>
      <ellipse cx="50" cy="78" rx="11" ry="19" fill={C.primary}/>
      <rect x="39" y="71" width="22" height="2.5" rx="1.25" fill="white" opacity="0.85"/>
      <rect x="39" y="77" width="22" height="2.5" rx="1.25" fill="white" opacity="0.85"/>
      <rect x="39" y="83" width="22" height="2.5" rx="1.25" fill="white" opacity="0.85"/>
      <path d="M44 95 L50 106 L56 95" fill={C.primary}/>
      <ellipse cx="50" cy="47" rx="7" ry="6" fill={C.dark}/>
    </svg>
  );
};

const NAV_ITEMS = [
  { key: "Dashboard", label: "Dashboard" },
  { key: "Sales", label: "Sales" },
  { key: "Inventory", label: "Inventory" },
  { key: "Imports", label: "Imports" },
  { key: "Reports", label: "Reports" },
];

export default function App() {
  const [activeModule, setActiveModule] = useState("Dashboard");
  const [clients, setClients] = useState([]);

  const components = {
    Dashboard: MommeeBeeApp,
    Sales: MommeeVentas,
    Inventory: MommeeInventario,
    Imports: MommeeImportaciones,
    Reports: MommeeReportes,
  };

  const ActiveComp = components[activeModule];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif" }}>
      <nav style={{
        background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        padding: "0 28px",
        display: "flex",
        alignItems: "center",
        gap: 32,
        height: 66,
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 2px 12px rgba(76,81,85,0.07)",
      }}>
        <div
          style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", minWidth: 180 }}
          onClick={() => setActiveModule("Dashboard")}
        >
          <BeeLogo size={38} />
          <div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 21,
              letterSpacing: 5,
              color: C.dark,
              lineHeight: 1,
            }}>
              MOMMEE BEE
            </div>
            <div style={{ fontSize: 9, letterSpacing: 3, color: C.primary, textTransform: "uppercase", fontWeight: 700 }}>
              Business Dashboard
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, flex: 1, justifyContent: "center" }}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              onClick={() => setActiveModule(item.key)}
              style={{
                background: activeModule === item.key ? C.primary : "transparent",
                color: activeModule === item.key ? "white" : C.medGray,
                border: activeModule === item.key ? "none" : `1px solid transparent`,
                borderRadius: 8,
                padding: "8px 18px",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: 0.3,
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div style={{
          background: `${C.primary}15`,
          border: `1px solid ${C.primary}40`,
          borderRadius: 20,
          padding: "5px 14px",
          fontSize: 10,
          color: C.primary,
          letterSpacing: 2,
          fontWeight: 700,
          textTransform: "uppercase",
        }}>
          Premium
        </div>
      </nav>

      <div style={{ padding: "24px 28px", maxWidth: 1440, margin: "0 auto" }}>
        <ActiveComp
          onNavigate={setActiveModule}
          activeModule={activeModule}
          clients={clients}
          setClients={setClients}
        />
      </div>
    </div>
  );
}
