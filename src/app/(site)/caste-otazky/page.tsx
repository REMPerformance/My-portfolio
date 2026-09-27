import type { Metadata } from "next";
import { Faq, PageHead, breadcrumbLd, faqLd } from "@/components/Sections";
import { JsonLd } from "@/components/JsonLd";
import { FAQ } from "@/lib/content";
import { LeadForm } from "@/components/LeadForm";

export const metadata: Metadata = {
  title: "Časté otázky o dovoze auta z USA",
  description: "Odpovede na časté otázky o dovoze áut z amerických aukcií: záloha, clo a DPH, dĺžka dovozu, homologizácia, salvage titul, oprava a bonus na tuning v RACEM.",
  alternates: { canonical: "/caste-otazky" },
  openGraph: { url: "/caste-otazky" }
};

export default function FaqPage() {
  const crumbs = [{ name: "Domov", path: "/" }, { name: "Časté otázky", path: "/caste-otazky" }];
  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      <JsonLd data={faqLd(FAQ)} />
      <PageHead crumbs={crumbs} title={<>Časté <em>otázky</em></>} sub="Všetko, čo potrebujete vedieť pred objednaním auta z USA. Ak tu odpoveď nenájdete, napíšte nám." />
      <section style={{ paddingTop: 40 }}>
        <div className="wrap"><Faq /></div>
      </section>
      <section className="alt">
        <div className="wrap contact">
          <div>
            <span className="eyebrow">Iná otázka?</span>
            <h2 className="title">Opýtajte sa <em>nás</em></h2>
            <p className="sub">Odpovieme spravidla do 24 hodín.</p>
          </div>
          <LeadForm heading="Otázka alebo dopyt" />
        </div>
      </section>
    </>
  );
}
