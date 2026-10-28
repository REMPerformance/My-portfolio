import type { CalcConfig, CarType, Car, CalcOverride, PriceMode } from "./types";
import { DEFAULT_FX, countryDef, guessPlace, placeDef, placeKey, portDef, type Currency } from "./origins";

export const DEFAULT_CALC: CalcConfig = {
  usdToEur: 0.86,
  fx: DEFAULT_FX,
  ports: {},
  inland: {},
  fxAuto: true,
  fxMarginPct: 0,
  auctionFeeTiers: [[1000, 300], [2000, 450], [4000, 650], [6000, 800], [8000, 900], [10000, 1000], [15000, 1150], [20000, 1300]],
  auctionFeeOverPct: 0.07,
  fixedAuctionExtras: 250,
  inlandUsd: { east: 450, central: 650, west: 900 },
  oceanUsd: { east: 1150, central: 1350, west: 1900 },
  dutyRate: { car: 0.1, suv: 0.1, truck: 0.22, moto: 0.07 },
  vatRate: 0.23,
  euPortEur: 650,
  truckEur: 950,
  homologEur: 900,
  euRegEur: 250,
  serviceFeeEur: 990,
  serviceFeePct: 0.15,
  serviceFeeMinEur: 0,
  serviceFeeBase: "car",
  priceMode: "net",
  depositPct: 0.1,
  depositMinEur: 500,
  depositTiers: [[49000, 2000], [69000, 3000], [999999999, 4500]],
  markupPct: 5,
  insurancePct: 0.07,
  insuranceMinUsd: 350,
  cvdRate: 0.207,
  translationsEur: 150,
  inspectionsEur: 180,
  recyclingEur: 30,
  registrationEur: 100,
  // schválenie a technická adaptácia podľa krajiny (autá mimo európskej špecifikácie sú drahšie)
  homologByCountry: { US: 900, CA: 900, AE: 1500, KR: 1800, JP: 1800, CN: 3300 },
  adaptersEur: 900,
  racemCredit: [[999999999, 100]]
};

export interface CalcResult {
  /** cena auta v mene krajiny pôvodu */
  price: number;
  currency: Currency;
  /** spätná kompatibilita – cena auta (v mene krajiny) */
  bidUsd: number;
  carEur: number;
  feeEur: number;
  inlandEur: number;
  oceanEur: number;
  portName: string;
  placeName: string | null;
  countryName: string;
  cif: number;
  dutyRate: number;
  duty: number;
  vat: number;
  euPortEur: number;
  truckEur: number;
  homologEur: number;
  serviceFeeEur: number;
  repairEur: number;
  extraCosts: { label: string; eur: number }[];
  /** percento poplatku (ak sa počíta percentom) */
  feePct: number | null;
  /** dovozné DPH (z colnej hodnoty, cla a dopravy v EÚ) */
  importVat: number;
  /** slovenská DPH z ceny auta z EÚ (nové auto alebo cena bez DPH) */
  euCarVat: number;
  insuranceEur: number;
  cvdRate: number;
  cvd: number;
  countryCode: string;
  translationsEur: number;
  inspectionsEur: number;
  recyclingEur: number;
  registrationEur: number;
  adaptersEur: number;
  /** rezerva na nepredvídané náklady = záloha podľa pásma */
  reserveEur: number;
  /** cena bez DPH / s DPH / DPH spolu */
  net: number;
  gross: number;
  vatTotal: number;
  priceMode: PriceMode;
  /** hlavná cena (podľa priceMode) */
  total: number;
  credit: number;
  deposit: number;
  fixed: boolean;
  /** auto kúpené v EÚ: bez cla, colnice a námornej prepravy */
  local: boolean;
  /** DPH sa nepočíta z ceny auta */
  carNoVat: boolean;
  /** poplatky zadal admin ručne (nie automatický odhad) */
  feeManual: boolean;
  /** cena je bez homologizácie, zákazník si ju vybaví sám */
  noHomolog: boolean;
}

/** Záloha podľa konečnej sumy (pásma v nastaveniach). Bez pásiem platí starý výpočet percentom s minimom. */
export function depositFor(cfg: Pick<CalcConfig, "depositTiers" | "depositPct" | "depositMinEur">, total: number) {
  const t = (cfg.depositTiers?.length ? cfg.depositTiers : DEFAULT_CALC.depositTiers) || [];
  if (t.length) return (t.find(([max]) => Math.round(total) <= max) || t[t.length - 1])[1];
  return Math.max(cfg.depositMinEur, Math.round((total * cfg.depositPct) / 50) * 50);
}

/** „do 49 000 € záloha 2 000 €, do 69 000 € záloha 3 000 € a nad 69 000 € záloha 4 500 €“ */
export function depositTiersText(cfg: Pick<CalcConfig, "depositTiers">) {
  const t = (cfg.depositTiers?.length ? cfg.depositTiers : DEFAULT_CALC.depositTiers) || [];
  const f = (n: number) => `${Math.round(n).toLocaleString("sk-SK").replace(/\s/g, "\u00a0")}\u00a0€`;
  const parts = t.map(([max, v], i) => (i === t.length - 1 && t.length > 1 ? `nad ${f(t[i - 1][0])} záloha ${f(v)}` : `do ${f(max)} záloha ${f(v)}`));
  return parts.length > 1 ? `${parts.slice(0, -1).join(", ")} a ${parts[parts.length - 1]}` : parts[0] || "";
}

export function auctionFee(cfg: CalcConfig, bidUsd: number) {
  const tier = cfg.auctionFeeTiers.find(([max]) => bidUsd <= max);
  return (tier ? tier[1] : bidUsd * cfg.auctionFeeOverPct) + cfg.fixedAuctionExtras;
}

export const fxRate = (cfg: CalcConfig, cur?: string | null) => {
  const c = (cur || "USD") as Currency;
  if (c === "USD") return cfg.usdToEur || cfg.fx?.USD || DEFAULT_FX.USD;
  return cfg.fx?.[c] ?? DEFAULT_FX[c] ?? 1;
};

/** Náklady na dopravu z konkrétneho miesta (USD): odvoz do prístavu + more. */
export function originCosts(cfg: CalcConfig, country?: string | null, place?: string | null) {
  const cd = countryDef(country);
  const pl = placeDef(cd.code, place) || cd.places[0];
  const port = portDef(cd.code, pl.port);
  const inlandUsd = cfg.inland?.[placeKey(cd.code, pl.code)] ?? pl.inlandUsd;
  const oceanUsd = cfg.ports?.[port.id] ?? port.oceanUsd;
  return { inlandUsd, oceanUsd, port, place: pl, country: cd };
}

export interface CalcInput {
  price: number;
  currency?: string | null;
  country?: string | null;
  place?: string | null;
  type?: CarType;
  repairEur?: number;
  extraCosts?: { label: string; eur: number }[];
  /** pevné poplatky predajcu v mene krajiny (auto za pevnú cenu); undefined = aukčné poplatky */
  sellerFee?: number | null;
  inlandUsd?: number | null;
  oceanUsd?: number | null;
  /** bez opravy a homologizácie (pri EÚ bez prihlásenia): homologizujeme len autá opravené cez nás */
  noHomolog?: boolean;
  /** ručne zadaný kredit RACEM v EUR */
  creditEur?: number | null;
  /** pevná cena (nie aukcia); ak chýba, odvodí sa z toho, či sú zadané poplatky */
  isFixed?: boolean;
  /** cena auta je konečná, DPH sa k nej nepripočíta */
  carNoVat?: boolean;
  /** pohon: elektromobil z Číny má vyrovnávacie clo */
  fuel?: "ice" | "hybrid" | "bev" | null;
  /** 0 % clo s dokladom o pôvode (dohoda EÚ s Kóreou, Japonskom, USA) */
  dutyFree?: boolean;
  /** starý parameter – cena v USD */
  bidUsd?: number;
  rate?: number;
}

export function calc(cfg: CalcConfig, i: CalcInput): CalcResult {
  const currency = ((i.currency || countryDef(i.country).currency) as Currency);
  const price = i.price ?? i.bidUsd ?? 0;
  const usd = i.rate || fxRate(cfg, "USD");
  const r = currency === "USD" && i.rate ? i.rate : fxRate(cfg, currency);
  const carEur = price * r;
  const feeManual = i.sellerFee !== undefined && i.sellerFee !== null;
  const fixed = i.isFixed ?? feeManual;
  const oc = originCosts(cfg, i.country, i.place);
  const local = !!oc.country.local;
  // poplatky zadané ručne majú prednosť; automatický odhad platí len pre americké aukcie, v EÚ sa zadávajú vždy ručne
  const feeEur = feeManual ? (Number(i.sellerFee) || 0) * r : local ? 0 : auctionFee(cfg, carEur / usd) * usd;
  const inlandEur = (i.inlandUsd ?? oc.inlandUsd) * usd;
  const oceanEur = local ? 0 : (i.oceanUsd ?? oc.oceanUsd) * usd;
  // plné poistenie prepravy (AutoBidMaster): % z ceny auta, najmenej minimum; len USA a Kanada, inde je v cene prepravy
  const insured = !local && (oc.country.code === "US" || oc.country.code === "CA");
  const insuranceEur = insured ? Math.max((cfg.insuranceMinUsd ?? 350) * usd, carEur * (cfg.insurancePct ?? 0.07)) : 0;
  const cif = carEur + feeEur + inlandEur + oceanEur + insuranceEur;
  // v rámci EÚ sa neplatí clo, nie je colnica ani prístav a auto ide po ceste priamo na Slovensko
  const dutyRate = local || i.dutyFree ? 0 : cfg.dutyRate[i.type || "car"] ?? 0.1;
  const duty = cif * dutyRate;
  // vyrovnávacie clo EÚ na elektromobily z Číny (sadzba podľa výrobcu, predvolene 20,7 %)
  const cvdRate = !local && oc.country.code === "CN" && i.fuel === "bev" ? cfg.cvdRate ?? 0.207 : 0;
  const cvd = cif * cvdRate;
  const portBase = local ? 0 : cfg.euPortEur;
  const truckBase = local ? 0 : cfg.truckEur;
  const importVat = local ? 0 : (cif + duty + cvd + portBase + truckBase) * cfg.vatRate;
  // jazdené auto z EÚ sa kupuje za konečnú cenu; pri novom aute (do 6 mesiacov) alebo cene bez DPH sa platí slovenská DPH z ceny auta
  const carNoVat = i.carNoVat ?? local;
  const euCarVat = local && !carNoVat ? carEur * cfg.vatRate : 0;
  const extras = (i.extraCosts || []).filter((x) => x && x.label && Number(x.eur));
  const extraSum = extras.reduce((a, x) => a + Number(x.eur), 0);
  const repairEur = i.noHomolog ? 0 : i.repairEur || 0;
  const reg = !i.noHomolog;
  // auto z EÚ má európske typové schválenie, nehomologizuje sa, platí sa len prihlásenie
  const base = {
    port: portBase,
    truck: truckBase,
    translations: local || !reg ? 0 : cfg.translationsEur ?? 150,
    inspections: reg ? cfg.inspectionsEur ?? 180 : 0,
    homolog: !reg ? 0 : local ? cfg.euRegEur ?? 250 : cfg.homologByCountry?.[oc.country.code] ?? cfg.homologEur,
    // čínsky elektromobil má nabíjací port GB/T, k nemu adaptéry na CCS2 a Type 2
    adapters: reg && !local && oc.country.code === "CN" && i.fuel === "bev" ? cfg.adaptersEur ?? 900 : 0,
    recycling: reg ? cfg.recyclingEur ?? 30 : 0,
    registration: reg ? cfg.registrationEur ?? 100 : 0
  };
  const fixedSum = cif + duty + cvd + importVat + euCarVat + repairEur + extraSum + Object.values(base).reduce((a, x) => a + x, 0);
  // skrytá odmena = p % z konečnej sumy, rozpustí sa len do služieb (nie do auta, cla, DPH a rezervy)
  const mPct = Math.max(0, Math.min(50, cfg.markupPct ?? 5));
  const withMarkup = (sum: number) => (mPct > 0 ? Math.ceil((sum * mPct) / (100 - mPct)) : 0);
  // rezerva = záloha podľa pásma konečnej sumy; hľadáme pásmo, ktoré sedí aj s rezervou v súčte
  const tiers = (cfg.depositTiers?.length ? cfg.depositTiers : DEFAULT_CALC.depositTiers) || [];
  let reserveEur = 0, markupEur = withMarkup(fixedSum);
  for (const [, rz] of tiers) {
    reserveEur = rz;
    markupEur = withMarkup(fixedSum + rz);
    if (depositFor(cfg, fixedSum + rz + markupEur) === rz) break;
  }
  const spreadKeys = (Object.keys(base) as (keyof typeof base)[]).filter((k) => !["recycling", "registration", "adapters"].includes(k) && base[k] > 0);
  const spreadBase = spreadKeys.reduce((a, k) => a + base[k], 0);
  const svc = { ...base };
  let left = markupEur;
  spreadKeys.forEach((k, n) => { const add = n === spreadKeys.length - 1 ? left : Math.round((markupEur * base[k]) / spreadBase); svc[k] += add; left -= add; });
  // bez služieb na Slovensku (len dovoz) ide odmena do prepravy
  const inlandShown = spreadKeys.length ? inlandEur : inlandEur + markupEur;
  // konečná suma pre súkromnú osobu; firma s odpočtom DPH ju má nižšiu o DPH pri dovoze
  const gross = fixedSum + reserveEur + markupEur;
  const vatTotal = importVat + euCarVat;
  const net = gross - vatTotal;
  const priceMode: PriceMode = cfg.priceMode === "gross" ? "gross" : "net";
  const total = priceMode === "net" ? net : gross;
  const credit = typeof i.creditEur === "number" && isFinite(i.creditEur) ? Math.max(0, i.creditEur) : (cfg.racemCredit.find(([max]) => gross <= max) || cfg.racemCredit[cfg.racemCredit.length - 1])[1];
  return {
    price, currency, bidUsd: price, carEur, feeEur, inlandEur: inlandShown, oceanEur, insuranceEur,
    portName: oc.port.name, placeName: oc.place?.name ?? null, countryName: oc.country.name, countryCode: oc.country.code,
    cif, dutyRate, duty, cvdRate, cvd, vat: vatTotal, importVat, euCarVat,
    euPortEur: svc.port, truckEur: svc.truck, translationsEur: svc.translations, inspectionsEur: svc.inspections, homologEur: svc.homolog,
    recyclingEur: svc.recycling, registrationEur: svc.registration, adaptersEur: svc.adapters, reserveEur,
    serviceFeeEur: markupEur, feePct: mPct / 100,
    repairEur, extraCosts: extras, net, gross, vatTotal, priceMode, total, credit, deposit: reserveEur, fixed, local, carNoVat, feeManual, noHomolog: !!i.noHomolog
  };
}

/** Globálne nastavenia + výnimky pre konkrétne auto (prázdne polia = globálna hodnota). */
export function applyOverride(cfg: CalcConfig, o: CalcOverride | null | undefined, type: CarType): CalcConfig {
  if (!o) return cfg;
  const n = (v: unknown) => typeof v === "number" && isFinite(v);
  return {
    ...cfg,
    usdToEur: n(o.usdToEur) ? o.usdToEur! : cfg.usdToEur,
    serviceFeeEur: n(o.serviceFeeEur) ? o.serviceFeeEur! : cfg.serviceFeeEur,
    // pevná suma pri aute vypne percento; percento pri aute má prednosť
    serviceFeePct: n(o.serviceFeePct) ? o.serviceFeePct! : n(o.serviceFeeEur) ? null : cfg.serviceFeePct,
    priceMode: o.priceMode === "net" || o.priceMode === "gross" ? o.priceMode : cfg.priceMode,
    euPortEur: n(o.euPortEur) ? o.euPortEur! : cfg.euPortEur,
    truckEur: n(o.truckEur) ? o.truckEur! : cfg.truckEur,
    homologEur: n(o.homologEur) ? o.homologEur! : cfg.homologEur,
    // ručne zadaná homologizácia pri aute má prednosť pred sumou podľa krajiny
    homologByCountry: n(o.homologEur) ? {} : cfg.homologByCountry,
    euRegEur: n(o.homologEur) ? o.homologEur! : cfg.euRegEur,
    dutyRate: n(o.dutyRate) ? { ...cfg.dutyRate, [type]: o.dutyRate! } : cfg.dutyRate
  };
}

export const isFixed = (c: { sale_type?: string | null }) => c.sale_type === "fixed";

type EstCar = Pick<Car, "est_bid_usd" | "current_bid_usd" | "type" | "repair_eur"> &
  Partial<Pick<Car, "country" | "state" | "currency" | "sale_type" | "price_usd" | "seller_fee_usd" | "location" | "fuel">> & { calc_override?: CalcOverride | null };

/** Cena, z ktorej sa počíta (v mene auta). */
export const carPrice = (car: EstCar) => (isFixed(car) ? car.price_usd || 0 : car.est_bid_usd || car.current_bid_usd || 0);

/** „Elektro“, „Electric“ → bev, hybrid → hybrid, inak spaľovací. */
export const fuelKind = (f?: string | null): "ice" | "hybrid" | "bev" => (/hybrid|phev|erev|reev/i.test(f || "") ? "hybrid" : /elektr|electric|\bbev\b|\bev\b/i.test(f || "") ? "bev" : "ice");

export function carEstimate(cfg: CalcConfig, car: EstCar, opt: { noHomolog?: boolean } = {}) {
  const c = applyOverride(cfg, car.calc_override, car.type);
  const o = car.calc_override || {};
  const n = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : null);
  return calc(c, {
    price: carPrice(car),
    currency: car.currency || countryDef(car.country).currency,
    country: car.country || "US",
    place: car.state || guessPlace(car.country || "US", car.location || ""),
    type: car.type,
    repairEur: car.repair_eur || 0,
    extraCosts: o.extraCosts || [],
    sellerFee: isFixed(car) ? car.seller_fee_usd || 0 : car.seller_fee_usd ?? undefined,
    isFixed: isFixed(car),
    noHomolog: opt.noHomolog,
    fuel: fuelKind(car.fuel),
    creditEur: n(o.creditEur),
    inlandUsd: n(o.inlandUsd),
    oceanUsd: n(o.oceanUsd),
    carNoVat: typeof o.carNoVat === "boolean" ? o.carNoVat : undefined
  });
}

export function mergeCalc(v: unknown): CalcConfig {
  if (!v || typeof v !== "object") return DEFAULT_CALC;
  const o = v as Partial<CalcConfig>;
  return { ...DEFAULT_CALC, ...o, fx: { ...DEFAULT_FX, ...(o.fx || {}), USD: o.usdToEur ?? o.fx?.USD ?? DEFAULT_FX.USD }, ports: o.ports || {}, inland: o.inland || {}, homologByCountry: { ...DEFAULT_CALC.homologByCountry, ...(o.homologByCountry || {}) } };
}

/** Zoznam „V cene je zahrnuté“ zostavený z toho, čo je pri aute naozaj nastavené. */
export function includedItems(r: CalcResult): string[] {
  const pct = (x: number) => `${+(x * 100).toFixed(1)} %`.replace(".", ",");
  const out: string[] = [];
  out.push(r.fixed ? (r.feeEur > 0 ? "Kúpa auta u predajcu vrátane jeho poplatkov" : "Kúpa auta u predajcu") : r.feeEur > 0 ? "Kúpa auta na aukcii vrátane aukčných poplatkov" : "Kúpa auta na aukcii");
  if (r.local) {
    if (r.inlandEur > 0) out.push(`Preprava na Slovensko po ceste${r.placeName ? ` (${r.placeName})` : ""}`);
    out.push("Bez cla a bez colnice, auto je z EÚ");
  } else {
    if (r.inlandEur > 0 && r.oceanEur > 0) out.push(`Doprava do prístavu ${r.portName} a námorná preprava`);
    else if (r.oceanEur > 0) out.push("Námorná preprava do Európy");
    else if (r.inlandEur > 0) out.push("Doprava do prístavu");
    out.push(r.duty > 0 ? `Clo ${pct(r.dutyRate)} a preclenie` : "Preclenie, clo 0 %");
    if (r.euPortEur > 0) out.push("Prístav, vykládka a colný deklarant");
    if (r.truckEur > 0) out.push("Kamión na Slovensko");
  }
  if (r.insuranceEur > 0) out.push("Plné poistenie prepravy");
  if (r.cvd > 0) out.push(`Vyrovnávacie clo EÚ ${pct(r.cvdRate)}`);
  if (r.importVat > 0) out.push("DPH 23 % pri dovoze");
  else if (r.euCarVat > 0) out.push("DPH 23 % na Slovensku z ceny auta");
  else if (r.local && r.carNoVat) out.push("Cena auta je konečná, DPH sa k nej nepripočíta");
  if (r.noHomolog) out.push(r.local ? "Bez opravy a prihlásenia, vybavíte si ich sami" : "Bez opravy a homologizácie, vybavíte si ich sami");
  if (r.homologEur > 0) out.push(r.local ? "Prihlásenie na Slovensku: kontrola originality, doklady a EČV" : "Preklady, schválenie s úpravami, technické kontroly a EČV");
  if (r.adaptersEur > 0) out.push("Nabíjacie adaptéry");
  if (r.reserveEur > 0) out.push(`Rezerva na nepredvídané náklady ${new Intl.NumberFormat("sk-SK").format(r.reserveEur)} €, nevyčerpaná časť sa vracia`);
  if (r.repairEur > 0) out.push("Odhad opravy");
  for (const x of r.extraCosts) out.push(x.label);
  if (r.credit > 0) out.push(`Kredit ${new Intl.NumberFormat("sk-SK").format(Math.round(r.credit))} € na tuning v RACEM`);
  return out;
}
