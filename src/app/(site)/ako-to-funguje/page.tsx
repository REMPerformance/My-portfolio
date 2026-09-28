import type { Metadata } from "next";
import Link from "next/link";
import { getCalcConfig, getContent } from "@/lib/data";
import { eur } from "@/lib/format";
import { Bonus, PageHead, Steps, Why, breadcrumbLd } from "@/components/Sections";
import { JsonLd } from "@/components/JsonLd";
import { IArrow } from "@/components/Icons";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Ako funguje dovoz auta zo zahraničia – postup krok za krokom",
  description: "Ako prebieha dovoz auta z USA, Dubaja, Kanady či Kórey na Slovensko: výber auta, zmluva a záloha, kúpa, námorná preprava, clo a DPH, homologizácia a prihlásenie. Termíny a náklady.",
  alternates: { canonical: "/ako-to-funguje" },
  openGraph: { url: "/ako-to-funguje" }
};

export default async function HowPage() {
  const [cfg, ct] = await Promise.all([getCalcConfig(), getContent()]);
  const crumbs = [{ name: "Domov", path: "/" }, { name: "Ako to funguje", path: "/ako-to-funguje" }];
  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      <PageHead crumbs={crumbs} title={<>Ako funguje dovoz auta</>} sub="Od výberu auta až po evidenčné čísla na Slovensku. Celý proces vybavíme za Vás a o každom kroku budete vedieť." />

      <section>
        <div className="wrap">
          <Steps items={ct.steps} />
        </div>
      </section>

      <section className="alt">
        <div className="wrap legal">
          <h2>1. Výber auta a odhad ceny</h2>
          <p>Auto si vyberiete z našej <Link href="/ponuka">aktuálnej ponuky</Link> alebo nám pošlete odkaz na ľubovoľné auto – z aukcií Copart a IAAI v USA, od dealera v Dubaji, Kanade či Kórei. Ku každému autu pripravíme celkovú cenu na slovenských značkách: cenu auta, poplatky, dopravu do prístavu, námornú prepravu, clo, DPH, prístavné poplatky, kamión na Slovensko, homologizáciu, náš fixný poplatok a odhad opravy. Výpočet si môžete overiť aj v našej <Link href="/kalkulacka-dovozu">kalkulačke dovozu</Link>.</p>
          <p>Autá z aukcie majú uvedený <b>termín uzávierky objednávok</b>, spravidla 24 hodín pred koncom aukcie. Autá za pevnú cenu majú uvedené, dokedy ponuka platí.</p>

          <h2>2. Zmluva o sprostredkovaní a záloha</h2>
          <p>Po odoslaní dopytu Vás kontaktujeme, potvrdíme detaily a pošleme zmluvu o sprostredkovaní. V nej je Váš <b>maximálny limit</b>, do ktorého za Vás prihadzujeme, a výška nášho poplatku. Zložíte zálohu {Math.round(cfg.depositPct * 100)} % z limitu, minimálne {eur(cfg.depositMinEur)}.</p>

          <h2>3. Kúpa auta</h2>
          <p><b>Aukcia:</b> v deň aukcie za Vás prihadzujeme cez overeného brokera, nikdy nad limit zo zmluvy. Ak aukciu prehráme, zálohu vrátime do 5 pracovných dní alebo ju presunieme na ďalšie auto.</p>
          <p><b>Pevná cena:</b> auto kúpime od predajcu za dohodnutú sumu. Ak ho predajca medzitým predá inému, zálohu vrátime.</p>
          <p>Po kúpe Vám pošleme faktúru za auto a poplatky. Uhrádza sa zvyčajne do 2 pracovných dní.</p>

          <h2>4. Doprava a clo</h2>
          <p>Auto odvezieme do najbližšieho prístavu (napr. Newark, Houston, Los Angeles, Džebel Ali v Dubaji), naložíme do kontajnera a pošleme do Bremerhavenu alebo Rotterdamu. Námorná preprava trvá 3 až 6 týždňov. V prístave auto preclíme: platí sa clo (osobné autá {Math.round(cfg.dutyRate.car * 100)} %, pickupy a úžitkové až {Math.round(cfg.dutyRate.truck * 100)} %) a {Math.round(cfg.vatRate * 100)} % DPH. Následne auto privezieme kamiónom na Slovensko.</p>

          <h2>5. Oprava, homologizácia a prihlásenie</h2>
          <p>Ak si to želáte, auto dáme opraviť u overených partnerov podľa vopred schválenej cenovej ponuky. Potom zabezpečíme úpravy na európske predpisy (svetlá, smerovky), individuálne schválenie vozidla, technickú a emisnú kontrolu a evidenčné čísla. Auto Vám odovzdáme pripravené na cestu spolu s kreditom do <a href="https://racem.sk" target="_blank" rel="noopener">RACEM.sk</a>.</p>

          <table>
            <thead><tr><th>Krok</th><th>Obvyklý čas</th></tr></thead>
            <tbody>
              <tr><td>Dopyt → zmluva a záloha</td><td>1 – 2 dni</td></tr>
              <tr><td>Kúpa → vyzdvihnutie auta</td><td>3 – 10 dní</td></tr>
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
          <div className="sec-head"><div><span className="eyebrow">Prečo cez nás</span><h2 className="title">Férovo a otvorene</h2></div></div>
          <Why items={ct.why} risk={ct.risk} />
        </div>
      </section>

      <Bonus b={ct.bonus} />

    </>
  );
}
