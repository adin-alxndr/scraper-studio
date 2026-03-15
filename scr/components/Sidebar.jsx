import { ProxyBadge } from "./ui/index.jsx";

export function Sidebar({ tab, setTab, nav, proxy, hist, res, cleaned, errs }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-name">SCRAPER</div>
        <div className="sidebar-brand-sub">PERSONAL WEB TOOL</div>
      </div>
      {nav.map(n => (
        <button
          key={n.id}
          className={`nav-btn ${tab === n.id ? "active" : ""}`}
          onClick={() => setTab(n.id)}
        >
          <span style={{ fontSize: 13 }}>{n.icon}</span>
          {n.label}
          {n.badge ? <span className="tag" style={{ marginLeft: "auto", fontSize: 9 }}>{n.badge}</span> : null}
        </button>
      ))}
      <div className="sidebar-footer">
        <ProxyBadge status={proxy} />
        <div className="sidebar-stats">
          <div>Sessions: {hist.length}</div>
          <div>Rows: {res.length}</div>
          {cleaned && <div style={{ color: "#e65100" }}>Cleaned ✓</div>}
          {errs.length > 0 && <div style={{ color: "#c62828" }}>Errors: {errs.length}</div>}
        </div>
      </div>
    </aside>
  );
}
