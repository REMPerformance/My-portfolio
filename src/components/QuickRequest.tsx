"use client";
import Link from "next/link";
import { useState } from "react";
import { SITE } from "@/lib/site";

/** Krátky pás „Hľadáte auto?“: čo hľadá, telefón, e-mail. Ide do /api/lead ako nezáväzný dopyt na kompletný dovoz. */
export function QuickRequest({ id = "qr" }: { id?: string }) {
  const [state, setState] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    if (f.get("website")) return;
    const g = (k: string) => String(f.get(k) || "").trim();
    const car = g("car"), phone = g("phone"), email = g("email");
    if (!car) { setState("err"); setMsg("Napíšte prosím, aké auto hľadáte."); return; }
    if (phone.replace(/\D/g, "").length < 6) { setState("err"); setMsg("Napíšte prosím telefón, na ktorom Vás zastihneme."); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setState("err"); setMsg("Napíšte prosím platný e-mail, pošleme Vám naň ponuku."); return; }
    if (!f.get("gdpr")) { setState("err"); setMsg("Potvrďte prosím súhlas so spracovaním údajov."); return; }
    setState("sending");
    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        car_label: `Hľadá: ${car}`.slice(0, 200),
        email, phone,
        message: `Rýchly dopyt z webu: ${car}`,
        consent_gdpr: true,
        consent_terms: true,
        page_url: window.location.href.slice(0, 500)
      })
    }).catch(() => null);
    if (!res || !res.ok) {
      const j = res ? await res.json().catch(() => ({})) : {};
      setState("err");
      setMsg((j as { error?: string }).error || `Odoslanie sa nepodarilo. Napíšte nám prosím na WhatsApp ${SITE.phone}.`);
      return;
    }
    form.reset();
    setState("ok");
  }

  return (
    <div className="hla" id={id}>
      <div className="hla__txt">
        <h2>Hľadáte auto?</h2>
        <p>Je to jednoduché. Zanechajte správu a my Vám pripravíme nezáväznú ponuku na kompletný dovoz.</p>
      </div>
      {state === "ok" ? (
        <div className="hla__ok" role="status"><b>Ďakujeme, správu máme.</b> Ozveme sa Vám najneskôr do 24 hodín.</div>
      ) : (
        <form className="hla__form" onSubmit={submit} noValidate>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hla__hp" />
          <div className="hla__row">
            <label className="hla__f hla__f--car"><span>Aké auto hľadáte</span><input className="input" name="car" placeholder="napr. BMW X5 do 40 000 €" autoComplete="off" enterKeyHint="next" /></label>
            <label className="hla__f"><span>Telefón</span><input className="input" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+421 9xx xxx xxx" enterKeyHint="next" /></label>
            <label className="hla__f"><span>E-mail</span><input className="input" name="email" type="email" inputMode="email" autoComplete="email" placeholder="vas@email.sk" enterKeyHint="send" /></label>
            <button className="rc-btn rc-btn--primary hla__btn" type="submit" disabled={state === "sending"}>{state === "sending" ? "Odosielam…" : "Chcem ponuku"}</button>
          </div>
          <label className="check hla__gdpr"><input type="checkbox" name="gdpr" /> <span>Súhlasím so spracovaním údajov podľa <Link href="/ochrana-osobnych-udajov">zásad ochrany osobných údajov</Link>.</span></label>
          {state === "err" && <div className="fmsg err hla__err" role="alert">{msg}</div>}
        </form>
      )}
    </div>
  );
}
