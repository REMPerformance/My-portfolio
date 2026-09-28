/** Živé kurzy ECB (frankfurter.dev, zadarmo, aktualizované každý pracovný deň). Vracia „koľko EUR za 1 jednotku meny“. */
export interface LiveFx { rates: Record<string, number>; date: string }

const AED_PER_USD = 3.6725; // dirham je pevne naviazaný na dolár

export async function fetchLiveFx(): Promise<LiveFx | null> {
  try {
    const r = await fetch("https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD,CAD,JPY,KRW,CNY", { next: { revalidate: 6 * 3600 }, signal: AbortSignal.timeout(4000) });
    if (!r.ok) return null;
    const j = (await r.json()) as { date: string; rates: Record<string, number> };
    const rates: Record<string, number> = { EUR: 1 };
    for (const [k, v] of Object.entries(j.rates || {})) if (v > 0) rates[k] = 1 / v;
    if (!rates.USD) return null;
    rates.AED = rates.USD / AED_PER_USD;
    return { rates, date: j.date };
  } catch {
    return null;
  }
}

/** Použije živé kurzy (s voliteľnou rezervou v %) namiesto ručne zadaných. */
export function withLiveFx<T extends { fx: Record<string, number>; usdToEur: number; fxAuto?: boolean; fxMarginPct?: number }>(cfg: T, live: LiveFx | null): T & { fxDate?: string } {
  if (!live || cfg.fxAuto === false) return cfg;
  const m = 1 - (cfg.fxMarginPct || 0) / 100;
  const fx: Record<string, number> = { ...cfg.fx };
  for (const [k, v] of Object.entries(live.rates)) fx[k] = k === "EUR" ? 1 : v * m;
  return { ...cfg, fx, usdToEur: fx.USD, fxDate: live.date };
}
