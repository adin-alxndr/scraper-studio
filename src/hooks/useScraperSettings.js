import { useState } from "react";

const STORAGE_KEY = "_scraper_settings";

// Inline DEFAULT_SETTINGS mirror — keeps the hook self-contained.
// The authoritative copy lives wherever DEFAULT_SETTINGS is defined in
// the main app; adjust the import path if you prefer to share it.
export const DEFAULT_SETTINGS = {
  pagination:         true,
  detectAPI:          true,
  detectGraphQL:      true,
  encodingFix:        true,
  infiniteScroll:     false,
  endlessButton:      false,
  lazyLoad:           true,
  shadowDOM:          false,
  csrfHandling:       false,
  cookieLogin:        false,
  persistentCookies:  false,
  attachmentDownload: false,
  formUploadDetect:   false,
  antibotMode:        false,
  cloudflareDetect:   false,
  aspShieldBypass:    false,
};

/**
 * useScraperSettings
 * Loads scraper settings from localStorage on mount and persists
 * changes automatically whenever onChange is called.
 *
 * Returns:
 *   scraperSettings    – current settings object
 *   setScraperSettings – setter (also persists to localStorage)
 */
export function useScraperSettings() {
  const [scraperSettings, setScraperSettingsRaw] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return { ...DEFAULT_SETTINGS, ...saved };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  });

  const setScraperSettings = (next) => {
    const resolved = typeof next === "function" ? next(scraperSettings) : next;
    setScraperSettingsRaw(resolved);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(resolved)); } catch {}
  };

  return { scraperSettings, setScraperSettings };
}
