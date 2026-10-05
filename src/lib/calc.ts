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
  const fixed = i.sellerFee !== undefined && i.sellerFee !== null;
  const feeEur = fixed ? (Number(i.sellerFee) || 0) * r : auctionFee(cfg, carEur / usd) * usd;
  const oc = originCosts(cfg, i.country, i.place);
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
  const repairEur = i.repairEur || 0;
  // všetky položky sú bez DPH; DPH 23 % = dovozné DPH (clo, doprava) + DPH z tuzemských služieb
  const costNet = cif + duty + euPortEur + truckEur + cfg.homologEur + repairEur + extraSum;
  const pct = typeof cfg.serviceFeePct === "number" && isFinite(cfg.serviceFeePct) ? cfg.serviceFeePct : null;
  const feeBase = cfg.serviceFeeBase === "total" ? costNet : carEur + feeEur;
  const serviceFeeEur = pct !== null ? Math.max(cfg.serviceFeeMinEur || 0, feeBase * pct) : cfg.serviceFeeEur;
  const net = costNet + serviceFeeEur;
  const carNoVat = !!i.carNoVat;
  const vatTotal = (net - (carNoVat ? carEur : 0)) * cfg.vatRate;
  const gross = net + vatTotal;
  const priceMode: PriceMode = cfg.priceMode === "net" ? "net" : "gross";
  const total = priceMode === "net" ? net : gross;
  const credit = (cfg.racemCredit.find(([max]) => gross <= max) || cfg.racemCredit[cfg.racemCredit.length - 1])[1];
  const deposit = Math.max(cfg.depositMinEur, Math.round((gross * cfg.depositPct) / 50) * 50);
  return {
    price, currency, bidUsd: price, carEur, feeEur, inlandEur, oceanEur,
    portName: oc.port.name, placeName: oc.place?.name ?? null, countryName: oc.country.name,
    cif, dutyRate, duty, vat: vatTotal, importVat: vat,
    euPortEur, truckEur, homologEur: cfg.homologEur, serviceFeeEur, feePct: pct,
    repairEur, extraCosts: extras, net, gross, vatTotal, priceMode, total, credit, deposit, fixed, local, carNoVat
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
    dutyRate: n(o.dutyRate) ? { ...cfg.dutyRate, [type]: o.dutyRate! } : cfg.dutyRate
  };
}

export const isFixed = (c: { sale_type?: string | null }) => c.sale_type === "fixed";

type EstCar = Pick<Car, "est_bid_usd" | "current_bid_usd" | "type" | "repair_eur"> &
  Partial<Pick<Car, "country" | "state" | "currency" | "sale_type" | "price_usd" | "seller_fee_usd" | "location">> & { calc_override?: CalcOverride | null };

/** Cena, z ktorej sa počíta (v mene auta). */
export const carPrice = (car: EstCar) => (isFixed(car) ? car.price_usd || 0 : car.est_bid_usd || car.current_bid_usd || 0);

export function carEstimate(cfg: CalcConfig, car: EstCar) {
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
    sellerFee: isFixed(car) ? car.seller_fee_usd || 0 : undefined,
    inlandUsd: n(o.inlandUsd),
    oceanUsd: n(o.oceanUsd),
    carNoVat: !!o.carNoVat
  });
}

export function mergeCalc(v: unknown): CalcConfig {
  if (!v || typeof v !== "object") return DEFAULT_CALC;
  const o = v as Partial<CalcConfig>;
  return { ...DEFAULT_CALC, ...o, fx: { ...DEFAULT_FX, ...(o.fx || {}), USD: o.usdToEur ?? o.fx?.USD ?? DEFAULT_FX.USD }, ports: o.ports || {}, inland: o.inland || {} };
}
