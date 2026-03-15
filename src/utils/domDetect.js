// ─── Infinite Scroll Detection ───────────────────────────────────────────────
// Analyzes static HTML for signals that indicate infinite scroll is used.
// Returns { detected, confidence, signals, message }
export function detectInfiniteScroll(doc, html) {
  const signals = [];
  let confidence = 0;

  const attrSelectors = [
    "[data-infinite-scroll]", "[data-infinite]", "[data-scroll-load]",
    "[class*='infinite-scroll']", "[class*='infiniteScroll']",
    "[class*='infinite-load']", "[id*='infinite']",
    "[data-behavior*='infinite']",
  ];
  for (const sel of attrSelectors) {
    try {
      if (doc.querySelector(sel)) { signals.push(`Element found: ${sel}`); confidence += 30; break; }
    } catch {}
  }

  const scriptContent = [...doc.querySelectorAll("script:not([src])")]
    .map(s => s.textContent || "").join("\n");

  if (/IntersectionObserver/i.test(scriptContent)) { signals.push("IntersectionObserver usage detected in inline scripts"); confidence += 35; }
  if (/infinite[_\-\s]?scroll/i.test(scriptContent)) { signals.push("infinite-scroll library reference in scripts"); confidence += 25; }
  if (/window\.onscroll|addEventListener.*scroll|scroll.*event/i.test(scriptContent)) { signals.push("Scroll event listener found in scripts"); confidence += 15; }

  const extScripts = [...doc.querySelectorAll("script[src]")].map(s => s.getAttribute("src") || "");
  for (const src of extScripts) {
    if (/infinite.?scroll|waypoint|intersection/i.test(src)) {
      signals.push(`Infinite scroll library loaded: ${src.split("/").pop()}`); confidence += 40;
    }
  }

  if (/["']next_?page|["']has_?more|["']cursor|["']nextCursor/i.test(html)) {
    signals.push("API pagination tokens (next_page/cursor) found in page source"); confidence += 20;
  }

  const sentinelSelectors = [
    "[class*='sentinel']", "[class*='observer']", "[class*='scroll-trigger']",
    "[data-scroll-trigger]", "[data-waypoint]",
  ];
  for (const sel of sentinelSelectors) {
    try {
      if (doc.querySelector(sel)) { signals.push(`Scroll sentinel element found: ${sel}`); confidence += 25; break; }
    } catch {}
  }

  const detected = confidence >= 25;
  return {
    detected,
    confidence: Math.min(confidence, 100),
    signals,
    message: detected
      ? `Infinite scroll detected (confidence: ${Math.min(confidence, 100)}%). Full content extraction requires Playwright/Puppeteer with real scroll simulation.`
      : null,
  };
}

// ─── Load-More Button Detection ───────────────────────────────────────────────
// Finds "Load More" style buttons via text matching, CSS class patterns, aria attrs.
// Clicking them requires a real browser — this provides detection + reporting.
export function detectLoadMoreButtons(doc) {
  const LOAD_MORE_TEXT = /^(load\s*more|show\s*more|view\s*more|see\s*more|more\s*results|load\s*results|show\s*all|ver\s*m[aá]s|tampilkan\s*lebih|charger\s*plus|mehr\s*laden|もっと見る|더\s*보기)$/i;
  const LOAD_MORE_PARTIAL = /load.?more|show.?more|view.?more|see.?more|more.?items|load.?results/i;

  const found = [];
  const seen = new Set();

  function addIfNew(el, method) {
    const key = el.tagName + (el.className || "") + (el.textContent || "").trim().slice(0, 50);
    if (seen.has(key)) return;
    seen.add(key);
    let sel = el.tagName.toLowerCase();
    if (el.id) sel = `#${el.id}`;
    else if (el.className) {
      const cls = [...el.classList].filter(c => c.length > 1 && c.length < 60).slice(0, 2);
      if (cls.length) sel = `${el.tagName.toLowerCase()}.${cls.join(".")}`;
    }
    found.push({ tag: el.tagName.toLowerCase(), text: (el.textContent || "").trim().slice(0, 100), selector: sel, method });
  }

  doc.querySelectorAll("button, a, span, div[role='button'], [type='button']").forEach(el => {
    const text = (el.textContent || "").trim();
    if (LOAD_MORE_TEXT.test(text)) addIfNew(el, "text-exact");
  });

  const classSelectors = [
    "button[class*='load-more']", "button[class*='loadMore']", "button[class*='load_more']",
    "a[class*='load-more']", "[data-action*='load-more']", "[data-loadmore]",
    "[class*='load-more-btn']", "[class*='show-more']", "[class*='showMore']",
    "button[class*='more-results']", "[class*='fetch-more']",
  ];
  for (const sel of classSelectors) {
    try { doc.querySelectorAll(sel).forEach(el => addIfNew(el, "css-class")); } catch {}
  }

  if (!found.length) {
    doc.querySelectorAll("button, a[href], [role='button']").forEach(el => {
      const text = (el.textContent || "").trim();
      if (LOAD_MORE_PARTIAL.test(text)) addIfNew(el, "text-partial");
    });
  }

  return found;
}

// ─── Auto-detect pagination ───────────────────────────────────────────────────
// Finds the "next page" URL using multiple strategies.
export function detectNextPageUrl(doc, baseUrl, currentUrl) {
  function resolveHref(el) {
    if (!el) return null;
    const raw = el.getAttribute("href");
    if (!raw || raw === "#" || raw.startsWith("javascript:")) return null;
    try {
      const resolved = new URL(raw, baseUrl).href;
      return resolved !== currentUrl ? resolved : null;
    } catch { return null; }
  }

  const relNext = doc.querySelector('a[rel="next"], link[rel="next"]');
  const r1 = resolveHref(relNext);
  if (r1) return r1;

  const cssSelectors = [
    "a.next", "a.next-page", "a.pagination-next", "a.page-next",
    "a[class*='next']", "a[aria-label*='next' i]", "a[aria-label*='Next']",
    ".pagination a:last-child", ".pager a:last-child", ".paginacion a:last-child",
    "li.next a", "li.next-page a", ".nav-next a", ".nextpostslink",
  ];
  for (const sel of cssSelectors) {
    try {
      const el = doc.querySelector(sel);
      const resolved = resolveHref(el);
      if (resolved) return resolved;
    } catch {}
  }

  const nextTextPatterns = /^\s*(next|next\s*page|siguiente|berikutnya|›|»|→|次へ|下一页|다음)\s*$/i;
  const allAnchors = [...doc.querySelectorAll("a[href]")];
  for (const a of allAnchors) {
    const text = (a.textContent || "").trim();
    if (nextTextPatterns.test(text)) {
      const resolved = resolveHref(a);
      if (resolved) return resolved;
    }
  }

  try {
    const cur = new URL(currentUrl);
    const pageParam = cur.searchParams.get("page") || cur.searchParams.get("p") || cur.searchParams.get("pg");
    if (pageParam && /^\d+$/.test(pageParam)) {
      const nextN = parseInt(pageParam) + 1;
      const next = new URL(currentUrl);
      const paramName = cur.searchParams.has("page") ? "page" : cur.searchParams.has("p") ? "p" : "pg";
      next.searchParams.set(paramName, String(nextN));
      const nextHref = next.href;
      const existsInPage = allAnchors.some(a => {
        try { return new URL(a.getAttribute("href")||"", baseUrl).href === nextHref; } catch { return false; }
      });
      if (existsInPage) return nextHref;
    }
    const pathPageMatch = cur.pathname.match(/\/page\/(\d+)\/?$/);
    if (pathPageMatch) {
      const nextN = parseInt(pathPageMatch[1]) + 1;
      const next = new URL(currentUrl);
      next.pathname = cur.pathname.replace(/\/page\/\d+/, `/page/${nextN}`);
      const nextHref = next.href;
      const existsInPage = allAnchors.some(a => {
        try { return new URL(a.getAttribute("href")||"", baseUrl).href === nextHref; } catch { return false; }
      });
      if (existsInPage) return nextHref;
    }
  } catch {}

  return null;
}

// ─── GraphQL endpoint detector ────────────────────────────────────────────────
export function detectGraphQLEndpoints(html, baseUrl) {
  const found = new Set();
  const patterns = [
    /['"`]((?:https?:\/\/[^'"`\s]+)?\/graphql[^'"`\s]*)['"`]/gi,
    /['"`]((?:https?:\/\/[^'"`\s]+)?\/api\/graphql[^'"`\s]*)['"`]/gi,
    /graphqlUri\s*[:=]\s*['"`]([^'"`\s]+)['"`]/gi,
    /uri\s*:\s*['"`]((?:https?:\/\/[^'"`\s]+)?\/graphql[^'"`\s]*)['"`]/gi,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(html)) !== null) {
      try { found.add(new URL(m[1], baseUrl).href); } catch { found.add(m[1]); }
    }
  }
  return [...found];
}

// ─── File attachment link detector ───────────────────────────────────────────
const FILE_EXTENSIONS = /\.(pdf|zip|rar|7z|tar|gz|doc|docx|xls|xlsx|ppt|pptx|csv|mp3|mp4|avi|mov|exe|dmg|apk)(\?.*)?$/i;

export function detectAttachmentLinks(doc, baseUrl) {
  const seen = new Set();
  const results = [];

  function fileType(url) {
    const m = url.match(/\.([a-z0-9]+)(\?|$)/i);
    return m ? m[1].toLowerCase() : "unknown";
  }
  function normalize(href) {
    if (!href) return "";
    try { return new URL(href, baseUrl).href; } catch { return href; }
  }

  doc.querySelectorAll("a[href]").forEach(a => {
    const href = normalize(a.getAttribute("href") || "");
    if (FILE_EXTENSIONS.test(href) && !seen.has(href)) {
      seen.add(href);
      results.push({ href, text: (a.textContent || "").trim().slice(0, 200), type: fileType(href), source: "href-extension" });
    }
  });

  doc.querySelectorAll("a[download]").forEach(a => {
    const href = normalize(a.getAttribute("href") || "");
    if (href && !seen.has(href)) {
      seen.add(href);
      const dl = a.getAttribute("download") || "";
      results.push({ href, text: dl || (a.textContent || "").trim().slice(0, 200), type: dl ? fileType(dl) : fileType(href), source: "download-attr" });
    }
  });

  doc.querySelectorAll("[data-file]").forEach(el => {
    const href = normalize(el.getAttribute("data-file") || "");
    if (href && !seen.has(href)) {
      seen.add(href);
      results.push({ href, text: (el.textContent || el.getAttribute("title") || "").trim().slice(0, 200), type: fileType(href), source: "data-file" });
    }
  });

  return results;
}

// ─── File upload form detector ────────────────────────────────────────────────
export function detectFileUploadForms(doc) {
  return [...doc.querySelectorAll("form")]
    .filter(f => f.querySelector("input[type='file']"))
    .map(f => ({
      action: f.getAttribute("action") || "",
      method: (f.getAttribute("method") || "GET").toUpperCase(),
      enctype: f.getAttribute("enctype") || "multipart/form-data",
      fields: [...f.querySelectorAll("input,select,textarea")]
        .map(i => ({ name: i.getAttribute("name"), type: i.getAttribute("type") || i.tagName.toLowerCase() }))
        .filter(i => i.name),
    }));
}
