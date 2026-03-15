// ─── Anti-Bot System ─────────────────────────────────────────────────────────
// Comprehensive human-like request simulation:
//   1. Real browser User-Agent rotation (Chrome/Firefox/Edge/Safari)
//   2. Full browser header set (Accept, Accept-Language, Sec-Fetch-*, etc.)
//   3. Cookie jar per-domain with proper Set-Cookie parsing
//   4. Human-pattern delay: bimodal + jitter + think-pause
//   5. Request fingerprint variation (header values, language variants)

export const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:125.0) Gecko/20100101 Firefox/125.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
];

export const ACCEPT_LANGUAGES = [
  "en-US,en;q=0.9",
  "en-US,en;q=0.9,id;q=0.8",
  "en-GB,en;q=0.9",
  "en-US,en;q=0.8,de;q=0.6",
  "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  "en-US,en;q=0.9,fr;q=0.8",
  "en-US,en;q=0.9,es;q=0.7",
];

// Sticky UA for this session — rotates per-request in antibotMode
let _sessionUA = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
export function randomUA() { return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]; }
export function sessionUA() { return _sessionUA; }

export function buildBrowserHeaders(options) {
  const opts = options || {};
  const rotate = opts.rotate || false;
  const referer = opts.referer || null;
  const isXhr = opts.isXhr || false;
  const cookieStr = opts.cookieStr || "";
  const ua = rotate ? randomUA() : sessionUA();
  const isFirefox = /Firefox/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
  const lang = ACCEPT_LANGUAGES[Math.floor(Math.random() * ACCEPT_LANGUAGES.length)];
  const headers = {};
  headers["User-Agent"] = ua;
  headers["Accept"] = isXhr
    ? "application/json, text/plain, */*"
    : "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7";
  headers["Accept-Language"] = lang;
  headers["Accept-Encoding"] = "gzip, deflate, br";
  headers["Connection"] = "keep-alive";
  if (!isXhr) headers["Upgrade-Insecure-Requests"] = "1";
  if (Math.random() > 0.5) headers["Cache-Control"] = "max-age=0";
  if (!isFirefox && !isSafari) {
    headers["Sec-Fetch-Dest"] = isXhr ? "empty" : "document";
    headers["Sec-Fetch-Mode"] = isXhr ? "cors" : "navigate";
    headers["Sec-Fetch-Site"] = referer ? "same-origin" : "none";
    if (!isXhr) headers["Sec-Fetch-User"] = "?1";
    headers["Sec-CH-UA"] = '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"';
    headers["Sec-CH-UA-Mobile"] = "?0";
    headers["Sec-CH-UA-Platform"] = Math.random() > 0.5 ? '"Windows"' : '"macOS"';
  }
  if (referer) headers["Referer"] = referer;
  if (cookieStr) {
    headers["Cookie"] = cookieStr;
    headers["X-Cookie"] = cookieStr;
  }
  return headers;
}

// Human-like delay: bimodal (quick-skim vs proper-read) + jitter + think-pause
export function humanDelay(min, max) {
  var lo = min !== undefined ? min : 800;
  var hi = max !== undefined ? max : 2400;
  var ms = lo + Math.random() * (hi - lo);
  if (Math.random() < 0.15) ms += 2000 + Math.random() * 3000;
  ms += Math.random() * 200;
  return new Promise(function(r) { setTimeout(r, ms); });
}

// Advanced anti-bot delay: bimodal — quick skim OR proper read
export function antibotDelay() {
  var ms = Math.random() < 0.4
    ? 1500 + Math.random() * 1500
    : 4000 + Math.random() * 5000;
  return new Promise(function(r) { setTimeout(r, ms); });
}

// ─── Anti-Bot Browser Fingerprint Report ─────────────────────────────────────
// Generates a structured report of browser environment signals that anti-bot
// systems use to detect automated browsers. Runs in the current JS context.
export function generateAntiBotReport() {
  const checks = [];

  function check(name, fn, humanValue, description) {
    try {
      const value = fn();
      const isHuman = humanValue(value);
      checks.push({ name, value: String(value).slice(0, 200), isHuman, description });
    } catch (e) {
      checks.push({ name, value: "Error: " + e.message, isHuman: false, description });
    }
  }

  check("navigator.webdriver", () => navigator.webdriver, v => v !== true && v !== "true",
    "Should be undefined/false in real browsers. Headless browsers set this to true.");
  check("navigator.plugins.length", () => navigator.plugins?.length ?? 0, v => parseInt(v) > 0,
    "Real browsers have multiple plugins. Headless/automated browsers often have 0.");
  check("navigator.languages", () => (navigator.languages || []).join(", ") || "(empty)",
    v => v !== "(empty)" && v.length > 0,
    "Real browsers expose accepted languages. Bots may leave this empty.");
  check("navigator.userAgent", () => navigator.userAgent,
    v => !/HeadlessChrome|PhantomJS|Selenium|webdriver|bot|crawler/i.test(v),
    "Should look like a real browser UA. Headless indicators: HeadlessChrome, PhantomJS, webdriver.");
  check("WebGL renderer", () => {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return "(unavailable)";
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    if (!ext) return "(extension blocked)";
    return gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || "(empty)";
  }, v => v !== "(unavailable)" && !/SwiftShader|llvmpipe|ANGLE.*Microsoft/i.test(v),
    "Real GPUs have specific renderer strings. Headless often shows SwiftShader or ANGLE/Microsoft fallback.");
  check("screen.width × screen.height", () => `${screen.width}×${screen.height}`,
    v => !v.startsWith("0×") && !v.startsWith("800×600"),
    "Real users have normal screen resolutions. Headless often reports 0×0 or 800×600.");
  check("timezone", () => Intl.DateTimeFormat().resolvedOptions().timeZone || "(unknown)",
    v => v !== "(unknown)" && v.length > 3,
    "Real browsers expose timezone. Missing timezone is a bot signal.");
  check("navigator.hardwareConcurrency", () => navigator.hardwareConcurrency ?? 0,
    v => parseInt(v) >= 2,
    "Real machines typically have 2+ CPU cores. Bots may report 0 or 1.");
  check("touch support vs UA", () => {
    const isMobileUA = /Mobile|Android|iPhone/i.test(navigator.userAgent);
    const hasTouch = navigator.maxTouchPoints > 0;
    if (isMobileUA && !hasTouch) return "MISMATCH: mobile UA but no touch";
    if (!isMobileUA && hasTouch) return "desktop UA with touch (tablet OK)";
    return "consistent";
  }, v => !v.startsWith("MISMATCH"),
    "Touch support should match the user agent (mobile UA → touch present).");
  check("document.hidden", () => document.hidden, v => v !== true,
    "Automated scripts often run with hidden documents. Real browser tabs are visible.");

  const humanCount = checks.filter(c => c.isHuman).length;
  const botLikelihood = Math.round((1 - humanCount / checks.length) * 100);

  return {
    checks,
    humanCount,
    total: checks.length,
    botLikelihood,
    verdict: botLikelihood < 20 ? "Looks human ✅" : botLikelihood < 50 ? "Some bot signals ⚠️" : "Likely bot detected 🤖",
  };
}
