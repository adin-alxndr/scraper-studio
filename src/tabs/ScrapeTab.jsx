import { Btn, Card, SectionLabel, InfoBanner, EmptyState } from "../components/ui/index.jsx";
import { DomPicker } from "../components/DomPicker";
import { JsChallengeWarning } from "../components/JsChallengeWarning";
import { PRESETS } from "../utils/presets";

export function ScrapeTab({
  // nav
  sub, setSub,
  // scrape actions
  testLoad, runScrape, loadPastedHtml,
  // url + pagination
  urls, setUrls, pagOn, setPagOn, pagS, setPagS, pagE, setPagE, pagT, setPagT,
  // state
  loading, prog, pct, proxy,
  // page data
  doc, docBase, rawHtml, jsChallenge, jsChallengeUrl, setJsChallenge,
  tableInfo, apiEndpoints, graphqlEndpoints, attachments, apiData,
  apiLoading, manualApi, setManualApi, pasteHtml, setPasteHtml,
  // fields
  fields, nextId, setFields, setNextId, addF, remF, updF, applyPreset,
  // scraper settings (for active badge display)
  scraperSettings,
  // actions
  autoFillFromTable, tryFetchApi, importApiData,
  // modal trigger
  setFps, setTestSel,
  // toast
  msg,
}) {
  return (
    <div className="page-scroll">
      <div style={{ flex:1, display:"flex", flexDirection:"column", minHeight:0 }}>

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">SCRAPER STUDIO</h1>
            <p className="page-subtitle">DevTools-style Element Picker · Click-to-Inspect · Auto proxy fallback</p>
          </div>
          <div className="page-actions">
            <Btn variant="ghost" onClick={testLoad} disabled={loading || !urls.trim()}>🎯 Test &amp; Open Picker</Btn>
            <Btn variant="primary" onClick={runScrape} disabled={loading}>
              {loading ? <><span className="spinner" />Scraping…</> : "⚡ Start Scraping"}
            </Btn>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="sub-tabs">
          {[["setup","⚙ Setup"],["pastehtml","📋 Paste HTML"],["picker","🎯 Element Picker"],["preview","🔎 Selector Test"]].map(([id, lbl]) => (
            <button key={id} className={`stab ${sub === id ? "on" : ""}`} onClick={() => setSub(id)}>{lbl}</button>
          ))}
        </div>

        {/* ── Setup sub-tab ── */}
        {sub === "setup" && (
          <div style={{ flex: 1, overflow: "auto", animation: "fadeIn .25s" }}>
            <InfoBanner type="success">
              🎯 <b style={{ color: "#1b5e20" }}>How to use:</b> Enter URL → click <b style={{ color: "var(--accent)" }}>"Test &amp; Open Picker"</b> → activate <b style={{ color: "#e65100" }}>🔍 Inspect</b> and click elements in the preview, or manually expand the DOM tree → copy selector → Start Scraping.
            </InfoBanner>

            {/* Table detection */}
            {tableInfo.length > 0 && (
              <InfoBanner type="info">
                <div style={{ color: "var(--accent)", fontWeight: 700, marginBottom: 8 }}>
                  📊 {tableInfo.length} table(s) detected — extract all columns or pick specific ones!
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {tableInfo.map((tbl, i) => (
                    <div key={i} style={{ padding: "10px 12px", background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: tbl.headers.length > 0 ? 10 : 0, flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 0, fontSize: 11 }}>
                          <span style={{ color: "var(--accent)", fontWeight: 700, marginRight: 8 }}>Table {i + 1}</span>
                          <span style={{ color: "#9e9e9e" }}>({tbl.rowCount} rows · {tbl.headers.length || "?"} cols)</span>
                        </div>
                        <Btn variant="primary" size="sm" onClick={() => autoFillFromTable(tbl)}>⚡ Auto-fill All Columns</Btn>
                      </div>
                      {tbl.headers.length > 0 && (
                        <>
                          <div style={{ fontSize: 9, color: "#5c6bc0", fontWeight: 700, letterSpacing: ".1em", marginBottom: 6 }}>🏛 PICK SPECIFIC COLUMN — click to add as a field:</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {tbl.headers.map((hdr, ci) => {
                              const colSel = `${tbl.sel} tr td:nth-child(${ci + 1})`;
                              return (
                                <button key={ci} title={colSel}
                                  onClick={() => { const newId = nextId; setFields(f => [...f, { id: newId, name: hdr || `Col ${ci+1}`, sel: colSel }]); setNextId(n => n + 1); msg(`✓ Field "${hdr || `Col ${ci+1}`}" added → ${colSel}`); }}
                                  style={{ padding: "4px 9px", background: "#fff", border: "1px solid var(--accent-mid)", borderRadius: 5, color: "var(--accent)", fontFamily: "'Courier New', monospace", fontSize: 10, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1, transition: "all .12s" }}
                                  onMouseOver={e => { e.currentTarget.style.background = "var(--accent-light)"; e.currentTarget.style.borderColor = "var(--accent)"; }}
                                  onMouseOut={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "var(--accent-mid)"; }}>
                                  <span style={{ fontSize: 9, fontWeight: 700, color: "var(--accent)" }}>{hdr.length > 18 ? hdr.slice(0, 18) + "…" : hdr}</span>
                                  <span style={{ fontSize: 8, color: "#90a4ae" }}>nth-child({ci + 1})</span>
                                </button>
                              );
                            })}
                          </div>
                          <div style={{ marginTop: 6, fontSize: 9, color: "#bbb" }}>
                            💡 Each button adds one field with <code style={{ color: "var(--accent)", fontFamily: "monospace" }}>td:nth-child(n)</code> — scrapes only that column, not all cells.
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </InfoBanner>
            )}

            {/* API section */}
            <InfoBanner type="pink">
              <div style={{ color: "#c2185b", fontWeight: 700, marginBottom: 4 }}>🔌 Import from API / JSON directly</div>
              <div style={{ color: "#9e9e9e", fontSize: 10, marginBottom: 10 }}>If the page uses JS to load data dynamically, paste the API endpoint URL here. Find it in the <b style={{ color: "#880e4f" }}>Network</b> tab of browser DevTools (F12).</div>
              <div style={{ display: "flex", gap: 8, marginBottom: apiEndpoints.length > 0 ? 10 : 0 }}>
                <input className="inp" value={manualApi} onChange={e => setManualApi(e.target.value)} placeholder="https://example.com/api/getData" style={{ fontFamily: "monospace", fontSize: 11, color: "#c2185b", flex: 1 }} />
                <Btn variant="ghost" disabled={apiLoading || !manualApi.trim()} onClick={() => tryFetchApi(manualApi.trim())} style={{ borderColor: "#f48fb1", color: "#c2185b" }}>
                  {apiLoading ? <><span className="spinner" />Loading…</> : "🔍 Fetch"}
                </Btn>
              </div>
              {apiEndpoints.length > 0 && (
                <>
                  <div style={{ fontSize: 10, color: "#9e9e9e", marginBottom: 6 }}>🔎 Auto-detected endpoints:</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 8 }}>
                    {apiEndpoints.map((ep, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "var(--surface)", borderRadius: 7, border: "1px solid #f8bbd0", flexWrap: "wrap" }}>
                        <code style={{ flex: 1, minWidth: 0, fontSize: 9, color: "#c2185b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ep}</code>
                        <Btn variant="ghost" size="xs" disabled={apiLoading} onClick={() => { setManualApi(ep); tryFetchApi(ep); }} style={{ borderColor: "#f48fb1", color: "#c2185b" }}>Try →</Btn>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {apiData && (
                <div style={{ padding: "10px 12px", background: "#e8f5e9", border: "1px solid #a5d6a7", borderRadius: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ color: "#2e7d32", fontWeight: 700, fontSize: 11 }}>✓ {apiData.total} rows found</div>
                    <Btn variant="primary" size="sm" onClick={importApiData}>📥 Import as Result</Btn>
                  </div>
                  <div style={{ overflowX: "auto", maxHeight: 160, overflowY: "auto" }}>
                    <table style={{ fontSize: 10 }}>
                      <thead><tr>{Object.keys(apiData.rows[0]||{}).slice(0,8).map(k => <th key={k} style={{ background: "#c8e6c9", color: "#2e7d32" }}>{k}</th>)}</tr></thead>
                      <tbody>{apiData.rows.slice(0,10).map((row,i) => <tr key={i}>{Object.keys(apiData.rows[0]).slice(0,8).map(k => <td key={k} style={{ maxWidth: 120 }}>{String(row[k]??"")}</td>)}</tr>)}</tbody>
                    </table>
                  </div>
                </div>
              )}
            </InfoBanner>

            {/* GraphQL */}
            {graphqlEndpoints.length > 0 && (
              <InfoBanner type="info">
                <div style={{ color: "#6a1b9a", fontWeight: 700, marginBottom: 6 }}>🔷 {graphqlEndpoints.length} GraphQL endpoint(s) detected</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {graphqlEndpoints.map((ep, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "var(--surface)", borderRadius: 7, border: "1px solid #ce93d8", flexWrap: "wrap" }}>
                      <code style={{ flex: 1, minWidth: 0, fontSize: 9, color: "#6a1b9a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ep}</code>
                      <Btn variant="ghost" size="xs" onClick={() => { navigator.clipboard.writeText(ep); msg("GraphQL URL copied!"); }} style={{ borderColor: "#ce93d8", color: "#6a1b9a" }}>Copy</Btn>
                    </div>
                  ))}
                </div>
              </InfoBanner>
            )}

            {/* Attachments */}
            {attachments.length > 0 && (
              <InfoBanner type="info">
                <div style={{ color: "#1565c0", fontWeight: 700, marginBottom: 6 }}>📎 {attachments.length} file attachment(s) found on page</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 160, overflowY: "auto" }}>
                  {attachments.map((att, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 10px", background: "var(--surface)", borderRadius: 7, border: "1px solid var(--border)", flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--accent)", fontFamily: "monospace" }}>{att.text || att.href.split("/").pop()}</span>
                      <a href={att.href} target="_blank" rel="noreferrer"><Btn variant="ghost" size="xs">↓ Download</Btn></a>
                      <Btn variant="ghost" size="xs" onClick={() => { navigator.clipboard.writeText(att.href); msg("URL copied!"); }}>Copy URL</Btn>
                    </div>
                  ))}
                </div>
              </InfoBanner>
            )}

            {/* Active settings badges */}
            {(() => {
              const active = [];
              if (scraperSettings.antibotMode)     active.push("🛡 AntiBot");
              if (scraperSettings.csrfHandling)    active.push("🔐 CSRF");
              if (scraperSettings.cookieLogin)     active.push("🍪 Cookie Login");
              if (scraperSettings.aspShieldBypass) active.push("🔧 ASP Shield");
              if (scraperSettings.shadowDOM)       active.push("👁 Shadow DOM");
              if (scraperSettings.lazyLoad)        active.push("⏳ Lazy Load");
              if (scraperSettings.encodingFix)     active.push("✏️ Encoding Fix");
              if (active.length === 0) return null;
              return (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "6px 0" }}>
                  {active.map(label => (
                    <span key={label} style={{ fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 8, background: "var(--accent-light)", color: "var(--accent)", border: "1px solid var(--accent-mid)", cursor: "default" }}>{label}</span>
                  ))}
                  <span style={{ fontSize: 9, color: "#bbb", alignSelf: "center" }}>active from Settings</span>
                </div>
              );
            })()}

            {/* URL input */}
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <SectionLabel icon="①" text="TARGET URL" />
                <span style={{ fontSize: 10, color: "#bbb" }}>One URL per line</span>
              </div>
              <textarea className="inp" rows={4} value={urls} onChange={e => setUrls(e.target.value)} placeholder={"https://news.ycombinator.com\nhttps://github.com/trending"} />
            </Card>

            {/* Fields */}
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                <SectionLabel icon="②" text="CSS SELECTOR FIELDS" />
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: "#bbb" }}>Preset:</span>
                  {PRESETS.map(p => <Btn key={p.label} variant="ghost" size="sm" onClick={() => applyPreset(p)}>{p.label}</Btn>)}
                </div>
              </div>
              <InfoBanner type="info">
                <div style={{ color: "var(--accent)", fontWeight: 700, marginBottom: 8 }}>📖 Selector reference — click to fill into field</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px" }}>
                  {[["a @href","🔗 URL of all links","#1565c0"],["img @src","🔗 Image URLs","#1565c0"],["img @alt","📝 Alt text","#1565c0"],[".a @title","🪧 Title text","#1565c0"],["video @src","🎬 Video URL","#1565c0"],["[data-url] @data-url","🔗 data-url attr","#1565c0"]].map(([sel, desc, col]) => (
                    <div key={sel} style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <code style={{ fontFamily: "monospace", fontSize: 10, color: col, background: "var(--surface)", padding: "1px 6px", borderRadius: 3, cursor: "pointer", border: `1px solid ${col}22`, flexShrink: 0 }}
                        onClick={() => { const ef = fields.find(f => !f.sel.trim()); if (ef) { updF(ef.id, "sel", sel); msg(`Filled "${sel}"`); } else { navigator.clipboard.writeText(sel); msg("Copied!"); } }}>
                        {sel}
                      </code>
                      <span style={{ fontSize: 10, color: "#9e9e9e" }}>{desc}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid var(--border-light)" }}>
                  <div style={{ fontSize: 9, color: "#e65100", fontWeight: 700, letterSpacing: ".1em", marginBottom: 6 }}>🏛 TABLE COLUMN TARGETING</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {[1,2,3,4,5].map(n => (
                      <div key={n} style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                        <code style={{ fontFamily: "monospace", fontSize: 10, color: "#e65100", background: "#ffffff", padding: "1px 6px", borderRadius: 3, cursor: "pointer", border: "1px solid #ffcc0244" }}
                          onClick={() => { const sel = `table tbody tr td:nth-child(${n})`; const ef = fields.find(f => !f.sel.trim()); if (ef) { updF(ef.id, "sel", sel); msg(`Filled col ${n}`); } else { navigator.clipboard.writeText(sel); msg("Copied!"); } }}>
                          {`td:nth-child(${n})`}
                        </code>
                        {n < 5 && <span style={{ color: "#ddd", fontSize: 10 }}>·</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </InfoBanner>
              <div style={{ display: "grid", gridTemplateColumns: "152px 1fr 74px 24px", gap: 8, marginBottom: 6, padding: "0 2px" }}>
                {["FIELD NAME","CSS SELECTOR","TEST",""].map((h, i) => <div key={i} style={{ fontSize: 10, color: "#bbb" }}>{h}</div>)}
              </div>
              {fields.map(f => (
                <div key={f.id} style={{ display: "grid", gridTemplateColumns: "152px 1fr 74px 24px", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <input className="inp" value={f.name} onChange={e => updF(f.id,"name",e.target.value)} placeholder="e.g. Title…" />
                  <input className="inp" value={f.sel} onChange={e => updF(f.id,"sel",e.target.value)} placeholder="e.g. h1, .price" style={{ fontFamily: "monospace", color: "var(--accent)" }} />
                  <Btn variant="ghost" size="sm" disabled={!f.sel.trim() || !doc} onClick={() => setTestSel(f.sel)}>🔎 Test</Btn>
                  <button className="del-btn" onClick={() => remF(f.id)}>✕</button>
                </div>
              ))}
              <div style={{ marginTop: 8 }}><Btn variant="ghost" size="sm" onClick={addF}>＋ Add Field</Btn></div>
            </Card>

            {/* Pagination */}
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: pagOn ? 14 : 0 }}>
                <SectionLabel icon="③" text="PAGINATION" />
                <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontSize: 12, color: pagOn ? "var(--accent)" : "#9e9e9e" }}>
                  <input type="checkbox" checked={pagOn} onChange={e => setPagOn(e.target.checked)} style={{ accentColor: "var(--accent)" }} /> Enable
                </label>
              </div>
              {pagOn && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <div><div style={{ fontSize: 10, color: "#bbb", marginBottom: 5 }}>START PAGE</div><input className="inp" type="number" min={1} value={pagS} onChange={e => setPagS(+e.target.value)} /></div>
                    <div><div style={{ fontSize: 10, color: "#bbb", marginBottom: 5 }}>END PAGE</div><input className="inp" type="number" min={1} value={pagE} onChange={e => setPagE(+e.target.value)} /></div>
                    <div><div style={{ fontSize: 10, color: "#bbb", marginBottom: 5 }}>MAX PAGES</div><input className="inp" type="number" min={1} max={100} value={pagE - pagS + 1} onChange={e => { const max = Math.max(1, +e.target.value); setPagE(pagS + max - 1); }} style={{ color: "var(--accent)", fontWeight: 700 }} /></div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, alignItems: "center" }}>
                      <div style={{ fontSize: 10, color: "#bbb" }}>TEMPLATE</div>
                      <div style={{ display: "flex", gap: 5 }}>
                        {["{url}/page/{n}","{url}?page={n}","{url}/{n}"].map(t => (
                          <Btn key={t} variant="ghost" size="xs" onClick={() => setPagT(t)} style={pagT === t ? { borderColor: "var(--accent)", color: "var(--accent)" } : {}}>{t}</Btn>
                        ))}
                      </div>
                    </div>
                    <input className="inp" value={pagT} onChange={e => setPagT(e.target.value)} style={{ fontFamily: "monospace", color: "var(--accent)" }} />
                  </div>
                  {urls.trim() && (
                    <div style={{ background: "var(--accent-light)", border: "1px solid var(--accent-mid)", borderRadius: 7, padding: "8px 10px" }}>
                      <div style={{ fontSize: 9, color: "var(--accent)", fontWeight: 700, letterSpacing: ".1em", marginBottom: 6 }}>URL PREVIEW</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3, maxHeight: 90, overflowY: "auto" }}>
                        {(() => {
                          const base = urls.split("\n").map(u => u.trim()).filter(Boolean)[0] || "";
                          const preview = [];
                          for (let n = pagS; n <= pagE; n++) { preview.push(pagT.replace("{url}", base.replace(/\/$/, "")).replace("{n}", String(n))); if (preview.length >= 2) break; }
                          return preview.map((u, i) => <code key={i} style={{ fontSize: 9, color: "var(--accent)", borderRadius: 4, padding: "2px 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{u}</code>);
                        })()}
                        {pagE - pagS + 1 > 5 && <div style={{ fontSize: 9, color: "#9e9e9e", textAlign: "center", padding: "2px 0" }}>… and {pagE - pagS - 4} more pages</div>}
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card>

            {/* Progress */}
            {loading && (
              <Card style={{ border: "1px solid var(--accent-mid)", marginBottom: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div className="spinner" />
                  <span style={{ fontSize: 13, color: "var(--accent)", fontWeight: 700 }}>Scraping {prog.cur}/{prog.total} — {pct}%</span>
                  <span style={{ fontSize: 10, color: "#388e3c", marginLeft: "auto", background: "#e8f5e9", padding: "3px 8px", borderRadius: 4 }}>{prog.collected} items</span>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#bbb" }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>{prog.label}</span>
                  {prog.proxyName && <span>via {prog.proxyName}</span>}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ── Paste HTML sub-tab ── */}
        {sub === "pastehtml" && (
          <div style={{ flex: 1, display:"flex", flexDirection:"column", minHeight:0, overflow:"hidden" }}>
            <div style={{ overflowY:"auto", flex:1, display:"flex", flexDirection:"column", gap:0 }}>
              <InfoBanner type="info">
                <div style={{ color: "var(--accent)", fontWeight: 700, fontSize: 12, marginBottom: 8 }}>📋 How to paste HTML manually</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 6, fontSize: 11 }}>
                  {[["1. Open URL in browser","Chrome, Firefox, or Safari"],["2. Right-click → View Page Source","Or press Ctrl+U / Cmd+U"],["3. Ctrl+A then Ctrl+C","Select all then copy"],["4. Paste below","Click textarea then Ctrl+V"]].map(([s,d]) => (
                    <div key={s}><span style={{ color: "var(--accent)", fontWeight: 700 }}>{s}</span><span style={{ color: "#9e9e9e" }}> — {d}</span></div>
                  ))}
                </div>
              </InfoBanner>
              <div style={{ display: "flex", gap: 12, marginBottom: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 10, color: "var(--text-dim)", fontWeight: 700, letterSpacing: ".1em", marginBottom: 6 }}>BASE URL</div>
                  <input className="inp" value={urls.trim().split("\n")[0]||""} onChange={e => setUrls(e.target.value)} placeholder="https://example.com/page" />
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <Btn variant="ghost" onClick={() => setPasteHtml("")} disabled={!pasteHtml}>🗑 Clear</Btn>
                  <Btn variant="primary" onClick={loadPastedHtml} disabled={!pasteHtml.trim()}>🎯 Load &amp; Open Picker</Btn>
                </div>
              </div>
              <div style={{ position: "relative", display:"flex", flexDirection:"column" }}>
                <textarea className="inp" value={pasteHtml} onChange={e => setPasteHtml(e.target.value)}
                  placeholder={"Paste HTML here...\n\nOpen page in browser → Ctrl+U → Ctrl+A → Ctrl+C → Ctrl+V here"}
                  style={{ resize: "vertical", fontFamily: "monospace", fontSize: 11, lineHeight: 1.6, height: 310, maxHeight: "calc(100vh - 150px)", minHeight: 120, background: "#f8faff", color: "var(--accent)", overflowY: "auto" }} />
                {pasteHtml && (
                  <div style={{ position: "absolute", bottom: 10, right: 12, display: "flex", gap: 10, fontSize: 9, color: "#9e9e9e", background: "#f8faff", padding: "3px 8px", borderRadius: 4, pointerEvents: "none" }}>
                    <span>{(pasteHtml.length/1024).toFixed(1)} KB</span>
                    {pasteHtml.includes("<table") && <span style={{ color: "#0288d1" }}>📊 table</span>}
                    {pasteHtml.includes("<ul")    && <span style={{ color: "#388e3c" }}>📋 list</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Picker sub-tab ── */}
        {sub === "picker" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, animation: "fadeIn .25s" }}>
            {jsChallenge && <JsChallengeWarning url={jsChallengeUrl} onDismiss={() => setJsChallenge(false)} />}
            {!doc && !jsChallenge && (
              <InfoBanner type="success">
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span>🎯 Click <b style={{ color: "var(--accent)" }}>"Test &amp; Open Picker"</b> above to load the page.</span>
                  <Btn variant="ghost" size="sm" style={{ marginLeft: "auto" }} onClick={testLoad} disabled={!urls.trim()}>Load →</Btn>
                </div>
              </InfoBanner>
            )}
            {doc && (
              <>
                {tableInfo.length > 0 && (
                  <div style={{ marginBottom: 8, padding: "7px 12px", background: "var(--accent-light)", border: "1px solid var(--accent-mid)", borderRadius: 7, fontSize: 10, color: "var(--accent)", display: "flex", alignItems: "center", gap: 10 }}>
                    📊 <b>{tableInfo.length} table(s)</b> detected on this page.
                    <Btn variant="ghost" size="xs" onClick={() => setSub("setup")} style={{ marginLeft: "auto", borderColor: "var(--accent-mid)", color: "var(--accent)" }}>⚡ Auto-fill Fields →</Btn>
                  </div>
                )}
                <DomPicker doc={doc} rawHtml={rawHtml} baseUrl={docBase} fields={fields}
                  onSelectorPicked={sel => setFps(sel)}
                  onQuickInsert={(fid, sel) => { updF(fid,"sel",sel); msg(`→ "${fields.find(f=>f.id===fid)?.name||fid}" filled!`); setSub("setup"); }}
                  onMsg={msg}
                  jsChallenge={jsChallenge}
                />
              </>
            )}
          </div>
        )}

        {/* ── Selector test sub-tab ── */}
        {sub === "preview" && (
          <div style={{ animation: "fadeIn .25s" }}>
            <div style={{ marginBottom: 14, fontSize: 12, color: "#9e9e9e" }}>Test CSS selectors on the loaded DOM.</div>
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <input id="msel" className="inp" placeholder="h1, .class, a[href], #id…" style={{ fontFamily: "monospace", color: "var(--accent)", flex: 1 }} />
              <Btn variant="primary" onClick={() => { const v = document.getElementById("msel")?.value; if (v) setTestSel(v); }}>🔎 Test</Btn>
            </div>
            {!doc
              ? <EmptyState icon="🔍" message="Load a page first." />
              : <InfoBanner type="success">✓ DOM loaded from: <span style={{ color: "var(--accent)" }}>{docBase}</span></InfoBanner>}
          </div>
        )}
      </div>
    </div>
  );
}
