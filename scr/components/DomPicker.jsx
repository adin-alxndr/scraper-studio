import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { SKIP_TAGS, SELF_CLOSE, C, buildTreeNode, collectAllNodes, flattenVisible, flattenAll } from "../utils/domSelector";
import { extractByCss } from "../utils/domExtract";
import { HtmlLine } from "./HtmlLine";
import { PreviewPane } from "./PreviewPane";
import { Btn, EmptyState } from "./ui/index.jsx";

export function DomPicker({ doc, rawHtml, baseUrl, fields, onSelectorPicked, onQuickInsert, onMsg, jsChallenge }) {
  const [roots, setRoots] = useState([]);
  const [expanded, setExpanded] = useState(new Set());
  const [hov, setHov] = useState(null);
  const [picked, setPicked] = useState(null);
  const [search, setSearch] = useState("");
  const [depth, setDepth] = useState(8);
  const [showOnly, setShowOnly] = useState("all");
  const [matchCnt, setMatchCnt] = useState(null);
  const [splitW, setSplitW] = useState(42);
  const [inspectMode, setInspectMode] = useState(false);
  const [flashNode, setFlashNode] = useState(null);
  const dragging = useRef(false);
  const containerRef = useRef(null);
  const treeRef = useRef(null);

  useEffect(() => {
    if (!doc) return;
    let root; try { root = doc.body; } catch { return; }
    if (!root) return;
    const childEls = [...root.children].filter(c => !SKIP_TAGS.has(c.tagName));
    const treeRoots = childEls.slice(0, 60).map(c => buildTreeNode(c, 1, depth, root)).filter(Boolean);
    setRoots(treeRoots); setPicked(null); setExpanded(collectAllNodes(treeRoots));
  }, [doc, depth]);

  useEffect(() => {
    const n = picked || hov;
    if (!doc || !n) { setMatchCnt(null); return; }
    try { setMatchCnt(doc.querySelectorAll(n.sel).length); } catch { setMatchCnt(null); }
  }, [picked, hov, doc]);

  const visible = useMemo(() => {
    let nodes = flattenVisible(roots, expanded);
    if (showOnly === "text")   nodes = nodes.filter(n => n.ownText.length > 0);
    if (showOnly === "links")  nodes = nodes.filter(n => n.tag === "a" || n.attrs.href);
    if (showOnly === "images") nodes = nodes.filter(n => n.tag === "img");
    if (search) {
      const q = search.toLowerCase();
      nodes = nodes.filter(n => n.tag.includes(q) || n.id.toLowerCase().includes(q) || n.classes.some(c => c.toLowerCase().includes(q)) || n.ownText.toLowerCase().includes(q) || Object.values(n.attrs).some(v => String(v).toLowerCase().includes(q)) || n.sel.toLowerCase().includes(q));
    }
    return nodes;
  }, [roots, expanded, showOnly, search]);

  useEffect(() => {
    if (!search) return;
    const toExpand = new Set(expanded);
    for (const n of visible) { if (n.children.length > 0) toExpand.add(n); }
    setExpanded(toExpand);
  }, [search]);

  const toggleExpand = useCallback((node, e) => {
    e.stopPropagation();
    setExpanded(prev => { const next = new Set(prev); if (next.has(node)) next.delete(node); else next.add(node); return next; });
  }, []);

  const collapseAll = useCallback(() => setExpanded(new Set()), []);
  const expandAll = useCallback(() => setExpanded(collectAllNodes(roots)), [roots]);

  const totalCount = useMemo(() => {
    let c = 0;
    function count(nodes) { for (const n of nodes) { c++; count(n.children); } }
    count(roots); return c;
  }, [roots]);

  const findNodeBySel = useCallback((sel) => {
    if (!doc || !sel) return null;
    let targetEl = null;
    try { targetEl = doc.querySelector(sel); } catch { return null; }
    if (!targetEl) return null;
    const allNodes = flattenAll(roots);
    for (const n of allNodes) { if (n.sel === sel) return n; }
    for (const n of allNodes) { if (n.el === targetEl) return n; }
    for (const n of allNodes) { try { if (doc.querySelector(n.sel) === targetEl) return n; } catch {} }
    let root; try { root = doc.body; } catch { return null; }
    const synNode = buildTreeNode(targetEl, 1, 999, root);
    if (!synNode) return null;
    synNode.__synthetic = true;
    return synNode;
  }, [doc, roots]);

  const expandToNode = useCallback((targetNode) => {
    const toExpand = new Set(expanded);
    function findAncestors(nodes, target, path = []) {
      for (const n of nodes) { if (n === target) return path; const found = findAncestors(n.children, target, [...path, n]); if (found) return found; }
      return null;
    }
    const ancestors = findAncestors(roots, targetNode, []);
    if (ancestors) { for (const anc of ancestors) toExpand.add(anc); }
    setExpanded(toExpand);
  }, [roots, expanded]);

  const scrollTreeToNode = useCallback((node) => {
    if (!treeRef.current) return;
    setTimeout(() => {
      const rows = treeRef.current.querySelectorAll("[data-node-sel]");
      for (const row of rows) { if (row.dataset.nodeSel === node.sel) { row.scrollIntoView({ behavior: "smooth", block: "center" }); break; } }
    }, 80);
  }, []);

  const handleInspectElement = useCallback((info) => {
    if (!info.sel) return;
    const match = findNodeBySel(info.sel);
    if (match) {
      if (match.__synthetic) {
        setPicked(match); setFlashNode(match); setTimeout(() => setFlashNode(null), 1200);
        const allNodes = flattenAll(roots);
        let ancestorEl = match.el.parentElement; let closestTreeNode = null;
        while (ancestorEl && ancestorEl !== doc.body) {
          closestTreeNode = allNodes.find(n => n.el === ancestorEl);
          if (closestTreeNode) break;
          ancestorEl = ancestorEl.parentElement;
        }
        if (closestTreeNode) { expandToNode(closestTreeNode); scrollTreeToNode(closestTreeNode); }
        onMsg(`🎯 Clicked: <${info.tag}> — ${match.sel}`, "success");
      } else {
        expandToNode(match); setPicked(match); setFlashNode(match);
        setTimeout(() => setFlashNode(null), 1200);
        scrollTreeToNode(match);
        onMsg(`🎯 Clicked: <${info.tag}> — ${match.sel}`);
      }
    } else { onMsg(`🎯 Clicked: ${info.sel} (not found in DOM)`, "info"); }
    setInspectMode(false);
  }, [findNodeBySel, expandToNode, scrollTreeToNode, onMsg, roots, doc]);

  const onDividerDown = (e) => {
    e.preventDefault(); dragging.current = true;
    const onMove = (ev) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = Math.min(70, Math.max(25, ((ev.clientX - rect.left) / rect.width) * 100));
      setSplitW(pct);
    };
    const onUp = () => { dragging.current = false; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
  };

  if (!doc) return (
    <EmptyState icon="🎯" message='Click "Test & Open Picker" to load the page.' action={null} />
  );

  const activeSel = picked?.sel || "";
  const hSel = hov?.sel || "";

  return (
    <div style={{ display: "flex", flexDirection: "column", borderRadius: 11, overflow: "hidden", border: "1px solid var(--border)", flex: 1, maxHeight: "calc(100vh - 180px)", minHeight: 400 }}>
      {/* toolbar */}
      <div className="picker-toolbar">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 tag / .class / #id / text…" className="inp picker-search" />
        <select value={showOnly} onChange={e => setShowOnly(e.target.value)} className="select-sm">
          <option value="all">All elements</option>
          <option value="text">Has text</option>
          <option value="links">Links</option>
          <option value="images">Images</option>
        </select>
        <select value={depth} onChange={e => setDepth(+e.target.value)} className="select-sm">
          {[3,4,5,6,8,10,12].map(d => <option key={d} value={d}>Depth {d}</option>)}
        </select>
        <div className="btn-group">
          <button className="btn-group-btn" onClick={expandAll} title="Expand all">▼ All</button>
          <button className="btn-group-btn" onClick={collapseAll} title="Collapse all">▶ Col</button>
        </div>
        <button
          onClick={() => setInspectMode(m => !m)}
          className={`btn btn-sm ${inspectMode ? "btn-inspect-on" : "btn-ghost"}`}
        >
          {inspectMode ? "🔍 ON" : "🔍 Inspect"}
        </button>
        <span style={{ fontSize: 10, color: "#bbb", whiteSpace: "nowrap" }}>{visible.length}/{totalCount}</span>
      </div>

      {inspectMode && (
        <div className="inspect-banner">
          <span>🔍</span>
          <span><b>Inspect Mode active</b> — click an element in the preview to locate it in the tree</span>
          <Btn variant="ghost" size="sm" style={{ marginLeft: "auto" }} onClick={() => setInspectMode(false)}>✕ Close</Btn>
        </div>
      )}

      <div ref={containerRef} style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
        {/* LEFT: tree */}
        <div style={{ width: `${splitW}%`, display: "flex", flexDirection: "column", flexShrink: 0, minWidth: 0 }}>
          <div className="tree-legend">
            {[[C.tag,"tag"],[C.attr,"attr"],[C.val,"val"],[C.text,"text"]].map(([c,l]) => (
              <span key={l} style={{ fontSize: 9, color: c, fontFamily: "monospace" }}>{l}</span>
            ))}
            <span style={{ fontSize: 9, color: "#bbb", marginLeft: "auto" }}>▶/▼ expand · click to select · 🔍 inspect</span>
          </div>
          <div ref={treeRef} style={{ flex: 1, overflowY: "auto", overflowX: "auto", background: "#fafbff" }}>
            {visible.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "#bbb", fontSize: 11 }}>
                {roots.length === 0 ? "No DOM loaded." : "No matching elements."}
              </div>
            ) : visible.map((n, i) => {
              const isH = hov === n, isP = picked === n, isFlash = flashNode === n;
              const indent = Math.min(n.depth, 14) * 12;
              const hasChildren = n.children.length > 0, isExpanded = expanded.has(n);
              return (
                <div key={i}
                  data-node-sel={n.sel}
                  onMouseEnter={() => setHov(n)}
                  onMouseLeave={() => setHov(null)}
                  onClick={() => setPicked(p => p === n ? null : n)}
                  style={{
                    display: "flex", alignItems: "flex-start",
                    paddingLeft: indent + 4, paddingRight: 8, paddingTop: 2, paddingBottom: 2,
                    cursor: "pointer", minHeight: 24,
                    background: isFlash ? "#fff8e1" : isP ? "#e3f2fd" : isH ? "#f0f4ff" : "transparent",
                    borderLeft: isFlash ? "2px solid #ffa726" : isP ? "2px solid var(--accent)" : isH ? "2px solid #1565c044" : "2px solid transparent",
                    borderBottom: "1px solid #f0f4ff", userSelect: "none",
                  }}>
                  <span
                    onClick={e => hasChildren ? toggleExpand(n, e) : e.stopPropagation()}
                    style={{ width: 16, height: 22, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: hasChildren ? (isExpanded ? "var(--accent)" : "#90a4ae") : "transparent", fontSize: 9, cursor: hasChildren ? "pointer" : "default", marginRight: 2 }}>
                    {hasChildren ? (isExpanded ? "▼" : "▶") : "·"}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}><HtmlLine node={n} isHov={isH} isPick={isP} /></span>
                  {(isH || isP) && (
                    <code style={{ marginLeft: 4, flexShrink: 0, fontSize: 8, alignSelf: "center", color: isP ? "var(--accent)" : "#5c6bc0", background: isP ? "#e3f2fd" : "#f0f4ff", border: `1px solid ${isP ? "#90caf9" : "#c5cae9"}`, padding: "1px 5px", borderRadius: 3, maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {n.sel}
                    </code>
                  )}
                </div>
              );
            })}
          </div>

          {picked && (
            <div style={{ flexShrink: 0, borderTop: "1px solid var(--border)", background: "#f5f7fa", maxHeight: 260, overflowY: "auto" }}>
              {picked.__synthetic && (
                <div style={{ padding: "3px 10px", background: "#e8f5e9", borderBottom: "1px solid #a5d6a7", fontSize: 9, color: "#2e7d32", display: "flex", alignItems: "center", gap: 5 }}>
                  <span>⚡</span><span>Element found via inspect — selector is still valid</span>
                </div>
              )}
              <div style={{ padding: "5px 10px", borderBottom: "1px solid #e8edf5", fontFamily: "'Courier New',monospace", fontSize: 10, lineHeight: 1.8, wordBreak: "break-all", maxHeight: 72, overflowY: "auto" }}>
                <span style={{ color: C.tagPick }}>&lt;{picked.tag}</span>
                {picked.id && <><span style={{ color: C.attr }}> id</span><span style={{ color: C.eq }}>=</span><span style={{ color: C.val }}>"{picked.id}"</span></>}
                {picked.classes.length > 0 && <><span style={{ color: C.attr }}> class</span><span style={{ color: C.eq }}>=</span><span style={{ color: C.val }}>"{picked.classes.join(" ")}"</span></>}
                {(() => {
                  // Read from live el.attributes for completeness
                  const PRIORITY = ["href","src","title","alt","aria-label","type","name","role","placeholder","value"];
                  const liveEntries = picked.el && picked.el.attributes
                    ? (() => {
                        const all = {};
                        for (const a of picked.el.attributes) { if (a.name !== "id" && a.name !== "class") all[a.name] = a.value; }
                        return [
                          ...PRIORITY.filter(k => all[k] !== undefined).map(k => [k, all[k]]),
                          ...Object.entries(all).filter(([k]) => !PRIORITY.includes(k)),
                        ].slice(0, 6);
                      })()
                    : Object.entries(picked.attrs).slice(0, 6);
                  return liveEntries.map(([k, v]) => (
                    <span key={k}><span style={{ color: k === "title" ? "#6a1b9a" : C.attr }}> {k}</span><span style={{ color: C.eq }}>=</span><span style={{ color: k === "title" ? "#6a1b9a" : C.val }}>"{String(v).slice(0, 60)}"</span></span>
                  ));
                })()}
                <span style={{ color: C.tagPick }}>&gt;</span>
                {picked.fullText && <span style={{ color: C.text }}>{picked.fullText.length > 120 ? picked.fullText.slice(0, 120) + "…" : picked.fullText}</span>}
                {!SELF_CLOSE.has(picked.tag) && <span style={{ color: C.tagPick }}>&lt;/{picked.tag}&gt;</span>}
              </div>
              <div style={{ padding: "4px 8px", background: "#f0f4ff", borderBottom: "1px solid #e8edf5" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 9, color: "#5c6bc0", fontWeight: 700 }}>SELECTOR</span>
                  {matchCnt !== null && (
                    <span style={{ fontSize: 8, padding: "1px 6px", borderRadius: 3, color: matchCnt === 1 ? "var(--accent)" : matchCnt > 1 ? "#e65100" : "#c62828", background: "#e3f2fd", border: "1px solid #90caf9", marginLeft: "auto" }}>
                      {matchCnt}×{matchCnt === 1 ? " ✓" : ""}
                    </span>
                  )}
                </div>
                <code style={{ display: "block", fontSize: 10, color: "var(--accent)", fontFamily: "'Courier New',monospace", wordBreak: "break-all", padding: "3px 0" }}>{activeSel}</code>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
                <button onClick={() => { navigator.clipboard.writeText(activeSel); onMsg("Copied!"); }} className="tree-action-btn">📋 Copy</button>
                <button onClick={() => { const ef = fields.find(f => !f.sel) || fields[fields.length - 1]; if (ef) onQuickInsert(ef.id, activeSel); }} className="tree-action-btn">⚡ → Field</button>
                <button onClick={() => onSelectorPicked(activeSel)} className="tree-action-btn tree-action-primary">🎯 Choose…</button>
              </div>
              {(() => {
                const tag = picked.tag;
                // Read ALL attributes directly from the live DOM element for completeness
                const liveAttrs = {};
                if (picked.el && picked.el.attributes) {
                  for (const attr of picked.el.attributes) {
                    liveAttrs[attr.name] = attr.value;
                  }
                } else {
                  Object.assign(liveAttrs, picked.attrs);
                }
                const has = (k) => liveAttrs[k] !== undefined && liveAttrs[k] !== "";
                const hasHref        = tag === "a" || has("href");
                const hasSrc         = ["img","video","audio","source","iframe","script"].includes(tag) || has("src");
                const hasAlt         = has("alt");
                const hasTitle       = has("title");
                const hasSrcset      = has("srcset");
                const hasDataSrc     = Object.keys(liveAttrs).some(k => k.startsWith("data-src") || k === "data-lazy" || k === "data-original");
                const hasAriaLbl     = has("aria-label");
                const hasValue       = has("value") || tag === "input";
                const hasPlaceholder = has("placeholder");
                const attrBtns = [
                  hasHref        && { label:"🔗 href",         suffix:" @href",         color:"#1565c0" },
                  hasSrc         && { label:"🔗 src",          suffix:" @src",          color:"#e65100" },
                  hasAlt         && { label:"📝 alt",          suffix:" @alt",          color:"#0277bd" },
                  hasTitle       && { label:"🪧 title",        suffix:" @title",        color:"#6a1b9a" },
                  hasSrcset      && { label:"📐 srcset",       suffix:" @srcset",       color:"#7b1fa2" },
                  hasDataSrc     && { label:"🔄 data-src",     suffix:" @data-src",     color:"#5d4037" },
                  hasAriaLbl     && { label:"🗣 aria-label",   suffix:" @aria-label",   color:"#1b5e20" },
                  hasValue       && { label:"✏️ value",        suffix:" @value",        color:"#bf360c" },
                  hasPlaceholder && { label:"💬 placeholder",  suffix:" @placeholder",  color:"#37474f" },
                  { label:"📋 text", suffix:"", color:"#388e3c" },
                ].filter(Boolean);

                // ── Column targeting: detect td/th position inside parent row ──
                // Works for both directly picked td/th and ancestors that wrap a td/th
                const isTdTh = tag === "td" || tag === "th";
                let colInfo = null;
                if (isTdTh && picked.el) {
                  try {
                    const el = picked.el;
                    const row = el.closest("tr");
                    const table = el.closest("table");
                    if (row && table) {
                      // colIndex: 1-based position among td/th siblings in this row
                      const siblings = [...row.querySelectorAll("td, th")];
                      const colIndex = siblings.indexOf(el) + 1; // 1-based

                      // Try to get header names from thead
                      const theadRow = table.querySelector("thead tr");
                      const headerCells = theadRow
                        ? [...theadRow.querySelectorAll("th, td")]
                        : siblings; // fallback: use first row cells as header names

                      // Build the base selector up to tbody tr (strip the final td/th)
                      // activeSel looks like: "table#id tbody tr td" or "#id tr td"
                      // We replace trailing " td" / " th" with " td:nth-child(n)"
                      const baseSelWithoutCell = activeSel
                        .replace(/\s+(td|th)(\s+@\w[\w-]*)?$/, "");

                      // Total columns in this table
                      const totalCols = headerCells.length || siblings.length;

                      colInfo = { colIndex, totalCols, baseSelWithoutCell, headerCells };
                    }
                  } catch {}
                }

                return (
                  <div style={{ background: "#fafbff", borderTop: "1px solid #e8edf5" }}>

                    {/* ── Column targeting panel (td/th only) ── */}
                    {colInfo && (
                      <div style={{ padding: "8px 8px 4px", borderBottom: "1px solid #e8edf5" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                          <span style={{ fontSize: 8, color: "#e65100", fontWeight: 700, letterSpacing: ".12em" }}>🏛 COLUMN TARGETING</span>
                          <span style={{ fontSize: 9, color: "#bbb" }}>— pick exact column instead of all cells</span>
                        </div>

                        {/* Current column highlighted */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7, padding: "5px 8px", background: "#fff3e0", border: "1px solid #ffcc02", borderRadius: 6 }}>
                          <span style={{ fontSize: 9, color: "#e65100" }}>📍 Selected column:</span>
                          <code style={{ fontSize: 10, color: "#bf360c", fontFamily: "monospace", fontWeight: 700 }}>
                            {colInfo.baseSelWithoutCell} td:nth-child({colInfo.colIndex})
                          </code>
                          <button
                            onClick={() => onSelectorPicked(`${colInfo.baseSelWithoutCell} td:nth-child(${colInfo.colIndex})`)}
                            style={{ marginLeft: "auto", padding: "2px 10px", background: "#e65100", border: "none", borderRadius: 4, color: "#fff", fontSize: 9, fontWeight: 700, cursor: "pointer" }}>
                            Use ✓
                          </button>
                        </div>

                        {/* All columns grid */}
                        <div style={{ fontSize: 8, color: "#9e9e9e", fontWeight: 700, letterSpacing: ".1em", marginBottom: 4 }}>ALL COLUMNS — click to use specific column:</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 4 }}>
                          {Array.from({ length: colInfo.totalCols }, (_, i) => {
                            const n = i + 1;
                            const isActive = n === colInfo.colIndex;
                            const hdrText = colInfo.headerCells[i]
                              ? (colInfo.headerCells[i].textContent || "").trim().slice(0, 14)
                              : `Col ${n}`;
                            const sel = `${colInfo.baseSelWithoutCell} td:nth-child(${n})`;
                            return (
                              <button
                                key={n}
                                title={sel}
                                onClick={() => onSelectorPicked(sel)}
                                style={{
                                  padding: "3px 7px",
                                  background: isActive ? "#e65100" : "#fff",
                                  border: `1px solid ${isActive ? "#e65100" : "#e0e0e0"}`,
                                  borderRadius: 4,
                                  color: isActive ? "#fff" : "#555",
                                  fontFamily: "'Courier New', monospace",
                                  fontSize: 9,
                                  cursor: "pointer",
                                  display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
                                  minWidth: 36,
                                  transition: "all .12s",
                                }}
                                onMouseOver={e => { if (!isActive) { e.currentTarget.style.borderColor = "#e65100"; e.currentTarget.style.color = "#e65100"; } }}
                                onMouseOut={e => { if (!isActive) { e.currentTarget.style.borderColor = "#e0e0e0"; e.currentTarget.style.color = "#555"; } }}
                              >
                                <span style={{ fontSize: 8, fontWeight: 700 }}>col {n}</span>
                                <span style={{ fontSize: 8, color: isActive ? "#ffe0b2" : "#9e9e9e", maxWidth: 52, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{hdrText}</span>
                              </button>
                            );
                          })}
                          {/* "All cells" option */}
                          <button
                            title={activeSel}
                            onClick={() => onSelectorPicked(activeSel)}
                            style={{ padding: "3px 7px", background: "#f3e5f5", border: "1px solid #ce93d8", borderRadius: 4, color: "#7b1fa2", fontFamily: "'Courier New', monospace", fontSize: 9, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 1, minWidth: 36 }}
                          >
                            <span style={{ fontSize: 8, fontWeight: 700 }}>all td</span>
                            <span style={{ fontSize: 8, color: "#ce93d8" }}>generic</span>
                          </button>
                        </div>
                        <div style={{ fontSize: 8, color: "#bbb", lineHeight: 1.5 }}>
                          💡 <b style={{ color: "#e65100" }}>td:nth-child(n)</b> targets only column n — prevents scraping all cells at once.
                        </div>
                      </div>
                    )}

                    {/* ── Standard EXTRACT AS buttons ── */}
                    <div style={{ padding: "6px 8px" }}>
                      <div style={{ fontSize: 8, color: "#9e9e9e", fontWeight: 700, letterSpacing: ".12em", marginBottom: 5 }}>EXTRACT AS</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {attrBtns.map(({ label, suffix, color }) => (
                          <button key={label} onClick={() => onSelectorPicked(suffix ? activeSel + suffix : activeSel)}
                            style={{ padding: "3px 8px", background: "#fff", border: `1px solid ${color}44`, borderRadius: 4, color, fontFamily: "'Courier New',monospace", fontSize: 9, cursor: "pointer" }}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* divider */}
        <div onMouseDown={onDividerDown} className="tree-divider"
          onMouseOver={e => e.currentTarget.style.background = "#c5cae9"}
          onMouseOut={e => e.currentTarget.style.background = "#e8edf5"}>
          <div style={{ width: 1, height: 32, background: "#c5cae9", borderRadius: 2 }} />
        </div>

        <PreviewPane rawHtml={rawHtml} baseUrl={baseUrl} hovSel={hSel} pickSel={activeSel} matchCnt={matchCnt} inspectMode={inspectMode} onInspectElement={handleInspectElement} />
      </div>
    </div>
  );
}