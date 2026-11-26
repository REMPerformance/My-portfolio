import type { Metadata } from "next";
import Link from "next/link";
import { getKrStock, krRow, KR_PART } from "@/lib/krStockData";
import { SITE } from "@/lib/site";
import { KrStockBrowser } from "@/components/KrStockBrowser";
import { PageHead, breadcrumbLd } from "@/components/Sections";
import { JsonLd } from "@/components/JsonLd";
import { QuickRequest } from "@/components/QuickRequest";

// ponuka sa pripravuje vopred a obnovuje každé 3 hodiny (rovnako ako KR_REVALIDATE)
export const revalidate = 10800;
// prvé stiahnutie celého skladu zo SSANCAR môže trvať dlhšie
export const maxDuration = 300;

export const metadata: Metadata = {
  title: "Ihneď k odberu z Kórey: autá skladom u predajcov",
  description: "Jazdené autá skladom u overených predajcov v Južnej Kórei. Kia, Hyundai, Genesis a ďalšie, bez dražby. Pri každom aute orientačná cena so slovenskými značkami vrátane dopravy, cla, DPH a schválenia.",
  alternates: { canonical: "/ihned-z-korey" },
  openGraph: { url: "/ihned-z-korey", title: "Ihneď k odberu z Kórey | REM Performance" }
};

export default async function KrStockPage() {
  const cars = await getKrStock();
  const crumbs = [{ name: "Domov", path: "/" }, { name: "Ihneď k odberu z Kórey", path: "/ihned-z-korey" }];
  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      {cars.length > 0 && (
        <JsonLd data={{
          "@context": "https://schema.org", "@type": "ItemList", name: "Ihneď k odberu z Kórey", numberOfItems: cars.length,
          itemListElement: cars.slice(0, 100).map((c, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE.url}/ihned-z-korey/${encodeURIComponent(c.id)}`, name: [c.year, c.make, c.model, c.trim].filter(Boolean).join(" ") }))
        }} />
      )}
      <PageHead
        crumbs={crumbs}
        title={<>Ihneď k odberu z Kórey {cars.length > 0 && <span style={{ color: "var(--rc-text-dim)", fontSize: ".6em" }}>({cars.length.toLocaleString("sk-SK")})</span>}</>}
        sub="Autá skladom u overených predajcov v Južnej Kórei, bez dražby a bez čakania na aukciu. Cena pri každom aute je orientačná suma so slovenskými značkami vrátane dopravy, cla, DPH, schválenia a prihlásenia."
      />
      <section style={{ paddingTop: 28 }}>
        <div className="wrap">
          {cars.length ? <KrStockBrowser initial={cars.slice(0, 48).map(krRow)} total={cars.length} parts={Math.ceil(cars.length / KR_PART)} /> : (
            <div className="empty">Ponuku áut z Kórey práve aktualizujeme. <Link href="/auto-na-mieru">Napíšte nám, aké auto hľadáte</Link>, a pošleme Vám aktuálne autá skladom.</div>
          )}
          <div className="kr-info">
            <div><b>Ako to funguje</b><span>Vyberiete auto, my overíme jeho dostupnosť a stav u predajcu a pošleme Vám presnú ponuku so zmluvou. Po podpise auto skontroluje náš agent na mieste, pripraví vývoz a auto ide loďou do Európy.</span></div>
            <div><b>Čo je v cene</b><span>Kúpa auta, kontrola a vývozná dokumentácia, námorná preprava (bez poistenia), clo 10 %, DPH pri dovoze, prístav, preprava na Slovensko, schválenie, prihlásenie a EČV.</span></div>
            <div><b>Cena je odhad</b><span>Orientačná cena sa prepočítava podľa aktuálneho kurzu. Konečnú sumu potvrdíme v ponuke, môže byť nižšia aj vyššia. Predajca môže auto medzitým predať.</span></div>
          </div>
          <p className="more">Nevidíte svoje auto? <Link href="/auto-na-mieru">Napíšte nám, čo hľadáte</Link>, alebo pozrite <Link href="/ponuka">ďalšie autá v ponuke</Link>.</p>
        </div>
      </section>
      <section className="hla-sec" aria-label="Rýchly dopyt"><div className="wrap"><QuickRequest /></div></section>
    </>
  );
}
