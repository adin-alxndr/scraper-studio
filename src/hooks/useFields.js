import { useState } from "react";

const DEFAULT_FIELDS = [
  { id: 1, name: "Title", sel: "" },
  { id: 2, name: "Link",  sel: "" },
];

/**
 * useFields
 * Manages the list of scrape field definitions (name + CSS selector pairs).
 *
 * Returns:
 *   fields       – current field array
 *   nextId       – next available field id
 *   addF         – () → appends a blank field
 *   remF         – (id) → removes field by id
 *   updF         – (id, key, value) → updates a single field property
 *   applyPreset  – (preset) → replaces all fields with preset.fields
 *   setFields    – raw state setter (for restore/load flows)
 */
export function useFields() {
  const [fields, setFields] = useState(DEFAULT_FIELDS);
  const [nextId, setNextId] = useState(3);

  const addF = () => {
    setFields((f) => [...f, { id: nextId, name: "", sel: "" }]);
    setNextId((n) => n + 1);
  };

  const remF = (id) => setFields((f) => f.filter((x) => x.id !== id));

  const updF = (id, k, v) =>
    setFields((f) => f.map((x) => (x.id === id ? { ...x, [k]: v } : x)));

  const applyPreset = (preset) => {
    const nf = preset.fields.map((f, i) => ({ id: nextId + i, ...f }));
    setFields(nf);
    setNextId((n) => n + nf.length);
  };

  return { fields, setFields, nextId, setNextId, addF, remF, updF, applyPreset };
}
