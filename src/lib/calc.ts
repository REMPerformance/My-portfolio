import type { CalcConfig, CarType, Region, Car } from "./types";

export const DEFAULT_CALC: CalcConfig = {
  usdToEur: 0.86,
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
  depositPct: 0.1,
  depositMinEur: 500,
  racemCredit: [[15000, 200], [30000, 400], [999999999, 700]]
};

export interface CalcResult {
  bidUsd: number;
  carEur: number;
  feeEur: number;
  inlandEur: number;
  oceanEur: number;
  cif: number;
  dutyRate: number;
  duty: number;
  vat: number;
  euPortEur: number;
  truckEur: number;
  homologEur: number;
  serviceFeeEur: number;
  repairEur: number;
  total: number;
  credit: number;
  deposit: number;
}

export function auctionFee(cfg: CalcConfig, bid: number) {
  const tier = cfg.auctionFeeTiers.find(([max]) => bid <= max);
  return (tier ? tier[1] : bid * cfg.auctionFeeOverPct) + cfg.fixedAuctionExtras;
}

export function calc(
  cfg: CalcConfig,
  { bidUsd, type = "car", region = "central", repairEur = 0, rate }: { bidUsd: number; type?: CarType; region?: Region; repairEur?: number; rate?: number }
): CalcResult {
  const r = rate || cfg.usdToEur;
  const carEur = bidUsd * r;
  const feeEur = auctionFee(cfg, bidUsd) * r;
  const inlandEur = (cfg.inlandUsd[region] ?? cfg.inlandUsd.central) * r;
  const oceanEur = (cfg.oceanUsd[region] ?? cfg.oceanUsd.central) * r;
  const cif = carEur + feeEur + inlandEur + oceanEur;
  const dutyRate = cfg.dutyRate[type] ?? 0.1;
  const duty = cif * dutyRate;
  const vat = (cif + duty + cfg.euPortEur + cfg.truckEur) * cfg.vatRate;
  const total = cif + duty + cfg.euPortEur + cfg.truckEur + vat + cfg.homologEur + cfg.serviceFeeEur + repairEur;
  const credit = (cfg.racemCredit.find(([max]) => total <= max) || cfg.racemCredit[cfg.racemCredit.length - 1])[1];
  const deposit = Math.max(cfg.depositMinEur, Math.round((total * cfg.depositPct) / 50) * 50);
  return {
    bidUsd, carEur, feeEur, inlandEur, oceanEur, cif, dutyRate, duty, vat,
    euPortEur: cfg.euPortEur, truckEur: cfg.truckEur, homologEur: cfg.homologEur, serviceFeeEur: cfg.serviceFeeEur,
    repairEur, total, credit, deposit
  };
}

export function carEstimate(cfg: CalcConfig, car: Pick<Car, "est_bid_usd" | "current_bid_usd" | "type" | "region" | "repair_eur">) {
  return calc(cfg, {
    bidUsd: car.est_bid_usd || car.current_bid_usd || 0,
    type: car.type,
    region: car.region,
    repairEur: car.repair_eur || 0
  });
}

export function mergeCalc(v: unknown): CalcConfig {
  if (!v || typeof v !== "object") return DEFAULT_CALC;
  return { ...DEFAULT_CALC, ...(v as Partial<CalcConfig>) };
}
