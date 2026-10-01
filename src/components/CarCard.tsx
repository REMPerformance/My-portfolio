"use client";
import Link from "next/link";
import { Flag } from "./Flag";
import type { Car } from "@/lib/types";
import type { CalcResult } from "@/lib/calc";
import { isFixed } from "@/lib/calc";
import { carPhase, eur, num } from "@/lib/format";
import { countryDef, placeName } from "@/lib/origins";
import { CarImage } from "./CarImage";
import { useNow } from "./Countdown";
import { SpecIcon } from "./Icons";

export type CardCar = Car & { est: CalcResult };

/** „2 dni“, „5 h 12 min“, „12 min“ – krátky odpočet pre kartu. */
export function shortLeft(ms: number) {
  if (ms <= 0) return null;
  const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5), m = Math.floor((ms % 36e5) / 6e4);
  if (d >= 2) return `${d} dni`;
  if (d === 1) return `1 deň ${h} h`;
  if (h) return `${h} h ${m} min`;
  return `${m} min`;
}

const shortGear = (t: string | null) => (!t ? "—" : /auto/i.test(t) ? "Automat" : /manu/i.test(t) ? "Manuál" : t.split(" ")[0]);

export function CarCard({ car, priority = false, serverNow }: { car: CardCar; priority?: boolean; serverNow: number }) {
  const now = useNow(30000);
  const t = now ?? serverNow;
  const phase = carPhase(car, t);
  const fixed = isFixed(car);
  const closeAt = car.order_close_at || car.auction_end_at;
  const left = closeAt ? shortLeft(Date.parse(closeAt) - t) : null;
  const soon = closeAt ? Date.parse(closeAt) - t < 864e5 : false;
  const cd = countryDef(car.country);
  const where = [placeName(car.country, car.state) || car.location?.split(",")[0], cd.name].filter(Boolean).join(", ");
  const km = car.odometer_mi ? `${num(car.odometer_mi * 1.609344)} km` : "—";

  let status: React.ReactNode;
  const endedLabel = car.status === "sold" ? "Predané" : "Predaj skončil";
  if (phase === "ended") status = <span className="muted"><SpecIcon k="check" />{endedLabel}</span>;
  else if (phase === "closed") status = <span className="muted"><SpecIcon k="clock" />Objednávky uzavreté</span>;
  else if (fixed && !closeAt) status = <span className="ok"><SpecIcon k="check" />Na predaj</span>;
  else status = <span className={soon ? "soon" : "ok"}><SpecIcon k="clock" />{fixed ? "Platí ešte" : "Objednať do"} {left ?? "…"}</span>;

  return (
    <article className={`car${phase === "ended" ? " is-ended" : ""}`}>
      <Link href={`/auta/${car.slug}`} aria-label={`${car.year} ${car.make} ${car.model} ${car.trim ?? ""} – detail`} style={{ display: "contents" }}>
        <div className="car__img">
          <CarImage car={car} eager={priority} />
          {phase === "ended" && <span className="car__ended">{endedLabel}</span>}
          <div className="car__tags">
            {car.is_demo && <span className="tag tag--warn">Ukážka</span>}
            <span className="tag tag--dark"><Flag code={car.country} />{fixed ? "Pevná cena" : car.auction || "Aukcia"}</span>
          </div>
        </div>
        <div className="car__body">
          <div className="car__status">
            {status}
            <span className="muted"><SpecIcon k="pin" />{where}</span>
          </div>
          <h3 className="car__title">
            {car.year} {car.make} {car.model}
            {car.trim && <small>{car.trim}</small>}
          </h3>
          <div className="car__price">
            <b>{phase === "ended" ? <s>{eur(car.est.total)}</s> : eur(car.est.total)} <i>{car.est.priceMode === "net" ? "bez DPH" : "s DPH"}</i></b>
            <small>{car.est.priceMode === "net" ? `s DPH ${eur(car.est.gross)}` : `bez DPH ${eur(car.est.net)}`} · s dovozom na slovenských značkách</small>
          </div>
          <div className="car__specs">
            <div><SpecIcon k="year" /><span>{car.year ?? "—"}</span></div>
            <div><SpecIcon k="km" /><span>{km}</span></div>
            <div><SpecIcon k="gear" /><span>{shortGear(car.transmission)}</span></div>
            <div><SpecIcon k="fuel" /><span>{car.fuel || "—"}</span></div>
          </div>
        </div>
      </Link>
    </article>
  );
}
