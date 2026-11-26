import "server-only";
import { getKrBucket, krRow, KR_BUCKETS, type KrRow } from "./krStockData";

/**
 * Celý sklad z Kórey v pamäti servera (kompaktné riadky). Vyhľadávanie a stránkovanie beží na serveri,
 * prehliadač dostane vždy len jednu stranu áut. Obnova každé 3 hodiny, kým sa obnovuje, slúži starý stav.
 */
const TTL = 3 * 3600 * 1000;
let state: { rows: KrRow[]; at: number } | null = null;
let loading: Promise<KrRow[]> | null = null;

async function load(): Promise<KrRow[]> {
  const res: KrRow[][] = new Array(KR_BUCKETS.length);
  let next = 0;
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (next < KR_BUCKETS.length) { const i = next++; res[i] = (await getKrBucket(i)).map(krRow); }
  }));
  const rows = res.flat();
  if (rows.length) state = { rows, at: Date.now() };
  return rows;
}

export async function getKrIndex(): Promise<KrRow[]> {
  if (state && Date.now() - state.at < TTL) return state.rows;
  if (!loading) loading = load().finally(() => { loading = null; });
  if (state) return state.rows; // starý stav, nový sa načítava na pozadí
  return loading;
}

export interface KrQuery { q?: string; make?: string; model?: string; fuel?: string; ymin?: number; kmax?: number; pmax?: number; sort?: string; page?: number }
export const KR_PAGE = 24;

const cnt = (xs: (string | null)[]) => [...xs.reduce((m, x) => (x ? m.set(x, (m.get(x) || 0) + 1) : m), new Map<string, number>())].sort((a, b) => a[0].localeCompare(b[0], "sk"));

export function krSearch(all: KrRow[], f: KrQuery) {
  const q = (f.q || "").trim().toLowerCase();
  const list = all.filter((r) =>
    (!f.make || r[1] === f.make) && (!f.model || r[2] === f.model) && (!f.fuel || r[6] === f.fuel) &&
    (!f.ymin || (r[4] || 0) >= f.ymin) && (!f.kmax || (r[5] ?? Infinity) <= f.kmax) && (!f.pmax || r[9] <= f.pmax) &&
    (!q || `${r[1]} ${r[2]} ${r[3] || ""} ${r[4] || ""}`.toLowerCase().includes(q)));
  const by: Record<string, (a: KrRow, b: KrRow) => number> = {
    new: (a, b) => (b[4] || 0) - (a[4] || 0) || a[9] - b[9],
    cheap: (a, b) => a[9] - b[9],
    exp: (a, b) => b[9] - a[9],
    km: (a, b) => (a[5] ?? 1e9) - (b[5] ?? 1e9)
  };
  list.sort(by[f.sort || "new"] || by.new);
  const page = Math.max(0, f.page || 0);
  return {
    total: list.length,
    all: all.length,
    rows: list.slice(page * KR_PAGE, (page + 1) * KR_PAGE),
    makes: cnt(all.map((r) => r[1])),
    models: cnt(all.filter((r) => !f.make || r[1] === f.make).map((r) => r[2])),
    fuels: cnt(all.map((r) => r[6]))
  };
}
