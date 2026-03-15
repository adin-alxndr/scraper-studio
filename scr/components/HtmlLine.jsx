import { C, SELF_CLOSE } from "../utils/domSelector";

export function HtmlLine({ node, isHov, isPick }) {
  const { tag, id, classes, attrs, ownText, fullText, previewText, childCount, totalChildren } = node;
  const tc = isPick ? C.tagPick : isHov ? C.tagHov : C.tag;
  const cc = isPick ? C.tagPick : isHov ? C.tagHov : C.close;
  const isSC = SELF_CLOSE.has(tag);
  const displayText = previewText
    ? (previewText.length > 100 ? previewText.slice(0, 100) + "…" : previewText)
    : null;

  const PRIORITY = ["href","src","title","alt","aria-label","type","name","role","placeholder","value"];
  const sortedAttrs = [
    ...PRIORITY.filter(k => attrs[k] !== undefined).map(k => [k, attrs[k]]),
    ...Object.entries(attrs).filter(([k]) => !PRIORITY.includes(k)),
  ].slice(0, 5);

  return (
    <span style={{ fontFamily: "'Courier New',monospace", fontSize: 12, lineHeight: "22px", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
      <span style={{ color: tc }}>&lt;{tag}</span>
      {id && <><span style={{ color: C.attr }}> id</span><span style={{ color: C.eq }}>=</span><span style={{ color: C.val }}>"{id}"</span></>}
      {classes.length > 0 && <><span style={{ color: C.attr }}> class</span><span style={{ color: C.eq }}>=</span><span style={{ color: C.val }}>"{classes.join(" ")}"</span></>}
      {sortedAttrs.map(([k, v]) => (
        <span key={k}>
          <span style={{ color: k === "title" ? "#6a1b9a" : C.attr }}> {k}</span>
          <span style={{ color: C.eq }}>=</span>
          <span style={{ color: k === "title" ? "#6a1b9a" : C.val }}>"{String(v).slice(0, 60)}"</span>
        </span>
      ))}
      {isSC ? <span style={{ color: tc }}> /&gt;</span> : (
        <>
          <span style={{ color: tc }}>&gt;</span>
          {displayText
            ? <span style={{ color: C.text }}>{displayText}</span>
            : childCount > 0
              ? (fullText
                ? <span style={{ color: C.text, opacity: 0.5 }}>{fullText.length > 70 ? fullText.slice(0, 70) + "…" : fullText}</span>
                : <span style={{ color: C.child }}>…</span>)
              : null}
          <span style={{ color: cc }}>&lt;/{tag}&gt;</span>
        </>
      )}
      {totalChildren > 0 && (
        <span style={{ marginLeft: 6, fontSize: 9, color: "#90a4ae", background: "#e3f2fd", padding: "1px 5px", borderRadius: 3, verticalAlign: "middle" }}>
          {totalChildren}▾
        </span>
      )}
    </span>
  );
}
