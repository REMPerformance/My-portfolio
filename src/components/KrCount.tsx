"use client";
import { useEffect, useState } from "react";

/** Počet áut skladom v Kórei, načíta sa až v prehliadači (úvodná stránka nečaká na sklad). */
export function KrCount() {
  const [n, setN] = useState<number | null>(null);
  useEffect(() => {
    let off = false;
    fetch("/api/kr-search?count=1").then((r) => (r.ok ? r.json() : null)).then((d) => { if (!off && d?.all) setN(d.all); }).catch(() => {});
    return () => { off = true; };
  }, []);
  return <span>{n ? `${n.toLocaleString("sk-SK")} áut ihneď k odberu` : "Autá ihneď k odberu"}</span>;
}
