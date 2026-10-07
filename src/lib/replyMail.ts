import { SITE } from "./site";
import { eur, money, num } from "./format";

/** Jedno auto v odpovedi na dopyt. Prázdne polia sa v e-maile nezobrazia. */
export interface Offer {
  title: string;
  photos: string[];
  carUrl: string;
  vin: string;
  year: string;
  mileage: string;
  mileageUnit: "mi" | "km";
  color: string;
  engine: string;
  transmission: string;
  drive: string;
  fuel: string;
  docs: string;
  keys: string;
  condition: string;
  damage: string;
  saleType: "auction" | "fixed";
  bid: string;
  currency: string;
  auctionEnd: string | null;
  location: string;
  priceNoReg: string;
  priceReg: string;
  noRegNote: string;
  regNote: string;
  vat: "gross" | "net";
  note: string;
}

/** Odpoveď na dopyt: úvod, jedna alebo viac ponúk, záver a pôvodný dopyt zákazníka. */
export interface ReplyData {
  greeting: string;
  intro: string;
  offers: Offer[];
  outro: string;
  quoteTitle: string;
  quote: string;
}

export const EMPTY_OFFER: Offer = {
  title: "",
  photos: [],
  carUrl: "",
  vin: "", year: "", mileage: "", mileageUnit: "mi", color: "", engine: "", transmission: "", drive: "", fuel: "", docs: "", keys: "", condition: "", damage: "",
  saleType: "auction",
  bid: "", currency: "USD", auctionEnd: null, location: "",
  priceNoReg: "", priceReg: "",
  noRegNote: "Bez opravy a homologizácie, vybavíte si ich sami",
  regNote: "Vrátane opravy, homologizácie a prihlásenia v SR",
  vat: "gross",
  note: ""
};

export const EMPTY_REPLY: ReplyData = {
  greeting: "Dobrý deň,",
  intro: "ďakujeme za Váš dopyt. Posielame Vám ponuku, ktorá zodpovedá Vášmu zadaniu.",
  offers: [EMPTY_OFFER],
  outro: "Ak máte o niektoré auto záujem, odpovedzte prosím na tento e-mail alebo nám zavolajte. Aukcie majú pevný termín, preto je dobré ozvať sa čo najskôr.",
  quoteTitle: "Váš dopyt",
  quote: ""
};

/** Doplní chýbajúce polia v koncepte uloženom staršou verziou formulára. */
export function normalizeReply(v: unknown): ReplyData | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Partial<ReplyData>;
  if (!Array.isArray(o.offers) || !o.offers.length) return null;
  return { ...EMPTY_REPLY, ...o, offers: o.offers.map((x) => ({ ...EMPTY_OFFER, ...x, photos: Array.isArray(x?.photos) ? x.photos.filter((p) => typeof p === "string") : [] })) };
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const toNum = (s: string) => { const n = Number(String(s).replace(/[^\d.,]/g, "").replace(/[.,](?=\d{3}(\D|$))/g, "").replace(",", ".")); return isFinite(n) && n > 0 ? n : null; };
const safeUrl = (u: string) => (/^https?:\/\//i.test(u.trim()) ? u.trim() : "");

const dtf = new Intl.DateTimeFormat("sk-SK", { weekday: "long", day: "numeric", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Bratislava" });

/** „končí o 3 dni a 4 hodiny“ – koľko zostáva do konca aukcie. */
export function timeLeft(iso: string | null, now = Date.now()): string {
  if (!iso) return "";
  const ms = Date.parse(iso) - now;
  if (!isFinite(ms)) return "";
  if (ms <= 0) return "aukcia sa už skončila";
  const h = Math.floor(ms / 3600000);
  const d = Math.floor(h / 24);
  if (d === 0) return h <= 1 ? "končí do hodiny" : `končí o ${h} ${h < 5 ? "hodiny" : "hodín"}`;
  const days = d === 1 ? "1 deň" : d < 5 ? `${d} dni` : `${d} dní`;
  const rest = h - d * 24;
  return `končí o ${days}${rest ? ` a ${rest} ${rest === 1 ? "hodinu" : rest < 5 ? "hodiny" : "hodín"}` : ""}`;
}

export function mileageText(d: Pick<Offer, "mileage" | "mileageUnit">) {
  const n = toNum(d.mileage);
  if (!n) return d.mileage.trim();
  return d.mileageUnit === "mi" ? `${num(n * 1.609344)} km (${num(n)} mi)` : `${num(n)} km`;
}

const priceText = (s: string) => { const n = toNum(s); return n ? eur(n) : s.trim(); };

function rows(d: Offer): [string, string][] {
  return ([
    ["Rok výroby", d.year],
    ["Najazdené", mileageText(d)],
    ["Motor", d.engine],
    ["Prevodovka", d.transmission],
    ["Pohon", d.drive],
    ["Palivo", d.fuel],
    ["Farba", d.color],
    ["Stav", d.condition],
    ["Poškodenie", d.damage],
    ["Doklady", d.docs],
    ["Kľúče", d.keys],
    ["VIN", d.vin]
  ] as [string, string][]).map(([k, v]) => [k, (v || "").trim()] as [string, string]).filter(([, v]) => v);
}

function saleRows(d: Offer, now: number): [string, string][] {
  const bid = toNum(d.bid);
  const fixed = d.saleType === "fixed";
  const left = timeLeft(d.auctionEnd, now);
  const leftText = fixed ? left.replace(/^končí o /, "ešte ").replace("končí do hodiny", "ešte hodinu").replace("aukcia sa už skončila", "ponuka už skončila") : left;
  return ([
    [fixed ? "Cena u predajcu" : "Aktuálna ponuka", bid ? money(bid, d.currency) : d.bid.trim()],
    [fixed ? "Ponuka platí do" : "Koniec aukcie", d.auctionEnd ? `${dtf.format(new Date(d.auctionEnd))}${leftText ? `, ${leftText}` : ""}` : ""],
    ["Lokalita", d.location.trim()]
  ] as [string, string][]).filter(([, v]) => v);
}

/** Ponuka, v ktorej je vyplnené aspoň niečo okrem predvolených textov. */
export const offerFilled = (o: Offer) => !!(o.title.trim() || o.photos.some(safeUrl) || rows(o).length || o.bid.trim() || o.auctionEnd || o.location.trim() || o.priceNoReg.trim() || o.priceReg.trim());

export function replySubject(d: ReplyData) {
  const list = d.offers.filter(offerFilled);
  if (list.length > 1) return "Ponuka áut podľa Vášho dopytu";
  return `${list[0]?.title.trim() || "Vaše auto"}: ponuka a cena na Slovensku`;
}

const F = "font-family:Arial,Helvetica,sans-serif;";
const RED = "#c8102e";
const para = (t: string) => t.trim().split(/\n+/).filter(Boolean).map((x) => `<p style="${F}margin:0 0 12px;font-size:15px;line-height:1.6;color:#22252b">${esc(x)}</p>`).join("");

const table = (list: [string, string][]) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #e4e6ea">${list.map(([k, v], i) =>
    `<tr><td width="38%" style="${F}padding:10px 14px;font-size:13px;color:#6b7078;background:${i % 2 ? "#ffffff" : "#f5f6f8"};border-bottom:1px solid #e4e6ea">${esc(k)}</td><td style="${F}padding:10px 14px;font-size:14px;font-weight:bold;color:#15171b;background:${i % 2 ? "#ffffff" : "#f5f6f8"};border-bottom:1px solid #e4e6ea">${esc(v)}</td></tr>`).join("")}</table>`;

const heading = (t: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 10px"><tr><td style="border-left:4px solid ${RED};padding:2px 0 2px 10px;${F}font-size:13px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#15171b">${esc(t)}</td></tr></table>`;

function priceCell(label: string, note: string, price: string, vatLabel: string, main: boolean, pad: string, width: string) {
  const fg = main ? "#ffffff" : "#15171b";
  const dim = main ? "#c3c7ce" : "#6b7078";
  return `<td width="${width}" valign="top" style="padding:${pad}"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse"><tr><td style="${F}padding:16px;background:${main ? "#15171b" : "#f5f6f8"};border:1px solid ${main ? "#15171b" : "#e4e6ea"};border-top:4px solid ${main ? RED : "#cfd3d9"}"><div style="${F}font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:${fg}">${esc(label)}</div><div style="${F}font-size:26px;font-weight:bold;line-height:1.3;color:${fg};padding:6px 0 2px">${esc(price)}</div><div style="${F}font-size:12px;color:${dim}">${esc(vatLabel)}</div>${note.trim() ? `<div style="${F}font-size:12px;line-height:1.5;color:${dim};padding-top:8px">${esc(note.trim())}</div>` : ""}</td></tr></table></td>`;
}

function gallery(photos: string[], alt: string) {
  if (!photos.length) return "";
  const [first, ...rest] = photos;
  let out = `<img src="${esc(first)}" width="552" alt="${esc(alt)}" style="display:block;width:100%;max-width:552px;height:auto;border:0">`;
  for (let i = 0; i < rest.length; i += 3) {
    const row = rest.slice(i, i + 3);
    out += `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:6px"><tr>${[0, 1, 2].map((k) =>
      `<td width="33.33%" valign="top" style="padding:0 ${k < 2 ? 3 : 0}px 0 ${k > 0 ? 3 : 0}px">${row[k] ? `<img src="${esc(row[k])}" width="180" alt="" style="display:block;width:100%;height:auto;border:0">` : "&nbsp;"}</td>`).join("")}</tr></table>`;
  }
  return out;
}

function offerHtml(d: Offer, n: number, total: number, now: number) {
  const r = rows(d);
  const s = saleRows(d, now);
  const photos = d.photos.map(safeUrl).filter(Boolean);
  const carUrl = safeUrl(d.carUrl);
  const pNo = priceText(d.priceNoReg);
  const pReg = priceText(d.priceReg);
  const vatLabel = d.vat === "gross" ? "s DPH" : "bez DPH";
  const fixed = d.saleType === "fixed";
  const prices = pNo && pReg
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${priceCell("Bez prihlásenia", d.noRegNote, pNo, vatLabel, false, "0 6px 0 0", "50%")}${priceCell("S prihlásením", d.regNote, pReg, vatLabel, true, "0 0 0 6px", "50%")}</tr></table>`
    : pReg ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${priceCell("S prihlásením", d.regNote, pReg, vatLabel, true, "0", "100%")}</tr></table>`
      : pNo ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${priceCell("Bez prihlásenia", d.noRegNote, pNo, vatLabel, false, "0", "100%")}</tr></table>` : "";
  return `<tr><td style="padding:${n > 1 ? "26px" : "6px"} 24px 0;${n > 1 ? "border-top:8px solid #eef0f3;" : ""}">
${total > 1 ? `<div style="${F}font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:${RED};padding-bottom:4px">Ponuka ${n} z ${total}</div>` : ""}
${d.title.trim() ? `<div style="${F}font-size:24px;font-weight:bold;line-height:1.25;color:#15171b;padding:0 0 12px">${esc(d.title.trim())}</div>` : ""}
${gallery(photos, d.title.trim())}
${r.length ? heading("Údaje o aute") + table(r) : ""}
${s.length ? heading(fixed ? "Ponuka predajcu" : "Stav aukcie") + table(s) : ""}
${prices ? heading("Odhadovaná cena na Slovensku") + prices + `<p style="${F}margin:10px 0 0;font-size:12px;line-height:1.55;color:#6b7078">${esc(fixed ? "Ceny sú odhadované. Presnú kalkuláciu Vám pripravíme po potvrdení záujmu." : "Ceny sú odhadované a závisia od sumy, za ktorú sa auto vydraží, a od kurzu. Presnú kalkuláciu Vám pripravíme po potvrdení záujmu.")}</p>` : ""}
${d.note.trim() ? `<div style="padding-top:16px">${para(d.note)}</div>` : ""}
${carUrl ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0 0"><tr><td style="background:${RED};padding:12px 26px"><a href="${esc(carUrl)}" style="${F}font-size:13px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#ffffff;text-decoration:none">Zobraziť auto na webe</a></td></tr></table>` : ""}
<div style="height:26px;line-height:26px;font-size:1px">&nbsp;</div>
</td></tr>`;
}

function offerText(d: Offer, n: number, total: number, now: number) {
  const r = rows(d);
  const s = saleRows(d, now);
  const pNo = priceText(d.priceNoReg);
  const pReg = priceText(d.priceReg);
  const line = (list: [string, string][]) => list.map(([k, v]) => `${k}: ${v}`).join("\n");
  const carUrl = safeUrl(d.carUrl);
  return [
    total > 1 ? `PONUKA ${n} Z ${total}` : "",
    d.title.trim(),
    r.length ? "\nÚDAJE O AUTE\n" + line(r) : "",
    s.length ? `\n${d.saleType === "fixed" ? "PONUKA PREDAJCU" : "STAV AUKCIE"}\n` + line(s) : "",
    pNo || pReg ? `\nODHADOVANÁ CENA NA SLOVENSKU (${d.vat === "gross" ? "s DPH" : "bez DPH"})` : "",
    pNo ? `Bez prihlásenia: ${pNo}${d.noRegNote.trim() ? ` (${d.noRegNote.trim()})` : ""}` : "",
    pReg ? `S prihlásením: ${pReg}${d.regNote.trim() ? ` (${d.regNote.trim()})` : ""}` : "",
    d.note.trim() ? `\n${d.note.trim()}` : "",
    carUrl ? `\nAuto na webe: ${carUrl}` : ""
  ].filter(Boolean).join("\n");
}

/** E-mail pre zákazníka: tabuľkové rozloženie a inline štýly, aby vydržalo vloženie do Gmailu. */
export function buildReply(d: ReplyData, now = Date.now()): { subject: string; html: string; text: string } {
  const filled = d.offers.filter(offerFilled);
  const list = filled.length ? filled : d.offers.slice(0, 1);
  const quoteTitle = d.quoteTitle.trim() || "Váš dopyt";

  const html = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef0f3"><tr><td align="center" style="padding:20px 10px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;border-collapse:collapse;background:#ffffff">
<tr><td style="background:#0c0d10;padding:22px 24px;border-bottom:4px solid ${RED}"><a href="${SITE.url}" style="text-decoration:none"><img src="${SITE.url}/brand/rem-performance-white.png" width="340" height="18" alt="REM PERFORMANCE" style="display:block;width:340px;max-width:100%;height:auto;border:0;${F}font-size:20px;font-weight:bold;font-style:italic;letter-spacing:1px;color:#ffffff"></a></td></tr>
<tr><td style="padding:24px 24px 10px">${para(`${d.greeting.trim()}\n${d.intro.trim()}`)}</td></tr>
${list.map((o, i) => offerHtml(o, i + 1, list.length, now)).join("\n")}
<tr><td style="padding:22px 24px 24px;border-top:1px solid #e4e6ea">
${para(d.outro)}
<p style="${F}margin:14px 0 0;font-size:15px;line-height:1.6;color:#22252b">S pozdravom<br><b>Lukáš Tonkovič</b><br>${esc(SITE.name)}</p>
</td></tr>
${d.quote.trim() ? `<tr><td style="padding:0 24px 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse"><tr><td style="${F}padding:14px 16px;background:#f5f6f8;border:1px solid #e4e6ea;border-left:4px solid #cfd3d9"><div style="${F}font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#6b7078;padding-bottom:6px">${esc(quoteTitle)}</div><div style="${F}font-size:13px;line-height:1.6;color:#4a4f58">${esc(d.quote.trim()).replace(/\n/g, "<br>")}</div></td></tr></table></td></tr>` : ""}
<tr><td style="background:#f5f6f8;border-top:1px solid #e4e6ea;padding:16px 24px;${F}font-size:12px;line-height:1.7;color:#6b7078">Telefón a WhatsApp: <a href="tel:${SITE.phone.replace(/\s/g, "")}" style="color:#15171b;text-decoration:none;font-weight:bold">${esc(SITE.phone)}</a><br>E-mail: <a href="mailto:${SITE.email}" style="color:#15171b;text-decoration:none;font-weight:bold">${SITE.email}</a><br>Web: <a href="${SITE.url}" style="color:#15171b;text-decoration:none;font-weight:bold">${SITE.url.replace("https://", "")}</a></td></tr>
</table></td></tr></table>`;

  const text = [
    d.greeting.trim(), "", d.intro.trim(), "",
    list.map((o, i) => offerText(o, i + 1, list.length, now)).join("\n\n----------\n\n"),
    "", d.outro.trim(), "",
    "S pozdravom", "Lukáš Tonkovič", SITE.name, SITE.phone, SITE.email,
    d.quote.trim() ? `\n${quoteTitle.toUpperCase()}\n${d.quote.trim()}` : ""
  ].join("\n").replace(/\n{3,}/g, "\n\n").trim();

  return { subject: replySubject(d), html, text };
}
