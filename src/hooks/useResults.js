import { useState } from "react";
import { applyCleaningOps } from "../utils/dataClean";

const DEFAULT_OPS = {
  dedup: false, trim: false, strip: false, lower: false,
  upper: false, cap:   false, nums: false, urls_: false,
};

/**
 * useResults
 * Manages the scrape result table: raw data, cleaned view, column
 * visibility / renames, inline cell editing, and cleaning operations.
 *
 * Returns:
 *   rawRes    – unmodified rows from the last scrape
 *   res       – currently displayed rows (cleaned or raw)
 *   cleaned   – whether a cleaning pass has been applied
 *   ops       – active cleaning operation flags
 *   hidCols   – list of hidden column names
 *   renCols   – { originalName: displayName } rename map
 *   editCell  – currently edited cell ref { rowIdx, col } or null
 *   editVal   – current edit input value
 *   headers   – visible, resolved column headers derived from res + hidCols
 *   setRawRes / setRes / setCleaned / setOps / setHidCols / setRenCols
 *   setEC / setEV – editCell / editVal setters
 *   doClean   – applies ops to rawRes and updates res
 *   resetRaw  – reverts res to rawRes and resets all ops & column state
 */
export function useResults(msgFn) {
  const [rawRes,  setRawRes]  = useState([]);
  const [res,     setRes]     = useState([]);
  const [cleaned, setCleaned] = useState(false);
  const [ops,     setOps]     = useState(DEFAULT_OPS);
  const [hidCols, setHidCols] = useState([]);
  const [renCols, setRenCols] = useState({});
  const [editCell, setEC]     = useState(null);
  const [editVal,  setEV]     = useState("");

  const headers = res.length
    ? Object.keys(res[0]).filter((h) => !hidCols.includes(h))
    : [];

  const doClean = () => {
    const d = applyCleaningOps(rawRes, ops);
    setRes(d);
    setCleaned(true);
    msgFn?.(`Cleaning done! ${d.length} rows`);
  };

  const resetRaw = () => {
    if (!rawRes.length) return;
    setRes([...rawRes]);
    setCleaned(false);
    setOps(DEFAULT_OPS);
    setHidCols([]);
    setRenCols({});
    msgFn?.("Reset to original scrape data!");
  };

  /** Convenience: load a fresh set of rows from a completed scrape. */
  const loadRows = (rows) => {
    setRawRes([...rows]);
    setRes([...rows]);
    setCleaned(false);
    setHidCols([]);
    setRenCols({});
  };

  return {
    rawRes,  setRawRes,
    res,     setRes,
    cleaned, setCleaned,
    ops,     setOps,
    hidCols, setHidCols,
    renCols, setRenCols,
    editCell, setEC,
    editVal,  setEV,
    headers,
    doClean,
    resetRaw,
    loadRows,
  };
}
