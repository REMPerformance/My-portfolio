export const STEPS = [
  { t: "Vyberte si auto", d: "Z našej ponuky, alebo nám pošlite odkaz na auto z USA, Dubaja, Kanady či Kórey. Do 24 hodín Vám pošleme odhad celkovej ceny.", tag: "Deň 0" },
  { t: "Zmluva a záloha", d: "Podpíšete zmluvu o sprostredkovaní a zložíte zálohu. Pri aukcii určíte maximálnu sumu.", tag: "Pred kúpou" },
  { t: "Kúpa auta", d: "Auto vydražíme najviac do Vášho limitu, alebo ho kúpime za dohodnutú cenu. Ak to nevyjde, zálohu vrátime.", tag: "Deň kúpy" },
  { t: "Doprava a clo", d: "Odvoz do prístavu, námorná preprava do EÚ, preclenie a kamión na Slovensko.", tag: "4 – 8 týždňov" },
  { t: "Na kľúč s EČV", d: "Oprava podľa dohody, homologizácia, STK a evidenčné čísla. Auto odovzdáme aj s kreditom do RACEM.", tag: "Odovzdanie" }
];

export const FAQ: { q: string; a: string }[] = [
  {
    q: "Je odhadovaná cena záväzná?",
    a: "Nie. Všetky ceny na webe, v ponuke aj v zmluve sú odhad. Skutočná cena závisí od toho, za koľko sa auto vydraží alebo kúpi, od kurzu a od skutočných nákladov na dopravu, clo a opravu, a môže sa znížiť aj zvýšiť. Pri aukcii je záväzná maximálna suma, ktorú nám nastavíte. Nad ňu neprihodíme."
  },
  {
    q: "Aký je rozdiel medzi autom z aukcie a autom od predajcu?",
    a: "Auto v aukcii sa draží, cena sa ukáže až na konci aukcie a my prihadzujeme najviac do Vášho limitu. Auto od predajcu sa nedraží, predáva ho dealer alebo aukcia v režime Buy Now za vopred určenú sumu. K cene auta pripočítame dopravu, clo, DPH, homologizáciu a ďalšie služby. Odhad celkovej sumy vidíte pri každom aute."
  },
  {
    q: "Z ktorých krajín dovážate autá?",
    a: "Najčastejšie z USA (všetky štáty, aukcie aj predajcovia), zo Spojených arabských emirátov (Dubaj, Abú Zabí, Šardža), z Kanady, Južnej Kórey, Japonska a Číny. Cenu dopravy počítame podľa konkrétneho štátu či emirátu a najbližšieho prístavu."
  },
  {
    q: "Dokedy môžem auto objednať?",
    a: "Pri každom aute je uvedený termín uzávierky objednávok. Zvyčajne je to 24 hodín pred koncom aukcie, aby sme stihli podpísať zmluvu a prijať zálohu. Po uzávierke už objednávky na dané auto neprijímame."
  },
  {
    q: "Koľko je záloha a čo sa s ňou stane, ak aukciu prehráme?",
    a: "Záloha závisí od odhadovanej celkovej sumy: do 29 999 € je 2 500 €, od 30 000 € do 39 999 € je 3 500 €, od 40 000 € do 49 999 € je 4 500 € a za každých ďalších 10 000 € o 1 000 € viac. Je to povinná rezerva na nepredvídané náklady, do odhadovanej ceny sa nezapočítava a jej nevyčerpaná časť sa vracia po prihlásení auta. Ak aukciu prehráme, zálohu Vám vrátime do 7 dní zníženú o manipulačný poplatok 30 € a náklady na výmenu mien, alebo ju na Vašu žiadosť presunieme na ďalšie auto."
  },
  {
    q: "Ako dlho trvá dovoz auta z USA?",
    a: "Zvyčajne 6 až 10 týždňov od vydraženia po odovzdanie na Slovensku. Najdlhšie trvá námorná preprava a čakanie na kontajner. Oprava a homologizácia môžu čas predĺžiť."
  },
  {
    q: "Aké clo a DPH sa platí pri dovoze auta z USA?",
    a: "Pri osobných autách je clo 10 %, pri pickupoch a úžitkových vozidlách môže byť 22 %. Clo sa počíta z colnej hodnoty (cena auta + poplatky + doprava do EÚ). Na to sa pripočíta 23 % DPH. Presné colné zatriedenie overí colný deklarant pred dražbou."
  },
  {
    q: "Dá sa americké auto prihlásiť na Slovensku?",
    a: "Áno, cez individuálne schválenie vozidla (homologizáciu). Väčšinou treba upraviť svetlá a smerovky, urobiť STK a emisnú kontrolu. Odhad týchto nákladov je v kalkulácii zahrnutý ako homologizácia. O schválení rozhoduje technická služba a úrady."
  },
  {
    q: "Čo znamená Salvage, Clean alebo Rebuilt titul?",
    a: "Clean title je auto bez vážnej škody. Salvage znamená, že poisťovňa auto vyhlásila za totálnu škodu, najčastejšie z ekonomických dôvodov. Takéto autá sú lacnejšie, ale treba ich opraviť. Rebuilt je auto, ktoré už bolo opravené a znova schválené. Pri každom aute uvádzame titul aj rozsah poškodenia."
  },
  {
    q: "Môžem si vybrať auto, ktoré nie je vo Vašej ponuke?",
    a: "Samozrejme. Pošlite nám odkaz na akékoľvek auto z americkej aukcie a do 24 hodín Vám pošleme odhad celkovej ceny a naše odporúčanie."
  },
  {
    q: "Kto auto opraví?",
    a: "Auto si môžete dať opraviť sami, alebo ho dáme opraviť u overených partnerov. Pri oprave cez nás dostanete cenovú ponuku vopred."
  },
  {
    q: "Ako funguje bonus na tuning v RACEM?",
    a: "Pri odovzdaní auta dostanete unikátny kód s kreditom do e-shopu RACEM.sk. Výšku kreditu uvádzame v cenovej ponuke. Kredit platí 12 mesiacov na celý sortiment."
  }
];

export const CREDIT_TIERS = [
  { label: "Auto do 15 000 €", v: 200 },
  { label: "Auto 15 000 – 30 000 €", v: 400 },
  { label: "Auto nad 30 000 €", v: 700 }
];

/* ═══════════ Upraviteľný obsah webu (admin → Obsah webu) ═══════════ */
export interface SiteContent {
  topbar: string;
  hero: { title1: string; title2: string; title3: string; lead: string; pills: { b: string; t: string }[]; images: string[] };
  quick: { title: string; bidUsd: number; repairEur: number; skPrice: number };
  feats: { t: string; d: string }[];
  steps: { t: string; d: string; tag: string }[];
  why: { t: string; d: string }[];
  risk: string;
  bonus: { title: string; text: string; points: string[]; tiers: { label: string; v: number }[] };
  faq: { q: string; a: string }[];
  contact: { human: string; phone: string; hours: string };
}

export const DEFAULT_CONTENT: SiteContent = {
  topbar: "Odhad ceny vrátane cla a DPH · Kredit na tuning v RACEM",
  hero: {
    title1: "Auto z USA, Dubaja či Kanady",
    title2: "na kľúč",
    title3: "až k Vám domov.",
    lead: "Vyberte si auto z našej ponuky alebo nám povedzte, čo hľadáte. Kúpime ho, dovezieme, preclíme, homologizujeme a prihlásime. Odhad celkovej ceny vrátane dopravy, cla a DPH vidíte vopred.",
    pills: [
      { b: "6–10 týždňov", t: "doručenie na Slovensko" },
      { b: "6 krajín", t: "USA, SAE, Kanada, Ázia" },
      { b: "Kredit RACEM", t: "na tuning k autu" }
    ],
    images: [
      "https://racem.sk/cdn/shop/files/190320100347lc2327ae8-hd.jpg?width=1400",
      "https://racem.sk/cdn/shop/files/bmw-m2-2015-2018-widebody-kit-shirokai-white-rear-side-dusk.webp?width=1400",
      "https://racem.sk/cdn/shop/files/image_89ab9f11-f8b9-4c36-93c3-e3f84b5624ba.jpg?width=1400",
      "https://racem.sk/cdn/shop/files/1790018699874.publer.com.jpg?width=1400"
    ]
  },
  quick: { title: "Ford Mustang GT 2020", bidUsd: 11500, repairEur: 2800, skPrice: 36900 },
  feats: [
    { t: "Rozpis nákladov vopred", d: "Odhad aukcie, dopravy, cla, DPH aj homologizácie." },
    { t: "Neprekročíme limit", d: "Prihadzujeme len do sumy, ktorú nastavíte." },
    { t: "Na kľúč s EČV", d: "Preclenie, STK aj prihlásenie vybavíme." },
    { t: "Kredit do RACEM", d: "Na aero, disky a podvozok." }
  ],
  steps: STEPS,
  why: [
    { t: "Rozpis nákladov vopred", d: "Pri každom aute vidíte odhad všetkých položiek: cenu auta, poplatky, dopravu, clo, DPH a homologizáciu. Skutočné náklady sa môžu znížiť aj zvýšiť a každý z nich máte zdokladovaný." },
    { t: "Zmluva a doklady", d: "Na základe zmluvy o sprostredkovaní Vás zastupujeme na aukcii. Nad Váš limit neprihodíme a každú platbu máte zdokladovanú faktúrou." },
    { t: "Tuning v jednej ruke", d: "Za nami stojí RACEM, slovenský e-shop s certifikovanými performance dielmi. Auto Vám pomôžeme dotiahnuť od opravy až po finálny vzhľad." }
  ],
  risk: "Väčšina áut na amerických aukciách sú poškodené autá (salvage). Kupujú sa tak, ako stoja a ležia, podľa fotiek a popisu aukcie, bez testovacej jazdy. Skryté poškodenia sa môžu ukázať až pri oprave. Preto ku každému autu uvádzame vlastný odhad opravy a odporúčame rezervu 10 až 15 %.",
  bonus: {
    title: "Dovezieme Vám auto. K nemu dostanete kredit na tuning.",
    text: "Ku každému autu dovezenému cez REM Performance dostanete kredit do e-shopu RACEM.sk na certifikované aero, widebody kity, disky, podvozok a ďalšie.",
    points: ["Kredit dostanete ako unikátny kód pri odovzdaní auta", "Platí na celý sortiment RACEM", "Platnosť 12 mesiacov od odovzdania", "Výšku kreditu uvádzame v cenovej ponuke"],
    tiers: CREDIT_TIERS
  },
  faq: FAQ,
  contact: { human: "Ozve sa Vám reálny človek, nie automat.", phone: "+421 949 253 872", hours: "" }
};

export function mergeContent(v: unknown): SiteContent {
  const o = (v && typeof v === "object" ? v : {}) as Partial<SiteContent>;
  const d = DEFAULT_CONTENT;
  const arr = <T,>(x: T[] | undefined, def: T[]) => (Array.isArray(x) && x.length ? x : def);
  return {
    topbar: o.topbar ?? d.topbar,
    hero: { ...d.hero, ...(o.hero || {}), pills: arr(o.hero?.pills, d.hero.pills), images: arr(o.hero?.images?.filter((x) => typeof x === "string" && /^https?:\/\//.test(x.trim())).map((x) => x.trim()), d.hero.images) },
    quick: { ...d.quick, ...(o.quick || {}) },
    feats: arr(o.feats, d.feats),
    steps: arr(o.steps, d.steps),
    why: arr(o.why, d.why),
    risk: o.risk ?? d.risk,
    bonus: { ...d.bonus, ...(o.bonus || {}), points: arr(o.bonus?.points, d.bonus.points), tiers: arr(o.bonus?.tiers, d.bonus.tiers) },
    faq: arr(o.faq, d.faq),
    contact: { ...d.contact, ...(o.contact || {}) }
  };
}
