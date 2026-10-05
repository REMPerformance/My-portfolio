/** Najhľadanejšie modely na dovoz. Každý má vlastnú stránku /znacky/[značka]/[model]. */
import { MAKES, type MakeDef } from "./makes";
import { slugify } from "./format";
import type { CarType } from "./types";

export interface ModelDef {
  make: string;
  name: string;
  slug: string;
  type: CarType;
  /** krátky fakt o modeli, ktorý je užitočný pri dovoze */
  note: string;
}

const M = (make: string, name: string, type: CarType, note: string): ModelDef => ({ make, name, slug: slugify(name), type, note });

export const MODELS: ModelDef[] = [
  M("bmw", "M3", "car", "BMW M3 sa v USA predáva aj s manuálnou prevodovkou a na aukciách je ho citeľne viac ako v Európe."),
  M("bmw", "M4", "car", "BMW M4 patrí medzi najčastejšie dovážané športové kupé. Pri havarovaných kusoch sledujeme hlavne stav karbónových dielov a podvozku."),
  M("bmw", "M5", "car", "BMW M5 s motorom V8 stráca v USA hodnotu rýchlejšie ako v Európe, preto býva dovoz cenovo zaujímavý."),
  M("bmw", "X5", "suv", "BMW X5 sa vyrába v závode Spartanburg v Južnej Karolíne, takže americká ponuka je mimoriadne široká."),
  M("bmw", "X7", "suv", "BMW X7 sa vyrába v USA a na americkom trhu je bežne dostupné aj s motorom V8."),
  M("mercedes-benz", "G 63 AMG", "suv", "Mercedes-AMG G 63 sa najčastejšie dováža z Dubaja, kde je veľký výber kusov s nízkym nájazdom, a z USA."),
  M("mercedes-benz", "GLE", "suv", "Mercedes-Benz GLE sa vyrába v Alabame, preto je v USA široká ponuka vrátane verzií AMG."),
  M("mercedes-benz", "GLS", "suv", "Mercedes-Benz GLS je sedemmiestne SUV vyrábané v USA. Americké kusy mávajú bohatú výbavu už v základe."),
  M("mercedes-benz", "AMG GT", "car", "Mercedes-AMG GT sa oplatí porovnať v USA aj v Emirátoch. Pri každom kuse overujeme servisnú históriu."),
  M("audi", "RS6", "car", "Audi RS6 Avant sa v USA predáva až od generácie C8, staršie ročníky preto hľadáme v EÚ."),
  M("audi", "RS7", "car", "Audi RS7 je v USA dostupnejšie ako RS6 a ceny jazdených kusov bývajú nižšie ako v Európe."),
  M("audi", "Q7", "suv", "Audi Q7 je na amerických aukciách bežné auto, väčšinou s benzínovým motorom a sedemmiestnou výbavou."),
  M("audi", "Q8", "suv", "Audi Q8 vrátane verzií SQ8 a RS Q8 sa dá doviezť z USA aj z Emirátov."),
  M("audi", "R8", "car", "Audi R8 s atmosférickým motorom V10 sa už nevyrába, preto si jazdené kusy držia hodnotu."),
  M("porsche", "911", "car", "Porsche 911 má v USA najväčší trh na svete. Výber verzií Carrera, Turbo aj GT3 je obrovský, rozhoduje história a stav."),
  M("porsche", "Cayenne", "suv", "Porsche Cayenne z USA býva takmer vždy benzínové alebo hybridné, naftové verzie hľadáme v EÚ."),
  M("porsche", "Macan", "suv", "Porsche Macan patrí k najpredávanejším modelom značky v USA, takže jazdených kusov je veľa a ceny sú priaznivé."),
  M("porsche", "Panamera", "car", "Porsche Panamera sa oplatí porovnať v USA, Emirátoch aj v Nemecku."),
  M("porsche", "Taycan", "car", "Pri elektrickom Porsche Taycan overujeme stav batérie a typ nabíjania pred kúpou."),
  M("ford", "Mustang GT", "car", "Ford Mustang GT s motorom V8 5.0 je najčastejšie dovážané americké športové auto. V USA je bežný aj s manuálnou prevodovkou."),
  M("ford", "F-150", "truck", "Rad Ford F patrí dlhodobo k najpredávanejším autám v USA, takže výber je obrovský. Ako pickup má pri dovoze clo 22 %."),
  M("ford", "F-150 Raptor", "truck", "Ford F-150 Raptor je terénna verzia so širším rozchodom. Pri homologizácii riešime rozmery a osvetlenie."),
  M("ford", "Bronco", "suv", "Ford Bronco sa v Európe predáva len v obmedzenom počte, z USA je dostupný vo všetkých výbavách."),
  M("ford", "Explorer", "suv", "Americký Ford Explorer je veľké benzínové SUV so siedmimi miestami, odlišné od európskeho elektrického modelu s rovnakým menom."),
  M("ford", "Mustang Mach-E", "suv", "Pri elektrickom Mustangu Mach-E z USA overujeme nabíjací konektor a možnosti homologizácie."),
  M("chevrolet", "Corvette", "car", "Chevrolet Corvette generácie C8 má motor V8 uložený za sedadlami. V USA je výrazne dostupnejšia ako v Európe."),
  M("chevrolet", "Camaro SS", "car", "Výroba Chevroletu Camaro sa skončila modelovým rokom 2024, takže zostávajú len jazdené kusy z USA a Kanady."),
  M("chevrolet", "Tahoe", "suv", "Chevrolet Tahoe je veľké americké SUV s motorom V8, ktoré sa v Európe oficiálne nepredáva."),
  M("chevrolet", "Silverado", "truck", "Chevrolet Silverado je plnohodnotný americký pickup. Pri dovoze sa naň vzťahuje clo 22 %."),
  M("dodge", "Challenger", "car", "Výroba Dodge Challenger s motormi V8 sa skončila v roku 2023. Verzie Scat Pack a Hellcat sa dajú kúpiť už len ako jazdené."),
  M("dodge", "Charger", "car", "Dodge Charger je štvordverový muscle car, ktorý sa v EÚ oficiálne nepredával."),
  M("dodge", "Durango SRT", "suv", "Dodge Durango SRT spája sedem miest s motorom V8 HEMI. V Európe sa nepredáva."),
  M("ram", "1500", "truck", "RAM 1500 je najkomfortnejší z veľkých amerických pickupov. Pri dovoze rátajte s clom 22 %."),
  M("ram", "1500 TRX", "truck", "RAM 1500 TRX má preplňovaný motor V8 6.2 z rodiny Hellcat s výkonom 702 koní."),
  M("jeep", "Wrangler", "suv", "Jeep Wrangler z USA je dostupný v oveľa viac výbavách ako v Európe, vrátane verzie Rubicon 392 s motorom V8."),
  M("jeep", "Grand Cherokee", "suv", "Jeep Grand Cherokee z USA ponúka aj verzie SRT a Trackhawk, ktoré sa v Európe predávali len okrajovo."),
  M("jeep", "Gladiator", "truck", "Jeep Gladiator je pickup postavený na Wrangleri. Ako pickup má clo 22 %."),
  M("tesla", "Model 3", "car", "Pri Tesle Model 3 z USA overujeme nabíjací konektor, stav batérie a to, či auto nemá zablokované rýchle nabíjanie po poistnej udalosti."),
  M("tesla", "Model Y", "suv", "Tesla Model Y je najčastejšie dražená Tesla. Pred kúpou overujeme batériu a podporu rýchleho nabíjania."),
  M("tesla", "Model S", "car", "Tesla Model S vrátane verzie Plaid býva na amerických aukciách výrazne lacnejšia ako v EÚ."),
  M("tesla", "Model X", "suv", "Pri Tesle Model X kontrolujeme okrem batérie aj mechaniku zadných dverí."),
  M("tesla", "Cybertruck", "truck", "Tesla Cybertruck nemá európske typové schválenie, preto je prihlásenie v EÚ problematické. Možnosti overujeme pred kúpou."),
  M("toyota", "Land Cruiser", "suv", "Toyota Land Cruiser sa najčastejšie dováža z Emirátov, kde sa predávajú verzie určené pre náročné podmienky."),
  M("toyota", "Tundra", "truck", "Toyota Tundra je veľký pickup vyrábaný v Texase, v Európe sa nepredáva. Clo na pickupy je 22 %."),
  M("toyota", "Tacoma", "truck", "Toyota Tacoma je stredne veľký pickup s povesťou mimoriadnej spoľahlivosti."),
  M("toyota", "4Runner", "suv", "Toyota 4Runner je rámové terénne SUV, ktoré sa v Európe nepredáva."),
  M("toyota", "Supra", "car", "Novú Toyotu Supra hľadáme v USA, legendárnu štvrtú generáciu v Japonsku."),
  M("lexus", "LX 600", "suv", "Lexus LX je luxusná verzia Land Cruisera. Najväčší výber je v Emirátoch a v USA."),
  M("lexus", "GX 550", "suv", "Lexus GX je rámové SUV, ktoré sa v Európe dlho nepredávalo."),
  M("nissan", "GT-R", "car", "Nissan GT-R R35 sa hľadá v USA aj v Japonsku. Staršie Skyline GT-R sú z Japonska s pravostranným riadením."),
  M("nissan", "Patrol", "suv", "Nissan Patrol s motorom V8 je typické auto z Emirátov, v Európe sa aktuálna generácia nepredáva."),
  M("land-rover", "Range Rover", "suv", "Range Rover z Dubaja býva v najvyššej výbave. Pri každom kuse overujeme servisnú históriu a elektroniku."),
  M("land-rover", "Defender", "suv", "Nový Land Rover Defender sa dá výhodne doviezť z USA aj z Emirátov, vrátane verzie V8."),
  M("cadillac", "Escalade", "suv", "Cadillac Escalade je ikona amerických luxusných SUV. Verzia Escalade-V má preplňovaný motor V8."),
  M("kia", "Telluride", "suv", "Kia Telluride sa vyrába v USA a v Európe sa nepredáva vôbec."),
  M("kia", "Stinger", "car", "Kia Stinger GT s motorom V6 je obľúbená alternatíva k nemeckým sedanom. Výroba sa už skončila."),
  M("hyundai", "Palisade", "suv", "Hyundai Palisade je veľké sedemmiestne SUV pre americký a kórejský trh."),
  M("lamborghini", "Urus", "suv", "Lamborghini Urus sa oplatí porovnať v Dubaji a v USA. Pri autách tejto triedy robíme vždy podrobnú kontrolu."),
  M("lamborghini", "Huracán", "car", "Lamborghini Huracán s atmosférickým motorom V10 sa na amerických aukciách objavuje poškodené aj nepoškodené."),
  M("volkswagen", "Golf GTI", "car", "Volkswagen Golf GTI sa najľahšie hľadá v Nemecku, kde je najväčšia ponuka so servisnou históriou."),
  M("volkswagen", "Golf R", "car", "Volkswagen Golf R dovážame hlavne z Nemecka. Pri aute z EÚ sa neplatí clo."),
  M("volkswagen", "Passat", "car", "Volkswagen Passat z Nemecka je klasika. Kontrolujeme nájazd, servisnú históriu a pôvod auta."),
  M("volkswagen", "Tiguan", "suv", "Volkswagen Tiguan patrí k najpredávanejším SUV v Európe, takže výber v EÚ je veľký."),
  M("volkswagen", "Atlas", "suv", "Volkswagen Atlas je veľké sedemmiestne SUV vyrábané v USA, ktoré sa v Európe nepredáva."),
  M("skoda", "Octavia", "car", "Škoda Octavia je najhľadanejšie jazdené auto na Slovensku. V Nemecku a Rakúsku sa dajú nájsť kusy s overenou históriou."),
  M("skoda", "Superb", "car", "Škoda Superb z krajín EÚ býva vo vyššej výbave, najčastejšie z firemných flotíl so servisnou knižkou."),
  M("skoda", "Kodiaq", "suv", "Škoda Kodiaq dovážame z EÚ, kde je väčší výber výbav a motorov ako na slovenskom trhu."),
  M("volvo", "XC90", "suv", "Volvo XC90 sa oplatí porovnať v EÚ aj v USA. Americké kusy sú benzínové alebo hybridné."),
  M("volvo", "XC60", "suv", "Volvo XC60 je v USA častým autom na aukciách, v EÚ je zasa väčší výber naftových verzií."),
  M("honda", "Civic Type R", "car", "Honda Civic Type R sa hľadá v USA, v EÚ aj v Japonsku. Rozhoduje generácia a to, či chcete ľavostranné riadenie."),
  M("mazda", "MX-5", "car", "Mazda MX-5 sa v USA volá Miata a ponuka je tam veľmi široká, vrátane starších generácií bez korózie z južných štátov."),
  M("subaru", "WRX STI", "car", "Subaru WRX STI sa už nevyrába. Jazdené kusy hľadáme v USA a v Japonsku."),
  M("gmc", "Sierra", "truck", "GMC Sierra je technicky príbuzná Chevroletu Silverado, vo výbave Denali je však citeľne luxusnejšia."),
  M("gmc", "Yukon", "suv", "GMC Yukon Denali je veľké SUV s motorom V8, príbuzné Chevroletu Tahoe a Cadillacu Escalade."),
  M("lincoln", "Navigator", "suv", "Lincoln Navigator je najväčšie SUV značky a v Európe sa nepredáva."),
  M("alfa-romeo", "Giulia Quadrifoglio", "car", "Alfa Romeo Giulia Quadrifoglio má motor V6 s výkonom vyše 500 koní a v USA býva výrazne lacnejšia ako v Európe."),
  M("maserati", "Levante", "suv", "Maserati Levante stráca v USA hodnotu rýchlo, čo je pri dovoze výhoda."),
  M("bentley", "Bentayga", "suv", "Bentley Bentayga sa najčastejšie dováža z Emirátov a z USA."),
  M("rolls-royce", "Cullinan", "suv", "Rolls-Royce Cullinan hľadáme najmä v Dubaji. Pred kúpou overujeme pôvod a servisnú históriu."),
  M("suzuki", "Jimny", "suv", "Suzuki Jimny sa v Európe predáva len obmedzene, preto sa dováža aj z Emirátov a Japonska.")
];

export const modelsOf = (makeSlug: string) => MODELS.filter((m) => m.make === makeSlug);
export const modelBySlug = (makeSlug: string, slug: string) => MODELS.find((m) => m.make === makeSlug && m.slug === slug);
export const modelMake = (m: ModelDef): MakeDef => MAKES.find((x) => x.slug === m.make)!;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
/** Nájde stránku modelu pre auto z ponuky (podľa značky a začiatku názvu modelu). */
export function modelForCar(make: string, model: string, trim?: string | null): ModelDef | undefined {
  const mk = MAKES.find((x) => x.name.toLowerCase() === make.toLowerCase());
  if (!mk) return undefined;
  const full = norm(`${model} ${trim || ""}`);
  // najdlhší názov vyhráva: „F-150 Raptor“ má prednosť pred „F-150“
  return modelsOf(mk.slug).filter((m) => full.includes(norm(m.name)) || norm(model) === norm(m.name.split(" ")[0])).sort((a, b) => b.name.length - a.name.length)[0];
}
export const carMatchesModel = (c: { make: string; model: string; trim?: string | null }, m: ModelDef) => modelForCar(c.make, c.model, c.trim)?.slug === m.slug && modelMake(m).name.toLowerCase() === c.make.toLowerCase();
