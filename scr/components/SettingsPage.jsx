import { useState } from "react";
import { DEFAULT_SETTINGS, SETTING_META, BADGE_COLORS } from "../utils/settings";
import { Btn, ToggleSwitch } from "./ui/index.jsx";

export function SettingsPage({ settings, onChange, onAntiBotReport }) {
  const [saved, setSaved]           = useState(false);
  const [justToggled, setJustToggled] = useState(null);

  const toggle = (key) => {
    const next = { ...settings, [key]: !settings[key] };
    onChange(next);
    setSaved(true);
    setJustToggled(key);
    setTimeout(() => setSaved(false), 2000);
    setTimeout(() => setJustToggled(null), 600);
  };

  const enableAll = (keys) => {
    const next = { ...settings };
    keys.forEach(k => { next[k] = true; });
    onChange(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const disableAll = (keys) => {
    const next = { ...settings };
    keys.forEach(k => { next[k] = false; });
    onChange(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const resetDefaults = () => {
    onChange({ ...DEFAULT_SETTINGS });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sections = [
    {
      id: "core", icon: "⚙️", title: "Core Engine",
      desc: "Fundamental scraping behaviours — pagination, API discovery and encoding. These are safe to leave ON for most sites.",
      items: ["pagination","detectAPI","detectGraphQL","encodingFix"],
    },
    {
      id: "dynamic", icon: "🔄", title: "Dynamic Content",
      desc: "Handles pages that load content after the initial HTML, such as lazy images or infinite scroll patterns.",
      items: ["infiniteScroll","endlessButton","lazyLoad","shadowDOM"],
    },
    {
      id: "security", icon: "🔐", title: "Security / Session",
      desc: "Manages session cookies, CSRF tokens and authentication state across multiple page fetches.",
      items: ["csrfHandling","cookieLogin","persistentCookies"],
    },
    {
      id: "extraction", icon: "📎", title: "Advanced Extraction",
      desc: "Detects downloadable file links and HTML forms with file upload fields, adding them to the result table.",
      items: ["attachmentDownload","formUploadDetect"],
    },
    {
      id: "antibot", icon: "🛡️", title: "Anti-Bot & Shield Bypass",
      desc: "Reduces bot-detection risk and handles challenge pages and ASP.NET security tokens.",
      items: ["antibotMode","cloudflareDetect","aspShieldBypass"],
    },
  ];

  const enabledCount = Object.values(settings).filter(Boolean).length;
  const totalCount   = Object.keys(DEFAULT_SETTINGS).length;

  return (
    <div className="page-scroll">
      <div className="page-content">

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Settings</h1>
            <p className="page-subtitle">
              {enabledCount}/{totalCount} features enabled
              {saved && <span style={{ marginLeft: 10, color: "#2e7d32", fontSize: 11, fontWeight: 700 }}>✓ Saved</span>}
            </p>
          </div>
        </div>

        {/* Sections */}
        <div style={{ display: "grid", gap: 18 }}>
          {sections.map(section => (
            <div key={section.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>

              {/* Section header */}
              <div style={{ padding: "12px 18px 10px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 16 }}>{section.icon}</span>
                    <span style={{ fontWeight: 800, fontSize: 13, color: "var(--text)" }}>{section.title}</span>
                    <span style={{ fontSize: 9, color: "#9e9e9e" }}>
                      {section.items.filter(k => settings[k]).length}/{section.items.length} on
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-dim)", lineHeight: 1.5 }}>{section.desc}</div>
                </div>
                <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                  <Btn variant="ghost" onClick={() => enableAll(section.items)} title="Enable all in this section">✓ All</Btn>
                  <Btn variant="ghost" onClick={() => disableAll(section.items)} title="Disable all in this section">✗ None</Btn>
                </div>
              </div>

              {/* Items */}
              <div style={{ display: "grid", gap: 0 }}>
                {section.items.map((key, idx) => {
                  const meta       = SETTING_META[key];
                  const isOn       = !!settings[key];
                  const justFlipped = justToggled === key;
                  const badgeStyle = BADGE_COLORS[meta.badge] || {};

                  return (
                    <div
                      key={key}
                      onClick={() => toggle(key)}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: 14,
                        padding: "12px 18px",
                        borderTop: idx > 0 ? "1px solid var(--border-light)" : "none",
                        background: justFlipped ? "#f0f7ff" : isOn ? "var(--accent-light)" : "transparent",
                        cursor: "pointer", transition: "background .15s",
                      }}
                      onMouseOver={e => { if (!justFlipped) e.currentTarget.style.background = isOn ? "var(--accent-light)" : "var(--surface)"; }}
                      onMouseOut={e => { if (!justFlipped) e.currentTarget.style.background = isOn ? "var(--accent-light)" : "transparent"; }}
                    >
                      {/* Label + description */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: isOn ? "var(--text)" : "#555" }}>
                            {meta.label}
                          </span>
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 5,
                            background: badgeStyle.bg, color: badgeStyle.color,
                            letterSpacing: ".06em", flexShrink: 0,
                          }}>{meta.badge}</span>
                        </div>
                        <div style={{ fontSize: 10, color: isOn ? "#546e7a" : "#9e9e9e", marginTop: 4, lineHeight: 1.5 }}>
                          {meta.desc}
                        </div>
                        {meta.warn && isOn && (
                          <div style={{
                            marginTop: 6, fontSize: 10, color: "#e65100",
                            background: "#fff3e0", borderLeft: "3px solid #ff9800",
                            padding: "4px 8px", borderRadius: "0 4px 4px 0", lineHeight: 1.4,
                          }}>
                            ⚠ {meta.warn}
                          </div>
                        )}
                      </div>

                      {/* Status + toggle */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, paddingTop: 2 }}>
                        <span style={{
                          fontSize: 9, fontWeight: 700, letterSpacing: ".06em",
                          padding: "2px 8px", borderRadius: 8,
                          background: isOn ? "#e8f5e9" : "#f5f5f5",
                          color: isOn ? "#2e7d32" : "#9e9e9e",
                          minWidth: 28, textAlign: "center",
                          transition: "all .15s",
                        }}>
                          {isOn ? "ON" : "OFF"}
                        </span>
                        <ToggleSwitch checked={isOn} onChange={() => toggle(key)} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom actions */}
        <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ fontSize: 11, color: "var(--text-dim)" }}>
            💡 Changes are saved instantly to your browser's localStorage and persist across sessions.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {onAntiBotReport && (
              <Btn variant="ghost" onClick={onAntiBotReport} title="Run a browser fingerprint check to see how bot-like this environment looks">
                🛡 Run Anti-Bot Report
              </Btn>
            )}
            <Btn variant="ghost" onClick={resetDefaults}>↺ Restore Recommended Defaults</Btn>
          </div>
        </div>

      </div>
    </div>
  );
}