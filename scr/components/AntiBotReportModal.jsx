import { Btn } from "./ui/index.jsx";

export function AntiBotReportModal({ report, onClose }) {
  const { checks, humanCount, total, botLikelihood, verdict } = report;
  const verdictColor = botLikelihood < 20 ? "#2e7d32" : botLikelihood < 50 ? "#e65100" : "#c62828";
  const verdictBg    = botLikelihood < 20 ? "#e8f5e9" : botLikelihood < 50 ? "#fff3e0" : "#ffebee";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 620, maxHeight: "82vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 800, color: "#333", fontSize: 15 }}>🛡 Anti-Bot Browser Fingerprint Report</div>
            <div style={{ fontSize: 10, color: "#9e9e9e", marginTop: 2 }}>
              Checks how automated this browser environment looks to anti-bot systems
            </div>
          </div>
          <Btn variant="ghost" size="sm" onClick={onClose}>✕</Btn>
        </div>

        {/* Verdict banner */}
        <div style={{ margin: "14px 20px 0", padding: "12px 16px", borderRadius: 10, background: verdictBg, border: `1.5px solid ${verdictColor}44`, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 28 }}>{botLikelihood < 20 ? "✅" : botLikelihood < 50 ? "⚠️" : "🤖"}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: verdictColor }}>{verdict}</div>
            <div style={{ fontSize: 11, color: verdictColor, opacity: 0.85, marginTop: 2 }}>
              {humanCount}/{total} checks passed · Bot likelihood: {botLikelihood}%
            </div>
          </div>
          <div style={{ width: 80, height: 8, borderRadius: 4, background: "#e0e0e0", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${botLikelihood}%`, background: verdictColor, borderRadius: 4, transition: "width .5s" }} />
          </div>
        </div>

        {/* Check rows */}
        <div style={{ overflow: "auto", flex: 1, padding: "12px 20px 16px" }}>
          <div style={{ display: "grid", gap: 8 }}>
            {checks.map((c, i) => (
              <div key={i} style={{
                background: c.isHuman ? "#f9fffe" : "#fff8f8",
                border: `1px solid ${c.isHuman ? "#c8e6c9" : "#ffcdd2"}`,
                borderRadius: 8, padding: "10px 14px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14 }}>{c.isHuman ? "✅" : "❌"}</span>
                  <span style={{ fontWeight: 700, fontSize: 12, color: c.isHuman ? "#2e7d32" : "#c62828" }}>{c.name}</span>
                  <span style={{
                    marginLeft: "auto", fontSize: 9, fontWeight: 700, padding: "1px 7px", borderRadius: 6,
                    background: c.isHuman ? "#e8f5e9" : "#ffebee",
                    color: c.isHuman ? "#2e7d32" : "#c62828",
                  }}>{c.isHuman ? "PASS" : "FAIL"}</span>
                </div>
                <div style={{ fontFamily: "monospace", fontSize: 10, color: "#546e7a", background: "#f5f7fa", padding: "3px 8px", borderRadius: 4, marginBottom: 5, wordBreak: "break-all" }}>
                  {c.value}
                </div>
                <div style={{ fontSize: 10, color: "#78909c", lineHeight: 1.5 }}>{c.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <div style={{ padding: "10px 20px 16px", borderTop: "1px solid var(--border)", fontSize: 10, color: "#9e9e9e", lineHeight: 1.6 }}>
          💡 This report checks the <em>current browser window</em> — not the target scrape site. Use it to assess
          whether your environment might be flagged by bot-detection systems like Cloudflare, DataDome, or PerimeterX.
          For fully undetectable scraping, use a real headless browser with stealth patches (e.g. Playwright + stealth plugin).
        </div>
      </div>
    </div>
  );
}