/**
 * Import auta z kórejských inzerátov: Encar (domáci trh, cena v KRW) a Autowini (export, cena FOB v USD).
 * Záložka „Import do REM“ na Encare navyše stiahne štruktúrované údaje z ich rozhrania (inzerát, poistná história,
 * technická prehliadka), na Autowini sa číta text stránky. Výsledok má rovnaký tvar ako import z aukcie.
 */
import { mapDrive, mapFuel, mapType, titleCase, type Parsed } from "./listingParse";
import type { ImportPayload, Imported } from "./importListing";
import type { CalcOverride, CarExtra, DamageZone, Severity } from "./types";

type Obj = Record<string, unknown>;
const o = (v: unknown): Obj => (v && typeof v === "object" ? (v as Obj) : {});
const s = (v: unknown) => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");
const n = (v: unknown) => Number(String(v ?? "").replace(/[^\d.]/g, "")) || 0;
const num = (x: number) => x.toLocaleString("sk-SK");
const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function line(text: string, ...keys: string[]) {
  for (const k of keys) {
    const m = text.match(new RegExp(`(?:^|\\n)\\s*${esc(k)}\\s*[:#]?[ \\t]*\\n?\\s*([^\\n]+)`, "i"));
    if (m && m[1].trim()) return m[1].trim();
  }
  return undefined;
}

/** Kontrola vozidla na mieste a vývozná dokumentácia pri kúpe za pevnú cenu v Kórei (nie je to rezervácia auta). */
export const KR_EXPORT_FEE_EUR = 250;
const EXPORT_COST = { label: "Kontrola vozidla a vývozná dokumentácia v Kórei", eur: KR_EXPORT_FEE_EUR };
/** Cena v KRW zaokrúhlená nahor na ďalší celý milión (rezerva na zmenu ceny u predajcu). */
const roundUpM = (x: number) => (Math.floor(x / 1e6) + 1) * 1e6;
/** Cena v USD zaokrúhlená nahor na ďalšiu celú tisícku (rovnako ako pevné ceny z USA). */
const roundUpK = (x: number) => (Math.floor(x / 1000) + 1) * 1000;

export const isEncar = (u: string) => /(^|\.)encar\.com$/i.test(host(u));
export const isAutowini = (u: string) => /(^|\.)autowini\.com$/i.test(host(u));
function host(u: string) { try { return new URL(u).hostname; } catch { return ""; } }

/* ───────── miesto v Kórei ───────── */

const PLACES: [RegExp, string, string][] = [
  [/서울|seoul/i, "SEL", "Soul"], [/인천|incheon/i, "ICN", "Inčchon"], [/경기|gyeonggi|suwon|수원|성남|고양|용인|부천|안산|화성/i, "GG", "Kjonggi"],
  [/부산|busan|pusan/i, "PUS", "Pusan"]
];
function place(raw: string) {
  const hit = PLACES.find(([r]) => r.test(raw));
  return hit ? { state: hit[1], location: `${hit[2]}, Južná Kórea` } : { state: "KR-X", location: "Južná Kórea" };
}

/* ───────── preklady z kórejčiny ───────── */

const KO_FUEL: [RegExp, string][] = [[/플러그인/, "Plug-in hybrid"], [/\+\s*전기|하이브리드/, "Hybrid"], [/전기/, "Elektro"], [/수소/, "Vodík"], [/디젤|경유/, "Diesel"], [/LPG|LPi/i, "LPG"], [/가솔린|휘발유/, "Benzín"]];
const KO_COLOR: [RegExp, string][] = [
  [/진주|펄/, "Perleťovo biela"], [/흰|백색|화이트/, "Biela"], [/검정|블랙|흑/, "Čierna"], [/진회|쥐색|다크그레이/, "Tmavosivá"], [/은회/, "Striebornosivá"],
  [/은하|은색|실버/, "Strieborná"], [/회색|그레이/, "Sivá"], [/하늘/, "Svetlomodrá"], [/남색|네이비/, "Tmavomodrá"], [/청색|파란|블루/, "Modrá"],
  [/빨간|레드|적색/, "Červená"], [/와인|버건디/, "Bordová"], [/갈색|브라운/, "Hnedá"], [/베이지/, "Béžová"], [/금색|골드/, "Zlatá"],
  [/녹색|초록|그린/, "Zelená"], [/주황|오렌지/, "Oranžová"], [/노란|옐로/, "Žltá"], [/보라|퍼플/, "Fialová"], [/분홍|핑크/, "Ružová"]
];
const KO_BODY: [RegExp, string][] = [[/세단/, "Sedan"], [/해치백/, "Hatchback"], [/왜건/, "Kombi"], [/쿠페/, "Kupé"], [/컨버터블|카브리올레/, "Kabriolet"], [/SUV/i, "SUV"], [/RV|승합|밴/i, "MPV"], [/트럭|화물|픽업/, "Pickup"]];
const ko = (map: [RegExp, string][], v: string) => (v ? map.find(([r]) => r.test(v))?.[1] : undefined);

/** Diel karosérie z technickej prehliadky (성능점검) → zóny na nákrese. */
const KO_PARTS: [RegExp, string[] | ((side: "l" | "r" | "") => string[])][] = [
  [/후드|본넷/, ["hood"]], [/프론트\s*휀더|앞\s*휀더/, (x) => (x === "r" ? ["fr_fender"] : x === "l" ? ["fl_fender"] : ["fl_fender", "fr_fender"])],
  [/프론트\s*도어|앞\s*도어/, (x) => (x === "r" ? ["fr_door"] : x === "l" ? ["fl_door"] : ["fl_door", "fr_door"])],
  [/리어\s*도어|뒤\s*도어/, (x) => (x === "r" ? ["rr_door"] : x === "l" ? ["rl_door"] : ["rl_door", "rr_door"])],
  [/쿼터\s*패널|리어\s*휀더|뒤\s*휀더/, (x) => (x === "r" ? ["rr_quarter"] : x === "l" ? ["rl_quarter"] : ["rl_quarter", "rr_quarter"])],
  [/트렁크\s*리드|테일\s*게이트|백\s*도어/, ["trunk"]], [/루프/, ["roof"]],
  [/프론트\s*패널|라디에이터/, ["front_bumper"]], [/리어\s*패널|트렁크\s*플로어/, ["rear_bumper"]],
  [/사이드\s*실|필러|인사이드\s*패널|휠\s*하우스|대쉬|플로어|사이드\s*멤버|크로스\s*멤버/, ["frame"]]
];
const PART_SK: [RegExp, string][] = [
  [/후드|본넷/, "kapota"], [/프론트\s*휀더|앞\s*휀더/, "predný blatník"], [/프론트\s*도어|앞\s*도어/, "predné dvere"], [/리어\s*도어|뒤\s*도어/, "zadné dvere"],
  [/쿼터\s*패널|리어\s*휀더|뒤\s*휀더/, "zadný blatník"], [/트렁크\s*리드|테일\s*게이트|백\s*도어/, "veko kufra"], [/루프/, "strecha"],
  [/라디에이터/, "nosník chladiča"], [/프론트\s*패널/, "predný panel"], [/리어\s*패널/, "zadný panel"], [/트렁크\s*플로어/, "podlaha kufra"],
  [/사이드\s*실/, "prah"], [/필러/, "stĺpik"], [/인사이드\s*패널/, "vnútorný panel"], [/휠\s*하우스/, "podbeh"], [/대쉬/, "predná stena"],
  [/플로어/, "podlaha"], [/사이드\s*멤버/, "pozdĺžnik"], [/크로스\s*멤버/, "priečnik"]
];
const STATUS_SK: [RegExp, string, Severity][] = [[/^X$|교환/, "vymenený", "medium"], [/^W$|판금|용접/, "opravený plech alebo zváranie", "medium"], [/^C$|부식/, "korózia", "light"], [/^A$|흠집/, "škrabance", "light"], [/^U$|요철/, "nerovnosť", "light"], [/^T$|손상/, "poškodenie", "medium"]];

const low = (x: string) => (/^[A-Z]{2,}$/.test(x) ? x : x.toLowerCase());
const EQUIP: Record<string, string> = {
  "driver airbag": "Airbag vodiča", "passenger airbag": "Airbag spolujazdca", "side airbag": "Bočné airbagy", "curtain airbag": "Hlavové airbagy", "knee airbag": "Kolenný airbag",
  "front warning sensor": "Predné parkovacie senzory", "park assist sensor": "Parkovacie senzory", "rear view camera": "Cúvacia kamera", "surround view": "Kamera 360°",
  "abs (anti-lock brake system)": "ABS", "esp (electronic stability program)": "ESP", "eps (electric power steering)": "Elektrický posilňovač riadenia",
  "ldws (lane departure warning system)": "Varovanie pred opustením jazdného pruhu", "aeb(autonomous emergency braking)": "Automatické núdzové brzdenie", "bsd(blind spot detection device)": "Sledovanie mŕtveho uhla",
  "led lamp": "LED svetlá", "panorama sunroof": "Panoramatická strecha", sunroof: "Strešné okno", "alloy wheels": "Hliníkové disky", "hid lamp": "Xenónové svetlá",
  "air conditioner": "Klimatizácia", "full auto air conditioner": "Automatická klimatizácia", "rear air conditioner": "Klimatizácia vzadu", "heating seat": "Vyhrievané sedadlá",
  "leather seats": "Kožené sedadlá", "memory seat": "Pamäť sedadiel", "power seat": "Elektrické sedadlá", "cooling seat": "Ventilované sedadlá", "heated steering": "Vyhrievaný volant",
  "cruise control": "Tempomat", "smart cruise control": "Adaptívny tempomat", radio: "Rádio", usb: "USB", bluetooth: "Bluetooth", "navigation": "Navigácia", "auto folding side mirror": "Elektricky sklopné zrkadlá",
  "power windows": "Elektrické okná", "power trunk": "Elektrické veko kufra", "smart key": "Bezkľúčové odomykanie", "button start/stop": "Štartovanie tlačidlom", "digital cluster": "Digitálny prístrojový panel",
  "hud (head up display)": "Head-up displej", "electric parking brake": "Elektrická parkovacia brzda", "rain sensor": "Dažďový senzor", "auto light": "Automatické svetlá"
};
const events = (k: number) => (k === 1 ? "1 poistná udalosť" : k <= 4 ? `${k} poistné udalosti` : `${k} poistných udalostí`);
const EN_COLOR: Record<string, string> = { black: "Čierna", white: "Biela", "pearl white": "Perleťovo biela", silver: "Strieborná", gray: "Sivá", grey: "Sivá", "dark gray": "Tmavosivá", blue: "Modrá", "dark blue": "Tmavomodrá", navy: "Tmavomodrá", red: "Červená", wine: "Bordová", green: "Zelená", yellow: "Žltá", orange: "Oranžová", brown: "Hnedá", beige: "Béžová", gold: "Zlatá", purple: "Fialová", pink: "Ružová" };
/** „15th Feb. 2005“ → „15. 2. 2005“ */
function enDate(v: string) {
  const m = v.match(/(\d{1,2})\w*\s+([A-Za-z]{3})\w*\.?\s+(\d{4})/);
  const mon = m ? ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(m[2].toLowerCase()) : -1;
  return m && mon >= 0 ? `${Number(m[1])}. ${mon + 1}. ${m[3]}` : v;
}

/* ───────── Encar ───────── */

function fromEncar(p: ImportPayload): Imported {
  const e = o(p.e), v = o(e.v), rec = o(e.r), ins = o(e.i);
  const cat = o(v.category), spec = o(v.spec), ad = o(v.advertisement), master = o(ins.master), det = o(master.detail);
  const out: Parsed = {};
  const missing: string[] = [];
  const specs: { label: string; value: string }[] = [];
  const override: CalcOverride = { extraCosts: [EXPORT_COST] };

  if (!Object.keys(v).length) missing.push("údaje z rozhrania Encaru (záložka ich nestiahla, skúste stránku obnoviť a importovať znova, prípadne pridajte záložku Import do REM nanovo)");

  /* názov: anglické názvy z Encaru, z kórejského názvu modelu berieme len latinské označenie generácie (IG, DN8, GN7) */
  const make = s(cat.manufacturerEnglishName);
  // Encar má v anglických názvoch preklepy
  const group = s(cat.modelGroupEnglishName).replace(/^Canival$/i, "Carnival");
  const gen = (s(cat.modelName).match(/\b[A-Za-z][A-Za-z0-9-]*\b/g) || []).filter((t) => !new RegExp(`^${esc(group)}$`, "i").test(t) && !/^(the|new|all)$/i.test(t));
  if (make) out.make = titleCase(make);
  if (group) out.model = [titleCase(group), ...gen.map((g) => g.toUpperCase() === g || /\d/.test(g) ? g : titleCase(g))].join(" ");
  const trim = [s(cat.gradeEnglishName), s(cat.gradeDetailEnglishName)].filter(Boolean).join(" ");
  if (trim) out.trim = trim.length <= 40 ? trim : trim.slice(0, 40).trim();
  const year = Number(s(cat.formYear)) || Number(s(cat.yearMonth).slice(0, 4)) || 0;
  if (year) out.year = year;
  const vin = s(v.vin) || s(det.vin);
  if (/^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)) out.vin = vin.toUpperCase();

  /* technika */
  const km = n(spec.mileage) || n(det.mileage);
  if (km) out.odometer_mi = Math.round(km / 1.609344);
  const fuelKo = s(spec.fuelName);
  out.fuel = ko(KO_FUEL, fuelKo) || mapFuel(fuelKo);
  const cc = n(spec.displacement);
  const motor = s(det.motorType);
  out.engine = out.fuel === "Elektro" ? "Elektro" : cc ? `${(cc / 1000).toFixed(1)}${motor ? ` (${motor})` : ""}` : undefined;
  const tr = s(spec.transmissionName);
  out.transmission = /오토|자동|auto/i.test(tr) ? "Automat" : /수동|manual/i.test(tr) ? "Manuál" : /CVT/i.test(tr) ? "Automat CVT" : tr || undefined;
  const drv = `${trim} ${s(cat.modelName)}`;
  out.drive = /4WD|4X4/i.test(drv) ? "4x4" : /AWD|HTRAC|xDrive|4MATIC|quattro|4Motion/i.test(drv) ? "AWD" : undefined;
  const color = s(spec.colorName) || s(spec.customColor);
  if (color) out.color = ko(KO_COLOR, color) || color;
  const shape = s(rec.carShape) || s(spec.bodyName);
  const bodySk = ko(KO_BODY, shape) || (/RV/.test(s(spec.bodyName)) ? "MPV" : /SUV/i.test(s(spec.bodyName)) ? "SUV" : "");
  out.type = /SUV|MPV/.test(bodySk) ? "suv" : bodySk === "Pickup" ? "truck" : mapType(bodySk) || "car";
  if (bodySk) specs.push({ label: "Karoséria", value: bodySk });
  if (n(spec.seatCount)) specs.push({ label: "Počet miest", value: String(n(spec.seatCount)) });
  if (cc) specs.push({ label: "Objem motora", value: `${num(cc)} cm³` });

  /* miesto predajcu */
  const pl = place(s(o(v.contact).address) || p.t || "");
  out.location = pl.location;

  /* cena: Encar uvádza cenu v desaťtisícoch wonov (만원), 9999 znamená cenu na dohodu */
  const man = n(ad.price);
  const krw = man > 0 && man < 9999 ? man * 10000 : 0;
  let price = 0;
  if (krw) {
    price = roundUpM(krw);
    missing.push(`kontrolu ceny: predajca uvádza ${num(krw)} KRW, nastavil som pevnú cenu ${num(price)} KRW (zaokrúhlené nahor na celý milión)`);
  } else missing.push("cenu auta (predajca ju neuvádza, dohodnite ju cez agenta)");

  /* história z poistného registra (보험이력) */
  const own = n(rec.ownerChangeCnt), myAcc = n(rec.myAccidentCnt), oAcc = n(rec.otherAccidentCnt), accCost = n(rec.myAccidentCost) + n(rec.otherAccidentCost);
  const flood = n(rec.floodTotalLossCnt) + n(rec.floodPartLossCnt), total = n(rec.totalLossCnt), theft = n(rec.robberCnt);
  const first = s(rec.firstDate) || s(det.firstRegistrationDate).replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3");
  if (first) specs.push({ label: "Prvá registrácia", value: first.split("-").reverse().join(". ") });
  if (Object.keys(rec).length) {
    specs.push({ label: "Zmeny majiteľa", value: String(own) });
    specs.push({ label: "Poistné udalosti", value: myAcc + oAcc ? `${myAcc + oAcc} (plnenie spolu ${num(accCost)} KRW)` : "Žiadne" });
    if (flood) specs.push({ label: "Záplava", value: "Áno, podľa poistného registra" });
    if (total) specs.push({ label: "Totálna škoda", value: "Áno, podľa poistného registra" });
    if (n(rec.business)) specs.push({ label: "Predchádzajúce použitie", value: "Firemné auto" });
  } else missing.push("poistnú históriu (Encar ju k tomuto autu nezverejnil, overte ju cez agenta)");
  const usage = (Array.isArray(det.usageChangeTypes) ? det.usageChangeTypes : []).map((x) => s(o(x).title));
  if (usage.some((u) => /렌트/.test(u)) && !specs.some((x) => x.value === "Požičovňa")) specs.push({ label: "Predchádzajúce použitie", value: "Požičovňa" });
  if (usage.some((u) => /영업|택시/.test(u))) specs.push({ label: "Predchádzajúce použitie", value: "Taxi alebo komerčné" });

  /* stav podľa technickej prehliadky (성능점검): vymenené a opravené diely karosérie */
  const zones = new Map<string, DamageZone>();
  const fixes: string[] = [];
  for (const x of Array.isArray(ins.outers) ? ins.outers : []) {
    const part = s(o(o(x).type).title);
    const st = (Array.isArray(o(x).statusTypes) ? (o(x).statusTypes as unknown[]) : []).map((y) => ({ c: s(o(y).code), t: s(o(y).title) }));
    const rank = String(o(x).attributes || "");
    const side = /\(좌\)|좌측/.test(part) ? "l" : /\(우\)|우측/.test(part) ? "r" : "";
    const hit = KO_PARTS.find(([r]) => r.test(part));
    const ids = hit ? (typeof hit[1] === "function" ? hit[1](side) : hit[1]) : [];
    const stSk = st.map(({ c, t }) => STATUS_SK.find(([r]) => r.test(c) || r.test(t))).filter(Boolean) as [RegExp, string, Severity][];
    const sev: Severity = /RANK_A|RANK_B/.test(rank) ? "heavy" : stSk.some((x) => x[2] === "medium") ? "medium" : "light";
    const what = stSk.map((x) => x[1]).join(", ") || "oprava";
    const name = `${PART_SK.find(([r]) => r.test(part))?.[1] || part}${side === "l" ? " ľavý" : side === "r" ? " pravý" : ""}`;
    fixes.push(`${name} (${what})`);
    for (const id of ids) if (!zones.has(id) || sev === "heavy") zones.set(id, { zone: id, severity: sev, note: `technická prehliadka: ${what}` });
  }
  const serious = (Array.isArray(det.seriousTypes) ? det.seriousTypes : []).length > 0;
  const hasIns = Object.keys(master).length > 0;
  const structural = master.accdient === true || [...zones.values()].some((z) => z.severity === "heavy");
  if (flood) zones.set("flood", { zone: "flood", severity: "heavy", note: "poistný register" });
  if (hasIns) {
    out.primary_damage = structural ? "Opravené po nehode (nosné diely)" : fixes.length ? "Opravené diely karosérie" : "Bez poškodenia";
    if (flood) out.secondary_damage = "Záplava";
    out.run_status = serious ? "starts" : "run_drive";
  } else {
    out.run_status = "unknown";
    missing.push("stav auta (k inzerátu nie je technická prehliadka, overte ho cez agenta)");
  }
  out.title_type = total || flood ? "Kórejská registrácia, v histórii totálna škoda" : "Kórejská registrácia (čistá)";
  if (fixes.length) specs.push({ label: "Opravy karosérie", value: fixes.join("; ") });

  const extra: CarExtra = { specs };
  const hist: string[] = [];
  if (Object.keys(rec).length) hist.push(`Poistný register: ${own} ${own === 1 ? "zmena" : own >= 2 && own <= 4 ? "zmeny" : "zmien"} majiteľa, ${myAcc + oAcc ? `${events(myAcc + oAcc)} s plnením spolu ${num(accCost)} KRW` : "bez poistných udalostí"}${flood ? ", záznam o záplave" : ""}${theft ? ", záznam o krádeži" : ""}.`);
  if (hasIns) hist.push(structural ? "Technická prehliadka uvádza opravu po nehode na nosných dieloch." : fixes.length ? `Technická prehliadka uvádza opravy: ${fixes.join("; ")}.` : "Technická prehliadka neuvádza žiadnu opravu karosérie.");
  if (hist.length) extra.history = hist.join(" ");

  const name = [out.year, out.make, out.model, out.trim].filter(Boolean).join(" ");
  const desc: string[] = [];
  if (name) desc.push(`${name} z Južnej Kórey${pl.state !== "KR-X" ? ` (${pl.location.replace(", Južná Kórea", "")})` : ""}.`);
  const tech = [out.engine, out.fuel?.toLowerCase(), out.transmission?.toLowerCase(), out.drive ? `pohon ${out.drive}` : "", low(bodySk), out.color ? `farba ${out.color.toLowerCase()}` : ""].filter(Boolean).join(", ");
  if (tech) desc.push(`Technika: ${tech}.`);
  if (km) desc.push(`Nájazd ${num(km)} km.`);
  if (hasIns) desc.push(structural ? "Auto bolo podľa technickej prehliadky opravené po nehode." : fixes.length ? "Auto je nehavarované, technická prehliadka uvádza opravené diely karosérie." : "Auto je podľa technickej prehliadky bez opráv karosérie.");
  if (Object.keys(rec).length) desc.push(myAcc + oAcc ? `Poistný register uvádza ${myAcc + oAcc === 1 ? "jednu poistnú udalosť" : `${myAcc + oAcc} poistné udalosti`}.` : "Poistný register neuvádza žiadnu poistnú udalosť.");
  desc.push("Stav auta overí náš agent v prístave po kúpe. Cena zahŕňa kúpu, vývoz, dopravu, clo, DPH, schválenie a prihlásenie na Slovensku.");

  if (!out.vin) missing.push("VIN");
  if (!out.drive) missing.push("pohon (Encar ho neuvádza, pri 4x4 verzii ho doplňte)");
  missing.push("cenu na Slovensku");
  missing.push(`kontrolu nákladov: pridal som položku „${EXPORT_COST.label}“ ${KR_EXPORT_FEE_EUR} €. Pri kórejských autách počítajte s dvojitou konverziou KRW na USD a EUR na USD`);

  const images = encarPhotos(v);
  if (!images.length) missing.push("fotky");
  (Object.keys(out) as (keyof Parsed)[]).forEach((k) => out[k] === undefined && delete out[k]);
  return {
    parsed: out,
    patch: {
      country: "KR", currency: "KRW", state: pl.state, sale_type: "fixed", auction: "Dealer", auction_end_at: null,
      ...(price ? { price_usd: price } : {}), seller_fee_usd: 0,
      damage_zones: [...zones.values()], extra, calc_override: override, description: desc.join(" ")
    },
    url: p.u, images, saleEnd: null, source: "encar.com", missing
  };
}

function encarPhotos(v: Obj): string[] {
  const ph = (Array.isArray(v.photos) ? v.photos : []).map((x) => ({ path: s(o(x).path), code: n(o(x).code), type: s(o(x).type) })).filter((x) => x.path);
  // poradie ako na Encare: exteriér, interiér, výbava
  const rank = (t: string) => (/OUTER/i.test(t) ? 0 : /INNER/i.test(t) ? 1 : 2);
  return ph.sort((a, b) => rank(a.type) - rank(b.type) || a.code - b.code).map((x) => `https://ci.encar.com/carpicture${x.path.startsWith("/") ? "" : "/"}${x.path}`).slice(0, 60);
}

/* ───────── Autowini ───────── */

function fromAutowini(p: ImportPayload): Imported {
  const text = (p.x || "").replace(/\r/g, "");
  const bi = text.search(/\nBasic Information\n/i);
  const head = bi < 0 ? text.slice(0, 1500) : text.slice(0, bi);
  const info = (bi < 0 ? text : text.slice(bi)).split(/\n(?:Price Guide|Seller'?s Vehicle Condition|Contact our staff|What you should know)/i)[0];
  const cond = text.slice(Math.max(0, text.search(/Seller'?s Vehicle Condition/i))).split(/\nContact our staff/i)[0];
  const out: Parsed = {};
  const missing: string[] = [];
  const specs: { label: string; value: string }[] = [];
  const yes = (k: string) => /^\s*yes/i.test(line(info, k) || "");

  const year = Number(line(info, "Model Year")) || Number(((p.t || "").match(/\b(19|20)\d{2}\b/) || [])[0]) || 0;
  if (year) out.year = year;
  const make = line(info, "Make");
  if (make) out.make = titleCase(make);
  const mcg = line(info, "Model / Class / Grade") || "";
  const [model, ...rest] = mcg.split(/\s+\/\s+/);
  if (model) out.model = model.trim();
  // „Grade“ je často reklama predajcu („NO*ACCI(SUNROOF+360CAM…“), takú do výbavy nedávame
  const trim = rest.join(" ").trim();
  if (trim && !/[*+]|NO\s*ACC|\(\S*$/i.test(trim) && trim.length <= 40) out.trim = trim;
  const vin = (text.match(/\b([A-HJ-NPR-Z0-9]{17})\b/) || [])[1];
  if (vin) out.vin = vin.toUpperCase();

  const cc = n(line(info, "Engine Volume"));
  const fuelEn = line(info, "Fuel Type") || "";
  out.fuel = /LPG|LPI/i.test(fuelEn) ? "LPG" : /hybrid/i.test(fuelEn) && /plug/i.test(fuelEn) ? "Plug-in hybrid" : /hybrid/i.test(fuelEn) ? "Hybrid" : /hydrogen/i.test(fuelEn) ? "Vodík" : mapFuel(fuelEn);
  const cylN = n(line(info, "Number of Cylinder", "Cylinders"));
  const hp = n(line(info, "Engine Power"));
  if (cylN) specs.push({ label: "Počet valcov", value: String(cylN) });
  out.engine = out.fuel === "Elektro" ? `Elektro${hp ? ` ${Math.round(hp * 0.7457)} kW` : ""}` : cc ? [(cc / 1000).toFixed(1), cylN ? (cylN >= 6 ? `V${cylN}` : `R${cylN}`) : "", hp ? `${Math.round(hp * 0.7457)} kW (${hp} k)` : ""].filter(Boolean).join(" ") : undefined;
  if (cc) specs.push({ label: "Objem motora", value: `${num(cc)} cm³` });
  const tr = line(info, "Transmission") || "";
  out.transmission = /auto/i.test(tr) ? "Automat" : /manual/i.test(tr) ? "Manuál" : tr || undefined;
  out.drive = mapDrive(line(info, "Drive Type"));
  const odo = line(info, "Odometer Reading") || "";
  const odoN = n(odo);
  if (odoN && !/not actual/i.test(odo)) out.odometer_mi = /mi(le)?s?\b/i.test(odo) ? odoN : Math.round(odoN / 1.609344);
  else missing.push("nájazd (predajca ho neuvádza alebo nie je skutočný)");
  const colorEn = line(info, "Exterior Color");
  if (colorEn) out.color = { charcoal: "Antracitová", "metal gray": "Sivá metalíza", "dark silver": "Tmavostrieborná", "light blue": "Svetlomodrá", ivory: "Slonovinová" }[colorEn.toLowerCase()] || EN_COLOR[colorEn.toLowerCase().replace(/\s*\(.*\)$/, "")] || titleCase(colorEn);
  const vt = line(info, "Vehicle Type") || "";
  out.type = /truck|pickup|bus|cargo/i.test(vt) ? "truck" : /suv|van|mini ?van|mpv/i.test(vt) ? "suv" : "car";
  if (vt) specs.push({ label: "Karoséria", value: /suv/i.test(vt) ? "SUV" : /van/i.test(vt) ? "MPV" : /sedan/i.test(vt) ? "Sedan" : /hatch/i.test(vt) ? "Hatchback" : /wagon/i.test(vt) ? "Kombi" : /coupe/i.test(vt) ? "Kupé" : /convert/i.test(vt) ? "Kabriolet" : /truck|pickup/i.test(vt) ? "Pickup" : vt });
  const seats = n(line(info, "No. of Passenger"));
  if (seats) specs.push({ label: "Počet miest", value: String(seats) });
  const steer = line(info, "Steering") || "";
  if (/RHD|right/i.test(steer)) { specs.push({ label: "Riadenie", value: "Vpravo" }); missing.push("pozor, auto má riadenie vpravo"); }
  const reg = line(info, "First Registration Date");
  if (reg) specs.push({ label: "Prvá registrácia", value: enDate(reg.replace(/\s*!$/, "")) });

  const pl = place(line(info, "Location") || "");
  out.location = pl.location;

  /* história a stav */
  const flood = yes("Water/Flood Damaged"), salvage = yes("Salvage Record");
  if (yes("Former Rental Car")) specs.push({ label: "Predchádzajúce použitie", value: "Požičovňa" });
  if (yes("Former Taxi")) specs.push({ label: "Predchádzajúce použitie", value: "Taxi" });
  if (yes("Police Vehicle")) specs.push({ label: "Predchádzajúce použitie", value: "Polícia" });
  if (yes("Recovered theft")) specs.push({ label: "Krádež v histórii", value: "Áno" });
  if (yes("Fuel Conversion")) specs.push({ label: "Prestavba na iné palivo", value: "Áno" });
  if (yes("Modified Seats")) specs.push({ label: "Upravené sedadlá", value: "Áno" });
  const zones = new Map<string, DamageZone>();
  if (flood) zones.set("flood", { zone: "flood", severity: "heavy", note: "podľa inzerátu" });
  const broken = (k: string) => /not\s*working|broken|defect/i.test(line(cond, k) || "");
  const bad = [["Engine", "engine", "motor"], ["Transmission", "transmission", "prevodovka"], ["Brake System", "mechanical", "brzdy"], ["A/C", "electrical", "klimatizácia"]].filter(([k]) => broken(k));
  for (const [, z, sk] of bad) zones.set(z, { zone: z, severity: "medium", note: `podľa predajcu nefunguje ${sk}` });
  const corr = line(cond, "Corrosion Status");
  if (corr) specs.push({ label: "Korózia podvozku", value: corr.replace(/less than/i, "menej ako").replace(/more than/i, "viac ako") });
  out.primary_damage = flood ? "Záplava" : bad.length ? "Mechanické" : salvage ? undefined : "Bez poškodenia";
  if (salvage) missing.push("stav auta (inzerát uvádza záznam o totálnej škode)");
  out.title_type = salvage ? "Kórejská registrácia, v histórii totálna škoda" : "Kórejská registrácia (čistá)";
  out.run_status = /\nEngine\s*\n\s*Working/i.test(cond) ? "run_drive" : bad.some(([k]) => k === "Engine") ? "no_start" : "unknown";

  /* cena FOB v USD: stránka ju má v kóde (prvok s cenou), v texte ju ukáže len prihlásenému */
  const fromAttr = n(p.ap);
  const prices = fromAttr >= 300 ? [fromAttr] : [...head.split(/Total Price with Shipping/i)[0].matchAll(/(?:US\s?\$|USD|\$)\s?([\d,]{3,})/gi)].map((m) => n(m[1])).filter((x) => x >= 300);
  const fob = prices.length ? prices[prices.length - 1] : 0;
  let price = 0;
  if (fob) {
    price = roundUpK(fob);
    missing.push(`kontrolu ceny: inzerát uvádza FOB ${num(fob)} USD, nastavil som pevnú cenu ${num(price)} USD (zaokrúhlené nahor na celú tisícku). Cena FOB zahŕňa dopravu do prístavu, preto je odvoz do prístavu 0`);
  } else missing.push("cenu FOB (Autowini ju ukáže len po prihlásení, prihláste sa a importujte znova)");

  /* výbava zo zoznamu Options (nadpisy skupín vynecháme) */
  const opt = (text.match(/\nOptions\n([\s\S]*?)\n(?:Price Guide|Seller'?s Vehicle Condition)/i) || [])[1] || "";
  const equipment = [...new Set(opt.split("\n").map((x) => x.trim()).filter((x) => x && !/^(Safety Device|Exterior Option|Interior Option|Options?|Multimedia|Convenience)$/i.test(x)).map((x) => EQUIP[x.toLowerCase()] || x))].slice(0, 60);
  const override: CalcOverride = { inlandUsd: 0, extraCosts: [EXPORT_COST] };
  const name = [out.year, out.make, out.model, out.trim].filter(Boolean).join(" ");
  const desc: string[] = [];
  if (name) desc.push(`${name} z Južnej Kórey.`);
  const bodySk = specs.find((x) => x.label === "Karoséria")?.value;
  const tech = [out.engine, out.fuel?.toLowerCase(), out.transmission?.toLowerCase(), out.drive ? `pohon ${out.drive}` : "", low(bodySk || ""), out.color ? `farba ${out.color.toLowerCase()}` : ""].filter(Boolean).join(", ");
  if (tech) desc.push(`Technika: ${tech}.`);
  if (out.odometer_mi) desc.push(`Nájazd ${num(Math.round(out.odometer_mi * 1.609344))} km.`);
  desc.push(flood ? "Inzerát uvádza poškodenie vodou." : bad.length ? `Predajca uvádza nefunkčné: ${bad.map((b) => b[2]).join(", ")}.` : "Inzerát neuvádza žiadne poškodenie ani záplavu.");
  desc.push("Stav auta overí náš agent v prístave po kúpe. Cena zahŕňa kúpu, vývoz, dopravu, clo, DPH, schválenie a prihlásenie na Slovensku.");
  if (!out.vin) missing.push("VIN (Autowini ho zobrazí po prihlásení alebo na požiadanie u predajcu)");
  missing.push("cenu na Slovensku");
  missing.push(`kontrolu nákladov: pridal som položku „${EXPORT_COST.label}“ ${KR_EXPORT_FEE_EUR} €`);

  const images = autowiniPhotos(p);
  if (!images.length) missing.push("fotky");
  (Object.keys(out) as (keyof Parsed)[]).forEach((k) => out[k] === undefined && delete out[k]);
  return {
    parsed: out,
    patch: {
      country: "KR", currency: "USD", state: pl.state, sale_type: "fixed", auction: "Dealer", auction_end_at: null,
      ...(price ? { price_usd: price } : {}), seller_fee_usd: 0,
      damage_zones: [...zones.values()], extra: { specs, ...(equipment.length ? { equipment } : {}) }, calc_override: override, description: desc.join(" ")
    },
    url: p.u, images, saleEnd: null, source: "autowini.com", missing
  };
}

/** Autowini: fotky auta sú v priečinku …/car/CI<číslo>/<uuid>_<veľkosť>.jpg. Berieme len priečinok s najviac fotkami, každú v najväčšej veľkosti. */
function autowiniPhotos(p: ImportPayload): string[] {
  const all = [...(p.g || []), ...(p.c || []), ...(p.i || [])].map((u) => u.split("#")[0].split("?")[0]);
  const re = /^(https:\/\/imagebox\.autowini\.com\/.+\/car\/(CI\d+)\/)([0-9a-f-]{20,})_(\d*)\.(jpe?g|webp|png)$/i;
  const hits = all.map((u) => u.match(re)).filter(Boolean) as RegExpMatchArray[];
  if (!hits.length) return [];
  const byDir = new Map<string, RegExpMatchArray[]>();
  for (const m of hits) byDir.set(m[2], [...(byDir.get(m[2]) || []), m]);
  const best = [...byDir.values()].sort((a, b) => new Set(b.map((m) => m[3])).size - new Set(a.map((m) => m[3])).size)[0];
  const pick = new Map<string, { url: string; size: number }>();
  for (const m of best) {
    // „_1024“ je najväčšia bežná veľkosť, „_“ bez čísla je originál, dlhé číslo je časová značka (ignorujeme)
    // berieme 1024 px, originál len ak 1024 chýba (originály bývajú veľmi veľké)
    const size = m[4] === "" ? 900 : Number(m[4]) > 4000 ? 0 : Number(m[4]);
    const cur = pick.get(m[3]);
    if (!cur || size > cur.size) pick.set(m[3], { url: m[0], size });
  }
  // ak je fotka v zozname len v malej veľkosti, adresu 1024 px poskladáme (všetky fotky ju majú)
  return [...pick.entries()].map(([id, x]) => (x.size >= 600 ? x.url : `${best[0][1]}${id}_1024.jpg`)).slice(0, 60);
}

/** Ak je inzerát z Encaru alebo Autowini, vráti import, inak null. */
export function fromKorea(p: ImportPayload): Imported | null {
  if (isEncar(p.u)) return fromEncar(p);
  if (isAutowini(p.u)) return fromAutowini(p);
  return null;
}
