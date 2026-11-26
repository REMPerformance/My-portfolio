import { NextResponse } from "next/server";
import { getKrStock, krRow, KR_PART } from "@/lib/krStockData";

/**
 * Celý sklad z Kórey pre zoznam na /ihned-z-korey, po balíkoch po KR_PART áut.
 * Balíky 0 až 14 (do 45 000 áut) sa pripravujú vopred a obnovujú každé 3 hodiny (rovnako ako stránka), dáta zo SSANCAR idú z dátovej cache.
 */
export const revalidate = 10800;
export const maxDuration = 300;

export function generateStaticParams() {
  return Array.from({ length: 15 }, (_, i) => ({ part: String(i) }));
}

export async function GET(_req: Request, ctx: { params: Promise<{ part: string }> }) {
  const n = Number((await ctx.params).part);
  if (!Number.isInteger(n) || n < 0 || n > 14) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const cars = await getKrStock();
  return NextResponse.json({ total: cars.length, rows: cars.slice(n * KR_PART, (n + 1) * KR_PART).map(krRow) });
}
