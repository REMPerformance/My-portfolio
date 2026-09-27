import type { Metadata } from "next";
import Link from "next/link";
import { getCalcConfig } from "@/lib/data";
import { eur } from "@/lib/format";
import { Bonus, Faq, PageHead, Steps, Why, breadcrumbLd, faqLd } from "@/components/Sections";
import { JsonLd } from "@/components/JsonLd";
import { IArrow } from "@/components/Icons";
import { FAQ } from "@/lib/content";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Ako funguje dovoz auta z USA – postup krok za krokom",
  description: "Ako prebieha dovoz auta z amerických aukcií Copart a IAAI na Slovensko: výber auta, zmluva a záloha, dražba, námorná preprava, clo a DPH, homologizácia a prihlásenie. Termíny a náklady.",
  alternates: { canonical: "/ako-to-funguje" },
  openGraph: { url: "/ako-to-funguje" }
};

export default async function HowPage() {
  const cfg = await getCalcConfig();
  const crumbs = [{ name: "Domov", path: "/" }, { name: "Ako to funguje", path: "/ako-to-funguje" }];
  const faq = FAQ.filter((f) => /záloha|dlho|clo|prihlásiť|objednať|titul/i.test(f.q));
  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      <JsonLd data={faqLd(faq)} />
      <PageHead crumbs={crumbs} title={<>Ako funguje <em>dovoz auta z USA</em></>} sub="Od výberu auta na aukcii až po evidenčné čísla na Slovensku. Celý proces vybavíme za Vás a o každom kroku budete vedieť." />

      <section>
        <div className="wrap">
          <Steps />
        </div>
      </section>

      <section className="alt">
        <div className="wrap legal">
          <h2>1. Výber auta a odhad ceny</h2>
          <p>Auto si vyberiete z našej <Link href="/ponuka">aktuálnej ponuky</Link> alebo nám pošlete odkaz na ľubovoľné auto z aukcie Copart či IAAI. Ku každému autu pripravíme odhad celkovej ceny na slovenských značkách: cenu na aukcii, aukčné poplatky, dopravu v USA, námornú prepravu, clo, DPH, prístavné poplatky, kamión na Slovensko, homologizáciu, náš fixný poplatok a odhad opravy. Výpočet si môžete overiť aj v našej <Link href="/kalkulacka-dovozu">kalkulačke dovozu</Link>.</p>
          <p>Každé auto v ponuke má uvedený <b>termín uzávierky objednávok</b>, spravidla 24 hodín pred koncom aukcie. Do tohto termínu musí byť podpísaná zmluva a pripísaná záloha.</p>

          <h2>2. Zmluva o sprostredkovaní a záloha</h2>
          <p>Po odoslaní dopytu Vás kontaktujeme, potvrdíme detaily a pošleme zmluvu o sprostredkovaní. V nej je Váš <b>maximálny limit</b>, do ktorého za Vás prihadzujeme, a výška nášho poplatku. Zložíte zálohu {Math.round(cfg.depositPct * 100)} % z limitu, minimálne {eur(cfg.depositMinEur)}.</p>

          <h2>3. Dražba</h2>
          <p>V deň aukcie za Vás prihadzujeme cez overeného brokera. Nikdy neprekročíme limit zo zmluvy. Ak aukciu prehráme, zálohu Vám vrátime do 5 pracovných dní alebo ju presunieme na ďalšie auto.</p>
          <p>Ak aukciu vyhráme, pošleme Vám faktúru za auto a aukčné poplatky. Tie je potrebné uhradiť zvyčajne do 2 pracovných dní, pretože aukcie majú prísne termíny platby.</p>

          <h2>4. Doprava z USA a clo</h2>
          <p>Auto odvezieme z aukčného dvora do prístavu, naložíme do kontajnera a pošleme do Bremerhavenu alebo Rotterdamu. Námorná preprava trvá 3 až 6 týždňov. V prístave auto preclíme: platí sa clo (osobné autá {Math.round(cfg.dutyRate.car * 100)} %, pickupy a úžitkové až {Math.round(cfg.dutyRate.truck * 100)} %) a {Math.round(cfg.vatRate * 100)} % DPH. Následne auto privezieme kamiónom na Slovensko.</p>

          <h2>5. Oprava, homologizácia a prihlásenie</h2>
          <p>Ak si to želáte, auto dáme opraviť u overených partnerov podľa vopred schválenej cenovej ponuky. Potom zabezpečíme úpravy na európske predpisy (svetlá, smerovky), individuálne schválenie vozidla, technickú a emisnú kontrolu a evidenčné čísla. Auto Vám odovzdáme pripravené na cestu spolu s kreditom do <a href="https://racem.sk" target="_blank" rel="noopener">RACEM.sk</a>.</p>

          <table>
            <thead><tr><th>Krok</th><th>Obvyklý čas</th></tr></thead>
            <tbody>
              <tr><td>Dopyt → zmluva a záloha</td><td>1 – 2 dni</td></tr>
              <tr><td>Aukcia → vyzdvihnutie auta</td><td>3 – 10 dní</td></tr>
              <tr><td>Námorná preprava do EÚ</td><td>3 – 6 týždňov</td></tr>
              <tr><td>Preclenie a doprava na Slovensko</td><td>5 – 10 dní</td></tr>
              <tr><td>Oprava, homologizácia, EČV</td><td>2 – 6 týždňov</td></tr>
            </tbody>
          </table>
          <div className="actions">
            <Link href="/ponuka" className="rc-btn rc-btn--primary">Vybrať auto <IArrow /></Link>
            <Link href="/kalkulacka-dovozu" className="rc-btn rc-btn--ghost">Spočítať dovoz</Link>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="sec-head"><div><span className="eyebrow">Prečo cez nás</span><h2 className="title">Férovo a <em>otvorene</em></h2></div></div>
          <Why />
        </div>
      </section>

      <Bonus />

      <section>
        <div className="wrap">
          <div className="sec-head"><div><span className="eyebrow">FAQ</span><h2 className="title">Otázky k <em>postupu</em></h2></div></div>
          <Faq items={faq} />
        </div>
      </section>
    </>
  );
}
