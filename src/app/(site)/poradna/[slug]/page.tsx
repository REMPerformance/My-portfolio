import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ARTICLES, articleBySlug } from "@/lib/articles";
import { getCalcConfig } from "@/lib/data";
import { calc } from "@/lib/calc";
import { eur, money, fmtDate } from "@/lib/format";
import { SITE } from "@/lib/site";
import { PageHead, breadcrumbLd, Faq, faqLd } from "@/components/Sections";
import { JsonLd } from "@/components/JsonLd";
import { IArrow } from "@/components/Icons";

export const revalidate = 3600;
export const dynamicParams = false;
export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = articleBySlug((await params).slug);
  if (!a) return {};
  return {
    title: { absolute: `${a.title} | REM Performance` },
    description: a.description,
    alternates: { canonical: `/poradna/${a.slug}` },
    openGraph: { type: "article", url: `/poradna/${a.slug}`, title: a.title, description: a.description, publishedTime: a.date, modifiedTime: a.updated }
  };
}

export default async function ArticlePage({ params }: Props) {
  const a = articleBySlug((await params).slug);
  if (!a) notFound();
  const cfg = await getCalcConfig();
  const rows = (a.priceTable || []).map((usd) => ({ usd, r: calc(cfg, { price: usd, currency: "USD", country: "US", place: "NJ", type: "car" }) }));
  const crumbs = [{ name: "Domov", path: "/" }, { name: "Poradňa", path: "/poradna" }, { name: a.h1, path: `/poradna/${a.slug}` }];
  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      {a.faq && <JsonLd data={faqLd(a.faq)} />}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: a.title,
          description: a.description,
          datePublished: a.date,
          dateModified: a.updated,
          inLanguage: "sk",
          mainEntityOfPage: `${SITE.url}/poradna/${a.slug}`,
          author: { "@type": "Organization", name: SITE.name, url: SITE.url },
          publisher: { "@id": `${SITE.url}/#org` },
          image: SITE.ogImage
        }}
      />
      <PageHead crumbs={crumbs} title={a.h1} sub={a.lead} />
      <section style={{ paddingTop: 8 }}>
        <div className="wrap art">
          <article className="prose art-body">
            <p className="note">Aktualizované {fmtDate(a.updated)}</p>
            {rows.length > 0 && (
              <>
                <h2>Príklady: koľko zaplatíte za auto z USA</h2>
                <p>Orientačné celkové ceny na slovenských značkách pre osobné auto z aukcie v New Jersey (aktuálny kurz a naše sadzby dopravy):</p>
                <div className="art-table-wrap">
                  <table className="art-table">
                    <thead><tr><th>Cena auta na aukcii</th><th>Doprava</th><th>Clo 10 %</th><th>DPH</th><th>Spolu s DPH</th></tr></thead>
                    <tbody>
                      {rows.map(({ usd, r }) => (
                        <tr key={usd}><td>{money(usd, "USD")} <small>({eur(r.carEur)})</small></td><td>{eur(r.inlandEur + r.oceanEur)}</td><td>{eur(r.duty)}</td><td>{eur(r.vatTotal)}</td><td><b>{eur(r.gross)}</b></td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="note">Vrátane aukčných poplatkov, prístavu, kamióna, homologizácie a prihlásenia. Bez opravy prípadného poškodenia. Presnú cenu pre iný štát a typ auta spočítate v <Link href="/kalkulacka-dovozu">kalkulačke</Link>.</p>
              </>
            )}
            {a.sections.map((s) => (
              <section key={s.h}>
                <h2>{s.h}</h2>
                {s.p?.map((p, i) => <p key={i}>{p}</p>)}
                {s.list && <ul>{s.list.map((x) => <li key={x}>{x}</li>)}</ul>}
              </section>
            ))}
            {a.faq && (
              <>
                <h2>Časté otázky</h2>
                <Faq items={a.faq} />
              </>
            )}
          </article>
          <aside className="art-side">
            <div className="panel">
              <h3>Hľadáte konkrétne auto?</h3>
              <p className="note" style={{ marginTop: 0 }}>Napíšte nám značku, model a rozpočet – do 24 hodín Vám pošleme vhodné autá s celkovou cenou.</p>
              <Link href="/auto-na-mieru" className="rc-btn rc-btn--primary rc-btn--block">Nájdite mi auto <IArrow /></Link>
            </div>
            <div className="panel">
              <h3>Súvisiace</h3>
              <ul className="art-links">{a.links.map((l) => <li key={l.href}><Link href={l.href}>{l.label}</Link></li>)}</ul>
              <ul className="art-links">{ARTICLES.filter((x) => x.slug !== a.slug).map((x) => <li key={x.slug}><Link href={`/poradna/${x.slug}`}>{x.h1}</Link></li>)}</ul>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
