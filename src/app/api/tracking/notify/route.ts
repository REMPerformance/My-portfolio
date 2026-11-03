import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { mailConfigured, sendMail } from "@/lib/mail";
import { SITE } from "@/lib/site";
import type { Milestone } from "@/lib/tracking";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

/** Pošle zákazníkovi e-mail o aktualizácii zásielky. Volá len prihlásený admin. */
export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Nie ste prihlásený." }, { status: 401 });
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false }
  });
  const { data: isAdmin } = await sb.rpc("is_admin");
  if (!isAdmin) return NextResponse.json({ error: "Bez prístupu." }, { status: 403 });
  if (!mailConfigured()) return NextResponse.json({ error: "Odosielanie e-mailov nie je nastavené (chýba RESEND_API_KEY vo Verceli)." }, { status: 503 });

  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Chýba aktualizácia." }, { status: 400 });
  const { data: u } = await sb.from("shipment_updates").select("*, shipments(*)").eq("id", id).maybeSingle();
  const s = u?.shipments as { car_label: string; contract_no: string; customer_email: string; customer_name: string; milestones: Milestone[] } | undefined;
  if (!u || !s) return NextResponse.json({ error: "Aktualizácia sa nenašla." }, { status: 404 });
  const to = (s.customer_email || "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return NextResponse.json({ error: "Zákazník nemá platný e-mail." }, { status: 400 });

  const step = s.milestones?.[u.step]?.t || "Aktualizácia";
  const link = `${SITE.url}/sledovanie`;
  const photos: string[] = (u.photos || []).slice(0, 6);
  const subject = `${s.car_label || "Vaše vozidlo"}: ${step}`;
  const text = [
    "Dobrý deň,", "",
    `posielame Vám novú informáciu o dovoze Vášho vozidla ${s.car_label} podľa zmluvy ${s.contract_no}.`, "",
    `${step}`, u.text || "", "",
    photos.length ? `K aktualizácii sme priložili fotky (${(u.photos || []).length}). Nájdete ich na stránke sledovania.` : "",
    `Stav a polohu vozidla nájdete na ${link} po zadaní VIN a čísla zmluvy.`, "",
    "S pozdravom", "REM Performance", `${SITE.phone} · ${SITE.email}`
  ].filter((x, i, a) => !(x === "" && a[i - 1] === "")).join("\n");

  const html = `<!doctype html><html><body style="margin:0;background:#f1f2f5;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;color:#15171b">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e4e6ea">
<tr><td style="background:#0c0d10;padding:18px 24px;font-size:18px;font-weight:700;font-style:italic;letter-spacing:.5px;color:#ffffff">RE<span style="color:#c8102e">M</span>PERFORMANCE</td></tr>
<tr><td style="padding:26px 24px 8px;font-size:15px;line-height:1.6">
<p style="margin:0 0 14px">Dobrý deň,</p>
<p style="margin:0 0 18px">posielame Vám novú informáciu o dovoze Vášho vozidla <b>${esc(s.car_label)}</b> podľa zmluvy ${esc(s.contract_no)}.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e4e6ea;border-top:3px solid #c8102e"><tr><td style="padding:12px 14px">
<div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#7b818b;font-weight:700">Aktuálny krok</div>
<div style="font-size:17px;font-weight:700;margin-top:2px">${esc(step)}</div></td></tr></table>
${u.text ? `<p style="margin:16px 0 0">${esc(u.text).replace(/\n/g, "<br>")}</p>` : ""}
</td></tr>
${photos.length ? `<tr><td style="padding:12px 18px 0">${photos.map((p) => `<img src="${esc(p)}" width="176" height="132" alt="" style="display:inline-block;width:176px;height:132px;object-fit:cover;margin:6px;border:1px solid #e4e6ea">`).join("")}</td></tr>` : ""}
<tr><td style="padding:22px 24px 8px"><a href="${link}" style="display:inline-block;background:#c8102e;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px">Sledovať objednávku</a></td></tr>
<tr><td style="padding:8px 24px 24px;font-size:14px;line-height:1.6;color:#4a4f58">Na stránke sledovania zadajte VIN a číslo zmluvy. Uvidíte aktuálny stav, polohu lode a všetky fotky z cesty.<br><br>S pozdravom<br>REM Performance<br>${SITE.phone} · ${SITE.email}</td></tr>
</table></body></html>`;

  const r = await sendMail({ to: [to], subject, text, html, replyTo: SITE.email, fromName: "REM Performance" });
  if (!r.ok) return NextResponse.json({ error: `E-mail sa neodoslal: ${r.error}` }, { status: 502 });
  await sb.from("shipment_updates").update({ emailed_at: new Date().toISOString(), email_to: to }).eq("id", id);
  return NextResponse.json({ ok: true, to });
}
