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
  description: "Spočítajte si, koľko stojí dovoz auta z USA, Dubaja (SAE), Kanady, Kórey či Japonska na Slovensko. Doprava podľa štátu a prístavu, clo 10 %, DPH podľa prístavu v EÚ (od 19 %), schválenie a prihlásenie.",
  alternates: { canonical: "/kalkulacka-dovozu" },
  openGraph: { url: "/kalkulacka-dovozu" }
};

export default async function CalcPage() {
  const cfg = await getCalcConfig();
  const crumbs = [{ name: "Domov", path: "/" }, { name: "Kalkulačka dovozu", path: "/kalkulacka-dovozu" }];
  const ex = calc(cfg, { price: 10000, currency: "USD", country: "US", place: "TX", type: "car", reserve: false });
  const faq = [
    { q: "Z čoho sa počíta clo pri dovoze auta z USA?", a: `Clo sa počíta z colnej hodnoty, teda z ceny auta, aukčných poplatkov a dopravy až na hranicu EÚ. Pri osobných autách je sadzba ${Math.round(cfg.dutyRate.car * 100)} %, pri pickupoch a úžitkových vozidlách až ${Math.round(cfg.dutyRate.truck * 100)} %.` },
    { q: "Koľko je DPH pri dovoze auta?", a: "DPH pri dovoze sa platí v krajine, kde sa auto preclí, z colnej hodnoty zvýšenej o clo a dopravu. Pri preclení v Nemecku (Bremerhaven) je to 19 %, v Holandsku a Belgicku 21 %, v Slovinsku 22 % a na Slovensku 23 %. Prístav si vyberiete v kalkulačke." },
    { q: "Koľko stojí doprava auta z USA alebo z Dubaja?", a: "Odvoz do prístavu v USA stojí približne 250 až 1 300 USD podľa štátu. Námorná preprava vychádza od 260 do 3 100 USD na vozidlo podľa prístavu odoslania, prístavu v EÚ a spôsobu nakládky (zdieľaný kontajner, RoRo). Autoprepravník z prístavu na Slovensko stojí podľa prístavu približne 1 150 € z Bremerhavenu a 1 890 € z Rotterdamu." },
    { q: "Je výsledok kalkulačky záväzný?", a: "Nie, ide o orientačný odhad. Presnú kalkuláciu ku konkrétnemu autu Vám pošleme pred kúpou." }
  ];
  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      <JsonLd data={faqLd(faq)} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebApplication", name: "Kalkulačka dovozu auta", url: `${SITE.url}/kalkulacka-dovozu`, applicationCategory: "FinanceApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: 0, priceCurrency: "EUR" } }} />
      <PageHead crumbs={crumbs} title={<>Kalkulačka dovozu auta</>} sub="Vyberte krajinu a štát, zadajte cenu auta a uvidíte všetky náklady: poplatky, dopravu, clo, DPH, schválenie a prihlásenie." />
      <section style={{ paddingTop: 40 }}>
        <div className="wrap"><Calculator cfg={cfg} hideFee /></div>
      </section>
      <section className="alt">
        <div className="wrap legal">
          <h2>Ako sa počíta cena dovezeného auta</h2>
          <p>Príklad: auto vydražené za 10 000 USD stojí na slovenských značkách približne <b>{eur(ex.gross)}</b> (bez opravy, preclenie v krajine {ex.euPortCountry}). Z toho clo tvorí {eur(ex.duty)} a DPH pri dovoze {eur(ex.importVat)}.</p>
          <ol>
            <li><b>Cena auta</b>: vydražená alebo pevná cena, prepočítaná aktuálnym kurzom ECB na EUR.</li>
            <li><b>Poplatky</b>: pri aukcii poplatok kupujúceho a sprostredkovateľa, pri pevnej cene poplatky predajcu.</li>
            <li><b>Doprava do prístavu, námorná preprava a poistenie</b>: podľa štátu či emirátu, najbližšieho prístavu a prístavu v EÚ, ktorý si vyberiete.</li>
            <li><b>Clo</b>: {Math.round(cfg.dutyRate.car * 100)} % pri osobných autách z colnej hodnoty (auto, poplatky, doprava do EÚ a poistenie). Pri aute s dokladom o pôvode z USA, Kórey alebo Japonska môže byť 0 %. Na elektromobily z Číny sa platí aj vyrovnávacie clo EÚ.</li>
            <li><b>DPH pri dovoze</b>: platí sa v krajine preclenia z colnej hodnoty, cla a dopravy. Nemecko 19 %, Holandsko a Belgicko 21 %, Slovinsko 22 %, Slovensko 23 %.</li>
            <li><b>Prístav a Slovensko</b>: vykládka, colný deklarant, doprava na Slovensko a jedna položka za schválenie a prihlásenie (úradné preklady, technické kontroly, schválenie s úpravami, recyklačný poplatok, zápis a EČV).</li>
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
