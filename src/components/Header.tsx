"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV, SITE } from "@/lib/site";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="REM Performance – domov">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={SITE.logo} alt="RACEM" width={96} height={22} />
      <span className="div" />
      <span className="lbl"><b>REM Performance</b><small>Dovoz áut na kľúč</small></span>
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
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} aria-current={path === n.href || path.startsWith(n.href + "/") ? "page" : undefined}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="hdr-cta">
            <Link href="/kontakt" className="rc-arrow">Chcem auto na mieru</Link>
          </div>
          <button className="burger" aria-label="Menu" aria-expanded={open} aria-controls="menu" onClick={() => setOpen((o) => !o)}>
            <span /><span /><span />
          </button>
        </div>
      </header>
    </>
  );
}
