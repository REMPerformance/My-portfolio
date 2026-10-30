import type { CalcResult } from "@/lib/calc";
import { eur, money } from "@/lib/format";

/** Rozpis odhadu po položkách, rovnako ako v cenových ponukách. Odmena je rozpustená v službách, DPH sa pripočítava len pri dovoze. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Breakdown({ r, skPrice, compact = false, hideFee = false }: { r: CalcResult; skPrice?: number | null; compact?: boolean; hideFee?: boolean }) {
  const diff = skPrice ? skPrice - r.gross : null;
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
            {row("Námorná preprava", r.oceanEur, `${r.portName} → ${r.euPortName}`)}
            {r.insuranceEur > 0 && row("Poistenie prepravy", r.insuranceEur, "plné krytie")}
          </>
        )}
      </div>
      {(!r.local || r.euCarVat > 0) && (
        <div className="bd-group">
          <h4>Clo a DPH</h4>
          {!r.local && row(`Clo ${pct(r.dutyRate)}`, r.duty, r.dutyRate > 0 ? "z colnej hodnoty" : "s dokladom o pôvode")}
          {r.cvd > 0 && row(`Vyrovnávacie clo EÚ ${pct(r.cvdRate)}`, r.cvd, "elektromobil z Číny")}
          {!r.local && row(`DPH pri dovoze ${pct(r.vatRate)}`, r.importVat, `preclenie v krajine ${r.euPortCountry}, z colnej hodnoty, cla a dopravy`)}
          {r.euCarVat > 0 && row(`DPH na Slovensku ${pct(r.vatRate)}`, r.euCarVat, "z ceny auta")}
        </div>
      )}
      <div className="bd-group">
        <h4>{r.local ? "Prihlásenie na Slovensku" : "Prístav a Slovensko"}</h4>
        {!r.local && row("Prístav a colný deklarant", r.euPortEur, r.euPortName)}
        {!r.local && row("Preprava na Slovensko", r.truckEur, `z prístavu ${r.euPortName}, autoprepravník`)}
        {r.noHomolog ? (
          <div className="bd"><span>{r.local ? "Prihlásenie na Slovensku" : "Schválenie a prihlásenie"}</span><span>vybavíte si sami</span></div>
        ) : (
          <>
            {row(r.local ? "Prihlásenie na Slovensku" : "Schválenie a prihlásenie na Slovensku", r.regEur, r.local ? "kontrola originality, doklady, recyklačný poplatok a EČV" : "úradné preklady, technické kontroly, schválenie s úpravami, recyklačný poplatok, zápis a EČV")}
            {r.adaptersEur > 0 && row("Nabíjacie adaptéry", r.adaptersEur, "CCS2 a Type 2 na GB/T")}
          </>
        )}
        {r.repairEur > 0 && row("Odhad opravy", r.repairEur)}
        {r.extraCosts?.map((x) => <div className="bd" key={x.label}><span>{x.label}</span><span>{eur(x.eur)}</span></div>)}
        {r.reserveEur > 0 && row("Povinná záloha (rezerva)", r.reserveEur, "nezapočítava sa do konečnej sumy, nevyčerpaná časť sa vracia")}
      </div>
      <div className="bd-total">
        <div>
          <small>{r.noHomolog ? "Odhad spolu s dovozom na Slovensko" : "Odhad spolu na slovenských značkách"}</small>
          <b>{eur(r.gross)}</b>
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
          : `Odhad. Colná hodnota je cena auta, poplatky, doprava do EÚ a poistenie. DPH sa platí pri dovoze v krajine, kde sa auto preclí (${r.euPortCountry} ${pct(r.vatRate)}), z colnej hodnoty, cla a dopravy. Námorná preprava sa pohybuje od 260 do 3 100 USD podľa prístavov a spôsobu nakládky. Výsledok závisí od kurzu, skutočnej ceny auta a požiadaviek pri schválení.`}</p>
      )}
    </div>
  );
}
