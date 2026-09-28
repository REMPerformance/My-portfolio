import type { Metadata } from "next";
import Link from "next/link";
import { getCalcConfig } from "@/lib/data";
import { calc } from "@/lib/calc";
import { eur } from "@/lib/format";
import { Calculator } from "@/components/Calculator";
import { PageHead, breadcrumbLd, faqLd, Faq } from "@/components/Sections";
import { JsonLd } from "@/components/JsonLd";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Kalkulačka dovozu auta – USA, Dubaj, Kanada | clo, DPH, doprava",
  description: "Spočítajte si, koľko stojí dovoz auta z USA, Dubaja (SAE), Kanady, Kórey či Japonska na Slovensko. Doprava podľa štátu a prístavu, clo 10 %, DPH 23 %, homologizácia a prihlásenie.",
  alternates: { canonical: "/kalkulacka-dovozu" },
  openGraph: { url: "/kalkulacka-dovozu" }
};

export default async function CalcPage() {
  const cfg = await getCalcConfig();
  const crumbs = [{ name: "Domov", path: "/" }, { name: "Kalkulačka dovozu", path: "/kalkulacka-dovozu" }];
  const ex = calc(cfg, { price: 10000, currency: "USD", country: "US", place: "TX", type: "car" });
  const faq = [
    { q: "Z čoho sa počíta clo pri dovoze auta z USA?", a: `Clo sa počíta z colnej hodnoty, teda z ceny auta, aukčných poplatkov a dopravy až na hranicu EÚ. Pri osobných autách je sadzba ${Math.round(cfg.dutyRate.car * 100)} %, pri pickupoch a úžitkových vozidlách až ${Math.round(cfg.dutyRate.truck * 100)} %.` },
    { q: "Koľko je DPH pri dovoze auta?", a: `DPH na Slovensku je ${Math.round(cfg.vatRate * 100)} %. Počíta sa z colnej hodnoty zvýšenej o clo a náklady na dopravu v rámci EÚ.` },
    { q: "Koľko stojí doprava auta z USA alebo z Dubaja?", a: "Odvoz do prístavu v USA stojí približne 250 až 1 300 USD podľa štátu, námorná preprava do Bremerhavenu 1 150 až 1 900 USD podľa prístavu. Z Dubaja (Džebel Ali) je námorná preprava približne 1 500 USD. Kamión z prístavu na Slovensko približne 650 €." },
    { q: "Je výsledok kalkulačky záväzný?", a: "Nie, ide o orientačný odhad. Presnú kalkuláciu ku konkrétnemu autu Vám pošleme pred kúpou." }
  ];
  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      <JsonLd data={faqLd(faq)} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebApplication", name: "Kalkulačka dovozu auta", url: `${SITE.url}/kalkulacka-dovozu`, applicationCategory: "FinanceApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: 0, priceCurrency: "EUR" } }} />
      <PageHead crumbs={crumbs} title={<>Kalkulačka dovozu auta</>} sub="Vyberte krajinu a štát, zadajte cenu auta a uvidíte všetky náklady: poplatky, dopravu, clo, DPH, homologizáciu aj náš poplatok." />
      <section style={{ paddingTop: 40 }}>
        <div className="wrap"><Calculator cfg={cfg} /></div>
      </section>
      <section className="alt">
        <div className="wrap legal">
          <h2>Ako sa počíta cena dovezeného auta</h2>
          <p>Príklad: auto vydražené za 10 000 USD stojí na slovenských značkách približne <b>{eur(ex.total)}</b> (bez opravy). Z toho clo tvorí {eur(ex.duty)} a DPH {eur(ex.vat)}.</p>
          <ol>
            <li><b>Cena auta</b> – vydražená alebo pevná cena, prepočítaná kurzom meny krajiny (USD, AED, CAD…) na EUR.</li>
            <li><b>Poplatky</b> – pri aukcii poplatok kupujúceho na Coparte či IAAI a broker, pri pevnej cene poplatky predajcu.</li>
            <li><b>Doprava do prístavu a námorná preprava</b> – podľa štátu či emirátu a najbližšieho prístavu, kontajner do Bremerhavenu vrátane poistenia.</li>
            <li><b>Clo</b> – {Math.round(cfg.dutyRate.car * 100)} % pri osobných autách z colnej hodnoty (auto + poplatky + doprava do EÚ).</li>
            <li><b>DPH {Math.round(cfg.vatRate * 100)} %</b> – z colnej hodnoty, cla a dopravy v rámci EÚ.</li>
            <li><b>Prístav, kamión a homologizácia</b> – vykládka, colný deklarant, doprava na Slovensko, úpravy, STK a EČV.</li>
            <li><b>Náš poplatok</b> – fixných {eur(cfg.serviceFeeEur)} za kompletné sprostredkovanie.</li>
          </ol>
          <p>Pripravené výpočty ku konkrétnym autám nájdete v <Link href="/ponuka">ponuke áut</Link>. Ak máte vlastný tip na auto, <Link href="/kontakt">pošlite nám odkaz</Link>.</p>
        </div>
      </section>
      <section>
        <div className="wrap">
          <div className="sec-head"><div><span className="eyebrow">FAQ</span><h2 className="title">Clo, DPH a doprava</h2></div></div>
          <Faq items={faq} />
        </div>
      </section>
    </>
  );
}
