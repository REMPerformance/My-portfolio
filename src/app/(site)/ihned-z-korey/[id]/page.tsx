import { Fragment } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getKrCar, krName } from "@/lib/krStockData";
import { eur, num } from "@/lib/format";
import { SITE } from "@/lib/site";
import type { Car } from "@/lib/types";
import { Gallery } from "@/components/Gallery";
import { Flag } from "@/components/Flag";
import { SpecIcon } from "@/components/Icons";
import { LeadForm } from "@/components/LeadForm";
import { Crumbs, breadcrumbLd } from "@/components/Sections";
import { JsonLd } from "@/components/JsonLd";

// Detail sa vyrába pri návšteve a neukladá sa do ISR cache (tisíce áut × obnova každú hodinu míňali limit ISR zápisov na Verceli)
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };
const fullName = (c: { year: number | null; make: string; model: string; trim: string | null }) => [c.year, c.make, c.model, c.trim].filter(Boolean).join(" ");
const regDate = (v: string | null) => { const m = (v || "").match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/); return m ? [m[3] ? `${+m[3]}.` : "", `${+m[2]}.`, m[1]].filter(Boolean).join(" ") : "—"; };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const car = await getKrCar(decodeURIComponent(id));
  if (!car) return { title: "Auto už nie je v ponuke", robots: { index: false } };
  const title = `${krName(car)} z Kórey za ${eur(car.price)} so SK značkami`;
  const description = `${fullName(car)}${car.km ? `, ${num(car.km)} km` : ""}${car.fuel ? `, ${car.fuel.toLowerCase()}` : ""}. Skladom u predajcu v Južnej Kórei. Orientačná cena ${eur(car.price)} vrátane dopravy, cla, DPH, schválenia a prihlásenia na Slovensku.`;
  const path = `/ihned-z-korey/${encodeURIComponent(car.id)}`;
  return {
    title: { absolute: `${title} | REM` }, description,
    alternates: { canonical: path },
    openGraph: { type: "website", url: path, title, description, images: car.photos[0] ? [{ url: car.photos[0], alt: fullName(car) }] : undefined }
  };
}

export default async function KrCarPage({ params }: Props) {
  const { id } = await params;
  const car = await getKrCar(decodeURIComponent(id));
  if (!car) notFound();
  const path = `/ihned-z-korey/${encodeURIComponent(car.id)}`;
  const url = `${SITE.url}${path}`;
  const crumbs = [{ name: "Domov", path: "/" }, { name: "Ihneď k odberu z Kórey", path: "/ihned-z-korey" }, { name: krName(car), path }];
  // Gallery pracuje s autom z databázy, stačia mu fotky a názov
  const gcar = { id: car.id, make: car.make, model: car.model, year: car.year, images: car.photos } as unknown as Car;
  const wa = (t: string) => `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(`${t} ${fullName(car)} – ${url}`)}`;

  const facts: [Parameters<typeof SpecIcon>[0]["k"], string, React.ReactNode][] = [
    ["year", "Rok výroby", car.year ?? "—"],
    ["km", "Najazdené", car.km ? `${num(car.km)} km` : "—"],
    ["fuel", "Palivo", car.fuel || "—"],
    ["gear", "Prevodovka", car.gear || "—"],
    ["engine", "Motor", car.cc ? `${(car.cc / 1000).toFixed(1)} (${num(car.cc)} cm³)` : car.fuel === "Elektro" ? "Elektro" : "—"],
    ["drive", "Pohon", car.drive || "—"],
    ["color", "Farba", car.color || "—"]
  ];
  const rows: [string, React.ReactNode][] = [
    ["Pôvod", <span key="o" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Flag code="KR" />{car.region ? `${car.region}, ` : ""}Južná Kórea</span>],
    ["Karoséria", car.body || "—"],
    ["Počet miest", car.seats || "—"],
    ["Prvá registrácia", regDate(car.firstReg)],
    ["Predaj", "Skladom u predajcu, bez dražby"]
  ];

  const ld = {
    "@context": "https://schema.org", "@type": "Car", name: fullName(car), url, image: car.photos.length ? car.photos.slice(0, 10) : [SITE.ogImage],
    brand: { "@type": "Brand", name: car.make }, model: car.model, vehicleModelDate: car.year ? String(car.year) : undefined,
    mileageFromOdometer: car.km ? { "@type": "QuantitativeValue", value: car.km, unitCode: "KMT" } : undefined,
    fuelType: car.fuel || undefined, vehicleTransmission: car.gear || undefined, color: car.color || undefined, itemCondition: "https://schema.org/UsedCondition",
    offers: { "@type": "Offer", url, priceCurrency: "EUR", price: car.price, availability: "https://schema.org/InStock", seller: { "@id": `${SITE.url}/#org` }, areaServed: "SK", description: "Orientačná cena auta so slovenskými značkami vrátane dopravy, cla, DPH, schválenia a prihlásenia." }
  };

  return (
    <>
      <JsonLd data={ld} />
      <JsonLd data={breadcrumbLd(crumbs)} />
      <section style={{ paddingTop: 22 }}>
        <div className="wrap">
          <Crumbs items={crumbs} />
          <div className="dhead">
            <h1 className="ctitle">{krName(car)} {car.trim && <span>{car.trim}</span>}</h1>
            <div className="dbadges">
              <span className="ok"><SpecIcon k="check" />Ihneď k odberu</span>
              <span><SpecIcon k="pin" />{car.region ? `${car.region}, ` : ""}Južná Kórea</span>
              <span><SpecIcon k="ship" />Dovoz na kľúč s EČV</span>
            </div>
          </div>
          <div className="detail">
            <div className="detail__main">
              <Gallery car={gcar}>
                <span className="car__flag car__flag--lg" title="Pôvod: Južná Kórea"><Flag code="KR" /></span>
                <div className="car__tags"><span className="tag tag--good">Ihneď k odberu</span></div>
              </Gallery>
              <div className="block"><div className="facts">{facts.map(([ic, k, v]) => <div key={k}><SpecIcon k={ic} /><span><small>{k}</small><b>{v}</b></span></div>)}</div></div>
              <div className="block cards2">
                <div className="panel"><h3>Detail</h3><dl className="kvlist">{rows.map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>)}</dl></div>
                <div className="panel"><h3>V cene je zahrnuté</h3><ul className="ticks">{car.included.map((x) => <li key={x}>{x}</li>)}</ul></div>
              </div>
              {car.options.length > 0 && (
                <div className="block"><h2>Výbava</h2><div className="panel"><ul className="equip">{car.options.map((e) => <li key={e}>{e}</li>)}</ul></div></div>
              )}
              <div className="block">
                <h2>Stav auta</h2>
                <p className="prose">Auto je v ponuke predajcu v Južnej Kórei. Pred podpisom zmluvy overíme jeho dostupnosť, históriu v kórejskom poistnom registri a technickú prehliadku. Po podpise auto na mieste skontroluje náš agent a pripraví vývozné doklady.</p>
              </div>
            </div>
            <aside className="detail__side" aria-label="Cena a objednávka">
              <div className="panel pricebox">
                <small className="note" style={{ margin: 0 }}>Orientačná cena so slovenskými značkami</small>
                <div className="kr-price">{eur(car.price)}</div>
                <p className="note">Vrátane dopravy, cla, DPH, schválenia a prihlásenia. Cena je odhad podľa aktuálneho kurzu, konečnú sumu potvrdíme v ponuke.</p>
                <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                  <a className="rc-btn rc-btn--primary rc-btn--block" href="#objednat">Mám záujem</a>
                  <a className="rc-btn rc-btn--outline rc-btn--block" href={wa("Dobrý deň, mám otázku k")} target="_blank" rel="noopener">Chcem viac info</a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <div className="mbar" aria-label="Cena a kontakt">
        <div className="mbar__price"><small>Orientačná cena</small><b>{eur(car.price)}</b></div>
        <a className="rc-btn rc-btn--primary mbar__cta" href="#objednat">Mám záujem</a>
      </div>

      <section className="alt" id="objednat" aria-label="Objednávka">
        <div className="wrap contact">
          <div>
            <span className="eyebrow">Mám záujem</span>
            <h2 className="title">Chcete toto auto?</h2>
            <p className="sub">Stačí telefón a e-mail. Overíme dostupnosť u predajcu a pošleme Vám presnú ponuku so zmluvou.</p>
            <ul className="checks">
              <li>Kúpa priamo od predajcu, bez dražby</li>
              <li>Záloha sa vracia, ak predajca auto medzitým predá</li>
              <li>Kontrola auta naším agentom pred vývozom</li>
            </ul>
          </div>
          <LeadForm car={{ id: "", label: `${fullName(car)} (ihneď z Kórey)`, url }} />
        </div>
      </section>

      <section aria-label="Súvisiace">
        <div className="wrap"><div className="lp-tags">
          <Link href="/ihned-z-korey">Všetky autá ihneď k odberu z Kórey</Link>
          <Link href="/auto-na-mieru">Nájdite mi podobné auto</Link>
        </div></div>
      </section>
    </>
  );
}
