import type { Metadata } from "next";
import Link from "next/link";
import { PageHead, breadcrumbLd, Faq, faqLd } from "@/components/Sections";
import { JsonLd } from "@/components/JsonLd";
import { RequestForm } from "@/components/RequestForm";
import { IMail, IPhone } from "@/components/Icons";
import { SITE } from "@/lib/site";
import { makeBySlug } from "@/lib/makes";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Auto na mieru – nájdeme a dovezieme Vám auto zo zahraničia",
  description:
    "Napíšte nám značku, model a rozpočet – nájdeme Vám auto na aukciách Copart a IAAI, u predajcov v USA, Dubaji, Kanade či Ázii a dovezieme ho na kľúč so slovenskými značkami. Nezáväzne a bezplatne.",
  alternates: { canonical: "/auto-na-mieru" },
  openGraph: { url: "/auto-na-mieru", title: "Auto na mieru – dovoz na kľúč | REM Performance" }
};

const FAQ_REQ = [
  { q: "Koľko stojí vyhľadanie auta?", a: "Vyhľadanie a poslanie ponúk je nezáväzné a bezplatné. Platíte až vtedy, keď si konkrétne auto vyberiete a podpíšeme zmluvu." },
  { q: "Ako rýchlo mi pošlete ponuky?", a: "Zvyčajne do 24 hodín. Pri vzácnych autách to môže trvať dlhšie – vtedy sledujeme aukcie a ozveme sa, keď sa objaví vhodné auto." },
  { q: "Čo znamená rozpočet „na slovenských značkách“?", a: "Je to celková suma, ktorú za auto zaplatíte – kúpa, poplatky, doprava, clo, DPH, homologizácia aj prihlásenie. Ku každému autu Vám pošleme presný rozpis." },
  { q: "Môžem chcieť aj auto, ktoré sa v Európe nepredáva?", a: "Áno. Veľa áut z USA, Dubaja či Japonska sa v Európe oficiálne nepredávalo. Pred kúpou Vám povieme, ako prebehne homologizácia a či je auto u nás prihlásiteľné." },
  { q: "Musím si vybrať auto z Vašej ponuky?", a: "Nie. Ponuka na webe sú len vybrané autá. Na mieru hľadáme presne podľa Vašich požiadaviek na všetkých aukciách a u predajcov." }
];

type Props = { searchParams: Promise<{ znacka?: string }> };

export default async function AutoNaMieru({ searchParams }: Props) {
  const { znacka } = await searchParams;
  const make = znacka ? makeBySlug(znacka)?.name ?? "" : "";
  const crumbs = [{ name: "Domov", path: "/" }, { name: "Auto na mieru", path: "/auto-na-mieru" }];
  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      <JsonLd data={faqLd(FAQ_REQ)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Vyhľadanie a dovoz auta na mieru",
          serviceType: "Dovoz auta zo zahraničia na kľúč",
          provider: { "@id": `${SITE.url}/#org` },
          areaServed: { "@type": "Country", name: "Slovensko" },
          url: `${SITE.url}/auto-na-mieru`,
          description: "Vyhľadanie auta podľa požiadaviek na aukciách Copart a IAAI a u predajcov v USA, SAE, Kanade, Kórei, Japonsku a Číne, kúpa, doprava, preclenie, homologizácia a prihlásenie na Slovensku."
        }}
      />
      <PageHead
        crumbs={crumbs}
        title={<>Auto na mieru – <em>nájdeme ho za Vás</em></>}
        sub="Napíšte nám, aké auto hľadáte a koľko chcete minúť. Prehľadáme aukcie Copart a IAAI aj predajcov v USA, Dubaji, Kanade a Ázii a do 24 hodín Vám pošleme vhodné autá s celkovou cenou na slovenských značkách."
      />
      <section style={{ paddingTop: 28 }}>
        <div className="wrap req-grid">
          <RequestForm defaultMake={make} />
          <aside className="req-side">
            <div className="panel">
              <h3>Ako to prebieha</h3>
              <ol className="req-steps">
                <li><b>Pošlete nám požiadavku</b><span>Značka, model, rozpočet a čo je pre Vás dôležité.</span></li>
                <li><b>Vyberieme vhodné autá</b><span>Do 24 hodín dostanete ponuky s fotkami, históriou a celkovou cenou.</span></li>
                <li><b>Vyberiete si a podpíšeme zmluvu</b><span>Auto kúpime na aukcii alebo u predajcu – nikdy nad Váš limit.</span></li>
                <li><b>Dovezieme ho až k Vám</b><span>Doprava, clo, homologizácia, STK a prihlásenie na slovenské značky.</span></li>
              </ol>
            </div>
            <div className="panel req-contact">
              <h3>Radšej telefonicky?</h3>
              <a href={`tel:${SITE.phone.replace(/\s/g, "")}`}><IPhone /><span><small>Zavolajte</small><b>{SITE.phone}</b></span></a>
              <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noopener"><IPhone /><span><small>WhatsApp</small><b>{SITE.phone}</b></span></a>
              <a href={`mailto:${SITE.email}`}><IMail /><span><small>E-mail</small><b>{SITE.email}</b></span></a>
            </div>
            <div className="panel">
              <h3>Chcete si najprv spočítať cenu?</h3>
              <p className="note" style={{ marginTop: 0 }}>V kalkulačke zistíte, koľko Vás bude stáť auto z konkrétneho štátu vrátane dopravy, cla a DPH.</p>
              <Link href="/kalkulacka-dovozu" className="rc-btn rc-btn--ghost rc-btn--sm">Kalkulačka dovozu</Link>
            </div>
          </aside>
        </div>
      </section>
      <section className="alt">
        <div className="wrap" style={{ maxWidth: 900 }}>
          <div className="sec-head"><div><span className="eyebrow">Otázky</span><h2 className="title">Auto na mieru – časté otázky</h2></div></div>
          <Faq items={FAQ_REQ} />
        </div>
      </section>
    </>
  );
}
