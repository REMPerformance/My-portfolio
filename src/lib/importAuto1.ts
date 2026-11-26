/**
 * Import auta z AUTO1.com (B2B aukcie a nákup pre predajcov). Stránka je za prihlásením a nemá štruktúrované dáta,
 * preto záložka „Import do REM“ pošle text stránky a adresy fotiek a všetko sa rozpozná tu.
 * Stránka býva po slovensky (sk/app/merchant/car/<skladové číslo>), popisky sú preto hlavne slovenské, s anglickou a nemeckou zálohou.
 * Názov AUTO1 sa na web nedostane: pole auction sa zákazníkom nezobrazuje a dodatočné náklady majú všeobecný názov.
 */
import type { ImportPayload, Imported } from "./importListing";
import { mapFuel, titleCase, type Parsed } from "./listingParse";
import { MAKES, MAKE_NAMES } from "./makes";
import { modelsOf } from "./models";
import type { CalcOverride, CarExtra, DamageZone, Severity } from "./types";

/** Text skopírovaný zo stránky auta na AUTO1 (pole „Vložiť text z inzerátu“). */
export const looksLikeAuto1 = (t: string) => /Skladové číslo:\s*[A-Z]{2}\d{5}|Stock number:\s*[A-Z]{2}\d{5}/i.test(t) && /(Stav tachometra|Mileage|Kilometerstand)\s*:/i.test(t);
export const isAuto1 = (u: string) => /(^|\.)auto1\.com$/i.test((() => { try { return new URL(u).hostname; } catch { return ""; } })()) && /\/car\/[A-Z0-9]{5,}/i.test(u);

const roundUpK = (x: number) => (Math.floor(x / 1000) + 1) * 1000;
const num = (n: number) => n.toLocaleString("sk-SK");
const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Hodnota za popiskom „Popisok: hodnota“ alebo na ďalšom riadku. */
function val(t: string, ...keys: string[]) {
  for (const k of keys) {
    const m = t.match(new RegExp(`(?:^|\\n)[ \\t]*${esc(k)}[ \\t]*(?::[ \\t]*|\\n[ \\t]*)([^\\n]+)`, "i"));
    if (m && m[1].trim() && m[1].trim() !== "-") return m[1].trim();
  }
  return undefined;
}
const digits = (v?: string) => (v ? Number(v.replace(/[^\d]/g, "")) || 0 : 0);
/** Suma v EUR z riadku („1 000 €“, „€ 12.500“, „12 500 EUR“). */
function eurAmount(v?: string) {
  if (!v || !/€|\bEUR\b/i.test(v)) return 0;
  return Number(v.replace(/[^\d,.-]/g, "").replace(/[.,](?=\d{3}\b)/g, "").replace(",", ".")) || 0;
}
/** Suma v EUR pri popisku: najprv na tom istom riadku, potom na susedných riadkoch v poradí podľa „order“ (AUTO1 dáva cenu Kúpiť ihneď nad tlačidlo, minimálnu ponuku za popisok). */
function priceNear(t: string, re: RegExp, order: "after" | "before" = "after") {
  const ls = t.split("\n");
  const i = ls.findIndex((l) => re.test(l));
  if (i < 0) return 0;
  const same = eurAmount(ls[i].replace(re, ""));
  if (same > 0) return same;
  const isLabel = (l: string) => /[a-záčďéíľĺňóôŕšťúýž]{3,}\s*:/i.test(l) && !eurAmount(l);
  const after = ls.slice(i + 1, i + 3), before = ls.slice(Math.max(0, i - 2), i).reverse();
  for (const l of order === "after" ? [...after, ...before] : [...before, ...after]) {
    if (eurAmount(l) > 0 && !/ponuka|cena|price|gebot/i.test(l)) return eurAmount(l);
    if (isLabel(l)) break;
  }
  return 0;
}
const priceAfter = (t: string, re: RegExp) => priceNear(t, re, "after");

const COUNTRY: Record<string, string> = {
  DE: "Nemecko", AT: "Rakúsko", CZ: "Česko", HU: "Maďarsko", PL: "Poľsko", IT: "Taliansko", NL: "Holandsko", BE: "Belgicko", FR: "Francúzsko",
  ES: "Španielsko", PT: "Portugalsko", LU: "Luxembursko", DK: "Dánsko", SE: "Švédsko", FI: "Fínsko", EE: "Estónsko", LV: "Lotyšsko", LT: "Litva",
  SI: "Slovinsko", HR: "Chorvátsko", RO: "Rumunsko", BG: "Bulharsko", GR: "Grécko", IE: "Írsko", SK: "Slovensko"
};
const FROM: Record<string, string> = { DE: "z Nemecka", AT: "z Rakúska", CZ: "z Česka", HU: "z Maďarska", PL: "z Poľska", IT: "z Talianska", NL: "z Holandska", BE: "z Belgicka", FR: "z Francúzska", ES: "zo Španielska", SE: "zo Švédska", DK: "z Dánska", FI: "z Fínska" };

const BODY: [RegExp, string, "car" | "suv" | "truck"][] = [
  [/suv|terén|offroad|gelände/i, "SUV", "suv"], [/kombi|estate|wagon|touring/i, "Kombi", "car"], [/hatchback|hečbek/i, "Hatchback", "car"],
  [/sedan|limuz|saloon|limousine/i, "Sedan", "car"], [/kup[ée]|coup[ée]/i, "Kupé", "car"], [/kabriolet|cabrio|convertible|roadster/i, "Kabriolet", "car"],
  [/mpv|minivan|van\b|viacúčel/i, "MPV", "suv"], [/pickup|pick-up/i, "Pickup", "truck"], [/dodávk|transporter|kasten/i, "Dodávka", "truck"]
];

/* ───────── poškodenie z tabuľky „ZHRNUTIE POŠKODENIA“ ───────── */

const PARTS: [RegExp, string][] = [
  [/predn\w* nárazník|front bumper|stoßstange vorne/i, "front_bumper"], [/zadn\w* nárazník|rear bumper|stoßstange hinten/i, "rear_bumper"],
  [/kapota|bonnet|hood|motorhaube/i, "hood"], [/maska|mriežka|grille|kühlergrill/i, "grille"], [/čelné sklo|windshield|windscreen|frontscheibe/i, "windshield"],
  [/strecha|roof|dach/i, "roof"], [/zadné sklo|rear window|heckscheibe/i, "rear_window"],
  [/^zadné dvere|veko kufra|kufor|tailgate|boot lid|trunk|heckklappe/i, "trunk"],
  [/predné ľavé dvere|ľavé predné dvere|front left door|tür vorne links/i, "fl_door"], [/predné pravé dvere|pravé predné dvere|front right door|tür vorne rechts/i, "fr_door"],
  [/zadné ľavé dvere|ľavé zadné dvere|rear left door|tür hinten links/i, "rl_door"], [/zadné pravé dvere|pravé zadné dvere|rear right door|tür hinten rechts/i, "rr_door"],
  [/predný ľavý blatník|ľavý predný blatník|front left (fender|wing)|kotflügel vorne links/i, "fl_fender"], [/predný pravý blatník|pravý predný blatník|front right (fender|wing)|kotflügel vorne rechts/i, "fr_fender"],
  [/zadný ľavý blatník|ľavý zadný blatník|rear left (fender|wing|quarter)|seitenwand hinten links/i, "rl_quarter"], [/zadný pravý blatník|pravý zadný blatník|rear right (fender|wing|quarter)|seitenwand hinten rechts/i, "rr_quarter"],
  [/ľavý prah|prah vľavo|left sill|schweller links/i, "l_sill"], [/pravý prah|prah vpravo|right sill|schweller rechts/i, "r_sill"],
  [/ľavé (vonkajšie )?zrkadlo|ľavého zrkadla|left mirror|spiegel links/i, "l_mirror"], [/pravé (vonkajšie )?zrkadlo|pravého zrkadla|right mirror|spiegel rechts/i, "r_mirror"],
  [/ľavý (predný )?svetlomet|predný ľavý svetlomet|left headl|scheinwerfer links/i, "fl_light"], [/pravý (predný )?svetlomet|predný pravý svetlomet|right headl|scheinwerfer rechts/i, "fr_light"],
  [/ľavé zadné svetlo|zadné ľavé svetlo|left (tail|rear) light|rückleuchte links/i, "rl_light"], [/pravé zadné svetlo|zadné pravé svetlo|right (tail|rear) light|rückleuchte rechts/i, "rr_light"],
  [/(disk|koleso|pneumatika|ráfik)\w* predn\w* ľav|predn\w* ľav\w* (disk|koleso|pneumatika|ráfik)|front left (wheel|rim|tyre)/i, "fl_wheel"],
  [/(disk|koleso|pneumatika|ráfik)\w* predn\w* prav|predn\w* prav\w* (disk|koleso|pneumatika|ráfik)|front right (wheel|rim|tyre)/i, "fr_wheel"],
  [/(disk|koleso|pneumatika|ráfik)\w* zadn\w* ľav|zadn\w* ľav\w* (disk|koleso|pneumatika|ráfik)|rear left (wheel|rim|tyre)/i, "rl_wheel"],
  [/(disk|koleso|pneumatika|ráfik)\w* zadn\w* prav|zadn\w* prav\w* (disk|koleso|pneumatika|ráfik)|rear right (wheel|rim|tyre)/i, "rr_wheel"],
  [/interiér|sedadl|čalún|palubn|lišta|volant|navigačn|konzol|strop|koberc|interior|seat|dashboard|steering wheel|innenraum|sitz|lenkrad/i, "interior"],
  [/motor|engine/i, "engine"], [/prevodov|gearbox|getriebe/i, "transmission"], [/podvoz|underbody|unterboden/i, "undercarriage"]
];
/** Druhy poškodenia, ktoré AUTO1 uvádza v prvom stĺpci. */
const KINDS: [RegExp, string][] = [
  [/vydutin|preliač|dent|delle|beule/i, "preliačina"], [/škrab|scratch|kratzer/i, "škrabanec"], [/kamien|stone chip|steinschlag/i, "poškodenie kamienkom"],
  [/prasklin|puklin|crack|riss/i, "prasklina"], [/zlomen|rozbit|broken|gebrochen/i, "zlomené"], [/chýb|missing|fehlt/i, "chýba"], [/hrdz|korózi|rust|rost/i, "korózia"],
  [/opravovan|prelakovan|neodborná oprava|repaint|poor repair|nachlack/i, "oprava laku"], [/opotreb|wear|verschlei/i, "opotrebenie"], [/poškodenie čalúnenia|upholstery|polster/i, "poškodenie čalúnenia"],
  [/špinav|dirty|verschmutz/i, "znečistenie"], [/deform|deformation|verform/i, "deformácia"]
];

function damage(t: string) {
  const start = t.search(/\n\s*(OBLASŤ POŠKODENIE|AREA DAMAGE|BEREICH SCHADEN)[^\n]*\n/i);
  const zones = new Map<string, DamageZone>();
  const lines: string[] = [];
  if (start < 0) return { zones, lines, found: /ZHRNUTIE POŠKODENIA|DAMAGE SUMMARY|SCHADENSÜBERSICHT/i.test(t) };
  const block = t.slice(start).split("\n").slice(2).join("\n").split(/\n\s*(VYBAVENIE VOZIDLA|VEHICLE EQUIPMENT|AUSSTATTUNG|PODROBNOSTI O SERVISE|SERVICE DETAILS)/i)[0];
  let kind = "";
  for (const raw of block.split("\n").map((x) => x.trim()).filter(Boolean)) {
    const k = KINDS.find(([r]) => r.test(raw));
    if (k) kind = k[1];
    // dotknuté časti sú na konci riadku: „Zadné ľavé dvere (1), Zadný ľavý blatník (1)“
    const parts = [...raw.matchAll(/([A-ZÁČĎÉÍĽĹŇÓÔŔŠŤÚÝŽÄÖÜ][^,()\d<>≤≥]*?)\s*\(\s*([<>≤≥]?\s*\d+(?:\s*-\s*\d+)?)\s*\)/g)];
    if (!parts.length) continue;
    const deep = /hlbok|základn|deep|primer|poškodenie laku|lackschaden/i.test(raw);
    const big = /≥\s*50\s*mm|≥\s*100\s*mm/.test(raw);
    // AUTO1 hodnotí bežné opotrebenie: škrabance a kamienky sú ľahké, väčšie preliačiny a praskliny stredné, chýbajúce alebo zlomené diely ťažké
    const sev: Severity = /zlomené|chýba|deformácia/.test(kind) ? "heavy" : /prasklina|korózia|oprava laku/.test(kind) || (kind === "preliačina" && (big || deep)) ? "medium" : "light";
    if (kind === "znečistenie") { lines.push(`${parts.map((p) => p[1].trim()).join(", ")}: znečistené`); continue; }
    const what = `${kind || "poškodenie"}${deep && kind === "škrabanec" ? " až po základný náter" : ""}`;
    for (const p of parts) {
      const name = p[1].trim();
      lines.push(`${name}: ${what} (${p[2].replace(/\s+/g, "")}×)`);
      const id = PARTS.find(([r]) => r.test(name))?.[1];
      if (!id) continue;
      const cur = zones.get(id);
      const rank = (s: Severity) => (s === "heavy" ? 3 : s === "medium" ? 2 : 1);
      if (!cur || rank(sev) > rank(cur.severity)) zones.set(id, { zone: id, severity: sev, note: `podľa inšpekcie: ${what}` });
    }
  }
  return { zones, lines, found: true };
}

/* ───────── výbava: dvojice „kategória / podrobnosť“ ───────── */

/** Kategórie výbavy, ako ich AUTO1 píše po slovensky. Riadky za kategóriou sú jej podrobnosti (často po anglicky, niekedy viac riadkov). */
const EQ_CATS = ["xenónové svetlá", "led svetlá", "laserové svetlá", "vyhrievané sedadlá", "ventilované sedadlá", "masážne sedadlá", "nastavenie sedadla", "pamäť sedadiel",
  "parkovacie zariadenie (určuje vzdialenosť od prekážky)", "parkovacie zariadenie", "parkovacia kamera", "kamera", "posilňovač riadenia", "hands-free systém", "športový podvozok", "športové sedadlá",
  "zábavná konzola", "navigácia", "airbag", "klimatizácia", "samosvorný diferenciál (lsd)", "elektricky ovládané okná", "esp", "abs", "imobilizér", "pohon všetkých kolies", "palubný počítač",
  "varovné zariadenia / bezpečnostný alarm", "tempomat", "ťažné zariadenie", "panoramatická strecha", "strešné okno", "kožené sedadlá", "head-up displej", "bezkľúčový prístup", "centrálne zamykanie",
  "elektrické zrkadlá", "zliatinové disky", "hliníkové disky", "rádio", "zvukový systém", "isofix", "vzduchové odpruženie", "adaptívny podvozok", "vyhrievaný volant", "multifunkčný volant",
  "asistent jazdného pruhu", "asistent mŕtveho uhla", "dažďový senzor", "svetelný senzor", "hmlové svetlá", "start-stop", "strešné nosiče", "tónované sklá", "elektrické sedadlá", "digitálny prístrojový panel"];

function equipment(t: string) {
  const out: string[] = [];
  const m = t.match(/\n\s*(VYBAVENIE VOZIDLA|VEHICLE EQUIPMENT|AUSSTATTUNG)\s*\n([\s\S]*?)\n\s*(PODROBNOSTI O SERVISE|SERVICE DETAILS|SERVICEDETAILS|PODROBNOSTI O ELEKTROMOBILE|VSTUPNÁ DIAGNOSTIKA|INFORMÁCIE O VOZIDLE NA ZÁKLADE)/i);
  const skip = (x: string) => !x || /automaticky preložený|ukázať originál|automatically translated|show original|zobraziť viac|show more/i.test(x);
  if (m) {
    let cat = "", det: string[] = [];
    const flush = () => { if (cat) out.push(det.length ? `${cat}: ${det.join(", ")}` : cat); cat = ""; det = []; };
    for (const l of m[2].split("\n").map((x) => x.trim()).filter((x) => !skip(x))) {
      if (EQ_CATS.includes(l.toLowerCase())) { flush(); cat = l; }
      else if (cat) det.push(l);
      else out.push(l);
    }
    flush();
  }
  // ďalšia výbava podľa VIN: jeden riadok = jedna položka
  const v = t.match(/\n\s*INFORMÁCIE O VOZIDLE NA ZÁKLADE[^\n]*\n([\s\S]*?)(\n\s*(ZOBRAZIŤ VIAC|Zobraziť viac|PODOBNÉ VOZIDLÁ|SLEDOVANÉ VOZIDLÁ)|$)/i);
  if (v) for (const l of v[1].split("\n").map((x) => x.trim())) if (!skip(l) && l.length < 140) out.push(l);
  return [...new Set(out)].slice(0, 100);
}

/* ───────── značka a model z nadpisu ───────── */

function splitName(title: string) {
  const makes = [...MAKE_NAMES, "Lynk & Co", "Omoda", "Aiways", "Polestar", "Jaecoo", "Leapmotor", "Xpeng", "Nio", "Zeekr", "Ssangyong", "KGM", "DS", "Alpine", "Lancia", "Iveco", "MG"].sort((a, b) => b.length - a.length);
  const mk = makes.find((x) => new RegExp(`^${esc(x)}\\b`, "i").test(title));
  const make = mk || title.split(/\s+/)[0] || "";
  const rest = title.slice(make.length).trim();
  const def = MAKES.find((x) => x.name.toLowerCase() === make.toLowerCase());
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const known = def ? modelsOf(def.slug).filter((m) => norm(rest).startsWith(norm(m.name))).sort((a, b) => b.name.length - a.name.length)[0] : undefined;
  let model = "";
  if (known) {
    // dĺžka modelu v pôvodnom texte (bez medzier a pomlčiek sa nedá rezať priamo)
    const words = rest.split(/\s+/);
    for (let n = 1; n <= words.length; n++) if (norm(words.slice(0, n).join(" ")) === norm(known.name)) { model = words.slice(0, n).join(" "); break; }
  }
  if (!model) model = rest.split(/\s+/)[0] || "";
  const trim = rest.slice(model.length).trim();
  return { make: mk ? mk : titleCase(make), model, trim };
}

/* ───────── hlavná funkcia ───────── */

export function fromAuto1(p: ImportPayload): Imported {
  const t = (p.x || "").replace(/\r/g, "");
  // text pod „podobné vozidlá“ patrí iným autám
  const own = t.split(/\n\s*(PODOBNÉ VOZIDLÁ|SIMILAR VEHICLES|ÄHNLICHE FAHRZEUGE)/i)[0];
  const missing: string[] = [];
  const out: Parsed = {};
  const specs: { label: string; value: string }[] = [];
  const stock = val(own, "Skladové číslo", "Stock number", "Bestandsnummer") || (p.u.match(/\/car\/([A-Z0-9]{5,})/i) || [])[1];
  if (stock) out.lot = stock.toUpperCase();

  /* nadpis: riadok pred „Minimálna ponuka“, záloha h1 alebo názov stránky */
  const h = ((p as ImportPayload & { h?: string }).h || "").trim();
  const docTitle = (p.t || "").replace(/\s*[|-]\s*auto1.*$/i, "").trim();
  const ls0 = own.split("\n").map((x) => x.trim());
  const afterClock = ls0[ls0.findIndex((l) => /^\d{8,}$/.test(l)) + 1] || "";
  const beforeWatch = ls0[ls0.findIndex((l) => /^(SLEDOVANÉ VOZIDLÁ|VLOŽIŤ BID|WATCHLIST|PLACE BID)$/i.test(l)) - 1] || "";
  const ok = (x: string) => x.length > 3 && /[a-z]/i.test(x) && !/^(auto1|auto1\.com)$|kúpiť|buy it now|aukci|auction|ponuka|dopyt|zoznam|^\d/i.test(x);
  const titleLine = [docTitle, h, afterClock, beforeWatch].find(ok) || "";
  const nm = splitName(titleLine);
  if (nm.make) out.make = nm.make;
  if (nm.model) out.model = nm.model;
  if (nm.trim) out.trim = nm.trim.length <= 50 ? nm.trim : nm.trim.slice(0, 50);

  /* technické údaje */
  const year = digits(val(own, "Rok výroby", "Year of manufacture", "Baujahr"));
  const reg = val(own, "Prvá registrácia", "First registration", "Erstzulassung");
  const regYear = Number((reg || "").match(/(19|20)\d{2}/)?.[0]);
  out.year = year >= 1950 ? year : regYear || undefined;
  if (reg) specs.push({ label: "Prvá registrácia", value: reg.replace(/\s+/g, " ").replace(/^(\d{1,2})\.\s*(\d{4})$/, (_, m, y) => `${Number(m)}/${y}`) });
  const vin = (val(own, "VIN", "FIN") || "").replace(/\s/g, "").toUpperCase();
  if (/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) out.vin = vin;
  const km = digits(val(own, "Stav tachometra", "Mileage", "Kilometerstand"));
  if (km) out.odometer_mi = Math.round(km / 1.609344);
  const fuelRaw = val(own, "Druh paliva", "Fuel type", "Kraftstoff") || "";
  out.fuel = /elektr/i.test(fuelRaw) ? "Elektro" : /plug|phev/i.test(fuelRaw + " " + titleLine) ? "Plug-in hybrid" : /hybrid/i.test(fuelRaw) ? "Hybrid" : /diesel|nafta/i.test(fuelRaw) ? "Diesel" : /benz|petrol|gasoline/i.test(fuelRaw) ? "Benzín" : /lpg|cng|plyn/i.test(fuelRaw) ? fuelRaw : mapFuel(fuelRaw);
  const power = val(own, "Konská sila", "Výkon", "Power", "Leistung") || "";
  const kw = Number((power.match(/(\d+)\s*kW/i) || [])[1]) || 0;
  const hp = Number((power.match(/(\d+)\s*(Koní|PS|HP|k)(?=[\s)/]|$)/i) || [])[1]) || 0;
  const ccm = digits(val(own, "Zdvihový objem", "Engine capacity", "Hubraum"));
  const liters = ccm >= 600 ? (Math.round(ccm / 100) / 10).toFixed(1) : "";
  out.engine = [liters ? `${liters} l` : out.fuel === "Elektro" ? "elektromotor" : "", kw ? `${kw} kW${hp ? ` (${hp} k)` : ""}` : ""].filter(Boolean).join(" ") || undefined;
  if (ccm) specs.push({ label: "Objem motora", value: `${num(ccm)} cm³` });
  if (kw) specs.push({ label: "Výkon", value: `${kw} kW${hp ? ` / ${hp} k` : ""}` });
  const gear = val(own, "Prevodovka", "Gearbox", "Getriebe") || "";
  if (gear) out.transmission = /autom/i.test(gear) ? "Automat" : /manu|ručn|schalt/i.test(gear) ? "Manuál" : gear;
  const titleDrive = /\b(4x4|4wd|awd|4motion|quattro|xdrive|4matic|allrad|dual awd|4drive)\b/i.test(titleLine) ? "AWD" : undefined;
  if (titleDrive) out.drive = titleDrive;
  const body = val(own, "Typ karosérie", "Body type", "Karosserieform") || "";
  const b = BODY.find(([r]) => r.test(body));
  if (b) { out.type = b[2]; specs.push({ label: "Karoséria", value: b[1] }); } else if (body) specs.push({ label: "Karoséria", value: body });
  const color = val(own, "Farba", "Colour", "Color", "Farbe") || "";
  if (color) out.color = color.replace(/\s*\((Originál|Original)\)\s*/i, "").trim();
  const upholstery = val(own, "Čalúnený", "Čalúnenie", "Upholstery", "Polsterung");
  if (upholstery) specs.push({ label: "Čalúnenie", value: upholstery.replace(/\s*\((Originál|Original)\)\s*/i, "") });
  const seats = digits(val(own, "Sedadlá", "Seats", "Sitze")), doors = digits(val(own, "Počet dverí", "Doors", "Türen"));
  if (seats) specs.push({ label: "Počet miest", value: String(seats) });
  if (doors) specs.push({ label: "Počet dverí", value: String(doors) });
  const euro = val(own, "Trieda EURO", "Emission class", "Schadstoffklasse");
  if (euro && !/^n\/?a$/i.test(euro)) specs.push({ label: "Emisná trieda", value: euro.replace(/^EURO\s*/i, "Euro ") });
  const co2 = val(own, "CO2 emisie", "CO2 emissions", "CO2-Emissionen");
  if (co2) specs.push({ label: "Emisie CO2", value: co2 });
  const tk = val(own, "TK platná do", "MOT valid until", "HU gültig bis");
  if (tk) specs.push({ label: "Technická kontrola platná do", value: tk.replace(/\s+/g, " ").replace(/^(\d{1,2})\.\s*(\d{4})$/, (_, m, y) => `${Number(m)}/${y}`) });
  const owners = val(own, "Celkový počet majiteľov", "Number of owners", "Anzahl Vorbesitzer");
  if (owners) specs.push({ label: "Počet majiteľov", value: owners.replace(/\(Vrátane obchodníkov s vozidlami\)/i, "(vrátane predajcov)") });
  const keys = digits(val(own, "Počet kľúčov", "Number of keys", "Anzahl Schlüssel"));
  if (keys) { out.keys = true; specs.push({ label: "Počet kľúčov", value: String(keys) }); }
  const coc = val(own, "COC dokumenty", "COC documents", "COC-Papiere");
  if (coc) specs.push({ label: "COC doklad", value: /^(áno|yes|ja)/i.test(coc) ? "Áno" : "Nie" });
  const origin = val(own, "Krajina pôvodu", "Country of origin", "Herkunftsland");
  const lastReg = val(own, "Krajina poslednej registrácie", "Country of last registration", "Land der letzten Zulassung");
  if (origin) specs.push({ label: "Krajina pôvodu", value: COUNTRY[origin.toUpperCase()] || origin });
  const service = val(own, "Detaily servisnej knižky", "Service book", "Serviceheft");
  if (service && !/nedostupn|not available|nicht verfügbar/i.test(service)) specs.push({ label: "Servisná knižka", value: service });
  const tuning = val(own, "Tuningové vozidlo", "Tuned vehicle", "Tuning-Fahrzeug");
  const tuningNote = val(own, "Poznámka o tuningu", "Tuning note", "Tuning-Hinweis");
  const origEngine = val(own, "Originálny motor", "Original engine", "Originalmotor");
  const tuned = !!tuning && /^(áno|yes|ja)/i.test(tuning);
  if (tuned) {
    specs.push({ label: "Úpravy (tuning)", value: tuningNote ? `Áno (${tuningNote.replace(/[-\s]+$/, "").replace(/-\s*/g, ", ")})` : "Áno" });
    missing.push(`POZOR, tuning: auto je upravené${tuningNote ? ` (${tuningNote.replace(/[-\s]+$/, "")})` : ""}. Úpravy sa musia dať schváliť na Slovensku alebo vrátiť do pôvodného stavu, zohľadnite to v cene a v popise`);
  }
  if (origEngine && /^(nie|no|nein)/i.test(origEngine)) {
    specs.push({ label: "Originálny motor", value: "Nie" });
    missing.push("POZOR: auto nemá originálny motor (vymenený motor treba doložiť pri schválení)");
  }
  const lastService = val(own, "Posledná prehliadka", "Last service", "Letzter Service");
  const serviceKm = digits(val(own, "Stav tachometra pri poslednom servise", "Mileage at last service", "Kilometerstand beim letzten Service"));
  const serviceSome = val(own, "Servisná prehliadka", "Service history", "Servicehistorie");
  if (serviceSome && !/^(-|žiadny|none|keine)$/i.test(serviceSome)) specs.push({ label: "Servisná história", value: serviceSome });
  if (lastService && lastService !== "-") specs.push({ label: "Posledný servis", value: `${lastService.replace(/\s+/g, " ")}${serviceKm ? ` pri ${num(serviceKm)} km` : ""}` });
  const battery = val(own, "Batéria prenajatá", "Battery leased", "Batterie gemietet");
  if (battery && /^(áno|yes|ja)/i.test(battery)) missing.push("pozor, batéria je prenajatá (nájom batérie sa musí riešiť zvlášť)");
  const cable = val(own, "Je k dispozícii nabíjací kábel", "Charging cable available", "Ladekabel vorhanden");
  if (cable) specs.push({ label: "Nabíjací kábel", value: /^(áno|yes|ja)/i.test(cable) ? "Áno" : "Nie" });
  if (/NENAŠLI ŽIADNE CHYBY|NO (FAULTS|ERRORS) (WERE )?FOUND|KEINE FEHLER/i.test(own)) specs.push({ label: "Diagnostika", value: "Bez chýb v pamäti riadiacich jednotiek" });
  if (out.lot) specs.push({ label: "Skladové číslo predajcu", value: out.lot });

  /* miesto: „Umiestnenie vozidlaDE, Sandersdorf-Brehna“ (popisok a hodnota bývajú zlepené) */
  const loc = own.match(/(?:Umiestnenie vozidla|Vehicle location|Fahrzeugstandort)\s*:?\s*([A-Z]{2})\s*,\s*([^\n]+)/i);
  const cc = (loc?.[1] || lastReg || origin || "DE").toUpperCase();
  const state = COUNTRY[cc] ? cc : "DE";
  out.location = `${loc ? `${loc[2].trim()}, ` : ""}${COUNTRY[state]}`;
  if (!loc) missing.push(`miesto auta (stránka ho neukázala, nastavil som ${COUNTRY[state]})`);

  /* stav: testovacia jazda, zistenia, poškodenie */
  const drove = /INFORMÁCIE O TESTOVACEJ JAZDE|TEST DRIVE|PROBEFAHRT/i.test(own);
  const findings: string[] = [];
  const td = own.match(/\n\s*(INFORMÁCIE O TESTOVACEJ JAZDE|TEST DRIVE INFORMATION|PROBEFAHRT)[^\n]*\n([\s\S]*?)\n\s*(ZHRNUTIE POŠKODENIA|DAMAGE SUMMARY|SCHADEN)/i);
  if (td) {
    let head = "", body: string[] = [];
    const flush = () => { const b = body.join(" ").replace(/\s*:\s*/g, ": ").trim(); if (head && b && !/žiadne špecifické zistenia|no specific findings|keine besonderen/i.test(b)) findings.push(`${head} ${b}`); head = ""; body = []; };
    for (const l of td[2].split("\n").map((x) => x.trim()).filter(Boolean)) {
      if (/^MIESTO TESTOVACEJ|^TEST DRIVE LOCATION/i.test(l)) continue;
      if (/^[^:]{2,40}:$/.test(l)) { flush(); head = l; } else if (head) body.push(l);
    }
    flush();
  }
  // auto, ktoré prešlo testovacou jazdou, ide a jazdí; zistenia z jazdy sú v histórii a v zozname na doplnenie
  out.run_status = drove ? "run_drive" : "unknown";
  const dmg = damage(own);
  const accident = own.match(/(Predchádzajúce poškodenie \/ Havária[^\n]*?|Previous damage[^\n]*?|Unfallschaden[^\n]*?)\s+(Áno|Nie|Yes|No|Ja|Nein)\s*(?:\n|$)/i);
  const hadAccident = !!accident && /^(áno|yes|ja)$/i.test(accident[2]);
  if (accident) specs.push({ label: "Predchádzajúca havária (podľa majiteľa)", value: hadAccident ? "Áno" : "Nie" });
  const zl = [...dmg.zones.values()];
  const heavy = zl.some((z) => z.severity === "heavy"), medium = zl.some((z) => z.severity === "medium");
  out.primary_damage = hadAccident ? "Opravené po nehode (podľa majiteľa)" : heavy ? "Poškodené diely karosérie" : medium ? "Preliačiny a poškodenie laku" : zl.length ? "Bežné opotrebenie (škrabance, drobné preliačiny)" : dmg.found ? "Bez poškodenia" : undefined;
  if (!dmg.found) missing.push("stav auta (stránka neukázala tabuľku poškodenia, skontrolujte inšpekciu na AUTO1)");
  out.title_type = coc && /^(áno|yes|ja)/i.test(coc) ? "EÚ doklady (COC)" : "EÚ doklady";

  /* cena: Kúpiť hneď (pevná) alebo aukcia s minimálnou ponukou. Ponuka na AUTO1 už zahŕňa čistý aukčný poplatok. */
  const buyNow = priceNear(own, /^\s*(Kúpiť (hneď|teraz|ihneď)|Okamžit\w* (nákup|kúpa)|Buy (it )?now|Instant purchase|Sofort kaufen|Sofortkauf)\s*$/i, "before")
    || priceNear(own, /^\s*(Auto1 cena|Auto1 price|Auto1 Preis|Pevná cena|Fixed price|Festpreis)\s*:?/i, "after");
  const minBid = priceAfter(own, /^\s*(Minimálna ponuka|Minimum bid|Mindestgebot)\s*:?/i);
  const curBid = priceAfter(own, /^\s*(Aktuálna ponuka|Najvyššia ponuka|Vaša ponuka|Current bid|Highest bid|Aktuelles Gebot|Höchstgebot)\s*:?/i);
  const channel = (own.match(/\n\s*(24H AUKCIA|ŠPECIÁLNA PONUKA[^\n]*|[^\n]*AUKCIA|24H AUCTION|[^\n]*AUCTION)\s*\n/i) || [])[1]?.trim();
  const blurred = /\n\s*-\s?[\d\s]+\s*[A-Z]{3}\s*\n/.test(own) && !minBid && !buyNow;
  let price = 0;
  if (buyNow > 0) {
    price = roundUpK(buyNow);
    missing.push(`kontrolu ceny: cena Kúpiť ihneď je ${num(buyNow)} €${minBid ? ` (v aukcii minimálna ponuka ${num(minBid)} €)` : ""}, nastavil som pevnú cenu ${num(price)} € (zaokrúhlené nahor na celú tisícku)`);
  } else if (curBid > 0 || minBid > 0) {
    const base = Math.max(curBid, minBid);
    price = roundUpK(base);
    missing.push(`váš odhad vydraženia: ${channel ? `${channel.toLowerCase()}, ` : ""}${curBid ? `aktuálna ponuka ${num(curBid)} €` : `minimálna ponuka ${num(minBid)} €`}. Ako cenu som zatiaľ nastavil ${num(price)} € (zaokrúhlené nahor na celú tisícku), prepíšte ju sumou, s ktorou rátate`);
  } else missing.push(blurred ? "cenu auta (AUTO1 ju ukáže až po overení účtu, potom importujte znova)" : "cenu auta (stránka ju neukázala)");
  // DPH z aukčného poplatku platí kupujúci podľa svojej daňovej situácie, AUTO1 ju uvádza orientačne
  const feeRaw = (own.match(/zaplatiť sumu okolo\s+(-?[\d\s.,]+)\s*(?:€|EUR)?|pay (?:an amount of )?around\s+€?\s*(-?[\d\s.,]+)/i) || []).slice(1).find(Boolean) || "";
  const feeVat = /^-/.test(feeRaw.trim()) ? 0 : Math.ceil(Number(feeRaw.replace(/\s/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", ".")) || 0);
  const override: CalcOverride = {};
  if (feeVat > 0) {
    override.extraCosts = [{ label: "Poplatky predajcu", eur: feeVat }];
    missing.push(`kontrolu poplatkov: ponuka na AUTO1 zahŕňa čistý aukčný poplatok, k tomu som pridal DPH z poplatku okolo ${num(feeVat)} € ako položku Poplatky predajcu`);
  } else missing.push("poplatky: ponuka na AUTO1 už zahŕňa čistý aukčný poplatok, DPH z poplatku stránka neuviedla, skontrolujte v potvrdení nákupu");
  missing.push("DPH auta: overte na AUTO1, či je auto s odpočtom DPH (cena bez DPH) alebo v osobitnej úprave. Ak je cena bez DPH, vypnite pri aute prepínač „Cena auta je konečná“");

  /* doprava: ak AUTO1 ukáže cenu doručenia, len ju pripomenieme, kalkulácia počíta dopravu podľa krajiny */
  const delivery = priceAfter(own, /^\s*(Doručenie na moju adresu|Delivery to my address|Lieferung an meine Adresse)\s*$/i);
  missing.push(delivery ? `kontrolu dopravy: AUTO1 ponúka doručenie na vašu adresu za ${num(delivery)} €, kalkulácia počíta dopravu z krajiny ${COUNTRY[state]} podľa Nastavení` : `dopravu: AUTO1 doručenie na Slovensko neukázalo, kalkulácia počíta dopravu z krajiny ${COUNTRY[state]} podľa Nastavení (pri vyzdvihnutí v logistickom centre si dopravu objednávame sami)`);

  /* popis (zobrazuje sa na webe) */
  const name = [out.year, out.make, out.model, out.trim].filter(Boolean).join(" ");
  const parts: string[] = [];
  if (name) parts.push(`${name} ${FROM[state] || "z EÚ"}.`);
  const bodySk = b?.[1] || "";
  const tech = [out.engine, out.fuel?.toLowerCase(), out.transmission?.toLowerCase(), out.drive ? `pohon ${out.drive}` : "", /^(SUV|MPV)$/.test(bodySk) ? bodySk : bodySk.toLowerCase(), out.color ? `farba ${out.color.toLowerCase()}` : ""].filter(Boolean).join(", ");
  if (tech) parts.push(`Technika: ${tech}.`);
  if (km) parts.push(`Nájazd ${num(km)} km.`);
  if (reg) parts.push(`Prvá registrácia ${reg.replace(/\s+/g, " ").replace(/^(\d{1,2})\.\s*(\d{4})$/, (_, m, y) => `${Number(m)}/${y}`)}.`);
  if (hadAccident) parts.push("Auto bolo podľa predchádzajúceho majiteľa po nehode.");
  else if (heavy || medium) parts.push(`${accident ? "Podľa predchádzajúceho majiteľa auto nebolo havarované. " : ""}Inšpekcia uvádza poškodenia karosérie, ich zoznam je pri aute.`);
  else if (zl.length) parts.push(`${accident ? "Podľa predchádzajúceho majiteľa auto nebolo havarované. " : ""}Inšpekcia uvádza len bežné opotrebenie (drobné škrabance a preliačiny).`);
  else if (dmg.found) parts.push("Inšpekcia neuvádza žiadne poškodenie.");
  parts.push(drove ? (findings.length ? "Auto prešlo testovacou jazdou so zisteniami uvedenými pri aute." : "Auto prešlo testovacou jazdou bez zistení.") : "Stav auta overíme pred kúpou.");
  if (tuned) parts.push("Auto má úpravy výkonu alebo vzhľadu, ktoré pred prihlásením riešime podľa predpisov.");
  if (keys) parts.push(keys > 1 ? `K autu sú ${keys} kľúče.` : "K autu je jeden kľúč.");
  parts.push("Auto je v Európskej únii, takže sa neplatí clo ani dovozná DPH a nie je potrebná homologizácia.");

  const history: string[] = [];
  if (dmg.lines.length) history.push(`Poškodenia podľa inšpekcie: ${dmg.lines.join("; ")}.`);
  if (findings.length) history.push(`Zistenia z testovacej jazdy: ${findings.map((f) => f.replace(/\.+$/, "")).join("; ")}.`);
  const extra: CarExtra = { specs };
  const eq = equipment(own);
  if (eq.length) extra.equipment = eq;
  if (history.length) extra.history = history.join(" ");

  /* čo treba doplniť ručne */
  if (!out.vin) missing.push("VIN (stránka ho neukázala)");
  if (!km) missing.push("nájazd");
  if (!out.make || !out.model) missing.push("značku a model (nadpis sa nepodarilo rozdeliť)");
  else if (!modelsOf(MAKES.find((x) => x.name.toLowerCase() === out.make!.toLowerCase())?.slug || "").length) missing.push(`kontrolu rozdelenia názvu na značku, model a výbavu („${titleLine}“)`);
  if (findings.length) missing.push("preklad zistení z testovacej jazdy do popisu");
  if (p.u && !(p.bv && p.bv >= 4)) missing.unshift("STARÁ ZÁLOŽKA: pre AUTO1 odstráňte záložku Import do REM z lišty a potiahnite ju sem nanovo, inak sa nemusí načítať celá stránka (výbava, poškodenie)");
  missing.push("cenu na Slovensku");

  const images = photos(p, out.lot);
  if (!images.length) missing.push(p.u ? "fotky" : "fotky (z vloženého textu sa nedajú stiahnuť, použite záložku Import do REM priamo na stránke auta)");
  (Object.keys(out) as (keyof Parsed)[]).forEach((k) => out[k] === undefined && delete out[k]);
  return {
    parsed: out,
    patch: {
      country: "EU", currency: "EUR", state, sale_type: "fixed", auction: "AUTO1", auction_end_at: null,
      ...(price ? { price_usd: price } : {}), seller_fee_usd: 0,
      damage_zones: zl, extra, ...(Object.keys(override).length ? { calc_override: override } : {}), description: parts.join(" ")
    },
    url: p.u ? p.u.split("?")[0] : (out.lot ? `https://www.auto1.com/sk/app/merchant/car/${out.lot}` : ""), images, saleEnd: null, source: "auto1.com", missing
  };
}

/** Fotky auta z img-pa.auto1.com: miniatúry „sr-x2-<sklad>_<hash>.jpg“ majú veľkú verziu „max-…“. Berieme len fotky tohto auta, každú raz. */
function photos(p: ImportPayload, stock?: string): string[] {
  const all = [...(p.g || []), ...(p.c || [])].map((u) => u.split("#")[0].split("?")[0]).filter((u) => /^https:\/\/img-pa\.auto1\.com\//i.test(u));
  const mine = stock ? all.filter((u) => new RegExp(`[-/]${esc(stock)}_[0-9a-f]{16,}\\.`, "i").test(u)) : all;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of mine) {
    const key = (u.match(/_([0-9a-f]{16,})\.\w+$/i) || [])[1] || u;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(u.replace(/\/(?:sr-x\d+|fp|thumb|th|sm|md|lg)-([A-Z0-9]+_[0-9a-f]{16,}\.\w+)$/i, "/max-$1"));
  }
  return out.slice(0, 60);
}
