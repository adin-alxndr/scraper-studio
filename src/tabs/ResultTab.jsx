import { Btn, Card, InfoBanner, EmptyState } from "../components/ui/index.jsx";

export function ResultTab({ res, rawRes, cleaned, headers, errs, hidCols, setHidCols, renCols, setRenCols, editCell, setEC, editVal, setEV, setRes, setTab, resetRaw, doClean, msg }) {
  return (
    <div className="page-scroll">
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">
              Preview Data
              {cleaned && <span className="tag" style={{ marginLeft: 10, background: "#fff3e0", color: "#e65100", border: "1px solid #ffa726" }}>Cleaned</span>}
            </h1>
            <p className="page-subtitle">
              {res.length} rows · {headers.length} columns
              {cleaned && rawRes.length > 0 && <span style={{ color: "#e65100", marginLeft: 8 }}>({rawRes.length} original)</span>}
              {errs.length > 0 && <span className="tag" style={{ background: "#ffebee", color: "#c62828", border: "1px solid #ef9a9a", marginLeft: 8 }}>{errs.length} errors</span>}
            </p>
          </div>
          {res.length > 0 && (
            <div className="page-actions">
              {(cleaned || hidCols.length > 0 || Object.keys(renCols).length > 0) && <Btn variant="warn" onClick={resetRaw}>↺ Reset</Btn>}
              <Btn variant="ghost" onClick={() => { setHidCols([]); setRenCols({}); msg("Columns reset."); }}>↺ Columns</Btn>
              <Btn variant="ghost" onClick={() => setTab("export")}>📦 Export</Btn>
            </div>
          )}
        </div>

        {errs.length > 0 && (
          <InfoBanner type="error">
            <div style={{ fontWeight: 700, marginBottom: 6 }}>⚠ Failed URLs:</div>
            {errs.map((e, i) => <div key={i} style={{ fontSize: 11 }}><span style={{ color: "#c62828" }}>{e.url}</span> — {e.error}</div>)}
          </InfoBanner>
        )}

        {res.length > 0 && (
          <Card style={{ padding: "10px 14px", marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 10, color: "var(--text-dim)", fontWeight: 700 }}>COLUMNS:</span>
              {Object.keys(res[0]).map(h => (
                <button key={h} onClick={() => setHidCols(hc => hc.includes(h) ? hc.filter(x => x !== h) : [...hc, h])}
                  style={{ padding: "3px 9px", borderRadius: 4, fontSize: 10, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, background: hidCols.includes(h) ? "#f0f4ff" : "var(--accent-light)", color: hidCols.includes(h) ? "#bbb" : "var(--accent)", border: `1px solid ${hidCols.includes(h) ? "var(--border)" : "var(--accent-mid)"}` }}>
                  {renCols[h] || h}
                </button>
              ))}
              <span style={{ fontSize: 10, color: "#bbb" }}>click to toggle · dbl-click header to rename</span>
            </div>
          </Card>
        )}

        {!res.length ? (
          <EmptyState icon="📭" message="No data yet." action={<Btn variant="primary" onClick={() => setTab("scrape")}>⚡ Start Scraping</Btn>} />
        ) : (
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>{headers.map(c => (
                    <th key={c} onDoubleClick={() => { const n = prompt("Rename:", renCols[c]||c); if (n) setRenCols(r => ({...r,[c]:n})); }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>{renCols[c]||c}<span style={{ color: "#c5cae9", fontSize: 10 }}>✎</span></div>
                    </th>
                  ))}</tr>
                </thead>
                <tbody>{res.map((row, i) => (
                  <tr key={i}>{headers.map((h, j) => (
                    <td key={j} title={String(row[h]||"")}>
                      {editCell?.r===i && editCell?.c===h ? (
                        <input autoFocus value={editVal} onChange={e => setEV(e.target.value)}
                          onBlur={() => { setRes(rs => rs.map((r2,i2) => i2===i ? {...r2,[h]:editVal} : r2)); setEC(null); }}
                          onKeyDown={e => { if (e.key==="Enter") { setRes(rs => rs.map((r2,i2) => i2===i ? {...r2,[h]:editVal} : r2)); setEC(null); } if (e.key==="Escape") setEC(null); }}
                          style={{ background: "var(--accent-light)", border: "1px solid var(--accent-mid)", color: "var(--text)", padding: "3px 6px", borderRadius: 4, fontFamily: "inherit", fontSize: 12, width: "100%", outline: "none" }} />
                      ) : (
                        <span style={{ cursor: "text" }} onDoubleClick={() => { setEC({r:i,c:h}); setEV(String(row[h]||"")); }}>
                          {/^https?:\/\//i.test(String(row[h])) ? <a href={row[h]} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", textDecoration: "none" }}>{String(row[h]).slice(0,60)}{String(row[h]).length>60?"…":""}</a> : String(row[h]||"")}
                        </span>
                      )}
                    </td>
                  ))}</tr>
                ))}</tbody>
              </table>
            </div>
            <div style={{ padding: "8px 14px", fontSize: 10, color: "#bbb", borderTop: "1px solid var(--border-light)" }}>💡 Dbl-click cell to edit · Dbl-click header to rename</div>
          </Card>
        )}
      </div>
    </div>
  );
}
