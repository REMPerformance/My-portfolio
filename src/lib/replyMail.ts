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
  /** suma vydraženia, z ktorej sú vypočítané obe ceny na Slovensku */
  estBid: string;
  /** interný odkaz na inzerát alebo aukciu, zákazníkovi sa neposiela */
  sourceUrl: string;
  /** vstupy kalkulácie (krajina, štát, typ, poplatky), aby sa ceny dali prepočítať pri inej sume vydraženia */
  calcCar: Record<string, unknown> | null;
  priceNoReg: string;
  priceReg: string;
  noRegNote: string;
  regNote: string;
  vat: "gross" | "net";
  note: string;
}

/** Voľná časť e-mailu pod ponukami: text, tabuľka údajov, číslovaný zoznam alebo cenová tabuľka. */
export interface Section {
  heading: string;
  kind: "text" | "rows" | "list" | "table";
  body: string;
}

/** E-mail zákazníkovi: úvod, ľubovoľný počet ponúk, voľné časti, záver a pôvodný dopyt zákazníka. */
export interface ReplyData {
  /** vlastný predmet, prázdny znamená automatický */
  subject: string;
  greeting: string;
  intro: string;
  offers: Offer[];
  sections: Section[];
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
  bid: "", currency: "USD", auctionEnd: null, location: "", estBid: "", sourceUrl: "", calcCar: null,
  priceNoReg: "", priceReg: "",
  noRegNote: "Bez opravy a homologizácie, vybavíte si ich sami",
  regNote: "Vrátane opravy, homologizácie a prihlásenia v SR",
  vat: "gross",
  note: ""
};

export const EMPTY_SECTION: Section = { heading: "", kind: "text", body: "" };

export const EMPTY_REPLY: ReplyData = {
  subject: "",
  greeting: "Dobrý deň,",
  intro: "ďakujeme za Váš dopyt. Posielame Vám ponuku, ktorá zodpovedá Vášmu zadaniu.",
  offers: [EMPTY_OFFER],
  sections: [],
  outro: "Ak máte o niektoré auto záujem, odpovedzte prosím na tento e-mail alebo nám zavolajte. Aukcie majú pevný termín, preto je dobré ozvať sa čo najskôr.",
  quoteTitle: "Váš dopyt",
  quote: ""
};

/** Doplní chýbajúce polia v koncepte uloženom staršou verziou formulára. */
export function normalizeReply(v: unknown): ReplyData | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Partial<ReplyData>;
  if (!Array.isArray(o.offers)) return null;
  const kinds = ["text", "rows", "list", "table"];
  return {
    ...EMPTY_REPLY, ...o,
    offers: o.offers.map((x) => ({ ...EMPTY_OFFER, ...x, photos: Array.isArray(x?.photos) ? x.photos.filter((p) => typeof p === "string") : [] })),
    sections: (Array.isArray(o.sections) ? o.sections : []).map((x) => ({ ...EMPTY_SECTION, ...x, kind: kinds.includes(x?.kind) ? x.kind : "text" }))
  };
}

/** Hotové predlohy e-mailov v jednotnom štýle. */
export const TEMPLATES: { id: string; label: string; hint: string; make: () => ReplyData }[] = [
  { id: "offer", label: "Ponuka áut", hint: "Jedno alebo viac áut s fotkami, údajmi a cenou na Slovensku.", make: () => ({ ...EMPTY_REPLY, offers: [{ ...EMPTY_OFFER }] }) },
  {
    id: "more", label: "Ďalšie autá k dopytu", hint: "Keď medzičasom nájdete lepšie kusy a chcete ich doposlať.",
    make: () => ({
      ...EMPTY_REPLY,
      subject: "Ďalšie autá podľa Vášho dopytu",
      intro: "medzičasom sme našli ďalšie autá, ktoré zodpovedajú Vášmu zadaniu. Posielame ich na porovnanie s predchádzajúcou ponukou.",
      offers: [{ ...EMPTY_OFFER }],
      outro: "Ak Vás niektoré z áut zaujalo, dajte nám prosím vedieť a pripravíme presnú kalkuláciu. Aukcie majú pevný termín, preto je dobré ozvať sa čo najskôr."
    })
  },
  {
    id: "terms", label: "Podmienky a ďalší postup", hint: "Záloha, manipulačný poplatok, maximálny príhoz a termíny pred dražbou.",
    make: () => ({
      ...EMPTY_REPLY,
      subject: "Podmienky a ďalší postup",
      intro: "ďakujeme za Váš záujem. Nižšie posielame najdôležitejšie podmienky, aby sme sa mohli zúčastniť dražby.",
      offers: [],
      sections: [
        { heading: "Podmienky", kind: "rows", body: "Záloha pred dražbou: 2 500 €\nManipulačný poplatok pri neúspešnej dražbe: 30 €\nMaximálna suma príhozu: určíte Vy\nÚhrada po vydražení: do 2 dní\nDoplatok: po vyložení auta u nás v servise" },
        { heading: "Termíny", kind: "rows", body: "Záloha na účte najneskôr: \nDražba: \nDodanie na Slovensko: orientačne 6 až 8 týždňov od úhrady" },
        { heading: "Ako to prebieha", kind: "list", body: "Potvrdíte nám maximálnu sumu príhozu a pošlete fakturačné údaje.\nPripravíme zmluvu a uhradíte zálohu.\nZúčastníme sa dražby a o výsledku Vás informujeme ešte v ten deň.\nPo vydražení uhradíte cenu auta a poplatky, zvyšok doplatíte po vyložení auta u nás v servise." }
      ],
      outro: "Ak s týmto súhlasíte, napíšte nám prosím maximálnu sumu prihodenia a fakturačné údaje a obratom pripravíme zmluvu."
    })
  },
  {
    id: "prices", label: "Cenová tabuľka podľa vydraženia", hint: "Koľko bude auto stáť na Slovensku pri rôznych sumách vydraženia.",
    make: () => ({
      ...EMPTY_REPLY,
      subject: "Cena na Slovensku podľa sumy vydraženia",
      intro: "posielame prehľad, ako sa odhadovaná cena auta na Slovensku mení podľa sumy, za ktorú sa vydraží.",
      offers: [],
      sections: [
        { heading: "Odhadovaná cena podľa vydraženia", kind: "table", body: "Vydražená cena | Bez prihlásenia | S prihlásením\n20 000 USD | 0 € | 0 €\n22 000 USD | 0 € | 0 €\n25 000 USD | 0 € | 0 €" },
        { heading: "", kind: "text", body: "Ceny sú odhadované, sú uvedené s DPH a závisia od kurzu dolára." }
      ],
      outro: "Ak máte akékoľvek otázky, odpovedzte prosím na tento e-mail alebo nám zavolajte."
    })
  },
  { id: "free", label: "Voľný e-mail", hint: "Len oslovenie, text a podpis. Časti si pridáte podľa potreby.", make: () => ({ ...EMPTY_REPLY, intro: "", offers: [], sections: [{ heading: "", kind: "text", body: "" }], outro: "" }) }
];

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

/** „Obe ceny sú vykalkulované zo sumy vydraženia 25 000 USD.“ */
export function basisText(d: Offer): string {
  const n = toNum(d.estBid);
  const v = n ? `${num(n)} ${d.currency || "USD"}` : d.estBid.trim();
  if (!v) return "";
  const both = toNum(d.priceNoReg) && toNum(d.priceReg);
  const what = d.saleType === "fixed" ? "z ceny u predajcu" : "zo sumy vydraženia";
  return `${both ? "Obe ceny sú vykalkulované" : "Cena je vykalkulovaná"} ${what} ${v}.`;
}

/** Ponuka, v ktorej je vyplnené aspoň niečo okrem predvolených textov. */
export const offerFilled = (o: Offer) => !!(o.title.trim() || o.photos.some(safeUrl) || rows(o).length || o.bid.trim() || o.auctionEnd || o.location.trim() || o.priceNoReg.trim() || o.priceReg.trim());

export function replySubject(d: ReplyData) {
  if (d.subject?.trim()) return d.subject.trim();
  const list = d.offers.filter(offerFilled);
  if (list.length > 1) return "Ponuka áut podľa Vášho dopytu";
  if (!list.length) return d.sections.find((x) => x.heading.trim())?.heading.trim() || "REM Performance";
  return `${list[0].title.trim() || "Vaše auto"}: ponuka a cena na Slovensku`;
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
  // každá fotka je odkaz na obrázok v plnej veľkosti, aby si ju zákazník vedel kliknutím zväčšiť
  const a = (src: string, img: string) => `<a href="${esc(src)}" target="_blank" rel="noopener" title="Zväčšiť fotku" style="text-decoration:none">${img}</a>`;
  let out = a(first, `<img src="${esc(first)}" width="552" alt="${esc(alt)}" style="display:block;width:100%;max-width:552px;height:auto;border:0">`);
  for (let i = 0; i < rest.length; i += 3) {
    const row = rest.slice(i, i + 3);
    out += `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:6px"><tr>${[0, 1, 2].map((k) =>
      `<td width="33.33%" valign="top" style="padding:0 ${k < 2 ? 3 : 0}px 0 ${k > 0 ? 3 : 0}px">${row[k] ? a(row[k], `<img src="${esc(row[k])}" width="180" alt="" style="display:block;width:100%;height:auto;border:0">`) : "&nbsp;"}</td>`).join("")}</tr></table>`;
  }
  return out + `<p style="${F}margin:8px 0 0;font-size:12px;color:#6b7078">Fotku zväčšíte kliknutím.</p>`;
}

const lines = (t: string) => t.split("\n").map((x) => x.trim()).filter(Boolean);
const pair = (l: string): [string, string] => { const i = l.indexOf(":"); return i < 0 ? [l, ""] : [l.slice(0, i).trim(), l.slice(i + 1).trim()]; };
const cells = (l: string) => l.split("|").map((x) => x.trim());
export const sectionFilled = (s: Section) => !!s.body.trim();

function sectionHtml(s: Section) {
  const ls = lines(s.body);
  let body = "";
  if (s.kind === "rows") body = table(ls.map(pair));
  else if (s.kind === "list") body = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${ls.map((l, i) => `<tr><td width="34" valign="top" style="padding:0 0 10px"><div style="${F}width:24px;height:24px;line-height:24px;text-align:center;font-size:12px;font-weight:bold;color:#ffffff;background:${RED}">${i + 1}</div></td><td valign="top" style="${F}padding:2px 0 10px;font-size:15px;line-height:1.55;color:#22252b">${esc(l)}</td></tr>`).join("")}</table>`;
  else if (s.kind === "table") {
    const [head, ...rest] = ls.map(cells);
    const n = Math.max(1, ...ls.map((l) => cells(l).length));
    const fill = (r: string[]) => Array.from({ length: n }, (_, i) => r[i] || "");
    body = head ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #e4e6ea"><tr>${fill(head).map((c) => `<td style="${F}padding:10px 14px;font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#ffffff;background:#15171b">${esc(c)}</td>`).join("")}</tr>${rest.map((r, i) => `<tr>${fill(r).map((c, k) => `<td style="${F}padding:10px 14px;font-size:14px;${k ? "font-weight:bold;" : ""}color:#15171b;background:${i % 2 ? "#f5f6f8" : "#ffffff"};border-bottom:1px solid #e4e6ea">${esc(c)}</td>`).join("")}</tr>`).join("")}</table>` : "";
  } else body = para(s.body);
  return `<tr><td style="padding:0 24px 8px">${s.heading.trim() ? heading(s.heading.trim()) : `<div style="height:12px;line-height:12px;font-size:1px">&nbsp;</div>`}${body}</td></tr>`;
}

function sectionText(s: Section) {
  const ls = lines(s.body);
  const body = s.kind === "list" ? ls.map((l, i) => `${i + 1}. ${l}`).join("\n") : s.kind === "table" ? ls.map((l) => cells(l).join("  |  ")).join("\n") : ls.join("\n");
  return [s.heading.trim().toUpperCase(), body].filter(Boolean).join("\n");
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
  const basis = basisText(d);
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
${prices ? heading("Odhadovaná cena na Slovensku") + prices + (basis ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:10px;border-collapse:collapse"><tr><td style="${F}padding:10px 14px;font-size:14px;font-weight:bold;line-height:1.5;color:#15171b;background:#f5f6f8;border:1px solid #e4e6ea;border-left:4px solid ${RED}">${esc(basis)}</td></tr></table>` : "") + `<p style="${F}margin:10px 0 0;font-size:12px;line-height:1.55;color:#6b7078">${esc(fixed ? "Ceny sú odhadované. Presnú kalkuláciu Vám pripravíme po potvrdení záujmu." : "Ceny sú odhadované a závisia od sumy, za ktorú sa auto vydraží, a od kurzu. Presnú kalkuláciu Vám pripravíme po potvrdení záujmu.")}</p>` : ""}
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
    pNo || pReg ? basisText(d) : "",
    d.note.trim() ? `\n${d.note.trim()}` : "",
    carUrl ? `\nAuto na webe: ${carUrl}` : ""
  ].filter(Boolean).join("\n");
}

/** E-mail pre zákazníka: tabuľkové rozloženie a inline štýly, aby vydržalo vloženie do Gmailu. */
export function buildReply(d: ReplyData, now = Date.now()): { subject: string; html: string; text: string } {
  const filled = d.offers.filter(offerFilled);
  const secs = d.sections.filter(sectionFilled);
  const list = filled.length || secs.length ? filled : d.offers.slice(0, 1);
  const hello = [d.greeting.trim(), d.intro.trim()].filter(Boolean).join("\n");
  const quoteTitle = d.quoteTitle.trim() || "Váš dopyt";

  const html = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef0f3"><tr><td align="center" style="padding:20px 10px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;border-collapse:collapse;background:#ffffff">
<tr><td style="background:#0c0d10;padding:22px 24px;border-bottom:4px solid ${RED}"><a href="${SITE.url}" style="text-decoration:none"><img src="${SITE.url}/brand/rem-performance-white.png" width="340" height="18" alt="REM PERFORMANCE" style="display:block;width:340px;max-width:100%;height:auto;border:0;${F}font-size:20px;font-weight:bold;font-style:italic;letter-spacing:1px;color:#ffffff"></a></td></tr>
<tr><td style="padding:24px 24px 10px">${para(hello)}</td></tr>
${list.map((o, i) => offerHtml(o, i + 1, list.length, now)).join("\n")}
${secs.length && list.length ? `<tr><td style="border-top:8px solid #eef0f3;height:10px;line-height:10px;font-size:1px">&nbsp;</td></tr>` : ""}
${secs.map(sectionHtml).join("\n")}
<tr><td style="padding:22px 24px 24px;${list.length && !secs.length ? "border-top:1px solid #e4e6ea" : ""}">
${para(d.outro)}
<p style="${F}margin:14px 0 0;font-size:15px;line-height:1.6;color:#22252b">S pozdravom<br><b>Lukáš Tonkovič</b><br>${esc(SITE.name)}</p>
</td></tr>
${d.quote.trim() ? `<tr><td style="padding:0 24px 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse"><tr><td style="${F}padding:14px 16px;background:#f5f6f8;border:1px solid #e4e6ea;border-left:4px solid #cfd3d9"><div style="${F}font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#6b7078;padding-bottom:6px">${esc(quoteTitle)}</div><div style="${F}font-size:13px;line-height:1.6;color:#4a4f58">${esc(d.quote.trim()).replace(/\n/g, "<br>")}</div></td></tr></table></td></tr>` : ""}
<tr><td style="background:#f5f6f8;border-top:1px solid #e4e6ea;padding:16px 24px;${F}font-size:12px;line-height:1.7;color:#6b7078">Telefón a WhatsApp: <a href="tel:${SITE.phone.replace(/\s/g, "")}" style="color:#15171b;text-decoration:none;font-weight:bold">${esc(SITE.phone)}</a><br>E-mail: <a href="mailto:${SITE.email}" style="color:#15171b;text-decoration:none;font-weight:bold">${SITE.email}</a><br>Web: <a href="${SITE.url}" style="color:#15171b;text-decoration:none;font-weight:bold">${SITE.url.replace("https://", "")}</a></td></tr>
</table></td></tr></table>`;

  const text = [
    d.greeting.trim(), "", d.intro.trim(), "",
    list.map((o, i) => offerText(o, i + 1, list.length, now)).join("\n\n----------\n\n"),
    secs.length ? "\n" + secs.map(sectionText).join("\n\n") : "",
    "", d.outro.trim(), "",
    "S pozdravom", "Lukáš Tonkovič", SITE.name, SITE.phone, SITE.email,
    d.quote.trim() ? `\n${quoteTitle.toUpperCase()}\n${d.quote.trim()}` : ""
  ].join("\n").replace(/\n{3,}/g, "\n\n").trim();

  return { subject: replySubject(d), html, text };
}
