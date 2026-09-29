import type { Metadata } from "next";
import Link from "next/link";
import { getCardCars } from "@/lib/data";
import { carPhase } from "@/lib/format";
import { MAKES } from "@/lib/makes";
import { LANDINGS } from "@/lib/landing";
import { PageHead, breadcrumbLd } from "@/components/Sections";
import { JsonLd } from "@/components/JsonLd";
import { Flag } from "@/components/Flag";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Dovoz áut podľa značky – BMW, Mercedes, Porsche, Ford, Tesla…",
  description: "Dovoz áut podľa značky z USA, Dubaja, Kanady, Kórey a Japonska: BMW, Mercedes-Benz, Audi, Porsche, Ford Mustang, Dodge, RAM, Tesla, Toyota, Lexus a ďalšie. Celková cena na slovenských značkách vopred.",
  alternates: { canonical: "/znacky" },
  openGraph: { url: "/znacky" }
};

export default async function Znacky() {
  const { cars } = await getCardCars();
  const now = Date.now();
  const n = (name: string) => cars.filter((c) => c.make.toLowerCase() === name.toLowerCase() && carPhase(c, now) !== "ended").length;
  const crumbs = [{ name: "Domov", path: "/" }, { name: "Značky", path: "/znacky" }];
  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      <PageHead crumbs={crumbs} title={<>Dovoz áut <em>podľa značky</em></>} sub="Vyberte si značku – ukážeme Vám autá v ponuke, najčastejšie dovážané modely a odkiaľ sa ich oplatí doviezť." />
      <section style={{ paddingTop: 24 }}>
        <div className="wrap">
          <div className="mk-grid">
            {MAKES.map((m) => (
              <Link key={m.slug} href={`/znacky/${m.slug}`} className="mk">
                <b>{m.name}</b>
                <small>{m.models.slice(0, 3).join(" · ")}</small>
                <span className="mk__n">{n(m.name) ? `${n(m.name)} v ponuke` : "Na objednávku"}</span>
              </Link>
            ))}
          </div>
          <h2 className="title" style={{ fontSize: 24, marginTop: 40 }}>Podľa krajiny</h2>
          <div className="lp-tags">{LANDINGS.map((l) => <Link key={l.slug} href={`/${l.slug}`}><Flag code={l.country} /> {l.h1[0]}</Link>)}</div>
        </div>
      </section>
    </>
  );
}
