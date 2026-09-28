import { NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase";
import { fillTemplate, mergeNotify } from "@/lib/notify";
import { sendMail } from "@/lib/mail";
import { SITE } from "@/lib/site";
import { eur } from "@/lib/format";

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Prijme dopyt, uloží ho (RLS + kontrola uzávierky v DB) a pošle e-maily. */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return NextResponse.json({ error: "Neplatná požiadavka." }, { status: 400 });
  if (str(b.website, 100)) return NextResponse.json({ ok: true }); // honeypot

  const lead = {
    car_id: typeof b.car_id === "string" && /^[0-9a-f-]{36}$/i.test(b.car_id) ? b.car_id : null,
    car_label: str(b.car_label, 200) || null,
    name: str(b.name, 120) || null,
    email: str(b.email, 200),
    phone: str(b.phone, 40),
    max_budget_eur: Number(b.max_budget_eur) > 0 ? Math.round(Number(b.max_budget_eur)) : null,
    link: str(b.link, 500) || null,
    message: str(b.message, 4000) || null,
    consent_gdpr: b.consent_gdpr === true,
    consent_terms: b.consent_terms === true,
    page_url: str(b.page_url, 500) || null
  };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(lead.email) || lead.phone.replace(/\D/g, "").length < 6)
    return NextResponse.json({ error: "Vyplňte prosím platný e-mail a telefón." }, { status: 400 });
  if (!lead.consent_gdpr) return NextResponse.json({ error: "Potvrďte prosím súhlas so spracovaním údajov." }, { status: 400 });

  const sb = serverClient();
  const { error } = await sb.from("leads").insert(lead);
  if (error) {
    const known = /uzavret|nie je v ponuke/i.test(error.message);
    return NextResponse.json({ error: known ? error.message : `Odoslanie sa nepodarilo. Napíšte nám prosím na ${SITE.email}.` }, { status: known ? 409 : 500 });
  }

  // e-maily (chyba e-mailu nesmie zablokovať dopyt)
  try {
    const { data } = await sb.rpc("get_notify_settings");
    const n = mergeNotify(data);
    let carUrl = "";
    if (lead.car_id) {
      const { data: car } = await sb.from("cars").select("slug").eq("id", lead.car_id).maybeSingle();
      if (car?.slug) carUrl = `${SITE.url}/auta/${car.slug}`;
    }
    const vars = {
      meno: (lead.name || "").split(" ")[0],
      auto: lead.car_label || "dovoz auta z USA",
      auto_veta: lead.car_label ? ` na auto ${lead.car_label}` : "",
      rozpocet: lead.max_budget_eur ? eur(lead.max_budget_eur) : "",
      odkaz: carUrl
    };
    const jobs: Promise<unknown>[] = [];
    if (n.notifyAdmin) {
      jobs.push(
        sendMail({
          to: n.adminEmails,
          replyTo: lead.email,
          fromName: n.fromName,
          subject: `Nový dopyt: ${lead.car_label || "všeobecný"} – ${lead.name || lead.phone}`,
          text: [
            `Nový dopyt z webu ${SITE.url.replace("https://", "")}`,
            "",
            `Auto: ${lead.car_label || "—"}${carUrl ? `\n${carUrl}` : ""}`,
            `Meno: ${lead.name || "—"}`,
            `Telefón: ${lead.phone}`,
            `E-mail: ${lead.email}`,
            `Rozpočet: ${lead.max_budget_eur ? eur(lead.max_budget_eur) : "—"}`,
            lead.link ? `Odkaz: ${lead.link}` : "",
            "",
            lead.message ? `Správa:\n${lead.message}` : "",
            "",
            `Admin: ${SITE.url}/admin/dopyty`
          ].filter((x) => x !== null).join("\n")
        })
      );
    }
    if (n.autoReply) {
      jobs.push(sendMail({ to: [lead.email], replyTo: n.adminEmails[0], fromName: n.fromName, subject: fillTemplate(n.replySubject, vars), text: fillTemplate(n.replyBody, vars) }));
    }
    await Promise.allSettled(jobs);
  } catch (e) {
    console.error("lead mail", e);
  }
  return NextResponse.json({ ok: true });
}
