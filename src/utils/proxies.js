import { detectCloudflareProtection }                           from "./cloudflare";
import { detectDeclaredCharset, refetchWithCharset }            from "./encoding";
import { loadPersistedCookies, persistCookies, getCookiesForUrl, extractAndStoreCookies } from "./cookies";
import { antibotDelay, buildBrowserHeaders }                    from "./antiBot";
import { resolveLazyImages, extractShadowContent, extractCsrfToken, extractAspNetTokens } from "./domExtract";
import { detectAttachmentLinks, detectFileUploadForms, detectInfiniteScroll, detectLoadMoreButtons } from "./domDetect";

// ─── Proxy list ───────────────────────────────────────────────────────────────
export const PROXIES = [
  { name: "corsproxy.io",   fn: (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,               json: false },
  { name: "allorigins",     fn: (u) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,      json: true  },
  { name: "allorigins-raw", fn: (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,      json: false },
  { name: "codetabs",       fn: (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`, json: false },
  { name: "crossorigin.me", fn: (u) => `https://crossorigin.me/${u}`,                                      json: false },
  { name: "cors.sh",        fn: (u) => `https://proxy.cors.sh/${u}`,                                       json: false },
];

// ─── Wikipedia direct API fetch ───────────────────────────────────────────────
export async function fetchWikipediaDirectly(url) {
  try {
    const m = url.match(/^https?:\/\/([a-z]+)\.wikipedia\.org\/wiki\/(.+)$/i);
    if (!m) return null;
    const lang = m[1];
    const title = m[2];
    const apiUrl = `https://${lang}.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(decodeURIComponent(title))}&prop=text&formatversion=2&format=json&origin=*`;
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 15000);
    let res;
    try {
      res = await fetch(apiUrl, { signal: ctrl.signal });
    } finally {
      clearTimeout(tid);
    }
    if (!res.ok) return null;
    const data = await res.json();
    const bodyHtml = data?.parse?.text;
    if (!bodyHtml || bodyHtml.length < 100) return null;
    const html = `<html><head><title>${data?.parse?.title || title}</title></head><body>${bodyHtml}</body></html>`;
    return { html, title: data?.parse?.title || title };
  } catch { return null; }
}

// ─── fetchJsonViaProxy ────────────────────────────────────────────────────────
export async function fetchJsonViaProxy(url) {
  for (const proxy of PROXIES) {
    try {
      const pUrl = proxy.fn(url);
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 10000);
      let res;
      try { res = await fetch(pUrl, { signal: ctrl.signal }); } finally { clearTimeout(tid); }
      if (!res.ok) continue;
      let text = "";
      if (pUrl.includes("allorigins")) { const d = await res.json(); text = d.contents || ""; } else { text = await res.text(); }
      if (!text || text.length < 2) continue;
      const clean = text.trim();
      if (clean.startsWith("{") || clean.startsWith("[")) return JSON.parse(clean);
    } catch {}
  }
  return null;
}

// ─── Main fetch with full settings integration ────────────────────────────────
export async function fetchWithFallback(url, settings = {}) {
  let lastErr = null;
  const challengeProxies = [];

  if (settings.persistentCookies || settings.cookieLogin) loadPersistedCookies();
  if (settings.antibotMode) await antibotDelay();

  // ── Wikipedia fast path ──
  if (/wikipedia\.org\/wiki\//i.test(url)) {
    try {
      const wd = await fetchWikipediaDirectly(url);
      if (wd) {
        let html = wd.html;
        if (settings.encodingFix) {
          const charset = detectDeclaredCharset(html);
          if (charset) { const fixed = await refetchWithCharset(url, charset); if (fixed) html = fixed; }
        }
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        if (settings.lazyLoad) resolveLazyImages(doc, "https://en.wikipedia.org");
        doc.querySelectorAll("a[href]").forEach(a => { const h = a.getAttribute("href"); if (h) { try { a.setAttribute("href", new URL(h, "https://en.wikipedia.org").href); } catch {} } });
        doc.querySelectorAll("img[src]").forEach(img => { const s = img.getAttribute("src"); if (s) { try { img.setAttribute("src", new URL(s, "https://en.wikipedia.org").href); } catch {} } });
        const links  = [...doc.querySelectorAll("a[href]")].slice(0,100).map(a=>({text:a.textContent.trim().replace(/\s+/g," ").slice(0,120),href:a.getAttribute("href")||""})).filter(l=>/^https?:\/\//i.test(l.href));
        const images = [...doc.querySelectorAll("img[src]")].slice(0,60).map(img=>({src:img.getAttribute("src")||"",alt:img.getAttribute("alt")||""})).filter(img=>/^https?:\/\//i.test(img.src));
        const csrfToken    = settings.csrfHandling      ? extractCsrfToken(html)                                : null;
        const aspTokens    = settings.aspShieldBypass   ? extractAspNetTokens(html)                             : {};
        const shadowContent= settings.shadowDOM         ? extractShadowContent(doc)                             : [];
        const attachments  = settings.attachmentDownload? detectAttachmentLinks(doc, "https://en.wikipedia.org"): [];
        const uploadForms  = settings.formUploadDetect  ? detectFileUploadForms(doc)                            : [];
        return { rawHtml: html, title: wd.title, links, images, proxyName: "wikipedia-api", doc,
                 jsChallenge: false, cloudflareProtected: false, csrfToken, aspTokens,
                 shadowContent, attachments, uploadForms, infiniteScrollInfo: null, loadMoreButtons: [] };
      }
    } catch {}
  }

  // ── Proxy loop ──
  for (let i = 0; i < PROXIES.length; i++) {
    try {
      const proxy = PROXIES[i];
      const pUrl  = proxy.fn(url);

      let reqHeaders = {};
      if (settings.antibotMode) {
        const cookieStr = (settings.cookieLogin || settings.persistentCookies) ? getCookiesForUrl(url) : "";
        reqHeaders = buildBrowserHeaders({ rotate: true, referer: null, isXhr: false, cookieStr });
      } else {
        reqHeaders["Accept"] = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";
        reqHeaders["Accept-Language"] = "en-US,en;q=0.9";
        if (settings.cookieLogin || settings.persistentCookies) {
          const cookies = getCookiesForUrl(url);
          if (cookies) { reqHeaders["Cookie"] = cookies; reqHeaders["X-Cookie"] = cookies; }
        }
      }

      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 12000);
      let res;
      try {
        res = await fetch(pUrl, { signal: controller.signal, headers: reqHeaders });
      } finally {
        clearTimeout(timeoutId);
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const rawText = await res.text();
      if (!rawText || rawText.length < 50) throw new Error("Empty response");

      if (proxy.json && (settings.persistentCookies || settings.antibotMode)) {
        extractAndStoreCookies(rawText, url);
        if (settings.persistentCookies) persistCookies();
      }

      let html = "";
      if (proxy.json) {
        try { html = JSON.parse(rawText).contents || ""; } catch { html = rawText; }
      } else {
        html = rawText;
      }
      if (!html || html.length < 50) throw new Error("Empty response");

      const cfResult = detectCloudflareProtection(html, res.status);
      if (cfResult.isChallenge) {
        challengeProxies.push(proxy.name);
        if (settings.cloudflareDetect && i === PROXIES.length - 1) {
          const parser = new DOMParser();
          const partialDoc = parser.parseFromString(html, "text/html");
          const partialTitle = partialDoc.querySelector("title")?.textContent?.trim() || "Cloudflare Challenge";
          return { rawHtml: html, title: partialTitle, links: [], images: [],
                   proxyName: proxy.name + " [CF-detected]", doc: partialDoc,
                   jsChallenge: true, cloudflareProtected: cfResult.cloudflareProtected,
                   cfReason: cfResult.reason, csrfToken: null, aspTokens: {},
                   shadowContent: [], attachments: [], uploadForms: [] };
        }
        throw new Error("JS challenge page detected");
      }

      if (settings.encodingFix) {
        const charset = detectDeclaredCharset(html);
        if (charset) { const fixed = await refetchWithCharset(url, charset); if (fixed) html = fixed; }
      }

      const csrfToken = settings.csrfHandling    ? extractCsrfToken(html)    : null;
      const aspTokens = settings.aspShieldBypass ? extractAspNetTokens(html) : {};

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      if (settings.lazyLoad) resolveLazyImages(doc, url);
      doc.querySelectorAll("a[href]").forEach(a => { const h = a.getAttribute("href"); if (h) { try { a.setAttribute("href", new URL(h, url).href); } catch {} } });
      doc.querySelectorAll("img[src]").forEach(img => { const s = img.getAttribute("src"); if (s) { try { img.setAttribute("src", new URL(s, url).href); } catch {} } });

      const title  = doc.querySelector("title")?.textContent?.trim() || "";
      const links  = [...doc.querySelectorAll("a[href]")].slice(0,100).map(a=>({text:a.textContent.trim().replace(/\s+/g," ").slice(0,120),href:a.getAttribute("href")||""})).filter(l=>/^https?:\/\//i.test(l.href));
      const images = [...doc.querySelectorAll("img[src]")].slice(0,60).map(img=>({src:img.getAttribute("src")||"",alt:img.getAttribute("alt")||""})).filter(img=>/^https?:\/\//i.test(img.src));

      const shadowContent     = settings.shadowDOM          ? extractShadowContent(doc)      : [];
      const attachments       = settings.attachmentDownload ? detectAttachmentLinks(doc, url) : [];
      const uploadForms       = settings.formUploadDetect   ? detectFileUploadForms(doc)      : [];
      const infiniteScrollInfo= settings.infiniteScroll     ? detectInfiniteScroll(doc, html) : null;
      const loadMoreButtons   = settings.endlessButton      ? detectLoadMoreButtons(doc)      : [];

      return { rawHtml: html, title, links, images, proxyName: proxy.name, doc,
               jsChallenge: false, cloudflareProtected: false, csrfToken, aspTokens,
               shadowContent, attachments, uploadForms, infiniteScrollInfo, loadMoreButtons };

    } catch (e) {
      lastErr = e;
      if (i < PROXIES.length - 1) {
        await new Promise(r => setTimeout(r, settings.antibotMode ? 800 * (i + 1) : 300));
      }
    }
  }

  if (challengeProxies.length > 0) throw new Error("JS_CHALLENGE:" + url);
  throw new Error("All proxies failed. Try: (1) paste the page HTML manually, (2) enable Anti-Bot Mode in Settings, or (3) check the URL is publicly accessible. Last error: " + (lastErr?.message || "network error"));
}
