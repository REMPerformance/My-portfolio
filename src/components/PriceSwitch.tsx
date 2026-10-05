"use client";
import { useEffect, useState } from "react";
import { eur } from "@/lib/format";

type P = { total: number; gross: number; net: number };
const EVT = "rem-self-homolog";
/** Voľbu zdieľa cenový box s formulárom na tej istej stránke. */
export function useSelfHomolog(): [boolean, (v: boolean) => void] {
  const [v, setV] = useState(false);
  useEffect(() => {
    const h = (e: Event) => setV(!!(e as CustomEvent<boolean>).detail);
    window.addEventListener(EVT, h);
    return () => window.removeEventListener(EVT, h);
  }, []);
  return [v, (x) => window.dispatchEvent(new CustomEvent(EVT, { detail: x }))];
}

/** Odhadovaná cena v detaile auta s prepínačom: s opravou a homologizáciou od nás, alebo bez nich (lacnejšie). */
export function PriceSwitch({ full, self, priceMode, ended, endedLabel, local, repair, contact, skPrice }: { full: P; self: P | null; priceMode: "net" | "gross"; ended: boolean; endedLabel: string; local: boolean; repair: boolean; contact: string; skPrice: number | null }) {
  const [own, setOwn] = useSelfHomolog();
  const p = own && self ? self : full;
  const saving = skPrice && !(own && self) ? skPrice - p.gross : 0;
  const reg = local ? "prihlásenie" : "homologizácia";
  const withLbl = repair ? (local ? "S opravou a prihlásením" : "S opravou a homologizáciou") : local ? "S prihlásením" : "S homologizáciou";
  const noLbl = repair ? (local ? "Bez opravy a prihlásenia" : "Bez opravy a homologizácie") : local ? "Bez prihlásenia" : "Bez homologizácie";
  return (
    <>
      <div className="lbl">Odhadovaná cena {priceMode === "net" ? "bez DPH" : "s DPH"}</div>
      {ended && <div className="pb-ended">{endedLabel}</div>}
      <div className="big" aria-live="polite">{ended ? <s>{eur(p.total)}</s> : eur(p.total)}</div>
      <div className="vatalt">{priceMode === "net" ? <>s DPH <b>{eur(p.gross)}</b></> : <>bez DPH <b>{eur(p.net)}</b></>}</div>
      <p className="note" style={{ marginTop: 2 }}>
        {own && self ? `s dovozom na Slovensko, ${repair ? "bez opravy a " : ""}bez ${local ? "prihlásenia" : "homologizácie"}` : "s dovozom na slovenských značkách"}. Cena je odhad, <a className="link" href={contact} target="_blank" rel="noopener">pre presnejší odhad nás kontaktujte</a>.
      </p>
      {self && !ended && (
        <>
          <div className="hsw" role="radiogroup" aria-label="Rozsah služby">
            <button type="button" role="radio" aria-checked={!own} className={!own ? "on" : ""} onClick={() => setOwn(false)}>
              <b>{withLbl}</b><small>{repair ? "auto opravíme, vybavíme všetko a dostanete ho so značkami" : "vybavíme všetko, auto dostanete so značkami"}</small>
            </button>
            <button type="button" role="radio" aria-checked={own} className={own ? "on" : ""} onClick={() => setOwn(true)}>
              <b>{noLbl}</b><small>{repair ? "auto dostanete v stave po dovoze" : `${reg} si vybavíte sami`}, lacnejšie o {eur(full.total - self.total)}</small>
            </button>
          </div>
          {repair && <p className="note" style={{ marginTop: 8 }}>{local ? "Prihlásenie" : "Homologizáciu"} vieme vybaviť len pri aute, ktoré opravíme my.</p>}
        </>
      )}
      {skPrice && !(own && self) ? (
        <div className="skcmp">
          <div><span>Podobné auto na Slovensku</span><b>{eur(skPrice)}</b></div>
          {saving > 0 && <div className="pos"><span>Ušetríte približne</span><b>{eur(saving)}</b></div>}
        </div>
      ) : null}
    </>
  );
}
