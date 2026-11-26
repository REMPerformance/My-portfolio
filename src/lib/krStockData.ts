import "server-only";
import { cache } from "react";
import { getCalcConfig } from "./data";
import { krStockEstimate } from "./krStock";
import { includedItems } from "./calc";
import { SS_BASE, ssAvailable, ssItems, ssPhoto, type SsPage, type SsStock } from "./ssancar";
import { titleCase } from "./listingParse";
import type { CarType } from "./types";
import { krInspection, type KrInspection } from "./krInspection";

/** Ako často sa ponuka z Kórey obnovuje (sekundy). Stránky sa generujú vopred a zákazník dostane hotovú ponuku. */
export const KR_REVALIDATE = 10800;
/** Veľkosť jednej strany z API (strana sa musí zmestiť do 2 MB, inak ju Next neuloží do dátovej cache). */
const PAGE_SIZE = 200;
/** Poistka proti nekonečnému stránkovaniu (400 × 200 = 80 000 áut). Sťahuje sa celý sklad. */
const MAX_PAGES = 400;

/** Auto zo skladu v Kórei tak, ako ho vidí zákazník: bez ŠPZ, odkazu na zdroj a nákupnej ceny. */
export interface KrCar {
  id: string; make: string; model: string; trim: string | null; year: number | null; km: number | null;
  fuel: string | null; gear: string | null; drive: string | null; color: string | null; body: string | null; cc: number | null; seats: number | null;
  type: CarType; region: string | null; firstReg: string | null; photos: string[]; options: string[];
  /** orientačná cena na slovenských značkách (zaokrúhlená) */
  price: number;
}

async function ss<T>(path: string, tries = 3): Promise<T | null> {
  const key = process.env.SSANCAR_API_KEY;
  if (!key) return null;
  for (let t = 1; t <= tries; t++) {
    try {
      const r = await fetch(SS_BASE + path, {
        headers: { accept: "application/json", authorization: `Bearer ${key}` },
        next: { revalidate: KR_REVALIDATE, tags: ["ssancar"] },
        signal: AbortSignal.timeout(25000)
      });
      // limit požiadaviek za minútu: počkáme podľa Retry-After a skúsime znova
      if ((r.status === 429 || r.status >= 500) && t < tries) {
        const wait = Math.min(30, Math.max(1, Number(r.headers.get("retry-after")) || 2 * t));
        await new Promise((ok) => setTimeout(ok, wait * 1000));
        continue;
      }
      if (!r.ok) { if (r.status !== 404) console.error("ssancar", path, r.status); return null; }
      return (await r.json()) as T;
    } catch (e) {
      console.error("ssancar", path, (e as Error).message);
      if (t >= tries) return null;
    }
  }
  return null;
}

const FUEL: [RegExp, string][] = [[/plug/i, "Plug-in hybrid"], [/hybrid/i, "Hybrid"], [/electric|\bev\b/i, "Elektro"], [/hydrogen|fcev/i, "Vodík"], [/diesel/i, "Diesel"], [/lpg|lpi/i, "LPG"], [/gasoline|petrol|gas/i, "Benzín"]];
const BODY: [RegExp, string][] = [[/sedan/i, "Sedan"], [/hatch/i, "Hatchback"], [/wagon/i, "Kombi"], [/coupe/i, "Kupé"], [/convert|cabrio/i, "Kabriolet"], [/suv/i, "SUV"], [/van|mpv|rv/i, "MPV"], [/truck|pickup/i, "Pickup"]];
const COLOR: [RegExp, string][] = [[/pearl/i, "Perleťovo biela"], [/white/i, "Biela"], [/black/i, "Čierna"], [/dark ?gr[ae]y|charcoal|gun/i, "Tmavosivá"], [/silver/i, "Strieborná"], [/gr[ae]y/i, "Sivá"], [/navy|dark ?blue/i, "Tmavomodrá"], [/blue/i, "Modrá"], [/wine|burgundy/i, "Bordová"], [/red/i, "Červená"], [/brown/i, "Hnedá"], [/beige/i, "Béžová"], [/gold/i, "Zlatá"], [/green/i, "Zelená"]];
const REGION: [RegExp, string][] = [[/seoul|서울/i, "Soul"], [/incheon|인천/i, "Inčchon"], [/gyeonggi|경기|suwon|bundang|ilsan/i, "Kjonggi"], [/busan|pusan|부산/i, "Pusan"], [/daegu|대구/i, "Tegu"], [/gwangju|광주/i, "Kwangdžu"], [/daejeon|대전/i, "Tedžon"], [/ulsan|울산/i, "Ulsan"]];
const pick = (m: [RegExp, string][], v?: string | null) => (v ? m.find(([r]) => r.test(v))?.[1] : undefined);

/** Nákladné autá, autobusy, karavany a stroje: cenník (loď 2 300 USD, schválenie M1) na ne neplatí, preto sa na webe neukazujú. */
const COMMERCIAL_MAKE = /bus|truck|triaxle|tata daewoo|korea (commercial|special|merit)|scania|^man$|iveco|adria|elddis|swift|keystone|forest river|lunar|wiesner|campmaster|dpeco|cleantec|daechang|cevo/i;
const COMMERCIAL_MODEL = /\d+(\.\d+)?\s*ton|truck|\bbus\b|forklift|camp|trailer|caravan|trago|\bx?cient\b|excient|mighty|pavise|universe|county|aero ?(city|town|space)|novus|dump|crane|tractor|vacuum|ambulance|wing ?body|refrigerat/i;
/** Ľahké úžitkové (dodávka s korbou): clo ako nákladné auto. */
const LIGHT_TRUCK = /porter|bongo|labo|damas|pickup|cargo/i;

function toCar(s: SsStock, cfg: Awaited<ReturnType<typeof getCalcConfig>>): KrCar | null {
  if (!ssAvailable(s.status) || s.price_on_request || !s.make || !s.model) return null;
  const name = `${s.model} ${s.trim || ""}`;
  if (COMMERCIAL_MAKE.test(String(s.make)) || COMMERCIAL_MODEL.test(name)) return null;
  const body = pick(BODY, s.body_type) || null;
  const type: CarType = /truck|pickup|cargo/i.test(s.body_type || "") || LIGHT_TRUCK.test(name) ? "truck" : /suv|van|mpv|rv/i.test(s.body_type || "") ? "suv" : "car";
  const fuel = pick(FUEL, s.fuel) || (s.fuel ? titleCase(s.fuel) : null);
  const est = krStockEstimate(cfg, { usd: s.price?.usd, krw: s.price?.krw, fuel, type });
  if (!est) return null;
  const opts = Array.isArray(s.options) ? s.options : typeof s.options === "string" ? s.options.split(/[,;\n]/) : [];
  return {
    id: s.id, make: titleCase(String(s.make).trim()), model: String(s.model).trim(), trim: s.trim ? String(s.trim).trim().slice(0, 60) : null,
    year: s.year ? Number(s.year) : null, km: s.mileage_km ? Number(s.mileage_km) : null, fuel,
    gear: /auto|cvt|dct/i.test(s.transmission || "") ? "Automat" : /manual/i.test(s.transmission || "") ? "Manuál" : s.transmission || null,
    drive: /4wd|4x4|awd/i.test(s.drive || "") ? (/awd/i.test(s.drive || "") ? "AWD" : "4x4") : /rwd|rear/i.test(s.drive || "") ? "RWD" : /fwd|front/i.test(s.drive || "") ? "FWD" : /2wd/i.test(s.drive || "") ? "2WD" : null,
    color: pick(COLOR, s.color) || (s.color ? titleCase(s.color) : null), body, cc: s.engine_cc ? Number(s.engine_cc) : null, seats: s.seats ? Number(s.seats) : null,
    type, region: pick(REGION, s.location) || null, firstReg: s.first_registration ? String(s.first_registration).slice(0, 10) : null,
    photos: (s.photos || []).map(ssPhoto).filter((u) => /^https:\/\//.test(u)).slice(0, 40),
    options: [...new Set(opts.map((x) => String(x).trim()).filter(Boolean))].slice(0, 60),
    price: est.rounded
  };
}

/**
 * Sklad sa sťahuje po ročníkoch (API vie filtrovať year_min a year_max). Každý balík je tak samostatný a rýchly,
 * nemusí čakať na celý sklad. Poradie od najnovších.
 */
const NOW_Y = new Date().getFullYear();
export const KR_BUCKETS: { min?: number; max?: number }[] = [
  { min: NOW_Y + 2 },
  ...Array.from({ length: NOW_Y + 1 - 2009 + 1 }, (_, i) => ({ min: NOW_Y + 1 - i, max: NOW_Y + 1 - i })),
  { max: 2008 }
];

const sortCars = (xs: KrCar[]) => xs.sort((a, b) => (b.year || 0) - (a.year || 0) || a.price - b.price);

/** Autá jedného ročníka (balíka). */
export const getKrBucket = cache(async (i: number): Promise<KrCar[]> => {
  const b = KR_BUCKETS[i];
  // pri zostavovaní webu sa sklad nesťahuje (trvá dlhšie ako limit buildu), načíta sa až na webe
  if (!b || !process.env.SSANCAR_API_KEY || process.env.NEXT_PHASE === "phase-production-build") return [];
  const cfg = await getCalcConfig();
  const q = `${b.min ? `&year_min=${b.min}` : ""}${b.max ? `&year_max=${b.max}` : ""}`;
  const out: KrCar[] = [];
  let cursor: string | null = null;
  for (let n = 0; n < MAX_PAGES; n++) {
    const p: SsPage<SsStock> | null = await ss<SsPage<SsStock>>(`/v1/stock?limit=${PAGE_SIZE}${q}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`);
    if (!p) break;
    for (const s of ssItems(p)) { const c = toCar(s, cfg); if (c) out.push(c); }
    if (!p.has_more || !p.next_cursor) break;
    cursor = p.next_cursor;
  }
  return sortCars(out);
});

/** Celá ponuka skladu v Kórei (všetky ročníky, po 4 naraz). Prázdne pole, ak API nie je pripojené. */
export const getKrStock = cache(async (): Promise<KrCar[]> => {
  const res: KrCar[][] = new Array(KR_BUCKETS.length);
  let next = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (next < KR_BUCKETS.length) { const i = next++; res[i] = await getKrBucket(i); }
  }));
  return sortCars(res.flat());
});

/** Jedno auto (aktuálny stav). null = predané, stiahnuté alebo API nie je pripojené. */
export const getKrCar = cache(async (id: string): Promise<(KrCar & { included: string[]; inspection: KrInspection | null }) | null> => {
  if (!/^[A-Za-z0-9_.:-]{1,80}$/.test(id)) return null;
  const [raw, cfg] = await Promise.all([ss<SsStock>(`/v1/stock/${encodeURIComponent(id)}`), getCalcConfig()]);
  // detail má pohon, objem a dátum registrácie v časti listing, doplníme ich do základných údajov
  const s = raw ? { ...raw, drive: raw.drive || raw.listing?.drive || null, engine_cc: raw.engine_cc || raw.listing?.engine_cc || raw.inspection_record?.specification?.displacement_cc || null, first_registration: raw.listing?.first_registration_date || raw.first_registration } : null;
  const car = s ? toCar(s, cfg) : null;
  if (!s || !car) return null;
  const inspection = krInspection(s.inspection_record, car);
  if (inspection && !car.options.length) car.options = inspection.options;
  // zoznam „V cene je zahrnuté“ bez súm (nákupná cena a odmena sa zákazníkovi neukazujú)
  const est = krStockEstimate(cfg, { usd: s.price?.usd, krw: s.price?.krw, fuel: car.fuel, type: car.type });
  const included = est ? includedItems(est).map((x) => (/^Námorná preprava/.test(x) ? `${x} (bez poistenia)` : x)) : [];
  return { ...car, included, inspection };
});

/** Kompaktný riadok auta pre zoznam v prehliadači (bez výbavy a ďalších fotiek, aby celý sklad nebol príliš veľký). */
export type KrRow = [id: string, make: string, model: string, trim: string | null, year: number | null, km: number | null, fuel: string | null, gear: string | null, region: string | null, price: number, photo: string | null];
const IMG = "https://img-eu.ssancar.com/";
export const krRow = (c: KrCar): KrRow => {
  const ph = c.photos[0] || null;
  return [c.id, c.make, c.model, c.trim, c.year, c.km, c.fuel, c.gear, c.region, c.price, ph && ph.startsWith(IMG) ? ph.slice(IMG.length) : ph];
};

export const krName = (c: Pick<KrCar, "year" | "make" | "model">) => [c.year, c.make, c.model].filter(Boolean).join(" ");
