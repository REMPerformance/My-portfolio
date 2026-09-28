/** Rozpoznanie údajov z VIN dekódera (NHTSA) a z textu skopírovaného z inzerátu (Copart, IAAI, dealer). */
import type { CarType, RunStatus } from "./types";

export interface Parsed {
  year?: number; make?: string; model?: string; trim?: string; vin?: string; type?: CarType;
  engine?: string; transmission?: string; drive?: string; fuel?: string; color?: string;
  odometer_mi?: number; keys?: boolean; run_status?: RunStatus; title_type?: string;
  primary_damage?: string; secondary_damage?: string; lot?: string; location?: string; state?: string;
  current_bid?: number; buy_now?: number; auction?: string; sale_date?: string;
}

const UPPER = new Set(["BMW", "GMC", "RAM", "MINI", "AMG", "GT", "SS", "SRT", "RS", "TRX", "XDRIVE", "4MATIC", "EV", "LX", "EX", "SE", "LE", "XLE", "XSE", "TRD", "SUV", "V6", "V8", "V12", "AWD", "FWD", "RWD", "4WD", "4X4", "LT", "LTZ", "RST", "ZL1", "Z06", "GTI", "R", "M", "S"]);
export function titleCase(s: string) {
  return s
    .toLowerCase()
    .split(/(\s+|-|\/)/)
    .map((w) => (UPPER.has(w.toUpperCase()) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join("")
    .replace(/Mercedes Benz/i, "Mercedes-Benz");
}

const FUEL: [RegExp, string][] = [[/plug.?in/i, "Plug-in hybrid"], [/hybrid/i, "Hybrid"], [/electric|elektro|\bev\b/i, "Elektro"], [/diesel/i, "Diesel"], [/gas|petrol|benz|flexible/i, "Benzín"]];
export const mapFuel = (s?: string | null) => (s ? FUEL.find(([r]) => r.test(s))?.[1] : undefined);
export function mapDrive(s?: string | null) {
  if (!s) return undefined;
  if (/4x4|4wd|four|4-wheel/i.test(s)) return "4x4";
  if (/awd|all.?wheel/i.test(s)) return "AWD";
  if (/rwd|rear/i.test(s)) return "RWD";
  if (/fwd|front/i.test(s)) return "FWD";
  return s;
}
export function mapType(body?: string | null): CarType | undefined {
  if (!body) return undefined;
  if (/motorcycle|scooter/i.test(body)) return "moto";
  if (/pickup|truck|van|cargo/i.test(body)) return "truck";
  if (/sport utility|suv|crossover|mpv/i.test(body)) return "suv";
  return "car";
}

const DAMAGE: [RegExp, string][] = [
  [/front/i, "Predok"], [/rear/i, "Zadok"], [/left/i, "Ľavý bok"], [/right/i, "Pravý bok"], [/\bside/i, "Bok"],
  [/all over/i, "Celé auto"], [/hail/i, "Krupobitie"], [/flood|water/i, "Záplava"], [/burn|fire/i, "Požiar"],
  [/roll/i, "Prevrátenie"], [/roof|top/i, "Strecha"], [/under/i, "Podvozok"], [/mechanical/i, "Mechanické"],
  [/electrical/i, "Elektrika"], [/vandal/i, "Vandalizmus"], [/minor|scratch|dent/i, "Drobné škrabance / preliačiny"],
  [/normal wear/i, "Bežné opotrebenie"], [/strip/i, "Rozobraté"], [/biohazard/i, "Biohazard"], [/none|no damage/i, "Bez poškodenia"]
];
export function mapDamage(s?: string | null) {
  if (!s) return undefined;
  const hits = DAMAGE.filter(([r]) => r.test(s)).map(([, v]) => v);
  if (hits.includes("Ľavý bok") || hits.includes("Pravý bok")) return hits.filter((h) => h !== "Bok").join(", ");
  return hits.length ? hits.slice(0, 2).join(", ") : titleCase(s);
}
export function mapTitle(s?: string | null) {
  if (!s) return undefined;
  if (/rebuilt|reconstruct/i.test(s)) return "Rebuilt";
  if (/salvage|damage/i.test(s)) return "Salvage";
  if (/destruct|junk/i.test(s)) return "Certificate of Destruction";
  if (/parts/i.test(s)) return "Parts only";
  if (/clean|clear/i.test(s)) return "Clean";
  return undefined;
}
const money = (s: string) => Number(s.replace(/[^\d.]/g, "")) || undefined;

/** NHTSA vPIC DecodeVinValuesExtended → naše polia. */
export function mapVin(r: Record<string, string>): Parsed {
  const v = (k: string) => (r[k] && r[k] !== "Not Applicable" && r[k] !== "0" ? r[k].trim() : "");
  const disp = v("DisplacementL") ? `${Number(v("DisplacementL")).toFixed(1)}` : "";
  const cyl = v("EngineCylinders");
  const conf = /v-shaped/i.test(v("EngineConfiguration")) ? "V" : /in-line/i.test(v("EngineConfiguration")) ? "R" : /flat|horizontal/i.test(v("EngineConfiguration")) ? "B" : "";
  const turbo = /yes/i.test(v("Turbo")) ? " turbo" : "";
  const elec = /BEV/i.test(v("ElectrificationLevel"));
  const engine = elec ? "Elektro" : [disp, conf && cyl ? `${conf}${cyl}` : cyl ? `${cyl} valce` : ""].filter(Boolean).join(" ") + turbo;
  const trans = v("TransmissionStyle") ? `${/auto/i.test(v("TransmissionStyle")) ? "Automat" : /manual/i.test(v("TransmissionStyle")) ? "Manuál" : v("TransmissionStyle")}${v("TransmissionSpeeds") ? ` ${v("TransmissionSpeeds")}st.` : ""}` : "";
  return {
    year: Number(v("ModelYear")) || undefined,
    make: v("Make") ? titleCase(v("Make")) : undefined,
    model: v("Model") || undefined,
    trim: [v("Trim"), v("Series")].filter(Boolean)[0] || undefined,
    type: mapType(v("BodyClass")),
    engine: engine.trim() || undefined,
    transmission: trans || undefined,
    drive: mapDrive(v("DriveType")),
    fuel: elec ? "Elektro" : mapFuel(v("FuelTypePrimary") + " " + v("ElectrificationLevel"))
  };
}

/** Text skopírovaný z Copart / IAAI / inzerátu. Hľadá „Kľúč: hodnota“ riadky. */
export function parseListing(text: string): Parsed {
  const t = text.replace(/\r/g, "");
  const get = (...keys: string[]) => {
    for (const k of keys) {
      const m = t.match(new RegExp(`(?:^|\\n)\\s*${k}\\s*[:#]?\\s*\\n?\\s*([^\\n]+)`, "i"));
      if (m && m[1].trim()) return m[1].trim();
    }
    return undefined;
  };
  const out: Parsed = {};
  const vin = t.match(/\b([A-HJ-NPR-Z0-9]{17})\b/);
  if (vin) out.vin = vin[1].toUpperCase();
  const TWO = /^(mercedes[- ]benz|land rover|alfa romeo|aston martin|rolls[- ]royce)\b/i;
  const head = t.match(/\b((?:19|20)\d{2})\s+([A-Za-z][^\n]{2,60})/);
  if (head) {
    const words = head[2].trim().split(/\s+/);
    const two = TWO.test(head[2]);
    const make = two ? words.slice(0, words[0].includes("-") ? 1 : 2).join(" ") : words[0];
    const rest = words.slice(make.split(" ").length);
    if (rest.length) {
      out.year = Number(head[1]);
      out.make = titleCase(make);
      out.model = titleCase(rest[0]);
      if (rest.length > 1) out.trim = titleCase(rest.slice(1).join(" "));
    }
  }
  const lot = get("Lot number", "Lot #", "Lot", "Stock #", "Stock");
  if (lot) out.lot = (lot.match(/\d{5,}/) || [lot])[0];
  const odo = get("Odometer", "Mileage", "Najazdené");
  if (odo) {
    const n = Number(odo.replace(/[^\d]/g, "")) || 0;
    out.odometer_mi = /km/i.test(odo) ? Math.round(n / 1.609344) : n || undefined;
  }
  out.primary_damage = mapDamage(get("Primary damage", "Primary Damage", "Loss type"));
  out.secondary_damage = mapDamage(get("Secondary damage", "Secondary Damage"));
  out.engine = get("Engine type", "Engine")?.replace(/\s+/g, " ");
  out.drive = mapDrive(get("Drive", "Drive Line Type", "Drivetrain"));
  out.fuel = mapFuel(get("Fuel", "Fuel type"));
  out.transmission = get("Transmission")?.replace(/automatic/i, "Automat").replace(/manual/i, "Manuál");
  out.color = get("Color", "Exterior color")?.replace(/^\w/, (c) => c.toUpperCase());
  const keys = get("Keys", "Key");
  if (keys) out.keys = /yes|present|áno/i.test(keys);
  const run = get("Highlights", "Start code", "Run and drive", "Condition") || "";
  if (/run and drive|run & drive/i.test(run + t)) out.run_status = "run_drive";
  else if (/engine start|starts/i.test(run)) out.run_status = "starts";
  out.title_type = mapTitle(get("Title code", "Title", "Doc type", "Sale document"));
  const loc = get("Location", "Selling branch", "Yard location", "Branch");
  if (loc) {
    const m1 = loc.match(/^([A-Z]{2})\s*-\s*(.+)$/);
    const m2 = loc.match(/(.+?),\s*([A-Z]{2})\b/);
    if (m1) { out.state = m1[1]; out.location = `${titleCase(m1[2])}, ${m1[1]}`; }
    else if (m2) { out.state = m2[2]; out.location = `${titleCase(m2[1])}, ${m2[2]}`; }
    else out.location = titleCase(loc);
  }
  const bid = get("Current bid", "Current Bid", "High bid");
  if (bid) out.current_bid = money(bid);
  const bn = get("Buy it now", "Buy Now", "Buy It Now Price", "Price", "Cena");
  if (bn) out.buy_now = money(bn);
  if (/copart/i.test(t)) out.auction = "Copart";
  else if (/iaai|insurance auto auctions/i.test(t)) out.auction = "IAAI";
  const sd = get("Sale date", "Auction date", "Live auction");
  if (sd) out.sale_date = sd;
  (Object.keys(out) as (keyof Parsed)[]).forEach((k) => out[k] === undefined && delete out[k]);
  return out;
}
