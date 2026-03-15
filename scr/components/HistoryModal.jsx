import { Btn } from "./ui/index.jsx";

export function HistoryModal({ entry, onLoad, onClose }) {
  const headers = entry.data.length ? Object.keys(entry.data[0]) : [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: "75vw", maxHeight: "80vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 800, color: "#333", fontSize: 15 }}>{entry.urls.join(", ").slice(0, 60)}</div>
            <div style={{ fontSize: 10, color: "#9e9e9e", marginTop: 2 }}>{entry.date} · {entry.rows} rows</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="primary" onClick={onLoad}>Load</Btn>
            <Btn variant="ghost" size="sm" onClick={onClose}>✕</Btn>
          </div>
        </div>
        <div style={{ overflow: "auto", flex: 1 }}>
          <table>
            <thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {entry.data.slice(0, 50).map((row, i) => (
                <tr key={i}>{headers.map((h, j) => <td key={j} style={{ maxWidth: 200 }}>{String(row[h] || "")}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}