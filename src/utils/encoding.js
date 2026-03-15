import { PROXIES } from "./proxies";

// ─── URL resolver ─────────────────────────────────────────────────────────────
export function resolveUrl(href, base) {
  if (!href) return "";
  try {
    if (/^https?:\/\//i.test(href)) return href;
    if (href.startsWith("//")) return "https:" + href;
    return new URL(href, base).href;
  } catch { return href; }
}

// ─── Charset detection ────────────────────────────────────────────────────────
// Returns null if charset is already UTF-8/ASCII (no action needed).
export function detectDeclaredCharset(html) {
  const m = html.match(/<meta[^>]+charset=["']?\s*([^"'\s;>]+)/i)
           || html.match(/charset=([^"'\s;>]+)/i);
  if (!m) return null;
  const c = m[1].trim().toLowerCase().replace(/[\s_]/g, "-");
  if (["utf-8","utf8","unicode","us-ascii","ascii"].includes(c)) return null;
  return c; // e.g. "windows-1252", "iso-8859-1", "shift-jis", "gb2312"
}

// ─── Charset re-fetch ─────────────────────────────────────────────────────────
// Re-fetch a URL as raw bytes via proxy then decode with the given charset.
// This is the ONLY correct way to fix encoding in a browser environment —
// a JS string is already decoded (UTF-16), so re-encoding it then re-decoding
// would be double-wrong. We need the original raw bytes from the server.
export async function refetchWithCharset(url, charset) {
  for (const proxy of PROXIES) {
    try {
      const pUrl = proxy.fn(url);
      const controller2 = new AbortController();
      const tid2 = setTimeout(() => controller2.abort(), 15000);
      let res;
      try {
        res = await fetch(pUrl, { signal: controller2.signal });
      } finally {
        clearTimeout(tid2);
      }
      if (!res.ok) continue;
      let bytes;
      if (proxy.json) {
        const d = await res.json();
        const raw = d.contents || "";
        bytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i) & 0xff;
      } else {
        const ab = await res.arrayBuffer();
        bytes = new Uint8Array(ab);
      }
      const dec = new TextDecoder(charset, { fatal: false });
      const fixed = dec.decode(bytes);
      const garbage = (fixed.match(/\uFFFD/g) || []).length;
      if (garbage / fixed.length < 0.01) return fixed;
    } catch {}
  }
  return null;
}
