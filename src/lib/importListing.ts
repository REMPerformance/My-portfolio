/** Import auta z inzerátu: záložka v prehliadači pošle údaje zo stránky, ktorú má admin práve otvorenú. */
import { mapDamage, mapDrive, mapFuel, mapTitle, mapType, parseListing, titleCase, type Parsed } from "./listingParse";
import type { CalcOverride, Car, CarExtra, DamageZone, RunStatus, Severity } from "./types";

export interface ImportPayload { u: string; t?: string; ld?: Record<string, unknown>[]; x?: string; i?: string[]; c?: string[] }
export interface Imported {
  parsed: Parsed;
  /** ďalšie polia auta, ktoré sa dajú odvodiť (krajina, mena, zóny poškodenia, popis…) */
  patch: Partial<Car>;
  url: string;
  images: string[];
  saleEnd: string | null;
  source: string;
  /** čo sa nepodarilo zistiť a treba doplniť ručne */
  missing: string[];
}

/**
 * Kód záložky. Beží na stránke inzerátu v prehliadači admina a otvorí administráciu s načítanými údajmi.
 * Zámerne je hlúpy: pošle surové údaje (štruktúrované dáta, text, všetky adresy fotiek) a všetko rozpoznávanie
 * sa deje až v administrácii, aby sa dalo zlepšovať bez opätovného pridávania záložky.
 */
export function bookmarklet(origin: string) {
  const code = `(function(){var d=document,q=function(s){return [].slice.call(d.querySelectorAll(s))},ld=[];q('script[type="application/ld+json"]').forEach(function(s){try{var j=JSON.parse(s.textContent);(Array.isArray(j)?j:j['@graph']||[j]).forEach(function(x){if(x&&/Product|Vehicle|Car/.test(String(x['@type'])))ld.push(x)})}catch(e){}});var im=[];ld.forEach(function(x){[].concat(x.image||[]).forEach(function(i){var u=typeof i==='string'?i:i&&(i.url||i.contentUrl);if(u)im.push(u)});delete x.image;delete x.review;delete x.aggregateRating});var c=[];q('img').forEach(function(i){[i.currentSrc,i.src,i.getAttribute('data-src'),i.getAttribute('data-lazy'),i.getAttribute('data-original')].forEach(function(u){if(u&&/^https?:/.test(u))c.push(u+(i.naturalWidth?'#'+i.naturalWidth:''))})});(d.documentElement.innerHTML.match(/https?:[^"'\\\\ )<>]+?\\.(?:jpe?g|webp|png)(?=["'\\\\ )?&<])/gi)||[]).forEach(function(u){c.push(u)});c=c.filter(function(u,i){return c.indexOf(u)===i&&!/logo|icon|sprite|flag|banner|avatar|favicon/i.test(u)}).slice(0,150);var m=d.querySelector('main')||d.body,h=d.querySelector('h1'),p={u:location.href,t:d.title,h:h?h.innerText:'',ld:ld.slice(0,2),x:(m.innerText||'').replace(/\\n{2,}/g,'\\n').slice(0,4500),i:im.slice(0,60),c:c},b=btoa(unescape(encodeURIComponent(JSON.stringify(p)))).replace(/\\+/g,'-').replace(/\\//g,'_');var w=window.open('${origin}/admin/auta/nove#import='+b,'_blank');if(!w)location.href='${origin}/admin/auta/nove#import='+b})()`;
  return "javascript:" + encodeURIComponent(code);
}

export function decodeImport(hash: string): ImportPayload | null {
  const m = hash.match(/import=([A-Za-z0-9_\-=]+)/);
  if (!m) return null;
  try {
    const bin = atob(m[1].replace(/-/g, "+").replace(/_/g, "/"));
    const json = new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
    const p = JSON.parse(json) as ImportPayload;
    return p && typeof p.u === "string" ? p : null;
  } catch { return null; }
}

const s = (v: unknown) => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");
const nameOf = (v: unknown) => (v && typeof v === "object" ? s((v as Record<string, unknown>).name) : s(v));
const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function line(text: string, ...keys: string[]) {
  for (const k of keys) {
    const m = text.match(new RegExp(`(?:^|\\n)\\s*${esc(k)}\\s*[:#]?[ \\t]*\\n?\\s*([^\\n]+)`, "i"));
    if (m && m[1].trim()) return m[1].trim();
  }
  return undefined;
}

/** "Tue, Dec 8, 2026 - 9:00 PM GMT+1" → ISO čas. */
function saleDate(v?: string) {
  if (!v) return null;
  const m = v.match(/([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})\D+(\d{1,2}):(\d{2})\s*(AM|PM)?\s*(?:(?:GMT|UTC)\s*([+-]\d{1,2})(?::?(\d{2}))?)?/i);
  if (!m) { const t = Date.parse(v); return Number.isNaN(t) ? null : new Date(t).toISOString(); }
  const mon = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(m[1].slice(0, 3).toLowerCase());
  if (mon < 0) return null;
  let h = Number(m[4]);
  if (m[6]) { const pm = /pm/i.test(m[6]); h = (h % 12) + (pm ? 12 : 0); }
  const off = m[7] ? Number(m[7]) * 60 + (Number(m[7]) < 0 ? -1 : 1) * Number(m[8] || 0) : null;
  const utc = Date.UTC(Number(m[3]), mon, Number(m[2]), h, Number(m[5]));
  // bez uvedeného pásma berieme čas tak, ako ho ukázal prehliadač admina
  const t = off === null ? new Date(Number(m[3]), mon, Number(m[2]), h, Number(m[5])).getTime() : utc - off * 60000;
  return t > Date.now() - 864e5 ? new Date(t).toISOString() : null;
}

/* ───────── fotky ───────── */

/** Z kandidátov vyberie fotky auta v najvyššej kvalite, každú len raz a v pôvodnom poradí. */
export function pickImages(p: ImportPayload): string[] {
  const fromLd = (p.i || []).filter((u) => /^https:\/\//.test(u));
  const cand = (p.c || []).map((u) => { const [url, w] = u.split("#"); return { url, w: Number(w) || 0 }; }).filter((x) => /^https:\/\//.test(x.url));

  // Copart / IAAI: tá istá fotka existuje vo viacerých veľkostiach (_thb, _ful, _hrs) – berieme najväčšiu
  const sized = [...fromLd.map((url) => ({ url, w: 0 })), ...cand].filter((x) => /_(hrs|ful|thb|tmb)\.(jpe?g|webp)$/i.test(x.url));
  if (sized.length) {
    const rank = (u: string) => (/_hrs\./i.test(u) ? 3 : /_ful\./i.test(u) ? 2 : 1);
    const byId = new Map<string, string>();
    for (const { url } of sized) {
      const id = url.replace(/_(hrs|ful|thb|tmb)\.(jpe?g|webp)$/i, "");
      const cur = byId.get(id);
      if (!cur || rank(url) > rank(cur)) byId.set(id, url);
    }
    // miniatúry cudzích áut („podobné vozidlá“) nemajú veľkú verziu – tie vynecháme, ak máme aj veľké fotky
    const all = [...byId.values()];
    const big = all.filter((u) => rank(u) >= 2);
    return (big.length >= 3 ? big : all).slice(0, 40);
  }
  if (fromLd.length >= 3) return [...new Set(fromLd)].slice(0, 40);
  // iné weby: veľké obrázky zo stránky (šírka aspoň 500 px, ak ju poznáme)
  const big = cand.filter((x) => x.w >= 500).map((x) => x.url);
  const rest = cand.filter((x) => !x.w && /\/(vehicle|car|lot|inventory|listing|stock|photos?|images?|media|upload)/i.test(x.url)).map((x) => x.url);
  return [...new Set([...fromLd, ...big, ...(big.length >= 3 ? [] : rest)])].slice(0, 40);
}

/* ───────── krajina a mena ───────── */

const EU_COUNTRIES: [RegExp, string, string][] = [
  [/copart\s?de|copart\.de|germany|deutschland|nemeck/i, "DE", "Nemecko"], [/austria|österreich|rakúsk/i, "AT", "Rakúsko"],
  [/czech|česk/i, "CZ", "Česko"], [/poland|polska|poľsk/i, "PL", "Poľsko"], [/hungary|maďarsk/i, "HU", "Maďarsko"],
  [/italy|italia|talians/i, "IT", "Taliansko"], [/netherlands|nederland|holands/i, "NL", "Holandsko"], [/belgium|belgi/i, "BE", "Belgicko"],
  [/france|francúz/i, "FR", "Francúzsko"], [/spain|españa|španiel/i, "ES", "Španielsko"], [/copart\s?fi|finland|suomi|fínsk/i, "FI", "Fínsko"],
  [/sweden|sverige|švéds/i, "SE", "Švédsko"], [/denmark|danmark|dáns/i, "DK", "Dánsko"], [/ireland|írsk/i, "IE", "Írsko"],
  [/lithuania|litv/i, "LT", "Litva"], [/latvia|lotyš/i, "LV", "Lotyšsko"], [/estonia|estón/i, "EE", "Estónsko"]
];

function origin(p: ImportPayload, own: string) {
  const hay = `${p.u} ${p.t || ""}`;
  const bid = line(own, "Current bid", "Buy it now", "Buy Now", "Price") || "";
  const eur = /€|\bEUR\b/.test(bid) || /\bEUR increment\b/i.test(own);
  const euDocs = /\b(ZB1|ZB2|ZB I|ZB II|T[ÜU]V|Certificate of Conformity|COC)\b/i.test(own);
  const hit = EU_COUNTRIES.find(([r]) => r.test(hay));
  if (hit || ((eur || euDocs) && !/\$\s?\d/.test(bid))) return { country: "EU", state: hit ? hit[1] : "DE", countryName: hit ? hit[2] : "Nemecko", currency: "EUR" };
  if (/\bAED\b/.test(bid) || /dubai|emirates|\.ae\//i.test(hay)) return { country: "AE", state: "DXB", countryName: "SAE", currency: "AED" };
  if (/C\$|\bCAD\b/.test(bid)) return { country: "CA", state: null, countryName: "Kanada", currency: "CAD" };
  return null;
}

/* ───────── poškodenie ───────── */

const ZONE_RULES: [RegExp, string[]][] = [
  [/front end|front & rear|frontal|^front\b|\bfront\b(?! (left|right))/i, ["front_bumper", "hood", "grille"]],
  [/rear end|^rear\b|\brear\b(?! (left|right))|\bheck\b/i, ["rear_bumper", "trunk"]],
  [/left front|front left|vorne links/i, ["fl_fender", "fl_light"]], [/right front|front right|vorne rechts/i, ["fr_fender", "fr_light"]],
  [/left rear|rear left|hinten links/i, ["rl_quarter", "rl_light"]], [/right rear|rear right|hinten rechts/i, ["rr_quarter", "rr_light"]],
  [/left side|driver side/i, ["fl_door", "rl_door"]], [/right side|passenger side/i, ["fr_door", "rr_door"]],
  [/roof|top\b|rollover|dach/i, ["roof"]], [/undercarriage|unterboden/i, ["undercarriage"]],
  [/water|flood|wasser/i, ["flood"]], [/burn|fire|brand/i, ["fire"]], [/hail|hagel/i, ["hail"]],
  [/electrical|elektr/i, ["electrical"]], [/mechanical/i, ["mechanical"]], [/interior|innenraum/i, ["interior"]],
  [/suspension|fahrwerk|achse/i, ["suspension"]], [/frame|rahmen/i, ["frame"]],
  [/engine|\bmotor\b/i, ["engine"]], [/transmission|getriebe|kupplung|geberzylinder|nehmerzylinder/i, ["transmission"]],
  [/windshield|frontscheibe|windschutzscheibe/i, ["windshield"]]
];
function zonesFrom(text: string | undefined, severity: Severity, note: string, out: Map<string, DamageZone>) {
  if (!text) return;
  for (const [re, ids] of ZONE_RULES) if (re.test(text)) for (const id of ids) if (!out.has(id)) out.set(id, { zone: id, severity, note });
}

const BODY: [RegExp, string][] = [[/wagon|estate|kombi|touring|avant|variant/i, "Kombi"], [/hatchback/i, "Hatchback"], [/sedan|saloon|limousine/i, "Sedan"], [/coupe|coupé/i, "Kupé"], [/convertible|cabrio|roadster/i, "Kabriolet"], [/sport utility|suv|crossover/i, "SUV"], [/minivan|mpv/i, "MPV"], [/pickup/i, "Pickup"], [/van|transporter|kasten/i, "Dodávka"]];
const COLORS: Record<string, string> = { black: "Čierna", white: "Biela", silver: "Strieborná", gray: "Sivá", grey: "Sivá", blue: "Modrá", red: "Červená", green: "Zelená", yellow: "Žltá", orange: "Oranžová", brown: "Hnedá", beige: "Béžová", gold: "Zlatá", purple: "Fialová", burgundy: "Bordová", maroon: "Bordová", tan: "Béžová", charcoal: "Antracitová", cream: "Krémová", turquoise: "Tyrkysová", pink: "Ružová" };
const num = (n: number) => n.toLocaleString("sk-SK");

/* ───────── hlavná funkcia ───────── */

export function fromImport(p: ImportPayload): Imported {
  const text = (p.x || "").replace(/\r/g, "");
  // text pod "podobné autá" patrí iným inzerátom
  const own = text.split(/\n(?:Vehicles You Might Like|Similar Vehicles|Similar lots|Recently viewed|Recommended|You may also like)\b/i)[0];
  const out: Parsed = parseListing(own);
  const ld = (p.ld || []).find((x) => /Product|Vehicle|Car/.test(String(x["@type"]))) || null;
  const org = origin(p, own);
  const textOdo = line(own, "Odometer", "Mileage");

  if (ld) {
    const brand = nameOf(ld.brand) || nameOf(ld.manufacturer);
    const model = nameOf(ld.model);
    const year = Number(s(ld.productionDate) || s(ld.vehicleModelDate) || s(ld.modelDate)) || Number((s(ld.name).match(/\b(19|20)\d{2}\b/) || [])[0]) || undefined;
    if (year) out.year = year;
    if (brand) out.make = titleCase(brand);
    if (model) out.model = titleCase(model);
    if (brand && model) {
      // výbava je v nadpise stránky za modelom („2009 Renault Megane III Grandtour Dynamique“)
      const head = (own.match(new RegExp(`(?:^|\\n)\\s*(?:19|20)\\d{2}\\s+${esc(brand)}\\s+${esc(model)}([^\\n]*)`, "i")) || [])[1] ?? s(ld.name).replace(/\b(19|20)\d{2}\b/, "").replace(new RegExp(esc(brand), "i"), "").replace(new RegExp(esc(model), "i"), "");
      const rest = head.replace(/\s+(for sale|with vin|in [A-Z][a-z]+,\s*[A-Z]{2})\b.*$/i, "").replace(/\s+/g, " ").trim();
      out.trim = rest && rest.length <= 40 ? titleCase(rest) : undefined;
    }
    const vin = s(ld.vehicleIdentificationNumber);
    if (/^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)) out.vin = vin.toUpperCase();
    // nájazd: text stránky uvádza správnu jednotku, štruktúrované dáta ju často majú zle
    if (!textOdo) {
      const odo = ld.mileageFromOdometer as unknown;
      const odoStr = odo && typeof odo === "object" ? `${s((odo as Record<string, unknown>).value)} ${s((odo as Record<string, unknown>).unitCode)}` : s(odo);
      const n = Number(odoStr.replace(/[^\d]/g, ""));
      if (n) out.odometer_mi = /km|kmt/i.test(odoStr) || org?.country === "EU" ? Math.round(n / 1.609344) : n;
    }
    const eng = ld.vehicleEngine as Record<string, unknown> | undefined;
    if (eng && s(eng.engineType)) out.engine = s(eng.engineType);
    const fuel = mapFuel(s(eng?.fuelType) || s(ld.fuelType));
    if (fuel) out.fuel = fuel;
    const drive = mapDrive(s(ld.driveWheelConfiguration));
    if (drive) out.drive = drive;
    if (s(ld.color)) out.color = s(ld.color);
    const type = mapType(s(ld.bodyType));
    if (type) out.type = type;
    const tr = s(ld.vehicleTransmission);
    if (tr) out.transmission = tr.replace(/automatic/i, "Automat").replace(/manual/i, "Manuál");
    if (!out.lot && /^\d{5,}$/.test(s(ld.sku))) out.lot = s(ld.sku);
    const offer = (Array.isArray(ld.offers) ? ld.offers[0] : ld.offers) as Record<string, unknown> | undefined;
    const price = Number(s(offer?.price));
    if (price > 0 && !out.buy_now) out.buy_now = price;
  }

  // VIN skrytý hviezdičkami (neprihlásený návštevník) nie je použiteľný
  if (out.vin && !/^[A-HJ-NPR-Z0-9]{17}$/.test(out.vin)) delete out.vin;
  if (out.color) out.color = COLORS[out.color.toLowerCase()] || titleCase(out.color);
  const cyl = Number(line(own, "Cylinders"));
  if (!out.engine && cyl) out.engine = `${cyl}-valec`;

  const title = line(own, "Auction title code", "Title code", "Sale document");
  const mapped = mapTitle(title);
  const patch: Partial<Car> = {};
  const missing: string[] = [];
  const specs: { label: string; value: string }[] = [];

  /* krajina, mena, lokalita */
  const locRaw = line(own, "Auction location", "Selling branch", "Sale name");
  if (org) {
    patch.country = org.country; patch.currency = org.currency; patch.state = org.state;
    delete out.state;
    out.location = locRaw && !/auktion|auction|sale/i.test(locRaw) ? `${titleCase(locRaw.replace(/^[A-Z]{2}\s*-\s*/, ""))}, ${org.countryName}` : org.countryName;
    if (org.country === "EU") out.title_type = /ZB1|ZB2|Conformity|COC/i.test(title || "") ? "EÚ doklady (COC, ZB1, ZB2)" : mapped || "EÚ doklady";
    else if (mapped) out.title_type = mapped;
  } else {
    if (locRaw) {
      const m1 = locRaw.match(/^([A-Z]{2})\s*-\s*(.+)$/);
      if (m1) { out.state = m1[1]; out.location = `${titleCase(m1[2])}, ${m1[1]}`; }
    }
    if (mapped) out.title_type = mapped;
  }
  if (title && org?.country === "EU") specs.push({ label: "Doklady", value: title });

  const key = line(own, "Has key", "Keys");
  if (key) out.keys = /^\s*(yes|present|áno)/i.test(key);
  if (!out.auction) out.auction = /iaa/i.test(p.u + own) ? "IAAI" : /copart/i.test(p.u + own) ? "Copart" : undefined;

  /* stav: len to, čo inzerát naozaj uvádza */
  const notes = line(own, "Notes");
  const noteTxt = notes && !/^there are no notes/i.test(notes) ? notes : "";
  const hl = `${line(own, "Auction highlights", "Highlights") || ""} ${noteTxt}`;
  let run: RunStatus = "unknown";
  if (/run and drive|run & drive|fahrbereit|fährt/i.test(hl)) run = "run_drive";
  else if (/does not start|won.?t start|non.?runner|springt nicht an|startet nicht|nicht fahrbereit/i.test(hl)) run = "no_start";
  else if (/engine start|starts|motor läuft|springt an/i.test(hl)) run = "starts";
  out.run_status = run;

  /* poškodenie → zóny na nákrese */
  const prim = line(own, "Primary damage"), sec = line(own, "Secondary damage");
  if (prim) out.primary_damage = mapDamage(prim);
  if (sec) out.secondary_damage = mapDamage(sec);
  if (!prim && ld && s(ld.knownVehicleDamages)) out.primary_damage = mapDamage(s(ld.knownVehicleDamages));
  // nie každé auto je havarované: „None“, „Normal Wear“ alebo chýbajúci údaj znamená auto bez škody
  const dmgRaw = `${prim || s(ld?.knownVehicleDamages)} ${sec || ""}`.trim();
  const undamaged = !dmgRaw || /^(none|no damage|normal wear( (and|&) tear)?|n\/a|unknown|\s)+$/i.test(dmgRaw);
  const wearOnly = undamaged || /^(minor dents?\/?scratch(es)?|normal wear|none|\s|\/)+$/i.test(dmgRaw);
  if (undamaged) { out.primary_damage = dmgRaw ? "Bez poškodenia" : undefined; delete out.secondary_damage; }
  const zones = new Map<string, DamageZone>();
  if (!undamaged) {
    zonesFrom(prim || s(ld?.knownVehicleDamages), "medium", "podľa inzerátu", zones);
    zonesFrom(sec, "light", "podľa inzerátu", zones);
  }
  // doklady: ak inzerát typ neuvádza a auto nie je poškodené, nie je dôvod písať Salvage
  if (!out.title_type) { if (wearOnly) out.title_type = "Clean"; else missing.push("typ dokladov (inzerát ho neuvádza)"); }
  // inzerát predajcu s pevnou cenou namiesto aukcie
  const fixedPrice = line(own, "Buy it now", "Buy Now", "Price", "Cena", "Preis");
  const isAuction = !!(line(own, "Current bid", "Sale date", "Auction date", "Lot number") || out.lot);
  if (!isAuction) {
    const n = fixedPrice ? Number(fixedPrice.replace(/[^\d.,]/g, "").replace(/[.,](?=\d{3}\b)/g, "").replace(",", ".")) : 0;
    patch.sale_type = "fixed"; patch.auction = "Dealer"; patch.auction_end_at = null;
    if (n > 0) patch.price_usd = Math.round(n); else missing.push("cenu auta");
    delete out.auction;
  }
  zonesFrom(noteTxt, "medium", "z poznámky predajcu", zones);
  const airbags = line(own, "Airbags deployed", "Airbags");
  if (airbags) {
    const yes = /^\s*(yes|deployed)/i.test(airbags);
    specs.push({ label: "Airbagy", value: yes ? "Vystrelené" : "Nevystrelené" });
    if (yes) zones.set("airbags", { zone: "airbags", severity: "heavy", note: "podľa inzerátu" });
  }
  if (zones.size) patch.damage_zones = [...zones.values()];

  /* doplnkové parametre */
  const body = line(own, "Body style") || s(ld?.bodyType);
  const bodySk = body ? BODY.find(([r]) => r.test(body))?.[1] || titleCase(body) : "";
  if (bodySk) specs.push({ label: "Karoséria", value: bodySk });
  if (cyl) specs.push({ label: "Počet valcov", value: String(cyl) });
  const vatEl = line(own, "VAT eligible");
  const override: CalcOverride = {};
  if (vatEl) {
    const yes = /^\s*yes/i.test(vatEl);
    specs.push({ label: "Odpočet DPH", value: yes ? "Áno" : "Nie" });
    if (!yes) override.carNoVat = true;
  }
  const erv = line(own, "Estimated retail value");
  if (erv) specs.push({ label: "Odhad trhovej hodnoty (aukcia)", value: erv });
  const status = line(own, "Sale Status");
  const extra: CarExtra = {};
  if (specs.length) extra.specs = specs;
  if (noteTxt) extra.history = `Poznámka predajcu (v origináli): ${noteTxt}`;
  if (Object.keys(extra).length) patch.extra = extra;
  if (Object.keys(override).length) patch.calc_override = override;

  /* ceny */
  const bid = line(own, "Current bid");
  const bidN = bid ? Number(bid.replace(/[^\d.]/g, "")) : 0;
  if (bidN > 0) out.current_bid = bidN; else delete out.current_bid;
  // štruktúrované dáta uvádzajú ako cenu aktuálnu ponuku, to nie je cena Kúpiť hneď
  if (out.buy_now && (out.buy_now === bidN || !line(own, "Buy it now", "Buy Now"))) delete out.buy_now;

  /* interná poznámka a návrh popisu */
  patch.note = [`Import z ${(() => { try { return new URL(p.u).hostname.replace(/^www\./, ""); } catch { return "inzerátu"; } })()} ${new Date().toLocaleDateString("sk-SK")}`, status ? `Stav predaja: ${status}` : "", bid ? `Aktuálna ponuka: ${bid}` : "", noteTxt ? `Poznámka predajcu: ${noteTxt}` : ""].filter(Boolean).join("\n");

  const rawKm = textOdo && /\bkm\b/i.test(textOdo) ? Number((textOdo.match(/[\d.,\s]+/) || [""])[0].replace(/[^\d]/g, "")) : 0;
  const km = rawKm || (out.odometer_mi ? Math.round(out.odometer_mi * 1.609344) : 0);
  const name = [out.year, out.make, out.model, out.trim].filter(Boolean).join(" ");
  const from = org?.country === "EU" ? `z ${org.countryName === "Nemecko" ? "Nemecka" : "EÚ"}` : org?.country === "AE" ? "zo SAE" : org?.country === "CA" ? "z Kanady" : "z USA";
  const parts: string[] = [];
  if (name) parts.push(`${name} ${from}${out.location && out.location !== org?.countryName ? ` (${out.location.replace(`, ${org?.countryName}`, "")})` : ""}.`);
  const tech = [out.engine, out.fuel?.toLowerCase(), out.transmission?.toLowerCase(), out.drive ? `pohon ${out.drive}` : "", bodySk ? bodySk.toLowerCase() : "", out.color ? `farba ${out.color.toLowerCase()}` : ""].filter(Boolean).join(", ");
  if (tech) parts.push(`Technika: ${tech}.`);
  if (km) parts.push(`Nájazd ${num(km)} km${org?.country === "EU" ? "" : ` (${num(out.odometer_mi!)} míľ)`}.`);
  const dmg = [out.primary_damage, out.secondary_damage].filter(Boolean).join(", ");
  if (undamaged) parts.push(dmgRaw ? "Auto je podľa inzerátu nehavarované." : "Inzerát neuvádza žiadne poškodenie.");
  else if (wearOnly) parts.push(`Auto je nehavarované, inzerát uvádza len ${dmg.toLowerCase()}.`);
  else if (dmg) parts.push(`Poškodenie podľa inzerátu: ${dmg.toLowerCase()}.`);
  parts.push(run === "run_drive" ? "Auto štartuje a jazdí." : run === "starts" ? "Motor štartuje." : run === "no_start" ? "Auto podľa inzerátu neštartuje." : isAuction ? "Pojazdnosť overíme pred kúpou." : "Stav auta overíme pred kúpou.");
  if (out.keys !== undefined) parts.push(out.keys ? "Kľúč je k dispozícii." : "Auto je bez kľúča.");
  if (airbags) parts.push(/^\s*(yes|deployed)/i.test(airbags) ? "Airbagy sú vystrelené." : "Airbagy nie sú vystrelené.");
  if (out.title_type) parts.push(`Doklady: ${out.title_type}.`);
  const tuv = noteTxt.match(/T[ÜU]V\s+(?:gültig\s+)?bis\s+(\d{1,2}[/.]\d{4})/i);
  if (tuv) parts.push(`Nemecká technická kontrola (TÜV) platí do ${tuv[1]}.`);
  parts.push(org?.country === "EU" ? "Auto je v Európskej únii, takže sa pri dovoze neplatí clo." : "Cena zahŕňa kúpu, dopravu, clo, DPH, homologizáciu a prihlásenie na Slovensku.");
  patch.description = parts.join(" ");

  /* čo treba doplniť ručne */
  if (!out.vin) missing.push("VIN (na stránke je skrytý, po prihlásení na aukcii sa zobrazí celý)");
  if (!out.engine || /valec$/.test(out.engine)) missing.push("presný motor");
  if (!out.odometer_mi) missing.push("nájazd");
  missing.push("váš odhad vydraženia a cenu na Slovensku");
  if (noteTxt) missing.push("preklad poznámky predajcu do popisu");

  const images = pickImages(p);
  if (!images.length) missing.push("fotky");
  (Object.keys(out) as (keyof Parsed)[]).forEach((k) => out[k] === undefined && delete out[k]);
  const ev = (ld?.subjectOf && typeof ld.subjectOf === "object" ? ld.subjectOf : null) as Record<string, unknown> | null;
  const evStart = ev && s(ev.startDate) ? Date.parse(s(ev.startDate)) : NaN;
  const saleEnd = saleDate(out.sale_date || line(own, "Sale date", "Auction date")) || (!Number.isNaN(evStart) && evStart > Date.now() ? new Date(evStart).toISOString() : null);
  const host = (() => { try { return new URL(p.u).hostname.replace(/^www\./, ""); } catch { return ""; } })();
  return { parsed: out, patch, url: p.u, images, saleEnd, source: host || "inzerátu", missing };
}
