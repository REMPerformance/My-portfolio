/** Obľúbené značky na dovoz – pre formulár „auto na mieru“ a SEO stránky /znacky/[slug]. */
export interface MakeDef {
  slug: string;
  name: string;
  /** typické modely, ktoré sa dovážajú */
  models: string[];
  /** odkiaľ sa najčastejšie oplatí (kódy krajín) */
  from: string[];
  /** krátky unikátny odsek pre stránku značky */
  note: string;
}

export const MAKES: MakeDef[] = [
  { slug: "bmw", name: "BMW", models: ["M3", "M4", "M5", "X5", "X6", "X7", "330i", "M340i", "i4", "iX"], from: ["EU", "US", "AE", "CA"], note: "Americké BMW majú často bohatšiu výbavu ako európske verzie a M modely sa na aukciách objavujú za zlomok ceny v EÚ. Pri X5 a X7 zo štátu South Carolina (závod Spartanburg) ide o autá vyrobené priamo v USA." },
  { slug: "mercedes-benz", name: "Mercedes-Benz", models: ["C 300", "E 350", "GLE", "GLS", "G 63 AMG", "S 580", "AMG GT", "CLA"], from: ["EU", "US", "AE"], note: "Mercedesy z Dubaja bývajú vo vysokej výbave s nízkym nájazdom, z USA zasa lákajú AMG verzie. GLE a GLS sa vyrábajú v Alabame." },
  { slug: "audi", name: "Audi", models: ["RS6", "RS7", "Q7", "Q8", "SQ5", "A6", "e-tron GT", "R8"], from: ["EU", "US", "CA"], note: "Audi RS modely a veľké SUV Q7/Q8 z amerických aukcií ušetria oproti slovenskému trhu často tisíce eur." },
  { slug: "porsche", name: "Porsche", models: ["911", "Cayenne", "Macan", "Panamera", "Taycan"], from: ["EU", "US", "AE", "CA"], note: "Pri Porsche sa oplatí porovnať USA aj Dubaj – ceny 911 a Cayenne bývajú výrazne nižšie ako v Európe, pozor len na výbavu a servisnú históriu." },
  { slug: "ford", name: "Ford", models: ["Mustang GT", "Mustang Mach-E", "F-150", "F-150 Raptor", "Bronco", "Explorer", "Expedition"], from: ["US", "CA"], note: "Ford Mustang GT s V8 a pickup F-150 sú najčastejšie dovážané americké autá. Pickupy majú clo 22 % – kalkulačka to počíta automaticky." },
  { slug: "chevrolet", name: "Chevrolet", models: ["Camaro SS", "Corvette", "Silverado", "Tahoe", "Suburban"], from: ["US", "CA"], note: "Camaro a Corvette sú v USA bežne dostupné, v Európe vzácne. Veľké SUV Tahoe a Suburban sa oplatí dovážať hlavne v benzínovej V8 verzii." },
  { slug: "dodge", name: "Dodge", models: ["Challenger", "Charger", "Durango SRT", "Viper"], from: ["US", "CA"], note: "Challenger a Charger (aj Hellcat verzie) sa v EÚ oficiálne nepredávali – dovoz z USA je prakticky jediná cesta." },
  { slug: "ram", name: "RAM", models: ["1500", "1500 TRX", "2500", "3500"], from: ["US", "CA"], note: "RAM 1500 a TRX patria medzi najobľúbenejšie pickupy. Pri pickupoch rátajte s clom 22 % a s väčšími rozmermi pri homologizácii." },
  { slug: "jeep", name: "Jeep", models: ["Wrangler", "Grand Cherokee", "Gladiator", "Grand Wagoneer"], from: ["US", "CA"], note: "Wrangler a Grand Cherokee z USA majú často motory a výbavy, ktoré v Európe nenájdete, napríklad V8 alebo Trackhawk." },
  { slug: "tesla", name: "Tesla", models: ["Model 3", "Model Y", "Model S", "Model X", "Cybertruck"], from: ["US", "CA"], note: "Pri Tesle z USA overujeme typ nabíjacieho konektora a možnosti homologizácie. Model S a X z aukcií bývajú výrazne lacnejšie ako v EÚ." },
  { slug: "toyota", name: "Toyota", models: ["Tundra", "Tacoma", "4Runner", "Land Cruiser", "Supra", "Sequoia"], from: ["US", "AE", "JP"], note: "Land Cruiser z Dubaja a Tundra či 4Runner z USA majú povesť nezničiteľných áut a v Európe sa takmer nepredávajú." },
  { slug: "lexus", name: "Lexus", models: ["LX 600", "GX 550", "RX 350", "IS 500", "LC 500"], from: ["US", "AE", "JP"], note: "Lexus LX a GX sa dovážajú najmä zo SAE a USA, športové IS 500 a LC 500 hlavne z USA." },
  { slug: "nissan", name: "Nissan", models: ["GT-R", "Patrol", "370Z", "Z", "Titan"], from: ["US", "AE", "JP"], note: "Nissan Patrol je typické auto zo SAE, GT-R a Z sa oplatí hľadať v USA alebo priamo v Japonsku." },
  { slug: "land-rover", name: "Land Rover", models: ["Range Rover", "Range Rover Sport", "Defender", "Velar"], from: ["AE", "US"], note: "Range Rovery z Dubaja bývajú v top výbave s malým nájazdom. Pri britských autách z USA kontrolujeme hlavne elektroniku a servisnú históriu." },
  { slug: "cadillac", name: "Cadillac", models: ["Escalade", "CT5-V Blackwing", "CT4-V", "Lyriq"], from: ["US", "AE"], note: "Escalade je ikona amerických SUV – z USA aj Dubaja sa dá doviesť za cenu, za ktorú by ste v Európe mali výrazne slabšie auto." },
  { slug: "hyundai", name: "Hyundai", models: ["Genesis", "Palisade", "Santa Fe", "Ioniq 5", "Elantra N"], from: ["KR", "US"], note: "Autá vyrobené v Kórei môžu mať pri preukázaní pôvodu nulové clo vďaka dohode EÚ – Kórea." },
  { slug: "kia", name: "Kia", models: ["Stinger", "Telluride", "EV6", "EV9", "Carnival"], from: ["KR", "US"], note: "Kia Telluride sa v Európe nepredáva vôbec, Stinger GT s V6 z USA je obľúbená alternatíva k nemeckým sedanom." },
  { slug: "lamborghini", name: "Lamborghini", models: ["Urus", "Huracán", "Aventador", "Revuelto"], from: ["AE", "US"], note: "Superšportové autá sa oplatí hľadať v Dubaji a USA – pri takýchto autách robíme vždy detailnú kontrolu histórie a poškodenia." },
  { slug: "ferrari", name: "Ferrari", models: ["F8", "Roma", "296 GTB", "SF90", "Purosangue"], from: ["AE", "US"], note: "Ferrari z Dubaja bývajú s nízkym nájazdom. Vždy overujeme servisnú knižku, históriu a pôvod auta." },
  { slug: "volkswagen", name: "Volkswagen", models: ["Golf GTI", "Golf R", "Passat", "Tiguan", "Touareg", "Arteon", "Atlas", "ID.4"], from: ["EU", "US"], note: "Volkswagen sa najčastejšie dováža z Nemecka a ďalších krajín EÚ, kde je najväčší výber jazdených áut so servisnou históriou. Z USA dávajú zmysel modely, ktoré sa v Európe nepredávajú, napríklad veľké SUV Atlas." },
  { slug: "skoda", name: "Škoda", models: ["Octavia", "Octavia RS", "Superb", "Kodiaq", "Karoq", "Enyaq"], from: ["EU"], note: "Škodu dovážame z krajín EÚ, najmä z Nemecka, Rakúska a Česka. Pri aute z EÚ sa neplatí clo a odpadá námorná preprava." },
  { slug: "volvo", name: "Volvo", models: ["XC90", "XC60", "XC40", "V90", "S60", "S90"], from: ["EU", "US"], note: "Volvo sa oplatí porovnať v EÚ aj v USA. Americké XC90 a XC60 bývajú na aukciách výrazne lacnejšie, európske kusy majú jednoduchšie prihlásenie." },
  { slug: "honda", name: "Honda", models: ["Civic Type R", "Civic Si", "Accord", "CR-V", "Pilot", "Ridgeline", "S2000"], from: ["US", "JP", "CA"], note: "Honda z USA znamená spoľahlivé benzínové motory a modely, ktoré v Európe chýbajú, napríklad Pilot alebo Ridgeline. Športové modely ako S2000 a staršie Civic Type R sa hľadajú aj v Japonsku." },
  { slug: "mazda", name: "Mazda", models: ["MX-5", "CX-5", "CX-50", "CX-90", "Mazda3", "RX-7"], from: ["US", "JP"], note: "Mazda MX-5 je v USA známa ako Miata a ponuka je tam obrovská. Veľké SUV CX-90 a legendárne RX-7 z Japonska patria medzi najžiadanejšie." },
  { slug: "subaru", name: "Subaru", models: ["WRX", "WRX STI", "Outback", "Forester", "BRZ", "Crosstrek"], from: ["US", "JP"], note: "Subaru má v USA oveľa väčšie zastúpenie ako v Európe. WRX a STI s pohonom všetkých kolies sa dajú nájsť na aukciách aj u predajcov." },
  { slug: "mitsubishi", name: "Mitsubishi", models: ["Lancer Evolution", "Pajero", "Outlander", "Eclipse", "3000GT"], from: ["JP", "US", "AE"], note: "Lancer Evolution a Pajero sú ikony, ktoré sa dnes hľadajú hlavne v Japonsku a v Emirátoch." },
  { slug: "gmc", name: "GMC", models: ["Sierra", "Sierra Denali", "Yukon", "Yukon Denali", "Hummer EV", "Canyon"], from: ["US", "CA", "AE"], note: "GMC sa v Európe oficiálne nepredáva. Sierra a Yukon vo výbave Denali patria k najluxusnejším americkým pickupom a SUV." },
  { slug: "lincoln", name: "Lincoln", models: ["Navigator", "Aviator", "Nautilus", "Corsair"], from: ["US", "CA"], note: "Lincoln je luxusná značka Fordu, ktorá sa v Európe nepredáva. Navigator je priamy konkurent Cadillacu Escalade." },
  { slug: "infiniti", name: "Infiniti", models: ["QX80", "QX60", "Q50", "Q60"], from: ["US", "AE"], note: "Infiniti z európskeho trhu odišlo, takže dovoz z USA alebo Emirátov je dnes jediná cesta k novším ročníkom." },
  { slug: "acura", name: "Acura", models: ["NSX", "MDX", "RDX", "Integra", "TLX"], from: ["US", "CA"], note: "Acura je prémiová značka Hondy určená pre Severnú Ameriku. V Európe sa nepredáva, preto ide vždy o dovoz." },
  { slug: "genesis", name: "Genesis", models: ["G70", "G80", "G90", "GV70", "GV80"], from: ["KR", "US"], note: "Genesis je luxusná značka Hyundai. Autá vyrobené v Kórei môžu mať pri preukázaní pôvodu nulové clo." },
  { slug: "mini", name: "Mini", models: ["Cooper S", "John Cooper Works", "Countryman", "Clubman"], from: ["EU", "US"], note: "Mini sa oplatí hľadať v EÚ kvôli jednoduchému prihláseniu, v USA zasa kvôli nižším cenám verzií John Cooper Works." },
  { slug: "jaguar", name: "Jaguar", models: ["F-Type", "F-Pace", "XF", "XE", "I-Pace"], from: ["US", "EU", "AE"], note: "Jaguar F-Type s motorom V8 je v USA cenovo veľmi zaujímavý. Pri britských autách vždy kontrolujeme servisnú históriu." },
  { slug: "maserati", name: "Maserati", models: ["Ghibli", "Levante", "Quattroporte", "GranTurismo", "MC20"], from: ["US", "AE", "EU"], note: "Maserati stráca v USA hodnotu rýchlo, takže jazdené Ghibli a Levante bývajú citeľne lacnejšie ako v Európe." },
  { slug: "bentley", name: "Bentley", models: ["Continental GT", "Bentayga", "Flying Spur"], from: ["AE", "US"], note: "Bentley z Dubaja býva s nízkym nájazdom a vo vysokej výbave. Pri každom aute overujeme históriu a pôvod." },
  { slug: "rolls-royce", name: "Rolls-Royce", models: ["Cullinan", "Ghost", "Phantom", "Wraith"], from: ["AE", "US"], note: "Rolls-Royce sa oplatí porovnať v Dubaji a v USA. Pri autách tejto triedy robíme vždy podrobnú kontrolu pred kúpou." },
  { slug: "aston-martin", name: "Aston Martin", models: ["Vantage", "DB11", "DBX", "DBS"], from: ["US", "AE"], note: "Aston Martin z USA a Emirátov býva lacnejší ako v Európe, rozhoduje však servisná história a stav." },
  { slug: "mclaren", name: "McLaren", models: ["720S", "570S", "Artura", "GT"], from: ["US", "AE"], note: "Superšportové McLareny sa na amerických aukciách objavujú pravidelne, poškodené aj nepoškodené." },
  { slug: "alfa-romeo", name: "Alfa Romeo", models: ["Giulia Quadrifoglio", "Stelvio Quadrifoglio", "Giulia", "Stelvio", "4C"], from: ["US", "EU"], note: "Giulia a Stelvio Quadrifoglio sú v USA dostupné za ceny, ktoré v Európe nenájdete. Bežné verzie sa oplatí hľadať skôr v EÚ." },
  { slug: "chrysler", name: "Chrysler", models: ["300", "300C SRT", "Pacifica"], from: ["US", "CA"], note: "Chrysler 300 s motorom V8 HEMI a rodinná Pacifica sú typické americké autá, ktoré sa v Európe už nepredávajú." },
  { slug: "renault", name: "Renault", models: ["Megane", "Megane RS", "Clio", "Captur", "Scenic", "Talisman"], from: ["EU"], note: "Renault dovážame z krajín EÚ, najčastejšie z Nemecka a Francúzska. Bez cla a bez námornej prepravy." },
  { slug: "peugeot", name: "Peugeot", models: ["308", "3008", "5008", "508", "208"], from: ["EU"], note: "Peugeot z EÚ je dobrá voľba, ak hľadáte novšie auto s nízkym nájazdom. Clo sa neplatí." },
  { slug: "opel", name: "Opel", models: ["Astra", "Insignia", "Corsa", "Mokka", "Grandland"], from: ["EU"], note: "Opel má v Nemecku obrovskú ponuku jazdených áut. Pri dovoze z EÚ sa neplatí clo." },
  { slug: "seat-cupra", name: "Seat a Cupra", models: ["Leon", "Leon Cupra", "Ateca", "Formentor", "Tarraco"], from: ["EU"], note: "Seat Leon a Cupra Formentor patria k najhľadanejším autám z Nemecka a Španielska." },
  { slug: "fiat", name: "Fiat", models: ["500", "500 Abarth", "Ducato", "Tipo", "Panda"], from: ["EU"], note: "Fiat dovážame z krajín EÚ. Obľúbené sú mestské 500 a dodávky Ducato, aj ako základ pre obytné auto." },
  { slug: "suzuki", name: "Suzuki", models: ["Jimny", "Swift Sport", "Vitara", "SX4 S-Cross"], from: ["EU", "JP", "AE"], note: "Suzuki Jimny je v Európe nedostatkový tovar, preto sa hľadá aj v Japonsku a Emirátoch." },
  { slug: "byd", name: "BYD", models: ["Seal", "Atto 3", "Han", "Tang", "Dolphin"], from: ["CN", "EU"], note: "Pri elektromobiloch z Číny počítame aj s vyrovnávacím clom EÚ. Pred kúpou Vám spočítame, či sa dovoz oplatí viac ako kúpa v EÚ." },
  { slug: "jdm-japonsko", name: "JDM autá z Japonska", models: ["Nissan Skyline GT-R", "Toyota Supra", "Mazda RX-7", "Honda NSX", "Subaru Impreza STI"], from: ["JP"], note: "Legendárne JDM autá z Japonska s pravostranným riadením. Pri dovoze riešime aj homologizáciu pravostranného auta." }
];

export const makeBySlug = (s: string) => MAKES.find((m) => m.slug === s);
export const MAKE_NAMES = [...new Set(MAKES.filter((m) => m.slug !== "jdm-japonsko" && m.slug !== "seat-cupra").map((m) => m.name).concat(["Seat", "Cupra", "Dacia", "Citroën", "Hyundai", "Smart"]).concat(["Acura", "Alfa Romeo", "Aston Martin", "Bentley", "Buick", "Chrysler", "Genesis", "GMC", "Honda", "Infiniti", "Lincoln", "Maserati", "Mazda", "McLaren", "Mini", "Rolls-Royce", "Subaru", "Volkswagen", "Volvo"]))].sort((a, b) => a.localeCompare(b));
