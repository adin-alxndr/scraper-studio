import { useState } from "react";

/**
 * useToast
 * Manages a single transient toast notification.
 *
 * Returns:
 *   toast   – current toast object { m: string, t: "success"|"error"|... } or null
 *   msg     – (message, type?) → shows a toast
 *   dismiss – clears the toast
 */
export function useToast() {
  const [toast, setToast] = useState(null);

  const msg = (m, t = "success") => setToast({ m, t });
  const dismiss = () => setToast(null);

  return { toast, msg, dismiss };
}
