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
  euPortEur: 550,
  truckEur: 650,
  homologEur: 900,
  euRegEur: 250,
  serviceFeeEur: 990,
  serviceFeePct: 0.15,
  serviceFeeMinEur: 0,
  serviceFeeBase: "car",
  priceMode: "gross",
  depositPct: 0.1,
  depositMinEur: 500,
  racemCredit: [[15000, 200], [30000, 400], [999999999, 700]]
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
  // poplatky zadané ručne majú prednosť; automatický odhad platí len pre americké aukcie, v EÚ sa zadávajú vždy ručne
  const feeEur = feeManual ? (Number(i.sellerFee) || 0) * r : oc.country.local ? 0 : auctionFee(cfg, carEur / usd) * usd;
  const inlandEur = (i.inlandUsd ?? oc.inlandUsd) * usd;
  const local = !!oc.country.local;
  const oceanEur = local ? 0 : (i.oceanUsd ?? oc.oceanUsd) * usd;
  const cif = carEur + feeEur + inlandEur + oceanEur;
  // v rámci EÚ sa neplatí clo, nie je colnica ani prístav a auto ide po ceste priamo na Slovensko
  const dutyRate = local ? 0 : cfg.dutyRate[i.type || "car"] ?? 0.1;
  const duty = cif * dutyRate;
  const euPortEur = local ? 0 : cfg.euPortEur;
  const truckEur = local ? 0 : cfg.truckEur;
  const vat = local ? 0 : (cif + duty + euPortEur + truckEur) * cfg.vatRate;
  const extras = (i.extraCosts || []).filter((x) => x && x.label && Number(x.eur));
  const extraSum = extras.reduce((a, x) => a + Number(x.eur), 0);
  const repairEur = i.noHomolog ? 0 : i.repairEur || 0;
  // všetky položky sú bez DPH; DPH 23 % = dovozné DPH (clo, doprava) + DPH z tuzemských služieb
  // auto z EÚ má európske typové schválenie, takže sa nehomologizuje, platí sa len prihlásenie
  const homologEur = i.noHomolog ? 0 : local ? cfg.euRegEur ?? 250 : cfg.homologEur;
  const costNet = cif + duty + euPortEur + truckEur + homologEur + repairEur + extraSum;
  const pct = typeof cfg.serviceFeePct === "number" && isFinite(cfg.serviceFeePct) ? cfg.serviceFeePct : null;
  const feeBase = cfg.serviceFeeBase === "total" ? costNet : carEur + feeEur;
  const serviceFeeEur = pct !== null ? Math.max(cfg.serviceFeeMinEur || 0, feeBase * pct) : cfg.serviceFeeEur;
  const net = costNet + serviceFeeEur;
  // jazdené auto z EÚ sa kupuje za konečnú cenu, slovenská DPH sa k nej nepripočíta (ak admin neurčí inak)
  const carNoVat = i.carNoVat ?? local;
  const vatTotal = (net - (carNoVat ? carEur : 0)) * cfg.vatRate;
  const gross = net + vatTotal;
  const priceMode: PriceMode = cfg.priceMode === "net" ? "net" : "gross";
  const total = priceMode === "net" ? net : gross;
  const credit = typeof i.creditEur === "number" && isFinite(i.creditEur) ? Math.max(0, i.creditEur) : (cfg.racemCredit.find(([max]) => gross <= max) || cfg.racemCredit[cfg.racemCredit.length - 1])[1];
  const deposit = Math.max(cfg.depositMinEur, Math.round((gross * cfg.depositPct) / 50) * 50);
  return {
    price, currency, bidUsd: price, carEur, feeEur, inlandEur, oceanEur,
    portName: oc.port.name, placeName: oc.place?.name ?? null, countryName: oc.country.name,
    cif, dutyRate, duty, vat: vatTotal, importVat: vat,
    euPortEur, truckEur, homologEur, serviceFeeEur, feePct: pct,
    repairEur, extraCosts: extras, net, gross, vatTotal, priceMode, total, credit, deposit, fixed, local, carNoVat, feeManual, noHomolog: !!i.noHomolog
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
    euRegEur: n(o.homologEur) ? o.homologEur! : cfg.euRegEur,
    dutyRate: n(o.dutyRate) ? { ...cfg.dutyRate, [type]: o.dutyRate! } : cfg.dutyRate
  };
}

export const isFixed = (c: { sale_type?: string | null }) => c.sale_type === "fixed";

type EstCar = Pick<Car, "est_bid_usd" | "current_bid_usd" | "type" | "repair_eur"> &
  Partial<Pick<Car, "country" | "state" | "currency" | "sale_type" | "price_usd" | "seller_fee_usd" | "location">> & { calc_override?: CalcOverride | null };

/** Cena, z ktorej sa počíta (v mene auta). */
export const carPrice = (car: EstCar) => (isFixed(car) ? car.price_usd || 0 : car.est_bid_usd || car.current_bid_usd || 0);

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
    creditEur: n(o.creditEur),
    inlandUsd: n(o.inlandUsd),
    oceanUsd: n(o.oceanUsd),
    carNoVat: typeof o.carNoVat === "boolean" ? o.carNoVat : undefined
  });
}

export function mergeCalc(v: unknown): CalcConfig {
  if (!v || typeof v !== "object") return DEFAULT_CALC;
  const o = v as Partial<CalcConfig>;
  return { ...DEFAULT_CALC, ...o, fx: { ...DEFAULT_FX, ...(o.fx || {}), USD: o.usdToEur ?? o.fx?.USD ?? DEFAULT_FX.USD }, ports: o.ports || {}, inland: o.inland || {} };
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
  if (r.priceMode !== "net") out.push(r.carNoVat ? "DPH 23 % z prepravy a služieb, cena auta je konečná" : "DPH 23 %");
  if (r.noHomolog) out.push(r.local ? "Bez opravy a prihlásenia, vybavíte si ich sami" : "Bez opravy a homologizácie, vybavíte si ich sami");
  if (r.homologEur > 0) out.push(r.local ? "Prihlásenie na Slovensku: kontrola originality, doklady a EČV" : "Homologizácia, STK, EK a EČV");
  if (r.repairEur > 0) out.push("Odhad opravy");
  for (const x of r.extraCosts) out.push(x.label);
  if (r.credit > 0) out.push(`Kredit ${new Intl.NumberFormat("sk-SK").format(Math.round(r.credit))} € na tuning v RACEM`);
  return out;
}
