import { NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase";
import { CONTRACT_RE, VIN_RE, normContract, normVin } from "@/lib/tracking";

/** Verejné vyhľadanie zásielky. Údaje vráti len pri zhode VIN aj čísla zmluvy. */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as { vin?: unknown; contract?: unknown } | null;
  const vin = normVin(String(b?.vin ?? "")), contract = normContract(String(b?.contract ?? ""));
  if (!VIN_RE.test(vin) || !CONTRACT_RE.test(contract)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { data, error } = await serverClient().rpc("track_shipment", { p_vin: vin, p_contract: contract });
  if (error) return NextResponse.json({ error: "server" }, { status: 500 });
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ shipment: data }, { headers: { "cache-control": "no-store" } });
}
