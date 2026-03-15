import { useState } from "react";
import "./app.css";

import { useToast }           from "./hooks/useToast";
import { useHistory }         from "./hooks/useHistory";
import { useFields }          from "./hooks/useFields";
import { usePageData }        from "./hooks/usePageData";
import { useResults }         from "./hooks/useResults";
import { useScraperSettings } from "./hooks/useScraperSettings";
import { useScrapeSession }   from "./hooks/useScrapeSession";
import { useScraperActions }  from "./hooks/useScraperActions";

import { Toast }              from "./components/ui/index.jsx";
import { Sidebar }            from "./components/Sidebar";
import { FieldPickerModal }   from "./components/FieldPickerModal";
import { SelectorTestPanel }  from "./components/SelectorTestPanel";
import { HistoryModal }       from "./components/HistoryModal";
import { AntiBotReportModal } from "./components/AntiBotReportModal";
import { SettingsPage }       from "./components/SettingsPage";

import { ScrapeTab }  from "./tabs/ScrapeTab";
import { ResultTab }  from "./tabs/ResultTab";
import { CleanTab }   from "./tabs/CleanTab";
import { ExportTab }  from "./tabs/ExportTab";
import { ImagesTab }  from "./tabs/ImagesTab";
import { HistoryTab } from "./tabs/HistoryTab";

import { generateAntiBotReport } from "./utils/antiBot";

export default function App() {
  const [tab, setTab]             = useState("scrape");
  const [sub, setSub]             = useState("setup");
  const [manualApi, setManualApi] = useState("");
  const [pasteHtml, setPasteHtml] = useState("");
  const [testSel, setTestSel]     = useState(null);
  const [fps, setFps]             = useState(null);
  const [hp, setHp]               = useState(null);
  const [imgFilter, setImgFilter] = useState("");
  const [imgView, setImgView]     = useState("grid");
  const [antiBotReport, setAntiBotReport] = useState(null);

  const { toast, msg, dismiss: dismissToast }                       = useToast();
  const { hist, addEntry, removeEntry, clearAll: clearHistory }     = useHistory();
  const { fields, setFields, nextId, setNextId, addF, remF, updF, applyPreset } = useFields();
  const { scraperSettings, setScraperSettings }                     = useScraperSettings();
  const {
    urls, setUrls, pagOn, setPagOn, pagS, setPagS, pagE, setPagE,
    pagT, setPagT, loading, setLoad, prog, setProg,
    proxy, setProxy, errs, setErrs, pct, buildUrls,
  } = useScrapeSession();
  const {
    doc, setDoc, docBase, setDocBase, rawHtml, setRawHtml,
    jsChallenge, setJsChallenge, jsChallengeUrl, setJsChallengeUrl,
    links, setLinks, images, setImages,
    tableInfo, setTableInfo, apiEndpoints, setApiEndpoints,
    graphqlEndpoints, setGraphqlEndpoints, attachments, setAttachments,
    apiData, setApiData, apiLoading, setApiLoading,
    resetPageData,
  } = usePageData();
  const {
    rawRes, setRawRes, res, setRes, cleaned, setCleaned,
    ops, setOps, hidCols, setHidCols, renCols, setRenCols,
    editCell, setEC, editVal, setEV,
    headers, doClean, resetRaw, loadRows,
  } = useResults(msg);

  const {
    autoFillFromTable, tryFetchApi, importApiData,
    loadPastedHtml, testLoad, runScrape,
  } = useScraperActions({
    urls, buildUrls, scraperSettings,
    setLoad, setProxy, setProg,
    setRes, setRawRes, setCleaned, setErrs,
    doc, docBase, links, pasteHtml,
    setDoc, setDocBase, setRawHtml, setLinks, setImages,
    setJsChallenge, setJsChallengeUrl,
    setTableInfo, setApiEndpoints, setGraphqlEndpoints,
    setAttachments, setApiData, setApiLoading,
    resetPageData,
    fields, nextId, setFields, setNextId,
    loadRows, addEntry,
    apiData, manualApi,
    setSub, setTab,
    msg,
  });

  const nav = [
    {id:"scrape",   icon:"⚡", label:"Scraper Studio"},
    {id:"result",   icon:"📊", label:"Preview Data",  badge:res.length||null},
    {id:"clean",    icon:"🧹", label:"Cleaning"},
    {id:"export",   icon:"📦", label:"Export"},
    {id:"images",   icon:"🖼", label:"Images",         badge:images.length||null},
    {id:"history",  icon:"🕐", label:"History",        badge:hist.length||null},
    {id:"settings", icon:"⚙️", label:"Settings"},
  ];

  return (
    <div className="app-root">
      <Sidebar tab={tab} setTab={setTab} nav={nav} proxy={proxy}
        hist={hist} res={res} cleaned={cleaned} errs={errs} />

      <main className="main">
        {tab === "scrape" && (
          <ScrapeTab
            sub={sub} setSub={setSub}
            testLoad={testLoad} runScrape={runScrape} loadPastedHtml={loadPastedHtml}
            urls={urls} setUrls={setUrls}
            pagOn={pagOn} setPagOn={setPagOn} pagS={pagS} setPagS={setPagS}
            pagE={pagE} setPagE={setPagE} pagT={pagT} setPagT={setPagT}
            loading={loading} prog={prog} pct={pct} proxy={proxy}
            doc={doc} docBase={docBase} rawHtml={rawHtml}
            jsChallenge={jsChallenge} jsChallengeUrl={jsChallengeUrl} setJsChallenge={setJsChallenge}
            tableInfo={tableInfo} apiEndpoints={apiEndpoints} graphqlEndpoints={graphqlEndpoints}
            attachments={attachments} apiData={apiData} apiLoading={apiLoading}
            manualApi={manualApi} setManualApi={setManualApi}
            pasteHtml={pasteHtml} setPasteHtml={setPasteHtml}
            fields={fields} nextId={nextId} setFields={setFields} setNextId={setNextId}
            addF={addF} remF={remF} updF={updF} applyPreset={applyPreset}
            scraperSettings={scraperSettings}
            autoFillFromTable={autoFillFromTable}
            tryFetchApi={tryFetchApi} importApiData={importApiData}
            setFps={setFps} setTestSel={setTestSel}
            msg={msg}
          />
        )}
        {tab === "result" && (
          <ResultTab
            res={res} rawRes={rawRes} cleaned={cleaned} headers={headers} errs={errs}
            hidCols={hidCols} setHidCols={setHidCols} renCols={renCols} setRenCols={setRenCols}
            editCell={editCell} setEC={setEC} editVal={editVal} setEV={setEV} setRes={setRes}
            setTab={setTab} resetRaw={resetRaw} doClean={doClean} msg={msg}
          />
        )}
        {tab === "clean" && (
          <CleanTab rawRes={rawRes} res={res} cleaned={cleaned}
            ops={ops} setOps={setOps} doClean={doClean} resetRaw={resetRaw} setTab={setTab} />
        )}
        {tab === "export" && (
          <ExportTab res={res} rawRes={rawRes} cleaned={cleaned}
            links={links} images={images} setTab={setTab} msg={msg} />
        )}
        {tab === "images" && (
          <ImagesTab images={images} docBase={docBase}
            imgFilter={imgFilter} setImgFilter={setImgFilter}
            imgView={imgView} setImgView={setImgView}
            setTab={setTab} msg={msg} />
        )}
        {tab === "history" && (
          <HistoryTab hist={hist} clearHistory={clearHistory} removeEntry={removeEntry}
            loadRows={loadRows} setTab={setTab} setHp={setHp} msg={msg} />
        )}
        {tab === "settings" && (
          <SettingsPage settings={scraperSettings} onChange={setScraperSettings}
            onAntiBotReport={() => setAntiBotReport(generateAntiBotReport())} />
        )}
      </main>

      {fps && (
        <FieldPickerModal selector={fps} fields={fields}
          onSelect={fid => {
            if (typeof fid === "string" && fid.startsWith("__new__")) {
              const nama = fid.includes(":") ? fid.slice(8).trim() || "New Field" : "New Field";
              const nid = nextId; setFields(f => [...f, {id:nid,name:nama,sel:fps}]); setNextId(n => n+1); msg(`Field "${nama}" created!`);
            } else { updF(fid,"sel",fps); msg(`→ "${fields.find(f=>f.id===fid)?.name||"field"}" filled!`); }
            setFps(null);
          }}
          onCopy={() => { navigator.clipboard.writeText(fps); msg("Copied!"); }}
          onClose={() => setFps(null)}
        />
      )}
      {testSel && <SelectorTestPanel doc={doc} baseUrl={docBase} selector={testSel} onClose={() => setTestSel(null)} />}
      {hp && <HistoryModal entry={hp} onLoad={() => { loadRows(hp.data); setTab("result"); setHp(null); msg("Loaded!"); }} onClose={() => setHp(null)} />}
      {antiBotReport && <AntiBotReportModal report={antiBotReport} onClose={() => setAntiBotReport(null)} />}
      {toast && <Toast msg={toast.m} type={toast.t} onClose={dismissToast} />}
    </div>
  );
}