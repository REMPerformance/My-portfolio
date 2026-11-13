/**
 * SSANCAR Partner Data API (api-eu.ssancar.com): kórejský sklad predajcov a denné kórejské aukcie.
 * Typy sú spoločné pre server aj administráciu. Samotné volanie API (s kľúčom) je len v /api/ssancar,
 * kľúč SSANCAR_API_KEY sa nikdy nedostane do prehliadača.
 */

export interface SsPrice { krw?: number | null; usd?: number | null; fx?: { usd_krw?: number; as_of?: string } | null }
export type SsPhoto = string | { url?: string; large?: string; original?: string; thumb?: string };

export interface SsStock {
  id: string; type?: string; status?: string; plate_number?: string | null; vin?: string | null; detail_url?: string | null;
  make?: string | null; model?: string | null; trim?: string | null; year?: number | null; first_registration?: string | null;
  mileage_km?: number | null; fuel?: string | null; transmission?: string | null; color?: string | null; engine_cc?: number | null;
  body_type?: string | null; drive?: string | null; seats?: number | null; options?: string[] | string | null; location?: string | null;
  price: SsPrice; price_on_request?: boolean | null; photos?: SsPhoto[] | null; photo_count?: number | null;
  source_updated_at?: string | null; updated_at: string;
}

export interface SsLot {
  id: string; type?: string; house: string; auction_date?: string | null; auction_date_estimated?: boolean | null; lot_no?: string | null;
  status?: string | null; make?: string | null; model?: string | null; trim?: string | null; year?: number | null; first_registration?: string | null;
  mileage_km?: number | null; fuel?: string | null; transmission?: string | null; color?: string | null; grade?: string | null;
  start_price: SsPrice; photos?: SsPhoto[] | null; photo_count?: number | null; source_updated_at?: string | null; updated_at: string;
}

export interface SsSchedule { id?: string; house: string; auction_date?: string; title?: string; lot_count?: number; status?: string }
export interface SsPage<T> { items?: T[]; data?: T[]; next_cursor?: string | null; has_more?: boolean }
export interface SsMe {
  partner?: { code?: string; name?: string; country?: string; status?: string };
  scope?: { dealer_stock?: boolean; houses?: string[]; currencies?: string[] };
  limits?: { rate_limit_per_min?: number; daily_quota?: number };
  usage?: { today?: number; remaining_today?: number };
  key?: { key_id?: string; expires_at?: string | null };
}

export const SS_BASE = process.env.SSANCAR_API_BASE || "https://api-eu.ssancar.com";

/** Položky stránky (API ich vracia v `items`, pre istotu berieme aj `data`). */
export const ssItems = <T,>(p: SsPage<T> | null | undefined): T[] => (p?.items || p?.data || []) as T[];

/** Adresa fotky v najväčšej dostupnej veľkosti. */
export function ssPhoto(p: SsPhoto): string {
  if (typeof p === "string") return p;
  return p.original || p.large || p.url || p.thumb || "";
}

/** Interná adresa auta zo SSANCAR uložená v cars.auction_url (na webe sa nezobrazuje). */
export const ssRef = (kind: "stock" | "lot", id: string) => `ssancar://${kind}/${encodeURIComponent(id)}`;
export function parseSsRef(u: string | null | undefined): { kind: "stock" | "lot"; id: string } | null {
  const m = (u || "").split("#")[0].match(/^ssancar:\/\/(stock|lot)\/(.+)$/);
  return m ? { kind: m[1] as "stock" | "lot", id: decodeURIComponent(m[2]) } : null;
}

/** Názvy aukčných domov. Len pre administráciu, zákazníkom sa nezobrazujú. */
export const SS_HOUSE: Record<string, string> = { glovis: "Hyundai Glovis", lotte: "Lotte", kcar: "K Car", sellcar: "Sellcar", skrent: "SK Rent" };

/** Je auto ešte na predaj? */
export const ssAvailable = (status?: string | null) => !status || /^(active|available|on_?sale|listed|scheduled|open|upcoming)$/i.test(status);
