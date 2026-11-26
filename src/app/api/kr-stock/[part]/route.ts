import { NextResponse } from "next/server";
import { getKrStock, krRow, KR_PART } from "@/lib/krStockData";

/**
 * Celý sklad z Kórey pre zoznam na /ihned-z-korey, po balíkoch po KR_PART áut.
 * Balík sa pripraví pri prvej návšteve a obnovuje sa každé 3 hodiny (rovnako ako stránka), dáta zo SSANCAR idú z dátovej cache.
 */
export const revalidate = 10800;
export const maxDuration = 300;

// prázdny zoznam: balíky sa nevyrábajú pri builde, ale pri prvej požiadavke a potom sa držia v cache
export function generateStaticParams() {
  return [];
}

export async function GET(_req: Request, ctx: { params: Promise<{ part: string }> }) {
  const n = Number((await ctx.params).part);
  if (!Number.isInteger(n) || n < 0 || n > 14) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const cars = await getKrStock();
  return NextResponse.json({ total: cars.length, parts: Math.ceil(cars.length / KR_PART), rows: cars.slice(n * KR_PART, (n + 1) * KR_PART).map(krRow) });
}
