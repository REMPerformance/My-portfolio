import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCardCars } from "@/lib/data";
import { calc } from "@/lib/calc";
import { carPhase, eur, money } from "@/lib/format";
import { countryDef, placesEn } from "@/lib/origins";
import { LANDINGS, landingBySlug } from "@/lib/landing";
import { MAKES } from "@/lib/makes";
import { SITE } from "@/lib/site";
import { PageHead, breadcrumbLd, Faq, faqLd, Steps } from "@/components/Sections";
import { JsonLd } from "@/components/JsonLd";
import { CarCard } from "@/components/CarCard";
import { Breakdown } from "@/components/Breakdown";
import { Flag } from "@/components/Flag";
import { IArrow } from "@/components/Icons";

export const revalidate = 300;
export const dynamicParams = false;

export function generateStaticParams() {
  return LANDINGS.map((l) => ({ landing: l.slug }));
}

type Props = { params: Promise<{ landing: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const l = landingBySlug((await params).landing);
  if (!l) return {};
  return {
    title: { absolute: `${l.title} | REM Performance` },
    description: l.description,
    alternates: { canonical: `/${l.slug}` },
    openGraph: { url: `/${l.slug}`, title: l.title, description: l.description }
  };
}

export default async function LandingPage({ params }: Props) {
  const l = landingBySlug((await params).landing);
  if (!l) notFound();
  const { cars, cfg } = await getCardCars();
  const now = Date.now();
  const cd = countryDef(l.country);
  const live = cars.filter((c) => (c.country || "US") === l.country && carPhase(c, now) !== "ended");
  const ex = calc(cfg, { price: l.example.price, currency: cd.currency, country: cd.code, place: l.example.place, type: "car", sellerFee: l.example.auction ? undefined : 0 });
  const makes = MAKES.filter((m) => m.from.includes(l.country)).slice(0, 10);
  const places = placesEn(cd.code);
  const crumbs = [{ name: "Domov", path: "/" }, { name: `Dovoz auta ${cd.from}`, path: `/${l.slug}` }];

  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      <JsonLd data={faqLd(l.faq)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: `Dovoz auta ${cd.from} na kľúč`,
          serviceType: "Dovoz auta zo zahraničia",
          provider: { "@id": `${SITE.url}/#org` },
          areaServed: { "@type": "Country", name: "Slovensko" },
          url: `${SITE.url}/${l.slug}`,
          description: l.description,
          offers: { "@type": "Offer", priceCurrency: "EUR", price: Math.round(ex.gross), description: `Príklad: ${l.example.label} – celková cena na slovenských značkách s DPH` }
        }}
      />
      <PageHead
        crumbs={crumbs}
        title={<><Flag code={cd.code} className="flagi flagi--h1" /> {l.h1[0]} <em>{l.h1[1]}</em></>}
        sub={l.lead}
      />
      <section style={{ paddingTop: 16 }}>
        <div className="wrap">
          <div className="actions" style={{ marginTop: 0 }}>
            <Link href="/auto-na-mieru" className="rc-btn rc-btn--primary">Nájdite mi auto {cd.from} <IArrow /></Link>
            <Link href={`/ponuka?country=${cd.code}`} className="rc-btn rc-btn--ghost">Autá {cd.from} v ponuke ({live.length})</Link>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="sec-head"><div><span className="eyebrow">Prečo {cd.from}</span><h2 className="title">Prečo sa oplatí dovoz auta {cd.from}</h2></div></div>
          <div className="lp-why">
            {l.why.map((w) => <div key={w.t} className="panel"><h3>{w.t}</h3><p>{w.d}</p></div>)}
          </div>
        </div>
      </section>

      <section className="alt">
        <div className="wrap lp-calc">
          <div>
            <span className="eyebrow">Príklad výpočtu</span>
            <h2 className="title">Koľko stojí dovoz auta {cd.from}</h2>
            <p className="sub">Príklad: {l.example.label} ({money(l.example.price, cd.currency)}). Celková cena na slovenských značkách vychádza približne na <b>{eur(ex.gross)} s DPH</b> ({eur(ex.net)} bez DPH) – vrátane dopravy, cla, DPH, homologizácie a prihlásenia.</p>
            <p className="sub">Každé auto je iné – dopravu počítame podľa konkrétneho miesta a prístavu. Presnú cenu si spočítate v <Link href="/kalkulacka-dovozu">kalkulačke dovozu</Link>.</p>
            <h3 style={{ marginTop: 24, fontSize: 17, fontWeight: 800 }}>Na čo si dať pozor</h3>
            <ul className="ticks" style={{ marginTop: 10 }}>{l.watch.map((w) => <li key={w}>{w}</li>)}</ul>
          </div>
          <div className="panel"><Breakdown r={ex} hideFee compact /></div>
        </div>
      </section>

      {live.length > 0 && (
        <section>
          <div className="wrap">
            <div className="sec-head">
              <div><h2 className="title">Autá {cd.from} v ponuke</h2></div>
              <Link href={`/ponuka?country=${cd.code}`} className="rc-btn rc-btn--ghost">Všetky <IArrow /></Link>
            </div>
            <div className="grid">{live.slice(0, 6).map((c) => <CarCard key={c.id} car={c} serverNow={now} />)}</div>
          </div>
        </section>
      )}

      <section className={live.length ? "alt" : ""}>
        <div className="wrap">
          <div className="sec-head"><div><span className="eyebrow">Postup</span><h2 className="title">Ako prebieha dovoz auta {cd.from}</h2></div></div>
          <Steps />
        </div>
      </section>

      <section>
        <div className="wrap lp-cols">
          {makes.length > 0 && (
            <div>
              <h2 className="title" style={{ fontSize: 24 }}>Najčastejšie dovážané značky</h2>
              <div className="lp-tags">{makes.map((m) => <Link key={m.slug} href={`/znacky/${m.slug}`}>{m.name}</Link>)}</div>
            </div>
          )}
          <div>
            <h2 className="title" style={{ fontSize: 24 }}>{cd.placeLabel === "Štát" ? "Odkiaľ v USA dovážame" : `${cd.placeLabel} – odkiaľ dovážame`}</h2>
            <p className="note">{places.map((p) => p.name).join(" · ")}</p>
            <p className="note">Prístavy: {cd.ports.map((p) => p.name).join(", ")}</p>
          </div>
        </div>
      </section>

      <section className="alt">
        <div className="wrap" style={{ maxWidth: 900 }}>
          <div className="sec-head"><div><span className="eyebrow">Otázky</span><h2 className="title">Dovoz auta {cd.from} – časté otázky</h2></div></div>
          <Faq items={l.faq} />
        </div>
      </section>

      <section style={{ paddingTop: 0 }} className="alt">
        <div className="wrap">
          <div className="cta-band">
            <div>
              <h2>Hľadáte konkrétne auto {cd.from}?</h2>
              <p>Napíšte nám značku, model a rozpočet – do 24 hodín Vám pošleme vhodné autá s celkovou cenou.</p>
            </div>
            <div className="actions" style={{ marginTop: 0 }}>
              <Link href="/auto-na-mieru" className="rc-btn rc-btn--light">Nájdite mi auto <IArrow /></Link>
              <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noopener" className="rc-btn rc-btn--wa">WhatsApp</a>
            </div>
          </div>
          <p className="note" style={{ marginTop: 18 }}>Dovážame aj z ďalších krajín: {LANDINGS.filter((x) => x.slug !== l.slug).map((x, i) => <span key={x.slug}>{i ? " · " : ""}<Link href={`/${x.slug}`}>{x.h1[0]}</Link></span>)}</p>
        </div>
      </section>
    </>
  );
}
