import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCalcConfig, getCarBySlug, getCardCars, getPublicCars } from "@/lib/data";
import { carEstimate } from "@/lib/calc";
import { RUN_LABEL, TYPE_LABEL, carFullName, carName, carPhase, eur, km, num, usd } from "@/lib/format";
import { SITE } from "@/lib/site";
import { Gallery } from "@/components/Gallery";
import { DamageMap } from "@/components/DamageMap";
import { Breakdown } from "@/components/Breakdown";
import { CarDeadlines, CarOrder } from "@/components/CarDeadlines";
import { ViewPing } from "@/components/ViewPing";
import { Crumbs, breadcrumbLd } from "@/components/Sections";
import { JsonLd } from "@/components/JsonLd";
import { CarCard } from "@/components/CarCard";
import { IUsers } from "@/components/Icons";

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
  const title = car.seo_title || `${carFullName(car)} z USA – ${eur(est.total)} na SK značkách`;
  const description =
    car.seo_description ||
    `${carFullName(car)} z aukcie ${car.auction ?? "Copart"} (${car.location ?? "USA"}), ${km(car.odometer_mi)}${car.primary_damage ? `, poškodenie: ${car.primary_damage.toLowerCase()}` : ""}. Odhad celkovej ceny na Slovensku ${eur(est.total)} vrátane cla, DPH a dopravy${car.sk_price_eur ? `, na SK trhu od ${eur(car.sk_price_eur)}` : ""}.`;
  const img = car.images?.[0] || SITE.ogImage;
  return {
    title: { absolute: title.length > 58 ? title : `${title} | REM` },
    description: description.slice(0, 300),
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
  const phase = carPhase(car, serverNow);
  const saving = car.sk_price_eur ? car.sk_price_eur - est.total : 0;
  const crumbs = [
    { name: "Domov", path: "/" },
    { name: "Ponuka áut", path: "/ponuka" },
    { name: carName(car), path: `/auta/${car.slug}` }
  ];
  const similar = all.filter((c) => c.id !== car.id && carPhase(c, serverNow) !== "ended").sort((a, b) => (a.type === car.type ? -1 : 1) - (b.type === car.type ? -1 : 1)).slice(0, 3);
  const suggestedBudget = Math.ceil((est.total * 1.1) / 500) * 500;

  const specs: [string, React.ReactNode][] = [
    ["Rok výroby", car.year ?? "—"],
    ["Najazdené", car.odometer_mi ? `${km(car.odometer_mi)} (${num(car.odometer_mi)} mi)` : "—"],
    ["Motor", car.engine || "—"],
    ["Prevodovka", car.transmission || "—"],
    ["Pohon", car.drive || "—"],
    ["Palivo", car.fuel || "—"],
    ["Farba", car.color || "—"],
    ["Typ", TYPE_LABEL[car.type]],
    ["Stav", car.run_status ? RUN_LABEL[car.run_status] : "—"],
    ["Kľúče", car.keys == null ? "—" : car.keys ? "Áno" : "Nie"],
    ["Titul", car.title_type || "—"],
    ["VIN", car.vin || "Na vyžiadanie"],
    ["Aukcia", [car.auction, car.lot && `lot ${car.lot}`].filter(Boolean).join(" · ") || "—"],
    ["Lokalita", car.location || "—"],
    ...((car.extra?.specs || []).filter((x) => x.label && x.value).map((x) => [x.label, x.value] as [string, React.ReactNode]))
  ];
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
    itemCondition: "https://schema.org/DamagedCondition",
    offers: {
      "@type": "Offer",
      url: `${SITE.url}/auta/${car.slug}`,
      priceCurrency: "EUR",
      price: Math.round(est.total),
      priceValidUntil: (car.order_close_at || car.auction_end_at || "").slice(0, 10) || undefined,
      availability,
      itemCondition: "https://schema.org/DamagedCondition",
      seller: { "@id": `${SITE.url}/#org` },
      areaServed: "SK",
      description: "Odhad celkovej ceny na slovenských značkách vrátane cla, DPH, dopravy, homologizácie a poplatku za sprostredkovanie."
    }
  };

  return (
    <>
      <JsonLd data={carLd} />
      <JsonLd data={breadcrumbLd(crumbs)} />
      <ViewPing slug={car.slug} />
      <section style={{ paddingTop: 28 }}>
        <div className="wrap">
          <Crumbs items={crumbs} />
          <h1 className="ctitle">{car.year} {car.make} {car.model} <span style={{ color: "var(--rc-red-hi)" }}>{car.trim}</span></h1>
          <p className="csub">{[TYPE_LABEL[car.type], km(car.odometer_mi), car.location, car.auction].filter(Boolean).join(" · ")}</p>
          <div className="detail" style={{ marginTop: 22 }}>
            <div className="detail__gal">
              <Gallery car={car}>
                <div className="car__tags">
                  {car.is_demo && <span className="tag tag--warn"><span>Ukážka</span></span>}
                  {car.auction && <span className="tag tag--dark"><span>{car.auction}</span></span>}
                  {car.title_type && <span className={`tag ${(car.title_type || "").toLowerCase() === "clean" ? "tag--ok" : "tag--sal"}`}><span>{car.title_type}</span></span>}
                </div>
              </Gallery>
            </div>
            <div className="detail__rest">
              <div className="block" style={{ marginTop: 0 }}>
                <h2>Parametre</h2>
                <dl className="spec-table">
                  {specs.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
                </dl>
              </div>

              {equipment.length > 0 && (
                <div className="block">
                  <h2>Výbava</h2>
                  <ul className="equip">{equipment.map((e) => <li key={e}>{e}</li>)}</ul>
                </div>
              )}

              {car.extra?.history && (
                <div className="block">
                  <h2>História a doplňujúce info</h2>
                  <div className="prose">{car.extra.history.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</div>
                </div>
              )}

              <div className="block">
                <h2>Rozsah poškodenia</h2>
                {(car.primary_damage || car.secondary_damage) && (
                  <p className="prose" style={{ marginBottom: 16 }}>
                    Hlavné poškodenie: <b style={{ color: "#fff" }}>{car.primary_damage || "—"}</b>
                    {car.secondary_damage && <> · Vedľajšie: <b style={{ color: "#fff" }}>{car.secondary_damage}</b></>}
                  </p>
                )}
                <div className="panel"><DamageMap zones={car.damage_zones || []} /></div>
                <p className="note">Nákres vychádza z fotiek a popisu aukcie. Skryté poškodenia nie je možné vopred vylúčiť.</p>
              </div>

              {(car.description || car.note) && (
                <div className="block">
                  <h2>Popis a náš komentár</h2>
                  {car.description && <div className="prose">{car.description.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</div>}
                  {car.note && <div className="mnote" style={{ marginTop: 14 }}>{car.note}</div>}
                </div>
              )}

              <div className="block">
                <h2>Rozpis ceny na slovenských značkách</h2>
                <div className="panel"><Breakdown r={est} skPrice={car.sk_price_eur} /></div>
                {car.sk_price_source && <p className="note">Cena na SK trhu: {car.sk_price_source}</p>}
              </div>
            </div>

            <aside className="detail__side" aria-label="Cena a objednávka">
              <div className="panel">
                <span className="eyebrow">Cena a termíny</span>
                <div className="prices" style={{ marginTop: 14 }}>
                  <div><small>Aktuálna ponuka</small><b>{usd(car.current_bid_usd || 0)}</b></div>
                  <div><small>Odhad vydraženia</small><b>{usd(car.est_bid_usd || car.current_bid_usd || 0)}</b></div>
                </div>
                <div className="bd-total" style={{ marginTop: 12 }}>
                  <div><small>Odhad na SK značkách</small><b>{eur(est.total)}</b></div>
                  <div className="cr"><small>Kredit RACEM</small><b>+{eur(est.credit)}</b></div>
                </div>
                {car.sk_price_eur ? (
                  <div className="bd-cmp">
                    <div><small>Na SK trhu</small><b>{eur(car.sk_price_eur)}</b></div>
                    <div className={saving >= 0 ? "pos" : "neg"}><small>{saving >= 0 ? "Ušetríte ≈" : "Drahšie o"}</small><b>{eur(Math.abs(saving))}</b></div>
                  </div>
                ) : null}
                <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                  <CarDeadlines car={car} serverNow={serverNow} />
                </div>
                <p className="note" style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  {car.leads_count > 0 && <span className="interest"><IUsers /> {car.leads_count} {car.leads_count === 1 ? "záujemca" : car.leads_count < 5 ? "záujemcovia" : "záujemcov"}</span>}
                  <span>Záloha od {eur(est.deposit)} · vrátime ju, ak aukciu prehráme</span>
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="alt" id="objednat" aria-label="Objednávka">
        <div className="wrap contact">
          <div>
            <span className="eyebrow">Objednávka</span>
            <h2 className="title">Chcete <em>toto auto?</em></h2>
            <p className="sub">Pošlite nezáväzný dopyt. Do 24 hodín Vám pošleme presnú kalkuláciu, zmluvu o sprostredkovaní a pokyny k zálohe. Ceny potvrdíme pred dražbou.</p>
            <ul className="checks">
              <li>Neprihodíme nad Váš limit</li>
              <li>Záloha sa vracia, ak aukciu prehráme</li>
              <li>Kredit {eur(est.credit)} do RACEM pri odovzdaní</li>
            </ul>
            <p className="note">Pred objednávkou si prečítajte <Link className="link" href="/vop">obchodné podmienky</Link> a <Link className="link" href="/ako-to-funguje">ako prebieha dovoz</Link>.</p>
          </div>
          <CarOrder car={car} serverNow={serverNow} suggestedBudget={suggestedBudget} />
        </div>
      </section>

      {similar.length > 0 && (
        <section aria-labelledby="sim-h">
          <div className="wrap">
            <div className="sec-head"><div><span className="eyebrow">Ďalšie autá</span><h2 className="title" id="sim-h">Mohlo by Vás <em>zaujímať</em></h2></div></div>
            <div className="grid">{similar.map((c) => <CarCard key={c.id} car={c} serverNow={serverNow} />)}</div>
          </div>
        </section>
      )}
    </>
  );
}
