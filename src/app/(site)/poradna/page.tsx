import type { Metadata } from "next";
import Link from "next/link";
import { ARTICLES } from "@/lib/articles";
import { PageHead, breadcrumbLd } from "@/components/Sections";
import { JsonLd } from "@/components/JsonLd";
import { IArrow } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Poradňa – všetko o dovoze auta z USA a zo zahraničia",
  description: "Návody a rady k dovozu auta z USA, Dubaja a Ázie: koľko stojí dovoz, clo a DPH, aukcie Copart a IAAI, homologizácia a prihlásenie na Slovensku.",
  alternates: { canonical: "/poradna" },
  openGraph: { url: "/poradna" }
};

export default function Poradna() {
  const crumbs = [{ name: "Domov", path: "/" }, { name: "Poradňa", path: "/poradna" }];
  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      <PageHead crumbs={crumbs} title={<>Poradňa k <em>dovozu áut</em></>} sub="Všetko, čo potrebujete vedieť predtým, ako si dovezete auto zo zahraničia – ceny, clo, aukcie aj prihlásenie." />
      <section style={{ paddingTop: 24 }}>
        <div className="wrap art-list">
          {ARTICLES.map((a) => (
            <Link key={a.slug} href={`/poradna/${a.slug}`} className="art-card">
              <h2>{a.h1}</h2>
              <p>{a.description}</p>
              <span className="art-more">Čítať <IArrow /></span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
