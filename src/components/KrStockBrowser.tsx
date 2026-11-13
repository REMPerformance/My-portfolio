"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { eur, num } from "@/lib/format";
import { Flag } from "./Flag";
import { SpecIcon } from "./Icons";
import type { KrCar } from "@/lib/krStockData";

const PRICES = [15000, 20000, 25000, 30000, 35000, 40000, 50000, 60000, 80000];
const SORTS = [
  { v: "new", l: "Najnovšie ročníky" },
  { v: "cheap", l: "Najlacnejšie" },
  { v: "exp", l: "Najdrahšie" },
  { v: "km", l: "Najmenej najazdené" }
];
const STEP = 24;
const EMPTY = { q: "", make: "", model: "", fuel: "", ymin: "", kmax: "", pmax: "", sort: "new" };
type F = typeof EMPTY;

export function KrStockBrowser({ cars }: { cars: KrCar[] }) {
  const [f, setF] = useState<F>(EMPTY);
  const [shown, setShown] = useState(STEP);
  const set = (k: keyof F, v: string) => { setShown(STEP); setF((o) => ({ ...o, [k]: v, ...(k === "make" ? { model: "" } : {}) })); };

  const opts = useMemo(() => {
    const cnt = (xs: (string | null)[]) => [...xs.reduce((m, x) => (x ? m.set(x, (m.get(x) || 0) + 1) : m), new Map<string, number>())].sort((a, b) => a[0].localeCompare(b[0], "sk"));
    return {
      makes: cnt(cars.map((c) => c.make)),
      models: cnt(cars.filter((c) => !f.make || c.make === f.make).map((c) => c.model)),
      fuels: cnt(cars.map((c) => c.fuel))
    };
  }, [cars, f.make]);

  const list = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    const out = cars.filter((c) =>
      (!f.make || c.make === f.make) && (!f.model || c.model === f.model) && (!f.fuel || c.fuel === f.fuel) &&
      (!f.ymin || (c.year || 0) >= Number(f.ymin)) && (!f.kmax || (c.km ?? Infinity) <= Number(f.kmax)) && (!f.pmax || c.price <= Number(f.pmax)) &&
      (!q || [c.make, c.model, c.trim, c.year].join(" ").toLowerCase().includes(q)));
    const by: Record<string, (a: KrCar, b: KrCar) => number> = {
      new: (a, b) => (b.year || 0) - (a.year || 0) || a.price - b.price,
      cheap: (a, b) => a.price - b.price,
      exp: (a, b) => b.price - a.price,
      km: (a, b) => (a.km ?? 1e9) - (b.km ?? 1e9)
    };
    return out.sort(by[f.sort] || by.new);
  }, [cars, f]);

  const any = Object.entries(f).some(([k, v]) => k !== "sort" && v);
  const sel = (k: keyof F, label: string, items: [string, number][], all: string) => (
    <div className="field">
      <label htmlFor={`kr-${k}`}>{label}</label>
      <select id={`kr-${k}`} className="input" value={f[k]} onChange={(e) => set(k, e.target.value)}>
        <option value="">{all}</option>
        {items.map(([v, n]) => <option key={v} value={v}>{v} ({n})</option>)}
      </select>
    </div>
  );

  return (
    <div>
      <div className="fbar open" role="search" aria-label="Filtre ponuky z Kórey">
        <div className="field fb-q">
          <label htmlFor="kr-q">Hľadať</label>
          <input id="kr-q" className="input" type="search" placeholder="Značka, model, výbava…" value={f.q} onChange={(e) => set("q", e.target.value)} />
        </div>
        {sel("make", "Značka", opts.makes, "Všetky značky")}
        {sel("model", "Model", opts.models, "Všetky modely")}
        <div className="field">
          <label htmlFor="kr-pmax">Cena do</label>
          <select id="kr-pmax" className="input" value={f.pmax} onChange={(e) => set("pmax", e.target.value)}>
            <option value="">Bez limitu</option>
            {PRICES.map((p) => <option key={p} value={p}>{eur(p)}</option>)}
          </select>
        </div>
      </div>
      <div className="fmore">
        {sel("fuel", "Palivo", opts.fuels, "Všetky")}
        <div className="field">
          <label htmlFor="kr-ymin">Rok výroby od</label>
          <input id="kr-ymin" className="input" type="number" inputMode="numeric" placeholder="napr. 2020" value={f.ymin} onChange={(e) => set("ymin", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="kr-kmax">Najazdené do (km)</label>
          <input id="kr-kmax" className="input" type="number" inputMode="numeric" step={10000} placeholder="napr. 80000" value={f.kmax} onChange={(e) => set("kmax", e.target.value)} />
        </div>
      </div>

      <div className="btoolbar">
        <span className="bcount"><b>{num(list.length)}</b> {list.length === 1 ? "auto" : list.length > 1 && list.length < 5 ? "autá" : "áut"} ihneď k odberu</span>
        {any && <button type="button" className="linkbtn" onClick={() => { setShown(STEP); setF({ ...EMPTY, sort: f.sort }); }}>Zrušiť filtre</button>}
        <label className="bsort">
          <span className="sr-only">Triedenie</span>
          <select className="input" value={f.sort} onChange={(e) => set("sort", e.target.value)}>
            {SORTS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
          </select>
        </label>
      </div>

      <div className="grid">
        {list.length ? list.slice(0, shown).map((c, i) => <KrCard key={c.id} car={c} eager={i < 3} />) : (
          <div className="empty">Týmto filtrom nezodpovedá žiadne auto. <button type="button" className="linkbtn" onClick={() => setF({ ...EMPTY })}>Zrušiť filtre</button> alebo <Link href="/auto-na-mieru">nám napíšte, čo hľadáte</Link>.</div>
        )}
      </div>
      {list.length > shown && (
        <p style={{ textAlign: "center", marginTop: 24 }}>
          <button type="button" className="rc-btn rc-btn--ghost" onClick={() => setShown((s) => s + STEP * 2)}>Zobraziť ďalšie ({num(list.length - shown)})</button>
        </p>
      )}
    </div>
  );
}

function KrCard({ car, eager }: { car: KrCar; eager: boolean }) {
  const name = [car.year, car.make, car.model].filter(Boolean).join(" ");
  return (
    <article className="car">
      <Link href={`/ihned-z-korey/${encodeURIComponent(car.id)}`} aria-label={`${name} ${car.trim ?? ""} – detail`} style={{ display: "contents" }}>
        <div className="car__img">
          {car.photos[0]
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={car.photos[0]} alt={`${name} ${car.trim ?? ""}`} loading={eager ? "eager" : "lazy"} decoding="async" referrerPolicy="no-referrer" />
            : <span className="kr-nophoto">Fotky na vyžiadanie</span>}
          <span className="car__flag" title="Pôvod: Južná Kórea"><Flag code="KR" /></span>
          <div className="car__tags"><span className="tag tag--good">Ihneď k odberu</span></div>
        </div>
        <div className="car__body">
          <div className="car__status">
            <span className="ok"><SpecIcon k="check" />Skladom v Kórei</span>
            <span className="muted"><SpecIcon k="pin" />{car.region ? `${car.region}, ` : ""}Južná Kórea</span>
          </div>
          <h3 className="car__title">{name}{car.trim && <small>{car.trim}</small>}</h3>
          <div className="car__price">
            <b>{eur(car.price)}</b>
            <small>orientačná cena so slovenskými značkami</small>
          </div>
          <div className="car__specs">
            <div><SpecIcon k="year" /><span>{car.year ?? "—"}</span></div>
            <div><SpecIcon k="km" /><span>{car.km ? `${num(car.km)} km` : "—"}</span></div>
            <div><SpecIcon k="gear" /><span>{car.gear || "—"}</span></div>
            <div><SpecIcon k="fuel" /><span>{car.fuel || "—"}</span></div>
          </div>
        </div>
      </Link>
    </article>
  );
}
