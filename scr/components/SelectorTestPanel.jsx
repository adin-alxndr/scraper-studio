import { useMemo } from "react";
import { extractByCss } from "../utils/domExtract";
import { Btn } from "./ui/index.jsx";

export function SelectorTestPanel({ doc, baseUrl, selector, onClose }) {
  const results = useMemo(
    () => doc && selector ? extractByCss(doc, baseUrl, selector) : [],
    [doc, baseUrl, selector]
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 560, maxHeight: 400, padding: 20 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div className="page-title" style={{ fontSize: 15 }}>🔎 Selector Test</div>
          <Btn variant="ghost" size="sm" onClick={onClose}>✕</Btn>
        </div>
        <code className="selector-display" style={{ display: "block", marginBottom: 14 }}>{selector}</code>
        {results.length === 0 ? (
          <div style={{ color: "#c62828", textAlign: "center", padding: 20 }}>⚠ No matching elements.</div>
        ) : (
          <>
            <div style={{ fontSize: 11, color: "var(--accent)", marginBottom: 8, fontWeight: 700 }}>
              {results.length} results
            </div>
            <div style={{ overflowY: "auto", paddingRight: 4 }}>
              {results.slice(0, 20).map((r, i) => (
                <div key={i} className="result-row" style={{ marginBottom: 4, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <span style={{ color: "#9e9e9e", marginRight: 8 }}>#{i + 1}</span>
                  {/^https?:\/\//i.test(r) ? (
                    <a href={r} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", textDecoration: "none" }}>
                      {r.slice(0, 80)}
                    </a>
                  ) : (
                    r.slice(0, 160)
                  )}
                </div>
              ))}
            </div>
            {results.length > 20 && (
              <div style={{ fontSize: 10, color: "#bbb", textAlign: "center", marginTop: 4 }}>
                …{results.length - 20} more
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}