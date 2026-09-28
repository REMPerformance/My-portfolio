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
  title: "Autá z USA – aukcie Copart, IAAI a autá za pevnú cenu",
  description: "Aktuálna ponuka áut z USA – z aukcií Copart a IAAI aj za pevnú cenu od predajcov. Pri každom aute celková cena na slovenských značkách vrátane cla, DPH, dopravy a homologizácie.",
  alternates: { canonical: "/ponuka" },
  openGraph: { url: "/ponuka", title: "Autá z USA na predaj | REM Performance" }
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
          name: "Autá z USA na predaj",
          numberOfItems: live.length,
          itemListElement: live.map((c, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE.url}/auta/${c.slug}`, name: carFullName(c) }))
        }}
      />
      <PageHead
        crumbs={crumbs}
        title={<>Autá z USA <em>na predaj</em></>}
        sub="Ručne vybrané autá z aukcií Copart a IAAI aj autá za pevnú cenu od predajcov v USA. Pri každom aute vidíte celkovú cenu s dovozom na slovenské značky, rozsah poškodenia a dokedy ponuka platí."
      />
      <section style={{ paddingTop: 40 }}>
        <div className="wrap">
          <Suspense fallback={<CarGrid cars={cars} serverNow={serverNow} showFilters={false} />}>
            <CarBrowser cars={cars} serverNow={serverNow} />
          </Suspense>
          <p className="more">Nevidíte svoje auto? <Link href="/kontakt">Napíšte nám, čo hľadáte</Link> a nájdeme ho za Vás.</p>
        </div>
      </section>
    </>
  );
}
