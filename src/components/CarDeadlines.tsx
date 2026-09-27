"use client";
import Link from "next/link";
import type { Car } from "@/lib/types";
import { carPhase, fmtDateTime } from "@/lib/format";
import { fmtLeft, useNow } from "./Countdown";
import { LeadForm } from "./LeadForm";

export function CarDeadlines({ car, serverNow }: { car: Car; serverNow: number }) {
  const now = useNow();
  const t = now ?? serverNow;
  const phase = carPhase(car, t);
  const closeAt = car.order_close_at || car.auction_end_at;
  const left = (iso: string | null) => (iso && now ? fmtLeft(Date.parse(iso) - now) : null);
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
        <a href="#objednat" className="rc-btn rc-btn--primary rc-btn--block" style={{ padding: 18 }}>Mám záujem o toto auto</a>
      ) : (
        <Link href="/kontakt" className="rc-btn rc-btn--primary rc-btn--block" style={{ padding: 18 }}>Nájdite mi podobné auto</Link>
      )}
    </>
  );
}

export function CarOrder({ car, serverNow, suggestedBudget }: { car: Car; serverNow: number; suggestedBudget: number }) {
  const now = useNow();
  const phase = carPhase(car, now ?? serverNow);
  const label = [car.year, car.make, car.model, car.trim].filter(Boolean).join(" ") + (car.lot ? ` (${car.auction} lot ${car.lot})` : "");
  return <LeadForm car={{ id: car.id, label }} closed={phase !== "open"} suggestedBudget={suggestedBudget} heading="Objednať toto auto" />;
}
