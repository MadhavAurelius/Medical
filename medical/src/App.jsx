import { useState } from "react";
import Login from "../login/login.jsx";
import Signup from "../login/signup.jsx";
import MedicalBilling from "../Billing/MedicalBilling.jsx";
import InventoryAlerts from "../expire/InventoryAlerts.jsx";

function App() {
  const [showLogin, setShowLogin] = useState(true);
  // ✅ FIX 1: Lazy initializer — reads localStorage synchronously on first render
  //    so token is never briefly "" before the component mounts
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [page, setPage]   = useState("billing");

  // Decode role from JWT payload
  const role = (() => {
    try { return JSON.parse(atob(token.split(".")[1])).role || "cashier"; }
    catch { return "cashier"; }
  })();

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!token) {
    return showLogin
      ? <Login    setToken={setToken} switchToSignup={() => setShowLogin(false)} />
      : <Signup   switchToLogin={() => setShowLogin(true)} />;
  }

  // ── Logged in ──────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f0" }}>

      {/* ── Top Nav ─────────────────────────────────────────────────────── */}
      <nav style={{
        background: "#1a6b3c", padding: "0 28px",
        display: "flex", alignItems: "center", height: 52, gap: 8,
        position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 2px 8px rgba(0,0,0,.15)",
      }}>
        <span style={{
          fontFamily: "'DM Serif Display',serif", fontSize: 18,
          color: "#fff", marginRight: 20,
        }}>
          🏥 MedBill
        </span>

        {[
          { id: "billing",   label: "🧾 Billing & Dashboard" },
          { id: "inventory", label: "💊 Inventory & Alerts"  },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setPage(id)}
            style={{
              padding: "5px 14px", borderRadius: 7, border: "none", cursor: "pointer",
              fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13,
              background: page === id ? "rgba(255,255,255,.2)" : "transparent",
              color:      page === id ? "#fff" : "rgba(255,255,255,.65)",
              transition: "all .15s",
            }}
          >
            {label}
          </button>
        ))}

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,.6)" }}>{role}</span>
          <button
            onClick={() => { localStorage.removeItem("token"); setToken(""); }}
            style={{
              padding: "5px 14px", borderRadius: 7,
              border: "1px solid rgba(255,255,255,.3)",
              background: "transparent", color: "rgba(255,255,255,.8)",
              cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
              fontWeight: 600, fontSize: 12,
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* ── Pages ───────────────────────────────────────────────────────── */}
      {/* ✅ FIX 2: Pass token to MedicalBilling */}
      {page === "billing" && (
        <MedicalBilling token={token} setToken={setToken} />
      )}

      {/* ✅ FIX 3: Pass token to InventoryAlerts — was missing, causing 401 */}
      {page === "inventory" && (
        <div style={{ padding: "24px 28px" }}>
          <InventoryAlerts token={token} />
        </div>
      )}
    </div>
  );
}

export default App;