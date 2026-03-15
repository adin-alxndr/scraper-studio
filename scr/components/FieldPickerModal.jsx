import { useState, useEffect, useRef } from "react";
import { Btn } from "./ui/index.jsx";

export function FieldPickerModal({ selector, fields, onSelect, onCopy, onClose }) {
  const [copied, setCopied] = useState(false);
  const [naming, setNaming] = useState(false);
  const [newName, setNewName] = useState("");
  const nameRef = useRef(null);

  function confirmNew() { const n = newName.trim() || "New Field"; onSelect("__new__:" + n); }
  useEffect(() => { if (naming && nameRef.current) nameRef.current.focus(); }, [naming]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 460 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span className="section-label-text">INSERT SELECTOR INTO FIELD</span>
            <Btn variant="ghost" size="sm" onClick={onClose}>✕</Btn>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <code className="selector-display">{selector}</code>
            <Btn variant="ghost" size="sm" onClick={() => { onCopy(); setCopied(true); setTimeout(() => setCopied(false), 1800); }} style={{ flexShrink: 0, background: copied ? "#e8f5e9" : undefined }}>
              {copied ? "✓" : "📋"}
            </Btn>
          </div>
        </div>
        <div style={{ padding: "14px 20px", maxHeight: 320, overflowY: "auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {fields.map((f, i) => (
              <button key={f.id} onClick={() => onSelect(f.id)} className="field-pick-btn">
                <div className="field-pick-num">{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "#333", fontWeight: 700 }}>{f.name || <em style={{ color: "#bbb" }}>(empty)</em>}</div>
                  <div style={{ fontSize: 10, color: "#9e9e9e", fontFamily: "'Courier New',monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.sel || "— not set —"}</div>
                </div>
                <span className="tag">Fill →</span>
              </button>
            ))}
            {!naming ? (
              <button onClick={() => { setNaming(true); setNewName(""); }} className="field-pick-new">
                <div className="field-pick-num" style={{ border: "1px dashed #c5cae9", background: "transparent", color: "#9e9e9e" }}>＋</div>
                <span style={{ fontSize: 12, color: "#9e9e9e" }}>Create new field…</span>
              </button>
            ) : (
              <div style={{ padding: "10px 12px", background: "#f0f4ff", border: "1px solid #90caf9", borderRadius: 8 }}>
                <div className="section-label-text" style={{ marginBottom: 8 }}>＋ NEW FIELD NAME</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input ref={nameRef} className="inp" value={newName} onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") confirmNew(); if (e.key === "Escape") setNaming(false); }}
                    placeholder="e.g. Title, Price, Image…" style={{ flex: 1, fontSize: 12 }} />
                  <Btn variant="primary" size="sm" onClick={confirmNew}>Create ✓</Btn>
                  <Btn variant="ghost" size="sm" onClick={() => setNaming(false)}>✕</Btn>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <Btn variant="ghost" onClick={onClose}>Close</Btn>
        </div>
      </div>
    </div>
  );
}