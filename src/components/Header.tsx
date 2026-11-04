"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV, SITE } from "@/lib/site";
import { LogoMark, LogoWord } from "./Logo";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="REM Performance – domov">
      <LogoMark className="brand__mark" />
      <LogoWord className="brand__word" />
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
          <span className="tb-l">Dovoz áut z USA, Dubaja, Kanady a Ázie na slovenské značky</span>
          <span className="tb-r">
            <a className="tb-mail" href={`mailto:${SITE.email}`}>{SITE.email}</a>
            <a href={`tel:${SITE.phone.replace(/\s/g, "")}`}>{SITE.phone}</a>
            <a className="tb-wa" href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noopener">WhatsApp</a>
          </span>
        </div>
      </div>
      <header className="hdr">
        <div className="wrap">
          <Brand />
          <nav className={`menu${open ? " open" : ""}`} id="menu" aria-label="Hlavné menu">
            <Link href="/sledovanie" className="menu-track" aria-current={path.startsWith("/sledovanie") ? "page" : undefined}>Sledovanie objednávky</Link>
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} aria-current={path === n.href || path.startsWith(n.href + "/") ? "page" : undefined}>
                {n.label}
              </Link>
            ))}
          </nav>
          <Link href="/sledovanie" className={`hdr-track${path.startsWith("/sledovanie") ? " on" : ""}`} aria-label="Sledovanie objednávky">
            <span className="hdr-track__ic" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M3 15h12l3-4h3M5 15l1-5h8l1 5" /><path d="M2 19c1.7 0 1.7-1 3.4-1s1.7 1 3.4 1 1.7-1 3.4-1 1.7 1 3.4 1 1.7-1 3.4-1 1.7 1 3.4 1" /></svg>
              <i />
            </span>
            <span className="hdr-track__t"><small>Kde je moje auto?</small><b>Sledovanie<span className="hdr-track__more"> objednávky</span></b></span>
          </Link>
          <div className="hdr-cta">
            <Link href="/auto-na-mieru" className="rc-arrow">Chcem auto na mieru</Link>
          </div>
          <button className="burger" aria-label="Menu" aria-expanded={open} aria-controls="menu" onClick={() => setOpen((o) => !o)}>
            <span /><span /><span />
          </button>
        </div>
      </header>
    </>
  );
}
