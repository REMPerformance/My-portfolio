/** Automatické SEO pre každé auto: titulok, popis, kľúčové slová a alt texty fotiek. Použije sa, kým admin nevyplní vlastné. */
import type { Car } from "./types";
import type { CalcResult } from "./calc";
import { carFullName, carName, eur, km } from "./format";
import { countryDef, placeName } from "./origins";

type SeoCar = Pick<Car, "year" | "make" | "model" | "trim" | "country" | "state" | "location" | "odometer_mi" | "primary_damage" | "secondary_damage" | "title_type" | "sale_type" | "auction" | "engine" | "fuel" | "sk_price_eur">;

/** Nie každé auto je havarované: bez údaja o škode, „bez poškodenia“ alebo len bežné opotrebenie znamená nehavarované auto. */
export function isDamaged(c: Pick<Car, "primary_damage" | "secondary_damage" | "damage_zones"> & { title_type?: string | null }) {
  const d = `${c.primary_damage || ""} ${c.secondary_damage || ""}`.trim();
  // bez údaja o stave nič netvrdíme: zelené označenie dostane len auto, pri ktorom je stav výslovne uvedený
  if (!d) return true;
  if (/salvage|rebuilt|destruction|parts only/i.test(c.title_type || "")) return true;
  const light = /^(bez poškodenia|nehavarované|bežné opotrebenie|odreniny|drobné odreniny|drobné škrabance \/ preliačiny|kamienky na laku|žiadne|none|,|\s)+$/i.test(d);
  if (!light) return true;
  return (c.damage_zones || []).some((z) => z.severity !== "light");
}

/** Úplne bez škody (ani drobné kozmetické chyby). */
export const isSpotless = (c: Pick<Car, "primary_damage" | "secondary_damage" | "damage_zones"> & { title_type?: string | null }) => !isDamaged(c) && !(c.damage_zones || []).length && /^(bez poškodenia|nehavarované)$/i.test((c.primary_damage || "").trim()) && !(c.secondary_damage || "").trim();

const cut = (s: string, n: number) => (s.length <= n ? s : s.slice(0, s.lastIndexOf(" ", n - 1)).replace(/[,.;:]$/, "") + "…");

export function carSeoTitle(c: SeoCar, est: Pick<CalcResult, "total" | "priceMode"> | null) {
  const cd = countryDef(c.country);
  const price = est ? `, ${eur(est.total)}${est.priceMode === "net" ? " bez DPH" : ""}` : "";
  const long = `${carFullName(c)} ${cd.from}${price} | dovoz na kľúč`;
  return long.length <= 62 ? long : `${carName(c)} ${cd.from}${price} | dovoz`;
}

export function carSeoDescription(c: SeoCar & Pick<Car, "damage_zones">, est: Pick<CalcResult, "gross" | "net" | "local" | "fixed"> | null) {
  const cd = countryDef(c.country);
  const where = [placeName(c.country, c.state) || c.location, cd.name].filter(Boolean).join(", ");
  const dmg = isDamaged(c) ? (c.primary_damage && !/bez poškodenia/i.test(c.primary_damage) ? `poškodenie: ${c.primary_damage.toLowerCase()}` : "") : "nehavarované";
  const bits = [c.odometer_mi ? km(c.odometer_mi) : "", c.engine || "", c.fuel ? c.fuel.toLowerCase() : "", dmg].filter(Boolean).join(", ");
  const incl = est?.local ? "vrátane prepravy a prihlásenia, bez cla" : "vrátane dopravy, cla, DPH a homologizácie";
  const price = est ? ` ${est.fixed ? "Cena" : "Odhad ceny"} na slovenských značkách ${eur(est.gross)} s DPH ${incl}.` : "";
  const sk = c.sk_price_eur ? ` Na slovenskom trhu od ${eur(c.sk_price_eur)}.` : "";
  return cut(`Dovoz ${carFullName(c)} ${cd.from} (${where})${bits ? `: ${bits}` : ""}.${price}${sk}`, 300);
}

export function carKeywords(c: SeoCar) {
  const cd = countryDef(c.country);
  const mm = `${c.make} ${c.model}`;
  return [`${mm} dovoz`, `${mm} ${cd.from}`, `dovoz ${c.make}`, `${mm} ${c.year || ""}`.trim(), `${mm} cena`, `dovoz auta ${cd.from}`, c.sale_type === "fixed" ? `${mm} na predaj` : `${mm} aukcia`];
}

const VIEWS = ["pohľad spredu", "pohľad zboku", "pohľad zozadu", "interiér", "detail"];
export const carImageAlt = (c: Pick<Car, "year" | "make" | "model"> & { trim?: string | null; country?: string | null }, i: number) =>
  `${[c.year, c.make, c.model, c.trim].filter(Boolean).join(" ")}${c.country ? ` ${countryDef(c.country).from}` : ""}, ${VIEWS[Math.min(i, VIEWS.length - 1)]}${i >= VIEWS.length ? ` ${i + 1}` : ""}`;
