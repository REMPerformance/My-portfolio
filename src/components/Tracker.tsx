"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Počítadlo návštev bez cookies – pri každej zmene stránky pošle jeden záznam. */
export function Tracker() {
  const path = usePathname();
  useEffect(() => {
    if (!path || path.startsWith("/admin")) return;
    const q = new URLSearchParams(window.location.search);
    const body = JSON.stringify({
      p: path,
      r: document.referrer,
      w: window.innerWidth,
      u: q.get("utm_source") || q.get("ref") || (q.get("gclid") ? "google-ads" : q.get("fbclid") ? "facebook" : ""),
      wd: (navigator as Navigator & { webdriver?: boolean }).webdriver === true
    });
    const t = setTimeout(() => {
      try {
        if (!navigator.sendBeacon?.("/api/hit", new Blob([body], { type: "application/json" })))
          fetch("/api/hit", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } });
      } catch { /* ignore */ }
    }, 600);
    return () => clearTimeout(t);
  }, [path]);
  return null;
}
