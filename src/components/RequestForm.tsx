"use client";
import Link from "next/link";
import { useState } from "react";
import { SITE } from "@/lib/site";
import { MAKE_NAMES } from "@/lib/makes";
import { COUNTRIES } from "@/lib/origins";
import { WhatsAppButton } from "./LeadForm";

const YEARS = Array.from({ length: 22 }, (_, i) => new Date().getFullYear() + 1 - i);

/** Formulár „Nájdite mi auto“ – značka, model, parametre, rozpočet a kontakt. Ide do /api/lead ako dopyt na mieru. */
export function RequestForm({ defaultMake = "" }: { defaultMake?: string }) {
  const [state, setState] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    if (f.get("website")) return;
    const g = (k: string) => String(f.get(k) || "").trim();
    const make = g("make"), model = g("model"), email = g("email"), phone = g("phone"), name = g("name");
    const budget = Number(g("budget").replace(/[^\d]/g, ""));
    if (!make) { setState("err"); setMsg("Napíšte prosím značku auta."); return; }
    if (!(budget > 0)) { setState("err"); setMsg("Napíšte prosím rozpočet, do ktorého sa chcete zmestiť."); return; }
    if (!name) { setState("err"); setMsg("Napíšte prosím svoje meno."); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || phone.replace(/\D/g, "").length < 6) { setState("err"); setMsg("Vyplňte prosím platný telefón a e-mail."); return; }
    if (!f.get("gdpr")) { setState("err"); setMsg("Potvrďte prosím súhlas so spracovaním údajov."); return; }

    const lines = [
      `Hľadá: ${make} ${model}`.trim(),
      g("yfrom") || g("yto") ? `Rok: ${g("yfrom") || "…"} – ${g("yto") || "…"}` : "",
      g("kmax") ? `Najazdené max: ${Number(g("kmax")).toLocaleString("sk-SK")} km` : "",
      g("fuel") ? `Palivo: ${g("fuel")}` : "",
      g("gear") ? `Prevodovka: ${g("gear")}` : "",
      g("country") ? `Odkiaľ: ${g("country")}` : "",
      g("state") ? `Stav: ${g("state")}` : "",
      g("when") ? `Kedy chce auto: ${g("when")}` : "",
      g("info") ? `\n${g("info")}` : ""
    ].filter(Boolean);

    setState("sending");
    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        car_label: `Na mieru: ${make} ${model}`.trim(),
        name, email, phone,
        max_budget_eur: budget,
        link: g("link") || null,
        message: lines.join("\n"),
        consent_gdpr: true,
        consent_terms: true,
        page_url: window.location.href.slice(0, 500)
      })
    }).catch(() => null);
    if (!res || !res.ok) {
      const j = res ? await res.json().catch(() => ({})) : {};
      setState("err");
      setMsg((j as { error?: string }).error || `Odoslanie sa nepodarilo. Napíšte nám prosím na WhatsApp alebo ${SITE.email}.`);
      return;
    }
    form.reset();
    setState("ok");
    setMsg("Ďakujeme! Požiadavku máme. Do 24 hodín Vám pošleme prvé vhodné autá aj s celkovou cenou.");
  }

  return (
    <form className="panel leadform reqform" onSubmit={submit} noValidate>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px" }} />
      <h2>Aké auto hľadáte?</h2>
      <div className="two">
        <div className="field"><label htmlFor="rq-make">Značka *</label><input className="input" id="rq-make" name="make" list="rq-makes" defaultValue={defaultMake} placeholder="napr. BMW" autoComplete="off" /></div>
        <div className="field"><label htmlFor="rq-model">Model</label><input className="input" id="rq-model" name="model" placeholder="napr. M4 Competition" /></div>
      </div>
      <datalist id="rq-makes">{MAKE_NAMES.map((m) => <option key={m} value={m} />)}</datalist>
      <div className="three">
        <div className="field"><label htmlFor="rq-yfrom">Rok od</label><select className="input" id="rq-yfrom" name="yfrom" defaultValue=""><option value="">Nezáleží</option>{YEARS.map((y) => <option key={y}>{y}</option>)}</select></div>
        <div className="field"><label htmlFor="rq-yto">Rok do</label><select className="input" id="rq-yto" name="yto" defaultValue=""><option value="">Nezáleží</option>{YEARS.map((y) => <option key={y}>{y}</option>)}</select></div>
        <div className="field"><label htmlFor="rq-kmax">Najazdené max</label><div className="iw"><input className="input" id="rq-kmax" name="kmax" type="number" inputMode="numeric" placeholder="napr. 80000" /><span className="u">km</span></div></div>
      </div>
      <div className="three">
        <div className="field"><label htmlFor="rq-fuel">Palivo</label><select className="input" id="rq-fuel" name="fuel" defaultValue=""><option value="">Nezáleží</option><option>Benzín</option><option>Nafta</option><option>Hybrid</option><option>Elektro</option></select></div>
        <div className="field"><label htmlFor="rq-gear">Prevodovka</label><select className="input" id="rq-gear" name="gear" defaultValue=""><option value="">Nezáleží</option><option>Automat</option><option>Manuál</option></select></div>
        <div className="field"><label htmlFor="rq-country">Odkiaľ</label><select className="input" id="rq-country" name="country" defaultValue=""><option value="">Kdekoľvek – kde je najvýhodnejšie</option>{COUNTRIES.map((c) => <option key={c.code}>{c.name}</option>)}</select></div>
      </div>
      <div className="two">
        <div className="field"><label htmlFor="rq-budget">Rozpočet do (celková cena na SK značkách) *</label><div className="iw"><input className="input" id="rq-budget" name="budget" inputMode="numeric" placeholder="napr. 30000" /><span className="u">EUR</span></div></div>
        <div className="field"><label htmlFor="rq-state">Stav auta</label><select className="input" id="rq-state" name="state" defaultValue=""><option value="">Nezáleží</option><option>Nepoškodené / len drobnosti</option><option>Aj ľahšie poškodené (lacnejšie)</option><option>Aj na opravu – chcem čo najnižšiu cenu</option></select></div>
      </div>
      <div className="field"><label htmlFor="rq-info">Ďalšie informácie</label><textarea className="input" id="rq-info" name="info" rows={4} placeholder="Farba, výbava, motor, na čo auto potrebujete, čo určite nechcete…" /></div>
      <div className="two">
        <div className="field"><label htmlFor="rq-link">Odkaz na podobné auto (nepovinné)</label><input className="input" id="rq-link" name="link" type="url" placeholder="https://…" /></div>
        <div className="field"><label htmlFor="rq-when">Kedy by ste auto chceli</label><select className="input" id="rq-when" name="when" defaultValue=""><option value="">Nezáleží</option><option>Čo najskôr</option><option>Do 3 mesiacov</option><option>Do pol roka</option><option>Len sa informujem</option></select></div>
      </div>

      <h2 style={{ marginTop: 10 }}>Kontakt</h2>
      <div className="field"><label htmlFor="rq-name">Meno a priezvisko *</label><input className="input" id="rq-name" name="name" autoComplete="name" /></div>
      <div className="two">
        <div className="field"><label htmlFor="rq-phone">Telefón *</label><input className="input" id="rq-phone" name="phone" type="tel" autoComplete="tel" placeholder="+421 9xx xxx xxx" /></div>
        <div className="field"><label htmlFor="rq-email">E-mail *</label><input className="input" id="rq-email" name="email" type="email" autoComplete="email" /></div>
      </div>
      <label className="check"><input type="checkbox" name="gdpr" /> <span>Súhlasím so spracovaním údajov podľa <Link href="/ochrana-osobnych-udajov">zásad ochrany osobných údajov</Link>. *</span></label>
      <button className="rc-btn rc-btn--primary rc-btn--block" type="submit" disabled={state === "sending"} style={{ padding: 15 }}>
        {state === "sending" ? "Odosielam…" : "Nájdite mi auto"}
      </button>
      {(state === "ok" || state === "err") && <div className={`fmsg ${state}`} role="status">{msg}</div>}
      <div className="or"><span>alebo</span></div>
      <WhatsAppButton text="Dobrý deň, hľadám auto na dovoz: " block label={`Napísať na WhatsApp ${SITE.phone}`} />
      <p className="note" style={{ textAlign: "center" }}>Nezáväzné a bezplatné – vyhľadanie áut Vás nič nestojí.</p>
    </form>
  );
}
