"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

function send(body: string) {
  try {
    if (!navigator.sendBeacon?.("/api/hit", new Blob([body], { type: "application/json" })))
      fetch("/api/hit", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } });
  } catch { /* ignore */ }
}

/** Počítadlo návštev bez cookies: pri každej zmene stránky pošle jeden záznam a pri odchode čas strávený na stránke. */
export function Tracker() {
  const path = usePathname();
  useEffect(() => {
    if (!path || path.startsWith("/admin")) return;
    // prehliadač, v ktorom sa niekto prihlásil do administrácie, sa do návštevnosti nepočíta
    try { if (localStorage.getItem("rem-no-track") || localStorage.getItem("rem-admin-auth")) return; } catch { /* ignore */ }
    const q = new URLSearchParams(window.location.search);
    const body = JSON.stringify({
      p: path,
      r: document.referrer,
      w: window.innerWidth,
      u: q.get("utm_source") || q.get("ref") || (q.get("gclid") ? "google-ads" : q.get("fbclid") ? "facebook" : ""),
      um: q.get("utm_medium") || (q.get("gclid") ? "cpc" : ""),
      uc: q.get("utm_campaign") || "",
      wd: (navigator as Navigator & { webdriver?: boolean }).webdriver === true
    });

    // čas na stránke počítame len vtedy, keď je karta viditeľná
    let sent = false, visibleMs = 0, since = document.visibilityState === "visible" ? Date.now() : 0, left = false;
    const t = setTimeout(() => { sent = true; send(body); }, 600);
    const leave = () => {
      if (since) { visibleMs += Date.now() - since; since = 0; }
      if (!sent || left) return;
      const d = Math.round(visibleMs / 1000);
      if (d >= 1) { left = true; send(JSON.stringify({ t: "l", p: path, d })); }
    };
    const onVis = () => {
      if (document.visibilityState === "hidden") leave();
      else { since = Date.now(); left = false; }
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", leave);
    return () => {
      clearTimeout(t);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", leave);
      leave();
    };
  }, [path]);
  return null;
}
