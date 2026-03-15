import { Btn, Card, SectionLabel, CleanToggle, EmptyState } from "../components/ui/index.jsx";
import { CleanPreview } from "../components/CleanPreview";

export function CleanTab({ rawRes, res, cleaned, ops, setOps, doClean, resetRaw, setTab }) {
  return (
    <div className="page-scroll">
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Data Cleaning</h1>
            <p className="page-subtitle">Applied to raw data · original is always preserved · live preview updates as you select options</p>
          </div>
          <div className="page-actions">
            {rawRes.length > 0 && (
              <>
                <Btn variant="primary" onClick={doClean}>🧹 Apply Cleaning</Btn>
                {cleaned && <Btn variant="warn" onClick={resetRaw}>↺ Undo &amp; Reset</Btn>}
              </>
            )}
          </div>
        </div>

        {rawRes.length > 0 && (
          <div style={{ marginBottom: 16, padding: "10px 16px", background: cleaned ? "#fff3e0" : "#e8f5e9", border: `1px solid ${cleaned ? "#ffa726" : "#a5d6a7"}`, borderRadius: 8, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: cleaned ? "#e65100" : "#2e7d32", fontWeight: 700 }}>{cleaned ? "⚠ Data has been cleaned" : "✓ Raw data available"}</div>
              <div style={{ fontSize: 10, color: "#9e9e9e", marginTop: 2 }}>{rawRes.length} original rows · {res.length} displayed rows</div>
            </div>
            {cleaned && <Btn variant="warn" size="sm" onClick={resetRaw}>↺ Reset</Btn>}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 18, alignItems: "start" }}>
          <div>
            <div className="section-label" style={{ marginBottom: 10 }}>🧹 CLEANING</div>
            <Card style={{ marginBottom: 14 }}>
              {[["dedup","⊘","Remove Duplicates","Remove identical rows"],["trim","✂","Trim Whitespace","Remove extra spaces"],["strip","</>","Strip HTML Tags","Remove all HTML tags"]].map(([k,i,l,d]) => (
                <CleanToggle key={k} ico={i} lbl={l} desc={d} checked={ops[k]} onChange={v => setOps(o => ({...o,[k]:v}))} />
              ))}
            </Card>
            <div className="section-label" style={{ marginBottom: 10 }}>🔤 TEXT TRANSFORM</div>
            <Card style={{ marginBottom: 14 }}>
              {[["lower","Aa","Lowercase","All lowercase"],["upper","AA","Uppercase","All uppercase"],["cap","Abc","Capitalize","Capitalize each word"]].map(([k,i,l,d]) => (
                <CleanToggle key={k} ico={i} lbl={l} desc={d} checked={ops[k]} onChange={v => setOps(o => ({...o,[k]:v}))} />
              ))}
            </Card>
            <div className="section-label" style={{ marginBottom: 10 }}>📊 EXTRACT</div>
            <Card>
              {[["nums","#","Extract Numbers","Extract numbers only"],["urls_","🔗","Extract URLs","Extract URLs only"]].map(([k,i,l,d]) => (
                <CleanToggle key={k} ico={i} lbl={l} desc={d} checked={ops[k]} onChange={v => setOps(o => ({...o,[k]:v}))} />
              ))}
            </Card>
            {!rawRes.length && <div style={{ fontSize: 11, color: "#bbb", marginTop: 14 }}>Scrape data first to enable cleaning.</div>}
          </div>
          <div>
            {rawRes.length > 0
              ? <CleanPreview rawData={rawRes} ops={ops} />
              : <EmptyState icon="🧹" message="Scrape some data first to preview cleaning options." action={<Btn variant="primary" size="sm" onClick={() => setTab("scrape")}>⚡ Go Scrape</Btn>} />}
          </div>
        </div>
      </div>
    </div>
  );
}
