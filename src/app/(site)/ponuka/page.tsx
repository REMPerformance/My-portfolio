import type { Metadata } from "next";
import Link from "next/link";
import { getCardCars } from "@/lib/data";
import { SITE } from "@/lib/site";
import { carFullName, carPhase } from "@/lib/format";
import { Suspense } from "react";
import { CarBrowser } from "@/components/CarBrowser";
import { CarGrid } from "@/components/CarGrid";
import { PageHead, breadcrumbLd } from "@/components/Sections";
import { JsonLd } from "@/components/JsonLd";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Ponuka áut z USA, Dubaja a Kanady – aukcie aj pevné ceny",
  description: "Aktuálna ponuka áut z USA, Dubaja (SAE), Kanady a Ázie – z aukcií Copart a IAAI aj za pevnú cenu. Pri každom aute celková cena na slovenských značkách vrátane dopravy, cla, DPH a homologizácie.",
  alternates: { canonical: "/ponuka" },
  openGraph: { url: "/ponuka", title: "Ponuka áut na dovoz | REM Performance" }
};

export default async function Ponuka() {
  const { cars } = await getCardCars();
  const serverNow = Date.now();
  const crumbs = [{ name: "Domov", path: "/" }, { name: "Ponuka áut", path: "/ponuka" }];
  const live = cars.filter((c) => carPhase(c, serverNow) !== "ended");
  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Ponuka áut na dovoz",
          numberOfItems: live.length,
          itemListElement: live.map((c, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE.url}/auta/${c.slug}`, name: carFullName(c) }))
        }}
      />
      <PageHead
        crumbs={crumbs}
        title={<>Autá v ponuke <span style={{ color: "var(--rc-text-dim)", fontSize: ".6em" }}>({live.length})</span></>}
        sub="Ručne vybrané autá z USA, Dubaja, Kanady a Ázie. Cena pri každom aute je celková suma na slovenských značkách – vrátane dopravy, cla, DPH a homologizácie."
      />
      <section style={{ paddingTop: 28 }}>
        <div className="wrap">
          <Suspense fallback={<CarGrid cars={live} serverNow={serverNow} showFilters={false} showEnded={false} />}>
            <CarBrowser cars={live} serverNow={serverNow} />
          </Suspense>
          <p className="more">Nevidíte svoje auto? <Link href="/auto-na-mieru">Napíšte nám, čo hľadáte</Link> a nájdeme ho za Vás.</p>
        </div>
      </section>
    </>
  );
}
