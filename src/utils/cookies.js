// ─── Cookie store (session persistence between scrape calls) ──────────────────
export const SESSION_COOKIES = new Map(); // domain → cookie string

export function loadPersistedCookies() {
  try {
    const raw = localStorage.getItem("_scraper_cookies");
    if (!raw) return;
    const obj = JSON.parse(raw);
    for (const [k, v] of Object.entries(obj)) SESSION_COOKIES.set(k, v);
  } catch {}
}

export function persistCookies() {
  try {
    localStorage.setItem("_scraper_cookies", JSON.stringify(Object.fromEntries(SESSION_COOKIES)));
  } catch {}
}

export function storeCookiesFromResponse(proxyResponseText, url) {
  // Browser CORS blocks Set-Cookie header access on cross-origin responses.
  // Instead we parse Set-Cookie directives embedded in the raw proxy response body
  // (allorigins includes them in the `headers` field of its JSON response).
  try {
    const domain = new URL(url).hostname;
    let parsed = null;
    try { parsed = JSON.parse(proxyResponseText); } catch {}
    const cookieHeader = parsed?.headers?.["set-cookie"] || parsed?.headers?.["Set-Cookie"] || "";
    if (cookieHeader) {
      const existing = SESSION_COOKIES.get(domain) || "";
      const combined = existing
        ? existing + "; " + cookieHeader.split(",")[0].split(";")[0]
        : cookieHeader.split(",")[0].split(";")[0];
      SESSION_COOKIES.set(domain, combined);
    }
  } catch {}
}

export function getCookiesForUrl(url) {
  try {
    const domain = new URL(url).hostname;
    return SESSION_COOKIES.get(domain) || "";
  } catch { return ""; }
}

// ─── Cookie jar helpers: proper multi-cookie Set-Cookie parsing ───────────────
export function parseCookieHeader(setCookieHeader) {
  if (!setCookieHeader) return {};
  var result = {};
  var parts = setCookieHeader.split(/,(?=[^;]+=)/);
  for (var i = 0; i < parts.length; i++) {
    var segments = parts[i].split(";");
    var kv = segments[0].trim();
    var eq = kv.indexOf("=");
    if (eq < 1) continue;
    var name = kv.slice(0, eq).trim();
    var value = kv.slice(eq + 1).trim();
    if (name && value) result[name] = value;
  }
  return result;
}

export function mergeCookiesForDomain(domain, newCookies) {
  var existing = {};
  try {
    var raw = SESSION_COOKIES.get(domain) || "";
    if (raw) {
      raw.split(";").forEach(function(s) {
        var parts = s.trim().split("=");
        var k = parts[0].trim();
        var v = parts.slice(1).join("=").trim();
        if (k) existing[k] = v;
      });
    }
  } catch(e) {}
  var merged = Object.assign({}, existing, newCookies);
  SESSION_COOKIES.set(domain, Object.entries(merged).map(function(pair) {
    return pair[0] + "=" + pair[1];
  }).join("; "));
}

export function extractAndStoreCookies(proxyResponseText, targetUrl) {
  try {
    var domain = new URL(targetUrl).hostname;
    var parsed = null;
    try { parsed = JSON.parse(proxyResponseText); } catch(e) {}
    var setCookie = (parsed && parsed.headers && (parsed.headers["set-cookie"] || parsed.headers["Set-Cookie"])) || "";
    if (setCookie) {
      var newCookies = parseCookieHeader(setCookie);
      if (Object.keys(newCookies).length) mergeCookiesForDomain(domain, newCookies);
    }
  } catch(e) {}
}
