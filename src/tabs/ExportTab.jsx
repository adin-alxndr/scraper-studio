import { useState } from "react";
import { Btn, Card, EmptyState } from "../components/ui/index.jsx";
import { dlCSV, dlJSON, dlXLS } from "../utils/dataClean";

export function ExportTab({ res, rawRes, cleaned, links, images, setTab, msg }) {
  const [lf, setLf] = useState("");

  return (
    <div className="page-scroll">
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Export</h1>
            <p className="page-subtitle">{res.length} rows {cleaned ? "(cleaned)" : ""}</p>
          </div>
        </div>

        <div className="export-grid">
          {[
            {i:"📊",l:"CSV",       d:"For spreadsheets",  fn:()=>dlCSV(res),                                                    dis:!res.length},
            {i:"📋",l:"JSON",      d:"For developers",    fn:()=>dlJSON(res),                                                   dis:!res.length},
            {i:"📗",l:"Excel",     d:"Microsoft Excel",   fn:()=>dlXLS(res),                                                    dis:!res.length},
            {i:"🔗",l:"Links JSON",d:"All page links",    fn:()=>dlJSON(links,"links.json"),                                    dis:!links.length},
            {i:"🖼",l:"Imgs JSON", d:"All page images",   fn:()=>dlJSON(images.map(i=>({src:i.src,alt:i.alt})),"images.json"), dis:!images.length},
            {i:"📄",l:"Imgs CSV",  d:"Image URLs + alt",  fn:()=>dlCSV(images.map(i=>({src:i.src,alt:i.alt})),"images.csv"),  dis:!images.length},
          ].map(e => (
            <button key={e.l} className="export-btn" onClick={e.fn} disabled={e.dis}>
              <div className="export-btn-icon">{e.i}</div>
              <div className="export-btn-label">{e.l}</div>
              <div className="export-btn-desc">{e.d}</div>
            </button>
          ))}
        </div>

        {cleaned && rawRes.length > 0 && (
          <Card>
            <div className="section-label">📦 EXPORT RAW DATA</div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="ghost" size="sm" onClick={() => dlCSV(rawRes, "raw.csv")}>Raw CSV</Btn>
              <Btn variant="ghost" size="sm" onClick={() => dlJSON(rawRes, "raw.json")}>Raw JSON</Btn>
            </div>
          </Card>
        )}

        {links.length > 0 && (
          <>
            <div className="section-label" style={{ margin: "20px 0 10px" }}>🔗 LINKS ({links.length})</div>
            <input className="inp" placeholder="Filter links…" value={lf} onChange={e => setLf(e.target.value)} style={{ maxWidth: 360, marginBottom: 10 }} />
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <table>
                <thead><tr><th>#</th><th>TEXT</th><th>URL</th><th></th></tr></thead>
                <tbody>{links.filter(l => !lf || l.text.toLowerCase().includes(lf.toLowerCase()) || l.href.toLowerCase().includes(lf.toLowerCase())).map((l, i) => (
                  <tr key={i}>
                    <td style={{ color: "#bbb", width: 36 }}>{i + 1}</td>
                    <td>{l.text||"—"}</td>
                    <td><a href={l.href} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", textDecoration: "none" }}>{l.href}</a></td>
                    <td><Btn variant="ghost" size="xs" onClick={() => { navigator.clipboard.writeText(l.href); msg("Copied!"); }}>Copy</Btn></td>
                  </tr>
                ))}</tbody>
              </table>
            </Card>
          </>
        )}

        {!res.length && !links.length && !images.length && (
          <EmptyState icon="📦" message="No data yet." action={<Btn variant="primary" onClick={() => setTab("scrape")}>⚡ Start</Btn>} />
        )}
      </div>
    </div>
  );
}
