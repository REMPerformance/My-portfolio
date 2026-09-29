import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCardCars } from "@/lib/data";
import { carPhase } from "@/lib/format";
import { countryDef } from "@/lib/origins";
import { MAKES, makeBySlug } from "@/lib/makes";
import { landingByCountry } from "@/lib/landing";
import { SITE } from "@/lib/site";
import { PageHead, breadcrumbLd } from "@/components/Sections";
import { JsonLd } from "@/components/JsonLd";
import { CarCard } from "@/components/CarCard";
import { Flag } from "@/components/Flag";
import { IArrow } from "@/components/Icons";

export const revalidate = 300;
export const dynamicParams = false;

export function generateStaticParams() {
  return MAKES.map((m) => ({ slug: m.slug }));
}

type Props = { params: Promise<{ slug: string }> };

const fromTxt = (codes: string[]) => codes.map((c) => countryDef(c).name).join(", ");
const isJdm = (s: string) => s === "jdm-japonsko";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const m = makeBySlug((await params).slug);
  if (!m) return {};
  const title = isJdm(m.slug) ? "Dovoz JDM áut z Japonska na kľúč" : `Dovoz ${m.name} z USA a zahraničia na kľúč`;
  const description = `${title}: ${m.models.slice(0, 5).join(", ")} a ďalšie modely z ${fromTxt(m.from)}. Celková cena na slovenských značkách vrátane dopravy, cla, DPH a homologizácie. Nájdeme a dovezieme.`;
  return {
    title: { absolute: `${title} | REM Performance` },
    description,
    alternates: { canonical: `/znacky/${m.slug}` },
    openGraph: { url: `/znacky/${m.slug}`, title, description }
  };
}

export default async function MakePage({ params }: Props) {
  const m = makeBySlug((await params).slug);
  if (!m) notFound();
  const { cars } = await getCardCars();
  const now = Date.now();
  const jdm = isJdm(m.slug);
  const mine = cars.filter((c) => (jdm ? c.country === "JP" : c.make.toLowerCase() === m.name.toLowerCase()));
  const live = mine.filter((c) => carPhase(c, now) !== "ended");
  const ended = mine.filter((c) => carPhase(c, now) === "ended").slice(0, 3);
  const h = jdm ? "JDM autá z Japonska" : m.name;
  const crumbs = [{ name: "Domov", path: "/" }, { name: "Značky", path: "/znacky" }, { name: h, path: `/znacky/${m.slug}` }];

  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      {live.length > 0 && (
        <JsonLd data={{ "@context": "https://schema.org", "@type": "ItemList", name: `${h} na dovoz`, itemListElement: live.map((c, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE.url}/auta/${c.slug}` })) }} />
      )}
      <PageHead
        crumbs={crumbs}
        title={<>Dovoz {jdm ? <>JDM áut <em>z Japonska</em></> : <><em>{m.name}</em> na kľúč</>}</>}
        sub={`${m.note} Nájdeme Vám ${jdm ? "auto" : m.name} podľa Vašich predstáv a dovezieme ho až k Vám so slovenskými značkami – celkovú cenu vrátane dopravy, cla a DPH poznáte vopred.`}
      />
      <section style={{ paddingTop: 16 }}>
        <div className="wrap">
          <div className="actions" style={{ marginTop: 0 }}>
            <Link href={`/auto-na-mieru?znacka=${m.slug}`} className="rc-btn rc-btn--primary">Nájdite mi {jdm ? "JDM auto" : m.name} <IArrow /></Link>
            <Link href="/kalkulacka-dovozu" className="rc-btn rc-btn--ghost">Spočítať cenu dovozu</Link>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="sec-head"><div><h2 className="title">{h} v ponuke {live.length ? <span className="cnt-n">({live.length})</span> : null}</h2></div></div>
          {live.length ? (
            <div className="grid">{live.map((c) => <CarCard key={c.id} car={c} serverNow={now} />)}</div>
          ) : (
            <div className="empty">Práve nemáme {jdm ? "žiadne JDM auto" : `žiadne ${m.name}`} v ponuke. <Link href={`/auto-na-mieru?znacka=${m.slug}`}>Napíšte nám, aký model hľadáte</Link> – do 24 hodín Vám pošleme vhodné autá z aukcií aj od predajcov.</div>
          )}
          {ended.length > 0 && (
            <>
              <h3 className="ended-head">Naposledy sme mali</h3>
              <div className="grid">{ended.map((c) => <CarCard key={c.id} car={c} serverNow={now} />)}</div>
            </>
          )}
        </div>
      </section>

      <section className="alt">
        <div className="wrap lp-cols">
          <div>
            <h2 className="title" style={{ fontSize: 24 }}>Najčastejšie dovážané modely</h2>
            <div className="lp-tags">{m.models.map((x) => <Link key={x} href={`/auto-na-mieru?znacka=${m.slug}`}>{jdm ? x : `${m.name} ${x}`}</Link>)}</div>
          </div>
          <div>
            <h2 className="title" style={{ fontSize: 24 }}>Odkiaľ {jdm ? "ich" : m.name} dovážame</h2>
            <div className="lp-tags">
              {m.from.map((c) => { const l = landingByCountry(c); return <Link key={c} href={l ? `/${l.slug}` : "/ponuka"}><Flag code={c} /> {countryDef(c).name}</Link>; })}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <h2 className="title" style={{ fontSize: 24 }}>Ďalšie značky</h2>
          <div className="lp-tags">{MAKES.filter((x) => x.slug !== m.slug).map((x) => <Link key={x.slug} href={`/znacky/${x.slug}`}>{x.name}</Link>)}</div>
        </div>
      </section>
    </>
  );
}
