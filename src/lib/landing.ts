import type { CountryCode } from "./origins";

/** SEO vstupné stránky „Dovoz auta z …“ – jedna pre každú krajinu. */
export interface Landing {
  slug: string;
  country: CountryCode;
  title: string;
  description: string;
  h1: [string, string];
  lead: string;
  /** príklad pre výpočet */
  example: { label: string; price: number; place: string; auction: boolean };
  why: { t: string; d: string }[];
  watch: string[];
  faq: { q: string; a: string }[];
}

export const LANDINGS: Landing[] = [
  {
    slug: "dovoz-auta-z-usa",
    country: "US",
    title: "Dovoz auta z USA na kľúč – Copart, IAAI, cena s clom a DPH",
    description: "Dovoz auta z USA na Slovensko na kľúč: kúpa na aukcii Copart a IAAI alebo u predajcu, doprava z ktoréhokoľvek štátu, clo, DPH, homologizácia a prihlásenie. Celková cena vopred.",
    h1: ["Dovoz auta z USA", "na kľúč"],
    lead: "Americké autá vychádzajú často o 20 – 40 % lacnejšie ako na Slovensku – aj po zaplatení dopravy, cla a DPH. Kúpime Vám auto na aukcii Copart či IAAI alebo u predajcu v ktoromkoľvek z 50 štátov a dovezieme ho až k Vám so slovenskými značkami.",
    example: { label: "auto vydražené za 15 000 USD v Texase", price: 15000, place: "TX", auction: true },
    why: [
      { t: "Najväčší výber na svete", d: "Na aukciách Copart a IAAI je denne desaťtisíce áut – od bežných SUV po Corvetty, Mustangy a pickupy, ktoré sa v Európe nepredávajú." },
      { t: "Nižšie ceny aj s dovozom", d: "Aj po započítaní dopravy, 10 % cla a 23 % DPH vychádza väčšina áut výrazne lacnejšie ako porovnateľné auto na Slovensku." },
      { t: "Bohatšia výbava", d: "Americké verzie majú často silnejšie motory a vyššiu výbavu v základe – automat, kožu, adaptívny tempomat či prémiové audio." },
      { t: "Doprava z každého štátu", d: "Dopravu počítame podľa konkrétneho štátu a najbližšieho prístavu – New Jersey, Georgia, Florida, Texas alebo Kalifornia." }
    ],
    watch: [
      "Väčšina áut na Coparte a IAAI je poškodená (salvage) – ku každému autu uvádzame odhad opravy.",
      "Clo na osobné autá je 10 %, na pickupy a úžitkové autá 22 %.",
      "Americké autá potrebujú pri homologizácii úpravu svetiel a smeroviek – je to v cene.",
      "Doprava trvá zvyčajne 6 – 10 týždňov podľa štátu a prístavu."
    ],
    faq: [
      { q: "Koľko stojí dovoz auta z USA?", a: "K cene auta pripočítajte aukčné poplatky, dopravu do prístavu (300 – 900 USD podľa štátu), námornú prepravu (1 150 – 1 900 USD), 10 % clo, 23 % DPH, vykládku, kamión do SR a homologizáciu. Presnú sumu pre konkrétne auto uvidíte v kalkulačke alebo pri každom aute v ponuke." },
      { q: "Ako dlho trvá dovoz auta z USA?", a: "Od kúpy po odovzdanie na Slovensku zvyčajne 6 – 10 týždňov. Najrýchlejšie sú autá z východného pobrežia (New Jersey, Georgia), najdlhšie z Kalifornie a Aljašky." },
      { q: "Je lepšie kúpiť auto na aukcii alebo u predajcu?", a: "Aukcie Copart a IAAI sú najlacnejšie, ale autá bývajú poškodené. Autá od predajcov sú drahšie, zato často nepoškodené a s históriou. Poradíme Vám, čo sa pri Vašom rozpočte oplatí viac." },
      { q: "Musím ísť do USA osobne?", a: "Nie. Všetko vybavíme za Vás – kúpu, dopravu, preclenie, homologizáciu aj prihlásenie. Auto Vám odovzdáme na Slovensku so značkami." }
    ]
  },
  {
    slug: "dovoz-auta-z-nemecka",
    country: "EU",
    title: "Dovoz auta z Nemecka a EÚ na kľúč, bez cla a homologizácie",
    description: "Dovoz auta z Nemecka, Rakúska a ďalších krajín EÚ na Slovensko na kľúč. Havarované aj nehavarované autá z aukcií a od predajcov, kontrola histórie, preprava po ceste a prihlásenie. Bez cla.",
    h1: ["Dovoz auta z Nemecka a EÚ", "na kľúč"],
    lead: "Nemecko má najväčší trh s jazdenými autami v Európe. Nájdeme Vám auto u predajcu alebo na aukcii v Nemecku, Rakúsku či inej krajine Európskej únie, preveríme jeho históriu, privezieme ho po ceste a prihlásime na Slovensku.",
    example: { label: "jazdené auto za 12 000 EUR z Nemecka", price: 12000, place: "DE", auction: false },
    why: [
      { t: "Bez cla a bez colnice", d: "Auto z Európskej únie sa neclí a neprechádza colným konaním. Neplatí sa ani dovozná DPH." },
      { t: "Bez homologizácie", d: "Autá predávané v EÚ majú európske typové schválenie, takže odpadajú úpravy svetiel a jednotlivé schvaľovanie. Rieši sa len kontrola originality a prihlásenie." },
      { t: "Najväčší výber v Európe", d: "Od bežných rodinných áut cez firemné flotily so servisnou knižkou až po športové modely. Havarované aj nehavarované." },
      { t: "Preprava po ceste", d: "Auto ide na Slovensko odťahovým vozidlom alebo kamiónom, bez námornej prepravy a bez prístavných poplatkov." }
    ],
    watch: [
      "Pri jazdenom aute je cena zvyčajne konečná. Pri novom aute (do 6 mesiacov alebo do 6 000 km) a pri cene bez DPH sa DPH platí na Slovensku.",
      "Pred kúpou preverujeme históriu auta podľa VIN, nájazd a to, či nebolo vážne havarované.",
      "Na aukciách v EÚ (napríklad Copart Nemecko) sú poškodené aj pojazdné autá. Pri každom uvádzame, čo inzerát o stave hovorí.",
      "Pri prihlásení sa platí registračný poplatok podľa výkonu a veku auta."
    ],
    faq: [
      { q: "Platí sa pri dovoze auta z Nemecka clo alebo DPH?", a: "Clo sa neplatí nikdy, pretože ide o pohyb tovaru v rámci Európskej únie. Pri jazdenom aute sa neplatí ani slovenská DPH z ceny auta. DPH sa na Slovensku platí pri novom aute, teda do 6 mesiacov od prvej registrácie alebo s nájazdom do 6 000 km, a pri aute kúpenom za cenu bez DPH." },
      { q: "Treba auto z EÚ homologizovať?", a: "Nie. Auto s európskym typovým schválením sa nehomologizuje. Potrebná je kontrola originality, doklady od auta (napríklad nemecké ZB1 a ZB2 a osvedčenie COC) a prihlásenie na dopravnom inšpektoráte." },
      { q: "Koľko stojí dovoz auta z Nemecka?", a: "K cene auta sa pripočíta preprava po ceste, prihlásenie na Slovensku a náš poplatok za sprostredkovanie. Pri aukcii aj aukčné poplatky. Presnú sumu pre konkrétne auto Vám spočítame vopred." },
      { q: "Dovážate z Nemecka aj nehavarované autá?", a: "Áno. Väčšina áut, ktoré z EÚ dovážame od predajcov, je nehavarovaná. Na aukciách sa dajú kúpiť aj poškodené autá za nižšiu cenu, pri nich vždy uvádzame rozsah poškodenia." }
    ]
  },
  {
    slug: "dovoz-auta-z-dubaja",
    country: "AE",
    title: "Dovoz auta z Dubaja (SAE) na kľúč – cena s clom a DPH",
    description: "Dovoz auta z Dubaja a Spojených arabských emirátov na Slovensko na kľúč. Luxusné a športové autá s nízkym nájazdom, doprava z Džebel Ali, clo, DPH, homologizácia a prihlásenie.",
    h1: ["Dovoz auta z Dubaja", "na kľúč"],
    lead: "Dubaj je raj luxusných áut – Mercedesy AMG, Range Rovery, Land Cruisery či Lamborghini s malým nájazdom a v top výbave. Nájdeme Vám auto v Dubaji, Abú Zabí či Šardži a dovezieme ho na Slovensko so všetkým vybaveným.",
    example: { label: "auto za 90 000 AED z Dubaja", price: 90000, place: "DXB", auction: false },
    why: [
      { t: "Luxusné autá s nízkym nájazdom", d: "V SAE sa autá často menia každé 2 – 3 roky, takže na trhu je veľa mladých áut s malým nájazdom a bez korózie." },
      { t: "Top výbavy", d: "Autá pre Blízky východ bývajú v najvyšších výbavách – silné motory, kvalitná klimatizácia, kožené interiéry." },
      { t: "Pevná cena od predajcu", d: "Väčšina áut z Dubaja sa kupuje u predajcov za dohodnutú cenu – viete ju dopredu, bez čakania na výsledok aukcie." },
      { t: "Rýchla preprava", d: "Autá odchádzajú z prístavu Džebel Ali, preprava do Európy trvá zvyčajne 4 – 6 týždňov." }
    ],
    watch: [
      "Autá z Dubaja sú často v špecifikácii GCC – pred kúpou overujeme, či sa dajú homologizovať v EÚ.",
      "Kvôli horúčavám kontrolujeme najmä stav plastov, tesnení, bŕzd a klimatizácie.",
      "Clo na osobné autá je 10 %, DPH 23 % – rovnako ako pri autách z USA.",
      "Kurz dirhamu (AED) je pevne naviazaný na americký dolár."
    ],
    faq: [
      { q: "Oplatí sa dovoz auta z Dubaja?", a: "Pri luxusných a športových autách často áno – mladé autá s nízkym nájazdom bývajú v SAE lacnejšie ako v Európe aj po zaplatení dopravy, cla a DPH." },
      { q: "Čo je GCC špecifikácia?", a: "Je to verzia auta pre krajiny Perzského zálivu. Líši sa napríklad chladením, osvetlením či softvérom. Nie každé GCC auto sa dá v EÚ homologizovať, preto to overujeme pred kúpou." },
      { q: "Ako dlho trvá dovoz auta z Dubaja?", a: "Zvyčajne 5 – 8 týždňov od kúpy po odovzdanie na Slovensku vrátane preclenia a homologizácie." }
    ]
  },
  {
    slug: "dovoz-auta-z-kanady",
    country: "CA",
    title: "Dovoz auta z Kanady na kľúč – aukcie aj predajcovia",
    description: "Dovoz auta z Kanady na Slovensko na kľúč: autá z aukcií aj od predajcov v Ontáriu, Quebecu či Britskej Kolumbii, doprava, clo, DPH, homologizácia a prihlásenie.",
    h1: ["Dovoz auta z Kanady", "na kľúč"],
    lead: "Kanada ponúka podobné autá ako USA – pickupy, SUV aj športové autá – často s výbavou do zimy a za zaujímavé ceny. Nájdeme Vám auto v Ontáriu, Quebecu či Britskej Kolumbii a dovezieme ho až k Vám.",
    example: { label: "auto za 20 000 CAD z Ontária", price: 20000, place: "ON", auction: true },
    why: [
      { t: "Výbava do zimy", d: "Kanadské autá majú často vyhrievané sedadlá, volant, 4x4 a zimné balíky ako štandard." },
      { t: "Slabší kanadský dolár", d: "Vďaka kurzu CAD vychádzajú niektoré autá lacnejšie ako rovnaký model v USA." },
      { t: "Prístavy na oboch pobrežiach", d: "Autá posielame z Montrealu, Halifaxu alebo Vancouveru podľa toho, kde auto je." }
    ],
    watch: [
      "Kanadské autá môžu mať tachometer v kilometroch aj míľach – overujeme skutočný nájazd.",
      "Zimná soľ – pri starších autách kontrolujeme podvozok a koróziu.",
      "Clo 10 % pre osobné autá a 22 % pre pickupy, DPH 23 %."
    ],
    faq: [
      { q: "Je dovoz z Kanady drahší ako z USA?", a: "Doprava býva podobná alebo o niečo drahšia, cena auta však môže byť vďaka kurzu kanadského dolára nižšia. Pri každom aute Vám pošleme porovnanie." },
      { q: "Ako dlho trvá dovoz auta z Kanady?", a: "Zvyčajne 6 – 10 týždňov, zo západného pobrežia (Vancouver) o niečo dlhšie." }
    ]
  },
  {
    slug: "dovoz-auta-z-korey",
    country: "KR",
    title: "Dovoz auta z Južnej Kórey na kľúč – Hyundai, Kia, Genesis",
    description: "Dovoz auta z Južnej Kórey na Slovensko: Hyundai, Kia a Genesis priamo z Kórey, pri preukázaní pôvodu s nulovým clom. Doprava, preclenie, homologizácia a prihlásenie.",
    h1: ["Dovoz auta z Kórey", "na kľúč"],
    lead: "Autá vyrobené v Južnej Kórei môžu mať pri preukázaní pôvodu nulové clo vďaka dohode o voľnom obchode medzi EÚ a Kóreou. Dovezieme Vám Hyundai, Kia či Genesis priamo z Kórey.",
    example: { label: "auto za 25 000 000 KRW zo Soulu", price: 25000000, place: "SEL", auction: false },
    why: [
      { t: "Až 0 % clo", d: "Pri autách kórejského pôvodu s dokladom o pôvode sa clo neplatí – platí sa len DPH." },
      { t: "Modely, ktoré v Európe nie sú", d: "Genesis, Kia Carnival, Hyundai Palisade či domáce verzie s inou výbavou." }
    ],
    watch: [
      "Nulové clo platí len pri preukázaní kórejského pôvodu – to riešime pri kúpe.",
      "Preprava z Kórey trvá dlhšie – zvyčajne 8 – 12 týždňov."
    ],
    faq: [
      { q: "Platí sa clo pri dovoze auta z Kórey?", a: "Pri autách vyrobených v Kórei s preukázaným pôvodom je clo 0 %. Pri autách iných značiek (napr. nemeckých áut predaných v Kórei) sa platí bežné clo 10 %." }
    ]
  },
  {
    slug: "dovoz-auta-z-japonska",
    country: "JP",
    title: "Dovoz auta z Japonska na kľúč – JDM autá, aukcie USS",
    description: "Dovoz auta z Japonska na Slovensko: JDM autá ako Supra, Skyline, GT-R či Land Cruiser z japonských aukcií. Doprava, preclenie, homologizácia pravostranného auta a prihlásenie.",
    h1: ["Dovoz auta z Japonska", "na kľúč"],
    lead: "Japonsko je domovom legendárnych JDM áut – Nissan Skyline GT-R, Toyota Supra, Mazda RX-7 či Honda NSX. Japonské autá bývajú výborne udržiavané a s preukázateľným nájazdom. Nájdeme a dovezieme Vám ich na kľúč.",
    example: { label: "auto za 3 000 000 JPY z Jokohamy", price: 3000000, place: "YOK", auction: true },
    why: [
      { t: "Výborný technický stav", d: "Japonská technická kontrola (Shaken) je veľmi prísna, preto sú autá zvyčajne vo výbornom stave a bez korózie." },
      { t: "Aukčné hárky", d: "Japonské aukcie hodnotia každé auto známkou a nákresom poškodenia – vieme presne, čo kupujeme." },
      { t: "Až 0 % clo", d: "Autá vyrobené v Japonsku môžu mať pri preukázaní pôvodu nulové clo vďaka dohode EÚ – Japonsko." }
    ],
    watch: [
      "Väčšina áut z Japonska má pravostranné riadenie – na Slovensku sa dá prihlásiť, riešime homologizáciu.",
      "Preprava z Japonska trvá zvyčajne 8 – 12 týždňov."
    ],
    faq: [
      { q: "Dá sa na Slovensku prihlásiť auto s pravostranným riadením?", a: "Áno, auto s pravostranným riadením sa dá na Slovensku prihlásiť. Pri homologizácii treba upraviť svetlá a spĺňať technické podmienky – všetko vybavíme." }
    ]
  },
  {
    slug: "dovoz-auta-z-ciny",
    country: "CN",
    title: "Dovoz auta z Číny na kľúč – elektromobily a SUV",
    description: "Dovoz auta z Číny na Slovensko: elektromobily a SUV priamo od čínskych predajcov, doprava, clo, DPH, homologizácia a prihlásenie. Poradíme s vyrovnávacím clom na elektromobily.",
    h1: ["Dovoz auta z Číny", "na kľúč"],
    lead: "Čína je najväčší trh elektromobilov na svete. Pomôžeme Vám doviesť auto priamo z Číny – od výberu cez dopravu a preclenie až po homologizáciu a prihlásenie.",
    example: { label: "auto za 150 000 CNY zo Šanghaja", price: 150000, place: "SHA", auction: false },
    why: [
      { t: "Moderné elektromobily", d: "Modely a výbavy, ktoré sa do Európy ešte nedostali alebo sú tu výrazne drahšie." },
      { t: "Pevné ceny", d: "Autá kupujeme u predajcov za dohodnutú cenu, bez aukcie." }
    ],
    watch: [
      "Na elektromobily z Číny sa v EÚ uplatňuje okrem cla aj vyrovnávacie clo – výšku overujeme pre konkrétnu značku.",
      "Nie každé čínske auto sa dá v EÚ homologizovať – overujeme to pred kúpou."
    ],
    faq: [
      { q: "Oplatí sa dovoz elektromobilu z Číny?", a: "Závisí od značky – kvôli vyrovnávaciemu clu EÚ to pri niektorých výrobcoch nevychádza výhodne. Pred kúpou Vám spočítame celkovú cenu vrátane všetkých ciel." }
    ]
  }
];

export const landingBySlug = (s: string) => LANDINGS.find((l) => l.slug === s);
export const landingByCountry = (c: string) => LANDINGS.find((l) => l.country === c);
