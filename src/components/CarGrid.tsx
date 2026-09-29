"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { CarCard, type CardCar } from "./CarCard";
import { carPhase } from "@/lib/format";
import { useNow } from "./Countdown";

const FILTERS = [
  { f: "all", label: "Všetko" },
  { f: "car", label: "Osobné" },
  { f: "suv", label: "SUV" },
  { f: "truck", label: "Pickupy" }
];

export function CarGrid({ cars, serverNow, showFilters = true, showEnded = true, limit }: { cars: CardCar[]; serverNow: number; showFilters?: boolean; showEnded?: boolean; limit?: number }) {
  const [filter, setFilter] = useState("all");
  const now = useNow(15000);
  const t = now ?? serverNow;
  const { live, ended } = useMemo(() => {
    const list = cars.filter((c) => filter === "all" || c.type === filter);
    const live = list.filter((c) => carPhase(c, t) !== "ended");
    const ended = list.filter((c) => carPhase(c, t) === "ended");
    return { live: limit ? live.slice(0, limit) : live, ended };
  }, [cars, filter, t, limit]);

  return (
    <>
      {showFilters && (
        <div className="filters" role="group" aria-label="Filter typu vozidla" style={{ marginBottom: 20 }}>
          {FILTERS.map((x) => (
            <button key={x.f} className={`chip${filter === x.f ? " active" : ""}`} aria-pressed={filter === x.f} onClick={() => setFilter(x.f)}>
              {x.label}
            </button>
          ))}
        </div>
      )}
      <div className="grid">
        {live.length ? (
          live.map((c, i) => <CarCard key={c.id} car={c} priority={i < 3} serverNow={serverNow} />)
        ) : (
          <div className="empty">
            V tejto kategórii práve nemáme žiadne auto v ponuke. <Link href="/auto-na-mieru">Napíšte nám, aké auto hľadáte</Link> a nájdeme ho za Vás.
          </div>
        )}
      </div>
      {showEnded && ended.length > 0 && (
        <>
          <h2 className="ended-head">Skončené ponuky</h2>
          <div className="grid">{ended.map((c) => <CarCard key={c.id} car={c} serverNow={serverNow} />)}</div>
        </>
      )}
    </>
  );
}
