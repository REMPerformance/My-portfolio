import type { CalcResult } from "@/lib/calc";
import { eur, money } from "@/lib/format";

export function Breakdown({ r, skPrice, compact = false, hideFee = false }: { r: CalcResult; skPrice?: number | null; compact?: boolean; hideFee?: boolean }) {
  const diff = skPrice ? skPrice - r.gross : null;
  const row = (k: React.ReactNode, v: number, note?: string) => (
    <div className="bd"><span>{k}{note && <em>{note}</em>}</span><span>{eur(v)}</span></div>
  );
  return (
    <div>
      <div className="bd-group">
        <h4>{r.local ? "Auto a preprava" : "Auto a doprava do EÚ"}</h4>
        {row(r.fixed ? "Cena auta" : "Cena na aukcii", r.carEur, r.currency !== "EUR" ? money(r.price, r.currency) : undefined)}
        {r.fixed ? (r.feeEur > 0 && row("Poplatky predajcu", r.feeEur)) : (r.feeManual || !r.local) && row("Aukčné poplatky", r.feeEur, r.feeManual ? undefined : "odhad")}
        {r.local ? row("Preprava na Slovensko", r.inlandEur, r.placeName ? `${r.placeName}, po ceste` : "po ceste") : (
          <>
            {row("Odvoz do prístavu", r.inlandEur, [r.placeName, r.portName].filter(Boolean).join(" → "))}
            {row("Námorná preprava + poistenie", r.oceanEur)}
          </>
        )}
      </div>
      {!r.local && (
        <div className="bd-group">
          <h4>Clo</h4>
          {row(`Clo ${Math.round(r.dutyRate * 100)} %`, r.duty, "z colnej hodnoty")}
        </div>
      )}
      <div className="bd-group">
        <h4>{r.local ? "Slovensko" : "EÚ a Slovensko"}</h4>
        {!r.local && row("Prístav, vykládka, colný deklarant", r.euPortEur)}
        {!r.local && row("Kamión do SR", r.truckEur)}
        {hideFee ? row(r.local ? "Vybavenie dovozu a prihlásenie na Slovensku" : "Vybavenie dovozu, homologizácia, STK a EČV", r.homologEur + r.serviceFeeEur) : (
          <>
            {row(r.local ? "Prihlásenie na Slovensku" : "Homologizácia, STK, EČV", r.homologEur, r.local ? "kontrola originality, doklady, EČV" : undefined)}
            {row("Náš poplatok za sprostredkovanie", r.serviceFeeEur, r.feePct !== null ? `${+(r.feePct * 100).toFixed(1)} %` : "fixný")}
          </>
        )}
        {r.repairEur > 0 && row("Odhad opravy", r.repairEur)}
        {r.extraCosts?.map((x) => <div className="bd" key={x.label}><span>{x.label}</span><span>{eur(x.eur)}</span></div>)}
      </div>
      <div className="bd-group">
        {row("Spolu bez DPH", r.net)}
        {row("DPH 23 %", r.vatTotal, r.carNoVat ? "len z prepravy a služieb, cena auta je konečná" : !hideFee && !r.local ? `z toho dovozné DPH ${eur(r.importVat)}` : undefined)}
      </div>
      <div className="bd-total">
        <div>
          <small>{r.fixed ? "Spolu na slovenských značkách" : "Odhad spolu na slovenských značkách"} · {r.priceMode === "net" ? "bez DPH" : "s DPH"}</small>
          <b>{eur(r.total)}</b>
          <small>{r.priceMode === "net" ? `s DPH ${eur(r.gross)}` : `bez DPH ${eur(r.net)}`}</small>
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
        <p className="note">{r.local ? (r.carNoVat ? "Odhad. Auto z Európskej únie sa neclí, neprechádza colnicou a nehomologizuje sa. Pri jazdenom aute je cena konečná a DPH sa k nej nepripočíta, platí sa len z prepravy a našich služieb. Pri novom aute alebo aute s odpočtom DPH sa DPH platí na Slovensku." : "Odhad. Auto z Európskej únie sa neclí, neprechádza colnicou a nehomologizuje sa. Cena auta je bez DPH, DPH 23 % sa platí na Slovensku.") : "Odhad. Colná hodnota = auto + poplatky + doprava do EÚ. Ceny položiek sú bez DPH; DPH 23 % sa pripočíta k celej sume (pri dovoze sa platí na colnici). Nezahŕňa skryté poškodenia – odporúčame rezervu 10 – 15 %."}</p>
      )}
    </div>
  );
}
