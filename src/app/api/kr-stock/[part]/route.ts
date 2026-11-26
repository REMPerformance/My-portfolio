import { NextResponse } from "next/server";
import { getKrBucket, krRow, KR_BUCKETS } from "@/lib/krStockData";

/**
 * Sklad z Kórey pre zoznam na /ihned-z-korey, jeden balík = jeden ročník (KR_BUCKETS).
 * Balík sa pripraví pri prvej návšteve a obnovuje sa každé 3 hodiny (rovnako ako stránka).
 */
export const revalidate = 10800;
export const maxDuration = 300;

// prázdny zoznam: balíky sa nevyrábajú pri builde, ale pri prvej požiadavke a potom sa držia v cache
export function generateStaticParams() {
  return [];
}

export async function GET(_req: Request, ctx: { params: Promise<{ part: string }> }) {
  const n = Number((await ctx.params).part);
  if (!Number.isInteger(n) || n < 0 || n >= KR_BUCKETS.length) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const cars = await getKrBucket(n);
  return NextResponse.json({ parts: KR_BUCKETS.length, rows: cars.map(krRow) });
}
