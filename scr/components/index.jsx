import { useState, useEffect } from "react";

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export function Card({ children, style }) {
  return <div className="card" style={style}>{children}</div>;
}

export function SectionLabel({ icon, text }) {
  return (
    <div className="section-label">
      {icon && <span className="section-label-icon">{icon}</span>}
      <span>{text}</span>
    </div>
  );
}

export function InfoBanner({ type = "info", children }) {
  return <div className={`banner banner-${type}`}>{children}</div>;
}

export function Btn({ variant = "ghost", size = "md", disabled, onClick, children, style, title }) {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      disabled={disabled}
      onClick={onClick}
      style={style}
      title={title}
    >
      {children}
    </button>
  );
}

export function Toast({ msg, type = "success", onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`toast toast-${type}`}>
      {type === "success" ? "✓" : type === "error" ? "✕" : "ℹ"} {msg}
    </div>
  );
}

export function ProxyBadge({ status }) {
  const c = {
    idle:    { i: "◎", l: "Standby", cls: "proxy-idle" },
    testing: { i: "◌", l: "Testing", cls: "proxy-testing" },
    ok:      { i: "●", l: "Active",  cls: "proxy-ok" },
    failed:  { i: "○", l: "Failed",  cls: "proxy-failed" },
  }[status] || { i: "◎", l: "Standby", cls: "proxy-idle" };
  return (
    <div className={`proxy-badge ${c.cls}`}>
      <span>{c.i}</span><span>{c.l.toUpperCase()}</span>
    </div>
  );
}

export function EmptyState({ icon, message, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-msg">{message}</div>
      {action}
    </div>
  );
}

export function CleanToggle({ ico, lbl, desc, checked, onChange }) {
  return (
    <label className={`clean-toggle ${checked ? "clean-toggle-on" : ""}`}>
      <div className="clean-toggle-left">
        <span className="clean-toggle-icon">{ico}</span>
        <div>
          <div className="clean-toggle-label">{lbl}</div>
          <div className="clean-toggle-desc">{desc}</div>
        </div>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        style={{ accentColor: "var(--accent)", width: 15, height: 15 }}
      />
    </label>
  );
}

export function ToggleSwitch({ checked, onChange }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        position: "relative", display: "inline-flex", alignItems: "center",
        width: 40, height: 22, borderRadius: 11, cursor: "pointer", flexShrink: 0,
        background: checked ? "var(--accent)" : "#d0d5dd",
        transition: "background .2s",
        boxShadow: checked ? "0 0 0 3px var(--accent-light)" : "none",
      }}
    >
      <div style={{
        position: "absolute", top: 3, left: checked ? 21 : 3,
        width: 16, height: 16, borderRadius: "50%", background: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,.25)", transition: "left .18s",
      }} />
    </div>
  );
}
