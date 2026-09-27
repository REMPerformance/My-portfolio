import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendMail } from "@/lib/mail";
import { mergeNotify } from "@/lib/notify";

/** Testovací e-mail – len pre prihláseného admina. */
export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false }
  });
  const { data: isAdmin } = await sb.rpc("is_admin");
  if (!isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { data } = await sb.from("settings").select("value").eq("key", "notify").maybeSingle();
  const n = mergeNotify(data?.value);
  const r = await sendMail({ to: n.adminEmails, fromName: n.fromName, subject: "Test – upozornenia z remperformance.sk fungujú", text: "Toto je testovací e-mail z adminu REM Performance. Upozornenia na nové dopyty sú nastavené správne." });
  return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.error }, { status: 500 });
}
