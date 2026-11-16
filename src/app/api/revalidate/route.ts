import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { after } from "next/server";
import { pingIndexNow } from "@/lib/indexnow";

/** Po uložení v admine okamžite obnoví verejné stránky. Overí, že volá prihlásený admin. */
export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ ok: false }, { status: 401 });
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false }
  });
  const { data: isAdmin } = await sb.rpc("is_admin");
  if (!isAdmin) return NextResponse.json({ ok: false }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { slugs?: string[]; ssancar?: boolean };
  // ponuka „Ihneď k odberu z Kórey“: nové stiahnutie skladu z Kórey
  if (body.ssancar) { revalidateTag("ssancar", "max"); revalidatePath("/ihned-z-korey"); }
  const slugs = body.slugs || [];
  if (slugs.length) {
    // zmena konkrétnych áut: obnovia sa len stránky, kde sa autá zobrazujú (nie celý web)
    for (const p of ["/", "/ponuka", "/skoncene-aukcie", "/znacky", "/sitemap.xml", "/llms.txt"]) revalidatePath(p);
    revalidatePath("/[landing]", "page");
    revalidatePath("/znacky/[slug]", "page");
    revalidatePath("/znacky/[slug]/[model]", "page");
    for (const s of slugs) revalidatePath(`/auta/${s}`);
  } else if (!body.ssancar) {
    // nastavenia, obsah, mazanie auta: obnoví sa celý web
    revalidatePath("/", "layout");
  }
  after(() => pingIndexNow(["/", "/ponuka", "/kalkulacka-dovozu", "/ako-to-funguje", "/caste-otazky", "/kontakt", "/vop", ...(body.slugs || []).map((s) => `/auta/${s}`)]));
  return NextResponse.json({ ok: true });
}
