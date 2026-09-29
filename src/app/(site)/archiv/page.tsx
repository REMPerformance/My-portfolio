import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getCardCars } from "@/lib/data";
import { carPhase } from "@/lib/format";
import { CarBrowser } from "@/components/CarBrowser";
import { PageHead, breadcrumbLd } from "@/components/Sections";
import { JsonLd } from "@/components/JsonLd";
import { IArrow } from "@/components/Icons";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Archív – skončené a predané autá z dovozu",
  description: "Prehľad áut, ktoré sme mali v ponuke – skončené aukcie, predané autá a ponuky, ktorým vypršala platnosť. Podobné auto Vám radi nájdeme znova.",
  alternates: { canonical: "/archiv" },
  openGraph: { url: "/archiv", title: "Archív áut | REM Performance" }
};

export default async function Archiv() {
  const { cars } = await getCardCars();
  const serverNow = Date.now();
  const ended = cars.filter((c) => carPhase(c, serverNow) === "ended");
  const crumbs = [{ name: "Domov", path: "/" }, { name: "Ponuka áut", path: "/ponuka" }, { name: "Archív", path: "/archiv" }];
  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      <PageHead
        crumbs={crumbs}
        title={<>Archív áut <span style={{ color: "var(--rc-text-dim)", fontSize: ".6em" }}>({ended.length})</span></>}
        sub="Autá, ktoré sme mali v ponuke – skončené aukcie, predané autá a ponuky, ktorým vypršala platnosť. Páči sa Vám niektoré? Podobné Vám nájdeme znova."
      />
      <section style={{ paddingTop: 28 }}>
        <div className="wrap">
          <div className="arch-note">
            <Link href="/ponuka" className="rc-btn rc-btn--dark rc-btn--sm">Aktuálna ponuka <IArrow /></Link>
            <Link href="/kontakt" className="rc-btn rc-btn--ghost rc-btn--sm">Chcem podobné auto</Link>
          </div>
          {ended.length ? (
            <Suspense fallback={null}>
              <CarBrowser cars={ended} serverNow={serverNow} mode="archive" />
            </Suspense>
          ) : (
            <div className="empty">Archív je zatiaľ prázdny. Sem sa automaticky presúvajú autá po skončení aukcie alebo po vypršaní ponuky.</div>
          )}
        </div>
      </section>
    </>
  );
}
