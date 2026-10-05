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

/** Cena v detaile auta s prepínačom: s homologizáciou od nás, alebo bez nej (zákazník si ju vybaví sám). */
export function PriceSwitch({ full, self, priceMode, ended, endedLabel, fixed, local, skPrice }: { full: P; self: P | null; priceMode: "net" | "gross"; ended: boolean; endedLabel: string; fixed: boolean; local: boolean; skPrice: number | null }) {
  const [own, setOwn] = useSelfHomolog();
  const p = own && self ? self : full;
  const saving = skPrice ? skPrice - p.gross : 0;
  const what = local ? "prihlásenie" : "homologizáciu";
  return (
    <>
      <div className="lbl">Cena {priceMode === "net" ? "bez DPH" : "s DPH"}</div>
      {ended && <div className="pb-ended">{endedLabel}</div>}
      <div className="big" aria-live="polite">{ended ? <s>{eur(p.total)}</s> : eur(p.total)}</div>
      <div className="vatalt">{priceMode === "net" ? <>s DPH <b>{eur(p.gross)}</b></> : <>bez DPH <b>{eur(p.net)}</b></>}</div>
      <p className="note" style={{ marginTop: 2 }}>
        {own && self ? (local ? "s dovozom na Slovensko, prihlásenie si vybavíte sami" : "s dovozom a preclením na Slovensko, bez homologizácie, STK a EČV") : "s dovozom na slovenských značkách"}
        {!fixed ? " · odhad podľa výsledku aukcie" : ""}
      </p>
      {self && !ended && (
        <div className="hsw" role="radiogroup" aria-label={local ? "Prihlásenie auta" : "Homologizácia"}>
          <button type="button" role="radio" aria-checked={!own} className={!own ? "on" : ""} onClick={() => setOwn(false)}>
            <b>{local ? "S prihlásením" : "S homologizáciou"}</b><small>vybavíme všetko, auto dostanete so značkami</small>
          </button>
          <button type="button" role="radio" aria-checked={own} className={own ? "on" : ""} onClick={() => setOwn(true)}>
            <b>{local ? "Bez prihlásenia" : "Bez homologizácie"}</b><small>{what} si vybavíte sami, ušetríte {eur(full.total - self.total)}</small>
          </button>
        </div>
      )}
      {skPrice ? (
        <div className="skcmp">
          <div><span>Podobné auto na Slovensku</span><b>{eur(skPrice)}</b></div>
          {saving > 0 && <div className="pos"><span>Ušetríte približne</span><b>{eur(saving)}</b></div>}
        </div>
      ) : null}
    </>
  );
}
