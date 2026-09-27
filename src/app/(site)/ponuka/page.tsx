import type { Metadata } from "next";
import Link from "next/link";
import { getCardCars } from "@/lib/data";
import { SITE } from "@/lib/site";
import { carFullName, carPhase } from "@/lib/format";
import { CarGrid } from "@/components/CarGrid";
import { PageHead, breadcrumbLd } from "@/components/Sections";
import { JsonLd } from "@/components/JsonLd";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Autá z USA v aukcii – aktuálna ponuka Copart a IAAI",
  description: "Aktuálna ponuka áut z amerických aukcií Copart a IAAI s odhadom celkovej ceny na slovenských značkách vrátane cla, DPH, dopravy a homologizácie. Objednávky do uzávierky.",
  alternates: { canonical: "/ponuka" },
  openGraph: { url: "/ponuka", title: "Autá z USA v aukcii | REM Performance" }
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
          name: "Autá z USA v aukcii",
          numberOfItems: live.length,
          itemListElement: live.map((c, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE.url}/auta/${c.slug}`, name: carFullName(c) }))
        }}
      />
      <PageHead
        crumbs={crumbs}
        title={<>Autá z USA <em>v aukcii</em></>}
        sub="Ručne vybrané autá z aukcií Copart a IAAI. Pri každom aute vidíte odhad celkovej ceny na slovenských značkách, rozsah poškodenia a termín uzávierky objednávok."
      />
      <section style={{ paddingTop: 40 }}>
        <div className="wrap">
          <CarGrid cars={cars} serverNow={serverNow} />
          <p className="more">Nevidíte svoje auto? <Link href="/kontakt">Napíšte nám, čo hľadáte</Link> a nájdeme ho na aukcii za Vás.</p>
        </div>
      </section>
    </>
  );
}
