export type CarType = "car" | "suv" | "truck" | "moto";
export type Region = "east" | "central" | "west";
export type Severity = "light" | "medium" | "heavy";
export type DamageZone = { zone: string; severity: Severity; note?: string };

export interface CarExtra {
  specs?: { label: string; value: string }[];
  equipment?: string[];
  history?: string;
}

export interface CalcOverride {
  usdToEur?: number;
  serviceFeeEur?: number;
  dutyRate?: number;
  inlandUsd?: number;
  oceanUsd?: number;
  euPortEur?: number;
  truckEur?: number;
  homologEur?: number;
  extraCosts?: { label: string; eur: number }[];
}
export type CarStatus = "draft" | "published" | "sold" | "archived";
export type RunStatus = "run_drive" | "starts" | "no_start" | "unknown";

export interface Car {
  id: string;
  slug: string;
  status: CarStatus;
  is_demo: boolean;
  featured: boolean;
  type: CarType;
  year: number | null;
  make: string;
  model: string;
  trim: string | null;
  vin: string | null;
  odometer_mi: number | null;
  engine: string | null;
  transmission: string | null;
  drive: string | null;
  fuel: string | null;
  color: string | null;
  keys: boolean | null;
  run_status: RunStatus | null;
  title_type: string | null;
  primary_damage: string | null;
  secondary_damage: string | null;
  damage_zones: DamageZone[];
  location: string | null;
  region: Region;
  auction: string | null;
  lot: string | null;
  auction_url: string | null;
  images: string[];
  current_bid_usd: number | null;
  est_bid_usd: number | null;
  repair_eur: number | null;
  sk_price_eur: number | null;
  sk_price_source: string | null;
  order_close_at: string | null;
  auction_end_at: string | null;
  description: string | null;
  note: string | null;
  seo_title: string | null;
  seo_description: string | null;
  extra: CarExtra;
  calc_override: CalcOverride;
  views: number;
  leads_count: number;
  created_at: string;
  updated_at: string;
}

export interface CalcConfig {
  usdToEur: number;
  auctionFeeTiers: [number, number][];
  auctionFeeOverPct: number;
  fixedAuctionExtras: number;
  inlandUsd: Record<Region, number>;
  oceanUsd: Record<Region, number>;
  dutyRate: Record<CarType, number>;
  vatRate: number;
  euPortEur: number;
  truckEur: number;
  homologEur: number;
  serviceFeeEur: number;
  depositPct: number;
  depositMinEur: number;
  racemCredit: [number, number][];
}

export interface Lead {
  id: string;
  car_id: string | null;
  car_label: string | null;
  name: string;
  email: string;
  phone: string;
  max_budget_eur: number | null;
  link: string | null;
  message: string | null;
  status: "new" | "contacted" | "contract" | "deposit" | "won" | "lost";
  admin_note: string | null;
  page_url: string | null;
  created_at: string;
}
