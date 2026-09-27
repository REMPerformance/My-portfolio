export const STEPS = [
  { t: "Vyberte si auto", d: "Z našej ponuky alebo nám pošlite odkaz na akékoľvek auto z Copartu či IAAI. Do 24 hodín Vám pošleme odhad celkovej ceny.", tag: "Deň 0" },
  { t: "Zmluva a záloha", d: "Podpíšete zmluvu o sprostredkovaní, zložíte zálohu a určíte maximálnu sumu, do ktorej za Vás prihadzujeme.", tag: "Pred uzávierkou" },
  { t: "Dražba", d: "Prihadzujeme za Vás, nikdy nie nad Váš limit. Ak aukciu prehráme, zálohu vrátime alebo ju presunieme na iné auto.", tag: "Deň aukcie" },
  { t: "Doprava a clo", d: "Odvoz z aukcie do prístavu, kontajner do Bremerhavenu, preclenie v EÚ a kamión na Slovensko.", tag: "4 – 8 týždňov" },
  { t: "Na kľúč s EČV", d: "Oprava podľa dohody, homologizácia, STK, emisná kontrola a evidenčné čísla. Auto odovzdáme aj s kreditom do RACEM.", tag: "Odovzdanie" }
];

export const FAQ: { q: string; a: string }[] = [
  {
    q: "Je odhadovaná cena záväzná?",
    a: "Nie. Výsledná cena závisí od toho, za koľko sa auto vydraží, od kurzu dolára a od skutočných nákladov na opravu. Záväzný je náš fixný poplatok za sprostredkovanie a maximálna suma, ktorú nám nastavíte. Nad ňu neprihodíme."
  },
  {
    q: "Dokedy môžem auto objednať?",
    a: "Pri každom aute je uvedený termín uzávierky objednávok. Zvyčajne je to 24 hodín pred koncom aukcie, aby sme stihli podpísať zmluvu a prijať zálohu. Po uzávierke už objednávky na dané auto neprijímame."
  },
  {
    q: "Koľko je záloha a čo sa s ňou stane, ak aukciu prehráme?",
    a: "Záloha je 10 % z Vašej maximálnej sumy, minimálne 500 €. Ak aukciu prehráme, zálohu Vám vrátime do 5 pracovných dní alebo ju na Vašu žiadosť presunieme na ďalšie auto."
  },
  {
    q: "Ako dlho trvá dovoz auta z USA?",
    a: "Zvyčajne 6 až 10 týždňov od vydraženia po odovzdanie na Slovensku. Najdlhšie trvá námorná preprava a čakanie na kontajner. Oprava a homologizácia môžu čas predĺžiť."
  },
  {
    q: "Aké clo a DPH sa platí pri dovoze auta z USA?",
    a: "Pri osobných autách je clo 10 %, pri pickupoch a úžitkových vozidlách môže byť 22 %, pri motocykloch 6 až 8 %. Clo sa počíta z colnej hodnoty (cena auta + poplatky + doprava do EÚ). Na to sa pripočíta 23 % DPH. Presné colné zatriedenie overí colný deklarant pred dražbou."
  },
  {
    q: "Dá sa americké auto prihlásiť na Slovensku?",
    a: "Áno, cez individuálne schválenie vozidla (homologizáciu). Väčšinou treba upraviť svetlá a smerovky, urobiť STK a emisnú kontrolu. Tieto náklady sú v kalkulácii zahrnuté ako homologizácia."
  },
  {
    q: "Čo znamená Salvage, Clean alebo Rebuilt titul?",
    a: "Clean title je auto bez vážnej škody. Salvage znamená, že poisťovňa auto vyhlásila za totálnu škodu, najčastejšie z ekonomických dôvodov. Takéto autá sú lacnejšie, ale treba ich opraviť. Rebuilt je auto, ktoré už bolo opravené a znova schválené. Pri každom aute uvádzame titul aj rozsah poškodenia."
  },
  {
    q: "Môžem si vybrať auto, ktoré nie je vo Vašej ponuke?",
    a: "Samozrejme. Pošlite nám odkaz na akékoľvek auto z Copartu alebo IAAI a do 24 hodín Vám pošleme odhad celkovej ceny a naše odporúčanie."
  },
  {
    q: "Kto auto opraví?",
    a: "Auto si môžete dať opraviť sami, alebo ho dáme opraviť u overených partnerov. Pri oprave cez nás dostanete cenovú ponuku vopred."
  },
  {
    q: "Ako funguje bonus na tuning v RACEM?",
    a: "Pri odovzdaní auta dostanete unikátny kód s kreditom do e-shopu RACEM.sk. Výška kreditu závisí od ceny auta (200 €, 400 € alebo 700 €). Kredit platí 12 mesiacov na celý sortiment."
  }
];

export const CREDIT_TIERS = [
  { label: "Auto do 15 000 €", v: 200 },
  { label: "Auto 15 000 – 30 000 €", v: 400 },
  { label: "Auto nad 30 000 €", v: 700 }
];
