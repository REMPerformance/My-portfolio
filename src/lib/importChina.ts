/**
 * Import auta z global.che168.com (Autohome, export áut z Číny). Záložka „Import do REM“ stiahne zdrojový kód stránky
 * a vytiahne z neho údaje inzerátu (cena v USD, poplatky za vývoz a prístav, parametre, poznámka predajcu, fotky).
 * Text stránky sa použije len ako záloha, keď sa údaje nepodarí načítať.
 */
import { mapDrive, mapFuel, titleCase, type Parsed } from "./listingParse";
import type { ImportPayload, Imported } from "./importListing";
import type { CalcOverride, DamageZone, Severity } from "./types";

type Obj = Record<string, unknown>;
const s = (v: unknown) => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");
const n = (v: unknown) => Number(String(v ?? "").replace(/[^\d.]/g, "")) || 0;
const num = (x: number) => x.toLocaleString("sk-SK");
const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const low = (x: string) => (/^[A-Z]{2,}$/.test(x) ? x : x.toLowerCase());
/** Zaokrúhli sumu nahor na ďalšiu celú tisícku (rovnako ako pevné ceny z USA). */
const roundUpK = (x: number) => (Math.floor(x / 1000) + 1) * 1000;
function line(text: string, ...keys: string[]) {
  for (const k of keys) {
    const m = text.match(new RegExp(`(?:^|\\n)\\s*${esc(k)}\\s*[:#]?[ \\t]*\\n?\\s*([^\\n]+)`, "i"));
    if (m && m[1].trim()) return m[1].trim();
  }
  return undefined;
}

export const isChe168 = (u: string) => { try { return /(^|\.)che168\.com$/i.test(new URL(u).hostname); } catch { return false; } };

const PLACES: [RegExp, string, string][] = [[/shanghai/i, "SHA", "Šanghaj"], [/shenzhen/i, "SZX", "Šen-čen"], [/guangzhou/i, "CAN", "Kanton"], [/beijing/i, "PEK", "Peking"], [/tianjin/i, "PEK", "Tchien-ťin"]];
const COLOR: Record<string, string> = { black: "Čierna", white: "Biela", silver: "Strieborná", gray: "Sivá", grey: "Sivá", blue: "Modrá", red: "Červená", green: "Zelená", yellow: "Žltá", orange: "Oranžová", brown: "Hnedá", beige: "Béžová", gold: "Zlatá", purple: "Fialová", pink: "Ružová", champagne: "Šampanská", "dark gray": "Tmavosivá", "dark blue": "Tmavomodrá" };
const BODY: [RegExp, string][] = [[/suv/i, "SUV"], [/mpv/i, "MPV"], [/pickup/i, "Pickup"], [/wagon/i, "Kombi"], [/hatch/i, "Hatchback"], [/fastback/i, "Liftback"], [/coupe/i, "Kupé"], [/convertible|roadster|cabrio/i, "Kabriolet"], [/sedan/i, "Sedan"]];

/** Opravy z poznámky predajcu („Replaced right front headlight…“) → zóny na nákrese. */
const NOTE_ZONES: [RegExp, string[]][] = [
  [/front bumper/i, ["front_bumper"]], [/rear bumper/i, ["rear_bumper"]], [/hood|bonnet/i, ["hood"]], [/trunk|tailgate|boot lid/i, ["trunk"]], [/roof/i, ["roof"]],
  [/right front (head)?light|front right (head)?light/i, ["fr_light"]], [/left front (head)?light|front left (head)?light/i, ["fl_light"]],
  [/right (rear )?tail ?light|rear right light/i, ["rr_light"]], [/left (rear )?tail ?light|rear left light/i, ["rl_light"]],
  [/right front fender|front right fender/i, ["fr_fender"]], [/left front fender|front left fender/i, ["fl_fender"]],
  [/right rear quarter|right quarter|rear right fender/i, ["rr_quarter"]], [/left rear quarter|left quarter|rear left fender/i, ["rl_quarter"]],
  [/right front door|front right door/i, ["fr_door"]], [/left front door|front left door/i, ["fl_door"]], [/right rear door|rear right door/i, ["rr_door"]], [/left rear door|rear left door/i, ["rl_door"]],
  [/frame|chassis|pillar|sill|longitudinal|structural/i, ["frame"]], [/airbag/i, ["airbags"]], [/flood|water damage/i, ["flood"]], [/fire|burn/i, ["fire"]]
];

/** Údaje z inzerátu che168: buď objekt z kódu stránky (p.e.c), alebo text stránky. */
function data(p: ImportPayload): Obj {
  const c = p.e && typeof p.e === "object" ? (p.e as Obj).c : null;
  if (c && typeof c === "object") return c as Obj;
  // záloha z textu stránky
  const t = (p.x || "").replace(/\r/g, "");
  const title = (t.match(/\n1\/\d+\n(?:Auto Verified\n)?([^\n]+)/) || [])[1] || (p.t || "").replace(/^Used\s+/i, "").split(" - ")[0];
  return {
    carname: title, regdate: line(t, "1st Reg. Date"), yearname: line(t, "Model Year"), mileage: line(t, "Mileage (km)"), price: (t.match(/\nPrice\n\$([\d,]+)/) || [])[1] || "--",
    fuelname: line(t, "Fuel Type"), engine: line(t, "Engine (cc)"), gearbox: line(t, "Trans."), steering: line(t, "Steering"), cname: line(t, "Location"),
    drivingmode: line(t, "Drive Train"), structure: line(t, "Body Type"), setcount: line(t, "Seats"), structuredoor: line(t, "Doors"), color: line(t, "Exterior Color"),
    remark: line(t, "Condition Description")
  };
}

export function fromChe168(p: ImportPayload): Imported {
  const d = data(p);
  const fromCode = !!(p.e && (p.e as Obj).c);
  const out: Parsed = {};
  const missing: string[] = [];
  const specs: { label: string; value: string }[] = [];
  if (!fromCode) missing.push("údaje z kódu stránky (záložka ich nestiahla, použil som text stránky; ak ste záložku pridali pred 4. 11. 2026, pridajte ju nanovo)");

  /* názov: značka, séria bez opakovanej značky a bez „(Import)“, výbava bez roku */
  const brand = s(d.brandname);
  const series = s(d.seriesname).replace(new RegExp(`^${esc(brand)}\\s+`, "i"), "").replace(/\s*\(import\)/i, "").trim();
  const spec = s(d.specname).replace(/^(19|20)\d{2}\s+/, "").trim();
  if (brand) out.make = titleCase(brand);
  if (series) out.model = series;
  else if (s(d.carname)) out.model = s(d.carname).replace(new RegExp(`^${esc(brand)}\\s+`, "i"), "");
  // výbava často opakuje model („B4 BITURBO Coupe“ pri modeli B4)
  const trim = series ? spec.replace(new RegExp(`^${esc(series)}\\s+`, "i"), "") : spec;
  if (trim) out.trim = trim.slice(0, 40);
  // modelový rok je na začiatku názvu výbavy („2022 3.0 L6 …“), yearname býva dátum výroby modelovej rady
  const year = Number((s(d.specname).match(/^\s*((?:19|20)\d{2})\b/) || [])[1]) || Number(s(d.yearname).slice(0, 4)) || Number(s(d.regdate).slice(0, 4)) || 0;
  if (year) out.year = year;
  const vin = s(d.vincode);
  if (/^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)) out.vin = vin.toUpperCase();

  /* technika */
  const km = n(d.mileage);
  if (km) out.odometer_mi = Math.round(km / 1.609344);
  const fuel = s(d.fuelname);
  out.fuel = /plug.?in|phev/i.test(fuel) ? "Plug-in hybrid" : /range.?extend|erev/i.test(fuel) ? "Plug-in hybrid" : /pure electric|\bev\b|electric$/i.test(fuel) ? "Elektro" : /mild hybrid|48v/i.test(fuel) ? "Mild hybrid" : mapFuel(fuel);
  if (/range.?extend|erev/i.test(fuel)) specs.push({ label: "Pohon", value: "Elektromobil s predlžovačom dojazdu (EREV)" });
  const eng = s(d.engine).match(/^(\d\.\d)\s*([TL])?\s*(?:(\d+)\s*HP)?\s*([LVH]\d+)?/i);
  if (out.fuel === "Elektro") out.engine = `Elektro${/(\d+)\s*HP/i.test(s(d.engine)) ? ` ${Math.round(Number(s(d.engine).match(/(\d+)\s*HP/i)![1]) * 0.7355)} kW` : ""}`;
  else if (eng) {
    const ps = Number(eng[3]) || 0;
    out.engine = [eng[1], eng[2]?.toUpperCase() === "T" ? "turbo" : "", eng[4] ? eng[4].toUpperCase().replace(/^L/, "R").replace(/^H/, "B") : "", ps ? `${Math.round(ps * 0.7355)} kW (${ps} k)` : ""].filter(Boolean).join(" ");
  } else if (s(d.engine)) out.engine = s(d.engine);
  const gb = s(d.gearbox);
  const sp = (gb.match(/(\d+)-speed/i) || [])[1];
  out.transmission = gb ? `${/manual(?! shift)/i.test(gb) && !/automatic/i.test(gb) ? "Manuál" : /cvt|continuously/i.test(gb) ? "Automat CVT" : /dual.?clutch|dct/i.test(gb) ? "Automat DSG" : "Automat"}${sp ? ` ${sp}st.` : ""}` : undefined;
  if (/single.?speed|1-speed/i.test(gb)) out.transmission = "Automat";
  const dm = s(d.drivingmode).split(",").pop() || "";
  out.drive = mapDrive(dm);
  const col = s(d.color);
  if (col) out.color = COLOR[col.toLowerCase()] || titleCase(col);
  const body = s(d.structure);
  const bodySk = BODY.find(([r]) => r.test(body))?.[1] || (body ? titleCase(body) : "");
  out.type = /SUV|MPV/.test(bodySk) ? "suv" : bodySk === "Pickup" ? "truck" : "car";
  if (bodySk) specs.push({ label: "Karoséria", value: bodySk });
  if (n(d.setcount)) specs.push({ label: "Počet miest", value: String(n(d.setcount)) });
  if (n(d.structuredoor)) specs.push({ label: "Počet dverí", value: String(n(d.structuredoor)) });
  if (n(d.curbweight)) specs.push({ label: "Hmotnosť", value: `${num(n(d.curbweight))} kg` });
  if (s(d.dimension)) specs.push({ label: "Rozmery (D × Š × V)", value: `${s(d.dimension).replace(/\*/g, " × ")} mm` });
  const reg = s(d.regdate);
  if (reg) specs.push({ label: "Prvá registrácia", value: reg.replace(/^(\d{4})\.(\d{2})$/, (_, y, m) => `${Number(m)}/${y}`) });
  if (/right/i.test(s(d.steering))) { specs.push({ label: "Riadenie", value: "Vpravo" }); missing.push("pozor, auto má riadenie vpravo"); }
  if (n(d.msrp) || n(d.guideprice)) specs.push({ label: "Pôvodná cena nového v Číne", value: `${num(n(d.msrp) || n(d.guideprice))} CNY` });

  /* miesto */
  const city = s(d.cname);
  const pl = PLACES.find(([r]) => r.test(city));
  const state = pl ? pl[1] : "CN-X";
  out.location = `${pl ? pl[2] : city ? titleCase(city) : ""}${pl || city ? ", " : ""}Čína`;

  /* stav: z poznámky predajcu (býva po anglicky) */
  const remark = s(d.remark);
  const hasNote = remark && !/^welcome to (call|consult)/i.test(remark);
  const zones = new Map<string, DamageZone>();
  if (hasNote) {
    // poznámka sa často opakuje, každú vetu berieme raz
    const sentences = [...new Set(remark.split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean))];
    for (const sen of sentences) {
      if (!/replac|repair|respray|repaint|paint|dent|scratch|weld|accident|damage|flood|fire|airbag/i.test(sen)) continue;
      const sev: Severity = /frame|structural|airbag|flood|fire|weld/i.test(sen) ? "heavy" : /replac|repair|dent|accident|damage/i.test(sen) ? "medium" : "light";
      const what = /replac/i.test(sen) ? "vymenené" : /respray|repaint|paint/i.test(sen) ? "prelakované" : /repair|weld/i.test(sen) ? "opravené" : "podľa poznámky predajcu";
      for (const [re, ids] of NOTE_ZONES) if (re.test(sen)) for (const id of ids) {
        const cur = zones.get(id);
        if (!cur || (sev === "heavy" && cur.severity !== "heavy") || (sev === "medium" && cur.severity === "light")) zones.set(id, { zone: id, severity: sev, note: `poznámka predajcu: ${what}` });
      }
    }
  }
  const heavy = [...zones.values()].some((z) => z.severity === "heavy");
  const paintOnly = zones.size > 0 && [...zones.values()].every((z) => z.severity === "light");
  if (hasNote) out.primary_damage = heavy ? "Opravené po nehode (nosné diely)" : paintOnly ? "Prelakované diely" : zones.size ? "Opravené diely karosérie" : "Bez poškodenia";
  else missing.push("stav auta (predajca ho neuvádza, inšpekčnú správu si vyžiadajte od predajcu)");
  out.run_status = n(d.certification_status) === 1 ? "run_drive" : "unknown";
  out.title_type = "Čínska registrácia";
  if (n(d.certification_status) === 1) specs.push({ label: "Overené predajcom", value: "Áno, s inšpekčnou správou" });

  /* cena a poplatky predajcu v USD */
  const price = n(d.price);
  const fees = n(d.export_fee) + n(d.port_fee);
  let fixed = 0;
  if (price > 0) {
    fixed = roundUpK(price);
    missing.push(`kontrolu ceny: inzerát uvádza ${num(price)} USD (predajná cena v Číne), nastavil som pevnú cenu ${num(fixed)} USD (zaokrúhlené nahor na celú tisícku)`);
  } else missing.push("cenu auta (predajca ju neuvádza, vyžiadajte si ju cez WhatsApp na stránke)");
  missing.push(fees ? `kontrolu poplatkov predajcu: vývoz ${num(n(d.export_fee))} USD${n(d.port_fee) ? ` a prístav ${num(n(d.port_fee))} USD` : ""}, spolu ${num(fees)} USD. Poplatok za kontrolu, službu a dopravu do prístavu ukáže kalkulačka na stránke až po výbere prístavu (FOB)` : "poplatky predajcu za vývoz a prístav (na stránke vyberte prístav v kalkulačke FOB)");
  if (out.fuel === "Elektro") missing.push(`vyrovnávacie clo EÚ na elektromobil (závisí od výrobcu ${out.make || ""}, overte sadzbu)`);
  if (!out.vin) missing.push(`celý VIN (na stránke je skrytý${vin ? ` ako ${vin}` : ""}, vyžiadajte si ho od predajcu)`);

  const override: CalcOverride = {};
  const name = [out.year, out.make, out.model, out.trim].filter(Boolean).join(" ");
  const desc: string[] = [];
  if (name) desc.push(`${name} z Číny${pl ? ` (${pl[2]})` : ""}.`);
  const tech = [out.engine, out.fuel?.toLowerCase(), out.transmission?.toLowerCase(), out.drive ? `pohon ${out.drive}` : "", bodySk ? low(bodySk) : "", out.color ? `farba ${out.color.toLowerCase()}` : ""].filter(Boolean).join(", ");
  if (tech) desc.push(`Technika: ${tech}.`);
  if (km) desc.push(`Nájazd ${num(km)} km.`);
  if (hasNote) desc.push(heavy ? "Auto bolo podľa predajcu opravené po nehode." : paintOnly ? "Auto je nehavarované, predajca uvádza prelakované diely." : zones.size ? "Auto je nehavarované, predajca uvádza vymenené alebo opravené diely karosérie." : "Predajca neuvádza žiadne opravy.");
  desc.push("Stav auta overíme pred kúpou. Cena zahŕňa kúpu, vývoz, dopravu, clo, DPH, schválenie a prihlásenie na Slovensku.");
  missing.push("cenu na Slovensku");
  if (hasNote) missing.push("preklad poznámky predajcu do popisu");

  const images = photos(p, d);
  if (!images.length) missing.push("fotky");
  (Object.keys(out) as (keyof Parsed)[]).forEach((k) => out[k] === undefined && delete out[k]);
  return {
    parsed: out,
    patch: {
      country: "CN", currency: "USD", state, sale_type: "fixed", auction: "Dealer", auction_end_at: null,
      ...(fixed ? { price_usd: fixed } : {}), seller_fee_usd: fees,
      damage_zones: [...zones.values()], extra: { specs, ...(hasNote ? { history: `Poznámka predajcu (v origináli): ${[...new Set(remark.split(/(?<=[.!?])\s+/))].join(" ")}` } : {}) },
      ...(Object.keys(override).length ? { calc_override: override } : {}), description: desc.join(" ")
    },
    url: p.u, images, saleEnd: null, source: "che168.com", missing
  };
}

/** Fotky z galérie inzerátu (autoimg.cn), v najväčšej veľkosti. */
function photos(p: ImportPayload, d: Obj): string[] {
  const fromCode = (Array.isArray(d.catepiclist) ? d.catepiclist : []).flatMap((c) => (c && typeof c === "object" && Array.isArray((c as Obj).list) ? ((c as Obj).list as unknown[]).map(s) : []));
  const list = fromCode.length ? fromCode : [...(p.g || []), ...(p.c || [])].map((u) => u.split("#")[0]).filter((u) => /autoimg\.cn\/escimg\//i.test(u));
  // veľkosť je v názve súboru („1400x0_c42_…“, „0x0_…“ = originál); berieme 1400 px, každú fotku raz
  const key = (u: string) => u.split("?")[0].replace(/\/\d+x\d+_c\d+_/, "/");
  const seen = new Set<string>();
  return list.map((u) => u.split("?")[0]).filter((u) => /^https:\/\//.test(u)).map((u) => u.replace(/\/(\d+)x(\d+)_c(\d+)_/, "/1400x0_c$3_")).filter((u) => { const k = key(u); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 40);
}
