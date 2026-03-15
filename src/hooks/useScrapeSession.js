import { useState } from "react";

/**
 * useScrapeSession
 * Manages the "Scraper Studio" form state: URL input, pagination controls,
 * loading / progress / proxy-status indicators, and error log.
 *
 * Kept separate from useResults (which owns the output rows) and
 * usePageData (which owns the fetched DOM) so each concern is
 * independently testable and composable.
 *
 * Returns:
 *   urls / setUrls           – newline-separated URL textarea value
 *   pagOn / setPagOn         – pagination enabled flag
 *   pagS / setPagS           – pagination start page
 *   pagE / setPagE           – pagination end page
 *   pagT / setPagT           – pagination URL template  e.g. "{url}/page/{n}"
 *   loading / setLoad        – true while a scrape is in progress
 *   prog / setProg           – { cur, total, label, proxyName, collected }
 *   proxy / setProxy         – "idle" | "testing" | "ok" | "failed"
 *   errs / setErrs           – array of { url, error } from the last scrape
 *   pct                      – derived progress percentage (0-100)
 *   buildUrls                – () → expanded URL list respecting pagination
 */
export function useScrapeSession() {
  const [urls,   setUrls]   = useState("");
  const [pagOn,  setPagOn]  = useState(false);
  const [pagS,   setPagS]   = useState(1);
  const [pagE,   setPagE]   = useState(5);
  const [pagT,   setPagT]   = useState("{url}/page/{n}");
  const [loading, setLoad]  = useState(false);
  const [prog,   setProg]   = useState({ cur: 0, total: 0, label: "", proxyName: "", collected: 0 });
  const [proxy,  setProxy]  = useState("idle");
  const [errs,   setErrs]   = useState([]);

  const pct = prog.total ? Math.round((prog.cur / prog.total) * 100) : 0;

  const buildUrls = () => {
    const base = urls.split("\n").map((u) => u.trim()).filter(Boolean);
    if (!pagOn || pagS >= pagE) return base;
    const out = [];
    for (const u of base) {
      for (let n = pagS; n <= pagE; n++) {
        out.push(
          pagT
            .replace("{url}", u.replace(/\/$/, ""))
            .replace("{n}", String(n))
        );
      }
    }
    return out;
  };

  return {
    urls,   setUrls,
    pagOn,  setPagOn,
    pagS,   setPagS,
    pagE,   setPagE,
    pagT,   setPagT,
    loading, setLoad,
    prog,   setProg,
    proxy,  setProxy,
    errs,   setErrs,
    pct,
    buildUrls,
  };
}
