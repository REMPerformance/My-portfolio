import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export const dynamic = "force-dynamic";
const MAX = 15 * 1024 * 1024;

function privateAddr(a: string) {
  if (a.includes(":")) return /^(::1?$|f[cd]|fe[89ab]|::ffff:)/i.test(a);
  const [x, y] = a.split(".").map(Number);
  return x === 10 || x === 127 || x === 0 || (x === 172 && y >= 16 && y <= 31) || (x === 192 && y === 168) || (x === 169 && y === 254) || (x === 100 && y >= 64 && y <= 127) || x >= 224;
}

/** Stiahne fotku z cudzej adresy pre import auta. Len pre prihláseného admina, len verejné https adresy, len obrázky. */
export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false }
  });
  const { data: isAdmin } = await sb.rpc("is_admin");
  if (!isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let u: URL;
  try { u = new URL(new URL(req.url).searchParams.get("url") || ""); } catch { return NextResponse.json({ error: "Neplatná adresa." }, { status: 400 }); }
  if (u.protocol !== "https:" || u.username || u.password || (u.port && u.port !== "443") || isIP(u.hostname) || !u.hostname.includes(".") || /\.(local|internal|localhost)$/i.test(u.hostname))
    return NextResponse.json({ error: "Túto adresu nie je možné stiahnuť." }, { status: 400 });
  try {
    const addrs = await lookup(u.hostname, { all: true });
    if (!addrs.length || addrs.some((a) => privateAddr(a.address))) return NextResponse.json({ error: "Túto adresu nie je možné stiahnuť." }, { status: 400 });
  } catch { return NextResponse.json({ error: "Adresa sa nenašla." }, { status: 400 }); }

  try {
    const r = await fetch(u, { redirect: "error", cache: "no-store", signal: AbortSignal.timeout(15000), headers: { accept: "image/*" } });
    const type = r.headers.get("content-type") || "";
    if (!r.ok || !/^image\/(jpeg|png|webp|avif|gif)/i.test(type)) return NextResponse.json({ error: "Na adrese nie je obrázok." }, { status: 415 });
    if (Number(r.headers.get("content-length") || 0) > MAX) return NextResponse.json({ error: "Obrázok je príliš veľký." }, { status: 413 });
    const buf = await r.arrayBuffer();
    if (buf.byteLength > MAX) return NextResponse.json({ error: "Obrázok je príliš veľký." }, { status: 413 });
    return new NextResponse(buf, { headers: { "content-type": type.split(";")[0], "cache-control": "no-store", "x-content-type-options": "nosniff" } });
  } catch {
    return NextResponse.json({ error: "Obrázok sa nepodarilo stiahnuť." }, { status: 502 });
  }
}
