import Link from "next/link";
import { IArrow } from "@/components/Icons";

const FEATS = [
  { t: "Stav krok po kroku", d: "Od podpisu zmluvy cez kúpu, prístav a loď až po prihlásenie vozidla." },
  { t: "Poloha lode na mape", d: "Vidíte, kde sa loď s Vaším autom nachádza a kedy pripláva." },
  { t: "Fotky z cesty", d: "Náš agent v prístave vozidlo skontroluje a nafotí, fotky pridávame aj počas prepravy." },
  { t: "Správa na e-mail", d: "Pri každej novej udalosti Vám pošleme krátku správu s odkazom na sledovanie." }
];

export function TrackFeats() {
  return (
    <div className="trk-feats">
      {FEATS.map((f, i) => (
        <div className="trk-feat" key={f.t}><span className="no">{String(i + 1).padStart(2, "0")}</span><h2>{f.t}</h2><p>{f.d}</p></div>
      ))}
    </div>
  );
}

/** Informácia o službe sledovania na hlavnej stránke a v postupe. */
export function TrackPromo() {
  return (
    <section aria-labelledby="sled-h" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="trk-promo">
          <div>
            <span className="eyebrow">Sledovanie dovozu</span>
            <h2 className="title" id="sled-h">Vaše auto vidíte <em>celú cestu</em></h2>
            <p className="sub">Každý zákazník dostane prístup k sledovaniu objednávky. Po zadaní VIN a čísla zmluvy uvidí aktuálny stav, polohu lode, fotky z prístavu a odhad prevzatia. O každej zmene ho informujeme e-mailom.</p>
            <Link href="/sledovanie" className="rc-btn rc-btn--primary">Sledovať objednávku <IArrow /></Link>
          </div>
          <TrackFeats />
        </div>
      </div>
    </section>
  );
}
