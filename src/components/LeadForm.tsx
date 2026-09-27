"use client";
import Link from "next/link";
import { useState } from "react";
import { SITE } from "@/lib/site";

export function LeadForm({
  car,
  closed = false,
  suggestedBudget,
  heading = "Nezáväzný dopyt"
}: {
  car?: { id: string; label: string } | null;
  closed?: boolean;
  suggestedBudget?: number;
  heading?: string;
}) {
  const [state, setState] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (f.get("website")) return; // honeypot
    const name = String(f.get("name") || "").trim();
    const email = String(f.get("email") || "").trim();
    const phone = String(f.get("phone") || "").trim();
    if (name.length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || phone.length < 6) {
      setState("err"); setMsg("Vyplňte prosím meno, platný e-mail a telefón."); return;
    }
    if (!f.get("gdpr") || !f.get("terms")) { setState("err"); setMsg("Potvrďte prosím oba súhlasy."); return; }
    setState("sending");
    const budget = Number(f.get("budget")) || null;
    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        car_id: car?.id ?? null,
        car_label: car?.label ?? null,
        name, email, phone,
        max_budget_eur: budget,
        link: String(f.get("link") || "").trim() || null,
        message: String(f.get("message") || "").trim() || null,
        consent_gdpr: true,
        consent_terms: true,
        page_url: typeof window !== "undefined" ? window.location.href.slice(0, 500) : null
      })
    }).catch(() => null);
    if (!res || !res.ok) {
      const j = res ? await res.json().catch(() => ({})) : {};
      setState("err");
      setMsg((j as { error?: string }).error || `Odoslanie sa nepodarilo. Napíšte nám prosím na ${SITE.email}.`);
      return;
    }
    (e.target as HTMLFormElement).reset();
    setState("ok");
    setMsg("Ďakujeme, dopyt sme prijali. Do 24 hodín Vás budeme kontaktovať s presnou ponukou a ďalším postupom.");
  }

  if (closed) {
    return (
      <div className="panel">
        <h2>Objednávky sú uzavreté</h2>
        <p className="sub">Na toto auto už objednávky neprijímame. Napíšte nám, aké auto hľadáte, a nájdeme Vám podobné.</p>
        <div className="actions"><Link href="/kontakt" className="rc-btn rc-btn--primary">Nájdite mi podobné auto</Link></div>
      </div>
    );
  }

  return (
    <form className="panel" onSubmit={submit} noValidate>
      <h2>{heading}</h2>
      {car && <div className="selcar"><span>Auto: <b>{car.label}</b></span></div>}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px" }} />
      <div className="two">
        <div className="field"><label htmlFor="lf-name">Meno a priezvisko *</label><input className="input" id="lf-name" name="name" required autoComplete="name" /></div>
        <div className="field"><label htmlFor="lf-phone">Telefón *</label><input className="input" id="lf-phone" name="phone" type="tel" required autoComplete="tel" /></div>
      </div>
      <div className="two">
        <div className="field"><label htmlFor="lf-email">E-mail *</label><input className="input" id="lf-email" name="email" type="email" required autoComplete="email" /></div>
        <div className="field">
          <label htmlFor="lf-budget">Max. rozpočet spolu na SK</label>
          <div className="iw"><input className="input" id="lf-budget" name="budget" type="number" min={0} step={500} inputMode="numeric" defaultValue={suggestedBudget || undefined} /><span className="u">EUR</span></div>
        </div>
      </div>
      {!car && <div className="field"><label htmlFor="lf-link">Odkaz na auto (Copart / IAAI) – nepovinné</label><input className="input" id="lf-link" name="link" type="url" placeholder="https://www.copart.com/lot/…" /></div>}
      <div className="field"><label htmlFor="lf-msg">Správa</label><textarea className="input" id="lf-msg" name="message" rows={4} placeholder={car ? "Otázky k autu, požiadavky na opravu…" : "Aké auto hľadáte, rozpočet, termín…"} /></div>
      <label className="check"><input type="checkbox" name="gdpr" /> <span>Súhlasím so spracovaním osobných údajov podľa <Link href="/ochrana-osobnych-udajov">zásad ochrany osobných údajov</Link>. *</span></label>
      <label className="check"><input type="checkbox" name="terms" /> <span>Oboznámil/a som sa s <Link href="/vop">obchodnými podmienkami</Link> a beriem na vedomie, že ceny sú odhad a autá z aukcií sa kupujú v stave „ako stojí a leží“. *</span></label>
      <button className="rc-btn rc-btn--primary rc-btn--block" type="submit" disabled={state === "sending"} style={{ padding: 17, marginTop: 6 }}>
        {state === "sending" ? "Odosielam…" : car ? "Mám záujem o toto auto" : "Odoslať nezáväzný dopyt"}
      </button>
      <p className="note">Dopyt je nezáväzný. Záväzná je až podpísaná zmluva o sprostredkovaní a zložená záloha.</p>
      {(state === "ok" || state === "err") && <div className={`fmsg ${state}`} role="status">{msg}</div>}
    </form>
  );
}
