import { PROXIES } from "./proxies";
import { detectGraphQLEndpoints } from "./domDetect";

// ─── API endpoint sniffer ─────────────────────────────────────────────────────
// Scans page HTML + same-origin JS bundles for fetch/axios/XHR calls and
// GraphQL endpoint patterns.
export async function sniffApiEndpoints(html, baseUrl, settings = {}) {
  if (!html) return { apiEndpoints: [], graphqlEndpoints: [] };
  const found = new Set();

  function scanText(text) {
    if (settings.detectAPI !== false) {
      const fetchRe   = /fetch\s*\(\s*['"`]([^'"`\s]{4,300})['"`]/g;
      const ajaxRe    = /(?:axios|jQuery|\$)\.(?:get|post|ajax|getJSON)\s*\(\s*['"`]([^'"`\s]{4,300})['"`]/g;
      const urlPropRe = /\burl\s*:\s*['"`]([^'"`\s]{4,300})['"`]/g;
      const apiPathRe = /['"`]((?:https?:\/\/[^'"`\s]+|\/[a-zA-Z][a-zA-Z0-9_\-\/]+)(?:\/[Gg]et[A-Z]|\/[Aa]pi\/|\/[Gg]et\/|\/[Dd]ata\/|\/[Ll]ist\/|\/[Tt]able|\/[Ff]etch|\/[Qq]uery|\/[Ss]earch)[^'"`\s]{0,200})['"`]/g;
      let m;
      while ((m = fetchRe.exec(text))   !== null) found.add(m[1]);
      while ((m = ajaxRe.exec(text))    !== null) found.add(m[1]);
      while ((m = urlPropRe.exec(text)) !== null) found.add(m[1]);
      while ((m = apiPathRe.exec(text)) !== null) found.add(m[1]);
    }
  }

  scanText(html);

  const parser = new DOMParser();
  const doc    = parser.parseFromString(html, "text/html");
  const origin = (() => { try { return new URL(baseUrl).origin; } catch { return ""; } })();

  // Scan same-origin JS bundles (skip third-party CDN libs)
  const extScripts = [...doc.querySelectorAll("script[src]")]
    .map(s => { try { return new URL(s.getAttribute("src") || "", baseUrl).href; } catch { return ""; } })
    .filter(src => src && src.startsWith(origin) && !(/jquery|bootstrap|analytics|vendor|lib\b/i.test(src)))
    .slice(0, 5);

  await Promise.allSettled(extScripts.map(async src => {
    try {
      const pUrl = PROXIES[0].fn(src);
      const ctrl = new AbortController();
      const tid  = setTimeout(() => ctrl.abort(), 8000);
      let r;
      try { r = await fetch(pUrl, { signal: ctrl.signal }); } finally { clearTimeout(tid); }
      if (!r.ok) return;
      const d = await r.json();
      if (d.contents) scanText(d.contents);
    } catch {}
  }));

  if (settings.detectAPI !== false) {
    doc.querySelectorAll("a[href]").forEach(a => {
      const h = a.getAttribute("href") || "";
      if (/\.(json|csv)(\?|$)/i.test(h) || /\/api\//i.test(h)) found.add(h);
    });
  }

  const apiResults = [];
  for (const raw of found) {
    try {
      const abs = /^https?:\/\//i.test(raw) ? raw : new URL(raw, baseUrl).href;
      if (/\.(js|css|png|jpg|gif|svg|woff|ttf|ico)(\?|$)/i.test(abs)) continue;
      if (/google|facebook|twitter|jquery|bootstrap|analytics|cdn\./i.test(abs)) continue;
      apiResults.push(abs);
    } catch {}
  }

  const graphqlEndpoints = settings.detectGraphQL
    ? detectGraphQLEndpoints(html, baseUrl)
    : [];

  return {
    apiEndpoints:    [...new Set(apiResults)].slice(0, 20),
    graphqlEndpoints: [...new Set(graphqlEndpoints)].slice(0, 10),
  };
}
