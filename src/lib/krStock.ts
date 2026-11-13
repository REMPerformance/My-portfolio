/**
 * Cenník pre sekciu „Ihneď k odberu z Kórey“ (sklad kórejských predajcov cez SSANCAR).
 * Nastavený podľa skutočného nacenenia Kia Carnival 2024 (Fojtík, 10/2026): auto 27 009 USD FOB,
 * loď do Bremerhavenu 2 300 USD (zdieľaný kontajner), clo 10 %, DPH 19 % pri preclení v Nemecku,
 * kontrola a vývozná dokumentácia 250 €. Doplnené pravidlá od 30. 10. a 6. 11. 2026: kurz ECB + 2 %,
 * 35 € za každú zahraničnú platbu a zárobok najmenej 3 000 € na auto (vyššie z 5 % a 3 000 €).
 * Všetko ostatné (prístav, kamión, schválenie, prihlásenie, kredit) berie kalkulácia z Nastavení.
 */
import { calc, fuelKind, type CalcResult } from "./calc";
import type { CalcConfig, CarType } from "./types";

export const KR_STOCK = {
  /** námorná preprava Inčchon/Pusan do Bremerhavenu, zdieľaný 40FT kontajner, bez poistenia (USD) */
  oceanUsd: 2300,
  /** prístav v EÚ, kde sa auto preclí */
  euPort: "de-brv",
  /** prirážka ku kurzu ECB pri konverzii (%), pri cene v KRW dvojitá konverzia */
  fxBankPct: 2,
  /** poplatok za jednu zahraničnú platbu (SWIFT, OUR) */
  paymentFeeEur: 35,
  /** kontrola vozidla na mieste a vývozná dokumentácia */
  exportFeeEur: 250,
  /** najnižší zárobok na auto, rozpustený v službách */
  minProfitEur: 3000,
  /** konečná suma sa zaokrúhli nahor na celé stovky */
  roundTo: 100
};

export interface KrPriceInput { usd?: number | null; krw?: number | null; fuel?: string | null; type?: CarType }

/** Orientačná cena auta zo skladu v Kórei na slovenských značkách. null = predajca cenu neuvádza. */
export function krStockEstimate(cfg: CalcConfig, i: KrPriceInput): (CalcResult & { rounded: number }) | null {
  const usd = Number(i.usd) || 0, krw = Number(i.krw) || 0;
  if (usd < 300 && krw < 300000) return null;
  const inKrw = usd < 300;
  const up = 1 + KR_STOCK.fxBankPct / 100;
  const usdEur = (cfg.usdToEur || cfg.fx.USD) * up;
  // pri cene v KRW: vývozca mení KRW na USD a my EUR na USD, preto prirážka dvakrát
  const c: CalcConfig = { ...cfg, usdToEur: usdEur, fx: { ...cfg.fx, USD: usdEur, KRW: (cfg.fx.KRW || 0.00063) * up * up } };
  const extraCosts = [
    { label: "Kontrola vozidla a vývozná dokumentácia v Kórei", eur: KR_STOCK.exportFeeEur },
    { label: "Zahraničné platby a konverzia mien", eur: KR_STOCK.paymentFeeEur * (inKrw ? 2 : 1) }
  ];
  const input = {
    price: inKrw ? krw : usd, currency: inKrw ? "KRW" : "USD", country: "KR", place: "PUS", type: i.type || "car",
    sellerFee: 0, isFixed: true, inlandUsd: 0, oceanUsd: KR_STOCK.oceanUsd, euPort: KR_STOCK.euPort, extraCosts,
    fuel: fuelKind(i.fuel), reserve: false
  } as const;
  let r = calc(c, input);
  if (r.markupEur < KR_STOCK.minProfitEur) {
    // odmena = súčet × p / (100 − p)  →  p, pri ktorom je odmena presne minimum
    const sum = r.gross - r.markupEur;
    r = calc({ ...c, markupPct: (100 * KR_STOCK.minProfitEur) / (sum + KR_STOCK.minProfitEur) + 1e-9 }, input);
  }
  return { ...r, rounded: Math.ceil(r.gross / KR_STOCK.roundTo) * KR_STOCK.roundTo };
}
