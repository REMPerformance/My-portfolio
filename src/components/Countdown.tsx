"use client";
import { useEffect, useState } from "react";

export function fmtLeft(ms: number) {
  if (ms <= 0) return null;
  const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5), m = Math.floor((ms % 36e5) / 6e4), s = Math.floor((ms % 6e4) / 1e3);
  const p = (n: number) => String(n).padStart(2, "0");
  return (d ? d + "d " : "") + p(h) + ":" + p(m) + ":" + p(s);
}

export function useNow(interval = 1000) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(t);
  }, [interval]);
  return now;
}

/** Text odpočtu; pred hydratáciou zobrazí fallback (dátum), aby HTML bolo zmysluplné aj pre Google. */
export function Countdown({ to, done = "Uzavreté", fallback }: { to: string | null; done?: string; fallback?: string }) {
  const now = useNow();
  if (!to) return <>—</>;
  if (now === null) return <>{fallback ?? "…"}</>;
  return <>{fmtLeft(Date.parse(to) - now) ?? done}</>;
}
