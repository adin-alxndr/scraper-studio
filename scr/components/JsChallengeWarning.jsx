import { InfoBanner, Btn } from "./ui/index.jsx";

export function JsChallengeWarning({ url, onDismiss }) {
  return (
    <InfoBanner type="warn">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#e65100", fontWeight: 700, marginBottom: 6 }}>⚠ This site requires JavaScript or blocks bot access</div>
          <div style={{ color: "#795548", marginBottom: 8 }}>
            <b style={{ color: "#bf360c" }}>{url}</b> uses Cloudflare protection or requires a real browser.
          </div>
          <div style={{ color: "#795548", fontSize: 11 }}>
            <b>Alternatives:</b> Open in browser → Ctrl+U to view source → Paste HTML tab, or use sites without bot protection.
          </div>
        </div>
        <Btn variant="ghost" size="sm" onClick={onDismiss}>✕</Btn>
      </div>
    </InfoBanner>
  );
}