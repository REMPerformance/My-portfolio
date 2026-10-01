"use client";
import { useEffect, useState } from "react";
import { browserClient } from "@/lib/supabase";
import { useAdmin } from "@/components/admin/AdminApp";

type Stats = {
  visitors: number; views: number; today_visitors: number; today_views: number; live: number; bots: number;
  daily: { d: string; v: number; p: number }[];
  pages: { path: string; v: number; p: number }[];
  referrers: { ref: string; v: number }[];
  countries: { c: string; v: number }[];
  devices: { d: string; v: number }[];
};
const COUNTRY: Record<string, string> = { SK: "Slovensko", CZ: "Česko", HU: "Maďarsko", AT: "Rakúsko", PL: "Poľsko", DE: "Nemecko", US: "USA", GB: "V. Británia", UA: "Ukrajina", "?": "Neznáme" };
const num = (n: number) => n.toLocaleString("sk-SK");

export default function Traffic() {
  const { toast } = useAdmin();
  const [days, setDays] = useState(30);
  const [s, setS] = useState<Stats | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => browserClient().rpc("traffic_stats", { p_days: days }).then(({ data, error }) => {
      if (!alive) return;
      if (error) toast(error.message, true); else setS(data as Stats);
    });
    load();
    const t = setInterval(load, 60000);
    return () => { alive = false; clearInterval(t); };
  }, [days, toast]);

  // doplnenie chýbajúcich dní nulami
  const series = (() => {
    if (!s) return [];
    const m = new Map(s.daily.map((x) => [x.d, x]));
    const out: { d: string; v: number; p: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const dt = new Date(Date.now() - i * 864e5); const k = dt.toLocaleDateString("sv-SE", { timeZone: "Europe/Bratislava" });
      out.push(m.get(k) || { d: k, v: 0, p: 0 });
    }
    return out;
  })();
  const max = Math.max(1, ...series.map((x) => x.v));
  const totalDev = s ? s.devices.reduce((a, x) => a + x.v, 0) || 1 : 1;

  return (
    <>
      <div className="adm__head">
        <h1>Návštevnosť</h1>
        <div className="tseg">
          {[7, 30, 90].map((d) => <button key={d} type="button" className={days === d ? "on" : ""} onClick={() => setDays(d)}>{d} dní</button>)}
        </div>
      </div>
      <p className="note" style={{ marginTop: -6 }}>Skutoční ľudia – boti, vyhľadávače, náhľady odkazov a automatické nástroje sú odfiltrované. Meranie je bez cookies, každý návštevník sa počíta raz za deň.</p>
      {!s ? <div className="panel">Načítavam…</div> : (
        <>
          <div className="tstats">
            <div className="panel"><small>Práve na webe</small><b className="live">{num(s.live)}</b><span>za posledných 5 min</span></div>
            <div className="panel"><small>Dnes</small><b>{num(s.today_visitors)}</b><span>ľudí · {num(s.today_views)} zobrazení</span></div>
            <div className="panel"><small>Za {days} dní</small><b>{num(s.visitors)}</b><span>návštev · {num(s.views)} zobrazení</span></div>
            <div className="panel"><small>Odfiltrovaní boti</small><b className="dim">{num(s.bots)}</b><span>zobrazení za {days} dní</span></div>
          </div>

          <div className="panel">
            <h2>Návštevníci po dňoch</h2>
            <div className="tchart" role="img" aria-label="Graf návštevníkov po dňoch">
              {series.map((x) => (
                <div key={x.d} className="tbar" title={`${new Date(x.d).toLocaleDateString("sk-SK")}: ${x.v} ľudí, ${x.p} zobrazení`}>
                  <i style={{ height: `${(x.v / max) * 100}%` }} />
                </div>
              ))}
            </div>
            <div className="tchart__x"><span>{series[0] && new Date(series[0].d).toLocaleDateString("sk-SK")}</span><span>dnes</span></div>
          </div>

          <div className="tgrid">
            <div className="panel">
              <h2>Najnavštevovanejšie stránky</h2>
              <table className="ttable"><thead><tr><th>Stránka</th><th>Ľudia</th><th>Zobrazenia</th></tr></thead>
                <tbody>{s.pages.map((p) => <tr key={p.path}><td><a href={p.path} target="_blank" rel="noopener">{p.path}</a></td><td>{num(p.v)}</td><td>{num(p.p)}</td></tr>)}</tbody></table>
            </div>
            <div className="panel">
              <h2>Odkiaľ prišli</h2>
              <table className="ttable"><tbody>{s.referrers.map((r) => <tr key={r.ref}><td>{r.ref}</td><td>{num(r.v)}</td></tr>)}</tbody></table>
              <h2 style={{ marginTop: 22 }}>Zariadenia</h2>
              {s.devices.map((d) => (
                <div key={d.d} className="tdev"><span>{d.d}</span><div><i style={{ width: `${(d.v / totalDev) * 100}%` }} /></div><b>{Math.round((d.v / totalDev) * 100)} %</b></div>
              ))}
              <h2 style={{ marginTop: 22 }}>Krajiny</h2>
              <table className="ttable"><tbody>{s.countries.map((c) => <tr key={c.c}><td>{COUNTRY[c.c] || c.c}</td><td>{num(c.v)}</td></tr>)}</tbody></table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
