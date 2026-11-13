/**
 * Import auta zo SSANCAR (sklad kórejských predajcov a kórejské aukcie) do formulára auta.
 * Administrácia (/admin/korea) pošle údaje z API v rovnakom tvare ako záložka, takže auto prejde
 * tou istou cestou ako import z Encaru alebo Autowini (fotky, kalkulácia, kontrola chýbajúcich údajov).
 */
import { mapDrive, mapType, titleCase, type Parsed } from "./listingParse";
import type { ImportPayload, Imported } from "./importListing";
import { KR_EXPORT_FEE_EUR } from "./importKorea";
import { SS_HOUSE, ssPhoto, type SsLot, type SsPrice, type SsStock } from "./ssancar";
import type { CalcOverride, CarExtra } from "./types";

export type SsPayload = { kind: "stock"; item: SsStock } | { kind: "lot"; item: SsLot };
export const isSsancar = (u: string) => /^ssancar:\/\//.test(u);

const num = (x: number) => x.toLocaleString("sk-SK");
const roundUpK = (x: number) => (Math.floor(x / 1000) + 1) * 1000;
const roundUpM = (x: number) => (Math.floor(x / 1e6) + 1) * 1e6;
const EXPORT_COST = { label: "Kontrola vozidla a vývozná dokumentácia v Kórei", eur: KR_EXPORT_FEE_EUR };

const FUEL: [RegExp, string][] = [[/plug/i, "Plug-in hybrid"], [/hybrid/i, "Hybrid"], [/electric|\bev\b/i, "Elektro"], [/hydrogen|fcev/i, "Vodík"], [/diesel/i, "Diesel"], [/lpg|lpi/i, "LPG"], [/gasoline|petrol|gas/i, "Benzín"]];
const COLOR: [RegExp, string][] = [
  [/pearl/i, "Perleťovo biela"], [/white/i, "Biela"], [/black/i, "Čierna"], [/dark ?gr[ae]y|charcoal|gun/i, "Tmavosivá"], [/silver/i, "Strieborná"], [/gr[ae]y/i, "Sivá"],
  [/navy|dark ?blue/i, "Tmavomodrá"], [/sky|light ?blue/i, "Svetlomodrá"], [/blue/i, "Modrá"], [/wine|burgundy/i, "Bordová"], [/red/i, "Červená"], [/brown/i, "Hnedá"],
  [/beige/i, "Béžová"], [/gold/i, "Zlatá"], [/green/i, "Zelená"], [/orange/i, "Oranžová"], [/yellow/i, "Žltá"], [/purple/i, "Fialová"]
];
const BODY: [RegExp, string][] = [[/sedan/i, "Sedan"], [/hatch/i, "Hatchback"], [/wagon/i, "Kombi"], [/coupe/i, "Kupé"], [/convert|cabrio/i, "Kabriolet"], [/suv/i, "SUV"], [/van|mpv|rv/i, "MPV"], [/truck|pickup/i, "Pickup"]];
const pick = (m: [RegExp, string][], v?: string | null) => (v ? m.find(([r]) => r.test(v))?.[1] : undefined);
function skDate(v: string) {
  const m = v.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
  return m ? [m[3] ? `${+m[3]}.` : "", `${+m[2]}.`, m[1]].filter(Boolean).join(" ") : v;
}
const PLACES: [RegExp, string, string][] = [[/seoul|서울/i, "SEL", "Soul"], [/incheon|인천/i, "ICN", "Inčchon"], [/gyeonggi|경기|suwon|bundang|ilsan/i, "GG", "Kjonggi"], [/busan|pusan|부산/i, "PUS", "Pusan"]];
function place(raw?: string | null) {
  const hit = PLACES.find(([r]) => r.test(raw || ""));
  return hit ? { state: hit[1], location: `${hit[2]}, Južná Kórea` } : { state: "KR-X", location: "Južná Kórea" };
}

/** Cena: radšej v USD (FOB, tak ju SSANCAR fakturuje), inak v KRW. Zaokrúhlené nahor ako pri ostatných kórejských importoch. */
function price(p: SsPrice | undefined, round: boolean) {
  const usd = Number(p?.usd) || 0, krw = Number(p?.krw) || 0;
  if (usd >= 300) return { currency: "USD", raw: usd, value: round ? roundUpK(usd) : Math.round(usd) };
  if (krw >= 300000) return { currency: "KRW", raw: krw, value: round ? roundUpM(krw) : Math.round(krw) };
  return null;
}

function base(it: SsStock | SsLot, missing: string[]) {
  const out: Parsed = {};
  const specs: { label: string; value: string }[] = [];
  if (it.year) out.year = Number(it.year);
  if (it.make) out.make = titleCase(String(it.make).trim());
  if (it.model) out.model = String(it.model).trim();
  if (it.trim && String(it.trim).length <= 40) out.trim = String(it.trim).trim();
  out.fuel = pick(FUEL, it.fuel) || (it.fuel ? titleCase(it.fuel) : undefined);
  out.transmission = /auto|cvt|dct/i.test(it.transmission || "") ? "Automat" : /manual/i.test(it.transmission || "") ? "Manuál" : it.transmission || undefined;
  out.color = pick(COLOR, it.color) || (it.color ? titleCase(it.color) : undefined);
  if (it.mileage_km) out.odometer_mi = Math.round(Number(it.mileage_km) / 1.609344);
  else missing.push("nájazd");
  if (it.first_registration) specs.push({ label: "Prvá registrácia", value: skDate(String(it.first_registration)) });
  return { out, specs };
}

function fromStock(p: ImportPayload, it: SsStock): Imported {
  const missing: string[] = [];
  const { out, specs } = base(it, missing);
  const cc = Number(it.engine_cc) || 0;
  if (cc && out.fuel !== "Elektro") { out.engine = `${(cc / 1000).toFixed(1)}`; specs.push({ label: "Objem motora", value: `${num(cc)} cm³` }); }
  if (out.fuel === "Elektro") out.engine = "Elektro";
  // „2WD“ nehovorí, či predný alebo zadný pohon, vtedy ho necháme na doplnenie
  out.drive = /^2\s?wd$/i.test(it.drive || "") ? undefined : mapDrive(it.drive);
  const body = pick(BODY, it.body_type);
  if (body) specs.push({ label: "Karoséria", value: body });
  out.type = /truck|pickup|cargo/i.test(it.body_type || "") ? "truck" : /suv|van|mpv|rv/i.test(it.body_type || "") ? "suv" : mapType(it.body_type) || "car";
  if (it.seats) specs.push({ label: "Počet miest", value: String(it.seats) });
  if (it.vin && /^[A-HJ-NPR-Z0-9]{17}$/i.test(it.vin)) out.vin = it.vin.toUpperCase();
  else missing.push("VIN (vyžiadajte si ho od SSANCAR)");
  if (!out.drive) missing.push("pohon (SSANCAR ho neuviedol, pri 4x4 verzii ho doplňte)");
  const pl = place(it.location);
  out.location = pl.location;
  out.title_type = "Kórejská registrácia";
  out.run_status = "run_drive";
  out.primary_damage = "Bez poškodenia";

  const pr = it.price_on_request ? null : price(it.price, true);
  if (pr) missing.push(`kontrolu ceny: SSANCAR uvádza FOB ${num(pr.raw)} ${pr.currency}, nastavil som pevnú cenu ${num(pr.value)} ${pr.currency} (zaokrúhlené nahor). FOB zahŕňa dopravu do prístavu, preto je odvoz do prístavu 0`);
  else missing.push("cenu (SSANCAR ju uvádza len na vyžiadanie, pošlite dopyt v časti Kórea SSANCAR)");

  const opts = Array.isArray(it.options) ? it.options : typeof it.options === "string" ? it.options.split(/[,;\n]/) : [];
  const equipment = [...new Set(opts.map((x) => String(x).trim()).filter(Boolean))].slice(0, 60);
  const extra: CarExtra = { specs, ...(equipment.length ? { equipment } : {}) };
  const override: CalcOverride = { inlandUsd: 0, extraCosts: [EXPORT_COST] };

  const name = [out.year, out.make, out.model, out.trim].filter(Boolean).join(" ");
  const tech = [out.engine && out.engine !== "Elektro" ? `${out.engine} l` : "", out.fuel?.toLowerCase(), out.transmission?.toLowerCase(), out.drive ? `pohon ${out.drive}` : "", body?.toLowerCase(), out.color ? `farba ${out.color.toLowerCase()}` : ""].filter(Boolean).join(", ");
  const desc = [name ? `${name} z Južnej Kórey.` : "", tech ? `Technika: ${tech}.` : "", it.mileage_km ? `Nájazd ${num(Number(it.mileage_km))} km.` : "",
    "Auto je v ponuke overeného predajcu v Kórei. Stav auta overí náš agent pred vývozom. Cena zahŕňa kúpu, vývoz, dopravu, clo, DPH, schválenie a prihlásenie na Slovensku."].filter(Boolean);

  missing.push("cenu na Slovensku");
  missing.push(`kontrolu nákladov: pridal som položku „${EXPORT_COST.label}“ ${KR_EXPORT_FEE_EUR} €. Pri kórejských autách počítajte s dvojitou konverziou KRW na USD a EUR na USD`);
  const images = (it.photos || []).map(ssPhoto).filter((u) => /^https:\/\//.test(u)).slice(0, 60);
  if (!images.length) missing.push("fotky");
  (Object.keys(out) as (keyof Parsed)[]).forEach((k) => out[k] === undefined && delete out[k]);
  return {
    parsed: out,
    patch: {
      country: "KR", currency: pr?.currency || "USD", state: pl.state, sale_type: "fixed", auction: "Dealer", auction_end_at: null,
      ...(pr ? { price_usd: pr.value } : {}), seller_fee_usd: 0, damage_zones: [], extra, calc_override: override, description: desc.join(" "),
      note: `SSANCAR sklad, ID ${it.id}${it.plate_number ? `, ŠPZ ${it.plate_number}` : ""}${it.detail_url ? `, ${it.detail_url}` : ""}`
    },
    url: p.u, images, saleEnd: null, source: "SSANCAR (sklad)", missing
  };
}

function fromLot(p: ImportPayload, it: SsLot): Imported {
  const missing: string[] = [];
  const { out, specs } = base(it, missing);
  out.type = "car";
  out.title_type = "Kórejská registrácia";
  out.run_status = "unknown";
  out.lot = it.lot_no || undefined;
  if (it.grade) specs.push({ label: "Hodnotenie stavu na aukcii", value: String(it.grade) });
  const pr = price(it.start_price, false);
  // termín aukcie v kórejskom čase (dopoludnia), uzávierku objednávok si nastavíte sami
  const end = it.auction_date ? new Date(`${String(it.auction_date).slice(0, 10)}T10:00:00+09:00`).toISOString() : null;
  if (!end) missing.push("termín aukcie");
  else if (it.auction_date_estimated) missing.push("termín aukcie je zatiaľ len odhadovaný, overte ho pred zverejnením");
  missing.push(pr ? `odhad príhozu: SSANCAR zverejňuje len vyvolávaciu cenu ${num(pr.raw)} ${pr.currency}` : "vyvolávaciu cenu");
  missing.push("poplatky SSANCAR za aukciu (nastavil som 0, doplňte podľa ich cenníka)");
  missing.push("uzávierku objednávok (deň pred aukciou)");
  missing.push("pohon, výbavu a stav auta (aukcia ich v API neuvádza, overte cez hodnotenie stavu)");
  missing.push(`kontrolu nákladov: pridal som položku „${EXPORT_COST.label}“ ${KR_EXPORT_FEE_EUR} €. Pri kórejských autách počítajte s dvojitou konverziou KRW na USD a EUR na USD`);
  const name = [out.year, out.make, out.model, out.trim].filter(Boolean).join(" ");
  const desc = [name ? `${name} z kórejskej aukcie.` : "", it.mileage_km ? `Nájazd ${num(Number(it.mileage_km))} km.` : "",
    "Auto prešlo hodnotením stavu na aukcii a po vydražení ho ešte skontroluje náš agent. Cena zahŕňa kúpu, vývoz, dopravu, clo, DPH, schválenie a prihlásenie na Slovensku."].filter(Boolean);
  const images = (it.photos || []).map(ssPhoto).filter((u) => /^https:\/\//.test(u)).slice(0, 60);
  if (!images.length) missing.push("fotky");
  (Object.keys(out) as (keyof Parsed)[]).forEach((k) => out[k] === undefined && delete out[k]);
  return {
    parsed: out,
    patch: {
      country: "KR", currency: pr?.currency || "KRW", state: "KR-X", location: "Južná Kórea", sale_type: "auction", auction: "Aukcia v Kórei",
      ...(pr ? { current_bid_usd: pr.value } : {}), seller_fee_usd: 0, ...(end ? { auction_end_at: end } : {}), lot: it.lot_no || null,
      damage_zones: [], extra: { specs }, calc_override: { inlandUsd: 0, extraCosts: [EXPORT_COST] }, description: desc.join(" "),
      // aukčný dom len interne, zákazník ho nevidí
      note: `SSANCAR aukcia ${SS_HOUSE[it.house] || it.house}, lot ${it.lot_no || "?"}, ID ${it.id}`
    },
    url: p.u, images, saleEnd: end, source: "SSANCAR (aukcia)", missing
  };
}

export function fromSsancar(p: ImportPayload): Imported | null {
  if (!isSsancar(p.u)) return null;
  const d = (p.e as { ss?: SsPayload } | undefined)?.ss;
  if (!d) return null;
  return d.kind === "lot" ? fromLot(p, d.item) : fromStock(p, d.item);
}

/** Zakóduje auto zo SSANCAR do adresy /admin/auta/nove#import=… (rovnaký formát ako záložka). */
export function ssImportHash(ref: string, d: SsPayload) {
  const p: ImportPayload = { bv: 3, u: ref, t: [d.item.year, d.item.make, d.item.model].filter(Boolean).join(" "), e: { ss: d } };
  const bytes = new TextEncoder().encode(JSON.stringify(p));
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return "import=" + btoa(bin).replace(/\+/g, "-").replace(/\//g, "_");
}
