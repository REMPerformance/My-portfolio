import type { Metadata } from "next";
import { PageHead, breadcrumbLd } from "@/components/Sections";
import { JsonLd } from "@/components/JsonLd";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Ochrana osobných údajov (GDPR)",
  description: "Zásady spracúvania osobných údajov služby REM Performance – aké údaje spracúvame, na aký účel, ako dlho a aké máte práva.",
  alternates: { canonical: "/ochrana-osobnych-udajov" },
  openGraph: { url: "/ochrana-osobnych-udajov" }
};

export default function Gdpr() {
  const c = SITE.company;
  const crumbs = [{ name: "Domov", path: "/" }, { name: "Ochrana osobných údajov", path: "/ochrana-osobnych-udajov" }];
  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      <PageHead crumbs={crumbs} title={<>Ochrana osobných údajov</>} sub="Informácie o spracúvaní osobných údajov podľa nariadenia (EÚ) 2016/679 (GDPR) a zákona č. 18/2018 Z. z." />
      <section style={{ paddingTop: 40 }}>
        <div className="wrap legal">
          <h2>1. Prevádzkovateľ</h2>
          <p>{c.name}, {c.street}, {c.zip} {c.city}, IČO: {c.ico}. Kontakt pre otázky k osobným údajom: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.</p>

          <h2>2. Aké údaje spracúvame a prečo</h2>
          <table>
            <thead><tr><th>Účel</th><th>Údaje</th><th>Právny základ</th><th>Doba uchovávania</th></tr></thead>
            <tbody>
              <tr><td>Vybavenie dopytu a príprava ponuky</td><td>meno, e-mail, telefón, rozpočet, správa, vybrané auto</td><td>opatrenia pred uzavretím zmluvy – čl. 6 ods. 1 písm. b) GDPR</td><td>24 mesiacov od posledného kontaktu</td></tr>
              <tr><td>Plnenie zmluvy o sprostredkovaní</td><td>identifikačné a kontaktné údaje, adresa, údaje potrebné na kúpu, colné konanie a evidenciu vozidla</td><td>plnenie zmluvy – čl. 6 ods. 1 písm. b) GDPR</td><td>počas trvania zmluvy a premlčacej doby</td></tr>
              <tr><td>Účtovníctvo a dane</td><td>fakturačné údaje</td><td>zákonná povinnosť – čl. 6 ods. 1 písm. c) GDPR</td><td>10 rokov</td></tr>
              <tr><td>Ochrana právnych nárokov a bezpečnosť webu</td><td>komunikácia, technické údaje</td><td>oprávnený záujem – čl. 6 ods. 1 písm. f) GDPR</td><td>počas trvania nároku</td></tr>
            </tbody>
          </table>

          <h2>3. Komu údaje poskytujeme</h2>
          <ul>
            <li>poskytovatelia hostingu a databázy (Vercel Inc., Supabase Inc. – údaje uložené v EÚ, Frankfurt),</li>
            <li>pri plnení zmluvy: broker a aukcia v USA (Copart, IAAI), prepravcovia, špeditér, colný deklarant, servis a stanica technickej kontroly – len v rozsahu nevyhnutnom na daný úkon,</li>
            <li>účtovník a orgány verejnej moci, ak to vyžaduje zákon.</li>
          </ul>
          <p>Pri kúpe vozidla v USA dochádza k prenosu údajov do tretej krajiny. Prenos je nevyhnutný na plnenie zmluvy (čl. 49 ods. 1 písm. b) GDPR), prípadne prebieha na základe štandardných zmluvných doložiek alebo rámca EU-US Data Privacy Framework.</p>

          <h2>4. Cookies a podobné technológie</h2>
          <p>Web nepoužíva reklamné ani analytické cookies tretích strán. V prehliadači ukladáme len technické údaje nevyhnutné na fungovanie (napr. či ste si auto už pozreli, aby sme nezapočítali zobrazenie dvakrát). Písma načítavame zo služby Google Fonts, pri čom Google spracúva Vašu IP adresu.</p>

          <h2>5. Vaše práva</h2>
          <p>Máte právo na prístup k údajom, opravu, vymazanie, obmedzenie spracúvania, prenosnosť údajov a právo namietať proti spracúvaniu na základe oprávneného záujmu. Žiadosť pošlite na <a href={`mailto:${SITE.email}`}>{SITE.email}</a>, vybavíme ju do 30 dní.</p>
          <p>Ak sa domnievate, že spracúvanie je v rozpore s predpismi, môžete podať sťažnosť na Úrad na ochranu osobných údajov SR, Hraničná 12, 820 07 Bratislava, <a href="https://dataprotection.gov.sk" target="_blank" rel="noopener">dataprotection.gov.sk</a>.</p>

          <h2>6. Zabezpečenie</h2>
          <p>Údaje sú uložené v zabezpečenej databáze s riadeným prístupom. Prístup k dopytom má len prevádzkovateľ po prihlásení.</p>
        </div>
      </section>
    </>
  );
}
