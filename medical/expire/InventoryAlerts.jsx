import { useState, useEffect, useCallback } from "react";

// ─── CONFIG ────────────────────────────────────────────────────────────────
const API = "http://localhost:8000";

const getToken = () => localStorage.getItem("token");
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const apiFetch = async (path, opts = {}) => {
  const res = await fetch(`${API}${path}`, { headers: authHeaders(), ...opts });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Network error" }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
};

// ─── STYLES ────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;600;700;800&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:      #0d0f14;
    --surface: #151820;
    --card:    #1c2030;
    --border:  #262b3a;
    --text:    #e8eaf0;
    --muted:   #6b7280;
    --accent:  #4fffb0;
    --warn:    #ffb547;
    --danger:  #ff5a5a;
    --info:    #5ab4ff;
    --purple:  #b47fff;
    --font-h:  'Syne', sans-serif;
    --font-m:  'DM Mono', monospace;
  }

  body { background: var(--bg); color: var(--text); font-family: var(--font-h); }

  .inv-tabs {
    display: flex; gap: 4px; padding: 16px 0 0 0; margin-bottom: 24px;
    border-bottom: 1px solid var(--border);
  }
  .inv-tab {
    padding: 8px 20px; border-radius: 8px 8px 0 0; cursor: pointer;
    font-size: 13px; font-weight: 700; color: var(--muted);
    background: transparent; border: none; font-family: var(--font-h);
    transition: all 0.15s; position: relative; margin-bottom: -1px;
  }
  .inv-tab:hover { color: var(--text); }
  .inv-tab.active {
    color: var(--accent); background: var(--card);
    border: 1px solid var(--border); border-bottom-color: var(--card);
  }
  .tab-badge {
    display: inline-block; margin-left: 6px;
    background: var(--danger); color: #fff;
    font-size: 10px; font-weight: 700; border-radius: 10px;
    padding: 1px 6px; font-family: var(--font-m); vertical-align: middle;
  }

  .summary-grid {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px;
  }
  .summary-card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 12px; padding: 18px 20px; position: relative; overflow: hidden;
    transition: transform 0.15s;
  }
  .summary-card:hover { transform: translateY(-2px); }
  .sc-label { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; color: var(--muted); text-transform: uppercase; margin-bottom: 8px; }
  .sc-value { font-size: 32px; font-weight: 800; line-height: 1; }
  .sc-sub   { font-size: 11px; color: var(--muted); font-family: var(--font-m); margin-top: 5px; }
  .sc-icon  { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); font-size: 32px; opacity: 0.12; }
  .sc-expired { border-color: rgba(255,90,90,0.3); }
  .sc-expired .sc-value { color: var(--danger); }
  .sc-soon    { border-color: rgba(255,181,71,0.3); }
  .sc-soon .sc-value { color: var(--warn); }
  .sc-low     { border-color: rgba(90,180,255,0.3); }
  .sc-low .sc-value { color: var(--info); }
  .sc-total   { border-color: rgba(79,255,176,0.3); }
  .sc-total .sc-value { color: var(--accent); }

  .controls { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
  .sec-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; flex-wrap: wrap; gap: 10px; }
  .sec-title  { font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 8px; }

  .search-input {
    background: var(--card); border: 1px solid var(--border); border-radius: 8px;
    padding: 7px 13px; color: var(--text); font-family: var(--font-m); font-size: 13px;
    outline: none; width: 200px; transition: border-color 0.2s;
  }
  .search-input:focus { border-color: var(--accent); }
  .select-input {
    background: var(--card); border: 1px solid var(--border); border-radius: 8px;
    padding: 7px 13px; color: var(--text); font-family: var(--font-m); font-size: 13px;
    outline: none; cursor: pointer;
  }
  .btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 16px; border-radius: 8px; border: none; cursor: pointer;
    font-family: var(--font-h); font-weight: 700; font-size: 13px; transition: all 0.15s;
  }
  .btn-primary { background: var(--accent); color: #0d1a13; }
  .btn-primary:hover { background: #3de89a; }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-outline { background: transparent; color: var(--text); border: 1px solid var(--border); }
  .btn-outline:hover { border-color: var(--accent); color: var(--accent); }
  .btn-sm { padding: 5px 12px; font-size: 12px; }

  .table-wrap {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 12px; overflow: hidden; margin-bottom: 24px;
  }
  table { width: 100%; border-collapse: collapse; }
  th {
    text-align: left; padding: 11px 16px; font-size: 10px; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted);
    background: rgba(255,255,255,0.02); border-bottom: 1px solid var(--border);
    font-family: var(--font-m);
  }
  td { padding: 12px 16px; font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: rgba(255,255,255,0.015); }
  .med-name { font-weight: 600; }
  .med-id   { font-family: var(--font-m); font-size: 11px; color: var(--muted); }

  .pill {
    display: inline-block; padding: 3px 10px; border-radius: 20px;
    font-size: 11px; font-weight: 700; font-family: var(--font-m); white-space: nowrap;
  }
  .pill-expired  { background: rgba(255,90,90,0.15);   color: var(--danger); border: 1px solid rgba(255,90,90,0.3); }
  .pill-soon     { background: rgba(255,181,71,0.15);  color: var(--warn);   border: 1px solid rgba(255,181,71,0.3); }
  .pill-ok       { background: rgba(79,255,176,0.1);   color: var(--accent); border: 1px solid rgba(79,255,176,0.2); }
  .pill-low      { background: rgba(90,180,255,0.15);  color: var(--info);   border: 1px solid rgba(90,180,255,0.3); }
  .pill-critical { background: rgba(180,127,255,0.15); color: var(--purple); border: 1px solid rgba(180,127,255,0.3); }
  .badge { font-size: 11px; font-family: var(--font-m); padding: 2px 9px; border-radius: 20px; }
  .badge-muted   { background: rgba(107,114,128,0.15); color: var(--muted); }
  .badge-success { background: rgba(79,255,176,0.12);  color: var(--accent); }

  .days-chip { font-family: var(--font-m); font-size: 11px; padding: 3px 8px; border-radius: 5px; display: inline-block; margin-top: 3px; }
  .days-expired { color: var(--danger); background: rgba(255,90,90,0.1); }
  .days-urgent  { color: var(--warn);   background: rgba(255,181,71,0.1); }
  .days-soon    { color: var(--info);   background: rgba(90,180,255,0.1); }
  .days-ok      { color: var(--accent); background: rgba(79,255,176,0.07); }

  .stock-bar-wrap { display: flex; align-items: center; gap: 8px; }
  .stock-bar-bg   { height: 5px; background: rgba(255,255,255,0.06); border-radius: 4px; flex: 1; min-width: 70px; }
  .stock-bar-fill { height: 100%; border-radius: 4px; transition: width 0.4s; }

  .modal-bg {
    position: fixed; inset: 0; background: rgba(0,0,0,0.75);
    display: flex; align-items: center; justify-content: center; z-index: 200; padding: 20px;
  }
  .modal {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 16px; width: 460px; max-width: 100%; padding: 28px; position: relative;
  }
  .modal h2 { font-size: 18px; font-weight: 800; margin-bottom: 18px; }
  .modal-close { position: absolute; top: 14px; right: 14px; background: none; border: none; color: var(--muted); cursor: pointer; font-size: 20px; }
  .modal-close:hover { color: var(--text); }
  .field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; }
  .field label { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; color: var(--muted); text-transform: uppercase; }
  .field input {
    background: var(--card); border: 1px solid var(--border); border-radius: 8px;
    padding: 9px 13px; color: var(--text); font-family: var(--font-m); font-size: 13px; outline: none; transition: border-color 0.2s;
  }
  .field input:focus { border-color: var(--accent); }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .modal-footer { display: flex; gap: 8px; justify-content: flex-end; margin-top: 18px; }
  .error-msg { color: var(--danger); font-size: 12px; font-family: var(--font-m); margin-bottom: 8px; }

  .empty { text-align: center; padding: 44px; color: var(--muted); }
  .empty-icon { font-size: 42px; margin-bottom: 10px; opacity: 0.35; }
  .empty p { font-size: 13px; }
  .loading { text-align: center; padding: 52px; color: var(--muted); font-family: var(--font-m); }
  .spinner { display: inline-block; width: 28px; height: 28px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 10px; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .toast {
    position: fixed; bottom: 20px; right: 20px;
    background: var(--card); border: 1px solid var(--border);
    border-radius: 10px; padding: 11px 18px; font-size: 13px; z-index: 300;
    animation: slideUp 0.2s ease; display: flex; align-items: center; gap: 8px;
  }
  .toast-success { border-color: rgba(79,255,176,0.4); }
  .toast-error   { border-color: rgba(255,90,90,0.4); }
  @keyframes slideUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

  @media (max-width: 800px) { .summary-grid { grid-template-columns: repeat(2, 1fr); } }
`;

// ─── UTILS ─────────────────────────────────────────────────────────────────
const daysLabel = (d) => {
  if (d === null || d === undefined) return null;
  if (d < 0)   return { label: `Expired ${Math.abs(d)}d ago`, cls: "days-expired" };
  if (d === 0) return { label: "Expires today!", cls: "days-urgent" };
  if (d <= 30) return { label: `${d}d left`, cls: "days-urgent" };
  if (d <= 90) return { label: `${d}d left`, cls: "days-soon" };
  return { label: `${d}d left`, cls: "days-ok" };
};

const expiryPill = (expiry_date) => {
  if (!expiry_date) return <span className="pill pill-ok">No date</span>;
  const days = Math.floor((new Date(expiry_date) - new Date()) / 86400000);
  if (days < 0)   return <span className="pill pill-expired">Expired</span>;
  if (days <= 30) return <span className="pill pill-soon">Expiring Soon</span>;
  if (days <= 90) return <span className="pill pill-low">Watch</span>;
  return <span className="pill pill-ok">Good</span>;
};

const StockBar = ({ stock, threshold = 20 }) => {
  const pct   = Math.min((stock / 300) * 100, 100);
  const color = stock < threshold ? "var(--danger)" : stock < threshold * 2 ? "var(--warn)" : "var(--accent)";
  return (
    <div className="stock-bar-wrap">
      <div className="stock-bar-bg">
        <div className="stock-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span style={{ fontFamily: "var(--font-m)", fontSize: 12, minWidth: 28, textAlign: "right", color: stock < threshold ? "var(--danger)" : "var(--text)" }}>
        {stock}
      </span>
    </div>
  );
};

// ─── TOAST ─────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`toast toast-${type}`}>
      <span>{type === "success" ? "✓" : "✕"}</span>{msg}
    </div>
  );
}

// ─── MEDICINE MODAL ────────────────────────────────────────────────────────
function MedicineModal({ med, onClose, onSaved, toast }) {
  const isEdit = !!med?.id;
  const [form, setForm] = useState({
    name: med?.name || "",
    price: med?.price || "",
    stock: med?.stock || "",
    category: med?.category || "",
    expiry_date: med?.expiry_date || "",
    min_stock_threshold: med?.min_stock_threshold ?? 20,
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setErr(""); setLoading(true);
    try {
      if (isEdit) {
        await apiFetch(`/medicines/${med.id}`, {
          method: "PATCH",
          body: JSON.stringify({ price: +form.price, stock: +form.stock, expiry_date: form.expiry_date || null, min_stock_threshold: +form.min_stock_threshold }),
        });
        toast("Medicine updated!", "success");
      } else {
        await apiFetch("/medicines", {
          method: "POST",
          body: JSON.stringify({ ...form, price: +form.price, stock: +form.stock, min_stock_threshold: +form.min_stock_threshold }),
        });
        toast("Medicine added!", "success");
      }
      onSaved();
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>{isEdit ? "Edit Medicine" : "Add Medicine"}</h2>
        <div className="field">
          <label>Medicine Name</label>
          <input value={form.name} onChange={set("name")} disabled={isEdit} placeholder="e.g. Paracetamol 500mg" />
        </div>
        <div className="form-row">
          <div className="field"><label>Price (₹)</label><input type="number" value={form.price} onChange={set("price")} /></div>
          <div className="field"><label>Stock (units)</label><input type="number" value={form.stock} onChange={set("stock")} /></div>
        </div>
        <div className="form-row">
          <div className="field"><label>Category</label><input value={form.category} onChange={set("category")} disabled={isEdit} /></div>
          <div className="field"><label>Min Stock Threshold</label><input type="number" value={form.min_stock_threshold} onChange={set("min_stock_threshold")} /></div>
        </div>
        <div className="field"><label>Expiry Date</label><input type="date" value={form.expiry_date} onChange={set("expiry_date")} /></div>
        {err && <p className="error-msg">⚠ {err}</p>}
        <div className="modal-footer">
          <button className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={save} disabled={loading}>
            {loading ? "Saving…" : isEdit ? "Save Changes" : "Add Medicine"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ALERTS TAB ────────────────────────────────────────────────────────────
function AlertsTab({ toast }) {
  const [expiryData, setExpiryData] = useState(null);
  const [lowData, setLowData]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [subTab, setSubTab]         = useState("expiry");
  const [days, setDays]             = useState(90);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [exp, low] = await Promise.all([
        apiFetch(`/medicines/alerts/expiry?days=${days}`),
        apiFetch("/medicines/alerts/low-stock"),
      ]);
      setExpiryData(exp); setLowData(low);
    } catch (e) { toast(e.message, "error"); }
    finally { setLoading(false); }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="loading"><div className="spinner" /><p>Loading alerts…</p></div>;

  const allExpiry = [...(expiryData?.expired || []), ...(expiryData?.expiring_soon || [])];
  const lowItems  = lowData?.items || [];

  return (
    <div>
      <div className="sec-header">
        <div style={{ display: "flex", gap: 6 }}>
          {[["expiry", "⏱ Expiry Alerts", (expiryData?.expired_count||0)+(expiryData?.expiring_soon_count||0)],
            ["low",    "📦 Low Stock",     lowData?.low_stock_count||0]].map(([id, label, count]) => (
            <button key={id} className={`btn btn-sm ${subTab === id ? "btn-primary" : "btn-outline"}`}
              onClick={() => setSubTab(id)}>
              {label}{count > 0 && <span className="tab-badge">{count}</span>}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {subTab === "expiry" && (
            <select className="select-input" value={days} onChange={e => setDays(+e.target.value)}>
              <option value={30}>Next 30 days</option>
              <option value={60}>Next 60 days</option>
              <option value={90}>Next 90 days</option>
              <option value={180}>Next 180 days</option>
            </select>
          )}
          <button className="btn btn-outline btn-sm" onClick={load}>↻ Refresh</button>
        </div>
      </div>

      {subTab === "expiry" && (
        <div className="table-wrap">
          {allExpiry.length === 0
            ? <div className="empty"><div className="empty-icon">✅</div><p>No expiry alerts in this window.</p></div>
            : <table>
                <thead><tr><th>Medicine</th><th>Category</th><th>Stock</th><th>Expiry Date</th><th>Status</th><th>Time Left</th></tr></thead>
                <tbody>
                  {allExpiry.map(m => {
                    const dl = daysLabel(m.days_until_expiry);
                    return (
                      <tr key={m.id}>
                        <td><div className="med-name">{m.name}</div><div className="med-id">{m.id}</div></td>
                        <td><span className="badge badge-muted">{m.category}</span></td>
                        <td><StockBar stock={m.stock} threshold={m.min_stock_threshold||20} /></td>
                        <td style={{ fontFamily:"var(--font-m)", fontSize:12, color:"var(--muted)" }}>{m.expiry_date}</td>
                        <td>{m.status === "expired" ? <span className="pill pill-expired">⚠ Expired</span> : <span className="pill pill-soon">⏱ Expiring Soon</span>}</td>
                        <td>{dl && <span className={`days-chip ${dl.cls}`}>{dl.label}</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
          }
        </div>
      )}

      {subTab === "low" && (
        <div className="table-wrap">
          {lowItems.length === 0
            ? <div className="empty"><div className="empty-icon">📦</div><p>All medicines have sufficient stock.</p></div>
            : <table>
                <thead><tr><th>Medicine</th><th>Category</th><th>Current Stock</th><th>Min Threshold</th><th>Shortage</th><th>Expiry</th></tr></thead>
                <tbody>
                  {lowItems.map(m => (
                    <tr key={m.id}>
                      <td><div className="med-name">{m.name}</div><div className="med-id">{m.id}</div></td>
                      <td><span className="badge badge-muted">{m.category}</span></td>
                      <td><StockBar stock={m.stock} threshold={m.min_stock_threshold||20} /></td>
                      <td style={{ fontFamily:"var(--font-m)", fontSize:12, color:"var(--muted)" }}>{m.min_stock_threshold||20}</td>
                      <td><span className="pill pill-critical">Need {m.shortage} more</span></td>
                      <td>{expiryPill(m.expiry_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
      )}
    </div>
  );
}

// ─── INVENTORY TAB ─────────────────────────────────────────────────────────
function InventoryTab({ toast }) {
  const [meds, setMeds]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("all");
  const [modal, setModal]     = useState(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    try { setMeds(await apiFetch("/medicines")); }
    catch (e) { toast(e.message, "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = meds.filter(m => {
    const q = search.toLowerCase();
    if (!(m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q))) return false;
    if (filter === "low")      return m.stock < (m.min_stock_threshold||20);
    if (filter === "expiring") return m.expiry_date && Math.floor((new Date(m.expiry_date) - new Date()) / 86400000) <= 90;
    if (filter === "expired")  return m.expiry_date && new Date(m.expiry_date) < new Date();
    return true;
  });

  return (
    <div>
      <div className="sec-header">
        <div className="sec-title">
          💊 All Medicines <span className="badge badge-success">{meds.length} total</span>
        </div>
        <div className="controls">
          <input className="search-input" placeholder="Search name or ID…" value={search} onChange={e => setSearch(e.target.value)} />
          <select className="select-input" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="low">Low Stock</option>
            <option value="expiring">Expiring (90d)</option>
            <option value="expired">Expired</option>
          </select>
          <button className="btn btn-primary btn-sm" onClick={() => setModal(null)}>+ Add</button>
          <button className="btn btn-outline btn-sm" onClick={load}>↻</button>
        </div>
      </div>

      {loading
        ? <div className="loading"><div className="spinner" /><p>Loading…</p></div>
        : <div className="table-wrap">
            {filtered.length === 0
              ? <div className="empty"><div className="empty-icon">🔍</div><p>No medicines match your filter.</p></div>
              : <table>
                  <thead>
                    <tr><th>ID</th><th>Medicine</th><th>Category</th><th>Price</th><th>Stock</th><th>Expiry</th><th>Status</th><th></th></tr>
                  </thead>
                  <tbody>
                    {filtered.map(m => {
                      const days = m.expiry_date ? Math.floor((new Date(m.expiry_date) - new Date()) / 86400000) : null;
                      const dl   = daysLabel(days);
                      return (
                        <tr key={m.id}>
                          <td><span className="med-id">{m.id}</span></td>
                          <td><span className="med-name">{m.name}</span></td>
                          <td><span className="badge badge-muted">{m.category}</span></td>
                          <td style={{ fontFamily:"var(--font-m)", fontSize:12 }}>₹{m.price?.toFixed(2)}</td>
                          <td style={{ minWidth:130 }}><StockBar stock={m.stock} threshold={m.min_stock_threshold||20} /></td>
                          <td>
                            <span style={{ fontFamily:"var(--font-m)", fontSize:11, color:"var(--muted)" }}>{m.expiry_date||"—"}</span>
                            {dl && <div><span className={`days-chip ${dl.cls}`}>{dl.label}</span></div>}
                          </td>
                          <td>{expiryPill(m.expiry_date)}</td>
                          <td><button className="btn btn-outline btn-sm" onClick={() => setModal(m)}>Edit</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
            }
          </div>
      }

      {modal !== undefined && (
        <MedicineModal med={modal} onClose={() => setModal(undefined)}
          onSaved={() => { setModal(undefined); load(); }} toast={toast} />
      )}
    </div>
  );
}

// ─── ROOT — plug this into your existing app ───────────────────────────────
// Uses localStorage "token" (already set by your login system)
export default function InventoryAlerts() {
  const [tab, setTab]         = useState("alerts");
  const [summary, setSummary] = useState(null);
  const [toast, setToast]     = useState(null);
  const showToast = useCallback((msg, type = "success") => setToast({ msg, type }), []);

  const loadSummary = useCallback(async () => {
    try { setSummary(await apiFetch("/medicines/alerts/summary")); } catch {}
  }, []);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  return (
    <>
      <style>{css}</style>

      {summary && (
        <div className="summary-grid">
          <div className="summary-card sc-expired">
            <div className="sc-label">Expired</div>
            <div className="sc-value">{summary.expired_count}</div>
            <div className="sc-sub">Remove from shelf</div>
            <div className="sc-icon">☠</div>
          </div>
          <div className="summary-card sc-soon">
            <div className="sc-label">Expiring Soon</div>
            <div className="sc-value">{summary.expiring_soon_count}</div>
            <div className="sc-sub">Within 90 days</div>
            <div className="sc-icon">⏱</div>
          </div>
          <div className="summary-card sc-low">
            <div className="sc-label">Low Stock</div>
            <div className="sc-value">{summary.low_stock_count}</div>
            <div className="sc-sub">Below threshold</div>
            <div className="sc-icon">📦</div>
          </div>
          <div className="summary-card sc-total">
            <div className="sc-label">Total Alerts</div>
            <div className="sc-value">{summary.total_alerts}</div>
            <div className="sc-sub">Need attention</div>
            <div className="sc-icon">🔔</div>
          </div>
        </div>
      )}

      <div className="inv-tabs">
        <button className={`inv-tab ${tab === "alerts" ? "active" : ""}`}
          onClick={() => { setTab("alerts"); loadSummary(); }}>
          🚨 Alerts
          {(summary?.total_alerts || 0) > 0 && <span className="tab-badge">{summary.total_alerts}</span>}
        </button>
        <button className={`inv-tab ${tab === "inventory" ? "active" : ""}`}
          onClick={() => setTab("inventory")}>
          💊 Inventory
        </button>
      </div>

      {tab === "alerts"    && <AlertsTab    toast={showToast} />}
      {tab === "inventory" && <InventoryTab toast={showToast} />}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
