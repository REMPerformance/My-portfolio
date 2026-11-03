import type { Metadata } from "next";
import { TrackLookup } from "@/components/track/TrackLookup";
import { TrackFeats } from "@/components/track/TrackPromo";

export const metadata: Metadata = {
  title: "Sledovanie dovozu auta podľa VIN",
  description: "Sledujte dovoz svojho auta krok za krokom: aktuálny stav, poloha lode, fotky z prístavu a odhad prevzatia. Stačí VIN a číslo zmluvy.",
  alternates: { canonical: "/sledovanie" },
  openGraph: { url: "/sledovanie" }
};

export default function TrackingPage() {
  return (
    <section className="trk-page">
      <div className="wrap">
        <TrackLookup />
        <TrackFeats />
      </div>
    </section>
  );
}
