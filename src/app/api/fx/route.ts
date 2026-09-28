import { NextResponse } from "next/server";
import { fetchLiveFx } from "@/lib/fx";

export const revalidate = 21600;

/** Aktuálne kurzy ECB pre admin (EUR za 1 jednotku meny). */
export async function GET() {
  const live = await fetchLiveFx();
  return live ? NextResponse.json(live) : NextResponse.json({ error: "Kurzy sú momentálne nedostupné." }, { status: 502 });
}
