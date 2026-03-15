import { useMemo } from "react";
import { applyCleaningOps } from "../utils/dataClean";

export function CleanPreview({ rawData, ops }) {
  const previewData = useMemo(() => {
    if (!rawData.length) return [];
    return applyCleaningOps(rawData, ops);
  }, [rawData, ops]);

  const activeOps   = useMemo(() => Object.entries(ops).filter(([, v]) => v).map(([k]) => k), [ops]);
  const removedRows = rawData.length - previewData.length;
  const headers     = rawData.length ? Object.keys(rawData[0]) : [];
  const PREVIEW_ROWS = 5;

  if (!rawData.length) return null;

  function highlightDiff(original, cleaned) {
    if (original === cleaned) return <span style={{ color: "#333" }}>{original || <span style={{ color: "#ccc" }}>—</span>}</span>;
    return (
      <span>
        <span style={{ color: "#c62828", textDecoration: "line-through", fontSize: 10, marginRight: 4, opacity: 0.7 }}>{String(original).slice(0, 40)}</span>
        <span style={{ color: "#2e7d32", fontWeight: 600 }}>{String(cleaned).slice(0, 60)}</span>
      </span>
    );
  }

  return (
    <div className="clean-preview-panel">
      <div className="clean-preview-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, color: "#1565c0", fontSize: 13 }}>👁 Live Preview</span>
          {activeOps.length === 0 ? (
            <span className="preview-badge preview-badge-count">No ops selected</span>
          ) : (
            activeOps.map(op => <span key={op} className="op-chip">{op}</span>)
          )}
          {removedRows > 0 && <span className="preview-badge" style={{ background: "#ffebee", color: "#c62828", border: "1px solid #ef9a9a" }}>−{removedRows} rows removed</span>}
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#9e9e9e" }}>{rawData.length} → {previewData.length} rows</span>
        </div>
      </div>

      <div className="clean-preview-body">
        {activeOps.length === 0 ? (
          <div className="clean-preview-empty">Select cleaning options above to see a live preview of changes</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ fontSize: 11 }}>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  {headers.slice(0, 4).map(h => (
                    <th key={h}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span>{h}</span>
                        <div style={{ display: "flex", gap: 4 }}>
                          <span style={{ fontSize: 9, color: "#c62828", fontWeight: 400 }}>original</span>
                          <span style={{ fontSize: 9, color: "#2e7d32", fontWeight: 400 }}>→ cleaned</span>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rawData.slice(0, PREVIEW_ROWS).map((row, i) => {
                  const cleanedRow = previewData[i];
                  const isRemoved  = !cleanedRow;
                  return (
                    <tr key={i} style={{ opacity: isRemoved ? 0.4 : 1, background: isRemoved ? "#fff3f3" : undefined }}>
                      <td style={{ color: "#bbb", textAlign: "center" }}>
                        {isRemoved ? <span title="Row removed by dedup">🗑</span> : i + 1}
                      </td>
                      {headers.slice(0, 4).map(h => (
                        <td key={h} style={{ maxWidth: 180 }}>
                          {isRemoved
                            ? <span style={{ color: "#bbb", fontSize: 10 }}>removed</span>
                            : highlightDiff(String(row[h] ?? ""), String(cleanedRow[h] ?? ""))}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rawData.length > PREVIEW_ROWS && (
              <div style={{ padding: "6px 14px", fontSize: 10, color: "#9e9e9e", borderTop: "1px solid var(--border-light)" }}>
                Showing first {PREVIEW_ROWS} of {rawData.length} rows
              </div>
            )}
          </div>
        )}
      </div>

      <div className="clean-preview-legend">
        <span style={{ fontSize: 10, color: "#9e9e9e" }}>
          <span style={{ color: "#c62828" }}>~~strikethrough~~</span> = original value &nbsp;·&nbsp;
          <span style={{ color: "#2e7d32", fontWeight: 600 }}>green</span> = cleaned value &nbsp;·&nbsp;
          unchanged cells shown normally
        </span>
      </div>
    </div>
  );
}
