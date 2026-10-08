import { Fragment } from "react";
import { Flag } from "@/components/Flag";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCalcConfig, getCarBySlug, getCardCars, getPublicCars, publicCar } from "@/lib/data";
import { carEstimate, includedItems, isFixed } from "@/lib/calc";
import { RUN_LABEL, TYPE_LABEL, carFullName, carName, carPhase, eur, fmtDate, km, money, num } from "@/lib/format";
import { countryDef, placeName } from "@/lib/origins";
import { SITE } from "@/lib/site";
import { Gallery } from "@/components/Gallery";
import { PriceSwitch } from "@/components/PriceSwitch";
import { DamageSheet } from "@/components/DamageSheet";
import { CarDeadlines, CarOrder } from "@/components/CarDeadlines";
import { ViewPing } from "@/components/ViewPing";
import { Crumbs, breadcrumbLd } from "@/components/Sections";
import { JsonLd } from "@/components/JsonLd";
import { CarCard } from "@/components/CarCard";
import { SpecIcon } from "@/components/Icons";
import { MAKES } from "@/lib/makes";
import { modelForCar } from "@/lib/models";
import { carKeywords, carSeoDescription, carSeoTitle, isDamaged, isSpotless } from "@/lib/carSeo";
import { landingByCountry } from "@/lib/landing";

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const cars = await getPublicCars();
  return cars.map((c) => ({ slug: c.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [car, cfg] = await Promise.all([getCarBySlug(slug), getCalcConfig()]);
  if (!car) return { title: "Auto sa nenašlo", robots: { index: false } };
  const est = carEstimate(cfg, car);
  const fixed = isFixed(car);
  const cd = countryDef(car.country);
  const where = [placeName(car.country, car.state) || car.location, cd.name].filter(Boolean).join(", ");
  const title = car.seo_title || carSeoTitle(car, est);
  const description = car.seo_description || carSeoDescription(car, est);
  const img = car.images?.[0] || SITE.ogImage;
  return {
    title: { absolute: title.length > 58 ? title : `${title} | REM` },
    description: description.slice(0, 300),
    keywords: carKeywords(car),
    alternates: { canonical: `/auta/${car.slug}` },
    openGraph: { type: "website", url: `/auta/${car.slug}`, title, description, images: [{ url: img, alt: carFullName(car) }] },
    twitter: { card: "summary_large_image", title, description, images: [img] }
  };
}

export default async function CarPage({ params }: Props) {
  const { slug } = await params;
  const [car, cfg, { cars: all }] = await Promise.all([getCarBySlug(slug), getCalcConfig(), getCardCars()]);
  if (!car) notFound();
  const serverNow = Date.now();
  const est = carEstimate(cfg, car);
  const estSelf = carEstimate(cfg, car, { noHomolog: true });
  const phase = carPhase(car, serverNow);
  const mk = MAKES.find((m) => m.name.toLowerCase() === car.make.toLowerCase());
  const lp = landingByCountry(car.country || "US");
  const mdl = modelForCar(car.make, car.model, car.trim);
  const pc = publicCar(car);
  const damaged = isDamaged(car), spotless = isSpotless(car);
  const condition = damaged ? "https://schema.org/DamagedCondition" : "https://schema.org/UsedCondition";
  const fixed = isFixed(car);
  const cd = countryDef(car.country);
  const where = [placeName(car.country, car.state) || car.location, cd.name].filter(Boolean).join(", ");
  const saving = car.sk_price_eur ? car.sk_price_eur - est.gross : 0;
  const crumbs = [
    { name: "Domov", path: "/" },
    { name: "Ponuka áut", path: "/ponuka" },
    { name: carName(car), path: `/auta/${car.slug}` }
  ];
  const similar = all.filter((c) => c.id !== car.id && carPhase(c, serverNow) !== "ended").sort((a, b) => (a.type === car.type ? -1 : 1) - (b.type === car.type ? -1 : 1)).slice(0, 3);
  const suggestedBudget = Math.ceil((est.gross * 1.1) / 500) * 500;

  const kmTxt = car.odometer_mi ? `${num(car.odometer_mi * 1.609344)} km` : "—";
  const facts: [Parameters<typeof SpecIcon>[0]["k"], string, React.ReactNode][] = [
    ["year", "Rok výroby", car.year ?? "—"],
    ["km", "Najazdené", kmTxt],
    ["fuel", "Palivo", car.fuel || "—"],
    ["gear", "Prevodovka", car.transmission || "—"],
    ["engine", "Motor", car.engine || "—"],
    ["drive", "Pohon", car.drive || "—"],
    ["key", "Kľúče", car.keys == null ? "—" : car.keys ? "Áno" : "Nie"],
    ["doc", "Doklady (titul)", car.title_type || "—"],
    ["color", "Farba", car.color || "—"]
  ];
  const detailRows: [string, React.ReactNode][] = [
    ["Pôvod", <span key="o" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Flag code={car.country} />{where}</span>],
    ["Typ", TYPE_LABEL[car.type]],
    ["Stav", car.run_status ? RUN_LABEL[car.run_status] : "—"],
    ["VIN", car.vin || "Na vyžiadanie"],
    ["Najazdené", car.odometer_mi ? `${kmTxt} (${num(car.odometer_mi)} mi)` : "—"]
  ];
  const extraRows = (car.extra?.specs || []).filter((x) => x.label && x.value).map((x) => [x.label, x.value] as [string, React.ReactNode]);
  const equipment = (car.extra?.equipment || []).filter(Boolean);

  const availability = phase === "open" ? "https://schema.org/InStock" : phase === "closed" ? "https://schema.org/SoldOut" : "https://schema.org/Discontinued";
  const carLd = {
    "@context": "https://schema.org",
    "@type": "Car",
    "@id": `${SITE.url}/auta/${car.slug}#car`,
    name: carFullName(car),
    url: `${SITE.url}/auta/${car.slug}`,
    image: car.images?.length ? car.images : [SITE.ogImage],
    description: car.description || undefined,
    brand: { "@type": "Brand", name: car.make },
    manufacturer: car.make,
    model: car.model,
    vehicleModelDate: car.year ? String(car.year) : undefined,
    modelDate: car.year ? String(car.year) : undefined,
    vehicleIdentificationNumber: car.vin || undefined,
    mileageFromOdometer: car.odometer_mi ? { "@type": "QuantitativeValue", value: Math.round(car.odometer_mi * 1.609344), unitCode: "KMT" } : undefined,
    vehicleEngine: car.engine ? { "@type": "EngineSpecification", name: car.engine } : undefined,
    vehicleTransmission: car.transmission || undefined,
    driveWheelConfiguration: car.drive || undefined,
    fuelType: car.fuel || undefined,
    color: car.color || undefined,
    bodyType: (car.extra?.specs || []).find((x) => x.label === "Karoséria")?.value || undefined,
    itemCondition: condition,
    offers: {
      "@type": "Offer",
      url: `${SITE.url}/auta/${car.slug}`,
      priceCurrency: "EUR",
      price: Math.round(est.gross),
      priceSpecification: { "@type": "UnitPriceSpecification", price: Math.round(est.gross), priceCurrency: "EUR", valueAddedTaxIncluded: true },
      priceValidUntil: (car.order_close_at || car.auction_end_at || "").slice(0, 10) || undefined,
      availability,
      itemCondition: condition,
      seller: { "@id": `${SITE.url}/#org` },
      areaServed: "SK",
      description: `Odhad ceny auta na slovenských značkách ${est.local ? "vrátane prepravy a prihlásenia" : "vrátane dopravy, cla, DPH a homologizácie"}.`
    }
  };

  const phaseOpen = phase === "open";
  return (
    <>
      <JsonLd data={carLd} />
      <JsonLd data={breadcrumbLd(crumbs)} />
      <ViewPing slug={car.slug} />
      <section style={{ paddingTop: 22 }}>
        <div className="wrap">
          <Crumbs items={crumbs} />
          <div className="dhead">
            <h1 className="ctitle">{car.year} {car.make} {car.model} {car.trim && <span>{car.trim}</span>}</h1>
            <div className="dbadges">
              {phaseOpen ? <span className="ok"><SpecIcon k="check" />{fixed ? "Na predaj" : "Objednávky otvorené"}</span> : car.status === "sold" ? <span className="sold"><SpecIcon k="check" />Predali sme</span> : <span className="ended"><SpecIcon k="clock" />Predaj skončil</span>}
              <span><SpecIcon k="pin" />{where}</span>
              {!damaged && <span className="ok"><SpecIcon k="check" />Nehavarované</span>}
              <span><SpecIcon k="ship" />Dovoz na kľúč s EČV</span>
              {car.published_at && <span><SpecIcon k="year" />Zverejnené {fmtDate(car.published_at)}</span>}
            </div>
          </div>
          <div className="detail">
            <div className="detail__main">
              <Gallery car={pc}>
                <span className="car__flag car__flag--lg" title={`Pôvod: ${cd.name}`}><Flag code={car.country} /></span>
                <div className="car__tags">
                  {car.is_demo && <span className="tag tag--warn">Ukážka</span>}
                  {!damaged && <span className="tag tag--good">Nehavarované</span>}
                </div>
              </Gallery>

              <div className="block">
                <div className="facts">
                  {facts.map(([ic, k, v]) => <div key={k}><SpecIcon k={ic} /><span><small>{k}</small><b>{v}</b></span></div>)}
                </div>
              </div>

              <div className="block cards2">
                <div className="panel">
                  <h3>Detail</h3>
                  <dl className="kvlist">{detailRows.map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>)}</dl>
                </div>
                <div className="panel">
                  <h3>V cene je zahrnuté</h3>
                  <ul className="ticks">{includedItems(est).map((x) => <li key={x}>{x}</li>)}</ul>
                </div>
              </div>

              {(equipment.length > 0 || extraRows.length > 0) && (
                <div className="block">
                  <h2>Výbava a prednosti</h2>
                  <div className={extraRows.length && equipment.length ? "cards2" : ""}>
                    {equipment.length > 0 && <div className="panel"><ul className="equip">{equipment.map((e) => <li key={e}>{e}</li>)}</ul></div>}
                    {extraRows.length > 0 && <div className="panel"><dl className="kvlist">{extraRows.map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>)}</dl></div>}
                  </div>
                </div>
              )}

              {(car.description || car.note) && (
                <div className="block">
                  <h2>Popis</h2>
                  {car.description && <div className="prose">{car.description.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</div>}
                  {car.note && <div className="mnote" style={{ marginTop: 14 }}>{car.note}</div>}
                </div>
              )}

              <div className="block">
                <h2>{damaged ? "Poškodenie" : "Stav auta"}</h2>
                {!damaged && (
                  <div className="nodmg">
                    <SpecIcon k="check" />
                    <div>
                      <b>{spotless ? "Bez poškodenia" : "Nehavarované auto"}</b>
                      <span>{spotless ? "Podľa inzerátu a fotiek auto nie je havarované a nemá viditeľné poškodenie." : `Auto nie je havarované. Inzerát uvádza len kozmetické chyby: ${[car.primary_damage, car.secondary_damage].filter(Boolean).join(", ").toLowerCase()}.`}</span>
                    </div>
                  </div>
                )}
                {damaged && (car.primary_damage || car.secondary_damage) && (
                  <p className="prose" style={{ marginBottom: 14 }}>
                    Hlavné: <b style={{ color: "var(--rc-text)" }}>{car.primary_damage || "neuvedené"}</b>
                    {car.secondary_damage && <> · Vedľajšie: <b style={{ color: "var(--rc-text)" }}>{car.secondary_damage}</b></>}
                  </p>
                )}
                {(damaged || (car.damage_zones || []).length > 0) && <DamageSheet zones={car.damage_zones || []} />}
                <p className="note">{damaged ? "Nákres vychádza z fotiek a popisu predajcu. Skryté poškodenia nie je možné vopred vylúčiť." : "Stav vychádza z fotiek a popisu predajcu. Pred kúpou preverujeme históriu auta podľa VIN."}</p>
              </div>

              {car.extra?.history && (
                <div className="block">
                  <h2>História</h2>
                  <div className="prose">{car.extra.history.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</div>
                </div>
              )}
            </div>

            <aside className="detail__side" aria-label="Cena a objednávka">
              <div className="panel pricebox">
                <PriceSwitch
                  full={{ total: est.total, gross: est.gross, net: est.net }}
                  self={est.homologEur > 0 || est.repairEur > 0 ? { total: estSelf.total, gross: estSelf.gross, net: estSelf.net } : null}
                  priceMode={est.priceMode}
                  ended={phase === "ended"}
                  endedLabel={car.status === "sold" ? "Predali sme" : "Predaj skončil"}
                  local={est.local}
                  repair={est.repairEur > 0}
                  contact={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(`Dobrý deň, chcem presnejší odhad ceny pre ${carFullName(car)}: ${SITE.url}/auta/${car.slug}`)}`}
                  skPrice={car.sk_price_eur}
                />
                <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
                  <CarDeadlines car={pc} serverNow={serverNow} />
                  <a className="rc-btn rc-btn--outline rc-btn--block" href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(`Dobrý deň, mám otázku k ${carFullName(car)} – ${SITE.url}/auta/${car.slug}`)}`} target="_blank" rel="noopener">Chcem viac info</a>
                </div>
                <div className="pb-contact">
                  <a className="wa" href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(`Dobrý deň, mám záujem o ${carFullName(car)} – ${SITE.url}/auta/${car.slug}`)}`} target="_blank" rel="noopener">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.8 11.8 0 004.5 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.7-1.2s.2-1.1.2-1.2-.3-.2-.5-.3z" /></svg>
                    <span>Napíšte nám<b>WhatsApp</b></span>
                  </a>
                  <a className="tel" href={`tel:${SITE.phone.replace(/\s/g, "")}`}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2" /></svg>
                    <span>Zavolajte<b>{SITE.phone}</b></span>
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <div className="mbar" aria-label="Cena a kontakt">
        <div className="mbar__price">
          <small>{phase === "ended" ? (car.status === "sold" ? "Predali sme" : "Predaj skončil") : `Cena ${est.priceMode === "net" ? "bez DPH" : "s DPH"}`}</small>
          <b>{phase === "ended" && car.status !== "sold" ? <s>{eur(est.total)}</s> : eur(est.total)}</b>
        </div>
        <a className="mbar__wa" href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(`Dobrý deň, mám záujem o ${carFullName(car)} – ${SITE.url}/auta/${car.slug}`)}`} target="_blank" rel="noopener" aria-label="WhatsApp">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.8 11.8 0 004.5 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.7-1.2s.2-1.1.2-1.2-.3-.2-.5-.3z" /></svg>
        </a>
        <a className="rc-btn rc-btn--primary mbar__cta" href={phase === "ended" ? "/auto-na-mieru" : "#objednat"}>{phase === "ended" ? "Podobné auto" : "Mám záujem"}</a>
      </div>

      <section className="alt" id="objednat" aria-label="Objednávka">
        <div className="wrap contact">
          <div>
            <span className="eyebrow">Mám záujem</span>
            <h2 className="title">Chcete toto auto?</h2>
            <p className="sub">Stačí telefón a e-mail – ozveme sa Vám s presnou kalkuláciou a ďalším postupom.</p>
            <ul className="checks">
              {fixed ? <li>Kúpa priamo od predajcu, bez dražby</li> : <li>Neprihodíme nad Váš limit</li>}
              <li>{fixed ? "Záloha sa vracia, ak predajca auto medzitým predá" : "Záloha sa vracia, ak aukciu prehráme"}</li>
              {est.credit > 0 && <li>Kredit {eur(est.credit)} do RACEM pri odovzdaní</li>}
            </ul>
          </div>
          <CarOrder car={pc} serverNow={serverNow} suggestedBudget={suggestedBudget} selfOption={est.homologEur > 0 || est.repairEur > 0 ? (est.repairEur > 0 ? (est.local ? "Chcem auto bez opravy a prihlásenia" : "Chcem auto bez opravy a homologizácie") : est.local ? "Prihlásenie si vybavím sám" : "Homologizáciu si vybavím sám") : undefined} />
        </div>
      </section>

      <section style={{ paddingBottom: similar.length ? 0 : undefined }} aria-label="Súvisiace">
        <div className="wrap">
          <div className="lp-tags">
            {mk && mdl && <Link href={`/znacky/${mk.slug}/${mdl.slug}`}>Dovoz {mk.name} {mdl.name}</Link>}
            {mk && <Link href={`/znacky/${mk.slug}`}>Dovoz {mk.name}, všetky autá</Link>}
            {lp && <Link href={`/${lp.slug}`}><Flag code={car.country} /> Dovoz auta {cd.from}</Link>}
            <Link href="/poradna/kolko-stoji-dovoz-auta-z-usa">Koľko stojí dovoz auta</Link>
            <Link href="/auto-na-mieru">Nájdite mi podobné auto</Link>
          </div>
        </div>
      </section>

      {similar.length > 0 && (
        <section aria-labelledby="sim-h">
          <div className="wrap">
            <div className="sec-head"><div><h2 className="title" id="sim-h">Ďalšie autá v ponuke</h2></div><Link href="/ponuka" className="rc-btn rc-btn--ghost">Celá ponuka</Link></div>
            <div className="grid">{similar.map((c) => <CarCard key={c.id} car={c} serverNow={serverNow} />)}</div>
          </div>
        </section>
      )}
    </>
  );
}
