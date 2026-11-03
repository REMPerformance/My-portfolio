"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SITE } from "@/lib/site";
import { PHASES, PHASE_STATE, PORTS_FROM, PORTS_TO, fLong, fShort, legProgress, plDays, resolve, routeOf, splitRoute, type Shipment } from "@/lib/tracking";
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
  const updates = [...(s.updates || [])].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

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
            const when = st === "done" ? (lastDone ? fShort(lastDone) : "hotovo") : st === "cur" ? "prebieha" : firstStart ? `odhad ${fShort(firstStart)}` : "termín upresníme";
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
        <div className="trk-box trk-date"><span className="trk-lbl">Ďalší krok</span><strong>{next ? next.t : "Hotovo"}</strong><div className="when"><span>predpoklad</span><b>{next?.start ? fLong(next.start) : next ? "upresníme" : ""}</b></div></div>
        <div className="trk-box trk-date eta"><span className="trk-lbl">Odhad prevzatia</span><strong className="big">{eta ? fLong(eta) : "Upresníme"}</strong><div className="when"><span>{etaDays !== null && etaDays > 0 ? `približne o ${etaDays} ${plDays(etaDays)}` : eta ? fShort(eta) : "po nakládke na loď"}</span></div></div>
      </div>

      <section className="trk-box trk-mapcard">
        <div className="trk-h"><h2>Poloha lode</h2></div>
        <div className="trk-mapgrid">
          <div className="trk-map dark"><TrackMap from={s.port_from} to={s.port_to} sea={leg.sea} post={leg.post} /></div>
          <div className="trk-facts">
            <div className="trk-voy">
              <span className="trk-lbl">Plavba</span>
              <span className="big">{leg.sea >= 1 ? "Ukončená" : leg.sea > 0 ? `${Math.round(leg.sea * 100)} %` : "Čaká na nakládku"}</span>
              <div className="track"><i style={{ width: `${Math.round(leg.sea * 100)}%` }} /></div>
              <div className="row"><span>{route.a.n}</span><span className="mono">{leg.sea > 0 && leg.sea < 1 ? `zostáva ${Math.round(sp.L * (1 - leg.sea)).toLocaleString("sk-SK")} nm` : `${Math.round(sp.L).toLocaleString("sk-SK")} nm`}</span><span>{route.b.n}</span></div>
            </div>
            <div className="trk-fact"><span>Loď</span><b>{s.vessel || "Upresníme po nakládke"}</b></div>
            <div className="trk-fact"><span>Trasa</span><b>{PORTS_FROM[s.port_from]?.n} → {PORTS_TO[s.port_to]?.n}</b></div>
            <div className="trk-fact"><span>{seaStep?.doneAt || (seaStep?.start && seaStep.start <= now) ? "Odplávanie" : "Plánované odplávanie"}</span><b className="mono">{seaStep?.start ? fShort(seaStep.start) : "upresníme"}</b></div>
            <div className="trk-fact"><span>Predpokladaný prílev</span><b className="mono">{seaStep?.doneAt ? fShort(seaStep.doneAt) : seaStep?.end ? fShort(seaStep.end - 864e5) : "upresníme"}</b></div>
          </div>
        </div>
      </section>

      <section className="trk-box">
        <div className="trk-h"><h2>Aktualizácie z cesty</h2>{s.email_masked ? <span className="trk-mailnote">Aktualizácie posielame aj na <b>{s.email_masked}</b></span> : null}</div>
        {updates.length ? (
          <div className="trk-feed">
            {updates.map((u, k) => {
              const d = new Date(u.created_at), t = s.milestones[u.step]?.t || "Aktualizácia";
              return (
                <article className="trk-up" key={u.created_at + k}>
                  <div className="when"><b>{fLong(d.getTime())}</b><span>{d.getFullYear()}</span></div>
                  <div><h3>{t}</h3>{u.text ? <p>{u.text}</p> : null}{thumbs(u.photos || [], t, 8)}</div>
                </article>
              );
            })}
          </div>
        ) : <div className="trk-empty">Prvé fotky a správy z cesty sa tu zobrazia, keď vozidlo prevezme náš agent v prístave.</div>}
      </section>

      <section className="trk-box">
        <div className="trk-h"><h2>Priebeh dovozu</h2><span className="trk-lbl mono">{R.pct} % hotovo</span></div>
        <div className="trk-plist">
          {R.vis.map((m, k) => {
            const range = m.start !== null && m.end !== null && m.end - m.start > 864e5;
            const when = m.st === "done" ? (m.doneAt ? fShort(m.doneAt) : "") : m.st === "cur" ? (range ? `${fShort(m.start!)} až ${fShort(m.end! - 864e5)}` : m.start ? fShort(m.start) : "prebieha") : m.start ? `odhad ${fShort(m.start)}` : "termín upresníme";
            const ph = (s.updates || []).filter((u) => u.step === m.i).flatMap((u) => u.photos || []);
            return (
              <article className={`trk-pm ${m.st}`} key={m.i} style={{ ["--d" as string]: `${k * 0.04}s` }}>
                <div className="hd"><span className="no">{String(k + 1).padStart(2, "0")}</span><span className="st"><i />{{ done: "Dokončené", cur: "Prebieha", next: "Plánované" }[m.st]}</span></div>
                <h3>{m.t}</h3>
                <p>{m.d}</p>
                {thumbs(ph, m.t, 3)}
                {m.st === "cur" && range ? <div className="mini"><i style={{ width: `${Math.round(m.p * 100)}%` }} /></div> : null}
                <time>{when}</time>
              </article>
            );
          })}
        </div>
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
