"use client";
import Link from "next/link";
import type { Car } from "@/lib/types";
import type { CalcResult } from "@/lib/calc";
import { isFixed } from "@/lib/calc";
import { carPhase, eur, km } from "@/lib/format";
import { countryDef, placeName } from "@/lib/origins";
import { CarImage } from "./CarImage";
import { useNow } from "./Countdown";

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

export function CarCard({ car, priority = false, serverNow }: { car: CardCar; priority?: boolean; serverNow: number }) {
  const now = useNow(30000);
  const t = now ?? serverNow;
  const phase = carPhase(car, t);
  const fixed = isFixed(car);
  const closeAt = car.order_close_at || car.auction_end_at;
  const left = closeAt ? shortLeft(Date.parse(closeAt) - t) : null;
  const soon = closeAt ? Date.parse(closeAt) - t < 864e5 : false;
  const cd = countryDef(car.country);
  const where = [placeName(car.country, car.state) || car.location, cd.code !== "US" ? cd.name : null].filter(Boolean).join(", ");

  let when: { l: string; v: string; cls: string };
  if (phase === "ended") when = { l: fixed ? "Ponuka" : "Aukcia", v: car.status === "sold" ? "Predané" : "Skončila", cls: "" };
  else if (phase === "closed") when = { l: "Objednávky", v: "Uzavreté", cls: "" };
  else if (fixed && !closeAt) when = { l: "Pevná cena", v: "Dostupné", cls: "ok" };
  else when = { l: fixed ? "Platí ešte" : "Objednať do", v: left ?? "…", cls: soon ? "soon" : "" };

  return (
    <article className={`car${phase === "ended" ? " is-ended" : ""}`}>
      <Link href={`/auta/${car.slug}`} aria-label={`${car.year} ${car.make} ${car.model} ${car.trim ?? ""} – detail`} style={{ display: "contents" }}>
        <div className="car__img">
          <CarImage car={car} eager={priority} />
          <div className="car__tags">
            {car.is_demo && <span className="tag tag--warn">Ukážka</span>}
            <span className="tag tag--dark">{cd.flag} {fixed ? "Pevná cena" : car.auction || "Aukcia"}</span>
          </div>
        </div>
        <div className="car__body">
          <h3 className="car__title">
            {car.year} {car.make} {car.model}
            <small>{[car.trim, where].filter(Boolean).join(" · ")}</small>
          </h3>
          <div className="car__meta">
            <span>{km(car.odometer_mi)}</span>
            {car.fuel && <span>{car.fuel}</span>}
            {car.primary_damage && <span>{car.primary_damage}</span>}
          </div>
          <div className="car__price">
            <div><small>Spolu na SK značkách</small><b>{eur(car.est.total)}</b></div>
            <div className={`car__when ${when.cls}`}>{when.l}<b>{when.v}</b></div>
          </div>
        </div>
      </Link>
    </article>
  );
}
