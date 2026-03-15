import { useState } from "react";
import { DEFAULT_SETTINGS } from "../utils/settings";

const STORAGE_KEY = "_scraper_settings";

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
