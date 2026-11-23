import type { Metadata } from "next";
import Link from "next/link";
import { PageHead, breadcrumbLd } from "@/components/Sections";
import { JsonLd } from "@/components/JsonLd";
import { SITE } from "@/lib/site";
import { getCalcConfig } from "@/lib/data";
import { depositTiersText } from "@/lib/calc";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Všeobecné obchodné podmienky: dovoz áut na objednávku",
  description: "Všeobecné obchodné podmienky služby REM Performance: obstaranie, dovoz, preclenie, schválenie a prihlásenie vozidiel z USA, Kanady, Kórey, Japonska, Číny, SAE a EÚ na Slovensko.",
  alternates: { canonical: "/vop" },
  openGraph: { url: "/vop" }
};

const EFFECTIVE = "24. 11. 2026";

export default async function Vop() {
  const cfg = await getCalcConfig();
  const c = SITE.company;
  const mail = <a href={`mailto:${SITE.email}`}>{SITE.email}</a>;
  const crumbs = [{ name: "Domov", path: "/" }, { name: "Obchodné podmienky", path: "/vop" }];
  const sections = [
    ["uvod", "Úvodné ustanovenia"], ["pojmy", "Pojmy"], ["sluzba", "Predmet služby"], ["zmluva", "Uzatvorenie zmluvy"],
    ["odhad", "Cena je vždy odhad"], ["platby", "Záloha a platby"], ["kupa", "Dražba a kúpa vozidla"], ["stav", "Stav vozidla"],
    ["preprava", "Preprava, poistenie a vlastníctvo"], ["clo", "Clo, schválenie a prihlásenie"], ["zodpovednost", "Zodpovednosť a vyššia moc"],
    ["odstupenie", "Odstúpenie od zmluvy"], ["sankcie", "Zmluvná pokuta a zádržné právo"], ["kredit", "Kredit RACEM"],
    ["reklamacie", "Reklamácie a sťažnosti"], ["komunikacia", "Komunikácia a osobné údaje"], ["zaver", "Záverečné ustanovenia"], ["formular", "Formulár na odstúpenie"]
  ];
  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      <PageHead crumbs={crumbs} title={<>Obchodné podmienky</>} sub={`Všeobecné obchodné podmienky služby obstarania a dovozu vozidiel na objednávku. Platné a účinné od ${EFFECTIVE}.`} />
      <section style={{ paddingTop: 40 }}>
        <div className="wrap legal">
          <nav className="toc" aria-label="Obsah">
            {sections.map(([id, t], i) => <a key={id} href={`#${id}`}>{i + 1}. {t}</a>)}
          </nav>

          <h2 id="uvod">1. Úvodné ustanovenia</h2>
          <ol>
            <li>Tieto všeobecné obchodné podmienky (ďalej len „VOP“) upravujú práva a povinnosti poskytovateľa a klienta pri obstaraní, kúpe, preprave, colnom konaní, schválení a prihlásení vozidiel dovážaných na objednávku z krajín mimo Slovenska, najmä z USA, Kanady, Južnej Kórey, Japonska, Číny, Spojených arabských emirátov a z krajín Európskej únie, prostredníctvom webovej stránky {SITE.url.replace("https://", "")}, e-mailu alebo telefónu.</li>
            <li><b>Poskytovateľ:</b> {c.name}, miesto podnikania {c.street}, {c.zip} {c.city}, IČO: {c.ico}{c.dic ? `, DIČ: ${c.dic}` : ""}, IČ DPH: {c.icDph}, zapísaný: {c.register}. Poskytovateľ <b>nie je platiteľom DPH</b>. Kontakt: {mail}, telefón {SITE.phone}.</li>
            <li>Orgán dozoru: Slovenská obchodná inšpekcia, Inšpektorát SOI pre Bratislavský kraj, Bajkalská 21/A, 827 99 Bratislava.</li>
            <li>VOP sú neoddeliteľnou súčasťou každej zmluvy medzi poskytovateľom a klientom. Ustanovenia zmluvy majú prednosť pred VOP.</li>
          </ol>

          <h2 id="pojmy">2. Pojmy</h2>
          <ul>
            <li><b>Klient</b> je fyzická alebo právnická osoba, ktorá si objedná službu. Klient, ktorý pri uzatváraní zmluvy nekoná v rámci svojej podnikateľskej činnosti alebo povolania, je <b>spotrebiteľ</b>. Ostatní klienti sú <b>podnikatelia</b>.</li>
            <li><b>Zmluva</b> je písomná zmluva o obstaraní, dovoze a dodaní vozidla uzatvorená medzi poskytovateľom a klientom.</li>
            <li><b>Predajca</b> je tretia osoba, od ktorej sa vozidlo kupuje, najmä prevádzkovateľ aukcie, jeho sprostredkovateľ, autobazár, predajca alebo súkromná osoba v krajine pôvodu vozidla.</li>
            <li><b>Limit</b> je maximálna suma, do ktorej je poskytovateľ oprávnený za klienta prihadzovať na aukcii. Limit nezahŕňa poplatky aukcie a jej sprostredkovateľa.</li>
            <li><b>Vozidlo za pevnú cenu</b> je vozidlo, ktoré predajca predáva za ním určenú cenu bez dražby, vrátane vozidiel v ponuke „Ihneď z Kórey“.</li>
            <li><b>Odhad ceny</b> je orientačný výpočet nákladov na vozidlo a jeho dovoz, pripravený podľa údajov dostupných v čase jeho vyhotovenia.</li>
            <li><b>Záloha</b> je suma, ktorú klient zloží po podpise zmluvy ako rezervu na nepredvídané náklady a ako zábezpeku podľa článku 6.</li>
          </ul>

          <h2 id="sluzba">3. Predmet služby</h2>
          <ol>
            <li>Poskytovateľ pre klienta za odplatu zabezpečuje podľa zmluvy najmä vyhľadanie a posúdenie vozidla, účasť na aukcii alebo kúpu vozidla za pevnú cenu, úhradu vozidla a poplatkov predajcovi z prostriedkov klienta, prepravu do prístavu, námornú a pozemnú prepravu, colné konanie prostredníctvom colného deklaranta a podľa dohody opravu, schválenie vozidla, technickú a emisnú kontrolu a prihlásenie do evidencie vozidiel.</li>
            <li>Poskytovateľ <b>nie je predávajúcim vozidla</b>, nie je prevádzkovateľom aukcie ani s predajcami nie je majetkovo prepojený. Ak zmluva neurčuje inak, poskytovateľ kupuje vozidlo vo vlastnom mene a na účet klienta.</li>
            <li>Ak zmluva neurčuje inak, <b>dovozcom vozidla je klient</b>. Colné vyhlásenie sa podáva v jeho mene a clo a dovoznú DPH platí klient priamo colnému úradu.</li>
            <li>Poskytovateľ pri plnení využíva tretie osoby (predajcov, sprostredkovateľov aukcií, prepravcov, prístavy, colných deklarantov, servisy, technické služby a stanice technickej kontroly). Za ich rozhodnutia a postupy poskytovateľ zodpovedá len v rozsahu článku 11.</li>
          </ol>

          <h2 id="zmluva">4. Uzatvorenie zmluvy</h2>
          <ol>
            <li>Odoslanie formulára na webe, správy alebo e-mailu je <b>nezáväzný dopyt</b>. Nevzniká ním zmluva ani povinnosť platby.</li>
            <li>Na základe dopytu poskytovateľ klientovi zašle cenovú ponuku s odhadom ceny. Ponuka, údaje na webe a výsledky kalkulačky <b>nie sú návrhom na uzavretie zmluvy</b> a nezaväzujú poskytovateľa k dodaniu vozidla za uvedenú sumu.</li>
            <li>Zmluva vzniká jej podpisom oboma stranami, a to aj elektronicky alebo výmenou naskenovaných podpísaných rovnopisov. Pred pripísaním zálohy poskytovateľ na aukcii neprihadzuje ani vozidlo nekupuje.</li>
            <li>Zmluvu k vozidlu z ponuky je možné uzatvoriť najneskôr do uzávierky objednávok uvedenej pri vozidle. Poskytovateľ nemusí uzatvoriť zmluvu s nikým, najmä ak vozidlo medzičasom predajca predal, stiahol alebo zmenil jeho cenu.</li>
          </ol>

          <h2 id="odhad">5. Cena je vždy odhad</h2>
          <ol>
            <li><b>Všetky ceny a sumy</b> uvedené na webe, v kalkulačke, v e-mailoch, v cenových ponukách, v zmluve a v jej prílohách <b>sú odhadom</b> ku dňu ich vyhotovenia. Nejde o pevnú, záväznú ani konečnú cenu.</li>
            <li>Skutočná cena sa môže <b>znížiť aj zvýšiť</b>. Závisí najmä od sumy, za ktorú sa vozidlo vydraží alebo kúpi, od skutočných poplatkov predajcu, aukcie a jej sprostredkovateľa, od kurzu mien a poplatkov bánk a platobných služieb, od skutočnej ceny prepravy, prístavných a manipulačných poplatkov, skladného a zdržného, od colnej hodnoty, colného zatriedenia a sadzieb cla a dane, od skutočného stavu vozidla a rozsahu opravy, od požiadaviek pri schválení vozidla a od zmeny právnych predpisov alebo úradných poplatkov.</li>
            <li>Klient hradí skutočné náklady spojené s vozidlom. Ak sú vyššie ako odhad, rozdiel klient doplatí. Ak sú nižšie, rozdiel sa klientovi zníži alebo vráti. Poskytovateľ klienta o zmene nákladu informuje bez zbytočného odkladu a na požiadanie ju doloží dokladom.</li>
            <li>Náklady platené v cudzej mene sa prepočítavajú kurzom banky alebo platobnej služby v deň platby. Odhad počíta s referenčným kurzom Európskej centrálnej banky navýšeným o 2 % a s poplatkom za každú zahraničnú platbu. Kurzové rozdiely a poplatky za konverziu a prevod znáša klient.</li>
            <li>Odplata poskytovateľa je súčasťou ceny služieb uvedenej v cenovej ponuke a v zmluve.</li>
            <li>Poskytovateľ nie je platiteľom DPH a k jeho službám sa DPH nepripočítava. Ak sa poskytovateľ stane platiteľom DPH pred dodaním vozidla, pripočíta DPH k tej časti ceny, pri ktorej mu vznikne daňová povinnosť.</li>
            <li>Clo a dovoznú DPH vyrubuje colný úrad. Ich odhad je orientačný a poskytovateľ zaň nezodpovedá. Ak colný úrad uplatní nižšiu sadzbu, úspora patrí klientovi.</li>
          </ol>

          <h2 id="platby">6. Záloha a platby</h2>
          <ol>
            <li>Klient po podpise zmluvy, pri aukcii pred dražbou, zloží zálohu podľa odhadovanej celkovej sumy: {depositTiersText(cfg)}. Výšku zálohy určuje zmluva.</li>
            <li>Záloha nie je súčasťou odhadovanej ceny. Do úplného vyúčtovania slúži ako rezerva na nepredvídané náklady a ako zábezpeka nárokov poskytovateľa. Poskytovateľ z nej môže uhradiť nepredvídané náklady spojené s vozidlom a svoje splatné nároky voči klientovi, vrátane zmluvnej pokuty a náhrady škody.</li>
            <li>Nevyčerpaná časť zálohy sa klientovi vráti po prihlásení vozidla a konečnom vyúčtovaní, alebo sa so súhlasom klienta započíta s poslednou platbou. Celá záloha sa vracia len vtedy, ak vozidlo nie je možné vyviezť z krajiny pôvodu z dôvodu na strane predajcu alebo úradov.</li>
            <li>Klient platí postupne, vždy pred tým, než príslušný náklad vznikne, na základe výzvy poskytovateľa. Poskytovateľ náklady spojené s vozidlom zo svojich prostriedkov nefinancuje.</li>
            <li>Po vydražení alebo kúpe vozidla klient uhradí cenu vozidla s poplatkami predajcu, aukcie a jej sprostredkovateľa v lehote podľa zmluvy, spravidla do 2 dní od skončenia aukcie, keďže predajcovia vyžadujú platbu v krátkych lehotách. Ostatné platby sú splatné v lehote podľa zmluvy.</li>
            <li>Kým výzva nie je uhradená, poskytovateľ nie je povinný v plnení pokračovať a termíny sa predlžujú o čas omeškania. Náklady, ktoré omeškaním klienta vzniknú, najmä skladné, zdržné a poplatky a pokuty účtované predajcom, aukciou alebo jej sprostredkovateľom, znáša klient.</li>
            <li>Pri omeškaní s platbou má poskytovateľ právo na úrok z omeškania vo výške podľa zmluvy. Voči spotrebiteľovi vo výške podľa všeobecne záväzných právnych predpisov.</li>
          </ol>

          <h2 id="kupa">7. Dražba a kúpa vozidla</h2>
          <ol>
            <li>Na aukcii poskytovateľ prihadzuje najviac do výšky limitu. Ak prihodí nad limit bez súhlasu klienta, klient nie je povinný vozidlo prevziať a záloha sa mu vráti v plnej výške.</li>
            <li>Poskytovateľ <b>nezaručuje úspech v aukcii</b>. Predajca alebo aukcia môžu predaj zrušiť, presunúť, nepotvrdiť najvyššiu ponuku alebo vozidlo stiahnuť. Poskytovateľ za tieto rozhodnutia nezodpovedá.</li>
            <li>Ak sa vozidlo nepodarí vydražiť, poskytovateľ vráti klientovi zálohu do 7 dní od skončenia aukcie, zníženú o manipulačný poplatok 30 € a o náklady menovej konverzie, alebo ju na žiadosť klienta použije na iné vozidlo na základe dodatku k zmluve.</li>
            <li>Pri vozidle za pevnú cenu sa dražba nekoná. Predajca môže vozidlo medzičasom predať, zmeniť jeho cenu alebo stav. Ak k tomu dôjde pred kúpou, poskytovateľ vráti klientovi zálohu do 7 dní, zníženú o preukázateľne vynaložené náklady (najmä kontrolu vozidla a vývoznú dokumentáciu) a o náklady menovej konverzie, alebo ju na žiadosť klienta použije na iné vozidlo.</li>
          </ol>

          <h2 id="stav">8. Stav vozidla</h2>
          <ol>
            <li>Vozidlá sa kupujú v stave, v akom sa nachádzajú („ako stoja a ležia“), spravidla bez záruky predajcu a bez možnosti skúšobnej jazdy. Vozidlá z aukcií sú často poškodené alebo majú doklad o totálnej škode.</li>
            <li>Údaje o vozidle (najmä stav tachometra, poškodenie, funkčnosť, výbava, história, protokoly o technickom stave a ich preklady) pochádzajú od predajcu a z fotografií. Poskytovateľ vozidlo pred kúpou spravidla fyzicky neprehliada, posudzuje dostupné údaje s odbornou starostlivosťou, no nezodpovedá za ich správnosť, za skryté vady ani za nepravdivé údaje predajcu.</li>
            <li>Nákres poškodenia a odhad opravy sú orientačné a vychádzajú z fotografií. Skutočný rozsah poškodenia a cena opravy sa určia až po obhliadke vozidla. Navýšenie ceny opravy poskytovateľ klientovi oznámi pred vykonaním prác a opravy nad dohodnutý rozsah vykoná len s jeho súhlasom.</li>
          </ol>

          <h2 id="preprava">9. Preprava, poistenie a vlastníctvo</h2>
          <ol>
            <li>Termíny prepravy a dodania sú <b>orientačné</b>. Poskytovateľ nezodpovedá za oneskorenie spôsobené predajcom, aukciou, prepravcom, lodnou spoločnosťou, prístavom, colným úradom, servisom, technickou službou alebo úradmi.</li>
            <li><b>Preprava je bez poistenia</b>, ak si klient poistenie výslovne neobjedná a nezaplatí. Poistenie, ak je dohodnuté, sa riadi podmienkami poisťovne vrátane spoluúčasti a výluk a nekryje poškodenia, ktoré malo vozidlo pri kúpe.</li>
            <li>Vlastnícke právo k vozidlu prechádza na klienta podľa zmluvy, spravidla úhradou ceny vozidla s poplatkami predajcu. Od tohto okamihu nesie <b>nebezpečenstvo škody na vozidle klient</b>, aj počas prepravy a skladovania. Poskytovateľ uplatní nároky voči prepravcovi, prístavu alebo poisťovni a získané plnenie prevedie na klienta.</li>
            <li>Od prevzatia vozidla v servise poskytovateľa zodpovedá poskytovateľ za škodu, ktorú na vozidle sám spôsobí.</li>
          </ol>

          <h2 id="clo">10. Clo, schválenie a prihlásenie</h2>
          <ol>
            <li>Colné zatriedenie, colnú hodnotu a výšku cla a dovoznej DPH určuje colný úrad. Klient poskytne číslo EORI, plnomocenstvo pre colného deklaranta a ďalšiu súčinnosť do 5 dní od výzvy. Náklady omeškania so súčinnosťou alebo s úhradou cla a dane znáša klient.</li>
            <li>Odpočítanie dovoznej DPH si klient uplatňuje sám. Poskytovateľ nezodpovedá za to, či mu ho správca dane prizná.</li>
            <li>Schválenie vozidla na prevádzku v Slovenskej republike závisí od rozhodnutia technickej služby a príslušných orgánov. Poskytovateľ <b>nezodpovedá za to, že vozidlo bude schválené</b>, ani za požiadavky na ďalšie úpravy, doklady alebo skúšky. Náklady na ne hradí klient.</li>
            <li>Ak sa po uzavretí zmluvy zmenia právne predpisy, sadzby cla alebo daní, úradné poplatky, vývozné alebo dovozné obmedzenia, vzniknuté náklady a následky znáša klient.</li>
          </ol>

          <h2 id="zodpovednost">11. Zodpovednosť a vyššia moc</h2>
          <ol>
            <li>Poskytovateľ zodpovedá za škodu spôsobenú porušením svojich povinností zo zmluvy. Nezodpovedá za konanie a rozhodnutia predajcov, aukcií, prepravcov, prístavov, bánk, colných a iných orgánov a ďalších tretích osôb, ktoré nemôže ovplyvniť.</li>
            <li>Poskytovateľ nezodpovedá za porušenie povinností spôsobené okolnosťami vylučujúcimi zodpovednosť (vyššia moc), najmä vojnou, nepokojmi, sankciami, embargami, zákazmi vývozu alebo dovozu, prírodnými katastrofami, epidémiami, štrajkami, uzavretím prístavov, nedostatkom prepravných kapacít, výpadkami systémov a rozhodnutiami úradov. Termíny sa predlžujú o čas ich trvania a vzniknuté náklady znáša klient.</li>
            <li>Skladné, zdržné a iné poplatky, ktoré nespôsobil poskytovateľ, znáša klient.</li>
            <li>Voči klientovi, ktorý je podnikateľom, je celková zodpovednosť poskytovateľa za škodu obmedzená sumou, ktorú klient zaplatil poskytovateľovi za jeho vlastné služby, a nezahŕňa ušlý zisk. Obmedzenie neplatí pri škode spôsobenej úmyselne alebo hrubou nedbanlivosťou. Voči spotrebiteľovi zodpovedá poskytovateľ v rozsahu všeobecne záväzných právnych predpisov.</li>
          </ol>

          <h2 id="odstupenie">12. Odstúpenie od zmluvy</h2>
          <ol>
            <li>Spotrebiteľ má právo odstúpiť od zmluvy uzavretej na diaľku alebo mimo prevádzkových priestorov bez uvedenia dôvodu do <b>14 dní</b> odo dňa jej uzavretia. Stačí, ak oznámenie o odstúpení odošle pred uplynutím lehoty, a to e-mailom na {mail}, poštou na adresu poskytovateľa alebo vyplnením formulára podľa článku 18. Poskytovateľ prijatie odstúpenia potvrdí.</li>
            <li>Keďže aukcie a predajcovia vyžadujú rýchle konanie, poskytovateľ začne službu poskytovať pred uplynutím lehoty na odstúpenie len na <b>výslovnú žiadosť spotrebiteľa</b>, ktorú spotrebiteľ vyjadrí v zmluve. Spotrebiteľ zároveň berie na vedomie, že po úplnom poskytnutí služby právo na odstúpenie stráca.</li>
            <li>Ak spotrebiteľ odstúpi po tom, ako poskytovateľ na jeho žiadosť začal službu poskytovať, uhradí cenu za plnenie poskytnuté do dňa odstúpenia a náklady, ktoré už vznikli a nemožno ich vrátiť. Vydražením alebo kúpou vozidla vzniká záväzok voči predajcovi, ktorý odstúpenie od zmluvy s poskytovateľom neruší. Poplatky, pokuty a náklady predajcu, aukcie a jej sprostredkovateľa za zrušenie kúpy, opätovný predaj a skladovanie znáša klient.</li>
            <li>Poskytovateľ vráti spotrebiteľovi platby, na ktoré má po odstúpení nárok, do 14 dní od doručenia odstúpenia, rovnakým spôsobom, akým ich prijal. Poskytovateľ môže svoje nároky podľa odseku 3 započítať.</li>
            <li>Klient, ktorý je podnikateľom, môže od zmluvy odstúpiť len z dôvodov uvedených v zmluve alebo v zákone.</li>
            <li>Poskytovateľ môže od zmluvy odstúpiť, ak klient neuhradí zálohu alebo inú platbu ani v dodatočnej lehote, ak neposkytne potrebnú súčinnosť, alebo ak plnenie znemožní vyššia moc. Klient v takom prípade uhradí plnenie poskytnuté do odstúpenia a vzniknuté náklady.</li>
          </ol>

          <h2 id="sankcie">13. Zmluvná pokuta a zádržné právo</h2>
          <ol>
            <li>Ak klient po vydražení alebo kúpe vozidla od zmluvy odstúpi bez dôvodu uvedeného v zmluve alebo v zákone, alebo neuhradí cenu vozidla v lehote, záloha prepadá ako zmluvná pokuta. Ďalšie zmluvné pokuty určuje zmluva. Nárok na náhradu škody, ktorá zmluvnú pokutu prevyšuje, nie je dotknutý.</li>
            <li>Do úplného zaplatenia ceny a všetkých nárokov poskytovateľa má poskytovateľ k vozidlu a jeho dokladom zádržné právo a nie je povinný ich vydať. Ak klient ani po výzve neuhradí splatné platby, môže poskytovateľ postupovať podľa zmluvy vrátane predaja vozidla a započítania výťažku.</li>
            <li>Ak klient neprevezme vozidlo pripravené na odovzdanie do 14 dní od výzvy, platí skladné podľa zmluvy.</li>
          </ol>

          <h2 id="kredit">14. Kredit RACEM</h2>
          <p>Ak je to uvedené v cenovej ponuke alebo v zmluve, klient pri odovzdaní vozidla získa jednorazový kredit do e-shopu <a href={SITE.racemUrl} target="_blank" rel="noopener">RACEM.sk</a> vo výške uvedenej v ponuke alebo v zmluve. Kredit má formu zľavového kódu, platí 12 mesiacov od odovzdania vozidla, nie je vymeniteľný za hotovosť, nemožno ho započítať s platbami podľa zmluvy a nevzniká naň nárok, ak zmluva zanikne pred odovzdaním vozidla.</p>

          <h2 id="reklamacie">15. Reklamácie a sťažnosti</h2>
          <ol>
            <li>Reklamácie služieb poskytovateľa a sťažnosti uplatňuje klient e-mailom na {mail} alebo poštou na adresu poskytovateľa. Poskytovateľ ich vybaví bez zbytočného odkladu, najneskôr do 30 dní od uplatnenia.</li>
            <li>Na diely a práce, ktoré na vozidle vykonal poskytovateľ, poskytuje poskytovateľ záruku podľa zmluvy. Záruka sa nevzťahuje na pôvodné časti vozidla, na skryté vady, ktoré nesúvisia s prácami poskytovateľa, ani na vady, za ktoré zodpovedá predajca.</li>
            <li>Spotrebiteľ má právo obrátiť sa na poskytovateľa so žiadosťou o nápravu. Ak poskytovateľ žiadosť zamietne alebo na ňu do 30 dní neodpovie, spotrebiteľ môže podať návrh na alternatívne riešenie sporu subjektu ARS, najmä Slovenskej obchodnej inšpekcii (<a href="https://www.soi.sk" target="_blank" rel="noopener">www.soi.sk</a>).</li>
          </ol>

          <h2 id="komunikacia">16. Komunikácia a osobné údaje</h2>
          <ol>
            <li>Strany komunikujú najmä e-mailom na adresách uvedených v zmluve. E-mail sa považuje za písomnú formu pre oznámenia, výzvy a súhlasy podľa zmluvy a VOP. E-mail sa považuje za doručený v deň odoslania, ak bol odoslaný v pracovný deň do 16:00, inak nasledujúci pracovný deň.</li>
            <li>Klient je povinný oznámiť zmenu svojich kontaktných údajov. Následky nedoručenia pre nesprávne alebo neaktuálne údaje nesie klient.</li>
            <li>Spracúvanie osobných údajov upravujú <Link href="/ochrana-osobnych-udajov">Zásady ochrany osobných údajov</Link>.</li>
          </ol>

          <h2 id="zaver">17. Záverečné ustanovenia</h2>
          <ol>
            <li>Právne vzťahy sa riadia právom Slovenskej republiky. Vzťahy s podnikateľmi sa riadia najmä Obchodným zákonníkom, vzťahy so spotrebiteľmi najmä Občianskym zákonníkom a predpismi na ochranu spotrebiteľa. Práva spotrebiteľa, ktoré mu priznávajú právne predpisy, nie sú týmito VOP obmedzené.</li>
            <li>Spory rozhodujú príslušné súdy Slovenskej republiky.</li>
            <li>Ak je niektoré ustanovenie VOP alebo zmluvy neplatné alebo nevymáhateľné, ostatné ustanovenia ostávajú v platnosti a namiesto neho sa použije ustanovenie, ktoré sa jeho účelu najviac približuje.</li>
            <li>Poskytovateľ môže VOP zmeniť. Na zmluvy uzatvorené pred zmenou sa použije znenie platné v čase ich uzatvorenia.</li>
            <li>Tieto VOP nadobúdajú platnosť a účinnosť dňa {EFFECTIVE} a nahrádzajú všetky predchádzajúce znenia.</li>
          </ol>

          <h2 id="formular">18. Formulár na odstúpenie od zmluvy</h2>
          <p>Vyplňte a pošlite tento formulár len v prípade, že chcete odstúpiť od zmluvy.</p>
          <p>
            Komu: {c.name}, {c.street}, {c.zip} {c.city}, e-mail: {SITE.email}<br />
            Týmto oznamujem, že odstupujem od zmluvy o poskytnutí tejto služby: ................................<br />
            Číslo zmluvy: ................................<br />
            Dátum uzavretia zmluvy: ................................<br />
            Meno a priezvisko spotrebiteľa: ................................<br />
            Adresa spotrebiteľa: ................................<br />
            Podpis spotrebiteľa (len pri listinnej forme): ................................<br />
            Dátum: ................................
          </p>
        </div>
      </section>
    </>
  );
}
