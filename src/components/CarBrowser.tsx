"use client";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CarCard, type CardCar } from "./CarCard";
import { carPhase, TYPE_SHORT, RUN_LABEL, eur } from "@/lib/format";
import { DAMAGE_ZONES, DAMAGE_FLAGS } from "@/lib/damage";
import { useNow } from "./Countdown";

type F = {
  make: string; model: string; type: string; pmin: string; pmax: string; ymin: string; ymax: string; kmax: string;
  fuel: string; drive: string; run: string; title: string; dmg: string; sale: string; status: string; sort: string;
};
const EMPTY: F = { make: "", model: "", type: "", pmin: "", pmax: "", ymin: "", ymax: "", kmax: "", fuel: "", drive: "", run: "", title: "", dmg: "", sale: "", status: "live", sort: "ending" };
const KEYS = Object.keys(EMPTY) as (keyof F)[];

const SORTS: { v: string; l: string }[] = [
  { v: "ending", l: "Uzávierka najskôr" },
  { v: "cheap", l: "Najlacnejšie" },
  { v: "expensive", l: "Najdrahšie" },
  { v: "saving", l: "Najväčšia úspora" },
  { v: "newest", l: "Najnovšie pridané" },
  { v: "km", l: "Najmenej km" },
  { v: "year", l: "Najnovší ročník" },
  { v: "popular", l: "Najviac záujemcov" }
];

const driveKey = (d: string | null) => {
  const s = (d || "").toUpperCase();
  if (/4X4|4WD/.test(s)) return "4x4";
  if (/AWD|XDRIVE|QUATTRO|4MATIC/.test(s)) return "AWD";
  if (/RWD|ZADN/.test(s)) return "RWD";
  if (/FWD|PREDN/.test(s)) return "FWD";
  return "";
};
const zoneGroup = (id: string) => DAMAGE_ZONES.find((z) => z.id === id)?.group || (DAMAGE_FLAGS.find((f) => f.id === id)?.label ?? "");
const carDamageGroups = (c: CardCar) => {
  const g = new Set<string>((c.damage_zones || []).map((z) => zoneGroup(z.zone)).filter(Boolean));
  if (!(c.damage_zones || []).length) g.add("Bez vyznačeného poškodenia");
  return g;
};
const uniq = (a: (string | null | undefined)[]) => [...new Set(a.filter(Boolean) as string[])].sort((x, y) => x.localeCompare(y, "sk"));

export function CarBrowser({ cars, serverNow }: { cars: CardCar[]; serverNow: number }) {
  const sp = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const [f, setF] = useState<F>(() => {
    const o = { ...EMPTY };
    KEYS.forEach((k) => { const v = sp.get(k); if (v !== null) o[k] = v; });
    return o;
  });
  const [open, setOpen] = useState(false);
  const now = useNow(15000) ?? serverNow;

  // URL sync (zdieľateľný odkaz na filter)
  useEffect(() => {
    const q = new URLSearchParams();
    KEYS.forEach((k) => { if (f[k] && f[k] !== EMPTY[k]) q.set(k, f[k]); });
    const s = q.toString();
    router.replace(s ? `${path}?${s}` : path, { scroll: false });
  }, [f, path, router]);

  const set = (k: keyof F, v: string) => setF((p) => ({ ...p, [k]: v, ...(k === "make" ? { model: "" } : {}) }));

  const opts = useMemo(() => ({
    makes: uniq(cars.map((c) => c.make)),
    models: uniq(cars.filter((c) => !f.make || c.make === f.make).map((c) => c.model)),
    fuels: uniq(cars.map((c) => c.fuel)),
    drives: uniq(cars.map((c) => driveKey(c.drive))),
    titles: uniq(cars.map((c) => c.title_type)),
    types: uniq(cars.map((c) => c.type)),
    dmg: uniq(cars.flatMap((c) => [...carDamageGroups(c)]))
  }), [cars, f.make]);

  const list = useMemo(() => {
    const n = (v: string) => (v === "" ? null : Number(v));
    const pmin = n(f.pmin), pmax = n(f.pmax), ymin = n(f.ymin), ymax = n(f.ymax), kmax = n(f.kmax);
    const r = cars.filter((c) => {
      const ph = carPhase(c, now);
      if (f.status === "live" && ph === "ended") return false;
      if (f.status === "open" && ph !== "open") return false;
      if (f.status === "ended" && ph !== "ended") return false;
      if (f.sale && (c.sale_type || "auction") !== f.sale) return false;
      if (f.make && c.make !== f.make) return false;
      if (f.model && c.model !== f.model) return false;
      if (f.type && c.type !== f.type) return false;
      if (pmin !== null && c.est.total < pmin) return false;
      if (pmax !== null && c.est.total > pmax) return false;
      if (ymin !== null && (c.year ?? 0) < ymin) return false;
      if (ymax !== null && (c.year ?? 9999) > ymax) return false;
      if (kmax !== null && (c.odometer_mi ?? 0) * 1.609344 > kmax) return false;
      if (f.fuel && c.fuel !== f.fuel) return false;
      if (f.drive && driveKey(c.drive) !== f.drive) return false;
      if (f.run && c.run_status !== f.run) return false;
      if (f.title && c.title_type !== f.title) return false;
      if (f.dmg && !carDamageGroups(c).has(f.dmg)) return false;
      return true;
    });
    const close = (c: CardCar) => Date.parse(c.order_close_at || c.auction_end_at || "") || Infinity;
    const cmp: Record<string, (a: CardCar, b: CardCar) => number> = {
      ending: (a, b) => {
        const rk = { open: 0, closed: 1, ended: 2 } as const;
        const ra = rk[carPhase(a, now)], rb = rk[carPhase(b, now)];
        return ra !== rb ? ra - rb : close(a) - close(b);
      },
      cheap: (a, b) => a.est.total - b.est.total,
      expensive: (a, b) => b.est.total - a.est.total,
      saving: (a, b) => ((b.sk_price_eur || 0) - b.est.total) - ((a.sk_price_eur || 0) - a.est.total),
      newest: (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at),
      km: (a, b) => (a.odometer_mi ?? 1e9) - (b.odometer_mi ?? 1e9),
      year: (a, b) => (b.year ?? 0) - (a.year ?? 0),
      popular: (a, b) => b.leads_count - a.leads_count
    };
    return r.sort(cmp[f.sort] || cmp.ending);
  }, [cars, f, now]);

  const active = KEYS.filter((k) => !["sort", "status"].includes(k) && f[k]).length;
  const priceMax = Math.max(0, ...cars.map((c) => c.est.total));

  const sel = (k: keyof F, label: string, options: { v: string; l: string }[]) => (
    <div className="field">
      <label htmlFor={`f-${k}`}>{label}</label>
      <select id={`f-${k}`} className="input" value={f[k]} onChange={(e) => set(k, e.target.value)}>
        <option value="">Všetko</option>
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );

  return (
    <div className="browser">
      <aside className={`fpanel${open ? " open" : ""}`} aria-label="Filtre">
        <div className="fpanel__head">
          <b>Filtre{active ? ` (${active})` : ""}</b>
          {active > 0 && <button type="button" className="linkbtn" onClick={() => setF({ ...EMPTY, sort: f.sort, status: f.status })}>Zrušiť filtre</button>}
          <button type="button" className="linkbtn fclose" onClick={() => setOpen(false)}>Zavrieť ✕</button>
        </div>
        <div className="field">
          <label htmlFor="f-status">Stav ponuky</label>
          <select id="f-status" className="input" value={f.status} onChange={(e) => set("status", e.target.value)}>
            <option value="live">Aktuálne</option>
            <option value="open">Len otvorené objednávky</option>
            <option value="ended">Skončené</option>
            <option value="all">Všetky</option>
          </select>
        </div>
        <div className="fchips" role="group" aria-label="Typ predaja">
          {[{ v: "", l: "Všetko" }, { v: "auction", l: "Aukcie" }, { v: "fixed", l: "Pevná cena" }].map((o) => (
            <button type="button" key={o.v || "all"} className={`chip${f.sale === o.v ? " active" : ""}`} aria-pressed={f.sale === o.v} onClick={() => set("sale", o.v)}>{o.l}</button>
          ))}
        </div>
        {sel("make", "Značka", opts.makes.map((m) => ({ v: m, l: m })))}
        {sel("model", "Model", opts.models.map((m) => ({ v: m, l: m })))}
        <div className="fchips" role="group" aria-label="Typ vozidla">
          <button type="button" className={`chip${!f.type ? " active" : ""}`} onClick={() => set("type", "")}>Všetky typy</button>
          {opts.types.map((t) => <button type="button" key={t} className={`chip${f.type === t ? " active" : ""}`} onClick={() => set("type", f.type === t ? "" : t)}>{TYPE_SHORT[t] || t}</button>)}
        </div>
        <div className="field">
          <label>Cena na SK značkách (€)</label>
          <div className="two tight">
            <input className="input" type="number" inputMode="numeric" placeholder="od" value={f.pmin} onChange={(e) => set("pmin", e.target.value)} />
            <input className="input" type="number" inputMode="numeric" placeholder={priceMax ? `do ${Math.ceil(priceMax / 1000)}k` : "do"} value={f.pmax} onChange={(e) => set("pmax", e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>Rok výroby</label>
          <div className="two tight">
            <input className="input" type="number" inputMode="numeric" placeholder="od" value={f.ymin} onChange={(e) => set("ymin", e.target.value)} />
            <input className="input" type="number" inputMode="numeric" placeholder="do" value={f.ymax} onChange={(e) => set("ymax", e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="f-kmax">Najazdené max. (km)</label>
          <input id="f-kmax" className="input" type="number" inputMode="numeric" step={10000} placeholder="napr. 100000" value={f.kmax} onChange={(e) => set("kmax", e.target.value)} />
        </div>
        {sel("dmg", "Poškodenie", opts.dmg.map((d) => ({ v: d, l: d })))}
        {sel("run", "Stav motora", Object.entries(RUN_LABEL).map(([v, l]) => ({ v, l })))}
        {sel("title", "Titul", opts.titles.map((t) => ({ v: t, l: t })))}
        {sel("fuel", "Palivo", opts.fuels.map((t) => ({ v: t, l: t })))}
        {sel("drive", "Pohon", opts.drives.map((t) => ({ v: t, l: t })))}
        <button type="button" className="rc-btn rc-btn--primary rc-btn--block fapply" onClick={() => setOpen(false)}>Zobraziť {list.length} áut</button>
      </aside>

      <div>
        <div className="btoolbar">
          <button type="button" className="rc-btn rc-btn--ghost fopen" onClick={() => setOpen(true)}>Filtre{active ? ` (${active})` : ""}</button>
          <span className="bcount"><b>{list.length}</b> {list.length === 1 ? "auto" : list.length > 1 && list.length < 5 ? "autá" : "áut"}</span>
          <label className="bsort">
            <span className="sr-only">Triedenie</span>
            <select className="input" value={f.sort} onChange={(e) => set("sort", e.target.value)}>
              {SORTS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </label>
        </div>
        {active > 0 && (
          <div className="fchips active-list">
            {KEYS.filter((k) => !["sort", "status"].includes(k) && f[k]).map((k) => (
              <button type="button" key={k} className="chip active" onClick={() => set(k, "")}>
                {k === "pmin" ? `od ${eur(+f[k])}` : k === "pmax" ? `do ${eur(+f[k])}` : k === "ymin" ? `rok od ${f[k]}` : k === "ymax" ? `rok do ${f[k]}` : k === "kmax" ? `do ${Number(f[k]).toLocaleString("sk-SK")} km` : k === "type" ? TYPE_SHORT[f[k]] : k === "run" ? RUN_LABEL[f[k]] : k === "sale" ? (f[k] === "fixed" ? "Pevná cena" : "Aukcie") : f[k]} ✕
              </button>
            ))}
          </div>
        )}
        <div className="grid">
          {list.length ? (
            list.map((c, i) => <CarCard key={c.id} car={c} priority={i < 3} serverNow={serverNow} />)
          ) : (
            <div className="empty">
              Týmto filtrom nezodpovedá žiadne auto. <button type="button" className="linkbtn" onClick={() => setF({ ...EMPTY })}>Zrušiť filtre</button> alebo <Link href="/kontakt">nám napíšte, čo hľadáte</Link>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
