import { Btn, Card, EmptyState } from "../components/ui/index.jsx";
import { dlCSV, dlJSON } from "../utils/dataClean";

export function HistoryTab({ hist, clearHistory, removeEntry, loadRows, setTab, setHp, msg }) {
  return (
    <div className="page-scroll">
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">History</h1>
            <p className="page-subtitle">{hist.length} saved sessions</p>
          </div>
          {hist.length > 0 && (
            <Btn variant="danger" onClick={() => { clearHistory(); msg("History cleared."); }}>🗑 Clear All</Btn>
          )}
        </div>

        {!hist.length ? (
          <EmptyState icon="🕐" message="No history yet." />
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {hist.map(h => (
              <Card key={h.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 0 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "var(--text)", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>{h.urls.join(", ")}</div>
                  <div style={{ fontSize: 10, color: "#bbb" }}>{h.date} · <span style={{ color: "var(--accent)" }}>{h.rows} rows</span></div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <Btn variant="ghost" size="sm" onClick={() => setHp(h)}>👁</Btn>
                  <Btn variant="ghost" size="sm" onClick={() => { loadRows(h.data); setTab("result"); msg("Loaded!"); }}>Load</Btn>
                  <Btn variant="ghost" size="sm" onClick={() => dlCSV(h.data, `scrape_${h.id}.csv`)}>CSV</Btn>
                  <Btn variant="ghost" size="sm" onClick={() => dlJSON(h.data, `scrape_${h.id}.json`)}>JSON</Btn>
                  <Btn variant="danger" size="sm" onClick={() => { removeEntry(h.id); msg("Deleted."); }}>✕</Btn>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
