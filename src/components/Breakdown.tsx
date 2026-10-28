import type { CalcResult } from "@/lib/calc";
import { eur, money } from "@/lib/format";

/** Rozpis odhadu po položkách, rovnako ako v cenových ponukách. Odmena je rozpustená v službách, DPH sa pripočítava len pri dovoze. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Breakdown({ r, skPrice, compact = false, hideFee = false }: { r: CalcResult; skPrice?: number | null; compact?: boolean; hideFee?: boolean }) {
  const diff = skPrice ? skPrice - r.total : null;
  const row = (k: React.ReactNode, v: number, note?: string) => (
    <div className="bd"><span>{k}{note && <em>{note}</em>}</span><span>{eur(v)}</span></div>
  );
  const pct = (x: number) => `${+(x * 100).toFixed(1)} %`.replace(".", ",");
  return (
    <div>
      <div className="bd-group">
        <h4>{r.local ? "Auto a preprava" : "Auto a doprava do EÚ"}</h4>
        {row(r.fixed ? "Cena auta" : "Odhad ceny na aukcii", r.carEur, r.currency !== "EUR" ? money(r.price, r.currency) : undefined)}
        {r.fixed ? (r.feeEur > 0 && row("Poplatky predajcu", r.feeEur)) : (r.feeManual || !r.local) && row("Aukčné poplatky", r.feeEur, r.feeManual ? undefined : "odhad")}
        {r.local ? row("Preprava na Slovensko", r.inlandEur, r.placeName ? `${r.placeName}, autoprepravník` : "autoprepravník") : (
          <>
            {row("Odvoz do prístavu", r.inlandEur, [r.placeName, r.portName].filter(Boolean).join(" → "))}
            {row("Námorná preprava", r.oceanEur, "do Bremerhavenu")}
            {r.insuranceEur > 0 && row("Poistenie prepravy", r.insuranceEur, "plné krytie")}
          </>
        )}
      </div>
      {(!r.local || r.euCarVat > 0) && (
        <div className="bd-group">
          <h4>Clo a DPH</h4>
          {!r.local && row(`Clo ${pct(r.dutyRate)}`, r.duty, r.dutyRate > 0 ? "z colnej hodnoty" : "s dokladom o pôvode")}
          {r.cvd > 0 && row(`Vyrovnávacie clo EÚ ${pct(r.cvdRate)}`, r.cvd, "elektromobil z Číny")}
          {!r.local && row("DPH pri dovoze 23 %", r.importVat, "z colnej hodnoty, cla a dopravy")}
          {r.euCarVat > 0 && row("DPH na Slovensku 23 %", r.euCarVat, "z ceny auta")}
        </div>
      )}
      <div className="bd-group">
        <h4>{r.local ? "Prihlásenie na Slovensku" : "Prístav a Slovensko"}</h4>
        {!r.local && row("Prístav a colný deklarant", r.euPortEur)}
        {!r.local && row("Preprava na Slovensko", r.truckEur, "autoprepravník")}
        {r.noHomolog ? (
          <div className="bd"><span>{r.local ? "Prihlásenie na Slovensku" : "Schválenie a prihlásenie"}</span><span>vybavíte si sami</span></div>
        ) : (
          <>
            {r.translationsEur > 0 && row("Úradné preklady", r.translationsEur)}
            {row("Technické kontroly", r.inspectionsEur, r.local ? "kontrola originality" : "KO, TK, EK")}
            {row(r.local ? "Prihlásenie a doklady" : "Schválenie a technická adaptácia", r.homologEur, r.local ? undefined : "úprava svetiel a pod.")}
            {r.adaptersEur > 0 && row("Nabíjacie adaptéry", r.adaptersEur, "CCS2 a Type 2 na GB/T")}
            {row("Recyklačný poplatok", r.recyclingEur)}
            {row("Zápis do evidencie a EČV", r.registrationEur)}
          </>
        )}
        {r.repairEur > 0 && row("Odhad opravy", r.repairEur)}
        {r.extraCosts?.map((x) => <div className="bd" key={x.label}><span>{x.label}</span><span>{eur(x.eur)}</span></div>)}
        {r.reserveEur > 0 && row("Rezerva na nepredvídané náklady", r.reserveEur, "záloha, nevyčerpaná časť sa vracia")}
      </div>
      <div className="bd-total">
        <div>
          <small>{r.noHomolog ? "Odhad spolu s dovozom na Slovensko" : "Odhad spolu na slovenských značkách"}</small>
          <b>{eur(r.total)}</b>
          {r.reserveEur > 0 && <small>záloha po podpise zmluvy {eur(r.reserveEur)}</small>}
        </div>
        {r.credit > 0 && <div className="cr"><small>Kredit RACEM</small><b>+{eur(r.credit)}</b></div>}
      </div>
      {skPrice ? (
        <div className="bd-cmp">
          <div><small>Podobné auto na SK trhu</small><b>{eur(skPrice)}</b></div>
          <div className={diff! >= 0 ? "pos" : "neg"}><small>{diff! >= 0 ? "Ušetríte približne" : "Drahšie o"}</small><b>{eur(Math.abs(diff!))}</b></div>
        </div>
      ) : null}
      {!compact && (
        <p className="note">{r.local
          ? "Odhad. Auto z Európskej únie sa neclí a nehomologizuje sa. Pri jazdenom aute je cena u predajcu konečná. Pri novom aute (do 6 mesiacov alebo do 6 000 km) sa platí DPH 23 % na Slovensku."
          : "Odhad. Colná hodnota je cena auta, poplatky, doprava do EÚ a poistenie. DPH 23 % sa platí pri dovoze z colnej hodnoty, cla a dopravy. Výsledok závisí od kurzu, skutočnej ceny auta a požiadaviek pri schválení."}</p>
      )}
    </div>
  );
}
