"use client";
import Link from "next/link";
import type { Car } from "@/lib/types";
import type { CalcResult } from "@/lib/calc";
import { carPhase, eur, km, usd, fmtDateTime } from "@/lib/format";
import { isFixed } from "@/lib/calc";
import { CarImage } from "./CarImage";
import { fmtLeft, useNow } from "./Countdown";

export type CardCar = Car & { est: CalcResult };

function Tag({ children, cls = "" }: { children: React.ReactNode; cls?: string }) {
  return <span className={`tag ${cls}`}><span>{children}</span></span>;
}

export function CarCard({ car, priority = false, serverNow }: { car: CardCar; priority?: boolean; serverNow: number }) {
  const now = useNow();
  const phase = carPhase(car, now ?? serverNow);
  const closeAt = car.order_close_at || car.auction_end_at;
  const left = now && closeAt ? fmtLeft(Date.parse(closeAt) - now) : null;
  const soon = now && closeAt ? Date.parse(closeAt) - now < 864e5 : false;
  const saving = car.sk_price_eur ? car.sk_price_eur - car.est.total : 0;
  const clean = (car.title_type || "").toLowerCase() === "clean";

  const fixed = isFixed(car);
  let label = fixed ? (closeAt ? "Ponuka platí" : "Stav") : "Objednávky do";
  let value: string = fixed && !closeAt ? "Dostupné" : left ?? fmtDateTime(closeAt);
  let cls = soon ? "soon" : fixed && !closeAt ? "avail" : "";
  if (phase === "closed") { label = "Objednávky"; value = "Uzavreté"; cls = "closed"; }
  if (phase === "ended") { label = fixed ? "Ponuka" : "Aukcia"; value = car.status === "sold" ? "Predané" : fixed ? "Skončila" : "Skončená"; cls = "ended"; }

  return (
    <article className={`car${phase === "ended" ? " is-ended" : ""}`}>
      <Link href={`/auta/${car.slug}`} aria-label={`${car.year} ${car.make} ${car.model} ${car.trim ?? ""} – detail`} style={{ display: "contents" }}>
        <div className="car__img">
          <CarImage car={car} eager={priority} />
          <div className="car__tags">
            {car.is_demo && <Tag cls="tag--warn">Ukážka</Tag>}
            {fixed && <Tag cls="tag--fixed">Pevná cena</Tag>}
            {car.auction && <Tag cls="tag--dark">{car.auction}</Tag>}
            {car.title_type && <Tag cls={clean ? "tag--ok" : "tag--sal"}>{car.title_type}</Tag>}
          </div>
          <div className={`timer ${cls}`}><span>{label}</span><span className="t">{value}</span></div>
        </div>
        <div className="car__body">
          <h3 className="car__title">
            {car.year} {car.make} {car.model}
            <small>{[car.trim, car.location].filter(Boolean).join(" · ")}</small>
          </h3>
          <ul className="specs">
            <li>{km(car.odometer_mi)}</li>
            {car.engine && <li>{car.engine}</li>}
            {car.drive && <li>{car.drive}</li>}
          </ul>
          {car.primary_damage && <div className="damage"><b>Poškodenie:</b> {car.primary_damage}</div>}
          <div className="prices">
            {fixed ? (
              <div><small>Cena auta</small><b>{usd(car.price_usd || 0)}</b></div>
            ) : (
              <div><small>Aktuálna ponuka</small><b>{usd(car.current_bid_usd || 0)}</b></div>
            )}
            <div className="hi"><small>{fixed ? "Spolu s dovozom" : "Odhad na SK značkách"}</small><b>{eur(car.est.total)}</b></div>
          </div>
          <div className="car__foot">
            <span>{saving > 0 ? <><span className="save">≈ {eur(saving)}</span> pod cenou na SK</> : car.leads_count > 0 ? `${car.leads_count} záujemcov` : " "}</span>
            <span className="go">Detail →</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
