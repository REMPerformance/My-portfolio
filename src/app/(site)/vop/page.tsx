import type { Metadata } from "next";
import Link from "next/link";
import { PageHead, breadcrumbLd } from "@/components/Sections";
import { JsonLd } from "@/components/JsonLd";
import { SITE } from "@/lib/site";
import { getCalcConfig } from "@/lib/data";
import { eur } from "@/lib/format";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Všeobecné obchodné podmienky – sprostredkovanie dovozu áut",
  description: "Všeobecné obchodné podmienky služby REM Performance – sprostredkovanie kúpy a dovozu vozidiel z amerických aukcií Copart a IAAI na Slovensko.",
  alternates: { canonical: "/vop" },
  openGraph: { url: "/vop" }
};

const EFFECTIVE = "27. 9. 2026";

export default async function Vop() {
  const cfg = await getCalcConfig();
  const c = SITE.company;
  const crumbs = [{ name: "Domov", path: "/" }, { name: "Obchodné podmienky", path: "/vop" }];
  const sections = [
    ["uvod", "Úvodné ustanovenia"], ["pojmy", "Pojmy"], ["sluzba", "Predmet služby"], ["zmluva", "Uzatvorenie zmluvy"],
    ["cena", "Cena a platby"], ["drazba", "Dražba a limit"], ["stav", "Stav vozidla"], ["doprava", "Doprava, clo, homologizácia"],
    ["odstupenie", "Odstúpenie od zmluvy"], ["kredit", "Kredit RACEM"], ["reklamacie", "Reklamácie a sťažnosti"], ["zaver", "Záverečné ustanovenia"]
  ];
  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      <PageHead crumbs={crumbs} title={<>Obchodné <em>podmienky</em></>} sub={`Všeobecné obchodné podmienky služby sprostredkovania kúpy a dovozu vozidiel. Platné od ${EFFECTIVE}.`} />
      <section style={{ paddingTop: 40 }}>
        <div className="wrap legal">
          <nav className="toc" aria-label="Obsah">
            {sections.map(([id, t], i) => <a key={id} href={`#${id}`}>{i + 1}. {t}</a>)}
          </nav>

          <h2 id="uvod">1. Úvodné ustanovenia</h2>
          <p>Tieto všeobecné obchodné podmienky (ďalej len „VOP“) upravujú práva a povinnosti medzi poskytovateľom služby a klientom pri sprostredkovaní kúpy a dovozu vozidiel z aukcií v Spojených štátoch amerických prostredníctvom webovej stránky {SITE.url.replace("https://", "")}.</p>
          <p><b>Poskytovateľ:</b> {c.name}, so sídlom {c.street}, {c.zip} {c.city}, IČO: {c.ico}, IČ DPH: {c.icDph}, zapísaný: {c.register}. Kontakt: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.</p>
          <p>Orgán dozoru: Slovenská obchodná inšpekcia, Inšpektorát SOI pre Bratislavský kraj, Bajkalská 21/A, 827 99 Bratislava.</p>

          <h2 id="pojmy">2. Pojmy</h2>
          <ul>
            <li><b>Klient</b> – fyzická alebo právnická osoba, ktorá si objedná službu. Ak klient nekoná v rámci svojej podnikateľskej činnosti, je <b>spotrebiteľom</b>.</li>
            <li><b>Aukcia</b> – online aukcia vozidiel prevádzkovaná tretou stranou, najmä Copart, Inc. alebo IAA, Inc. (IAAI).</li>
            <li><b>Broker</b> – registrovaný partner aukcie, prostredníctvom ktorého poskytovateľ prihadzuje.</li>
            <li><b>Limit</b> – maximálna suma v USD, do ktorej je poskytovateľ oprávnený za klienta prihadzovať.</li>
            <li><b>Uzávierka objednávok</b> – termín uvedený pri vozidle, do ktorého musí byť uzatvorená zmluva a pripísaná záloha.</li>
            <li><b>Vozidlo za pevnú cenu</b> – vozidlo, ktoré predajca (napr. dealer alebo aukcia v režime „Buy Now“) predáva za vopred určenú cenu bez dražby.</li>
            <li><b>Odhad ceny</b> – orientačný výpočet celkovej ceny vozidla na slovenských evidenčných číslach.</li>
          </ul>

          <h2 id="sluzba">3. Predmet služby</h2>
          <p>Poskytovateľ pre klienta za odplatu zabezpečuje najmä: vyhľadanie a posúdenie vozidla, účasť na aukcii a prihadzovanie do výšky limitu, úhradu vozidla a poplatkov aukcii z prostriedkov klienta, dopravu z aukcie do prístavu, námornú prepravu do EÚ, colné konanie, dopravu na Slovensko a na základe osobitnej dohody opravu, homologizáciu, technickú a emisnú kontrolu a prihlásenie vozidla do evidencie.</p>
          <p>Poskytovateľ <b>nie je predávajúcim vozidla</b>. Vozidlo kupuje klient, resp. poskytovateľ v mene a na účet klienta. Poskytovateľ nie je prevádzkovateľom aukcií ani s nimi nie je obchodne prepojený.</p>

          <h2 id="zmluva">4. Uzatvorenie zmluvy</h2>
          <ol>
            <li>Odoslanie formulára na webe je <b>nezáväzný dopyt</b>. Nevzniká ním zmluva ani povinnosť platby.</li>
            <li>Na základe dopytu poskytovateľ klientovi zašle kalkuláciu a návrh zmluvy o sprostredkovaní (ďalej len „zmluva“), ktorá obsahuje identifikáciu vozidla, limit, výšku poplatku a zálohy.</li>
            <li>Zmluva je uzatvorená jej podpisom oboma stranami (aj elektronicky) a pripísaním zálohy na účet poskytovateľa.</li>
            <li>Zmluvu k vozidlu z ponuky je možné uzatvoriť najneskôr do <b>uzávierky objednávok</b> uvedenej pri vozidle. Po uzávierke poskytovateľ objednávky na dané vozidlo neprijíma.</li>
            <li>Tieto VOP sú neoddeliteľnou súčasťou zmluvy. Odchylné dojednania v zmluve majú prednosť pred VOP.</li>
          </ol>

          <h2 id="cena">5. Cena a platobné podmienky</h2>
          <ol>
            <li>Odmena poskytovateľa je <b>fixný poplatok</b> uvedený v zmluve (štandardne {eur(cfg.serviceFeeEur)} vrátane DPH). Poplatok nie je závislý od ceny vozidla.</li>
            <li>Klient pred aukciou zloží <b>zálohu</b> vo výške {Math.round(cfg.depositPct * 100)} % z limitu, minimálne {eur(cfg.depositMinEur)}.</li>
            <li>Ak je aukcia úspešná, klient uhradí cenu vozidla a aukčné poplatky do <b>2 pracovných dní</b> od výzvy, keďže aukcie vyžadujú platbu v krátkych lehotách. Záloha sa započíta.</li>
            <li>Ostatné náklady (doprava, clo, DPH, prístavné poplatky, homologizácia, oprava) klient uhrádza podľa priebežných faktúr v zmysle zmluvy. Clo a DPH sú určené colným úradom a môžu sa líšiť od odhadu.</li>
            <li><b>Všetky ceny na webe sú orientačné odhady</b> a nie sú návrhom na uzavretie zmluvy. Výsledná cena závisí najmä od vydraženej ceny, kurzu USD/EUR, colného zatriedenia a skutočného rozsahu opravy.</li>
            <li>Ak klient neuhradí cenu vydraženého vozidla včas a aukcia zruší predaj, klient znáša pokuty a náklady účtované aukciou a brokerom (relist fee a pod.). Tieto môžu byť započítané so zálohou.</li>
          </ol>

          <h2 id="drazba">6. Priebeh dražby a limit</h2>
          <ol>
            <li>Poskytovateľ prihadzuje najviac do výšky limitu. Limit nezahŕňa aukčné poplatky, ktoré sa pripočítavajú k vydraženej cene.</li>
            <li>Poskytovateľ nezaručuje úspech v aukcii. Ak vozidlo nie je vydražené do limitu, poskytovateľ klientovi <b>vráti zálohu do 5 pracovných dní</b> alebo ju na žiadosť klienta použije na iné vozidlo.</li>
            <li>Aukcia môže predaj zrušiť, presunúť alebo stiahnuť vozidlo z ponuky. Poskytovateľ za tieto rozhodnutia nezodpovedá.</li>
            <li>Pri <b>vozidle za pevnú cenu</b> sa dražba nekoná. Cena vozidla je určená predajcom a uvedená pri vozidle; náklady na dovoz sú aj v tomto prípade odhadom. Predajca môže vozidlo medzičasom predať inému kupujúcemu alebo zmeniť cenu – ak k tomu dôjde pred kúpou, poskytovateľ klientovi <b>vráti zálohu do 5 pracovných dní</b> alebo ju na žiadosť klienta použije na iné vozidlo.</li>
          </ol>

          <h2 id="stav">7. Stav vozidla a zodpovednosť</h2>
          <ol>
            <li>Vozidlá z aukcií sa predávajú v stave <b>„ako stoja a ležia“ (as is)</b>, spravidla ako poškodené vozidlá so salvage titulom. Aukcia neposkytuje záruku a vozidlo nie je možné pred kúpou vyskúšať.</li>
            <li>Informácie o vozidle (najazdené kilometre, poškodenie, funkčnosť, výbava) pochádzajú od aukcie a z fotografií. Poskytovateľ ich posudzuje s odbornou starostlivosťou, no nezodpovedá za skryté vady ani za nepravdivé údaje aukcie.</li>
            <li>Nákres poškodenia a odhad opravy na webe sú orientačné a vychádzajú z dostupných fotografií.</li>
            <li>Poskytovateľ zodpovedá za škodu spôsobenú porušením svojich povinností zo zmluvy. Za poškodenie počas prepravy zodpovedá dopravca; vozidlo je počas námornej prepravy poistené v rozsahu zmluvy.</li>
          </ol>

          <h2 id="doprava">8. Doprava, clo a homologizácia</h2>
          <ol>
            <li>Uvedené termíny (spravidla 6 až 10 týždňov) sú orientačné. Poskytovateľ nezodpovedá za oneskorenie spôsobené prístavmi, dopravcami, colnými orgánmi ani vyššou mocou.</li>
            <li>Colné zatriedenie a výšku cla určuje colný úrad. Osobné vozidlá majú spravidla clo 10 %, pickupy a úžitkové vozidlá môžu mať 22 %.</li>
            <li>Schválenie vozidla na prevádzku v SR závisí od rozhodnutia príslušných orgánov. Ak vozidlo nie je možné schváliť, poskytovateľ klienta vopred upozorní na známe riziká pri konkrétnom modeli.</li>
          </ol>

          <h2 id="odstupenie">9. Odstúpenie od zmluvy</h2>
          <ol>
            <li>Klient – spotrebiteľ má právo odstúpiť od zmluvy uzavretej na diaľku bez udania dôvodu do <b>14 dní</b> od jej uzavretia, a to oznámením na <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.</li>
            <li>Klient berie na vedomie, že na jeho výslovnú žiadosť začne poskytovateľ poskytovať službu pred uplynutím lehoty na odstúpenie (prihadzovanie v aukcii). Ak klient odstúpi po začatí poskytovania služby, uhradí pomernú časť ceny za už poskytnuté plnenie.</li>
            <li>Po úspešnom vydražení vozidla je kúpa pre klienta záväzná voči aukcii. Náklady, pokuty a poplatky, ktoré vzniknú v dôsledku odstúpenia po vydražení, znáša klient.</li>
            <li>Poskytovateľ môže od zmluvy odstúpiť, ak klient neuhradí zálohu alebo cenu vozidla v dohodnutej lehote.</li>
          </ol>

          <h2 id="kredit">10. Kredit RACEM</h2>
          <p>Pri odovzdaní vozidla klient získa jednorazový kredit do e-shopu <a href={SITE.racemUrl} target="_blank" rel="noopener">RACEM.sk</a> vo výške podľa celkovej ceny vozidla (200 €, 400 € alebo 700 €). Kredit má formu zľavového kódu, platí 12 mesiacov od odovzdania, nie je vymeniteľný za hotovosť a nevzniká naň nárok, ak zmluva zanikne pred odovzdaním vozidla.</p>

          <h2 id="reklamacie">11. Reklamácie a sťažnosti</h2>
          <p>Reklamácie služby a sťažnosti môže klient uplatniť e-mailom na <a href={`mailto:${SITE.email}`}>{SITE.email}</a>. Poskytovateľ ich vybaví bez zbytočného odkladu, najneskôr do 30 dní. Spotrebiteľ má právo obrátiť sa na poskytovateľa so žiadosťou o nápravu a v prípade nespokojnosti podať návrh na alternatívne riešenie sporu subjektu ARS, najmä Slovenskej obchodnej inšpekcii (<a href="https://www.soi.sk" target="_blank" rel="noopener">www.soi.sk</a>).</p>

          <h2 id="zaver">12. Záverečné ustanovenia</h2>
          <ol>
            <li>Spracúvanie osobných údajov upravujú <Link href="/ochrana-osobnych-udajov">Zásady ochrany osobných údajov</Link>.</li>
            <li>Právne vzťahy sa riadia právom Slovenskej republiky, najmä Občianskym zákonníkom, Obchodným zákonníkom a predpismi na ochranu spotrebiteľa.</li>
            <li>Poskytovateľ môže VOP zmeniť. Na zmluvy uzatvorené pred zmenou sa použije znenie platné v čase ich uzatvorenia.</li>
            <li>Tieto VOP nadobúdajú platnosť a účinnosť dňa {EFFECTIVE}.</li>
          </ol>
        </div>
      </section>
    </>
  );
}
