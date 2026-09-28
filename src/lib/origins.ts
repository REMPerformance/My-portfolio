/**
 * Odkiaľ autá dovážame: krajiny, štáty/emiráty/provincie, prístavy a predvolené náklady na dopravu.
 * Všetky náklady na dopravu sú v USD (tak ich účtujú prepravcovia), cena auta je v mene krajiny.
 * Hodnoty sú predvolené – v admine (Kalkulačka) sa dajú prepísať.
 */

export type CountryCode = "US" | "CA" | "AE" | "KR" | "JP" | "CN";
export type Currency = "USD" | "CAD" | "AED" | "KRW" | "JPY" | "CNY" | "EUR";

export interface Port { id: string; name: string; oceanUsd: number }
export interface Place { code: string; name: string; port: string; inlandUsd: number }
export interface CountryDef {
  code: CountryCode;
  name: string;
  /** v lokáli – „z USA“, „zo SAE“ */
  from: string;
  flag: string;
  currency: Currency;
  placeLabel: string;
  ports: Port[];
  places: Place[];
  note?: string;
}

const P = (code: string, name: string, port: string, inlandUsd: number): Place => ({ code, name, port, inlandUsd });

export const COUNTRIES: CountryDef[] = [
  {
    code: "US", name: "USA", from: "z USA", flag: "🇺🇸", currency: "USD", placeLabel: "Štát",
    ports: [
      { id: "us-nj", name: "Newark (NJ)", oceanUsd: 1150 },
      { id: "us-sav", name: "Savannah (GA)", oceanUsd: 1200 },
      { id: "us-mia", name: "Miami (FL)", oceanUsd: 1250 },
      { id: "us-hou", name: "Houston (TX)", oceanUsd: 1300 },
      { id: "us-la", name: "Los Angeles (CA)", oceanUsd: 1900 }
    ],
    places: [
      P("AL", "Alabama", "us-sav", 500), P("AK", "Aljaška", "us-la", 2500), P("AZ", "Arizona", "us-la", 550),
      P("AR", "Arkansas", "us-hou", 550), P("CA", "Kalifornia", "us-la", 450), P("CO", "Colorado", "us-hou", 850),
      P("CT", "Connecticut", "us-nj", 350), P("DE", "Delaware", "us-nj", 350), P("DC", "Washington D.C.", "us-nj", 400),
      P("FL", "Florida", "us-mia", 300), P("GA", "Georgia", "us-sav", 300), P("HI", "Havaj", "us-la", 1800),
      P("ID", "Idaho", "us-la", 1000), P("IL", "Illinois", "us-nj", 700), P("IN", "Indiana", "us-nj", 650),
      P("IA", "Iowa", "us-nj", 850), P("KS", "Kansas", "us-hou", 700), P("KY", "Kentucky", "us-sav", 600),
      P("LA", "Louisiana", "us-hou", 450), P("ME", "Maine", "us-nj", 650), P("MD", "Maryland", "us-nj", 400),
      P("MA", "Massachusetts", "us-nj", 450), P("MI", "Michigan", "us-nj", 700), P("MN", "Minnesota", "us-nj", 950),
      P("MS", "Mississippi", "us-hou", 550), P("MO", "Missouri", "us-hou", 700), P("MT", "Montana", "us-la", 1300),
      P("NE", "Nebraska", "us-hou", 850), P("NV", "Nevada", "us-la", 500), P("NH", "New Hampshire", "us-nj", 550),
      P("NJ", "New Jersey", "us-nj", 250), P("NM", "Nové Mexiko", "us-hou", 750), P("NY", "New York", "us-nj", 350),
      P("NC", "Severná Karolína", "us-sav", 450), P("ND", "Severná Dakota", "us-nj", 1200), P("OH", "Ohio", "us-nj", 600),
      P("OK", "Oklahoma", "us-hou", 550), P("OR", "Oregon", "us-la", 900), P("PA", "Pensylvánia", "us-nj", 400),
      P("RI", "Rhode Island", "us-nj", 450), P("SC", "Južná Karolína", "us-sav", 350), P("SD", "Južná Dakota", "us-hou", 1100),
      P("TN", "Tennessee", "us-sav", 550), P("TX", "Texas", "us-hou", 350), P("UT", "Utah", "us-la", 800),
      P("VT", "Vermont", "us-nj", 600), P("VA", "Virgínia", "us-nj", 500), P("WA", "Washington", "us-la", 1100),
      P("WV", "Západná Virgínia", "us-nj", 600), P("WI", "Wisconsin", "us-nj", 800), P("WY", "Wyoming", "us-hou", 1100)
    ]
  },
  {
    code: "AE", name: "Spojené arabské emiráty", from: "zo SAE", flag: "🇦🇪", currency: "AED", placeLabel: "Emirát",
    ports: [{ id: "ae-jea", name: "Džebel Ali (Dubaj)", oceanUsd: 1500 }],
    places: [
      P("DXB", "Dubaj", "ae-jea", 150), P("AUH", "Abú Zabí", "ae-jea", 300), P("SHJ", "Šardža", "ae-jea", 200),
      P("AJM", "Adžmán", "ae-jea", 250), P("UAQ", "Umm al-Kajvajn", "ae-jea", 300), P("RAK", "Ras al-Chajma", "ae-jea", 350),
      P("FUJ", "Fudžajra", "ae-jea", 400)
    ],
    note: "Autá z Dubaja sú často vo „GCC“ špecifikácii – overte kompatibilitu s homologizáciou v EÚ."
  },
  {
    code: "CA", name: "Kanada", from: "z Kanady", flag: "🇨🇦", currency: "CAD", placeLabel: "Provincia",
    ports: [
      { id: "ca-hal", name: "Halifax", oceanUsd: 1400 },
      { id: "ca-mtl", name: "Montreal", oceanUsd: 1350 },
      { id: "ca-van", name: "Vancouver", oceanUsd: 2100 }
    ],
    places: [
      P("ON", "Ontário", "ca-mtl", 500), P("QC", "Quebec", "ca-mtl", 350), P("NS", "Nové Škótsko", "ca-hal", 300),
      P("NB", "Nový Brunšvik", "ca-hal", 450), P("PE", "Ostrov princa Eduarda", "ca-hal", 500), P("NL", "Newfoundland a Labrador", "ca-hal", 900),
      P("MB", "Manitoba", "ca-mtl", 1200), P("SK", "Saskatchewan", "ca-mtl", 1500), P("AB", "Alberta", "ca-van", 1100),
      P("BC", "Britská Kolumbia", "ca-van", 350)
    ]
  },
  {
    code: "KR", name: "Južná Kórea", from: "z Kórey", flag: "🇰🇷", currency: "KRW", placeLabel: "Región",
    ports: [{ id: "kr-inc", name: "Inčchon / Pusan", oceanUsd: 1800 }],
    places: [P("SEL", "Soul", "kr-inc", 250), P("ICN", "Inčchon", "kr-inc", 200), P("GG", "Kjonggi", "kr-inc", 250), P("PUS", "Pusan", "kr-inc", 200), P("KR-X", "Iný región", "kr-inc", 400)],
    note: "Autá vyrobené v Kórei môžu mať pri preukázaní pôvodu 0 % clo (dohoda EÚ – Kórea)."
  },
  {
    code: "JP", name: "Japonsko", from: "z Japonska", flag: "🇯🇵", currency: "JPY", placeLabel: "Región",
    ports: [{ id: "jp-yok", name: "Jokohama / Kóbe", oceanUsd: 1900 }],
    places: [P("TYO", "Tokio", "jp-yok", 250), P("YOK", "Jokohama", "jp-yok", 200), P("OSA", "Ósaka", "jp-yok", 300), P("NGO", "Nagoja", "jp-yok", 300), P("UKB", "Kóbe", "jp-yok", 200), P("FUK", "Fukuoka", "jp-yok", 450), P("JP-X", "Iný región", "jp-yok", 500)],
    note: "Autá vyrobené v Japonsku môžu mať pri preukázaní pôvodu 0 % clo (dohoda EÚ – Japonsko). Pozor na pravostranné riadenie."
  },
  {
    code: "CN", name: "Čína", from: "z Číny", flag: "🇨🇳", currency: "CNY", placeLabel: "Región",
    ports: [{ id: "cn-sha", name: "Šanghaj / Šen-čen", oceanUsd: 1700 }],
    places: [P("SHA", "Šanghaj", "cn-sha", 200), P("SZX", "Šen-čen", "cn-sha", 250), P("CAN", "Kanton", "cn-sha", 300), P("PEK", "Peking / Tchien-ťin", "cn-sha", 350), P("CN-X", "Iný región", "cn-sha", 500)],
    note: "Na elektromobily z Číny sa v EÚ uplatňuje aj vyrovnávacie clo – overte pred kúpou."
  }
];

export const CURRENCIES: { code: Currency; name: string; symbol: string }[] = [
  { code: "USD", name: "Americký dolár", symbol: "$" },
  { code: "CAD", name: "Kanadský dolár", symbol: "C$" },
  { code: "AED", name: "Dirham SAE", symbol: "AED" },
  { code: "KRW", name: "Kórejský won", symbol: "₩" },
  { code: "JPY", name: "Japonský jen", symbol: "¥" },
  { code: "CNY", name: "Čínsky jüan", symbol: "¥" },
  { code: "EUR", name: "Euro", symbol: "€" }
];

/** Orientačné kurzy (koľko EUR za 1 jednotku meny). V admine sa dajú prepísať. */
export const DEFAULT_FX: Record<Currency, number> = { USD: 0.86, CAD: 0.63, AED: 0.234, KRW: 0.00063, JPY: 0.0058, CNY: 0.12, EUR: 1 };

export const countryDef = (code?: string | null) => COUNTRIES.find((c) => c.code === code) || COUNTRIES[0];
export const placeDef = (country?: string | null, code?: string | null) => countryDef(country).places.find((p) => p.code === code) || null;
export const portDef = (country: string | null | undefined, id: string) => countryDef(country).ports.find((p) => p.id === id) || countryDef(country).ports[0];

/** Kľúč pre prepísané náklady v nastaveniach: „US-TX“. */
export const placeKey = (country: string, code: string) => `${country}-${code}`;

/** Z textu lokality („Dallas, TX“) skúsi odhadnúť štát USA / provinciu. */
export function guessPlace(country: string, loc: string): string | null {
  const c = countryDef(country);
  const m = loc.match(/,\s*([A-Z]{2})\b/);
  if (m && c.places.some((p) => p.code === m[1])) return m[1];
  const l = loc.toLowerCase();
  const byName = c.places.find((p) => l.includes(p.name.toLowerCase()));
  return byName?.code ?? null;
}

export function placeName(country?: string | null, code?: string | null) {
  const p = placeDef(country, code);
  if (!code) return null;
  return p ? p.name : null;
}
