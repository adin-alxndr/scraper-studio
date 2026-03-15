import { resolveUrl } from "./encoding";

// ─── Lazy-load image resolver ─────────────────────────────────────────────────
export function resolveLazyImages(doc, baseUrl) {
  doc.querySelectorAll("img[data-src],img[data-lazy],img[data-original],img[data-url]").forEach(img => {
    const lazySrc = img.getAttribute("data-src") || img.getAttribute("data-lazy") ||
                    img.getAttribute("data-original") || img.getAttribute("data-url");
    if (lazySrc) {
      try { img.setAttribute("src", new URL(lazySrc, baseUrl).href); } catch { img.setAttribute("src", lazySrc); }
    }
  });
}

// ─── Shadow DOM scraping ──────────────────────────────────────────────────────
// Extracts content from:
//   1. Declarative Shadow DOM <template shadowrootmode="open"> (Chrome 111+)
//   2. Data embedded in <script type="application/json"> / text/template blocks
//   3. Custom elements with slot/part attributes containing visible text
//   4. Recursive traversal: nested shadowRoot elements (actual live shadow roots)
//
// NOTE: Static HTML fetched via proxy cannot expose live shadow roots created by
// JavaScript (e.g. Polymer shop). Those require a real browser (Playwright/Puppeteer).
export function extractShadowContent(doc) {
  const results = [];

  function traverseTree(root, depth) {
    if (!root || depth > 10) return;

    if (root.querySelectorAll) {
      root.querySelectorAll("template[shadowrootmode], template[shadowroot]").forEach(tmpl => {
        const frag = tmpl.content;
        if (!frag) return;
        frag.querySelectorAll("a[href]").forEach(a => {
          const href = a.getAttribute("href") || "";
          const text = (a.textContent || "").trim();
          if (href || text) results.push({ type: "shadow-link", href, text, depth });
        });
        frag.querySelectorAll("*").forEach(el => {
          const text = ([...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join("")).trim();
          if (text.length > 2) results.push({ type: "shadow-text", text, tag: el.tagName.toLowerCase(), depth });
        });
        traverseTree(frag, depth + 1);
      });
    }

    if (root.querySelectorAll) {
      root.querySelectorAll("*").forEach(el => {
        if (el.shadowRoot) {
          el.shadowRoot.querySelectorAll("a[href]").forEach(a => {
            const href = a.getAttribute("href") || "";
            const text = (a.textContent || "").trim();
            if (href || text) results.push({ type: "shadow-root-link", href, text, host: el.tagName.toLowerCase() });
          });
          el.shadowRoot.querySelectorAll("*").forEach(child => {
            const text = ([...child.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join("")).trim();
            if (text.length > 2 && text.length < 1000) {
              results.push({ type: "shadow-root-text", text, tag: child.tagName.toLowerCase(), host: el.tagName.toLowerCase() });
            }
          });
          traverseTree(el.shadowRoot, depth + 1);
        }
      });
    }
  }

  try {
    traverseTree(doc, 0);

    doc.querySelectorAll(
      "script[type='application/json'], script[type='application/ld+json'], " +
      "script[id*='__NEXT_DATA__'], script[id*='__NUXT__']"
    ).forEach(script => {
      const raw = (script.textContent || "").trim();
      if (!raw || raw.length < 10) return;
      try {
        const obj = JSON.parse(raw);
        const flat = JSON.stringify(obj);
        results.push({ type: "json-block", text: flat.slice(0, 500), scriptId: script.id || script.type });
      } catch {}
    });

    doc.querySelectorAll("[slot], [part]").forEach(el => {
      const text = (el.textContent || "").trim();
      if (text.length > 2 && text.length < 500) {
        results.push({ type: "slot-part", text, attr: el.getAttribute("slot") || el.getAttribute("part") || "" });
      }
    });
  } catch {}

  return results;
}

// ─── CSRF token extractor ─────────────────────────────────────────────────────
export function extractCsrfToken(html) {
  const patterns = [
    /<meta[^>]+name=["']csrf[-_]?token["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']csrf[-_]?token["']/i,
    /<input[^>]+name=["'](?:_token|csrf[-_]?token|authenticity_token|__RequestVerificationToken)["'][^>]+value=["']([^"']+)["']/i,
    /<input[^>]+value=["']([^"']+)["'][^>]+name=["'](?:_token|csrf[-_]?token|authenticity_token|__RequestVerificationToken)["']/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1];
  }
  return null;
}

// ─── ASP.NET token extractor ──────────────────────────────────────────────────
export function extractAspNetTokens(html) {
  const viewState    = (html.match(/<input[^>]+name="__VIEWSTATE"[^>]+value="([^"]+)"/i) ||
                        html.match(/<input[^>]+value="([^"]+)"[^>]+name="__VIEWSTATE"/i))?.[1] || null;
  const eventVal     = (html.match(/<input[^>]+name="__EVENTVALIDATION"[^>]+value="([^"]+)"/i) ||
                        html.match(/<input[^>]+value="([^"]+)"[^>]+name="__EVENTVALIDATION"/i))?.[1] || null;
  const viewStateGen = (html.match(/<input[^>]+name="__VIEWSTATEGENERATOR"[^>]+value="([^"]+)"/i))?.[1] || null;
  return { viewState, eventVal, viewStateGen };
}

// ─── Table detector ───────────────────────────────────────────────────────────
export function detectTables(doc) {
  if (!doc) return [];
  return [...doc.querySelectorAll("table")].map((tbl, idx) => {
    const thEls = [...tbl.querySelectorAll("thead th, thead td")];
    const firstRowCells = thEls.length === 0
      ? [...(tbl.querySelector("tr")?.querySelectorAll("th,td") || [])]
      : thEls;
    const headers = firstRowCells.map(el => el.textContent.trim().replace(/\s+/g," ")).filter(Boolean);
    const rowCount = tbl.querySelectorAll("tbody tr, tr").length;
    let sel = "table";
    if (tbl.id) sel = `#${tbl.id}`;
    else if (tbl.className) {
      const cls = [...tbl.classList].filter(c => c.length > 1 && c.length < 60);
      if (cls.length) sel = `table.${cls[0]}`;
      else sel = `table:nth-of-type(${idx + 1})`;
    } else if ([...doc.querySelectorAll("table")].length > 1) sel = `table:nth-of-type(${idx + 1})`;
    return { idx, sel, headers, rowCount };
  }).filter(t => t.rowCount > 1);
}

// ─── JSON → rows flattener ────────────────────────────────────────────────────
export function flattenJsonToRows(data) {
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === "object")
    return data.map(r => typeof r === "object" ? r : { value: r });
  if (data && typeof data === "object") {
    for (const k of ["data","rows","result","results","items","list","records","dataset","content","value"]) {
      if (Array.isArray(data[k]) && data[k].length > 0) return flattenJsonToRows(data[k]);
    }
    for (const k of Object.keys(data)) {
      if (Array.isArray(data[k]) && data[k].length > 0 && typeof data[k][0] === "object")
        return flattenJsonToRows(data[k]);
    }
  }
  return [];
}

// ─── CSS selector extractor ───────────────────────────────────────────────────
export function extractByCss(doc, baseUrl, sel) {
  try {
    const s = sel.trim();
    const attrMatch = s.match(/^(.+?)\s+@([\w-]+)$/);
    if (attrMatch) {
      const [, cssSel, attr] = attrMatch;
      return [...doc.querySelectorAll(cssSel.trim())].map(el => {
        const val = el.getAttribute(attr) || "";
        if (!val) return "";
        if (["href","src","data-src","data-lazy","data-original","srcset","action","poster"].includes(attr)) {
          if (attr === "srcset") return val;
          return resolveUrl(val, baseUrl);
        }
        return val;
      }).filter(v => v !== "");
    }
    const isLink = s === "a" || s === "a[href]" || /^a[\[.\s,]/.test(s);
    const isImg  = s === "img";
    return [...doc.querySelectorAll(s)].map(el => {
      if (isLink && el.tagName === "A") return resolveUrl(el.getAttribute("href") || "", baseUrl);
      if (isImg  && el.tagName === "IMG") return resolveUrl(el.getAttribute("src") || "", baseUrl);
      return el.textContent.trim().replace(/\s+/g, " ");
    });
  } catch { return []; }
}
