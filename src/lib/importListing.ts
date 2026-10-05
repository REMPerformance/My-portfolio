/** Import auta z inzerátu: záložka v prehliadači pošle údaje zo stránky, ktorú má admin práve otvorenú. */
import { mapDamage, mapDrive, mapFuel, mapTitle, mapType, parseListing, titleCase, type Parsed } from "./listingParse";

export interface ImportPayload { u: string; t?: string; ld?: Record<string, unknown>[]; x?: string; i?: string[] }
export interface Imported { parsed: Parsed; url: string; images: string[]; saleEnd: string | null; source: string }

/** Kód záložky. Beží na stránke inzerátu v prehliadači admina a otvorí administráciu s načítanými údajmi. */
export function bookmarklet(origin: string) {
  const code = `(function(){var d=document,q=function(s){return [].slice.call(d.querySelectorAll(s))},ld=[];q('script[type="application/ld+json"]').forEach(function(s){try{var j=JSON.parse(s.textContent);(Array.isArray(j)?j:j['@graph']||[j]).forEach(function(x){if(x&&/Product|Vehicle|Car/.test(String(x['@type'])))ld.push(x)})}catch(e){}});var im=[];ld.forEach(function(x){[].concat(x.image||[]).forEach(function(i){var u=typeof i==='string'?i:i&&(i.url||i.contentUrl);if(u)im.push(u)});delete x.image;delete x.review;delete x.aggregateRating});if(im.length<3)q('img').forEach(function(i){var u=i.currentSrc||i.src;if(u&&/^https?:/.test(u)&&i.naturalWidth>=500&&i.naturalHeight>=300)im.push(u)});im=im.filter(function(u,i){return im.indexOf(u)===i}).slice(0,40);var m=d.querySelector('main')||d.body,p={u:location.href,t:d.title,ld:ld.slice(0,2),x:(m.innerText||'').replace(/\\n{2,}/g,'\\n').slice(0,3500),i:im},b=btoa(unescape(encodeURIComponent(JSON.stringify(p)))).replace(/\\+/g,'-').replace(/\\//g,'_');var w=window.open('${origin}/admin/auta/nove#import='+b,'_blank');if(!w)location.href='${origin}/admin/auta/nove#import='+b})()`;
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

export function fromImport(p: ImportPayload): Imported {
  const text = (p.x || "").replace(/\r/g, "");
  // text pod "podobné autá" patrí iným inzerátom
  const own = text.split(/\n(?:Vehicles You Might Like|Similar Vehicles|Similar lots|Recommended|You may also like)\b/i)[0];
  const out: Parsed = parseListing(own);
  const ld = (p.ld || []).find((x) => /Product|Vehicle|Car/.test(String(x["@type"]))) || null;

  if (ld) {
    const brand = nameOf(ld.brand) || nameOf(ld.manufacturer);
    const model = nameOf(ld.model);
    const year = Number(s(ld.productionDate) || s(ld.vehicleModelDate) || s(ld.modelDate)) || Number((s(ld.name).match(/\b(19|20)\d{2}\b/) || [])[0]) || undefined;
    if (year) out.year = year;
    if (brand) out.make = titleCase(brand);
    if (model) out.model = titleCase(model);
    if (brand && model) {
      const rest = s(ld.name).replace(/\b(19|20)\d{2}\b/, "").replace(new RegExp(esc(brand), "i"), "").replace(new RegExp(esc(model), "i"), "").replace(/\s+/g, " ").trim();
      out.trim = rest && rest.length <= 40 ? titleCase(rest) : undefined;
    }
    const vin = s(ld.vehicleIdentificationNumber);
    if (/^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)) out.vin = vin.toUpperCase();
    const odo = ld.mileageFromOdometer as unknown;
    const odoStr = odo && typeof odo === "object" ? `${s((odo as Record<string, unknown>).value)} ${s((odo as Record<string, unknown>).unitCode)}` : s(odo);
    const n = Number(odoStr.replace(/[^\d]/g, ""));
    if (n) out.odometer_mi = /km|kmt/i.test(odoStr) ? Math.round(n / 1.609344) : n;
    const eng = ld.vehicleEngine as Record<string, unknown> | undefined;
    if (eng && s(eng.engineType)) out.engine = s(eng.engineType);
    const fuel = mapFuel(s(eng?.fuelType) || s(ld.fuelType));
    if (fuel) out.fuel = fuel;
    const drive = mapDrive(s(ld.driveWheelConfiguration));
    if (drive) out.drive = drive;
    if (s(ld.color)) out.color = titleCase(s(ld.color));
    const type = mapType(s(ld.bodyType));
    if (type) out.type = type;
    const tr = s(ld.vehicleTransmission);
    if (tr) out.transmission = tr.replace(/automatic/i, "Automat").replace(/manual/i, "Manuál");
    const dmg = mapDamage(s(ld.knownVehicleDamages));
    if (dmg && !out.primary_damage) out.primary_damage = dmg;
    if (!out.lot && /^\d{5,}$/.test(s(ld.sku))) out.lot = s(ld.sku);
    const offer = (Array.isArray(ld.offers) ? ld.offers[0] : ld.offers) as Record<string, unknown> | undefined;
    const price = Number(s(offer?.price));
    if (price > 0 && !out.buy_now) out.buy_now = price;
  }

  const loc = line(own, "Auction location", "Sale name", "Selling branch");
  if (loc) {
    const m1 = loc.match(/^([A-Z]{2})\s*-\s*(.+)$/);
    if (m1) { out.state = m1[1]; out.location = `${titleCase(m1[2])}, ${m1[1]}`; }
  }
  const title = mapTitle(line(own, "Auction title code", "Title code", "Sale document"));
  if (title) out.title_type = title;
  const key = line(own, "Has key", "Keys");
  if (key) out.keys = /^\s*(yes|present|áno)/i.test(key);
  const host = (() => { try { return new URL(p.u).hostname.replace(/^www\./, ""); } catch { return ""; } })();
  if (!out.auction) out.auction = /iaai/i.test(p.u + own) ? "IAAI" : /copart/i.test(p.u + own) ? "Copart" : undefined;

  const images = (p.i || []).filter((u) => /^https:\/\//.test(u)).slice(0, 40);
  (Object.keys(out) as (keyof Parsed)[]).forEach((k) => out[k] === undefined && delete out[k]);
  const ev = (ld?.subjectOf && typeof ld.subjectOf === "object" ? ld.subjectOf : null) as Record<string, unknown> | null;
  const evStart = ev && s(ev.startDate) ? Date.parse(s(ev.startDate)) : NaN;
  const saleEnd = !Number.isNaN(evStart) && evStart > Date.now() ? new Date(evStart).toISOString() : saleDate(out.sale_date || line(own, "Sale date", "Auction date"));
  return { parsed: out, url: p.u, images, saleEnd, source: host || "inzerátu" };
}
