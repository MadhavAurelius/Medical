// MedicalBilling.jsx — v3.0 — Full Featured
// ✅ Fixed: token is always passed via prop, never read from localStorage here

import { useState, useEffect, useCallback, useRef } from "react";

const API = "http://127.0.0.1:8000";

// ─── Styles ───────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg:      #f0f4f0; --surface: #ffffff; --border: #d4e0d4;
    --accent:  #1a6b3c; --accent2: #2d9e5f; --danger: #c0392b;
    --warn:    #e67e22; --info: #2980b9; --purple: #8e44ad;
    --text:    #1c2b1c; --muted: #6b836b;
    --radius:  12px; --shadow: 0 2px 16px rgba(26,107,60,.10);
  }
  body { font-family:'DM Sans',sans-serif; background:var(--bg); color:var(--text); }
  .med-app { display:flex; min-height:100vh; }

  /* Sidebar */
  .med-sidebar {
    width:220px; min-height:100vh; background:var(--accent);
    padding:28px 16px; display:flex; flex-direction:column; gap:6px;
    position:sticky; top:0; height:100vh; overflow-y:auto; flex-shrink:0;
  }
  .med-logo { font-family:'DM Serif Display',serif; font-size:22px; color:#fff; margin-bottom:20px; display:flex; align-items:center; gap:8px; }
  .med-logo-sub { font-size:10px; color:rgba(255,255,255,.55); letter-spacing:.12em; margin-bottom:16px; text-transform:uppercase; }
  .med-nav-btn {
    width:100%; padding:10px 14px; border:none; border-radius:8px;
    background:transparent; color:rgba(255,255,255,.75);
    font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500;
    cursor:pointer; text-align:left; display:flex; align-items:center; gap:10px; transition:all .18s;
  }
  .med-nav-btn:hover, .med-nav-btn.active { background:rgba(255,255,255,.15); color:#fff; }
  .med-nav-section { font-size:9px; letter-spacing:.15em; color:rgba(255,255,255,.35); text-transform:uppercase; padding:14px 14px 4px; }
  .med-nav-icon { font-size:17px; }
  .med-nav-badge { margin-left:auto; background:var(--danger); color:#fff; font-size:9px; font-weight:700; border-radius:10px; padding:1px 6px; }
  .med-role-chip { background:rgba(255,255,255,.12); color:rgba(255,255,255,.7); font-size:10px; border-radius:20px; padding:3px 10px; display:inline-block; margin-top:4px; }

  /* Main */
  .med-main { flex:1; padding:28px 32px; overflow-y:auto; background:var(--bg); min-width:0; }
  .med-title { font-family:'DM Serif Display',serif; font-size:28px; color:var(--accent); margin-bottom:20px; }
  .med-subtitle { font-size:13px; color:var(--muted); margin-top:-14px; margin-bottom:20px; }

  /* Cards */
  .med-card { background:var(--surface); border-radius:var(--radius); box-shadow:var(--shadow); padding:22px; margin-bottom:18px; border:1px solid var(--border); }
  .med-card-label { font-size:11px; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:.08em; margin-bottom:4px; }
  .med-card-value { font-size:30px; font-weight:700; color:var(--accent); }
  .med-stats-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(165px,1fr)); gap:14px; margin-bottom:20px; }
  .med-stat-card { background:var(--surface); border-radius:var(--radius); box-shadow:var(--shadow); padding:18px 20px; border:1px solid var(--border); transition:transform .15s; }
  .med-stat-card:hover { transform:translateY(-2px); }

  /* Table */
  .med-table-wrap { overflow-x:auto; }
  .med-table { width:100%; border-collapse:collapse; font-size:13px; }
  .med-table th { background:#eaf2ea; color:var(--accent); font-weight:600; padding:11px 14px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.06em; white-space:nowrap; }
  .med-table td { padding:11px 14px; border-bottom:1px solid var(--border); vertical-align:middle; }
  .med-table tr:last-child td { border-bottom:none; }
  .med-table tr:hover td { background:#f6fbf6; }

  /* Badges */
  .badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; font-family:'JetBrains Mono',monospace; white-space:nowrap; }
  .badge-green  { background:#d4f0e0; color:#1a6b3c; }
  .badge-red    { background:#fde8e6; color:#c0392b; }
  .badge-warn   { background:#fef3e2; color:#e67e22; }
  .badge-blue   { background:#dbeafe; color:#1e40af; }
  .badge-purple { background:#f3e8ff; color:#6b21a8; }
  .badge-gray   { background:#f3f4f6; color:#6b7280; }

  /* Form */
  .med-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .med-form-group { display:flex; flex-direction:column; gap:5px; }
  .med-form-group.full { grid-column:1/-1; }
  .med-label { font-size:11px; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:.06em; }
  .med-input, .med-select, .med-textarea {
    padding:9px 13px; border:1.5px solid var(--border); border-radius:8px;
    font-family:'DM Sans',sans-serif; font-size:13px; color:var(--text);
    background:var(--surface); transition:border .18s; width:100%;
  }
  .med-input:focus, .med-select:focus, .med-textarea:focus { outline:none; border-color:var(--accent2); box-shadow:0 0 0 3px rgba(45,158,95,.1); }
  .med-textarea { resize:vertical; min-height:80px; }

  /* Buttons */
  .med-btn { padding:9px 18px; border:none; border-radius:8px; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; transition:all .18s; display:inline-flex; align-items:center; gap:6px; white-space:nowrap; }
  .med-btn-primary { background:var(--accent); color:#fff; }
  .med-btn-primary:hover { background:#155732; }
  .med-btn-primary:disabled { opacity:.5; cursor:not-allowed; }
  .med-btn-success { background:var(--accent2); color:#fff; }
  .med-btn-success:hover { background:#24835a; }
  .med-btn-danger  { background:var(--danger); color:#fff; }
  .med-btn-danger:hover { background:#a93226; }
  .med-btn-warn    { background:var(--warn); color:#fff; }
  .med-btn-info    { background:var(--info); color:#fff; }
  .med-btn-outline { background:transparent; border:1.5px solid var(--accent); color:var(--accent); }
  .med-btn-outline:hover { background:var(--accent); color:#fff; }
  .med-btn-outline-gray { background:transparent; border:1.5px solid var(--border); color:var(--muted); }
  .med-btn-outline-gray:hover { border-color:var(--accent); color:var(--accent); }
  .med-btn-sm { padding:5px 12px; font-size:12px; }

  /* Filters bar */
  .filter-bar { display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-bottom:16px; }
  .filter-bar .med-input { width:180px; }
  .filter-bar .med-select { width:150px; }
  .filter-bar label { font-size:12px; color:var(--muted); font-weight:600; }

  /* Bill items */
  .med-item-row { display:flex; gap:10px; align-items:center; margin-bottom:10px; }
  .med-item-row .med-select { flex:1; }
  .med-item-qty { width:80px; flex-shrink:0; }

  /* Bill preview */
  .med-bill-preview { background:#fff; border:1.5px dashed var(--border); border-radius:var(--radius); padding:28px; max-width:560px; font-size:13px; }
  .med-bill-preview h2 { font-family:'DM Serif Display',serif; font-size:22px; color:var(--accent); }
  .med-divider { border:none; border-top:1px dashed var(--border); margin:12px 0; }
  .med-bill-row { display:flex; justify-content:space-between; margin-bottom:6px; align-items:center; }
  .med-bill-total { font-size:18px; font-weight:700; color:var(--accent); }

  /* Alert */
  .med-alert { padding:10px 14px; border-radius:8px; margin-bottom:14px; font-size:13px; font-weight:500; display:flex; align-items:center; gap:8px; }
  .med-alert-error   { background:#fde8e6; color:var(--danger); border:1px solid rgba(192,57,43,.2); }
  .med-alert-success { background:#d4f0e0; color:var(--accent); border:1px solid rgba(26,107,60,.2); }
  .med-alert-warn    { background:#fef3e2; color:var(--warn); border:1px solid rgba(230,126,34,.2); }
  .med-alert-info    { background:#dbeafe; color:var(--info); border:1px solid rgba(41,128,185,.2); }
  .med-low-tag { color:var(--danger); font-weight:600; font-size:12px; }

  /* Modal */
  .modal-bg { position:fixed; inset:0; background:rgba(0,0,0,.5); display:flex; align-items:center; justify-content:center; z-index:300; padding:20px; }
  .modal { background:var(--surface); border-radius:16px; width:520px; max-width:100%; max-height:90vh; overflow-y:auto; padding:28px; position:relative; box-shadow:0 20px 60px rgba(0,0,0,.2); }
  .modal h2 { font-family:'DM Serif Display',serif; font-size:20px; color:var(--accent); margin-bottom:18px; }
  .modal-close { position:absolute; top:16px; right:16px; background:none; border:none; font-size:22px; color:var(--muted); cursor:pointer; }
  .modal-close:hover { color:var(--text); }
  .modal-footer { display:flex; gap:8px; justify-content:flex-end; margin-top:18px; }

  /* Section header */
  .sec-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; flex-wrap:wrap; gap:10px; }
  .sec-title { font-size:15px; font-weight:700; display:flex; align-items:center; gap:8px; }

  /* Chart */
  .chart-wrap { display:flex; align-items:flex-end; gap:4px; height:120px; padding:8px 0; }
  .chart-bar-group { display:flex; flex-direction:column; align-items:center; gap:3px; flex:1; }
  .chart-bar { width:100%; border-radius:4px 4px 0 0; transition:height .4s; cursor:pointer; min-height:2px; }
  .chart-label { font-size:9px; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:40px; text-align:center; }

  /* Payment mode chip */
  .pay-chip { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; cursor:pointer; border:1.5px solid var(--border); transition:all .15s; }
  .pay-chip.active-cash   { background:#d4f0e0; border-color:var(--accent); color:var(--accent); }
  .pay-chip.active-upi    { background:#f3e8ff; border-color:var(--purple); color:var(--purple); }
  .pay-chip.active-card   { background:#dbeafe; border-color:var(--info); color:var(--info); }

  /* Barcode */
  .barcode-input-wrap { position:relative; }
  .barcode-input-wrap .med-input { padding-right:40px; font-family:'JetBrains Mono',monospace; }
  .barcode-icon { position:absolute; right:12px; top:50%; transform:translateY(-50%); color:var(--muted); font-size:18px; pointer-events:none; }

  /* Profit indicator */
  .profit-bar-wrap { display:flex; align-items:center; gap:8px; }
  .profit-bar-bg   { height:6px; background:rgba(0,0,0,.07); border-radius:4px; flex:1; min-width:60px; overflow:hidden; }
  .profit-bar-fill { height:100%; border-radius:4px; background:var(--accent2); }

  /* Tabs */
  .tab-row { display:flex; gap:4px; border-bottom:1.5px solid var(--border); margin-bottom:18px; }
  .tab-btn { padding:8px 16px; border:none; background:transparent; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; color:var(--muted); border-bottom:2.5px solid transparent; margin-bottom:-1.5px; transition:all .15s; }
  .tab-btn:hover { color:var(--text); }
  .tab-btn.active { color:var(--accent); border-bottom-color:var(--accent); }

  /* Upload zone */
  .upload-zone { border:2px dashed var(--border); border-radius:10px; padding:24px; text-align:center; cursor:pointer; transition:border-color .2s; }
  .upload-zone:hover { border-color:var(--accent2); }
  .upload-zone input { display:none; }

  /* Patient card */
  .patient-card { background:linear-gradient(135deg,var(--accent),var(--accent2)); border-radius:12px; padding:20px; color:#fff; margin-bottom:16px; }
  .patient-card h3 { font-family:'DM Serif Display',serif; font-size:20px; margin-bottom:4px; }
  .patient-card .stat { font-size:12px; opacity:.8; }

  /* Toast */
  .med-toast { position:fixed; bottom:24px; right:24px; padding:12px 18px; border-radius:10px; font-size:13px; font-weight:500; z-index:999; display:flex; align-items:center; gap:10px; box-shadow:0 4px 20px rgba(0,0,0,.15); animation:slideUp .2s ease; max-width:360px; }
  .med-toast-success { background:#d4f0e0; color:var(--accent); border:1px solid rgba(26,107,60,.3); }
  .med-toast-error   { background:#fde8e6; color:var(--danger); border:1px solid rgba(192,57,43,.3); }
  .med-toast-info    { background:#dbeafe; color:var(--info); border:1px solid rgba(41,128,185,.3); }
  @keyframes slideUp { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }

  /* Print styles */
  @media print {
    .med-sidebar, .med-main > *:not(.print-area), nav, .no-print { display:none !important; }
    .print-area { display:block !important; }
    body { background:#fff; }
    .med-bill-preview { border:none; padding:0; max-width:100%; }
  }

  /* Responsive */
  @media (max-width:700px) {
    .med-sidebar { width:56px; padding:16px 8px; }
    .med-logo span:last-child, .med-nav-btn span:not(.med-nav-icon), .med-nav-section, .med-logo-sub, .med-role-chip { display:none; }
    .med-main { padding:16px; }
    .med-form-grid { grid-template-columns:1fr; }
    .med-stats-grid { grid-template-columns:1fr 1fr; }
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt          = (n)   => `₹${Number(n || 0).toFixed(2)}`;
const fmtDate      = (iso) => iso ? new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";
const fmtDateShort = (iso) => iso ? new Date(iso).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—";

// ✅ FIX: centralised header builder — every component uses this
function makeHeaders(token) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

// ✅ FIX: useFetch guards on token being non-empty AND re-fetches when token changes
function useFetch(token, path, deps = []) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    if (!token) return;           // guard: no token → do nothing
    setLoading(true); setError(null);
    try {
      const r = await fetch(API + path, { headers: makeHeaders(token) });
      if (!r.ok) { setError(`HTTP ${r.status}`); setData(null); }
      else setData(await r.json());
    } catch { setError("Network error"); setData(null); }
    finally   { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, path]);

  useEffect(() => { load(); }, deps.length ? deps : [load]);
  return { data, loading, error, reload: load };
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3800); return () => clearTimeout(t); }, [onClose]);
  const icons = { success: "✓", error: "✕", info: "ℹ" };
  return <div className={`med-toast med-toast-${type}`}><span>{icons[type] || "•"}</span>{msg}</div>;
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({ title, message, onConfirm, onClose, danger = false }) {
  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: 380 }}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>{title}</h2>
        <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 20 }}>{message}</p>
        <div className="modal-footer">
          <button className="med-btn med-btn-outline-gray med-btn-sm" onClick={onClose}>Cancel</button>
          <button className={`med-btn med-btn-sm ${danger ? "med-btn-danger" : "med-btn-primary"}`} onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ token }) {
  // ✅ FIX: pass token explicitly to useFetch; deps array drives re-fetch on token change
  const { data: stats, loading, error } = useFetch(token, "/dashboard/stats", [token]);
  const { data: report }                = useFetch(token, "/dashboard/sales-report?period=daily", [token]);

  if (loading) return <p style={{ color: "var(--muted)" }}>Loading…</p>;
  if (error)   return <div className="med-alert med-alert-error">⚠️ {error} — is the API running?</div>;
  if (!stats)  return null;

  const lowStock  = stats.low_stock_items || [];
  const chartData = (report || []).slice(-14);
  const maxRev    = Math.max(...chartData.map(d => d.revenue), 1);
  const margin    = stats.total_revenue > 0 ? ((stats.total_profit / stats.total_revenue) * 100).toFixed(1) : 0;

  return (
    <>
      <h1 className="med-title">Dashboard</h1>
      <p className="med-subtitle">Overview for {new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}</p>
      <div className="med-stats-grid">
        {[
          { label: "Today's Revenue", value: fmt(stats.today_revenue), icon: "💰", sub: `${stats.today_bills} bills today` },
          { label: "Total Revenue",   value: fmt(stats.total_revenue), icon: "📈", sub: `${stats.total_bills} total bills` },
          { label: "Total Profit",    value: fmt(stats.total_profit),  icon: "💹", sub: `${margin}% margin` },
          { label: "Medicines",       value: stats.total_medicines,    icon: "💊", sub: `${stats.low_stock_count} low stock` },
        ].map(s => (
          <div className="med-stat-card" key={s.label}>
            <div className="med-card-label">{s.icon} {s.label}</div>
            <div className="med-card-value" style={{ fontSize: 26 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {chartData.length > 0 && (
        <div className="med-card">
          <div className="med-card-label" style={{ marginBottom: 14 }}>📊 Revenue — Last 14 Days</div>
          <div className="chart-wrap">
            {chartData.map(d => (
              <div className="chart-bar-group" key={d.period} title={`${d.period}: ${fmt(d.revenue)}`}>
                <div className="chart-bar" style={{ height: `${(d.revenue / maxRev) * 100}%`, background: "var(--accent2)", opacity: .85 }} />
                <div className="chart-label">{d.period.slice(5)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {lowStock.length > 0 && (
        <div className="med-card">
          <div className="med-card-label" style={{ marginBottom: 12 }}>⚠️ Low Stock Alert</div>
          <div className="med-table-wrap">
            <table className="med-table">
              <thead><tr><th>ID</th><th>Name</th><th>Stock</th><th>Category</th></tr></thead>
              <tbody>{lowStock.map(m => (
                <tr key={m.id}><td>{m.id}</td><td>{m.name}</td>
                  <td><span className="med-low-tag">⚠ {m.stock} left</span></td>
                  <td>{m.category}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Sales Report ─────────────────────────────────────────────────────────────
function SalesReport({ token }) {
  const [period, setPeriod] = useState("daily");
  const { data, loading, reload } = useFetch(token, `/dashboard/sales-report?period=${period}`, [token, period]);
  const rows   = (data || []).slice(-30).reverse();
  const maxRev = Math.max(...(data || []).map(d => d.revenue), 1);

  return (
    <>
      <h1 className="med-title">Sales Report</h1>
      <div className="filter-bar">
        <div className="tab-row" style={{ margin: 0, border: "none" }}>
          {["daily", "monthly"].map(p => (
            <button key={p} className={`tab-btn ${period === p ? "active" : ""}`} onClick={() => setPeriod(p)}>
              {p === "daily" ? "📅 Daily" : "📆 Monthly"}
            </button>
          ))}
        </div>
        <button className="med-btn med-btn-outline-gray med-btn-sm" onClick={reload}>↻ Refresh</button>
      </div>
      {loading ? <p style={{ color: "var(--muted)" }}>Loading…</p> : (
        <>
          <div className="med-card">
            <div className="med-card-label" style={{ marginBottom: 14 }}>Revenue Chart</div>
            <div className="chart-wrap" style={{ height: 160 }}>
              {(data || []).slice(-30).map(d => (
                <div className="chart-bar-group" key={d.period}>
                  <div className="chart-bar" style={{ height: `${(d.revenue / maxRev) * 100}%`, background: "var(--accent2)" }} />
                  <div className="chart-bar" style={{ height: `${(d.profit / maxRev) * 100}%`, background: "rgba(45,158,95,.3)", marginTop: -4, borderRadius: 4 }} />
                  <div className="chart-label">{period === "monthly" ? d.period : d.period.slice(5)}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 11, color: "var(--muted)" }}>
              <span>🟢 Revenue</span><span>🔵 Profit</span>
            </div>
          </div>
          <div className="med-card">
            <div className="med-table-wrap">
              <table className="med-table">
                <thead><tr><th>Period</th><th>Bills</th><th>Revenue</th><th>Profit</th><th>Margin</th></tr></thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.period}>
                      <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>{r.period}</td>
                      <td>{r.bill_count}</td>
                      <td><strong>{fmt(r.revenue)}</strong></td>
                      <td style={{ color: "var(--accent2)" }}>{fmt(r.profit)}</td>
                      <td>{r.revenue > 0 ? `${((r.profit / r.revenue) * 100).toFixed(1)}%` : "—"}</td>
                    </tr>
                  ))}
                  {!rows.length && <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--muted)", padding: 28 }}>No data yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ─── Medicine List ─────────────────────────────────────────────────────────────
function MedicineList({ token, role }) {
  const { data: meds, loading, reload } = useFetch(token, "/medicines/all", [token]);
  const [form, setForm]   = useState({ name: "", price: "", cost_price: "", stock: "", category: "", expiry_date: "", min_stock_threshold: 20 });
  const [msg, setMsg]     = useState(null);
  const [search, setSearch]       = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [confirm, setConfirm]     = useState(null);
  const [tab, setTab]     = useState("list");
  const fileRef = useRef();

  async function addMedicine() {
    if (!form.name || !form.price || !form.stock || !form.category) {
      setMsg({ type: "error", text: "Name, price, stock and category are required." }); return;
    }
    const r = await fetch(`${API}/medicines`, {
      method: "POST", headers: makeHeaders(token),
      body: JSON.stringify({ ...form, price: parseFloat(form.price), cost_price: parseFloat(form.cost_price || 0), stock: parseInt(form.stock), min_stock_threshold: parseInt(form.min_stock_threshold || 20) }),
    });
    if (r.ok) { setMsg({ type: "success", text: "Medicine added!" }); setForm({ name: "", price: "", cost_price: "", stock: "", category: "", expiry_date: "", min_stock_threshold: 20 }); reload(); setTab("list"); }
    else { const d = await r.json(); setMsg({ type: "error", text: d.detail || "Failed" }); }
  }

  async function deactivate(id) {
    await fetch(`${API}/medicines/${id}`, { method: "DELETE", headers: makeHeaders(token) });
    setConfirm(null); reload();
  }

  async function importCSV(file) {
    const fd = new FormData(); fd.append("file", file);
    const r = await fetch(`${API}/medicines/import/csv`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
    const d = await r.json();
    setMsg({ type: "success", text: `Imported: ${d.added} added, ${d.skipped} skipped` });
    reload();
  }

  const filtered = (meds || []).filter(m => {
    if (!showInactive && m.active === false) return false;
    return m.name.toLowerCase().includes(search.toLowerCase()) || m.id.toLowerCase().includes(search.toLowerCase());
  });

  const profitPct = (m) => m.price > 0 && m.cost_price > 0 ? ((m.price - m.cost_price) / m.price * 100).toFixed(0) : null;

  return (
    <>
      <h1 className="med-title">Medicine Inventory</h1>
      {msg && <div className={`med-alert med-alert-${msg.type}`}>{msg.text}</div>}
      <div className="tab-row">
        {[["list", "💊 List"], ["add", "➕ Add Medicine"], ["import", "📂 Bulk Import"]].map(([id, label]) => (
          <button key={id} className={`tab-btn ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === "list" && (
        <>
          <div className="filter-bar">
            <input className="med-input" placeholder="Search name or ID…" value={search} onChange={e => setSearch(e.target.value)} />
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />
              Show inactive
            </label>
            <button className="med-btn med-btn-outline-gray med-btn-sm" onClick={reload}>↻ Refresh</button>
          </div>
          <div className="med-card">
            <div className="med-table-wrap">
              {loading ? <p style={{ color: "var(--muted)" }}>Loading…</p> : (
                <table className="med-table">
                  <thead><tr><th>ID</th><th>Name</th><th>Category</th><th>Cost</th><th>Price</th><th>Margin</th><th>Stock</th><th>Expiry</th><th>Status</th>{role === "admin" && <th></th>}</tr></thead>
                  <tbody>{filtered.map(m => {
                    const pp = profitPct(m);
                    return (
                      <tr key={m.id} style={{ opacity: m.active === false ? .45 : 1 }}>
                        <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{m.id}</td>
                        <td style={{ fontWeight: 600 }}>{m.name}</td>
                        <td><span className="badge badge-gray">{m.category}</span></td>
                        <td style={{ fontSize: 12 }}>{m.cost_price ? fmt(m.cost_price) : "—"}</td>
                        <td style={{ fontWeight: 600 }}>{fmt(m.price)}</td>
                        <td>
                          {pp != null && (
                            <div className="profit-bar-wrap">
                              <div className="profit-bar-bg"><div className="profit-bar-fill" style={{ width: `${Math.min(pp, 100)}%` }} /></div>
                              <span style={{ fontSize: 11, color: "var(--accent2)", minWidth: 32 }}>{pp}%</span>
                            </div>
                          )}
                        </td>
                        <td><span className={`badge ${m.stock === 0 ? "badge-red" : m.stock < (m.min_stock_threshold || 20) ? "badge-warn" : "badge-green"}`}>{m.stock}</span></td>
                        <td style={{ fontSize: 11, color: "var(--muted)" }}>{m.expiry_date || "—"}</td>
                        <td><span className={`badge ${m.active === false ? "badge-gray" : "badge-green"}`}>{m.active === false ? "Inactive" : "Active"}</span></td>
                        {role === "admin" && <td>
                          {m.active !== false && <button className="med-btn med-btn-outline-gray med-btn-sm" onClick={() => setConfirm({ id: m.id, name: m.name })}>Deactivate</button>}
                        </td>}
                      </tr>
                    );
                  })}
                    {!filtered.length && <tr><td colSpan={10} style={{ textAlign: "center", color: "var(--muted)", padding: 28 }}>No medicines found.</td></tr>}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {tab === "add" && (
        <div className="med-card">
          <div className="med-card-label" style={{ marginBottom: 16 }}>Add New Medicine</div>
          <div className="med-form-grid">
            <div className="med-form-group"><label className="med-label">Name *</label><input className="med-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Paracetamol 500mg" /></div>
            <div className="med-form-group"><label className="med-label">Category *</label><input className="med-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Analgesic" /></div>
            <div className="med-form-group"><label className="med-label">Cost Price (₹)</label><input className="med-input" type="number" value={form.cost_price} onChange={e => setForm({ ...form, cost_price: e.target.value })} placeholder="0.00" /></div>
            <div className="med-form-group"><label className="med-label">Selling Price (₹) *</label><input className="med-input" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" /></div>
            <div className="med-form-group"><label className="med-label">Stock (units) *</label><input className="med-input" type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="0" /></div>
            <div className="med-form-group"><label className="med-label">Min Stock Threshold</label><input className="med-input" type="number" value={form.min_stock_threshold} onChange={e => setForm({ ...form, min_stock_threshold: e.target.value })} /></div>
            <div className="med-form-group full"><label className="med-label">Expiry Date</label><input className="med-input" type="date" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} /></div>
          </div>
          <button className="med-btn med-btn-primary" style={{ marginTop: 10 }} onClick={addMedicine}>＋ Add Medicine</button>
        </div>
      )}

      {tab === "import" && (
        <div className="med-card">
          <div className="med-card-label" style={{ marginBottom: 10 }}>📂 Bulk Import via CSV</div>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>CSV must have columns: <code>name, price, cost_price, stock, category, expiry_date, min_stock_threshold</code></p>
          <div className="upload-zone" onClick={() => fileRef.current.click()}>
            <input type="file" accept=".csv" ref={fileRef} onChange={e => { if (e.target.files[0]) importCSV(e.target.files[0]); }} />
            <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
            <p style={{ fontWeight: 600 }}>Click to upload CSV file</p>
            <p style={{ fontSize: 12, color: "var(--muted)" }}>or drag and drop</p>
          </div>
        </div>
      )}

      {confirm && <ConfirmModal title="Deactivate Medicine" message={`Deactivate "${confirm.name}"? It will be hidden from billing.`}
        danger onConfirm={() => deactivate(confirm.id)} onClose={() => setConfirm(null)} />}
    </>
  );
}

// ─── New Bill ──────────────────────────────────────────────────────────────────
function NewBill({ token, onBillCreated }) {
  const { data: meds } = useFetch(token, "/medicines", [token]);
  const [customer, setCustomer] = useState({ name: "", phone: "", doctor: "" });
  const [items, setItems]       = useState([{ medicine_id: "", quantity: 1 }]);
  const [discount, setDiscount] = useState(0);
  const [payMode, setPayMode]   = useState("cash");
  const [bill, setBill]         = useState(null);
  const [error, setError]       = useState(null);
  const [barcodeInput, setBarcodeInput] = useState("");
  const barcodeRef = useRef();

  const addRow    = () => setItems([...items, { medicine_id: "", quantity: 1 }]);
  const removeRow = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateRow = (i, field, val) => { const c = [...items]; c[i] = { ...c[i], [field]: val }; setItems(c); };

  function handleBarcode(e) {
    if (e.key !== "Enter") return;
    const val = barcodeInput.trim().toUpperCase();
    const med = (meds || []).find(m => m.id === val || m.name.toUpperCase() === val);
    if (med) {
      const existing = items.findIndex(it => it.medicine_id === med.id);
      if (existing >= 0) { updateRow(existing, "quantity", items[existing].quantity + 1); }
      else { setItems(prev => [...prev.filter(it => it.medicine_id !== ""), { medicine_id: med.id, quantity: 1 }]); }
      setBarcodeInput(""); barcodeRef.current.focus();
    } else { setError(`Medicine "${val}" not found`); }
  }

  const lineItems = items.map(it => {
    const med = (meds || []).find(m => m.id === it.medicine_id);
    return { ...it, med, total: med ? med.price * it.quantity : 0 };
  });
  const subtotal = lineItems.reduce((s, r) => s + r.total, 0);
  const discAmt  = subtotal * (discount / 100);
  const tax      = (subtotal - discAmt) * 0.05;
  const grand    = subtotal - discAmt + tax;

  async function submitBill() {
    setError(null);
    if (!customer.name.trim()) { setError("Patient name is required."); return; }
    const validItems = items.filter(i => i.medicine_id && i.quantity > 0);
    if (!validItems.length) { setError("Add at least one medicine."); return; }
    const r = await fetch(`${API}/bills`, {
      method: "POST", headers: makeHeaders(token),
      body: JSON.stringify({
        customer_name: customer.name, customer_phone: customer.phone,
        doctor_name: customer.doctor, items: validItems,
        discount_percent: parseFloat(discount) || 0, payment_mode: payMode,
      }),
    });
    const data = await r.json();
    if (r.ok) { setBill(data); onBillCreated && onBillCreated(); }
    else setError(data.detail || "Failed to create bill.");
  }

  function shareWhatsApp(b) {
    const text  = encodeURIComponent(`🏥 MedBill Receipt\nPatient: ${b.customer_name}\nBill: ${b.id}\nAmount: ₹${b.grand_total}\nDate: ${fmtDateShort(b.created_at)}`);
    const phone = b.customer_phone.replace(/\D/g, "");
    window.open(`https://wa.me/91${phone}?text=${text}`, "_blank");
  }

  function resetForm() {
    setBill(null); setCustomer({ name: "", phone: "", doctor: "" });
    setItems([{ medicine_id: "", quantity: 1 }]); setDiscount(0); setPayMode("cash");
  }

  if (bill) return (
    <>
      <h1 className="med-title">Bill Generated ✅</h1>
      <div className="print-area">
        <div className="med-bill-preview" id="bill-print">
          <h2>🏥 MedBill Pharmacy</h2>
          <p style={{ color: "var(--muted)", marginTop: 4, fontSize: 12 }}>Bill ID: <strong style={{ fontFamily: "monospace" }}>{bill.id}</strong> · {fmtDate(bill.created_at)}</p>
          <hr className="med-divider" />
          <div className="med-bill-row"><span>Patient:</span><strong>{bill.customer_name}</strong></div>
          {bill.customer_phone && <div className="med-bill-row"><span>Phone:</span><span>{bill.customer_phone}</span></div>}
          {bill.doctor_name    && <div className="med-bill-row"><span>Doctor:</span><span>Dr. {bill.doctor_name}</span></div>}
          <div className="med-bill-row"><span>Payment:</span><span className={`badge ${bill.payment_mode === "cash" ? "badge-green" : bill.payment_mode === "upi" ? "badge-purple" : "badge-blue"}`}>{bill.payment_mode?.toUpperCase()}</span></div>
          <hr className="med-divider" />
          <table style={{ width: "100%", marginBottom: 12, fontSize: 13 }}>
            <thead><tr>
              <th style={{ textAlign: "left", paddingBottom: 8, color: "var(--muted)", fontSize: 11 }}>Medicine</th>
              <th style={{ textAlign: "center" }}>Qty</th><th style={{ textAlign: "right" }}>Unit</th><th style={{ textAlign: "right" }}>Total</th>
            </tr></thead>
            <tbody>{bill.items.map((it, i) => (
              <tr key={i}><td style={{ paddingBottom: 6 }}>{it.medicine_name}</td>
                <td style={{ textAlign: "center" }}>{it.quantity}</td>
                <td style={{ textAlign: "right" }}>{fmt(it.unit_price)}</td>
                <td style={{ textAlign: "right" }}>{fmt(it.total)}</td>
              </tr>
            ))}</tbody>
          </table>
          <hr className="med-divider" />
          <div className="med-bill-row"><span>Subtotal</span><span>{fmt(bill.subtotal)}</span></div>
          {bill.discount_percent > 0 && <div className="med-bill-row" style={{ color: "var(--accent2)" }}><span>Discount ({bill.discount_percent}%)</span><span>-{fmt(bill.discount_amount)}</span></div>}
          <div className="med-bill-row"><span>GST (5%)</span><span>{fmt(bill.tax_amount)}</span></div>
          <hr className="med-divider" />
          <div className="med-bill-row med-bill-total"><span>Grand Total</span><span>{fmt(bill.grand_total)}</span></div>
          <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 16, textAlign: "center" }}>Thank you for choosing MedBill Pharmacy!</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        <button className="med-btn med-btn-primary" onClick={() => window.print()}>🖨 Print Receipt</button>
        {bill.customer_phone && <button className="med-btn med-btn-success" onClick={() => shareWhatsApp(bill)}>💬 WhatsApp</button>}
        <button className="med-btn med-btn-outline" onClick={resetForm}>＋ New Bill</button>
      </div>
    </>
  );

  return (
    <>
      <h1 className="med-title">New Bill</h1>
      {error && <div className="med-alert med-alert-error">{error}</div>}
      <div className="med-card">
        <div className="med-card-label" style={{ marginBottom: 14 }}>Patient Details</div>
        <div className="med-form-grid">
          <div className="med-form-group"><label className="med-label">Patient Name *</label><input className="med-input" value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} placeholder="Full name" /></div>
          <div className="med-form-group"><label className="med-label">Phone</label><input className="med-input" value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" /></div>
          <div className="med-form-group full"><label className="med-label">Doctor (optional)</label><input className="med-input" value={customer.doctor} onChange={e => setCustomer({ ...customer, doctor: e.target.value })} placeholder="Prescribing doctor" /></div>
        </div>
      </div>

      <div className="med-card">
        <div className="med-card-label" style={{ marginBottom: 10 }}>📷 Barcode Scanner</div>
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>Scan barcode or type medicine ID then press Enter</p>
        <div className="barcode-input-wrap">
          <input ref={barcodeRef} className="med-input" style={{ maxWidth: 280 }} placeholder="Scan or type ID, press Enter…"
            value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)} onKeyDown={handleBarcode} />
          <span className="barcode-icon">▤</span>
        </div>
      </div>

      <div className="med-card">
        <div className="med-card-label" style={{ marginBottom: 14 }}>Medicines</div>
        {items.map((row, i) => (
          <div className="med-item-row" key={i}>
            <select className="med-select" value={row.medicine_id} onChange={e => updateRow(i, "medicine_id", e.target.value)}>
              <option value="">— Select Medicine —</option>
              {(meds || []).map(m => <option key={m.id} value={m.id}>{m.name} ({fmt(m.price)}) — Stock: {m.stock}</option>)}
            </select>
            <input className="med-input med-item-qty" type="number" min="1" value={row.quantity} onChange={e => updateRow(i, "quantity", parseInt(e.target.value) || 1)} />
            <span style={{ fontSize: 12, color: "var(--muted)", minWidth: 60, textAlign: "right" }}>{row.medicine_id ? (fmt(lineItems[i]?.total || 0)) : "—"}</span>
            {items.length > 1 && <button className="med-btn med-btn-danger med-btn-sm" onClick={() => removeRow(i)}>✕</button>}
          </div>
        ))}
        <button className="med-btn med-btn-outline-gray med-btn-sm" onClick={addRow} style={{ marginTop: 6 }}>＋ Add Row</button>
      </div>

      <div className="med-card">
        <div className="med-card-label" style={{ marginBottom: 14 }}>Summary & Payment</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
          <label className="med-label" style={{ textTransform: "none", fontSize: 13 }}>Discount %</label>
          <input className="med-input" type="number" min="0" max="100" value={discount} onChange={e => setDiscount(e.target.value)} style={{ width: 80 }} />
          <div style={{ marginLeft: 16 }}>
            <span className="med-label" style={{ marginRight: 8 }}>Payment Mode</span>
            {[["cash", "💵 Cash"], ["upi", "📱 UPI"], ["card", "💳 Card"]].map(([mode, label]) => (
              <span key={mode} className={`pay-chip ${payMode === mode ? `active-${mode}` : ""}`} onClick={() => setPayMode(mode)} style={{ marginRight: 6 }}>{label}</span>
            ))}
          </div>
        </div>
        <div className="med-bill-row"><span>Subtotal</span><strong>{fmt(subtotal)}</strong></div>
        {discount > 0 && <div className="med-bill-row" style={{ color: "var(--accent2)" }}><span>Discount ({discount}%)</span><span>-{fmt(discAmt)}</span></div>}
        <div className="med-bill-row"><span>GST (5%)</span><span>{fmt(tax)}</span></div>
        <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "10px 0" }} />
        <div className="med-bill-row" style={{ fontSize: 20, fontWeight: 700, color: "var(--accent)" }}><span>Grand Total</span><span>{fmt(grand)}</span></div>
        <button className="med-btn med-btn-success" style={{ marginTop: 18, width: "100%" }} onClick={submitBill}>Generate Bill →</button>
      </div>
    </>
  );
}

// ─── Bill History ──────────────────────────────────────────────────────────────
function BillHistory({ token, role }) {
  const [filters, setFilters] = useState({ patient: "", doctor: "", from_date: "", to_date: "", min_amount: "", payment_mode: "", status: "" });
  const [bills, setBills]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected]   = useState(null);
  const [refunding, setRefunding] = useState(null);
  const [refundReason, setRefundReason] = useState("");
  const [msg, setMsg] = useState(null);

  async function search() {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const r = await fetch(`${API}/bills?${params}`, { headers: makeHeaders(token) });
    setBills(await r.json());
    setLoading(false);
  }

  useEffect(() => { search(); }, []);

  async function doRefund() {
    const r = await fetch(`${API}/bills/${refunding}/refund`, {
      method: "POST", headers: makeHeaders(token),
      body: JSON.stringify({ reason: refundReason || "Customer return" }),
    });
    if (r.ok) { setMsg({ type: "success", text: "Bill refunded and stock restored" }); setRefunding(null); search(); }
    else { const d = await r.json(); setMsg({ type: "error", text: d.detail }); }
  }

  if (selected) return (
    <>
      <button className="med-btn med-btn-outline-gray med-btn-sm no-print" onClick={() => setSelected(null)} style={{ marginBottom: 14 }}>← Back</button>
      <div className="print-area">
        <div className="med-bill-preview">
          <h2>🏥 MedBill Pharmacy</h2>
          <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>Bill: <strong style={{ fontFamily: "monospace" }}>{selected.id}</strong> · {fmtDate(selected.created_at)}</p>
          {selected.status === "refunded" && <div className="med-alert med-alert-warn" style={{ marginTop: 10 }}>⚠ REFUNDED: {selected.refund_reason}</div>}
          <hr className="med-divider" />
          <div className="med-bill-row"><span>Patient:</span><strong>{selected.customer_name}</strong></div>
          {selected.customer_phone && <div className="med-bill-row"><span>Phone:</span><span>{selected.customer_phone}</span></div>}
          {selected.doctor_name    && <div className="med-bill-row"><span>Doctor:</span><span>Dr. {selected.doctor_name}</span></div>}
          <div className="med-bill-row"><span>Payment:</span><span className="badge badge-green">{selected.payment_mode?.toUpperCase() || "CASH"}</span></div>
          <hr className="med-divider" />
          <table style={{ width: "100%", marginBottom: 12, fontSize: 13 }}>
            <thead><tr>
              <th style={{ textAlign: "left", paddingBottom: 8, color: "var(--muted)", fontSize: 11 }}>Medicine</th>
              <th style={{ textAlign: "center" }}>Qty</th><th style={{ textAlign: "right" }}>Unit</th><th style={{ textAlign: "right" }}>Total</th>
            </tr></thead>
            <tbody>{selected.items.map((it, i) => (
              <tr key={i}><td style={{ paddingBottom: 6 }}>{it.medicine_name}</td>
                <td style={{ textAlign: "center" }}>{it.quantity}</td>
                <td style={{ textAlign: "right" }}>{fmt(it.unit_price)}</td>
                <td style={{ textAlign: "right" }}>{fmt(it.total)}</td>
              </tr>
            ))}</tbody>
          </table>
          <hr className="med-divider" />
          <div className="med-bill-row"><span>Subtotal</span><span>{fmt(selected.subtotal)}</span></div>
          {selected.discount_percent > 0 && <div className="med-bill-row" style={{ color: "var(--accent2)" }}><span>Discount ({selected.discount_percent}%)</span><span>-{fmt(selected.discount_amount)}</span></div>}
          <div className="med-bill-row"><span>GST (5%)</span><span>{fmt(selected.tax_amount)}</span></div>
          <hr className="med-divider" />
          <div className="med-bill-row med-bill-total"><span>Grand Total</span><span>{fmt(selected.grand_total)}</span></div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 14 }} className="no-print">
        <button className="med-btn med-btn-primary" onClick={() => window.print()}>🖨 Print</button>
        {selected.customer_phone && (
          <button className="med-btn med-btn-success" onClick={() => {
            const text = encodeURIComponent(`🏥 MedBill | Bill: ${selected.id} | ${fmt(selected.grand_total)}`);
            window.open(`https://wa.me/91${selected.customer_phone.replace(/\D/g, "")}?text=${text}`, "_blank");
          }}>💬 WhatsApp</button>
        )}
        {selected.status === "paid" && role !== "viewer" && (
          <button className="med-btn med-btn-danger" onClick={() => { setRefunding(selected.id); setSelected(null); }}>↩ Refund</button>
        )}
      </div>
    </>
  );

  return (
    <>
      <h1 className="med-title">Bill History</h1>
      {msg && <div className={`med-alert med-alert-${msg.type}`}>{msg.text}</div>}

      <div className="med-card">
        <div className="med-card-label" style={{ marginBottom: 12 }}>🔍 Search & Filter</div>
        <div className="med-form-grid">
          <div className="med-form-group"><label className="med-label">Patient Name</label><input className="med-input" value={filters.patient} onChange={e => setFilters({ ...filters, patient: e.target.value })} placeholder="Search patient…" /></div>
          <div className="med-form-group"><label className="med-label">Doctor</label><input className="med-input" value={filters.doctor} onChange={e => setFilters({ ...filters, doctor: e.target.value })} placeholder="Doctor name…" /></div>
          <div className="med-form-group"><label className="med-label">From Date</label><input className="med-input" type="date" value={filters.from_date} onChange={e => setFilters({ ...filters, from_date: e.target.value })} /></div>
          <div className="med-form-group"><label className="med-label">To Date</label><input className="med-input" type="date" value={filters.to_date} onChange={e => setFilters({ ...filters, to_date: e.target.value })} /></div>
          <div className="med-form-group"><label className="med-label">Payment Mode</label>
            <select className="med-select" value={filters.payment_mode} onChange={e => setFilters({ ...filters, payment_mode: e.target.value })}>
              <option value="">All</option><option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option>
            </select>
          </div>
          <div className="med-form-group"><label className="med-label">Status</label>
            <select className="med-select" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All</option><option value="paid">Paid</option><option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
        <button className="med-btn med-btn-primary" style={{ marginTop: 10 }} onClick={search}>🔍 Search</button>
        <button className="med-btn med-btn-outline-gray med-btn-sm" style={{ marginTop: 10, marginLeft: 8 }} onClick={() => { setFilters({ patient: "", doctor: "", from_date: "", to_date: "", min_amount: "", payment_mode: "", status: "" }); setTimeout(search, 0); }}>✕ Clear</button>
      </div>

      <div className="med-card">
        <div className="med-table-wrap">
          {loading ? <p style={{ color: "var(--muted)" }}>Loading…</p> : (
            <table className="med-table">
              <thead><tr><th>Bill ID</th><th>Patient</th><th>Doctor</th><th>Payment</th><th>Items</th><th>Total</th><th>Date</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {(bills || []).map(b => (
                  <tr key={b.id}>
                    <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{b.id}</td>
                    <td style={{ fontWeight: 600 }}>{b.customer_name}</td>
                    <td style={{ color: "var(--muted)", fontSize: 12 }}>{b.doctor_name || "—"}</td>
                    <td><span className={`badge ${b.payment_mode === "cash" ? "badge-green" : b.payment_mode === "upi" ? "badge-purple" : "badge-blue"}`}>{(b.payment_mode || "cash").toUpperCase()}</span></td>
                    <td>{b.items.length}</td>
                    <td><strong>{fmt(b.grand_total)}</strong></td>
                    <td style={{ color: "var(--muted)", fontSize: 12 }}>{fmtDateShort(b.created_at)}</td>
                    <td><span className={`badge ${b.status === "refunded" ? "badge-red" : "badge-green"}`}>{b.status?.toUpperCase()}</span></td>
                    <td><button className="med-btn med-btn-outline med-btn-sm" onClick={() => setSelected(b)}>View</button></td>
                  </tr>
                ))}
                {!(bills || []).length && <tr><td colSpan={9} style={{ textAlign: "center", color: "var(--muted)", padding: 32 }}>No bills found.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {refunding && (
        <div className="modal-bg">
          <div className="modal">
            <button className="modal-close" onClick={() => setRefunding(null)}>×</button>
            <h2>↩ Refund Bill</h2>
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 16 }}>This will void the bill and restore stock for all items.</p>
            <div className="med-form-group"><label className="med-label">Reason</label>
              <textarea className="med-textarea" value={refundReason} onChange={e => setRefundReason(e.target.value)} placeholder="Customer return, wrong medicine, etc." />
            </div>
            <div className="modal-footer">
              <button className="med-btn med-btn-outline-gray med-btn-sm" onClick={() => setRefunding(null)}>Cancel</button>
              <button className="med-btn med-btn-danger med-btn-sm" onClick={doRefund}>Confirm Refund</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Patient History ───────────────────────────────────────────────────────────
function PatientHistory({ token }) {
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(false);

  async function searchPatients() {
    if (!query.trim()) return;
    setLoading(true);
    const r = await fetch(`${API}/patients/search?q=${encodeURIComponent(query)}`, { headers: makeHeaders(token) });
    setResults(await r.json()); setPatient(null); setLoading(false);
  }

  async function loadPatient(phone) {
    const r = await fetch(`${API}/patients/${phone}/history`, { headers: makeHeaders(token) });
    if (r.ok) setPatient(await r.json());
  }

  return (
    <>
      <h1 className="med-title">Patient History</h1>
      <div className="med-card">
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input className="med-input" style={{ maxWidth: 320 }} placeholder="Search by name or phone…" value={query}
            onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && searchPatients()} />
          <button className="med-btn med-btn-primary" onClick={searchPatients}>🔍 Search</button>
        </div>
      </div>

      {loading && <p style={{ color: "var(--muted)" }}>Searching…</p>}

      {!patient && results && (
        <div className="med-card">
          <div className="med-table-wrap">
            <table className="med-table">
              <thead><tr><th>Name</th><th>Phone</th><th>Total Bills</th><th>Total Spent</th><th>Last Visit</th><th></th></tr></thead>
              <tbody>
                {results.map(p => (
                  <tr key={p._id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>{p.phone}</td>
                    <td>{p.bill_count}</td>
                    <td><strong>{fmt(p.total_spent)}</strong></td>
                    <td style={{ fontSize: 12, color: "var(--muted)" }}>{fmtDateShort(p.last_visit)}</td>
                    <td><button className="med-btn med-btn-outline med-btn-sm" onClick={() => loadPatient(p.phone)}>View History</button></td>
                  </tr>
                ))}
                {!results.length && <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--muted)", padding: 28 }}>No patients found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {patient && (
        <>
          <button className="med-btn med-btn-outline-gray med-btn-sm" onClick={() => setPatient(null)} style={{ marginBottom: 14 }}>← Back</button>
          <div className="patient-card">
            <h3>{patient.customer_name}</h3>
            <div style={{ display: "flex", gap: 20, marginTop: 8, flexWrap: "wrap" }}>
              <div className="stat">📱 {patient.phone}</div>
              <div className="stat">🧾 {patient.total_bills} bills</div>
              <div className="stat">💰 Total: {fmt(patient.total_spent)}</div>
            </div>
          </div>
          <div className="med-card">
            <div className="med-table-wrap">
              <table className="med-table">
                <thead><tr><th>Bill ID</th><th>Doctor</th><th>Items</th><th>Payment</th><th>Total</th><th>Date</th><th>Status</th></tr></thead>
                <tbody>
                  {patient.bills.map(b => (
                    <tr key={b.id}>
                      <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{b.id}</td>
                      <td style={{ fontSize: 12, color: "var(--muted)" }}>{b.doctor_name || "—"}</td>
                      <td>{b.items.length}</td>
                      <td><span className="badge badge-green">{(b.payment_mode || "cash").toUpperCase()}</span></td>
                      <td><strong>{fmt(b.grand_total)}</strong></td>
                      <td style={{ fontSize: 12, color: "var(--muted)" }}>{fmtDateShort(b.created_at)}</td>
                      <td><span className={`badge ${b.status === "refunded" ? "badge-red" : "badge-green"}`}>{b.status?.toUpperCase()}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ─── Suppliers ────────────────────────────────────────────────────────────────
function Suppliers({ token }) {
  const { data: suppliers, loading, reload }       = useFetch(token, "/suppliers", [token]);
  const { data: meds }                             = useFetch(token, "/medicines", [token]);
  const { data: purchases, reload: reloadPurchases } = useFetch(token, "/purchases", [token]);
  const [form, setForm]     = useState({ name: "", phone: "", email: "", address: "" });
  const [tab, setTab]       = useState("list");
  const [purchase, setPurchase] = useState({ supplier_id: "", items: [{ medicine_id: "", quantity: 1, cost_price: 0 }], notes: "" });
  const [msg, setMsg]       = useState(null);

  async function addSupplier() {
    if (!form.name) { setMsg({ type: "error", text: "Supplier name required" }); return; }
    const r = await fetch(`${API}/suppliers`, { method: "POST", headers: makeHeaders(token), body: JSON.stringify(form) });
    if (r.ok) { setMsg({ type: "success", text: "Supplier added!" }); setForm({ name: "", phone: "", email: "", address: "" }); reload(); setTab("list"); }
    else { const d = await r.json(); setMsg({ type: "error", text: d.detail }); }
  }

  const addPurchaseRow    = () => setPurchase(p => ({ ...p, items: [...p.items, { medicine_id: "", quantity: 1, cost_price: 0 }] }));
  const removePurchaseRow = (i) => setPurchase(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));
  const updatePurchaseRow = (i, field, val) => {
    setPurchase(p => { const items = [...p.items]; items[i] = { ...items[i], [field]: val }; return { ...p, items }; });
  };

  async function submitPurchase() {
    if (!purchase.supplier_id) { setMsg({ type: "error", text: "Select a supplier" }); return; }
    const valid = purchase.items.filter(it => it.medicine_id && it.quantity > 0 && it.cost_price >= 0);
    if (!valid.length) { setMsg({ type: "error", text: "Add at least one item" }); return; }
    const r = await fetch(`${API}/purchases`, {
      method: "POST", headers: makeHeaders(token),
      body: JSON.stringify({ ...purchase, items: valid.map(it => ({ ...it, quantity: parseInt(it.quantity), cost_price: parseFloat(it.cost_price) })) }),
    });
    if (r.ok) {
      setMsg({ type: "success", text: "Purchase recorded & stock updated!" });
      setPurchase({ supplier_id: "", items: [{ medicine_id: "", quantity: 1, cost_price: 0 }], notes: "" });
      reloadPurchases(); setTab("history");
    } else { const d = await r.json(); setMsg({ type: "error", text: d.detail }); }
  }

  return (
    <>
      <h1 className="med-title">Suppliers & Purchases</h1>
      {msg && <div className={`med-alert med-alert-${msg.type}`}>{msg.text}</div>}
      <div className="tab-row">
        {[["list", "🏭 Suppliers"], ["add-supplier", "➕ Add Supplier"], ["new-purchase", "📦 New Purchase"], ["history", "📋 Purchase History"]].map(([id, label]) => (
          <button key={id} className={`tab-btn ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === "list" && (
        <div className="med-card">
          <div className="med-table-wrap">
            {loading ? <p>Loading…</p> : (
              <table className="med-table">
                <thead><tr><th>ID</th><th>Name</th><th>Phone</th><th>Email</th><th>Address</th></tr></thead>
                <tbody>
                  {(suppliers || []).map(s => (
                    <tr key={s.id}><td style={{ fontFamily: "monospace", fontSize: 11 }}>{s.id}</td>
                      <td style={{ fontWeight: 600 }}>{s.name}</td><td>{s.phone || "—"}</td><td>{s.email || "—"}</td><td style={{ fontSize: 12, color: "var(--muted)" }}>{s.address || "—"}</td>
                    </tr>
                  ))}
                  {!(suppliers || []).length && <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--muted)", padding: 28 }}>No suppliers yet.</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === "add-supplier" && (
        <div className="med-card">
          <div className="med-form-grid">
            <div className="med-form-group"><label className="med-label">Name *</label><input className="med-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="med-form-group"><label className="med-label">Phone</label><input className="med-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="med-form-group"><label className="med-label">Email</label><input className="med-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div className="med-form-group"><label className="med-label">Address</label><input className="med-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
          </div>
          <button className="med-btn med-btn-primary" style={{ marginTop: 10 }} onClick={addSupplier}>＋ Add Supplier</button>
        </div>
      )}

      {tab === "new-purchase" && (
        <>
          <div className="med-card">
            <div className="med-form-group" style={{ maxWidth: 320, marginBottom: 14 }}>
              <label className="med-label">Supplier *</label>
              <select className="med-select" value={purchase.supplier_id} onChange={e => setPurchase({ ...purchase, supplier_id: e.target.value })}>
                <option value="">— Select Supplier —</option>
                {(suppliers || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            {purchase.items.map((row, i) => (
              <div className="med-item-row" key={i}>
                <select className="med-select" value={row.medicine_id} onChange={e => updatePurchaseRow(i, "medicine_id", e.target.value)}>
                  <option value="">— Select Medicine —</option>
                  {(meds || []).map(m => <option key={m.id} value={m.id}>{m.name} (current stock: {m.stock})</option>)}
                </select>
                <input className="med-input med-item-qty" type="number" min="1" value={row.quantity} placeholder="Qty" onChange={e => updatePurchaseRow(i, "quantity", e.target.value)} />
                <input className="med-input med-item-qty" type="number" min="0" value={row.cost_price} placeholder="₹ Cost" onChange={e => updatePurchaseRow(i, "cost_price", e.target.value)} />
                {purchase.items.length > 1 && <button className="med-btn med-btn-danger med-btn-sm" onClick={() => removePurchaseRow(i)}>✕</button>}
              </div>
            ))}
            <button className="med-btn med-btn-outline-gray med-btn-sm" onClick={addPurchaseRow}>＋ Add Item</button>
          </div>
          <div className="med-card">
            <div className="med-form-group"><label className="med-label">Notes</label><textarea className="med-textarea" value={purchase.notes} onChange={e => setPurchase({ ...purchase, notes: e.target.value })} placeholder="Optional notes…" /></div>
            <button className="med-btn med-btn-primary" style={{ marginTop: 10 }} onClick={submitPurchase}>📦 Record Purchase & Update Stock</button>
          </div>
        </>
      )}

      {tab === "history" && (
        <div className="med-card">
          <div className="med-table-wrap">
            <table className="med-table">
              <thead><tr><th>ID</th><th>Supplier</th><th>Items</th><th>Total Cost</th><th>By</th><th>Date</th></tr></thead>
              <tbody>
                {(purchases || []).map(p => (
                  <tr key={p.id}><td style={{ fontFamily: "monospace", fontSize: 11 }}>{p.id}</td>
                    <td style={{ fontWeight: 600 }}>{p.supplier_name}</td>
                    <td>{p.items.length}</td>
                    <td><strong>{fmt(p.total_cost)}</strong></td>
                    <td style={{ fontSize: 12, color: "var(--muted)" }}>{p.created_by}</td>
                    <td style={{ fontSize: 12, color: "var(--muted)" }}>{fmtDateShort(p.created_at)}</td>
                  </tr>
                ))}
                {!(purchases || []).length && <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--muted)", padding: 28 }}>No purchases yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

// ─── User Roles (Admin only) ───────────────────────────────────────────────────
function UserRoles({ token }) {
  const { data: users, loading, reload } = useFetch(token, "/users", [token]);
  const [msg, setMsg] = useState(null);

  async function updateRole(username, role) {
    const r = await fetch(`${API}/users/${username}/role`, { method: "PATCH", headers: makeHeaders(token), body: JSON.stringify({ role }) });
    if (r.ok) { setMsg({ type: "success", text: `${username} is now ${role}` }); reload(); }
    else { const d = await r.json(); setMsg({ type: "error", text: d.detail }); }
  }

  return (
    <>
      <h1 className="med-title">User Management</h1>
      {msg && <div className={`med-alert med-alert-${msg.type}`}>{msg.text}</div>}
      <div className="med-card">
        <div className="med-table-wrap">
          {loading ? <p>Loading…</p> : (
            <table className="med-table">
              <thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Change Role</th></tr></thead>
              <tbody>
                {(users || []).map(u => (
                  <tr key={u.username}>
                    <td style={{ fontWeight: 600 }}>{u.username}</td>
                    <td style={{ fontSize: 12, color: "var(--muted)" }}>{u.email}</td>
                    <td><span className={`badge ${u.role === "admin" ? "badge-purple" : u.role === "cashier" ? "badge-green" : "badge-gray"}`}>{u.role}</span></td>
                    <td>
                      <select className="med-select" style={{ width: 130 }} value={u.role} onChange={e => updateRole(u.username, e.target.value)}>
                        <option value="admin">Admin</option>
                        <option value="cashier">Cashier</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <div className="med-card" style={{ background: "#fef3e2", border: "1px solid rgba(230,126,34,.2)" }}>
        <div style={{ fontSize: 13, color: "var(--warn)" }}>
          <strong>Role Permissions:</strong><br />
          <strong>Admin</strong> — Full access, manage users, deactivate medicines<br />
          <strong>Cashier</strong> — Create bills, add medicines, record purchases<br />
          <strong>Viewer</strong> — Read-only dashboard and reports
        </div>
      </div>
    </>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
// ✅ FIX: accepts token as a prop — never reads localStorage itself
export default function MedicalBilling({ token }) {
  const [page, setPage]       = useState("dashboard");
  const [billKey, setBillKey] = useState(0);
  const [toast, setToast]     = useState(null);
  const showToast = useCallback((msg, type = "success") => setToast({ msg, type }), []);

  const role = (() => {
    try { return JSON.parse(atob(token.split(".")[1])).role || "cashier"; } catch { return "cashier"; }
  })();

  const nav = [
    { section: "Main" },
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "new-bill",  icon: "🧾", label: "New Bill" },
    { id: "history",   icon: "📋", label: "History" },
    { section: "Inventory" },
    { id: "medicines", icon: "💊", label: "Medicines" },
    { id: "suppliers", icon: "🏭", label: "Suppliers" },
    { section: "Analytics" },
    { id: "reports",   icon: "📈", label: "Sales Report" },
    { id: "patients",  icon: "👤", label: "Patients" },
    ...(role === "admin" ? [{ section: "Admin" }, { id: "users", icon: "🔐", label: "Users" }] : []),
  ];

  return (
    <>
      <style>{css}</style>
      <div className="med-app">
        <nav className="med-sidebar">
          <div className="med-logo"><span>🏥</span><span>MedBill</span></div>
          <div className="med-logo-sub">Pharmacy System</div>
          <div className="med-role-chip">{role}</div>
          {nav.map((n, i) => n.section
            ? <div key={i} className="med-nav-section">{n.section}</div>
            : <button key={n.id} className={`med-nav-btn${page === n.id ? " active" : ""}`} onClick={() => setPage(n.id)}>
              <span className="med-nav-icon">{n.icon}</span><span>{n.label}</span>
            </button>
          )}
        </nav>
        <main className="med-main">
          {page === "dashboard" && <Dashboard    token={token} />}
          {page === "new-bill"  && <NewBill      token={token} key={billKey} onBillCreated={() => setBillKey(k => k + 1)} />}
          {page === "history"   && <BillHistory  token={token} role={role} />}
          {page === "medicines" && <MedicineList token={token} role={role} />}
          {page === "suppliers" && <Suppliers    token={token} />}
          {page === "reports"   && <SalesReport  token={token} />}
          {page === "patients"  && <PatientHistory token={token} />}
          {page === "users"     && role === "admin" && <UserRoles token={token} />}
        </main>
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}