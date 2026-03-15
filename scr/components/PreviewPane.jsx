import { useState, useEffect, useRef, useMemo } from "react";

export function PreviewPane({ rawHtml, baseUrl, hovSel, pickSel, matchCnt, inspectMode, onInspectElement }) {
  const iframeRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const handler = (event) => {
      if (!event.data || event.data.__source !== "scraper-picker") return;
      if (event.data.type === "element-clicked" && onInspectElement) onInspectElement(event.data);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onInspectElement]);

  const srcdoc = useMemo(() => {
    if (!rawHtml) return "";
    const base = `<base href="${baseUrl}">`;
    const style = `<style>
      * { pointer-events: none !important; }
      a, button, input, select, textarea, form { pointer-events: none !important; cursor: default !important; }
      .__hov__ { outline: 2px dashed #1565c044 !important; background: rgba(21,101,192,0.06) !important; }
      .__pick__ { outline: 3px solid #1565c0 !important; background: rgba(21,101,192,0.13) !important; box-shadow: 0 0 0 4px rgba(21,101,192,0.08) !important; }
      body.__inspect-mode__ * { pointer-events: auto !important; cursor: crosshair !important; }
      body.__inspect-mode__ a { pointer-events: auto !important; cursor: crosshair !important; }
      .__inspect-hover__ { outline: 2px dashed #f57c00 !important; background: rgba(245,124,0,0.10) !important; cursor: crosshair !important; }
    </style>`;
    const script = `<script>
      document.addEventListener('click', e => e.preventDefault(), true);
      document.addEventListener('submit', e => e.preventDefault(), true);
      let inspectActive = false; let hoveredEl = null;
      const BAD_CLASS = /^(ng-|js-|is-|has-|active|disabled|selected|hover|focus|open|show|hide|hidden|invisible|visible|fade|collapse|d-|col-|row$|container|wrapper|wrap$|inner|outer|sr-only|clearfix|pull-|push-|float-|text-(?:left|right|center|muted)|m[tblrxy]?-|p[tblrxy]?-|g[xy]?-|flex-|align-|justify-|order-|w-|h-|gap-|border-|rounded|shadow|overflow|z-|position-|sticky|fixed|relative|absolute)/;
      const INJECTED = new Set(["__hov__","__pick__","__inspect-hover__","__inspect-mode__"]);
      const SKIP = new Set(["HTML","HEAD","SCRIPT","STYLE","NOSCRIPT"]);
      function goodCls(el) { return [...el.classList].filter(c => c.length > 1 && c.length < 80 && !/^\\d/.test(c) && !BAD_CLASS.test(c) && !INJECTED.has(c)); }
      function cnt(sel) { try { return document.querySelectorAll(sel).length; } catch { return Infinity; } }
      function bestSeg(el) {
        const tag = el.tagName.toLowerCase();
        if (el.id && /^[a-zA-Z][\\w-]*$/.test(el.id)) { const s = '#' + el.id; if (cnt(s) === 1) return { seg: s, unique: true }; }
        for (const a of ["data-testid","data-id","data-key","data-name","data-cy","data-qa","name","itemprop","role"]) {
          const v = el.getAttribute(a); if (!v || v.length > 80 || v.includes('"')) continue;
          const s = '[' + a + '="' + v + '"]'; const n = cnt(s);
          if (n === 1) return { seg: s, unique: true }; if (n > 1 && n <= 50) return { seg: tag + s, unique: false };
        }
        const cls = goodCls(el);
        if (cls.length > 0) {
          for (const c of cls) { const n = cnt('.' + c); if (n >= 2 && n <= 200) return { seg: '.' + c, unique: false }; if (n === 1) return { seg: '.' + c, unique: true }; }
          for (const c of cls) { const s = tag + '.' + c; const n = cnt(s); if (n >= 2 && n <= 200) return { seg: s, unique: false }; if (n === 1) return { seg: s, unique: true }; }
          if (cls.length >= 2) { const s = '.' + cls[0] + '.' + cls[1]; const n = cnt(s); if (n >= 1 && n <= 200) return { seg: s, unique: n === 1 }; }
          return { seg: tag + '.' + cls[0], unique: false };
        }
        const SEMANTIC = new Set(["h1","h2","h3","h4","h5","h6","a","img","li","td","th","p","time","article","section","nav","header","footer","main","aside","figure","figcaption","blockquote","label","dt","dd"]);
        if (SEMANTIC.has(tag)) { const n = cnt(tag); if (n >= 1 && n <= 300) return { seg: tag, unique: n === 1 }; }
        return { seg: tag, unique: false };
      }
      function buildSelectorFromEl(el) {
        if (!el || el.nodeType !== 1) return "";
        const { seg, unique } = bestSeg(el); if (unique) return seg;
        let combined = seg; let cur = el.parentElement; let hops = 0;
        while (cur && cur.nodeType === 1 && !SKIP.has(cur.tagName) && hops < 3) {
          const { seg: pSeg } = bestSeg(cur); const candidate = pSeg + ' ' + combined; const n = cnt(candidate);
          if (n >= 1 && n <= 200) { combined = candidate; if (n <= 50) break; }
          cur = cur.parentElement; hops++;
        }
        return combined;
      }
      function getElInfo(el) { return { tag: el.tagName.toLowerCase(), id: el.id || "", classes: [...el.classList].join(" "), text: (el.innerText || "").trim().replace(/\\s+/g," ").slice(0,200), sel: buildSelectorFromEl(el), shortTag: el.tagName.toLowerCase() }; }
      window.addEventListener('message', e => {
        const { type, sel } = e.data || {};
        if (type === 'toggle-inspect') { inspectActive = e.data.active; if (inspectActive) { document.body.classList.add('__inspect-mode__'); } else { document.body.classList.remove('__inspect-mode__'); if (hoveredEl) { hoveredEl.classList.remove('__inspect-hover__'); hoveredEl = null; } } return; }
        document.querySelectorAll('.__hov__,.__pick__').forEach(el => { el.classList.remove('__hov__', '__pick__'); });
        if (!sel) return;
        try { document.querySelectorAll(sel).forEach(el => el.classList.add(type === 'pick' ? '__pick__' : '__hov__')); const first = document.querySelector(sel); if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch(e) {}
      });
      document.addEventListener('mouseover', e => { if (!inspectActive) return; if (hoveredEl) hoveredEl.classList.remove('__inspect-hover__'); hoveredEl = e.target; if (hoveredEl) hoveredEl.classList.add('__inspect-hover__'); }, true);
      document.addEventListener('mouseout', e => { if (!inspectActive) return; if (e.target) e.target.classList.remove('__inspect-hover__'); }, true);
      document.addEventListener('click', e => { if (!inspectActive) return; e.preventDefault(); e.stopPropagation(); const info = getElInfo(e.target); window.parent.postMessage({ __source: 'scraper-picker', type: 'element-clicked', ...info }, '*'); }, true);
    <\/script>`;
    const injected = base + style + script;
    if (rawHtml.includes("</head>")) return rawHtml.replace("</head>", injected + "</head>");
    return injected + rawHtml;
  }, [rawHtml, baseUrl]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !loaded) return;
    try { iframe.contentWindow.postMessage({ type: "toggle-inspect", active: inspectMode }, "*"); } catch {}
  }, [inspectMode, loaded]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !loaded) return;
    const sel = pickSel || hovSel || ""; const type = pickSel ? "pick" : "hov";
    try { iframe.contentWindow.postMessage({ type, sel }, "*"); } catch {}
  }, [hovSel, pickSel, loaded]);

  if (!rawHtml) return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f5f7fa", borderLeft: "1px solid var(--border)", color: "#90a4ae", gap: 12 }}>
      <div style={{ fontSize: 32 }}>🌐</div>
      <div style={{ fontSize: 12 }}>Page preview will appear here</div>
    </div>
  );

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", borderLeft: "1px solid var(--border)", minWidth: 0, position: "relative" }}>
      <div className="preview-bar">
        <div style={{ display: "flex", gap: 5 }}>
          {["#ef5350","#ffa726","#66bb6a"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
        </div>
        <div className="preview-url">{baseUrl}</div>
        {inspectMode && <span className="preview-badge preview-badge-inspect">🔍 INSPECT ON</span>}
        {pickSel && matchCnt !== null && <span className="preview-badge preview-badge-count">{matchCnt} elements</span>}
      </div>
      <iframe
        ref={iframeRef}
        srcDoc={srcdoc}
        sandbox="allow-same-origin allow-scripts"
        onLoad={() => {
          setLoaded(true);
          const iframe = iframeRef.current; if (!iframe) return;
          if (inspectMode) { try { iframe.contentWindow.postMessage({ type: "toggle-inspect", active: true }, "*"); } catch {} }
          const sel = pickSel || hovSel || ""; const type = pickSel ? "pick" : "hov";
          if (sel) setTimeout(() => { try { iframe.contentWindow.postMessage({ type, sel }, "*"); } catch {} }, 100);
        }}
        style={{ flex: 1, border: "none", background: "#fff", cursor: inspectMode ? "crosshair" : "default" }}
        title="preview"
      />
      {!loaded && (
        <div style={{ position: "absolute", inset: 0, top: 34, display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f7fa", color: "#90a4ae", fontSize: 12, gap: 10 }}>
          <div className="spinner" />Loading preview…
        </div>
      )}
    </div>
  );
}
