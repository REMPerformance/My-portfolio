import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCardCars } from "@/lib/data";
import { carPhase } from "@/lib/format";
import { countryDef } from "@/lib/origins";
import { makeBySlug } from "@/lib/makes";
import { MODELS, carMatchesModel, modelBySlug, modelsOf, type ModelDef } from "@/lib/models";
import { landingByCountry } from "@/lib/landing";
import { SITE } from "@/lib/site";
import { Faq, PageHead, breadcrumbLd, faqLd } from "@/components/Sections";
import { JsonLd } from "@/components/JsonLd";
import { CarCard } from "@/components/CarCard";
import { Flag } from "@/components/Flag";
import { IArrow } from "@/components/Icons";

export const revalidate = 300;
export const dynamicParams = false;

export function generateStaticParams() {
  return MODELS.map((m) => ({ slug: m.make, model: m.slug }));
}

type Props = { params: Promise<{ slug: string; model: string }> };

const fromList = (codes: string[]) => codes.map((c) => countryDef(c).from).join(", ").replace(/, ([^,]*)$/, " alebo $1");

function modelFaq(full: string, m: ModelDef, from: string[]) {
  const onlyEu = from.length === 1 && from[0] === "EU";
  const duty = m.type === "truck" ? "22 % (pickup)" : "10 %";
  return [
    {
      q: `Koľko stojí dovoz ${full}?`,
      a: onlyEu
        ? `K cene auta sa pripočíta preprava po ceste na Slovensko, prihlásenie a náš poplatok. Pri aute z Európskej únie sa neplatí clo ani dovozná DPH a nie je potrebná homologizácia. Presnú sumu si spočítate v kalkulačke dovozu.`
        : `K cene auta sa pripočítajú poplatky predajcu alebo aukcie, doprava do prístavu, námorná preprava, clo ${duty}, DPH 23 %, vykládka, kamión na Slovensko, homologizácia a prihlásenie.${from.includes("EU") ? " Pri kuse z Európskej únie odpadá clo, námorná preprava aj homologizácia." : ""} Pri každom aute v ponuke uvádzame celkovú cenu na slovenských značkách a vlastný výpočet si urobíte v kalkulačke dovozu.`
    },
    { q: `Odkiaľ sa ${full} oplatí doviezť?`, a: `${full} najčastejšie dovážame ${fromList(from)}. ${m.note} Pred kúpou Vám porovnáme ponuky z viacerých krajín a spočítame, čo vychádza najlepšie.` },
    { q: `Dá sa doviezť aj nehavarovaný ${full}?`, a: `Áno. Okrem poškodených áut z aukcií dovážame aj nehavarované autá od predajcov a autá s čistými dokladmi. Poškodené kusy sú lacnejšie, pri nich vždy uvádzame rozsah poškodenia a odhad opravy.` },
    { q: `Čo všetko pri dovoze ${full} vybavíte?`, a: `Kontrolu histórie auta podľa VIN, kúpu, platbu, dopravu, preclenie, homologizáciu a prihlásenie na Slovensku. Auto Vám odovzdáme so slovenskými značkami.` }
  ];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params;
  const mk = makeBySlug(p.slug), m = modelBySlug(p.slug, p.model);
  if (!mk || !m) return {};
  const full = `${mk.name} ${m.name}`;
  const title = `Dovoz ${full} ${countryDef(mk.from[0]).from} na kľúč`;
  const description = `${full} na dovoz ${fromList(mk.from)}: havarované aj nehavarované kusy z aukcií a od predajcov. ${m.note} Celkovú cenu na slovenských značkách poznáte vopred.`;
  const path = `/znacky/${mk.slug}/${m.slug}`;
  return {
    title: { absolute: `${title} | REM Performance` },
    description: description.slice(0, 300),
    keywords: [`${full} dovoz`, `${full} z USA`, `dovoz ${full}`, `${full} cena`, `${full} aukcia`, `${full} na predaj`],
    alternates: { canonical: path },
    openGraph: { url: path, title, description }
  };
}

export default async function ModelPage({ params }: Props) {
  const p = await params;
  const mk = makeBySlug(p.slug), m = modelBySlug(p.slug, p.model);
  if (!mk || !m) notFound();
  const full = `${mk.name} ${m.name}`;
  const path = `/znacky/${mk.slug}/${m.slug}`;
  const { cars } = await getCardCars();
  const now = Date.now();
  const mine = cars.filter((c) => carMatchesModel(c, m));
  const live = mine.filter((c) => carPhase(c, now) !== "ended");
  const ended = mine.filter((c) => carPhase(c, now) === "ended").slice(0, 3);
  const sameMake = cars.filter((c) => c.make.toLowerCase() === mk.name.toLowerCase() && !carMatchesModel(c, m) && carPhase(c, now) !== "ended").slice(0, 3);
  const faq = modelFaq(full, m, mk.from);
  const crumbs = [{ name: "Domov", path: "/" }, { name: "Značky", path: "/znacky" }, { name: mk.name, path: `/znacky/${mk.slug}` }, { name: m.name, path }];
  const ask = `/auto-na-mieru?znacka=${mk.slug}&model=${encodeURIComponent(m.name)}`;

  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      <JsonLd data={faqLd(faq)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: `Dovoz ${full} na kľúč`,
          serviceType: "Dovoz auta zo zahraničia",
          provider: { "@id": `${SITE.url}/#org` },
          areaServed: [{ "@type": "Country", name: "Slovensko" }, { "@type": "Country", name: "Česko" }],
          url: SITE.url + path,
          description: m.note
        }}
      />
      {live.length > 0 && (
        <JsonLd data={{ "@context": "https://schema.org", "@type": "ItemList", name: `${full} na dovoz`, itemListElement: live.map((c, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE.url}/auta/${c.slug}` })) }} />
      )}
      <PageHead
        crumbs={crumbs}
        title={<>Dovoz <em>{full}</em> na kľúč</>}
        sub={`${m.note} Nájdeme Vám ${full} podľa Vašich predstáv, havarovaný aj nehavarovaný, a dovezieme ho až k Vám so slovenskými značkami. Celkovú cenu poznáte vopred.`}
      />
      <section style={{ paddingTop: 16 }}>
        <div className="wrap">
          <div className="actions" style={{ marginTop: 0 }}>
            <Link href={ask} className="rc-btn rc-btn--primary">Nájdite mi {full} <IArrow /></Link>
            <Link href="/kalkulacka-dovozu" className="rc-btn rc-btn--ghost">Spočítať cenu dovozu</Link>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="sec-head"><div><h2 className="title">{full} v ponuke {live.length ? <span className="cnt-n">({live.length})</span> : null}</h2></div></div>
          {live.length ? (
            <div className="grid">{live.map((c) => <CarCard key={c.id} car={c} serverNow={now} />)}</div>
          ) : (
            <div className="empty">Práve nemáme {full} v ponuke. <Link href={ask}>Napíšte nám, aký ročník a výbavu hľadáte</Link>, a pošleme Vám vhodné autá z aukcií aj od predajcov.</div>
          )}
          {ended.length > 0 && (
            <>
              <h3 className="ended-head">Naposledy sme mali</h3>
              <div className="grid">{ended.map((c) => <CarCard key={c.id} car={c} serverNow={now} />)}</div>
            </>
          )}
          {sameMake.length > 0 && (
            <>
              <h3 className="ended-head">Ďalšie autá {mk.name} v ponuke</h3>
              <div className="grid">{sameMake.map((c) => <CarCard key={c.id} car={c} serverNow={now} />)}</div>
            </>
          )}
        </div>
      </section>

      <section className="alt">
        <div className="wrap lp-cols">
          <div>
            <h2 className="title" style={{ fontSize: 24 }}>Odkiaľ {full} dovážame</h2>
            <div className="lp-tags">
              {mk.from.map((c) => { const l = landingByCountry(c); return <Link key={c} href={l ? `/${l.slug}` : "/ponuka"}><Flag code={c} /> {countryDef(c).name}</Link>; })}
            </div>
          </div>
          <div>
            <h2 className="title" style={{ fontSize: 24 }}>Ďalšie modely {mk.name}</h2>
            <div className="lp-tags">
              {modelsOf(mk.slug).filter((x) => x.slug !== m.slug).map((x) => <Link key={x.slug} href={`/znacky/${mk.slug}/${x.slug}`}>{mk.name} {x.name}</Link>)}
              <Link href={`/znacky/${mk.slug}`}>Všetky {mk.name}</Link>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="sec-head"><div><h2 className="title">Časté otázky k dovozu {full}</h2></div></div>
          <Faq items={faq} />
        </div>
      </section>
    </>
  );
}
