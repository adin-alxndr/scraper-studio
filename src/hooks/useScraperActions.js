import { fetchWithFallback, fetchJsonViaProxy } from "../utils/proxies";
import { detectTables, flattenJsonToRows, extractByCss } from "../utils/domExtract";
import { extractShadowContent, } from "../utils/domExtract";
import { detectAttachmentLinks } from "../utils/domDetect";
import { sniffApiEndpoints } from "../utils/apiSniff";

/**
 * useScraperActions
 * Returns all imperative action functions that orchestrate scraping,
 * loading, and data import. Receives state setters/values from parent hooks.
 */
export function useScraperActions({
  // scrape session
  urls, buildUrls, scraperSettings,
  setLoad, setProxy, setProg,
  setRes, setRawRes, setCleaned, setErrs,
  // page data
  doc, docBase, links, pasteHtml,
  setDoc, setDocBase, setRawHtml, setLinks, setImages,
  setJsChallenge, setJsChallengeUrl,
  setTableInfo, setApiEndpoints, setGraphqlEndpoints,
  setAttachments, setApiData, setApiLoading,
  resetPageData,
  // fields
  fields, nextId, setFields, setNextId,
  // results
  loadRows,
  // history
  addEntry,
  // api
  apiData, manualApi,
  // nav
  setSub, setTab,
  // toast
  msg,
}) {

  function autoFillFromTable(tbl) {
    if (!tbl || !tbl.headers.length) return;
    const newFields = tbl.headers.map((h, i) => ({
      id: nextId + i, name: h,
      sel: `${tbl.sel} tr td:nth-child(${i + 1})`,
    }));
    setFields(newFields);
    setNextId(n => n + newFields.length);
    msg(`✓ ${newFields.length} fields auto-filled from table!`);
  }

  async function tryFetchApi(endpointUrl) {
    setApiLoading(true); setApiData(null);
    try {
      const json = await fetchJsonViaProxy(endpointUrl);
      if (!json) { msg("Failed to fetch data from this endpoint.", "error"); setApiLoading(false); return; }
      const rows = flattenJsonToRows(json);
      if (!rows.length) { msg("Endpoint found but no table data inside.", "error"); setApiLoading(false); return; }
      setApiData({ url: endpointUrl, rows, total: rows.length });
      msg(`✓ ${rows.length} rows loaded from API!`);
    } catch(e) { msg("Error: " + e.message, "error"); }
    setApiLoading(false);
  }

  function importApiData() {
    if (!apiData?.rows?.length) return;
    loadRows(apiData.rows);
    addEntry({ id: Date.now(), urls: [apiData.url], date: new Date().toLocaleString("en-US"), rows: apiData.rows.length, data: apiData.rows });
    msg(`✓ ${apiData.rows.length} rows imported!`);
    setTab("result");
  }

  function loadPastedHtml() {
    const html = pasteHtml.trim();
    if (!html || html.length < 20) { msg("Please paste HTML first!", "error"); return; }
    const baseUrl = urls.trim().split("\n")[0].trim() || "https://example.com";
    const parser = new DOMParser();
    const d = parser.parseFromString(html, "text/html");
    d.querySelectorAll("a[href]").forEach(a => { const h = a.getAttribute("href"); if (h) { try { a.setAttribute("href", new URL(h, baseUrl).href); } catch {} } });
    d.querySelectorAll("img[src]").forEach(img => { const s = img.getAttribute("src"); if (s) { try { img.setAttribute("src", new URL(s, baseUrl).href); } catch {} } });
    const lnks = [...d.querySelectorAll("a[href]")].slice(0,100).map(a=>({text:a.textContent.trim().replace(/\s+/g," ").slice(0,120),href:a.getAttribute("href")||""})).filter(l=>/^https?:\/\//i.test(l.href));
    const imgs = [...d.querySelectorAll("img[src]")].slice(0,60).map(img=>({src:img.getAttribute("src")||"",alt:img.getAttribute("alt")||""})).filter(i=>/^https?:\/\//i.test(i.src));
    setDoc(d); setDocBase(baseUrl); setRawHtml(html); setLinks(lnks); setImages(imgs);
    setTableInfo(detectTables(d)); setJsChallenge(false); setProxy("ok");
    msg(`✓ HTML loaded! ${(html.length/1024).toFixed(0)} KB · ${d.querySelectorAll("*").length} elements`);
    setSub("picker");
  }

  async function testLoad() {
    const list = buildUrls().slice(0, 1);
    if (!list.length) { msg("Enter at least 1 URL!", "error"); return; }
    setProxy("testing"); setJsChallenge(false);
    try {
      const d = await fetchWithFallback(list[0], scraperSettings);
      if (d.jsChallenge) {
        setProxy("failed");
        setJsChallenge(true); setJsChallengeUrl(list[0]); setSub("picker");
        const reason = d.cfReason ? ` (${d.cfReason})` : "";
        msg(`Cloudflare / JS challenge detected${reason}`, "error");
        return;
      }
      setDoc(d.doc); setDocBase(list[0]); setLinks(d.links); setImages(d.images||[]); setRawHtml(d.rawHtml);
      if (d.attachments?.length) setAttachments(d.attachments);
      const tables = detectTables(d.doc);
      setTableInfo(tables);
      let sniffed = { apiEndpoints: [], graphqlEndpoints: [] };
      try { sniffed = await sniffApiEndpoints(d.rawHtml, list[0], scraperSettings); } catch {}
      setApiEndpoints(sniffed.apiEndpoints);
      setGraphqlEndpoints(sniffed.graphqlEndpoints);
      setApiData(null);
      setProxy("ok");
      const extras = [
        tables.length > 0                         ? `${tables.length} table(s)` : "",
        sniffed.apiEndpoints.length               ? `${sniffed.apiEndpoints.length} API endpoint(s)` : "",
        sniffed.graphqlEndpoints.length           ? `${sniffed.graphqlEndpoints.length} GraphQL` : "",
        d.attachments?.length                     ? `${d.attachments.length} attachment(s)` : "",
        d.csrfToken                               ? "CSRF token" : "",
        d.aspTokens?.viewState                    ? "ASP.NET tokens" : "",
        d.infiniteScrollInfo?.detected            ? `Infinite scroll (${d.infiniteScrollInfo.confidence}% confidence)` : "",
        d.loadMoreButtons?.length                 ? `${d.loadMoreButtons.length} load-more button(s)` : "",
      ].filter(Boolean).join(" · ");
      msg(`✓ ${d.proxyName} · ${(d.rawHtml.length/1024).toFixed(0)} KB${extras ? " · " + extras : ""}`);
      setSub("picker");
    } catch(e) {
      setProxy("failed");
      const m = e.message || "";
      if (m.startsWith("JS_CHALLENGE:")) {
        setJsChallenge(true); setJsChallengeUrl(m.replace("JS_CHALLENGE:", "")); setSub("picker");
        msg("This site blocks bot access (Cloudflare/JS challenge)", "error");
      } else { msg("Failed: " + m, "error"); }
    }
  }

  async function runScrape() {
    const list = buildUrls();
    if (!list.length) { msg("Enter at least 1 URL!", "error"); return; }
    const af = fields.filter(f => f.name.trim() && f.sel.trim());
    const s = scraperSettings;

    // ── Paste mode ──
    const isPasteMode = pasteHtml.trim().length >= 20 && doc !== null;
    if (isPasteMode) {
      const baseUrl = docBase || "https://example.com";
      const rows = [], errList = [];
      setLoad(true); setProxy("ok");
      setProg({cur:1,total:1,label:"(pasted HTML)",proxyName:"paste-html",collected:0});
      setRes([]); setRawRes([]); setCleaned(false); setErrs([]);
      if (af.length) {
        const ext = af.map(f => ({name:f.name, values:extractByCss(doc, baseUrl, f.sel)}));
        const rc = Math.max(...ext.map(f => f.values.length), 0);
        if (rc === 0) { rows.push({"#URL":baseUrl,"#Status":"No data"}); }
        else { for (let r = 0; r < rc; r++) { const row = {"#URL":baseUrl}; ext.forEach(f => {row[f.name]=f.values[r]||""}); rows.push(row); } }
      } else { rows.push({"#URL":baseUrl,"#Title":doc.querySelector("title")?.textContent?.trim()||"(pasted)","#Links":links.length}); }
      if (s.shadowDOM) {
        const sdContent = extractShadowContent(doc);
        if (sdContent.length) rows.push({"#URL":baseUrl,"#ShadowDOM_Items":sdContent.length,"#ShadowDOM_Preview":sdContent.slice(0,3).map(x=>x.text||x.href).join(" | ")});
      }
      if (s.attachmentDownload) {
        const att = detectAttachmentLinks(doc, baseUrl);
        att.forEach(a => rows.push({"#URL":baseUrl,"#Attachment":a.href,"#Attachment_Text":a.text}));
      }
      setProg(p => ({...p, collected:rows.length}));
      loadRows([...rows]);
      setErrs(errList);
      addEntry({id:Date.now(),urls:["(pasted HTML)"],date:new Date().toLocaleString("en-US"),rows:rows.length,data:rows});
      setLoad(false);
      msg(`Done! ${rows.length} rows from pasted HTML`);
      setTab("result");
      return;
    }

    // ── Normal mode ──
    setLoad(true); setProxy("testing");
    setProg({cur:0,total:list.length,label:"",proxyName:"",collected:0});
    setRes([]); setRawRes([]); setCleaned(false); setErrs([]);
    resetPageData();

    const rows = [], errList = [];
    const urlQueue = [...list];
    const visitedUrls = new Set();
    let queueIdx = 0;
    let isFirstPage = true;

    while (queueIdx < urlQueue.length) {
      const url = urlQueue[queueIdx++];
      if (visitedUrls.has(url)) continue;
      visitedUrls.add(url);
      setProg(p => ({...p, cur: queueIdx, total: urlQueue.length, label: url}));

      try {
        const d = await fetchWithFallback(url, s);
        setProxy("ok"); setProg(p => ({...p, proxyName: d.proxyName}));

        if (isFirstPage) {
          isFirstPage = false;
          setLinks(d.links||[]); setImages(d.images||[]);
          setDoc(d.doc); setDocBase(url); setRawHtml(d.rawHtml||"");
          if (d.attachments?.length) setAttachments(d.attachments);
          if (s.detectAPI || s.detectGraphQL) {
            try {
              const sniffed = await sniffApiEndpoints(d.rawHtml, url, s);
              setApiEndpoints(sniffed.apiEndpoints);
              setGraphqlEndpoints(sniffed.graphqlEndpoints);
            } catch {}
          }
        }

        if (d.jsChallenge) {
          rows.push({"#URL":url,"#Error":"Cloudflare / JS challenge detected","#Info":"Enable Cloudflare Detection in Settings for details"});
          errList.push({url, error:"Cloudflare challenge"});
          continue;
        }

        if (af.length && d.doc) {
          const ext = af.map(f => ({name:f.name, values:extractByCss(d.doc, url, f.sel)}));
          const rc = Math.max(...ext.map(f => f.values.length), 0);
          if (rc === 0) { rows.push({"#URL":url,"#Status":"No data","#Title":d.title}); }
          else { for (let r = 0; r < rc; r++) { const row = {"#URL":url}; ext.forEach(f => { row[f.name] = f.values[r] || ""; }); rows.push(row); } }
        } else { rows.push({"#URL":url,"#Title":d.title,"#Links":d.links.length}); }

        if (s.shadowDOM && d.shadowContent?.length)
          d.shadowContent.forEach(sc => rows.push({"#URL":url,"#ShadowDOM_Type":sc.type,"#ShadowDOM_Content":sc.text||sc.href||""}));

        if (s.attachmentDownload && d.attachments?.length)
          d.attachments.forEach(att => rows.push({"#URL":url,"#Attachment_URL":att.href,"#Attachment_Label":att.text,"#Attachment_Type":(att.type||"").toUpperCase(),"#Attachment_Source":att.source||"href-extension"}));

        if (s.formUploadDetect && d.uploadForms?.length)
          d.uploadForms.forEach(form => rows.push({"#URL":url,"#UploadForm_Action":form.action,"#UploadForm_Method":form.method,"#UploadForm_Fields":form.fields.map(f=>f.name).join(",")}));

        if (s.csrfHandling && d.csrfToken)
          rows.push({"#URL":url,"#CSRF_Token":d.csrfToken});

        if (s.aspShieldBypass && d.aspTokens?.viewState)
          rows.push({"#URL":url,"#ASP_ViewState":d.aspTokens.viewState.slice(0,80)+"…","#ASP_EventValidation":d.aspTokens.eventVal||"","#ASP_ViewStateGenerator":d.aspTokens.viewStateGen||""});

        if (s.endlessButton && d.loadMoreButtons?.length)
          d.loadMoreButtons.forEach(btn => rows.push({"#URL":url,"#EndlessButton":"Detected","#Button_Text":btn.text,"#Button_Selector":btn.selector,"#Info":"Load More button found — JS execution needed for full content."}));
        else if (s.endlessButton) {
          const bodyText = (d.doc?.body?.textContent || "").toLowerCase();
          if (/load more|show more|view more|see more/i.test(bodyText))
            rows.push({"#URL":url,"#EndlessButton":"Detected (text only)","#Info":"'Load More' text found in page body — JS execution needed."});
        }

        if (s.infiniteScroll && d.infiniteScrollInfo?.detected)
          rows.push({"#URL":url,"#InfiniteScroll":"Detected","#Confidence":`${d.infiniteScrollInfo.confidence}%`,"#Signals":d.infiniteScrollInfo.signals.join(" | "),"#Info":"Infinite scroll found — JS execution needed for all items."});

        if (s.pagination && d.doc) {
          const { detectNextPageUrl } = await import("../utils/domDetect");
          const nextUrl = detectNextPageUrl(d.doc, url, url);
          if (nextUrl && !visitedUrls.has(nextUrl) && urlQueue.length < list.length + 20)
            urlQueue.push(nextUrl);
        }

        setProg(p => ({...p, collected: rows.length, total: urlQueue.length}));
      } catch(e) {
        const isChallenge = e.message?.startsWith("JS_CHALLENGE:");
        const errMsg = isChallenge ? "Bot protection / JS challenge (Cloudflare)" : (e.message || "Unknown error");
        errList.push({url, error: errMsg});
        rows.push({"#URL":url,"#Error":errMsg});
      }
    }

    loadRows([...rows]);
    setErrs(errList);
    addEntry({id:Date.now(),urls:urls.split("\n").filter(Boolean),date:new Date().toLocaleString("en-US"),rows:rows.length,data:rows});
    setLoad(false);
    msg(`Done! ${rows.length} rows${errList.length ? ` · ${errList.length} errors` : ""}${urlQueue.length > list.length ? ` · auto-paginated ${urlQueue.length - list.length} extra pages` : ""}`);
    setTab("result");
  }

  return { autoFillFromTable, tryFetchApi, importApiData, loadPastedHtml, testLoad, runScrape };
}
