// ─── DOM Picker / Selector Helpers ───────────────────────────────────────────

export const C = {
  tag: "#1565c0", tagHov: "#0077cc", tagPick: "#0055aa",
  attr: "#7b3f00", val: "#1a6600", eq: "#555", text: "#444",
  child: "#aaa", close: "#1565c0",
};

export const SKIP_TAGS = new Set([
  "SCRIPT","STYLE","NOSCRIPT","META","LINK","HEAD","HTML",
  "BR","HR","WBR","TEMPLATE","SVG","PATH","DEFS","SYMBOL",
  "USE","CLIPPATH",
]);

export const SELF_CLOSE = new Set([
  "img","input","br","hr","meta","link","area","base",
  "col","embed","param","source","track","wbr",
]);

export const BAD_CLASS = /^(ng-|js-|is-|has-|active|disabled|selected|hover|focus|open|show|hide|hidden|invisible|visible|fade|collapse|d-|col-|row$|container|wrapper|wrap$|inner|outer|sr-only|clearfix|pull-|push-|float-|text-(?:left|right|center|muted)|m[tblrxy]?-|p[tblrxy]?-|g[xy]?-|flex-|align-|justify-|order-|w-|h-|gap-|border-|rounded|shadow|overflow|z-|position-|sticky|fixed|relative|absolute)/;

export function goodClasses(el) {
  return [...el.classList].filter(c =>
    c.length > 1 && c.length < 80 && !/^\d/.test(c) &&
    !BAD_CLASS.test(c) &&
    !["__hov__","__pick__","__inspect-hover__","__inspect-mode__"].includes(c)
  );
}

export function matchCount(doc, sel) {
  try { return doc.querySelectorAll(sel).length; } catch { return Infinity; }
}

export function bestSegment(el, doc) {
  const tag = el.tagName.toLowerCase();
  if (el.id && /^[a-zA-Z][\w-]*$/.test(el.id)) {
    const sel = `#${el.id}`;
    if (matchCount(doc, sel) === 1) return { seg: sel, unique: true };
  }
  for (const a of ["data-testid","data-id","data-key","data-name","data-cy","data-qa","name","itemprop","role"]) {
    const v = el.getAttribute(a);
    if (!v || v.length > 80 || v.includes('"')) continue;
    const sel = `[${a}="${v}"]`;
    const cnt = matchCount(doc, sel);
    if (cnt === 1) return { seg: sel, unique: true };
    if (cnt > 1 && cnt <= 50) return { seg: `${tag}${sel}`, unique: false };
  }
  const cls = goodClasses(el);
  if (cls.length > 0) {
    for (const c of cls) {
      const sel = `.${c}`; const cnt = matchCount(doc, sel);
      if (cnt >= 2 && cnt <= 200) return { seg: sel, unique: false };
      if (cnt === 1) return { seg: sel, unique: true };
    }
    for (const c of cls) {
      const sel = `${tag}.${c}`; const cnt = matchCount(doc, sel);
      if (cnt >= 2 && cnt <= 200) return { seg: sel, unique: false };
      if (cnt === 1) return { seg: sel, unique: true };
    }
    if (cls.length >= 2) {
      const sel = `.${cls[0]}.${cls[1]}`; const cnt = matchCount(doc, sel);
      if (cnt >= 1 && cnt <= 200) return { seg: sel, unique: cnt === 1 };
    }
    return { seg: `${tag}.${cls[0]}`, unique: false };
  }
  const SEMANTIC = new Set(["h1","h2","h3","h4","h5","h6","a","img","li","td","th","p","time","article","section","nav","header","footer","main","aside","figure","figcaption","blockquote","label","dt","dd"]);
  if (SEMANTIC.has(tag)) {
    const cnt = matchCount(doc, tag);
    if (cnt >= 1 && cnt <= 300) return { seg: tag, unique: cnt === 1 };
  }
  return { seg: tag, unique: false };
}

export function buildElSelector(el, rootEl) {
  if (!el || el.nodeType !== 1) return "";
  const doc = el.ownerDocument;
  if (!doc) return el.tagName.toLowerCase();
  const { seg, unique } = bestSegment(el, doc);
  if (unique) return seg;
  let combined = seg; let cur = el.parentElement; let hops = 0;
  while (cur && cur.nodeType === 1 && !SKIP_TAGS.has(cur.tagName) && hops < 3) {
    if (cur === rootEl) break;
    const { seg: pSeg } = bestSegment(cur, doc);
    const candidate = `${pSeg} ${combined}`;
    const cnt = matchCount(doc, candidate);
    if (cnt >= 1 && cnt <= 200) { combined = candidate; if (cnt <= 50) break; }
    cur = cur.parentElement; hops++;
  }
  return combined;
}

export function buildTreeNode(el, depth, maxDepth, rootEl) {
  if (!el || el.nodeType !== 1) return null;
  if (SKIP_TAGS.has(el.tagName)) return null;
  if (depth > maxDepth) return null;
  const tag = el.tagName.toLowerCase();
  const id = el.id || "";
  const classes = [...el.classList].filter(c => c.length > 0 && c.length < 60);
  const attrs = {};
  for (const a of ["data-testid","data-id","data-key","data-name","name","role","type","href","src","title","alt","itemprop","aria-label","placeholder","value"]) {
    const v = el.getAttribute(a); if (v) attrs[a] = v;
  }
  const ownText = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join("").trim().replace(/\s+/g," ").slice(0, 200);
  const fullText = (el.textContent || "").trim().replace(/\s+/g," ").slice(0, 200);
  const sel = buildElSelector(el, rootEl);
  const childEls = [...el.children].filter(c => !SKIP_TAGS.has(c.tagName));
  const children = childEls.slice(0, 80).map(c => buildTreeNode(c, depth + 1, maxDepth, rootEl)).filter(Boolean);
  return { el, tag, id, classes, attrs, ownText, fullText, previewText: ownText, depth, childCount: children.length, totalChildren: childEls.length, sel, children };
}

export function collectAllNodes(nodes, out = new Set()) {
  for (const n of nodes) { out.add(n); if (n.children.length > 0) collectAllNodes(n.children, out); }
  return out;
}

export function flattenVisible(nodes, expandedSet, out = []) {
  for (const n of nodes) { out.push(n); if (n.children.length > 0 && expandedSet.has(n)) flattenVisible(n.children, expandedSet, out); }
  return out;
}

export function flattenAll(nodes, out = []) {
  for (const n of nodes) { out.push(n); flattenAll(n.children, out); }
  return out;
}
