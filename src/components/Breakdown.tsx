import type { CalcResult } from "@/lib/calc";
import { eur, usd } from "@/lib/format";

export function Breakdown({ r, skPrice, compact = false }: { r: CalcResult; skPrice?: number | null; compact?: boolean }) {
  const diff = skPrice ? skPrice - r.total : null;
  const row = (k: React.ReactNode, v: number, note?: string) => (
    <div className="bd"><span>{k}{note && <em>{note}</em>}</span><span>{eur(v)}</span></div>
  );
  return (
    <div>
      <div className="bd-group">
        <h4>V USA</h4>
        {row("Cena na aukcii", r.carEur, usd(r.bidUsd))}
        {row("Aukčné poplatky + broker", r.feeEur, "odhad")}
        {row("Odvoz do prístavu", r.inlandEur)}
        {row("Námorná preprava + poistenie", r.oceanEur)}
      </div>
      <div className="bd-group">
        <h4>Clo a dane</h4>
        {row(`Clo ${Math.round(r.dutyRate * 100)} %`, r.duty, "z colnej hodnoty")}
        {row("DPH 23 %", r.vat)}
      </div>
      <div className="bd-group">
        <h4>EÚ a Slovensko</h4>
        {row("Prístav, vykládka, colný deklarant", r.euPortEur)}
        {row("Kamión do SR", r.truckEur)}
        {row("Homologizácia, STK, EČV", r.homologEur)}
        {row("Náš poplatok za sprostredkovanie", r.serviceFeeEur, "fixný")}
        {r.repairEur > 0 && row("Odhad opravy", r.repairEur)}
        {r.extraCosts?.map((x) => <div className="bd" key={x.label}><span>{x.label}</span><span>{eur(x.eur)}</span></div>)}
      </div>
      <div className="bd-total">
        <div><small>Odhad celkovej ceny na SK značkách</small><b>{eur(r.total)}</b></div>
        <div className="cr"><small>Kredit RACEM</small><b>+{eur(r.credit)}</b></div>
      </div>
      {skPrice ? (
        <div className="bd-cmp">
          <div><small>Podobné auto na SK trhu</small><b>{eur(skPrice)}</b></div>
          <div className={diff! >= 0 ? "pos" : "neg"}><small>{diff! >= 0 ? "Ušetríte približne" : "Drahšie o"}</small><b>{eur(Math.abs(diff!))}</b></div>
        </div>
      ) : null}
      {!compact && (
        <p className="note">
          Odhad. Colná hodnota = auto + poplatky + doprava do EÚ. DPH sa počíta z colnej hodnoty, cla a dopravy v EÚ. Nezahŕňa skryté poškodenia – odporúčame rezervu 10 – 15 %.
        </p>
      )}
    </div>
  );
}
