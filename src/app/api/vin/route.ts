import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { mapVin } from "@/lib/listingParse";

/** VIN dekóder (NHTSA vPIC, zadarmo) – len pre prihláseného admina. */
export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false }
  });
  const { data: isAdmin } = await sb.rpc("is_admin");
  if (!isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const vin = (new URL(req.url).searchParams.get("vin") || "").trim().toUpperCase();
  if (!/^[A-HJ-NPR-Z0-9]{11,17}$/.test(vin)) return NextResponse.json({ error: "Neplatný VIN (17 znakov, bez I, O, Q)." }, { status: 400 });
  try {
    const r = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${vin}?format=json`, { cache: "no-store" });
    const j = (await r.json()) as { Results?: Record<string, string>[] };
    const row = j.Results?.[0];
    if (!row) return NextResponse.json({ error: "VIN sa nepodarilo dekódovať." }, { status: 404 });
    const data = mapVin(row);
    if (!data.make) return NextResponse.json({ error: "K tomuto VIN databáza USA nemá údaje (typicky autá mimo USA)." }, { status: 404 });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Služba VIN je momentálne nedostupná." }, { status: 502 });
  }
}
