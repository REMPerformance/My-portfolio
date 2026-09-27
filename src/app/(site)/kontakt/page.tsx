import type { Metadata } from "next";
import { PageHead, breadcrumbLd } from "@/components/Sections";
import { JsonLd } from "@/components/JsonLd";
import { LeadForm } from "@/components/LeadForm";
import { SITE } from "@/lib/site";
import { getContent } from "@/lib/data";
import { IDoc, IGlobe, IMail, IPhone } from "@/components/Icons";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Kontakt – dopyt na auto z USA",
  description: "Napíšte nám, aké auto z USA hľadáte, alebo pošlite odkaz na auto z Copartu či IAAI. Do 24 hodín Vám pošleme odhad celkovej ceny.",
  alternates: { canonical: "/kontakt" },
  openGraph: { url: "/kontakt" }
};

export default async function Contact() {
  const ct = await getContent();
  const crumbs = [{ name: "Domov", path: "/" }, { name: "Kontakt", path: "/kontakt" }];
  const c = SITE.company;
  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      <PageHead crumbs={crumbs} title={<>Kontakt a <em>dopyt</em></>} sub="Hľadáte konkrétne auto? Napíšte nám značku, model a rozpočet alebo pošlite odkaz na aukciu. Do 24 hodín sa Vám ozveme s odhadom ceny." />
      <section style={{ paddingTop: 40 }}>
        <div className="wrap contact">
          <div>
            <div className="contact-list" style={{ marginTop: 0 }}>
              <a href={`mailto:${SITE.email}`}><IMail /><span><small>E-mail</small><b>{SITE.email}</b></span></a>
              {ct.contact.phone && <a href={`tel:${ct.contact.phone.replace(/\s/g, "")}`}><IPhone /><span><small>Telefón{ct.contact.hours ? ` · ${ct.contact.hours}` : ""}</small><b>{ct.contact.phone}</b></span></a>}
              <a href={SITE.racemUrl} target="_blank" rel="noopener"><IGlobe /><span><small>Tuning a diely</small><b>racem.sk</b></span></a>
              <div><IDoc /><span><small>Prevádzkovateľ</small><b style={{ fontSize: 16 }}>{c.name}</b><span style={{ fontSize: 14, color: "var(--rc-text-mid)" }}>{c.street}, {c.zip} {c.city}<br />IČO {c.ico} · IČ DPH {c.icDph}</span></span></div>
            </div>
            <p className="human">{ct.contact.human}</p>
          </div>
          <LeadForm />
        </div>
      </section>
    </>
  );
}
