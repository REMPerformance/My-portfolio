import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SS_BASE } from "@/lib/ssancar";

export const dynamic = "force-dynamic";

/**
 * Proxy na SSANCAR Partner API len pre prihláseného admina. Kľúč je v premennej SSANCAR_API_KEY na serveri.
 * GET ?op=me | stock | stock-one | schedule | lots | lot | check  (ďalšie parametre sa posielajú ďalej)
 * POST { vehicle_type, vehicle_id, message, ... } = dopyt / žiadosť o príhoz cez POST /v1/leads
 */

async function admin(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return false;
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false }
  });
  const { data } = await sb.rpc("is_admin");
  return !!data;
}

const ID = /^[A-Za-z0-9_.:-]{1,80}$/;
const PASS: Record<string, string[]> = {
  stock: ["make", "model", "year_min", "year_max", "price_max_krw", "updated_since", "limit", "cursor"],
  schedule: ["from", "to", "limit", "cursor"],
  lots: ["date", "house", "limit", "cursor"]
};

async function ss(path: string, init?: RequestInit) {
  const key = process.env.SSANCAR_API_KEY;
  if (!key) return NextResponse.json({ error: "Chýba kľúč SSANCAR_API_KEY. Doplňte ho vo Verceli (Settings, Environment Variables) a nasaďte web znova." }, { status: 503 });
  try {
    const r = await fetch(SS_BASE + path, {
      ...init, cache: "no-store", signal: AbortSignal.timeout(15000),
      headers: { accept: "application/json", authorization: `Bearer ${key}`, ...(init?.body ? { "content-type": "application/json" } : {}) }
    });
    const j = await r.json().catch(() => null) as { error?: { code?: string; message?: string } } | null;
    if (!r.ok) {
      const msg = j?.error?.message || j?.error?.code || `SSANCAR vrátil ${r.status}.`;
      const hint = r.status === 401 ? " Kľúč je neplatný." : r.status === 403 ? " Kľúč nemá prístup k týmto údajom (alebo je zrušený)." : r.status === 429 ? ` Prekročený limit, skúste o ${r.headers.get("retry-after") || "chvíľu"} s.` : "";
      return NextResponse.json({ error: msg + hint, code: j?.error?.code, status: r.status }, { status: r.status === 404 ? 404 : 502 });
    }
    return NextResponse.json(j, { headers: { "cache-control": "no-store", "x-ratelimit-remaining": r.headers.get("x-ratelimit-remaining") || "" } });
  } catch {
    return NextResponse.json({ error: "SSANCAR sa nepodarilo kontaktovať." }, { status: 502 });
  }
}

export async function GET(req: Request) {
  if (!(await admin(req))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const q = new URL(req.url).searchParams;
  const op = q.get("op") || "";
  const id = q.get("id") || "";
  if (op === "me") return ss("/v1/me");
  if (op === "stock-one" || op === "lot") {
    if (!ID.test(id)) return NextResponse.json({ error: "Neplatné ID." }, { status: 400 });
    return ss(`/v1/${op === "lot" ? "auction/lots" : "stock"}/${encodeURIComponent(id)}`);
  }
  if (op === "check") {
    // stav viacerých áut naraz (sklad aj aukcie) pre kontrolu dostupnosti importovaných áut
    const refs = (q.get("refs") || "").split(",").map((x) => x.split(":")).filter(([k, v]) => (k === "stock" || k === "lot") && ID.test(v || "")).slice(0, 40);
    const out: Record<string, { status: string | null; gone: boolean }> = {};
    for (const [k, v] of refs) {
      const r = await ss(`/v1/${k === "lot" ? "auction/lots" : "stock"}/${encodeURIComponent(v)}`);
      if (r.status === 503) return r;
      const j = await r.json().catch(() => null) as { status?: string } | null;
      out[`${k}:${v}`] = r.status === 404 ? { status: "not_found", gone: true } : r.ok ? { status: j?.status || null, gone: false } : { status: null, gone: false };
    }
    return NextResponse.json({ out }, { headers: { "cache-control": "no-store" } });
  }
  const keys = PASS[op];
  if (!keys) return NextResponse.json({ error: "Neznáma operácia." }, { status: 400 });
  if (op === "lots" && !/^\d{4}-\d{2}-\d{2}$/.test(q.get("date") || "")) return NextResponse.json({ error: "Chýba dátum aukcie." }, { status: 400 });
  const p = new URLSearchParams();
  for (const k of keys) { const v = q.get(k); if (v) p.set(k, v); }
  return ss(`/v1/${op === "stock" ? "stock" : op === "schedule" ? "auction/schedule" : "auction/lots"}?${p}`);
}

export async function POST(req: Request) {
  if (!(await admin(req))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const b = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!b || (b.vehicle_type !== "stock" && b.vehicle_type !== "lot") || !ID.test(String(b.vehicle_id || "")) || !String(b.message || "").trim()) {
    return NextResponse.json({ error: "Vyplňte auto a správu." }, { status: 400 });
  }
  const body = {
    vehicle_type: b.vehicle_type, vehicle_id: String(b.vehicle_id), message: String(b.message).slice(0, 5000),
    customer_country: "SK", ...(b.partner_ref ? { partner_ref: String(b.partner_ref).slice(0, 80) } : {})
  };
  return ss("/v1/leads", { method: "POST", body: JSON.stringify(body) });
}
