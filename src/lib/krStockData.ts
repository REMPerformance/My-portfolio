import "server-only";
import { cache } from "react";
import { getCalcConfig } from "./data";
import { krStockEstimate } from "./krStock";
import { includedItems } from "./calc";
import { SS_BASE, ssAvailable, ssItems, ssPhoto, type SsPage, type SsStock } from "./ssancar";
import { titleCase } from "./listingParse";
import type { CarType } from "./types";

/** Ako často sa ponuka z Kórey obnovuje (sekundy). Stránky sa generujú vopred a zákazník dostane hotovú ponuku. */
export const KR_REVALIDATE = 3600;
/** Najviac áut v sekcii (strán po 100). */
const MAX_PAGES = 30;

/** Auto zo skladu v Kórei tak, ako ho vidí zákazník: bez ŠPZ, odkazu na zdroj a nákupnej ceny. */
export interface KrCar {
  id: string; make: string; model: string; trim: string | null; year: number | null; km: number | null;
  fuel: string | null; gear: string | null; drive: string | null; color: string | null; body: string | null; cc: number | null; seats: number | null;
  type: CarType; region: string | null; firstReg: string | null; photos: string[]; options: string[];
  /** orientačná cena na slovenských značkách (zaokrúhlená) */
  price: number;
}

async function ss<T>(path: string): Promise<T | null> {
  const key = process.env.SSANCAR_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch(SS_BASE + path, {
      headers: { accept: "application/json", authorization: `Bearer ${key}` },
      next: { revalidate: KR_REVALIDATE, tags: ["ssancar"] },
      signal: AbortSignal.timeout(20000)
    });
    if (!r.ok) { if (r.status !== 404) console.error("ssancar", path, r.status); return null; }
    return (await r.json()) as T;
  } catch (e) {
    console.error("ssancar", path, (e as Error).message);
    return null;
  }
}

const FUEL: [RegExp, string][] = [[/plug/i, "Plug-in hybrid"], [/hybrid/i, "Hybrid"], [/electric|\bev\b/i, "Elektro"], [/hydrogen|fcev/i, "Vodík"], [/diesel/i, "Diesel"], [/lpg|lpi/i, "LPG"], [/gasoline|petrol|gas/i, "Benzín"]];
const BODY: [RegExp, string][] = [[/sedan/i, "Sedan"], [/hatch/i, "Hatchback"], [/wagon/i, "Kombi"], [/coupe/i, "Kupé"], [/convert|cabrio/i, "Kabriolet"], [/suv/i, "SUV"], [/van|mpv|rv/i, "MPV"], [/truck|pickup/i, "Pickup"]];
const COLOR: [RegExp, string][] = [[/pearl/i, "Perleťovo biela"], [/white/i, "Biela"], [/black/i, "Čierna"], [/dark ?gr[ae]y|charcoal|gun/i, "Tmavosivá"], [/silver/i, "Strieborná"], [/gr[ae]y/i, "Sivá"], [/navy|dark ?blue/i, "Tmavomodrá"], [/blue/i, "Modrá"], [/wine|burgundy/i, "Bordová"], [/red/i, "Červená"], [/brown/i, "Hnedá"], [/beige/i, "Béžová"], [/gold/i, "Zlatá"], [/green/i, "Zelená"]];
const REGION: [RegExp, string][] = [[/seoul|서울/i, "Soul"], [/incheon|인천/i, "Inčchon"], [/gyeonggi|경기|suwon|bundang|ilsan/i, "Kjonggi"], [/busan|pusan|부산/i, "Pusan"], [/daegu|대구/i, "Tegu"], [/gwangju|광주/i, "Kwangdžu"], [/daejeon|대전/i, "Tedžon"], [/ulsan|울산/i, "Ulsan"]];
const pick = (m: [RegExp, string][], v?: string | null) => (v ? m.find(([r]) => r.test(v))?.[1] : undefined);

function toCar(s: SsStock, cfg: Awaited<ReturnType<typeof getCalcConfig>>): KrCar | null {
  if (!ssAvailable(s.status) || s.price_on_request || !s.make || !s.model) return null;
  const body = pick(BODY, s.body_type) || null;
  const type: CarType = /truck|pickup|cargo/i.test(s.body_type || "") ? "truck" : /suv|van|mpv|rv/i.test(s.body_type || "") ? "suv" : "car";
  const fuel = pick(FUEL, s.fuel) || (s.fuel ? titleCase(s.fuel) : null);
  const est = krStockEstimate(cfg, { usd: s.price?.usd, krw: s.price?.krw, fuel, type });
  if (!est) return null;
  const opts = Array.isArray(s.options) ? s.options : typeof s.options === "string" ? s.options.split(/[,;\n]/) : [];
  return {
    id: s.id, make: titleCase(String(s.make).trim()), model: String(s.model).trim(), trim: s.trim ? String(s.trim).trim().slice(0, 60) : null,
    year: s.year ? Number(s.year) : null, km: s.mileage_km ? Number(s.mileage_km) : null, fuel,
    gear: /auto|cvt|dct/i.test(s.transmission || "") ? "Automat" : /manual/i.test(s.transmission || "") ? "Manuál" : s.transmission || null,
    drive: /4wd|4x4|awd/i.test(s.drive || "") ? (/awd/i.test(s.drive || "") ? "AWD" : "4x4") : /rwd|rear/i.test(s.drive || "") ? "RWD" : /fwd|front/i.test(s.drive || "") ? "FWD" : null,
    color: pick(COLOR, s.color) || (s.color ? titleCase(s.color) : null), body, cc: s.engine_cc ? Number(s.engine_cc) : null, seats: s.seats ? Number(s.seats) : null,
    type, region: pick(REGION, s.location) || null, firstReg: s.first_registration ? String(s.first_registration).slice(0, 10) : null,
    photos: (s.photos || []).map(ssPhoto).filter((u) => /^https:\/\//.test(u)).slice(0, 40),
    options: [...new Set(opts.map((x) => String(x).trim()).filter(Boolean))].slice(0, 60),
    price: est.rounded
  };
}

/** Celá ponuka skladu v Kórei. Prázdne pole, ak API nie je pripojené. */
export const getKrStock = cache(async (): Promise<KrCar[]> => {
  if (!process.env.SSANCAR_API_KEY) return [];
  const cfg = await getCalcConfig();
  const out: KrCar[] = [];
  let cursor: string | null = null;
  for (let n = 0; n < MAX_PAGES; n++) {
    const p: SsPage<SsStock> | null = await ss<SsPage<SsStock>>(`/v1/stock?limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`);
    if (!p) break;
    for (const s of ssItems(p)) { const c = toCar(s, cfg); if (c) out.push(c); }
    if (!p.has_more || !p.next_cursor) break;
    cursor = p.next_cursor;
  }
  return out.sort((a, b) => (b.year || 0) - (a.year || 0) || a.price - b.price);
});

/** Jedno auto (aktuálny stav). null = predané, stiahnuté alebo API nie je pripojené. */
export const getKrCar = cache(async (id: string): Promise<(KrCar & { included: string[] }) | null> => {
  if (!/^[A-Za-z0-9_.:-]{1,80}$/.test(id)) return null;
  const [s, cfg] = await Promise.all([ss<SsStock>(`/v1/stock/${encodeURIComponent(id)}`), getCalcConfig()]);
  const car = s ? toCar(s, cfg) : null;
  if (!s || !car) return null;
  // zoznam „V cene je zahrnuté“ bez súm (nákupná cena a odmena sa zákazníkovi neukazujú)
  const est = krStockEstimate(cfg, { usd: s.price?.usd, krw: s.price?.krw, fuel: car.fuel, type: car.type });
  const included = est ? includedItems(est).map((x) => (/^Námorná preprava/.test(x) ? `${x} (bez poistenia)` : x)) : [];
  return { ...car, included };
});

export const krName = (c: Pick<KrCar, "year" | "make" | "model">) => [c.year, c.make, c.model].filter(Boolean).join(" ");
