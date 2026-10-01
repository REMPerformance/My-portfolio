"use client";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CarCard, type CardCar } from "./CarCard";
import { carPhase, TYPE_SHORT, eur } from "@/lib/format";
import { DAMAGE_ZONES, DAMAGE_FLAGS } from "@/lib/damage";
import { COUNTRIES, countryDef } from "@/lib/origins";
import { useNow } from "./Countdown";
import { TypeArt } from "./Icons";

type F = {
  q: string; country: string; make: string; pmax: string; sale: string;
  model: string; type: string; ymin: string; kmax: string; fuel: string; drive: string; dmg: string; status: string; sort: string;
};
const EMPTY: F = { q: "", country: "", make: "", pmax: "", sale: "", model: "", type: "", ymin: "", kmax: "", fuel: "", drive: "", dmg: "", status: "live", sort: "ending" };
const KEYS = Object.keys(EMPTY) as (keyof F)[];
const MORE: (keyof F)[] = ["model", "ymin", "kmax", "fuel", "drive", "dmg"];

const SORTS: { v: string; l: string }[] = [
  { v: "ending", l: "Najskôr končiace" },
  { v: "cheap", l: "Najlacnejšie" },
  { v: "expensive", l: "Najdrahšie" },
  { v: "newest", l: "Najnovšie pridané" },
  { v: "year", l: "Najnovší ročník" },
  { v: "km", l: "Najmenej km" }
];
const PRICES = [10000, 15000, 20000, 25000, 30000, 40000, 50000, 75000];

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
  if (!(c.damage_zones || []).length) g.add("Bez poškodenia");
  return g;
};
const uniq = (a: (string | null | undefined)[]) => [...new Set(a.filter(Boolean) as string[])].sort((x, y) => x.localeCompare(y, "sk"));
const LABEL: Partial<Record<keyof F, string>> = { model: "Model", type: "Typ", ymin: "Rok od", kmax: "Km do", fuel: "Palivo", drive: "Pohon", dmg: "Poškodenie" };

export function CarBrowser({ cars, serverNow, mode = "live" }: { cars: CardCar[]; serverNow: number; mode?: "live" | "archive" }) {
  const sp = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const [f, setF] = useState<F>(() => {
    const o = { ...EMPTY };
    KEYS.forEach((k) => { const v = sp.get(k); if (v !== null) o[k] = v; });
    return o;
  });
  const [more, setMore] = useState(() => MORE.some((k) => sp.get(k)));
  const [mOpen, setMOpen] = useState(false);
  const now = useNow(30000) ?? serverNow;

  useEffect(() => {
    const q = new URLSearchParams();
    KEYS.forEach((k) => { if (f[k] && f[k] !== EMPTY[k]) q.set(k, f[k]); });
    const s = q.toString();
    router.replace(s ? `${path}?${s}` : path, { scroll: false });
  }, [f, path, router]);

  const set = (k: keyof F, v: string) => setF((p) => ({ ...p, [k]: v, ...(k === "make" ? { model: "" } : {}) }));

  const opts = useMemo(() => ({
    countries: COUNTRIES.filter((c) => cars.some((x) => (x.country || "US") === c.code)),
    makes: uniq(cars.map((c) => c.make)),
    models: uniq(cars.filter((c) => !f.make || c.make === f.make).map((c) => c.model)),
    fuels: uniq(cars.map((c) => c.fuel)),
    drives: uniq(cars.map((c) => driveKey(c.drive))),
    types: uniq(cars.map((c) => c.type)),
    dmg: uniq(cars.flatMap((c) => [...carDamageGroups(c)]))
  }), [cars, f.make]);

  const list = useMemo(() => {
    const n = (v: string) => (v === "" ? null : Number(v));
    const pmax = n(f.pmax), ymin = n(f.ymin), kmax = n(f.kmax);
    const q = f.q.trim().toLowerCase();
    const r = cars.filter((c) => {
      const ph = carPhase(c, now);
      if (mode === "archive" && ph !== "ended") return false;
      if (q && !`${c.year} ${c.make} ${c.model} ${c.trim ?? ""} ${c.vin ?? ""}`.toLowerCase().includes(q)) return false;
      if (f.country && (c.country || "US") !== f.country) return false;
      if (f.sale && (c.sale_type || "auction") !== f.sale) return false;
      if (f.make && c.make !== f.make) return false;
      if (f.model && c.model !== f.model) return false;
      if (f.type && c.type !== f.type) return false;
      if (pmax !== null && c.est.total > pmax) return false;
      if (ymin !== null && (c.year ?? 0) < ymin) return false;
      if (kmax !== null && (c.odometer_mi ?? 0) * 1.609344 > kmax) return false;
      if (f.fuel && c.fuel !== f.fuel) return false;
      if (f.drive && driveKey(c.drive) !== f.drive) return false;
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
      newest: (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at),
      km: (a, b) => (a.odometer_mi ?? 1e9) - (b.odometer_mi ?? 1e9),
      year: (a, b) => (b.year ?? 0) - (a.year ?? 0)
    };
    if (mode === "archive" && (!f.sort || f.sort === "ending")) return r.sort((a, b) => close(b) - close(a));
    return r.sort(cmp[f.sort] || cmp.ending);
  }, [cars, f, now, mode]);

  const liveList = mode === "live" ? list.filter((c) => carPhase(c, now) !== "ended") : list;
  const endedList = mode === "live" ? list.filter((c) => carPhase(c, now) === "ended") : [];
  const activeMore = MORE.filter((k) => f[k]);
  const anyActive = KEYS.some((k) => !["sort", "status"].includes(k) && f[k]);

  const sel = (k: keyof F, label: string, options: { v: string; l: string }[], all = "Všetko") => (
    <div className="field">
      <label htmlFor={`f-${k}`}>{label}</label>
      <select id={`f-${k}`} className="input" value={f[k]} onChange={(e) => set(k, e.target.value)}>
        <option value="">{all}</option>
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
  const chipLabel = (k: keyof F) =>
    k === "type" ? TYPE_SHORT[f[k]] : k === "ymin" ? `od ${f[k]}` : k === "kmax" ? `do ${Number(f[k]).toLocaleString("sk-SK")} km` : f[k];

  return (
    <div>
      <div className="types types--sm" role="group" aria-label="Typ vozidla" style={{ marginBottom: 14 }}>
        {(["", "car", "suv", "truck"] as const).filter((t) => !t || opts.types.includes(t)).map((t) => (
          <button type="button" key={t || "all"} className={`type${f.type === t ? " on" : ""}`} aria-pressed={f.type === t} onClick={() => set("type", t)}>
            <TypeArt t={t || "all"} />{t ? TYPE_SHORT[t] : "Všetko"}
          </button>
        ))}
      </div>
      <button type="button" className="fbar-toggle" aria-expanded={mOpen} onClick={() => setMOpen((o) => !o)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18M6 12h12M10 19h4" /></svg>
        {mOpen ? "Skryť filtre" : `Filtrovať${anyActive ? " (aktívne)" : ""}`}
      </button>
      <div className={`fbar${mOpen ? " open" : ""}`} role="search" aria-label="Filtre ponuky">
        <div className="field fb-q">
          <label htmlFor="f-q">Hľadať</label>
          <input id="f-q" className="input" type="search" placeholder="Značka, model, VIN…" value={f.q} onChange={(e) => set("q", e.target.value)} />
        </div>
        {sel("country", "Krajina", (opts.countries.length ? opts.countries : COUNTRIES).map((c) => ({ v: c.code, l: c.name })), "Všetky krajiny")}
        {sel("make", "Značka", opts.makes.map((m) => ({ v: m, l: m })), "Všetky značky")}
        {sel("pmax", "Cena do", PRICES.map((p) => ({ v: String(p), l: eur(p) })), "Bez limitu")}
        {sel("sale", "Predaj", [{ v: "auction", l: "Aukcia" }, { v: "fixed", l: "Pevná cena" }], "Všetko")}
        <button type="button" className="rc-btn rc-btn--ghost" aria-expanded={more} onClick={() => setMore((m) => !m)}>
          {more ? "Menej filtrov" : `Ďalšie filtre${activeMore.length ? ` (${activeMore.length})` : ""}`}
        </button>
      </div>
      {more && (
        <div className="fmore">
          {sel("model", "Model", opts.models.map((m) => ({ v: m, l: m })))}
          <div className="field">
            <label htmlFor="f-ymin">Rok výroby od</label>
            <input id="f-ymin" className="input" type="number" inputMode="numeric" placeholder="napr. 2018" value={f.ymin} onChange={(e) => set("ymin", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="f-kmax">Najazdené do (km)</label>
            <input id="f-kmax" className="input" type="number" inputMode="numeric" step={10000} placeholder="napr. 100000" value={f.kmax} onChange={(e) => set("kmax", e.target.value)} />
          </div>
          {sel("fuel", "Palivo", opts.fuels.map((t) => ({ v: t, l: t })))}
          {sel("dmg", "Poškodenie", opts.dmg.map((d) => ({ v: d, l: d })))}
        </div>
      )}

      <div className="btoolbar">
        <span className="bcount"><b>{liveList.length}</b> {liveList.length === 1 ? "auto" : liveList.length > 1 && liveList.length < 5 ? "autá" : "áut"}{mode === "live" ? " v ponuke" : ""}</span>
        {f.country && <span className="bcount">· {countryDef(f.country).name}</span>}
        {activeMore.length > 0 && (
          <div className="fchips">
            {activeMore.map((k) => <button type="button" key={k} className="chip" onClick={() => set(k, "")}>{LABEL[k]}: {chipLabel(k)} ✕</button>)}
          </div>
        )}
        {anyActive && <button type="button" className="linkbtn" onClick={() => setF({ ...EMPTY, sort: f.sort })}>Zrušiť filtre</button>}
        <label className="bsort">
          <span className="sr-only">Triedenie</span>
          <select className="input" value={f.sort} onChange={(e) => set("sort", e.target.value)}>
            {SORTS.map((s) => <option key={s.v} value={s.v}>{mode === "archive" && s.v === "ending" ? "Naposledy skončené" : s.l}</option>)}
          </select>
        </label>
      </div>

      <div className="grid">
        {liveList.length ? (
          liveList.map((c, i) => <CarCard key={c.id} car={c} priority={i < 3} serverNow={serverNow} />)
        ) : (
          <div className="empty">
            Týmto filtrom nezodpovedá žiadne auto. <button type="button" className="linkbtn" onClick={() => setF({ ...EMPTY })}>Zrušiť filtre</button> alebo <Link href="/auto-na-mieru">nám napíšte, čo hľadáte</Link>.
          </div>
        )}
      </div>
      {endedList.length > 0 && (
        <>
          <h2 className="ended-head">Predaj skončil <span>({endedList.length})</span></h2>
          <div className="grid">{endedList.map((c) => <CarCard key={c.id} car={c} serverNow={serverNow} />)}</div>
        </>
      )}
      <p className="more">
        {mode === "live" ? <Link href="/archiv">Pozrieť archív skončených a predaných áut</Link> : <Link href="/ponuka">Späť na aktuálnu ponuku áut</Link>}
      </p>
    </div>
  );
}
