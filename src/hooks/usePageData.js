import { useState } from "react";

/**
 * usePageData
 * Manages all state derived from a fetched / pasted web page:
 * the parsed document, links, images, JS-challenge flags, detected
 * tables, API endpoints, and attachment metadata.
 *
 * Returns individual state values and a set of convenience setters /
 * helpers so callers don't have to import every setter separately.
 */
export function usePageData() {
  const [doc,              setDoc]              = useState(null);
  const [docBase,          setDocBase]          = useState("");
  const [rawHtml,          setRawHtml]          = useState("");
  const [jsChallenge,      setJsChallenge]      = useState(false);
  const [jsChallengeUrl,   setJsChallengeUrl]   = useState("");
  const [links,            setLinks]            = useState([]);
  const [images,           setImages]           = useState([]);
  const [tableInfo,        setTableInfo]        = useState([]);
  const [apiEndpoints,     setApiEndpoints]     = useState([]);
  const [graphqlEndpoints, setGraphqlEndpoints] = useState([]);
  const [attachments,      setAttachments]      = useState([]);
  const [apiData,          setApiData]          = useState(null);
  const [apiLoading,       setApiLoading]       = useState(false);

  /** Apply a full fetch result (returned by fetchWithFallback) to state. */
  const applyFetchResult = (url, d) => {
    setDoc(d.doc);
    setDocBase(url);
    setRawHtml(d.rawHtml || "");
    setLinks(d.links || []);
    setImages(d.images || []);
    if (d.attachments?.length) setAttachments(d.attachments);
  };

  /** Reset all page-level state (e.g. when starting a Scraper Studio). */
  const resetPageData = () => {
    setLinks([]);
    setImages([]);
    setJsChallenge(false);
    setTableInfo([]);
    setApiEndpoints([]);
    setGraphqlEndpoints([]);
    setApiData(null);
    setAttachments([]);
  };

  return {
    doc,              setDoc,
    docBase,          setDocBase,
    rawHtml,          setRawHtml,
    jsChallenge,      setJsChallenge,
    jsChallengeUrl,   setJsChallengeUrl,
    links,            setLinks,
    images,           setImages,
    tableInfo,        setTableInfo,
    apiEndpoints,     setApiEndpoints,
    graphqlEndpoints, setGraphqlEndpoints,
    attachments,      setAttachments,
    apiData,          setApiData,
    apiLoading,       setApiLoading,
    applyFetchResult,
    resetPageData,
  };
}
