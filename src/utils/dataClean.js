// ─── Data cleaning operations ─────────────────────────────────────────────────
const dedup  = rs => { const s = new Set(); return rs.filter(r => { const k = JSON.stringify(r); return s.has(k) ? false : (s.add(k), true); }); };
const trimT  = rs => rs.map(r => Object.fromEntries(Object.entries(r).map(([k,v]) => [k, typeof v === "string" ? v.trim() : v])));
const stripH = rs => rs.map(r => Object.fromEntries(Object.entries(r).map(([k,v]) => [k, typeof v === "string" ? v.replace(/<[^>]*>/g, "") : v])));
const toLow  = rs => rs.map(r => Object.fromEntries(Object.entries(r).map(([k,v]) => [k, typeof v === "string" ? v.toLowerCase() : v])));
const toUp   = rs => rs.map(r => Object.fromEntries(Object.entries(r).map(([k,v]) => [k, typeof v === "string" ? v.toUpperCase() : v])));
const toCap  = rs => rs.map(r => Object.fromEntries(Object.entries(r).map(([k,v]) => [k, typeof v === "string" ? v.replace(/\b\w/g, c => c.toUpperCase()) : v])));
const exNums = rs => rs.map(r => Object.fromEntries(Object.entries(r).map(([k,v]) => [k, typeof v === "string" ? (v.match(/[\d.,]+/g) || []).join(" ") || v : v])));
const exUrls = rs => rs.map(r => Object.fromEntries(Object.entries(r).map(([k,v]) => [k, typeof v === "string" ? (v.match(/https?:\/\/[^\s]+/g) || [v]).join(" ") : v])));

export function applyCleaningOps(data, ops) {
  let d = [...data];
  if (ops.dedup)  d = dedup(d);
  if (ops.trim)   d = trimT(d);
  if (ops.strip)  d = stripH(d);
  if (ops.lower)  d = toLow(d);
  if (ops.upper)  d = toUp(d);
  if (ops.cap)    d = toCap(d);
  if (ops.nums)   d = exNums(d);
  if (ops.urls_)  d = exUrls(d);
  return d;
}

// ─── Download helpers ─────────────────────────────────────────────────────────
const dlBlob = (b, n) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(b);
  a.download = n;
  a.click();
};

export const dlCSV = (rows, n = "data.csv") => {
  if (!rows.length) return;
  const h = Object.keys(rows[0]);
  dlBlob(new Blob([[h.join(","), ...rows.map(r => h.map(k => `"${String(r[k]||"").replace(/"/g,'""')}"`).join(","))].join("\n")], { type: "text/csv" }), n);
};

export const dlJSON = (rows, n = "data.json") =>
  dlBlob(new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" }), n);

export const dlXLS = (rows, n = "data.xls") => {
  if (!rows.length) return;
  const h = Object.keys(rows[0]);
  dlBlob(new Blob([`<table><tr>${h.map(k => `<th>${k}</th>`).join("")}</tr>${rows.map(r => `<tr>${h.map(k => `<td>${r[k]||""}</td>`).join("")}</tr>`).join("")}</table>`], { type: "application/vnd.ms-excel" }), n);
};
