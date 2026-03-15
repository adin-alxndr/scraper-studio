// ─── Cloudflare / JS Challenge Detection ─────────────────────────────────────
// Detects Cloudflare and similar challenge pages via multiple signals:
//   1. Known HTML text patterns (cf-browser-verification, "Just a moment", etc.)
//   2. Meta refresh redirects used by Cloudflare interstitials
//   3. CF-specific script/noscript patterns
//   4. Thin body content with large HTML (challenge pages have little visible text)
// Returns { isChallenge, cloudflareProtected, reason }

export const JS_CHALLENGE_PATTERNS = [
  /enable javascript and cookies/i,
  /checking your browser/i,
  /please wait\.\.\./i,
  /just a moment/i,
  /ddos protection by cloudflare/i,
  /ray id:/i,
  /cf-browser-verification/i,
  /challenge-platform/i,
  /under attack mode/i,
  /__cf_chl/i,
  /attention required/i,
  /cf-challenge/i,
  /cloudflare ray id/i,
  /security check to access/i,
];

export function detectCloudflareProtection(html, httpStatus) {
  const result = { isChallenge: false, cloudflareProtected: false, reason: "" };

  if (httpStatus === 403 || httpStatus === 503) {
    result.isChallenge = true;
    result.cloudflareProtected = true;
    result.reason = `HTTP ${httpStatus} — likely bot protection`;
    return result;
  }

  if (!html || html.length < 200) {
    result.isChallenge = true;
    result.reason = "Empty or very short response";
    return result;
  }

  for (const pat of JS_CHALLENGE_PATTERNS) {
    if (pat.test(html)) {
      result.isChallenge = true;
      result.cloudflareProtected = true;
      result.reason = `Challenge pattern matched: ${pat.source}`;
      return result;
    }
  }

  const metaRefresh = /<meta[^>]+http-equiv=["']?refresh["']?[^>]+>/i.test(html);
  if (metaRefresh && html.length < 8000) {
    result.isChallenge = true;
    result.cloudflareProtected = true;
    result.reason = "Meta-refresh redirect on short page (Cloudflare interstitial pattern)";
    return result;
  }

  if (html.length < 20000) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const bodyText = (doc.body?.textContent || "").trim();
    if (html.length > 500 && bodyText.length < 50) {
      result.isChallenge = true;
      result.cloudflareProtected = true;
      result.reason = "Thin body content with large HTML (JS challenge signature)";
      return result;
    }
  }

  return result;
}

// Legacy compatibility wrapper
export function isJsChallengePage(html, httpStatus) {
  return detectCloudflareProtection(html, httpStatus).isChallenge;
}
