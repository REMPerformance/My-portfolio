"use client";
import { useMemo, useState } from "react";

export type Stats = {
  days: number; since: string;
  visitors: number; views: number; prev_visitors: number; prev_views: number;
  bounce: number; pages_per_visit: number; avg_dur: number;
  leads: number; prev_leads: number;
  today_visitors: number; today_views: number; live: number; bots: number;
  live_list: { id: string; path: string; ts: string; country: string | null; city: string | null; device: string | null; ref: string | null }[];
  daily: { d: string; v: number; p: number; l: number }[];
  hours: { h: number; v: number }[];
  heat: { w: number; h: number; v: number }[];
  weekdays: { w: number; v: number }[];
  pages: { path: string; v: number; p: number; dur: number; entries: number; exits: number }[];
  channels: { ch: string; v: number }[];
  referrers: { ref: string; v: number }[];
  campaigns: { src: string; medium: string | null; camp: string | null; v: number }[];
  countries: { c: string; v: number }[];
  cities: { city: string; c: string; v: number }[];
  devices: { d: string; v: number }[];
  browsers: { b: string; v: number }[];
  systems: { o: string; v: number }[];
  cars: { slug: string; label: string; status: string; v: number; p: number; dur: number; leads: number }[];
  journeys: {
    id: string; t0: string; country: string | null; city: string | null; device: string | null; browser: string | null;
    src: string | null; pv: number; dur: number; lead: boolean; pages: { p: string; t: string; d: number | null }[];
  }[];
};
export type Filter = { country: string | null; device: string | null };

const TZ = "Europe/Bratislava";
const WD = ["Po", "Ut", "St", "Št", "Pi", "So", "Ne"];
const WD_LONG = ["pondelok", "utorok", "streda", "štvrtok", "piatok", "sobota", "nedeľa"];
const num = (n: number) => (n || 0).toLocaleString("sk-SK");
const regionNames = typeof Intl !== "undefined" && "DisplayNames" in Intl ? new Intl.DisplayNames(["sk"], { type: "region" }) : null;
export function countryName(c: string | null) {
  if (!c || c === "?") return "Neznáma krajina";
  try { return regionNames?.of(c) || c; } catch { return c; }
}
export function dur(s: number) {
  if (!s) return "bez údaja";
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60), r = s % 60;
  return m < 60 ? `${m} min${r ? ` ${r} s` : ""}` : `${Math.floor(m / 60)} h ${m % 60} min`;
}
const time = (t: string) => new Date(t).toLocaleTimeString("sk-SK", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
const dayTime = (t: string) => new Date(t).toLocaleString("sk-SK", { timeZone: TZ, day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" });
const shortDay = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("sk-SK", { day: "numeric", month: "numeric" });
const ago = (t: string) => {
  const s = Math.max(0, Math.round((Date.now() - new Date(t).getTime()) / 1000));
  return s < 60 ? "práve teraz" : `pred ${Math.round(s / 60)} min`;
};

function Delta({ now, prev }: { now: number; prev: number }) {
  if (!prev) return <em className="tdelta">bez porovnania</em>;
  const p = Math.round(((now - prev) / prev) * 100);
  return <em className={`tdelta ${p > 0 ? "up" : p < 0 ? "down" : ""}`}>{p > 0 ? "+" : ""}{p} % oproti predošlému obdobiu</em>;
}

function Bars({ rows, onPick, active }: { rows: { key: string; label: string; v: number }[]; onPick?: (k: string) => void; active?: string | null }) {
  const total = rows.reduce((a, r) => a + r.v, 0) || 1;
  const max = Math.max(1, ...rows.map((r) => r.v));
  if (!rows.length) return <p className="note" style={{ marginTop: 0 }}>Zatiaľ žiadne údaje.</p>;
  return (
    <div className="trows">
      {rows.map((r) => {
        const inner = (
          <>
            <span className="trow__l">{r.label}</span>
            <span className="trow__bar"><i style={{ width: `${(r.v / max) * 100}%` }} /></span>
            <b>{num(r.v)}</b>
            <small>{Math.round((r.v / total) * 100)} %</small>
          </>
        );
        return onPick
          ? <button type="button" key={r.key} className={`trow is-btn${active === r.key ? " on" : ""}`} onClick={() => onPick(r.key)} title="Kliknutím zobrazíte len tieto návštevy">{inner}</button>
          : <div key={r.key} className="trow">{inner}</div>;
      })}
    </div>
  );
}

const TABS = [
  { id: "prehlad", label: "Prehľad" },
  { id: "kedy", label: "Kedy chodia" },
  { id: "odkial", label: "Odkiaľ chodia" },
  { id: "stranky", label: "Stránky a autá" },
  { id: "navstevy", label: "Jednotlivé návštevy" }
] as const;
type Tab = (typeof TABS)[number]["id"];

export function TrafficView({ s, filter, setFilter }: { s: Stats; filter: Filter; setFilter: (f: Filter) => void }) {
  const [tab, setTab] = useState<Tab>("prehlad");
  const maxDay = Math.max(1, ...s.daily.map((x) => x.v));
  const conv = s.visitors ? (s.leads / s.visitors) * 100 : 0;

  const heat = useMemo(() => {
    const m = new Map(s.heat.map((x) => [`${x.w}-${x.h}`, x.v]));
    const max = Math.max(1, ...s.heat.map((x) => x.v));
    return { m, max };
  }, [s.heat]);
  const bestHour = [...s.hours].sort((a, b) => b.v - a.v)[0];
  const bestDay = [...s.weekdays].sort((a, b) => b.v - a.v)[0];
  const hoursFull = Array.from({ length: 24 }, (_, h) => s.hours.find((x) => x.h === h)?.v || 0);
  const maxHour = Math.max(1, ...hoursFull);
  const labelEvery = s.daily.length > 60 ? 14 : s.daily.length > 20 ? 5 : 1;

  return (
    <>
      <div className="tstats tstats--6">
        <div className="panel"><small>Práve na webe</small><b className="live">{num(s.live)}</b><span>za posledných 5 minút</span></div>
        <div className="panel"><small>Dnes</small><b>{num(s.today_visitors)}</b><span>{num(s.today_views)} zobrazení stránok</span></div>
        <div className="panel"><small>Návštevy</small><b>{num(s.visitors)}</b><Delta now={s.visitors} prev={s.prev_visitors} /></div>
        <div className="panel"><small>Zobrazenia stránok</small><b>{num(s.views)}</b><Delta now={s.views} prev={s.prev_views} /></div>
        <div className="panel"><small>Dopyty</small><b>{num(s.leads)}</b><span>{s.visitors ? `${conv.toLocaleString("sk-SK", { maximumFractionDigits: 1 })} % návštev poslalo dopyt` : "zatiaľ žiadne návštevy"}</span></div>
        <div className="panel"><small>Zapojenie</small><b>{s.pages_per_visit.toLocaleString("sk-SK")}</b><span>stránky na návštevu, {s.bounce} % odišlo po prvej</span></div>
      </div>

      <div className="ttabs" role="tablist">
        {TABS.map((t) => <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={tab === t.id ? "on" : ""} onClick={() => setTab(t.id)}>{t.label}</button>)}
      </div>

      {tab === "prehlad" && (
        <>
          {s.live_list.length > 0 && (
            <div className="panel">
              <h2>Kto je práve na webe</h2>
              <div className="tlive">
                {s.live_list.map((v) => (
                  <div key={v.id + v.ts}>
                    <i className="dot" />
                    <a href={v.path} target="_blank" rel="noopener">{v.path}</a>
                    <span>{[v.city, countryName(v.country)].filter(Boolean).join(", ")}</span>
                    <span>{v.device || "neznáme zariadenie"}</span>
                    <span>{v.ref ? `z ${v.ref}` : "priamo"}</span>
                    <small>{ago(v.ts)}</small>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="panel">
            <h2>Návštevy po dňoch</h2>
            <div className="tchart" role="img" aria-label="Graf návštev po dňoch">
              {s.daily.map((x) => (
                <div key={x.d} className="tbar" title={`${new Date(x.d + "T12:00:00").toLocaleDateString("sk-SK", { weekday: "long", day: "numeric", month: "long" })}: ${x.v} návštev, ${x.p} zobrazení${x.l ? `, ${x.l} dopytov` : ""}`}>
                  {x.l > 0 && <u>{x.l}</u>}
                  <i style={{ height: `${(x.v / maxDay) * 100}%` }} />
                </div>
              ))}
            </div>
            <div className="tchart__days">
              {s.daily.map((x, i) => <span key={x.d}>{i % labelEvery === 0 || i === s.daily.length - 1 ? shortDay(x.d) : ""}</span>)}
            </div>
            <p className="note">Stĺpec je počet návštev za deň. Červené číslo nad stĺpcom je počet dopytov v ten deň.</p>
          </div>
          <div className="tgrid tgrid--3">
            <div className="panel"><h2>Zdroje návštev</h2><Bars rows={s.channels.map((c) => ({ key: c.ch, label: c.ch, v: c.v }))} /></div>
            <div className="panel"><h2>Krajiny</h2><Bars rows={s.countries.slice(0, 6).map((c) => ({ key: c.c, label: countryName(c.c), v: c.v }))} active={filter.country} onPick={(k) => setFilter({ ...filter, country: filter.country === k ? null : k })} /></div>
            <div className="panel"><h2>Zariadenia</h2><Bars rows={s.devices.map((d) => ({ key: d.d, label: d.d === "?" ? "neznáme" : d.d, v: d.v }))} active={filter.device} onPick={(k) => setFilter({ ...filter, device: filter.device === k ? null : k })} /></div>
          </div>
        </>
      )}

      {tab === "kedy" && (
        <>
          <div className="panel">
            <h2>Kedy ľudia chodia na web</h2>
            {s.visitors === 0 ? <p className="note" style={{ marginTop: 0 }}>Zatiaľ žiadne údaje.</p> : (
              <>
                <p className="tlead">
                  {bestDay ? <>Najsilnejší deň je <b>{WD_LONG[bestDay.w - 1]}</b>. </> : null}
                  {bestHour ? <>Najviac ľudí prichádza medzi <b>{bestHour.h}:00 a {bestHour.h + 1}:00</b>.</> : null}
                </p>
                <div className="theat" role="img" aria-label="Návštevy podľa dňa v týždni a hodiny">
                  <div className="theat__h"><span />{Array.from({ length: 24 }, (_, h) => <span key={h}>{h % 3 === 0 ? h : ""}</span>)}</div>
                  {WD.map((w, wi) => (
                    <div key={w} className="theat__r">
                      <span>{w}</span>
                      {Array.from({ length: 24 }, (_, h) => {
                        const v = heat.m.get(`${wi + 1}-${h}`) || 0;
                        return <i key={h} style={{ opacity: v ? 0.18 + 0.82 * (v / heat.max) : undefined }} className={v ? "on" : ""} title={`${WD_LONG[wi]} ${h}:00 až ${h + 1}:00: ${v} návštev`} />;
                      })}
                    </div>
                  ))}
                </div>
                <p className="note">Čím sýtejšie políčko, tým viac návštev. Časy sú v slovenskom čase.</p>
              </>
            )}
          </div>
          <div className="tgrid">
            <div className="panel">
              <h2>Návštevy podľa hodiny</h2>
              <div className="tchart tchart--sm">
                {hoursFull.map((v, h) => <div key={h} className="tbar" title={`${h}:00 až ${h + 1}:00: ${v} návštev`}><i style={{ height: `${(v / maxHour) * 100}%` }} /></div>)}
              </div>
              <div className="tchart__days">{hoursFull.map((_, h) => <span key={h}>{h % 3 === 0 ? `${h}:00` : ""}</span>)}</div>
            </div>
            <div className="panel">
              <h2>Návštevy podľa dňa v týždni</h2>
              <Bars rows={WD.map((w, i) => ({ key: w, label: WD_LONG[i], v: s.weekdays.find((x) => x.w === i + 1)?.v || 0 }))} />
            </div>
          </div>
        </>
      )}

      {tab === "odkial" && (
        <>
          <div className="tgrid">
            <div className="panel">
              <h2>Typ zdroja</h2>
              <Bars rows={s.channels.map((c) => ({ key: c.ch, label: c.ch, v: c.v }))} />
              <h2 style={{ marginTop: 26 }}>Konkrétne weby a odkazy</h2>
              <Bars rows={s.referrers.map((r) => ({ key: r.ref, label: r.ref, v: r.v }))} />
            </div>
            <div className="panel">
              <h2>Krajiny</h2>
              <Bars rows={s.countries.map((c) => ({ key: c.c, label: countryName(c.c), v: c.v }))} active={filter.country} onPick={(k) => setFilter({ ...filter, country: filter.country === k ? null : k })} />
              <h2 style={{ marginTop: 26 }}>Mestá</h2>
              <Bars rows={s.cities.map((c) => ({ key: c.city + c.c, label: `${c.city} (${c.c})`, v: c.v }))} />
              <p className="note">Mesto sa určuje približne podľa pripojenia a meria sa až od tejto verzie. IP adresy sa neukladajú.</p>
            </div>
          </div>
          <div className="panel">
            <h2>Kampane a označené odkazy</h2>
            {s.campaigns.length === 0
              ? <p className="note" style={{ marginTop: 0 }}>Zatiaľ žiadne. Keď dáte odkaz do príspevku alebo inzerátu, pridajte na koniec napríklad <code>?utm_source=facebook&amp;utm_campaign=bmw-m3</code> a tu uvidíte, koľko ľudí z neho prišlo.</p>
              : (
                <div className="tscroll"><table className="ttable"><thead><tr><th>Zdroj</th><th>Typ</th><th>Kampaň</th><th>Návštevy</th></tr></thead>
                  <tbody>{s.campaigns.map((c, i) => <tr key={i}><td>{c.src}</td><td>{c.medium || "neuvedené"}</td><td>{c.camp || "neuvedené"}</td><td>{num(c.v)}</td></tr>)}</tbody></table></div>
              )}
          </div>
          <div className="tgrid tgrid--3">
            <div className="panel"><h2>Zariadenia</h2><Bars rows={s.devices.map((d) => ({ key: d.d, label: d.d === "?" ? "neznáme" : d.d, v: d.v }))} active={filter.device} onPick={(k) => setFilter({ ...filter, device: filter.device === k ? null : k })} /></div>
            <div className="panel"><h2>Prehliadače</h2><Bars rows={s.browsers.map((b) => ({ key: b.b, label: b.b, v: b.v }))} /></div>
            <div className="panel"><h2>Systémy</h2><Bars rows={s.systems.map((o) => ({ key: o.o, label: o.o, v: o.v }))} /></div>
          </div>
        </>
      )}

      {tab === "stranky" && (
        <>
          <div className="panel">
            <h2>Záujem o autá</h2>
            {s.cars.length === 0 ? <p className="note" style={{ marginTop: 0 }}>V tomto období si nikto neotvoril detail auta.</p> : (
              <div className="tscroll"><table className="ttable ttable--wide"><thead><tr><th>Auto</th><th>Návštevy</th><th>Zobrazenia</th><th>Čas na stránke</th><th>Dopyty</th><th>Úspešnosť</th></tr></thead>
                <tbody>{s.cars.map((c) => (
                  <tr key={c.slug}>
                    <td><a href={`/auta/${c.slug}`} target="_blank" rel="noopener">{c.label}</a>{c.status !== "published" ? <small className="tmuted"> ({c.status === "sold" ? "predané" : c.status})</small> : null}</td>
                    <td>{num(c.v)}</td><td>{num(c.p)}</td><td>{dur(c.dur)}</td><td>{num(c.leads)}</td>
                    <td>{c.v ? `${((c.leads / c.v) * 100).toLocaleString("sk-SK", { maximumFractionDigits: 1 })} %` : "0 %"}</td>
                  </tr>
                ))}</tbody></table></div>
            )}
            <p className="note">Úspešnosť je podiel návštev detailu auta, ktoré skončili dopytom. Auto s veľa návštevami a bez dopytu má pravdepodobne problém s cenou alebo fotkami.</p>
          </div>
          <div className="panel">
            <h2>Všetky stránky</h2>
            <div className="tscroll"><table className="ttable ttable--wide"><thead><tr><th>Stránka</th><th>Návštevy</th><th>Zobrazenia</th><th>Čas na stránke</th><th>Vstupy</th><th>Odchody</th></tr></thead>
              <tbody>{s.pages.map((p) => <tr key={p.path}><td><a href={p.path} target="_blank" rel="noopener">{p.path}</a></td><td>{num(p.v)}</td><td>{num(p.p)}</td><td>{dur(p.dur)}</td><td>{num(p.entries)}</td><td>{num(p.exits)}</td></tr>)}</tbody></table></div>
            <p className="note">Vstupy sú návštevy, ktoré touto stránkou začali. Odchody sú návštevy, ktoré na nej skončili. Čas na stránke sa meria až od tejto verzie.</p>
          </div>
        </>
      )}

      {tab === "navstevy" && (
        <div className="panel">
          <h2>Posledné návštevy krok za krokom</h2>
          {s.journeys.length === 0 ? <p className="note" style={{ marginTop: 0 }}>Zatiaľ žiadne návštevy.</p> : (
            <div className="tjour">
              {s.journeys.map((j) => (
                <div key={j.id + j.t0} className={j.lead ? "is-lead" : ""}>
                  <div className="tjour__h">
                    <b>{dayTime(j.t0)}</b>
                    <span>{[j.city, countryName(j.country)].filter(Boolean).join(", ")}</span>
                    <span>{[j.device, j.browser].filter(Boolean).join(", ") || "neznáme zariadenie"}</span>
                    <span>{j.src ? `prišiel z ${j.src}` : "prišiel priamo"}</span>
                    <span>{j.pv} {j.pv === 1 ? "stránka" : j.pv < 5 ? "stránky" : "stránok"}{j.dur ? `, ${dur(j.dur)}` : ""}</span>
                    {j.lead && <em>poslal dopyt</em>}
                  </div>
                  <ol>
                    {j.pages.map((p, i) => <li key={i}><small>{time(p.t)}</small><a href={p.p} target="_blank" rel="noopener">{p.p}</a>{p.d ? <small>{dur(p.d)}</small> : null}</li>)}
                    {j.pv > j.pages.length && <li><small>a ďalších {j.pv - j.pages.length}</small></li>}
                  </ol>
                </div>
              ))}
            </div>
          )}
          <p className="note">Návštevníci sú anonymní. Označenie sa každý deň mení, takže toho istého človeka na druhý deň už nespoznáme.</p>
        </div>
      )}

      <p className="note">Počítajú sa len skutoční ľudia. Roboti, vyhľadávače a náhľady odkazov sú odfiltrované ({num(s.bots)} zobrazení v tomto období). Meranie je bez cookies.</p>
    </>
  );
}
