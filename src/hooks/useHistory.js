import { useState } from "react";

const STORAGE_KEY = "_scrh";
const MAX_HISTORY = 50;

/**
 * useHistory
 * Manages scrape-session history with localStorage persistence.
 *
 * Returns:
 *   hist       – array of history entries
 *   addEntry   – (entry) → prepends entry, persists to localStorage
 *   removeEntry– (id)    → removes entry by id, persists
 *   clearAll   – ()      → wipes all history and localStorage key
 *   setHist    – raw state setter (for restore/load flows)
 */
export function useHistory() {
  const [hist, setHist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  });

  const persist = (next) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const addEntry = (entry) => {
    setHist((h) => {
      const next = [entry, ...h].slice(0, MAX_HISTORY);
      persist(next);
      return next;
    });
  };

  const removeEntry = (id) => {
    setHist((h) => {
      const next = h.filter((x) => x.id !== id);
      persist(next);
      return next;
    });
  };

  const clearAll = () => {
    setHist([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  return { hist, setHist, addEntry, removeEntry, clearAll };
}
