import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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
  const body = (await req.json().catch(() => ({}))) as { slugs?: string[] };
  revalidatePath("/", "layout");
  for (const s of body.slugs || []) revalidatePath(`/auta/${s}`);
  after(() => pingIndexNow(["/", "/ponuka", "/kalkulacka-dovozu", "/ako-to-funguje", "/caste-otazky", "/kontakt", "/vop", ...(body.slugs || []).map((s) => `/auta/${s}`)]));
  return NextResponse.json({ ok: true });
}
