/** Poradňa – SEO články. Obsah je v bežnej slovenčine, text sa renderuje ako odseky/zoznamy. */
export interface ArticleSection { h: string; p?: string[]; list?: string[] }
export interface Article {
  slug: string;
  title: string;
  description: string;
  h1: string;
  date: string;
  updated: string;
  lead: string;
  /** vloží tabuľku s príkladmi výpočtu (ceny v USD) */
  priceTable?: number[];
  sections: ArticleSection[];
  faq?: { q: string; a: string }[];
  links: { href: string; label: string }[];
}

export const ARTICLES: Article[] = [
  {
    slug: "kolko-stoji-dovoz-auta-z-usa",
    title: "Koľko stojí dovoz auta z USA v roku 2026 – všetky poplatky",
    description: "Koľko stojí dovoz auta z USA na Slovensko: cena auta, aukčné poplatky, doprava, clo 10 %, DPH 23 %, homologizácia a prihlásenie. Príklady výpočtu pre autá za 10 000 až 40 000 USD.",
    h1: "Koľko stojí dovoz auta z USA",
    date: "2026-09-29",
    updated: "2026-09-29",
    lead: "Auto z USA býva aj po zaplatení všetkých poplatkov výrazne lacnejšie ako na Slovensku. Aby ste sa nenechali prekvapiť, rozpíšeme Vám všetky položky, ktoré k cene auta pribudnú – od aukcie až po slovenské značky.",
    priceTable: [10000, 20000, 30000, 40000],
    sections: [
      { h: "Z čoho sa skladá cena dovezeného auta", list: [
        "Cena auta – vydražená suma na aukcii Copart či IAAI alebo cena u predajcu.",
        "Aukčné poplatky – poplatok kupujúceho, ktorý si účtuje aukcia (podľa ceny auta niekoľko sto až vyše tisíc dolárov).",
        "Doprava do prístavu – odťah z aukčného dvora do najbližšieho prístavu, podľa štátu zhruba 300 – 900 USD.",
        "Námorná preprava – kontajner do Európy (zvyčajne Bremerhaven alebo Rotterdam), 1 150 – 1 900 USD podľa prístavu.",
        "Clo – 10 % z colnej hodnoty pri osobných autách a SUV, 22 % pri pickupoch a úžitkových autách.",
        "DPH – 23 % z colnej hodnoty zvýšenej o clo a náklady na dopravu v EÚ.",
        "Prístav, vykládka a colný deklarant v EÚ, kamión na Slovensko.",
        "Homologizácia, technická kontrola, emisná kontrola a prihlásenie na slovenské značky."
      ] },
      { h: "Colná hodnota – z čoho sa počíta clo", p: [
        "Clo sa neplatí len z ceny auta. Colná hodnota zahŕňa cenu auta, aukčné poplatky a všetky náklady na dopravu až po hranicu EÚ – teda aj odvoz do prístavu a námornú prepravu. Z tejto sumy sa vypočíta clo a z colnej hodnoty spolu s clom a dopravou v EÚ potom DPH.",
        "Preto je dôležité počítať celkovú cenu, nie len cenu auta na aukcii. Pri každom aute v našej ponuke a v kalkulačke je tento výpočet urobený automaticky."
      ] },
      { h: "Ako znížiť celkovú cenu", list: [
        "Vyberte auto zo štátu blízko východného pobrežia – doprava z New Jersey či Georgie je lacnejšia ako z Kalifornie.",
        "Zvážte ľahšie poškodené auto – oprava na Slovensku býva lacnejšia ako rozdiel v cene.",
        "Pri pickupoch rátajte s vyšším clom 22 % – niekedy sa oplatí SUV s podobnými parametrami.",
        "Nastavte si maximálny limit a neprihadzujte v emóciách – my nad Váš limit nikdy neprihodíme."
      ] }
    ],
    faq: [
      { q: "Je auto z USA naozaj lacnejšie?", a: "Vo väčšine prípadov áno – aj po zaplatení dopravy, cla a DPH vychádza porovnateľné auto často o 20 – 40 % lacnejšie ako na slovenskom trhu. Záleží od modelu, stavu a štátu." },
      { q: "Koľko trvá dovoz auta z USA?", a: "Zvyčajne 6 – 10 týždňov od kúpy po prihlásenie na Slovensku." }
    ],
    links: [{ href: "/kalkulacka-dovozu", label: "Kalkulačka dovozu" }, { href: "/dovoz-auta-z-usa", label: "Dovoz auta z USA" }, { href: "/auto-na-mieru", label: "Nájdite mi auto" }]
  },
  {
    slug: "clo-a-dph-pri-dovoze-auta",
    title: "Clo a DPH pri dovoze auta z USA, Dubaja či Japonska (2026)",
    description: "Aké je clo a DPH pri dovoze auta mimo EÚ: 10 % clo na osobné autá, 22 % na pickupy, 23 % DPH. Kedy je clo nulové (Kórea, Japonsko) a ako sa počíta colná hodnota.",
    h1: "Clo a DPH pri dovoze auta mimo EÚ",
    date: "2026-09-29",
    updated: "2026-09-29",
    lead: "Pri dovoze auta z krajiny mimo Európskej únie sa na Slovensku platí clo a DPH. Koľko to je a z akej sumy sa to počíta, závisí od typu auta a krajiny pôvodu.",
    sections: [
      { h: "Sadzby cla", list: [
        "Osobné autá a SUV: 10 %.",
        "Pickupy a úžitkové vozidlá na prepravu tovaru: 22 %.",
        "Autá vyrobené v Južnej Kórei alebo Japonsku: pri preukázaní pôvodu môže byť clo 0 % vďaka dohodám o voľnom obchode s EÚ.",
        "Elektromobily z Číny: okrem bežného cla sa môže platiť aj vyrovnávacie clo EÚ podľa výrobcu."
      ] },
      { h: "Ako sa počíta colná hodnota", p: [
        "Colná hodnota = cena auta + poplatky pri kúpe + doprava a poistenie až po hranicu EÚ. Z tejto sumy sa vypočíta clo.",
        "DPH 23 % sa potom počíta zo sumy colná hodnota + clo + náklady na dopravu v rámci EÚ až do miesta určenia."
      ] },
      { h: "Môže si firma odpočítať DPH?", p: [
        "Ak auto kupuje platiteľ DPH na podnikanie, môže si DPH zaplatené pri dovoze za zákonom stanovených podmienok uplatniť. Preto pri každom aute na našom webe vidíte cenu s DPH aj bez DPH. Konkrétnu situáciu odporúčame konzultovať s Vaším účtovníkom."
      ] }
    ],
    faq: [
      { q: "Koľko je clo na auto z USA?", a: "Na osobné autá a SUV 10 %, na pickupy a úžitkové vozidlá 22 % z colnej hodnoty." },
      { q: "Platí sa pri dovoze auta DPH?", a: "Áno, pri dovoze z krajiny mimo EÚ sa platí 23 % DPH – aj keď auto kupuje súkromná osoba." }
    ],
    links: [{ href: "/kalkulacka-dovozu", label: "Spočítať clo a DPH" }, { href: "/dovoz-auta-z-korey", label: "Dovoz z Kórey" }, { href: "/dovoz-auta-z-japonska", label: "Dovoz z Japonska" }]
  },
  {
    slug: "copart-a-iaai-ako-kupit-auto-z-americkej-aukcie",
    title: "Copart a IAAI – ako kúpiť auto z americkej aukcie zo Slovenska",
    description: "Ako fungujú aukcie Copart a IAAI, čo znamená Salvage a Clean title, typy poškodení, Run and Drive a prečo na kúpu potrebujete sprostredkovateľa. Návod pre kupujúcich zo Slovenska.",
    h1: "Copart a IAAI – ako kúpiť auto z americkej aukcie",
    date: "2026-09-29",
    updated: "2026-09-29",
    lead: "Copart a IAAI (Insurance Auto Auctions) sú najväčšie aukcie áut v USA. Každý týždeň na nich poisťovne, leasingovky a predajcovia predávajú desaťtisíce áut. Vysvetlíme, ako to funguje a na čo si dať pozor.",
    sections: [
      { h: "Kto na aukciách predáva", p: ["Najčastejšie poisťovne – autá po nehode, krúpobití, záplave či krádeži, ktoré poisťovňa vyplatila ako totálnu škodu. Ďalej leasingové spoločnosti, autopožičovne a predajcovia. Preto sú ceny nízke, ale veľa áut je poškodených."] },
      { h: "Typy titulov (dokladov)", list: [
        "Clean title – auto bez záznamu o totálnej škode.",
        "Salvage title – poisťovňa auto vyhlásila za totálnu škodu. Neznamená to automaticky vážne poškodenie – často ide o drahú opravu v USA, ktorá je v Európe lacnejšia.",
        "Rebuilt / Reconstructed – auto po oprave zo salvage.",
        "Parts only / Certificate of destruction – auto len na diely, takéto autá nedovážame na prihlásenie."
      ] },
      { h: "Čo znamenajú údaje v inzeráte", list: [
        "Primary / Secondary damage – hlavné a vedľajšie poškodenie (Front End, Rear End, Side, Hail, Water/Flood…).",
        "Run and Drive – auto sa pri prevzatí na aukcii rozbehlo a pohlo. Nie je to záruka technického stavu.",
        "Engine Starts – motor naštartoval, ale auto sa nemuselo pohnúť.",
        "Keys – či sú k autu kľúče.",
        "Odometer – nájazd v míľach (1 míľa = 1,609 km), niekedy s poznámkou, že nie je overený."
      ] },
      { h: "Prečo potrebujete sprostredkovateľa", p: [
        "Na väčšinu áut na Coparte a IAAI môže prihadzovať len licencovaný kupujúci. Sprostredkovateľ za Vás auto preverí, prihadzuje do Vami schváleného limitu, zaplatí aukcii, zariadi odvoz, prepravu, preclenie a všetko okolo prihlásenia.",
        "U nás navyše dopredu vidíte celkovú cenu na slovenských značkách a nad Váš limit nikdy neprihodíme."
      ] }
    ],
    faq: [
      { q: "Oplatí sa kupovať auto so Salvage titulom?", a: "Často áno – salvage autá sú výrazne lacnejšie a mnohé majú len kozmetické alebo ľahko opraviteľné poškodenie. Dôležité je poškodenie dobre posúdiť, preto ku každému autu uvádzame odhad opravy." }
    ],
    links: [{ href: "/ponuka", label: "Autá v ponuke" }, { href: "/ako-to-funguje", label: "Ako to funguje" }, { href: "/auto-na-mieru", label: "Nájdite mi auto" }]
  },
  {
    slug: "homologizacia-a-prihlasenie-auta-z-usa",
    title: "Homologizácia a prihlásenie auta z USA na Slovensku",
    description: "Čo obnáša homologizácia a prihlásenie auta dovezeného z USA či Dubaja na Slovensku: preclenie, technická kontrola, úprava svetiel a smeroviek, emisná kontrola a evidenčné čísla.",
    h1: "Homologizácia a prihlásenie auta z USA",
    date: "2026-09-29",
    updated: "2026-09-29",
    lead: "Auto dovezené spoza EÚ nemá európske schválenie typu, preto ho pred prihlásením treba schváliť ako jednotlivo dovezené vozidlo. Popíšeme, ako to prebieha a aké úpravy sú zvyčajne potrebné.",
    sections: [
      { h: "Postup krok za krokom", list: [
        "Preclenie v prístave v EÚ – zaplatenie cla a DPH, auto dostane colné doklady.",
        "Preprava na Slovensko a prípadná oprava poškodení.",
        "Technické úpravy podľa európskych predpisov.",
        "Technická a emisná kontrola a schválenie jednotlivo dovezeného vozidla.",
        "Prihlásenie na dopravnom inšpektoráte a vydanie evidenčných čísel."
      ] },
      { h: "Najčastejšie úpravy pri amerických autách", list: [
        "Predné svetlá s európskym zapojením a homologizáciou.",
        "Oranžové zadné smerovky (v USA svietia často na červeno).",
        "Zadné hmlové svetlo.",
        "Prípadne úprava bočných obrysových svetiel a prepnutie jednotiek v palubnom počítači."
      ] },
      { h: "Koľko to stojí a trvá", p: [
        "Cena homologizácie závisí od konkrétneho auta a potrebných úprav. V našich cenách je vždy zahrnutá – pri každom aute vidíte konečnú sumu na slovenských značkách. Samotný proces zvyčajne trvá 1 – 3 týždne od príchodu auta na Slovensko."
      ] }
    ],
    faq: [
      { q: "Dá sa prihlásiť každé auto z USA?", a: "Väčšina áut áno, niektoré modely sú však náročnejšie alebo sa v EÚ nedajú schváliť. Preto homologizáciu overujeme ešte pred kúpou." }
    ],
    links: [{ href: "/ako-to-funguje", label: "Ako to funguje" }, { href: "/dovoz-auta-z-usa", label: "Dovoz auta z USA" }, { href: "/kalkulacka-dovozu", label: "Kalkulačka" }]
  }
];

export const articleBySlug = (s: string) => ARTICLES.find((a) => a.slug === s);
