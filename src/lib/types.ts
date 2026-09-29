export type CarType = "car" | "suv" | "truck" | "moto";
export type Region = "east" | "central" | "west";
export type Severity = "light" | "medium" | "heavy";
export type DamageZone = { zone: string; severity: Severity; note?: string };

export interface CarExtra {
  specs?: { label: string; value: string }[];
  equipment?: string[];
  history?: string;
}

export type PriceMode = "gross" | "net";
export interface CalcOverride {
  usdToEur?: number;
  serviceFeeEur?: number;
  /** poplatok v % (napr. 0.15) – má prednosť pred pevnou sumou */
  serviceFeePct?: number;
  /** hlavná cena na webe: s DPH alebo bez DPH */
  priceMode?: PriceMode;
  dutyRate?: number;
  inlandUsd?: number;
  oceanUsd?: number;
  euPortEur?: number;
  truckEur?: number;
  homologEur?: number;
  extraCosts?: { label: string; eur: number }[];
}
export type CarStatus = "draft" | "published" | "sold" | "archived";
export type SaleType = "auction" | "fixed";
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
  /** zastarané – nahradené country/state */
  region: Region;
  /** krajina pôvodu (US, AE, CA, KR, JP, CN) */
  country: string;
  /** štát / emirát / provincia (kód z origins.ts) */
  state: string | null;
  /** mena, v ktorej sú ceny auta (current_bid_usd, est_bid_usd, price_usd, seller_fee_usd) */
  currency: string;
  auction: string | null;
  lot: string | null;
  auction_url: string | null;
  images: string[];
  /** auction = dražba na Copart/IAAI; fixed = auto za pevnú cenu (dealer, Buy Now…) */
  sale_type: SaleType;
  /** pevná cena auta u predajcu (len pri fixed) */
  price_usd: number | null;
  /** poplatky predajcu – doc fee, Buy Now fee… (len pri fixed) */
  seller_fee_usd: number | null;
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
  /** kedy bolo auto prvýkrát zverejnené (nastaví databáza) */
  published_at: string | null;
  views: number;
  leads_count: number;
  created_at: string;
  updated_at: string;
}

export interface CalcConfig {
  usdToEur: number;
  /** kurzy: koľko EUR za 1 jednotku meny */
  fx: Record<string, number>;
  /** prepísaná námorná doprava podľa prístavu (USD) */
  ports: Record<string, number>;
  /** prepísaný odvoz do prístavu podľa miesta „US-TX“ (USD) */
  inland: Record<string, number>;
  /** automatický kurz podľa ECB (predvolene zapnutý) */
  fxAuto?: boolean;
  /** rezerva na kurz v % (banka, výkyvy) – znižuje prepočítaný kurz */
  fxMarginPct?: number;
  /** dátum kurzu ECB, ak sa použil automatický */
  fxDate?: string;
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
  /** poplatok v % (0.15 = 15 %); null/undefined = použije sa pevná suma serviceFeeEur */
  serviceFeePct?: number | null;
  /** minimálny poplatok v EUR pri percentuálnom poplatku */
  serviceFeeMinEur?: number;
  /** z čoho sa počíta % poplatok: cena auta (s aukčnými poplatkami) alebo všetky náklady */
  serviceFeeBase?: "car" | "total";
  /** predvolená hlavná cena na webe */
  priceMode?: PriceMode;
  depositPct: number;
  depositMinEur: number;
  racemCredit: [number, number][];
}

export interface Lead {
  id: string;
  car_id: string | null;
  car_label: string | null;
  name: string | null;
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
