"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SITE } from "@/lib/site";
import { PHASES, PHASE_STATE, PORTS_FROM, fLong, fShort, legProgress, plDays, resolve, routeOf, splitRoute, type Shipment } from "@/lib/tracking";
import { TrackMap } from "./TrackMap";

/* Ilustrácie fáz; trieda hl zvýrazní detail aktuálneho kroku, anim sa jemne hýbe. */
const ICONS: { a: string; s: React.ReactNode }[] = [
  { a: "trkPulse", s: <><g className="anim"><path d="M13 5h17l7 7v31H13z" /><path d="M30 5v7h7" /><path d="M18 19h14M18 25h14" /></g><path className="hl" d="M18 36c3-5 5 2 7-1.5s3.5-2 6 .5" /></> },
  { a: "trkPulse", s: <><g className="anim"><path d="M4 32v-6l6-8h20l7 8h5a2 2 0 0 1 2 2v4" /><path d="M11 18l2 8h24" /><circle cx="13" cy="33" r="4" /><circle cx="35" cy="33" r="4" /><path d="M17 33h14" /></g><path className="hl" d="M33 7.5l3 3 6.5-6.5" /></> },
  { a: "trkDrive", s: <><g className="anim"><path d="M3 12h25v20H3z" /><path d="M28 19h8l7 7v6H28" /><circle cx="11" cy="35" r="4" /><circle cx="35" cy="35" r="4" /><path d="M15 35h16" /></g><path className="hl" d="M3 42h42" strokeDasharray="3 4" /></> },
  { a: "trkBob", s: <><g className="anim"><path d="M9 31V15h24v16" /><path d="M33 31V20h5v11" /><path d="M14 20h4M21 20h4M14 25h4M21 25h4M28 20h2M28 25h2" /><path d="M5 31h39l-5 7H10z" /></g><path className="hl" d="M3 43c3 0 3-2 6-2s3 2 6 2 3-2 6-2 3 2 6 2 3-2 6-2 3 2 6 2" /></> },
  { a: "trkPulse", s: <><g className="anim"><path d="M8 6h22v30H8z" /><path d="M13 13h12M13 19h12M13 25h7" /><circle cx="33" cy="33" r="9" /></g><path className="hl" d="M29 33l3 3 5.5-5.5" /></> },
  { a: "trkPulse", s: <><g className="anim"><path d="M8 34a16 16 0 1 1 32 0" /><path d="M24 34l8-10" /><circle cx="24" cy="34" r="2.5" /><path d="M12 34h3M33 34h3M24 18v3M13.5 23.5l2 2M34.5 23.5l-2 2" /></g><path className="hl" d="M8 42h32" /></> },
  { a: "trkPulse", s: <><g className="anim"><circle cx="15" cy="24" r="9" /><circle cx="15" cy="24" r="3" /><path d="M24 24h19M37 24v7" /></g><path className="hl" d="M42 24v5" /></> }
];

export const STORE_KEY = "rem-track";
export type Stored = { vin: string; contract: string; shipment?: Shipment };
export function readStored(): Stored | null {
  try { const v = JSON.parse(sessionStorage.getItem(STORE_KEY) || "null"); return v && v.vin ? v : null; } catch { return null; }
}

export function TrackStatusPage() {
  const router = useRouter();
  const [data, setData] = useState<Stored | null | undefined>(undefined);

  useEffect(() => {
    const st = readStored();
    if (!st) { router.replace("/sledovanie"); return; }
    setData(st);
    // vždy načítame čerstvý stav, uložený slúži len na okamžité zobrazenie
    fetch("/api/tracking", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ vin: st.vin, contract: st.contract }) })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!j?.shipment) { if (!st.shipment) router.replace("/sledovanie"); return; }
        const next = { ...st, shipment: j.shipment as Shipment };
        try { sessionStorage.setItem(STORE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
        setData(next);
      })
      .catch(() => {});
  }, [router]);

  if (!data?.shipment) return <div className="wrap trk-wait"><p className="note">Načítavam stav objednávky…</p></div>;
  return <TrackStatus s={data.shipment} />;
}

export function TrackStatus({ s }: { s: Shipment }) {
  const R = resolve(s.milestones || []);
  const { cur, next, allDone, eta, curSince } = R;
  const leg = legProgress(R.steps, s.sea_progress);
  const route = routeOf(s.port_from, s.port_to);
  const seaStep = R.steps.find((x) => x.leg === "sea");
  const sp = splitRoute(route.sea, leg.sea);
  const now = Date.now();
  const etaDays = eta ? Math.round((eta - new Date().setHours(0, 0, 0, 0)) / 864e5) : null;
  const curPh = allDone ? 6 : cur?.ph ?? 0;
  const [lb, setLb] = useState<{ photos: string[]; i: number; cap: string } | null>(null);
  const stepsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const w = stepsRef.current, c = w?.querySelector<HTMLElement>(".trk-step.cur");
    if (w && c && w.scrollWidth > w.clientWidth) w.scrollLeft = c.offsetLeft - w.clientWidth / 2 + c.offsetWidth / 2;
  }, []);
  useEffect(() => {
    if (!lb) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLb(null);
      if (e.key === "ArrowRight") setLb((x) => x && { ...x, i: (x.i + 1) % x.photos.length });
      if (e.key === "ArrowLeft") setLb((x) => x && { ...x, i: (x.i - 1 + x.photos.length) % x.photos.length });
    };
    addEventListener("keydown", k); return () => removeEventListener("keydown", k);
  }, [lb]);

  const thumbs = (photos: string[], cap: string, max: number) => photos.length ? (
    <div className="trk-thumbs">
      {photos.slice(0, max).map((p, j) => (
        <button type="button" className="trk-thumb" key={p} onClick={() => setLb({ photos, i: j, cap })} aria-label={`Zväčšiť fotku ${j + 1}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p} alt="" loading="lazy" />
          {j === max - 1 && photos.length > max ? <span className="more">+{photos.length - max}</span> : null}
        </button>
      ))}
    </div>
  ) : null;

  const country = PORTS_FROM[s.port_from]?.country || "";
  const dIso = (v?: string | null) => (v ? fShort(new Date(v + "T12:00:00").getTime()) : "");
  const facts: [string, string, boolean?][] = [
    ["Lodná spoločnosť", s.shipping_line || ""],
    ["Loď", [s.vessel, s.voyage && `plavba ${s.voyage}`].filter(Boolean).join(", ") || "upresníme po nakládke"],
    ["Kontajner", s.container_no || "", true],
    [s.atd ? "Odplávanie" : "Očakávané odplávanie", dIso(s.atd || s.etd) || (seaStep?.start ? fShort(seaStep.start) : "upresníme"), true],
    [s.ata ? "Prílev" : "Očakávaný prílev", dIso(s.ata || s.eta) || (seaStep?.end ? fShort(seaStep.end - 864e5) : "upresníme"), true]
  ].filter(([, v]) => v) as [string, string, boolean?][];
  const routeStops = [
    s.pickup_place ? { k: "Odkiaľ", v: s.pickup_place } : null,
    { k: "Prístav nakládky", v: route.a.n, c: route.a.country },
    { k: "Prístav vykládky", v: route.b.n, c: route.b.country },
    { k: "Kam", v: s.destination_place || "Slovensko" }
  ].filter(Boolean) as { k: string; v: string; c?: string }[];
  const [open, setOpen] = useState<Set<number>>(new Set());
  const toggle = (i: number) => setOpen((o) => { const n = new Set(o); if (n.has(i)) n.delete(i); else n.add(i); return n; });

  return (
    <div className="wrap trk">
      <div className="trk-bar">
        <Link className="trk-back" href="/sledovanie"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13 8H3M7 3.5L2.5 8 7 12.5" /></svg>Späť</Link>
        <div className="trk-locked"><span className="trk-lbl">VIN vozidla</span><b className="mono">{s.vin}</b></div>
        <div className="trk-locked"><span className="trk-lbl">Číslo zmluvy</span><b className="mono">{s.contract_no}</b></div>
      </div>

      <div className="trk-hero">
        <div className="trk-box trk-car"><span className="trk-lbl">{country ? `Dovoz ${country === "USA" ? "z USA" : `z krajiny ${country}`}` : "Dovoz vozidla"}</span><h1>{s.car_label}</h1></div>
        <div className={`trk-state${allDone ? " done" : ""}`}>
          <span className="trk-lbl">Stav</span>
          <strong>{PHASE_STATE[curPh]}</strong>
          {!allDone && curSince ? <small>od {fLong(curSince)}</small> : null}
        </div>
      </div>

      <section className="trk-box trk-steps-wrap" ref={stepsRef} aria-label="Fázy dovozu">
        <div className="trk-steps">
          {PHASES.map((n, i) => {
            const items = R.vis.filter((x) => x.ph === i);
            const st = allDone || (items.length && items.every((x) => x.st === "done")) ? "done" : curPh === i ? "cur" : "next";
            const lastDone = items.map((x) => x.doneAt || 0).reduce((a, b) => Math.max(a, b), 0);
            const firstStart = items.find((x) => x.start !== null)?.start ?? null;
            const when = st === "done" ? (lastDone ? fShort(lastDone) : "hotovo") : st === "cur" ? "prebieha" : firstStart ? `očakávané ${fShort(firstStart)}` : "termín upresníme";
            return (
              <div className={`trk-step ${st}`} key={n} style={{ ["--d" as string]: `${i * 0.07}s`, ["--ia" as string]: ICONS[i].a }}>
                <div className="tw"><div className="tile">{st === "done" && <span className="ck" />}<svg viewBox="0 0 48 48" aria-hidden="true">{ICONS[i].s}</svg></div><span className="link" /></div>
                <span className="no">{String(i + 1).padStart(2, "0")}</span>
                <h3>{n}</h3>
                <time>{when}</time>
              </div>
            );
          })}
        </div>
      </section>

      <div className="trk-dates">
        <div className="trk-box trk-date now"><span className="trk-lbl">Aktuálny stav</span><strong>{allDone ? "Vozidlo je odovzdané" : cur?.t}</strong><div className="when"><span>od</span><b>{curSince ? fLong(curSince) : "dnes"}</b></div></div>
        <div className="trk-box trk-date"><span className="trk-lbl">Ďalší krok</span><strong>{next ? next.t : "Hotovo"}</strong><div className="when"><span>očakávané</span><b>{next?.start ? fLong(next.start) : next ? "upresníme" : ""}</b></div></div>
        <div className="trk-box trk-date eta"><span className="trk-lbl">Očakávané prevzatie</span><strong className="big">{eta ? fLong(eta) : "Upresníme"}</strong><div className="when"><span>{etaDays !== null && etaDays > 0 ? `približne o ${etaDays} ${plDays(etaDays)}` : eta ? fShort(eta) : "po nakládke na loď"}</span></div></div>
      </div>

      <section className="trk-box trk-mapcard">
        <div className="trk-h"><h2>Poloha lode</h2></div>
        <div className="trk-mapgrid">
          <div className="trk-map dark"><TrackMap from={s.port_from} to={s.port_to} sea={leg.sea} post={leg.post} dest={s.destination_place || "Bratislava"} /></div>
          <div className="trk-facts">
            <div className="trk-voy">
              <span className="trk-lbl">Plavba</span>
              <span className="big">{leg.sea >= 1 ? "Ukončená" : leg.sea > 0 ? `${Math.round(leg.sea * 100)} %` : "Čaká na nakládku"}</span>
              <div className="track"><i style={{ width: `${Math.round(leg.sea * 100)}%` }} /></div>
              <div className="row"><span>{route.a.n}</span><span className="mono">{leg.sea > 0 && leg.sea < 1 ? `zostáva ${Math.round(sp.L * (1 - leg.sea)).toLocaleString("sk-SK")} nm` : `${Math.round(sp.L).toLocaleString("sk-SK")} nm`}</span><span>{route.b.n}</span></div>
            </div>
            {facts.map(([k, v, mono]) => <div className="trk-fact" key={k}><span>{k}</span><b className={mono ? "mono" : undefined}>{v}</b></div>)}
          </div>
        </div>
        <div className="trk-route">
          {routeStops.map((r, i) => (
            <div className="trk-route__s" key={i}><span className="trk-lbl">{r.k}</span><b>{r.v}</b>{r.c ? <small>{r.c}</small> : null}</div>
          ))}
        </div>
      </section>

      <section className="trk-box">
        <div className="trk-h"><h2>Priebeh dovozu</h2><span className="trk-pct"><b>{R.pct} %</b> hotovo</span></div>
        <div className="trk-total"><i style={{ width: `${R.pct}%` }} /></div>
        <ol className="trk-tl">
          {R.vis.map((m) => {
            const range = m.start !== null && m.end !== null && m.end - m.start > 864e5;
            const when = m.st === "done" ? (m.doneAt ? fShort(m.doneAt) : "hotovo")
              : m.st === "cur" ? (range ? `${fShort(m.start!)} až ${fShort(m.end! - 864e5)}` : m.start ? `očakávané ${fShort(m.start)}` : "prebieha")
              : m.start ? `očakávané ${fShort(m.start)}${range ? ` až ${fShort(m.end! - 864e5)}` : ""}` : "termín upresníme";
            const ph = [...(m.photos || []), ...(s.updates || []).filter((u) => u.step === m.i).flatMap((u) => u.photos || [])];
            const docs = m.docs || [];
            const extra = ph.length + docs.length;
            const isOpen = open.has(m.i);
            const fill = m.st === "done" ? 1 : m.st === "cur" ? Math.max(.08, m.p) : 0;
            return (
              <li className={`trk-tl__i ${m.st}${isOpen ? " open" : ""}`} key={m.i}>
                <span className="trk-tl__rail" aria-hidden="true"><i style={{ height: `${fill * 100}%` }} /></span>
                <span className="trk-tl__dot" aria-hidden="true" />
                <div className="trk-tl__b">
                  {extra ? (
                    <button type="button" className="trk-tl__h" aria-expanded={isOpen} onClick={() => toggle(m.i)}>
                      <span className="t"><b>{m.t}</b><time>{when}</time></span>
                      <span className="att">{ph.length ? `${ph.length} ${ph.length === 1 ? "fotka" : ph.length < 5 ? "fotky" : "fotiek"}` : ""}{ph.length && docs.length ? " · " : ""}{docs.length ? `${docs.length} ${docs.length === 1 ? "dokument" : docs.length < 5 ? "dokumenty" : "dokumentov"}` : ""}<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" /></svg></span>
                    </button>
                  ) : (
                    <div className="trk-tl__h"><span className="t"><b>{m.t}</b><time>{when}</time></span></div>
                  )}
                  {m.st === "cur" && range ? <div className="trk-tl__bar"><i style={{ width: `${Math.round(m.p * 100)}%` }} /></div> : null}
                  {isOpen && (
                    <div className="trk-tl__x">
                      <p>{m.d}</p>
                      {thumbs(ph, m.t, 12)}
                      {docs.length > 0 && (
                        <div className="trk-docs">
                          {docs.map((d) => (
                            <a key={d.url} href={d.url} target="_blank" rel="noopener" className="trk-doc">
                              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H6v18h12V7z" /><path d="M14 3v4h4M9 13h6M9 17h6" /></svg>
                              <span>{d.name}</span><small>PDF</small>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="trk-box trk-contact">
        <h2>Máte otázku k objednávke?</h2>
        <div className="rows">
          <a href={`tel:${SITE.phone.replace(/\s/g, "")}`}>{SITE.phone}</a>
          <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noopener">WhatsApp</a>
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
        </div>
      </section>
      {s.updated_at ? <p className="trk-upd">Posledná aktualizácia {fShort(new Date(s.updated_at).getTime())}</p> : null}

      {lb && (
        <div className="trk-lb" role="dialog" aria-modal="true" aria-label="Fotka" onClick={(e) => e.target === e.currentTarget && setLb(null)}>
          <button className="x" type="button" onClick={() => setLb(null)} autoFocus>Zavrieť</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lb.photos[lb.i]} alt={lb.cap} />
          <p>{lb.cap} · {lb.i + 1} z {lb.photos.length}</p>
          {lb.photos.length > 1 && (
            <div className="nav2">
              <button type="button" onClick={() => setLb({ ...lb, i: (lb.i - 1 + lb.photos.length) % lb.photos.length })}>Predchádzajúca</button>
              <button type="button" onClick={() => setLb({ ...lb, i: (lb.i + 1) % lb.photos.length })}>Ďalšia</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
