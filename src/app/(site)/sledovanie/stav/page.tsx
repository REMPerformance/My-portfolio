import type { Metadata } from "next";
import { TrackStatusPage } from "@/components/track/TrackStatus";

export const metadata: Metadata = { title: "Stav objednávky", robots: { index: false, follow: false } };

export default function TrackingStatus() {
  return <section className="trk-page"><TrackStatusPage /></section>;
}
