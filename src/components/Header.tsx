"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV, SITE } from "@/lib/site";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="REM Performance by RACEM – domov">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={SITE.logo} alt="RACEM" width={131} height={30} />
      <span className="div" />
      <span className="lbl"><b>REM Performance</b><small>Autá z USA</small></span>
    </Link>
  );
}

export function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  return (
    <>
      <div className="topbar">
        <div className="wrap">
          <span>Odhad ceny vrátane cla a DPH<span className="hide-sm"> · K autu až 700 € na tuning</span></span>
          <a href={SITE.racemUrl} target="_blank" rel="noopener"><span>RACEM.SK</span></a>
        </div>
      </div>
      <header className="hdr">
        <div className="wrap">
          <Brand />
          <nav className={`menu${open ? " open" : ""}`} id="menu" aria-label="Hlavné menu">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} aria-current={path === n.href || path.startsWith(n.href + "/") ? "page" : undefined}>
                {n.label}
              </Link>
            ))}
          </nav>
          <Link href="/ponuka" className="rc-arrow">Vybrať auto</Link>
          <button className="burger" aria-label="Menu" aria-expanded={open} aria-controls="menu" onClick={() => setOpen((o) => !o)}>
            <span /><span /><span />
          </button>
        </div>
      </header>
    </>
  );
}
