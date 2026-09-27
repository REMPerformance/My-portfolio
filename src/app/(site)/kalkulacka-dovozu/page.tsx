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
  title: "Kalkulačka dovozu auta z USA – clo, DPH a doprava",
  description: "Spočítajte si, koľko stojí dovoz auta z USA na Slovensko. Kalkulačka zahŕňa cenu z aukcie Copart/IAAI, aukčné poplatky, dopravu, clo 10 %, DPH 23 %, homologizáciu a prihlásenie.",
  alternates: { canonical: "/kalkulacka-dovozu" },
  openGraph: { url: "/kalkulacka-dovozu" }
};

export default async function CalcPage() {
  const cfg = await getCalcConfig();
  const crumbs = [{ name: "Domov", path: "/" }, { name: "Kalkulačka dovozu", path: "/kalkulacka-dovozu" }];
  const ex = calc(cfg, { bidUsd: 10000, type: "car", region: "central", repairEur: 0 });
  const faq = [
    { q: "Z čoho sa počíta clo pri dovoze auta z USA?", a: `Clo sa počíta z colnej hodnoty, teda z ceny auta, aukčných poplatkov a dopravy až na hranicu EÚ. Pri osobných autách je sadzba ${Math.round(cfg.dutyRate.car * 100)} %, pri pickupoch a úžitkových vozidlách až ${Math.round(cfg.dutyRate.truck * 100)} %.` },
    { q: "Koľko je DPH pri dovoze auta?", a: `DPH na Slovensku je ${Math.round(cfg.vatRate * 100)} %. Počíta sa z colnej hodnoty zvýšenej o clo a náklady na dopravu v rámci EÚ.` },
    { q: "Koľko stojí doprava auta z USA?", a: "Doprava v USA z aukcie do prístavu stojí približne 450 až 900 USD podľa štátu. Námorná preprava v zdieľanom kontajneri do Bremerhavenu približne 1 150 až 1 900 USD. Kamión z prístavu na Slovensko približne 650 €." },
    { q: "Je výsledok kalkulačky záväzný?", a: "Nie, ide o orientačný odhad. Presnú kalkuláciu ku konkrétnemu autu Vám pošleme pred dražbou." }
  ];
  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      <JsonLd data={faqLd(faq)} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebApplication", name: "Kalkulačka dovozu auta z USA", url: `${SITE.url}/kalkulacka-dovozu`, applicationCategory: "FinanceApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: 0, priceCurrency: "EUR" } }} />
      <PageHead crumbs={crumbs} title={<>Kalkulačka <em>dovozu auta z USA</em></>} sub="Zadajte cenu z aukcie a uvidíte všetky náklady: aukčné poplatky, dopravu, clo, DPH, homologizáciu aj náš poplatok. Žiadne prekvapenia na konci." />
      <section style={{ paddingTop: 40 }}>
        <div className="wrap"><Calculator cfg={cfg} /></div>
      </section>
      <section className="alt">
        <div className="wrap legal">
          <h2>Ako sa počíta cena auta z USA</h2>
          <p>Príklad: auto vydražené za 10 000 USD stojí na slovenských značkách približne <b>{eur(ex.total)}</b> (bez opravy). Z toho clo tvorí {eur(ex.duty)} a DPH {eur(ex.vat)}.</p>
          <ol>
            <li><b>Cena na aukcii</b> – suma, za ktorú sa auto vydraží, prepočítaná kurzom USD/EUR.</li>
            <li><b>Aukčné poplatky</b> – poplatok kupujúceho na Coparte alebo IAAI, poplatky za bránu a sprostredkovanie brokera.</li>
            <li><b>Doprava v USA a námorná preprava</b> – odvoz z aukcie do prístavu a kontajner do Bremerhavenu vrátane poistenia.</li>
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
          <div className="sec-head"><div><span className="eyebrow">FAQ</span><h2 className="title">Clo, DPH a <em>doprava</em></h2></div></div>
          <Faq items={faq} />
        </div>
      </section>
    </>
  );
}
