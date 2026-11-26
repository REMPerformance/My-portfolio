import { NextResponse, type NextRequest } from "next/server";
import { getKrIndex, krSearch } from "@/lib/krIndex";

/** Vyhľadávanie v sklade z Kórey: jedna strana áut a hodnoty do filtrov. Rovnaké dotazy drží CDN 10 minút. */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const num = (k: string) => { const v = Number(p.get(k)); return Number.isFinite(v) && v > 0 ? v : undefined; };
  const all = await getKrIndex();
  const headers = { "Cache-Control": all.length ? "public, s-maxage=600, stale-while-revalidate=3600" : "no-store" };
  if (p.get("count")) return NextResponse.json({ all: all.length }, { headers });
  const r = krSearch(all, {
    q: p.get("q")?.slice(0, 80) || undefined, make: p.get("make") || undefined, model: p.get("model") || undefined, fuel: p.get("fuel") || undefined,
    ymin: num("ymin"), kmax: num("kmax"), pmax: num("pmax"), sort: p.get("sort") || undefined, page: num("page")
  });
  return NextResponse.json(r, { headers });
}
