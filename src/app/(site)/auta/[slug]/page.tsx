import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCalcConfig, getCarBySlug, getCardCars, getPublicCars } from "@/lib/data";
import { carEstimate, isFixed } from "@/lib/calc";
import { RUN_LABEL, TYPE_LABEL, carFullName, carName, carPhase, eur, fmtDate, km, money, num } from "@/lib/format";
import { countryDef, placeName } from "@/lib/origins";
import { SITE } from "@/lib/site";
import { Gallery } from "@/components/Gallery";
import { DamageMap } from "@/components/DamageMap";
import { CarDeadlines, CarOrder } from "@/components/CarDeadlines";
import { ViewPing } from "@/components/ViewPing";
import { Crumbs, breadcrumbLd } from "@/components/Sections";
import { JsonLd } from "@/components/JsonLd";
import { CarCard } from "@/components/CarCard";
import { WhatsAppButton } from "@/components/LeadForm";

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
  const title = car.seo_title || `${carFullName(car)} ${cd.from} – ${eur(est.total)} na SK značkách`;
  const description =
    car.seo_description ||
    `${carFullName(car)} ${cd.from} (${where}), ${km(car.odometer_mi)}${car.primary_damage ? `, poškodenie: ${car.primary_damage.toLowerCase()}` : ""}. Cena na slovenských značkách ${eur(est.total)} vrátane dopravy, cla, DPH a homologizácie${car.sk_price_eur ? `, na SK trhu od ${eur(car.sk_price_eur)}` : ""}.`;
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
  const fixed = isFixed(car);
  const cd = countryDef(car.country);
  const where = [placeName(car.country, car.state) || car.location, cd.name].filter(Boolean).join(", ");
  const saving = car.sk_price_eur ? car.sk_price_eur - est.total : 0;
  const crumbs = [
    { name: "Domov", path: "/" },
    { name: "Ponuka áut", path: "/ponuka" },
    { name: carName(car), path: `/auta/${car.slug}` }
  ];
  const similar = all.filter((c) => c.id !== car.id && carPhase(c, serverNow) !== "ended").sort((a, b) => (a.type === car.type ? -1 : 1) - (b.type === car.type ? -1 : 1)).slice(0, 3);
  const suggestedBudget = Math.ceil((est.total * 1.1) / 500) * 500;

  const facts: [string, React.ReactNode][] = [
    ["Rok výroby", car.year ?? "—"],
    ["Najazdené", km(car.odometer_mi)],
    ["Motor", car.engine || "—"],
    ["Pohon", car.drive || "—"],
    ["Stav", car.run_status ? RUN_LABEL[car.run_status] : "—"],
    ["Titul", car.title_type || "—"]
  ];
  const specs: [string, React.ReactNode][] = [
    ["Rok výroby", car.year ?? "—"],
    ["Najazdené", car.odometer_mi ? `${km(car.odometer_mi)} (${num(car.odometer_mi)} mi)` : "—"],
    ["Motor", car.engine || "—"],
    ["Prevodovka", car.transmission || "—"],
    ["Pohon", car.drive || "—"],
    ["Palivo", car.fuel || "—"],
    ["Farba", car.color || "—"],
    ["Typ", TYPE_LABEL[car.type]],
    ["Kľúče", car.keys == null ? "—" : car.keys ? "Áno" : "Nie"],
    ["VIN", car.vin || "Na vyžiadanie"],
    ["Pôvod", `${cd.flag} ${where}`],
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
      description: fixed
        ? "Cena auta na slovenských značkách vrátane dopravy, cla, DPH a homologizácie."
        : "Odhad ceny auta na slovenských značkách vrátane dopravy, cla, DPH a homologizácie."
    }
  };

  return (
    <>
      <JsonLd data={carLd} />
      <JsonLd data={breadcrumbLd(crumbs)} />
      <ViewPing slug={car.slug} />
      <section style={{ paddingTop: 24 }}>
        <div className="wrap">
          <Crumbs items={crumbs} />
          <div className="dhead">
            <div>
              <h1 className="ctitle">{car.year} {car.make} {car.model} {car.trim && <span>{car.trim}</span>}</h1>
              <p className="csub">
                <span>{cd.flag} {where}</span>
                <span>{km(car.odometer_mi)}</span>
                {car.fuel && <span>{car.fuel}</span>}
                {car.published_at && <span>Zverejnené {fmtDate(car.published_at)}</span>}
              </p>
            </div>
          </div>
          <div className="detail">
            <div className="detail__gal">
              <Gallery car={car}>
                <div className="car__tags">
                  {car.is_demo && <span className="tag tag--warn">Ukážka</span>}
                  {car.title_type && <span className={`tag ${(car.title_type || "").toLowerCase() === "clean" ? "tag--ok" : "tag--sal"}`}>{car.title_type}</span>}
                </div>
              </Gallery>
            </div>

            <aside className="detail__side" aria-label="Cena a objednávka">
              <div className="panel pricebox">
                <div className="lbl">Cena auta na slovenských značkách</div>
                <div className="big">{eur(est.total)}</div>
                {!fixed && <p className="note" style={{ marginTop: 4 }}>Odhad – konečná cena závisí od výsledku aukcie.</p>}
                <ul className="incl">
                  <li>Kúpa auta {fixed ? "u predajcu" : "na aukcii"} a všetky poplatky</li>
                  <li>Doprava do prístavu a námorná preprava do EÚ</li>
                  <li>Clo {Math.round(est.dutyRate * 100)} % a DPH 23 %, preclenie</li>
                  <li>Doprava kamiónom na Slovensko</li>
                  <li>Homologizácia, STK, EK a evidenčné čísla</li>
                  {est.repairEur > 0 && <li>Odhad opravy</li>}
                  <li>Kredit {eur(est.credit)} na tuning v RACEM</li>
                </ul>
                {car.sk_price_eur ? (
                  <div className="skcmp">
                    <div><span>Podobné auto na Slovensku</span><b>{eur(car.sk_price_eur)}</b></div>
                    {saving > 0 && <div className="pos"><span>Ušetríte približne</span><b>{eur(saving)}</b></div>}
                  </div>
                ) : null}
                <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
                  <CarDeadlines car={car} serverNow={serverNow} />
                  <WhatsAppButton block text={`Dobrý deň, mám záujem o ${carFullName(car)} – ${SITE.url}/auta/${car.slug}`} />
                </div>
              </div>
            </aside>

            <div className="detail__rest">
              <div className="block">
                <div className="facts">
                  {facts.map(([k, v]) => <div key={k}><small>{k}</small><b>{v}</b></div>)}
                </div>
              </div>

              <div className="block">
                <h2>Poškodenie</h2>
                {(car.primary_damage || car.secondary_damage) && (
                  <p className="prose" style={{ marginBottom: 14 }}>
                    Hlavné: <b style={{ color: "#fff" }}>{car.primary_damage || "—"}</b>
                    {car.secondary_damage && <> · Vedľajšie: <b style={{ color: "#fff" }}>{car.secondary_damage}</b></>}
                  </p>
                )}
                <div className="panel"><DamageMap zones={car.damage_zones || []} /></div>
                <p className="note">Nákres vychádza z fotiek a popisu predajcu. Skryté poškodenia nie je možné vopred vylúčiť.</p>
              </div>

              {(car.description || car.note) && (
                <div className="block">
                  <h2>Popis</h2>
                  {car.description && <div className="prose">{car.description.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</div>}
                  {car.note && <div className="mnote" style={{ marginTop: 14 }}>{car.note}</div>}
                </div>
              )}

              <div className="block">
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
                  <h2>História</h2>
                  <div className="prose">{car.extra.history.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="alt" id="objednat" aria-label="Objednávka">
        <div className="wrap contact">
          <div>
            <span className="eyebrow">Objednávka</span>
            <h2 className="title">Chcete toto auto?</h2>
            <p className="sub">Stačí telefón a e-mail – ozveme sa Vám s presnou kalkuláciou a ďalším postupom. Alebo nám rovno napíšte na WhatsApp {SITE.phone}.</p>
            <ul className="checks">
              {fixed ? <li>Pevná cena auta – žiadna dražba</li> : <li>Neprihodíme nad Váš limit</li>}
              <li>{fixed ? "Záloha sa vracia, ak predajca auto medzitým predá" : "Záloha sa vracia, ak aukciu prehráme"}</li>
              <li>Kredit {eur(est.credit)} do RACEM pri odovzdaní</li>
            </ul>
            <p className="note">Pred objednávkou si prečítajte <Link className="link" href="/vop">obchodné podmienky</Link>.</p>
          </div>
          <CarOrder car={car} serverNow={serverNow} suggestedBudget={suggestedBudget} />
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
