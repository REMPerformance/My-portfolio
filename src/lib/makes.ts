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
  { slug: "bmw", name: "BMW", models: ["M3", "M4", "M5", "X5", "X6", "X7", "330i", "M340i", "i4", "iX"], from: ["US", "AE", "CA"], note: "Americké BMW majú často bohatšiu výbavu ako európske verzie a M modely sa na aukciách objavujú za zlomok ceny v EÚ. Pri X5 a X7 zo štátu South Carolina (závod Spartanburg) ide o autá vyrobené priamo v USA." },
  { slug: "mercedes-benz", name: "Mercedes-Benz", models: ["C 300", "E 350", "GLE", "GLS", "G 63 AMG", "S 580", "AMG GT", "CLA"], from: ["US", "AE"], note: "Mercedesy z Dubaja bývajú vo vysokej výbave s nízkym nájazdom, z USA zasa lákajú AMG verzie. GLE a GLS sa vyrábajú v Alabame." },
  { slug: "audi", name: "Audi", models: ["RS6", "RS7", "Q7", "Q8", "SQ5", "A6", "e-tron GT", "R8"], from: ["US", "CA"], note: "Audi RS modely a veľké SUV Q7/Q8 z amerických aukcií ušetria oproti slovenskému trhu často tisíce eur." },
  { slug: "porsche", name: "Porsche", models: ["911", "Cayenne", "Macan", "Panamera", "Taycan"], from: ["US", "AE", "CA"], note: "Pri Porsche sa oplatí porovnať USA aj Dubaj – ceny 911 a Cayenne bývajú výrazne nižšie ako v Európe, pozor len na výbavu a servisnú históriu." },
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
  { slug: "jdm-japonsko", name: "JDM autá z Japonska", models: ["Nissan Skyline GT-R", "Toyota Supra", "Mazda RX-7", "Honda NSX", "Subaru Impreza STI"], from: ["JP"], note: "Legendárne JDM autá z Japonska s pravostranným riadením. Pri dovoze riešime aj homologizáciu pravostranného auta." }
];

export const makeBySlug = (s: string) => MAKES.find((m) => m.slug === s);
export const MAKE_NAMES = [...new Set(MAKES.filter((m) => m.slug !== "jdm-japonsko").map((m) => m.name).concat(["Acura", "Alfa Romeo", "Aston Martin", "Bentley", "Buick", "Chrysler", "Genesis", "GMC", "Honda", "Infiniti", "Lincoln", "Maserati", "Mazda", "McLaren", "Mini", "Rolls-Royce", "Subaru", "Volkswagen", "Volvo"]))].sort((a, b) => a.localeCompare(b));
