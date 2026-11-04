import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * Stiahne stránku inzerátu z global.che168.com a vráti z nej objekt s údajmi auta (cena, parametre, fotky).
 * Len pre prihláseného admina a len pre che168, aby to nebol otvorený proxy server.
 */
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
  const id = (u.pathname.match(/\/detail\/(\d+)/) || [])[1];
  if (u.protocol !== "https:" || !/^(global|www)\.che168\.com$/i.test(u.hostname) || !id) return NextResponse.json({ error: "Podporovaná je len stránka auta na che168." }, { status: 400 });

  try {
    const r = await fetch(`https://${u.hostname}/en/detail/${id}`, {
      redirect: "follow", cache: "no-store", signal: AbortSignal.timeout(15000),
      headers: { accept: "text/html", "accept-language": "en", "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36" }
    });
    if (!r.ok) return NextResponse.json({ error: `Stránka vrátila ${r.status}.` }, { status: 502 });
    const html = await r.text();
    // údaje sú v kóde stránky ako escapovaný JSON objekt začínajúci "infoid":<id>
    const s = html.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    const i = s.indexOf(`{"infoid":${id}`);
    if (i < 0) return NextResponse.json({ error: "Údaje auta sa na stránke nenašli." }, { status: 404 });
    const e = s.indexOf('"id":', i);
    const c = JSON.parse(s.slice(i, s.indexOf("}", e) + 1)) as Record<string, unknown>;
    for (const k of ["wechat_url", "whatsapp_url", "paramkey"]) delete c[k];
    return NextResponse.json({ c }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Stránku sa nepodarilo načítať." }, { status: 502 });
  }
}
