"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Loads /support-v3.js once, after hydration, so the script never edits markup React is still hydrating.
 * On client-side navigation the script is already loaded: re-apply the variant and the 30-day "Not now".
 * The use count and the snooze live only in this browser (localStorage), never sent anywhere.
 */
export default function SctMount() {
  const path = usePathname();
  useEffect(() => {
    const w = window as unknown as { sctShown?: () => void };
    if (typeof w.sctShown === "function") {
      w.sctShown();
      let until = 0;
      try {
        const site = document.documentElement.getAttribute("data-sct-site") || location.hostname;
        until = Number(localStorage.getItem(`sct:${site}:snooze`) || 0);
      } catch {
        until = 0;
      }
      if (Date.now() < until) {
        document.querySelectorAll<HTMLElement>('[data-support-cta="result"]').forEach((c) => {
          c.hidden = true;
        });
      }
      return;
    }
    if (document.querySelector("script[data-sct-loader]")) return;
    const s = document.createElement("script");
    s.src = "/support-v3.js?v=3";
    s.defer = true;
    s.setAttribute("data-sct-loader", "1");
    document.body.appendChild(s);
  }, [path]);
  return null;
}
