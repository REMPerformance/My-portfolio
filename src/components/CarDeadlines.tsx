"use client";
import Link from "next/link";
import type { Car } from "@/lib/types";
import { carPhase, fmtDateTime } from "@/lib/format";
import { isFixed } from "@/lib/calc";
import { fmtLeft, useNow } from "./Countdown";
import { LeadForm } from "./LeadForm";

export function CarDeadlines({ car, serverNow }: { car: Car; serverNow: number }) {
  const now = useNow();
  const t = now ?? serverNow;
  const phase = carPhase(car, t);
  const closeAt = car.order_close_at || car.auction_end_at;
  const left = (iso: string | null) => (iso && now ? fmtLeft(Date.parse(iso) - now) : null);
  if (isFixed(car)) {
    const until = car.order_close_at;
    return (
      <>
        <div className="deadline">
          <div className={`main${until ? "" : " avail"}`}>
            <div><small>Ponuka platí do</small><span className="d">{until ? fmtDateTime(until) : "do predaja"}</span></div>
            <b>{phase === "ended" ? (car.status === "sold" ? "Predané" : "Skončila") : until ? left(until) ?? "…" : "Dostupné"}</b>
          </div>
        </div>
        {phase === "ended" && <div className="state ended">{car.status === "sold" ? "Toto auto je už predané." : "Ponuka na toto auto skončila."} Radi Vám nájdeme podobné.</div>}
        {phase === "open" ? (
          <a href="#objednat" className="rc-btn rc-btn--primary rc-btn--block" style={{ padding: 14 }}>Chcem toto auto</a>
        ) : (
          <Link href="/auto-na-mieru" className="rc-btn rc-btn--primary rc-btn--block" style={{ padding: 14 }}>Nájdite mi podobné auto</Link>
        )}
      </>
    );
  }
  return (
    <>
      <div className="deadline">
        <div className="main">
          <div><small>Uzávierka objednávok</small><span className="d">{fmtDateTime(closeAt)}</span></div>
          <b>{phase === "open" ? left(closeAt) ?? "…" : "Uzavreté"}</b>
        </div>
        <div>
          <div><small>Koniec aukcie</small><span className="d">{fmtDateTime(car.auction_end_at)}</span></div>
          <b>{phase === "ended" ? (car.status === "sold" ? "Predané" : "Skončená") : left(car.auction_end_at) ?? "…"}</b>
        </div>
      </div>
      {phase === "closed" && <div className="state closed">Objednávky na toto auto sú uzavreté. Aukcia ešte prebieha.</div>}
      {phase === "ended" && <div className="state ended">Aukcia skončila. Radi Vám nájdeme podobné auto.</div>}
      {phase === "open" ? (
        <a href="#objednat" className="rc-btn rc-btn--primary rc-btn--block" style={{ padding: 14 }}>Mám záujem o toto auto</a>
      ) : (
        <Link href="/auto-na-mieru" className="rc-btn rc-btn--primary rc-btn--block" style={{ padding: 14 }}>Nájdite mi podobné auto</Link>
      )}
    </>
  );
}

export function CarOrder({ car, serverNow, suggestedBudget }: { car: Car; serverNow: number; suggestedBudget: number }) {
  const now = useNow();
  const phase = carPhase(car, now ?? serverNow);
  const label = [car.year, car.make, car.model, car.trim].filter(Boolean).join(" ");
  const adminLabel = label + (isFixed(car) ? ` (pevná cena${car.auction ? `, ${car.auction}` : ""})` : car.lot ? ` (${car.auction} lot ${car.lot})` : "");
  return <LeadForm car={{ id: car.id, label: adminLabel, url: `https://remperformance.sk/auta/${car.slug}` }} closed={phase !== "open"} suggestedBudget={suggestedBudget} />;
}
