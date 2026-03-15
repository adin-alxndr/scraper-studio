import { Btn, Card, EmptyState } from "../components/ui/index.jsx";
import { dlCSV, dlJSON } from "../utils/dataClean";

export function ImagesTab({ images, docBase, imgFilter, setImgFilter, imgView, setImgView, setTab, msg }) {
  const filtered = images.filter(i => !imgFilter || (i.src+i.alt).toLowerCase().includes(imgFilter.toLowerCase()));

  return (
    <div className="page-scroll">
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Images</h1>
            <p className="page-subtitle">{images.length} images found{docBase && <span> from <span style={{ color: "var(--accent)" }}>{docBase}</span></span>}</p>
          </div>
          {images.length > 0 && (
            <div className="page-actions">
              <Btn variant="ghost" onClick={() => setImgView(v => v === "grid" ? "list" : "grid")}>{imgView === "grid" ? "☰ List" : "⊞ Grid"}</Btn>
              <Btn variant="ghost" onClick={() => dlJSON(images.map(i => ({src:i.src,alt:i.alt})),"images.json")}>📋 JSON</Btn>
              <Btn variant="ghost" onClick={() => dlCSV(images.map(i => ({src:i.src,alt:i.alt})),"images.csv")}>📊 CSV</Btn>
              <Btn variant="ghost" onClick={() => { navigator.clipboard.writeText(images.map(i => i.src).join("\n")); msg(`${images.length} URLs copied!`); }}>📋 Copy All</Btn>
            </div>
          )}
        </div>

        {images.length > 0 && (
          <div style={{ marginBottom: 14, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input className="inp" placeholder="🔍 Filter images (URL or alt text)…" value={imgFilter} onChange={e => setImgFilter(e.target.value)} style={{ maxWidth: 360 }} />
            <span style={{ fontSize: 11, color: "#bbb" }}>{filtered.length} of {images.length}</span>
          </div>
        )}

        {!images.length ? (
          <EmptyState icon="🖼" message="No images yet. Scrape a page first!" action={<Btn variant="primary" onClick={() => setTab("scrape")}>⚡ Start Scraping</Btn>} />
        ) : imgView === "grid" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12 }}>
            {filtered.map((img, idx) => (
              <div key={idx} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 1px 4px rgba(0,0,0,.05)", transition: "border-color .12s" }}
                onMouseOver={e => e.currentTarget.style.borderColor = "var(--accent-mid)"}
                onMouseOut={e => e.currentTarget.style.borderColor = "var(--border)"}>
                <div style={{ height: 130, background: "#f5f7fa", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  <img src={img.src} alt={img.alt||""} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }} onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }} />
                  <div style={{ display: "none", position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", color: "#bbb", fontSize: 10, flexDirection: "column", gap: 4 }}><span style={{ fontSize: 24 }}>🚫</span><span>Failed</span></div>
                </div>
                <div style={{ padding: "8px 10px", flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                  {img.alt && <div style={{ fontSize: 10, color: "var(--text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{img.alt}</div>}
                  <div style={{ fontSize: 9, color: "#bbb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace" }}>{img.src.replace(/^https?:\/\//,"")}</div>
                  <div style={{ display: "flex", gap: 5, marginTop: "auto" }}>
                    <Btn variant="ghost" size="xs" style={{ flex: 1 }} onClick={() => { navigator.clipboard.writeText(img.src); msg("URL copied!"); }}>Copy URL</Btn>
                    <a href={img.src} target="_blank" rel="noreferrer" style={{ flex: 1 }}><Btn variant="ghost" size="xs" style={{ width: "100%" }}>Open ↗</Btn></a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <table>
              <thead><tr><th style={{ width: 60 }}>PREVIEW</th><th>#</th><th>URL</th><th>ALT TEXT</th><th></th></tr></thead>
              <tbody>{filtered.map((img, idx) => (
                <tr key={idx}>
                  <td style={{ padding: "4px 8px" }}>
                    <img src={img.src} alt={img.alt||""} style={{ width: 48, height: 36, objectFit: "cover", borderRadius: 4, background: "#f5f7fa" }} onError={e => { e.target.style.opacity="0.2"; }} />
                  </td>
                  <td style={{ color: "#bbb", width: 36 }}>{idx + 1}</td>
                  <td style={{ maxWidth: 300 }}><a href={img.src} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", textDecoration: "none", fontFamily: "monospace", fontSize: 11 }}>{img.src.length>60?img.src.slice(0,60)+"…":img.src}</a></td>
                  <td style={{ color: "#9e9e9e", fontSize: 11 }}>{img.alt||<span style={{ color: "#bbb" }}>—</span>}</td>
                  <td><Btn variant="ghost" size="xs" onClick={() => { navigator.clipboard.writeText(img.src); msg("URL copied!"); }}>Copy</Btn></td>
                </tr>
              ))}</tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
