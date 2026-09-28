"use client";
import Link from "next/link";
import { useState } from "react";
import { SITE } from "@/lib/site";

export const waLink = (text?: string) => `https://wa.me/${SITE.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

export function WhatsAppButton({ text, block = false, label = "Napísať na WhatsApp" }: { text?: string; block?: boolean; label?: string }) {
  return (
    <a className={`rc-btn rc-btn--wa${block ? " rc-btn--block" : ""}`} href={waLink(text)} target="_blank" rel="noopener">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.8 11.8 0 004.5 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.7-1.2s.2-1.1.2-1.2-.3-.2-.5-.3z" /></svg>
      {label}
    </a>
  );
}

/**
 * Dopyt. Pri aute stačí telefón a e-mail (rýchly kontakt).
 * Všeobecný dopyt (bez auta) má navyše meno, odkaz a správu – všetko nepovinné.
 */
export function LeadForm({ car, closed = false, heading }: { car?: { id: string; label: string; url?: string } | null; closed?: boolean; suggestedBudget?: number; heading?: string }) {
  const [state, setState] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");
  const waText = car ? `Dobrý deň, mám záujem o ${car.label}${car.url ? ` – ${car.url}` : ""}` : "Dobrý deň, mám záujem o dovoz auta.";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (f.get("website")) return;
    const email = String(f.get("email") || "").trim();
    const phone = String(f.get("phone") || "").trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || phone.replace(/\D/g, "").length < 6) {
      setState("err"); setMsg("Vyplňte prosím platný telefón a e-mail."); return;
    }
    if (!f.get("gdpr")) { setState("err"); setMsg("Potvrďte prosím súhlas."); return; }
    setState("sending");
    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        car_id: car?.id ?? null,
        car_label: car?.label ?? null,
        name: String(f.get("name") || "").trim() || null,
        email, phone,
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
      setMsg((j as { error?: string }).error || `Odoslanie sa nepodarilo. Napíšte nám prosím na WhatsApp alebo ${SITE.email}.`);
      return;
    }
    (e.target as HTMLFormElement).reset();
    setState("ok");
    setMsg("Ďakujeme! Ozveme sa Vám čo najskôr, zvyčajne do niekoľkých hodín.");
  }

  if (closed) {
    return (
      <div className="panel">
        <h2>Ponuka na toto auto skončila</h2>
        <p className="sub">Napíšte nám, aké auto hľadáte, a nájdeme Vám podobné.</p>
        <div className="actions"><Link href="/kontakt" className="rc-btn rc-btn--primary">Nájdite mi podobné auto</Link><WhatsAppButton /></div>
      </div>
    );
  }

  return (
    <form className="panel leadform" onSubmit={submit} noValidate>
      <h2>{heading ?? (car ? "Mám záujem o toto auto" : "Nezáväzný dopyt")}</h2>
      {car && <p className="note" style={{ marginTop: -8, marginBottom: 16 }}>Nechajte nám kontakt a ozveme sa Vám s ďalším postupom.</p>}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px" }} />
      <div className="two">
        <div className="field"><label htmlFor="lf-phone">Telefón *</label><input className="input" id="lf-phone" name="phone" type="tel" required autoComplete="tel" placeholder="+421 9xx xxx xxx" /></div>
        <div className="field"><label htmlFor="lf-email">E-mail *</label><input className="input" id="lf-email" name="email" type="email" required autoComplete="email" /></div>
      </div>
      {!car && (
        <>
          <div className="field"><label htmlFor="lf-name">Meno (nepovinné)</label><input className="input" id="lf-name" name="name" autoComplete="name" /></div>
          <div className="field"><label htmlFor="lf-link">Odkaz na auto (nepovinné)</label><input className="input" id="lf-link" name="link" type="url" placeholder="https://…" /></div>
          <div className="field"><label htmlFor="lf-msg">Aké auto hľadáte? (nepovinné)</label><textarea className="input" id="lf-msg" name="message" rows={3} placeholder="Značka, model, rozpočet…" /></div>
        </>
      )}
      <label className="check"><input type="checkbox" name="gdpr" /> <span>Súhlasím so spracovaním údajov podľa <Link href="/ochrana-osobnych-udajov">zásad ochrany osobných údajov</Link> a <Link href="/vop">obchodných podmienok</Link>. *</span></label>
      <button className="rc-btn rc-btn--primary rc-btn--block" type="submit" disabled={state === "sending"} style={{ padding: 14 }}>
        {state === "sending" ? "Odosielam…" : car ? "Mám záujem" : "Odoslať dopyt"}
      </button>
      {(state === "ok" || state === "err") && <div className={`fmsg ${state}`} role="status">{msg}</div>}
      <div className="or"><span>alebo</span></div>
      <WhatsAppButton text={waText} block label={`WhatsApp ${SITE.phone}`} />
      <p className="note" style={{ textAlign: "center" }}>Dopyt je nezáväzný.</p>
    </form>
  );
}
