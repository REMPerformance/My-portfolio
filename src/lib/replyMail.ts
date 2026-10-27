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
  /** final = konečná cena, nie sme platiteľ DPH */
  vat: "gross" | "net" | "final";
  note: string;
  /** interná evidencia: ako ponuka u zákazníka dopadla, v e-maile sa nezobrazuje */
  status: OfferStatus;
  /** interná poznámka k ponuke, v e-maile sa nezobrazuje */
  internalNote: string;
}

export type OfferStatus = "offered" | "interested" | "bidding" | "won" | "lost" | "declined";
export const OFFER_STATUS: Record<OfferStatus, string> = { offered: "Ponúknuté", interested: "Má záujem", bidding: "Dražíme", won: "Vydražené", lost: "Nevydražené", declined: "Odmietol" };

/** Jedna časť e-mailu. Časti idú v e-maile za sebou v poradí, v akom si ich poskladáte. */
export interface Section {
  heading: string;
  kind: "text" | "rows" | "list" | "table" | "quote" | "offer";
  /** obsah textových častí: odseky, riadky „Názov: hodnota“, kroky zoznamu alebo riadky tabuľky */
  body: string;
  /** len pri časti typu offer */
  offer?: Offer;
}

/** E-mail zákazníkovi: oslovenie, ľubovoľné časti v ľubovoľnom poradí, podpis a pôvodný dopyt zákazníka. */
export interface ReplyData {
  /** vlastný predmet, prázdny znamená automatický */
  subject: string;
  greeting: string;
  sections: Section[];
  quoteTitle: string;
  quote: string;
  /** text na koniec PDF ponuky (postup, inštrukcie), do e-mailu sa nedáva */
  pdfNote?: string;
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
  vat: "final",
  note: "",
  status: "offered",
  internalNote: ""
};

export const VAT_LABEL: Record<Offer["vat"], string> = { final: "odhad", gross: "s DPH", net: "bez DPH" };

export const EMPTY_SECTION: Section = { heading: "", kind: "text", body: "" };
export const offerSection = (o: Partial<Offer> = {}): Section => ({ heading: "", kind: "offer", body: "", offer: { ...EMPTY_OFFER, ...o, photos: [...(o.photos || [])] } });

export const EMPTY_REPLY: ReplyData = { subject: "", greeting: "Dobrý deň,", sections: [], quoteTitle: "Váš dopyt", quote: "" };

/** Autá v e-maile v poradí, v akom v ňom idú. */
export const offersOf = (d: Pick<ReplyData, "sections">): Offer[] => d.sections.filter((x) => x.kind === "offer" && x.offer).map((x) => x.offer!);

/** Doplní chýbajúce polia a prevedie koncepty zo starších verzií (úvod, ponuky a záver ako pevné polia) na časti. */
export function normalizeReply(v: unknown): ReplyData | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Partial<ReplyData> & { intro?: string; outro?: string; offers?: Partial<Offer>[] };
  if (!Array.isArray(o.sections) && !Array.isArray(o.offers)) return null;
  const kinds = ["text", "rows", "list", "table", "quote", "offer"];
  const fix = (x: Partial<Offer> | undefined): Offer => ({ ...EMPTY_OFFER, ...x, photos: Array.isArray(x?.photos) ? x.photos.filter((p) => typeof p === "string") : [] });
  const sections: Section[] = (Array.isArray(o.sections) ? o.sections : []).map((x) => {
    const kind = (kinds.includes(x?.kind) ? x.kind : "text") as Section["kind"];
    return kind === "offer" ? { heading: "", kind, body: "", offer: fix(x.offer) } : { heading: x?.heading || "", kind, body: x?.body || "" };
  });
  const text = (t?: string): Section[] => (t?.trim() ? [{ heading: "", kind: "text", body: t.trim() }] : []);
  return {
    subject: o.subject || "",
    greeting: o.greeting ?? EMPTY_REPLY.greeting,
    sections: [...text(o.intro), ...(Array.isArray(o.offers) ? o.offers.map((x) => offerSection(fix(x))) : []), ...sections, ...text(o.outro)],
    quoteTitle: o.quoteTitle || EMPTY_REPLY.quoteTitle,
    quote: o.quote || "",
    pdfNote: o.pdfNote || ""
  };
}

/** Stavebné časti, z ktorých sa e-mail skladá. Každá má hotový vzhľad a predvyplnený text, ktorý sa dá prepísať. */
export const PARTS: { id: string; label: string; hint: string; make: () => Section }[] = [
  { id: "text", label: "Voľný text", hint: "Odseky textu, napríklad úvod alebo odpoveď na otázku.", make: () => ({ heading: "", kind: "text", body: "" }) },
  { id: "intro", label: "Úvod k ponuke", hint: "Poďakovanie za dopyt a uvedenie ponuky.", make: () => ({ heading: "", kind: "text", body: "ďakujeme za Váš dopyt. Posielame Vám ponuku, ktorá zodpovedá Vášmu zadaniu." }) },
  { id: "offer", label: "Ponuka auta", hint: "Fotky, údaje o aute, stav aukcie a cena na Slovensku.", make: () => offerSection() },
  { id: "terms", label: "Podmienky", hint: "Záloha, manipulačný poplatok, maximálny príhoz a postupné platby.", make: () => ({ heading: "Podmienky", kind: "rows", body: "Záloha pred dražbou: 2 500 €\nManipulačný poplatok pri neúspešnej dražbe: 30 €\nMaximálna suma príhozu: určíte Vy\nÚhrada auta a aukčných poplatkov: do 2 dní od vydraženia\nĎalšie platby: postupne, vždy pred daným krokom (preprava, clo a DPH, oprava, prihlásenie)" }) },
  { id: "dates", label: "Termíny", hint: "Dokedy má byť záloha, kedy je dražba a kedy auto dorazí.", make: () => ({ heading: "Termíny", kind: "rows", body: "Záloha na účte najneskôr: \nDražba: \nDodanie na Slovensko: orientačne 6 až 8 týždňov od úhrady" }) },
  { id: "steps", label: "Ako to prebieha", hint: "Číslovaný postup od potvrdenia po odovzdanie auta.", make: () => ({ heading: "Ako to prebieha", kind: "list", body: "Potvrdíte nám maximálnu sumu príhozu a pošlete fakturačné údaje.\nPripravíme zmluvu a uhradíte zálohu.\nZúčastníme sa dražby a o výsledku Vás informujeme ešte v ten deň.\nPo vydražení uhradíte cenu auta a aukčné poplatky.\nĎalšie platby idú postupne, vždy pred daným krokom: preprava, clo a DPH, oprava a nakoniec prihlásenie.\nAuto Vám odovzdáme prihlásené, s evidenčným číslom." }) },
  { id: "prices", label: "Cenová tabuľka", hint: "Cena na Slovensku pri rôznych sumách vydraženia.", make: () => ({ heading: "Odhadovaná cena podľa vydraženia", kind: "table", body: "Vydražená cena | Bez prihlásenia | S prihlásením\n20 000 USD | 0 € | 0 €\n22 000 USD | 0 € | 0 €\n25 000 USD | 0 € | 0 €" }) },
  { id: "quote", label: "Individuálne nacenenie", hint: "Rozpis nákladov po položkách, súčet sa vypočíta sám.", make: () => ({ heading: "Rozpis nákladov", kind: "quote", body: QUOTE_TEMPLATE }) },
  { id: "repair", label: "Čo bude treba opraviť", hint: "Predbežný rozsah opravy podľa fotiek z aukcie.", make: () => ({ heading: "Predbežný rozsah opravy", kind: "rows", body: "Karoséria: \nPodvozok a riadenie: \nBezpečnostné prvky: \nOdhad ceny opravy: " }) },
  { id: "payment", label: "Platobné údaje", hint: "Účet, variabilný symbol a suma na úhradu.", make: () => ({ heading: "Platobné údaje", kind: "rows", body: "Príjemca: Lukáš Tonkovič, REM Performance\nBanka: Slovenská sporiteľňa, a.s.\nIBAN: SK30 0900 0000 0052 4141 6579\nSWIFT: GIBASKBX\nVariabilný symbol: \nSuma: " }) },
  { id: "rows", label: "Tabuľka údajov", hint: "Vlastná tabuľka v tvare názov a hodnota.", make: () => ({ heading: "", kind: "rows", body: "" }) },
  { id: "list", label: "Číslovaný zoznam", hint: "Vlastné kroky alebo body.", make: () => ({ heading: "", kind: "list", body: "" }) },
  { id: "cta", label: "Výzva na záver", hint: "Čo má zákazník spraviť ďalej.", make: () => ({ heading: "", kind: "text", body: "Ak s týmto súhlasíte, napíšte nám prosím maximálnu sumu prihodenia a fakturačné údaje a obratom pripravíme zmluvu." }) }
];

/** Rýchle zostavy častí pre najčastejšie e-maily. */
/** Predvolené položky nacenenia. Riadok: Položka | Popis | Suma. Suma s % sa počíta z položiek nad ňou. */
export const QUOTE_TEMPLATE = [
  "Kúpna cena vozidla | Obstarávacia cena vozidla u predajcu | ",
  "Námorná preprava | Lodná doprava a poistenie do európskeho prístavu | ",
  "Clo (10 %) | Zákonná colná sadzba z colnej hodnoty CIF | ",
  "DPH pri dovoze (23 %) | Daň zo základu CIF a clo | ",
  "Prístavné poplatky | Manipulácia v prístave a colná deklarácia | ",
  "Pozemná preprava | Autoprepravník z prístavu na Slovensko | ",
  "Úradné preklady | Súdny preklad dokladov k vozidlu | ",
  "Technické kontroly | Kontrola originality, technická a emisná kontrola | ",
  "Homologizácia | Schválenie vozidla a posudok technickej služby | ",
  "Recyklačný poplatok | Zákonný príspevok do Environmentálneho fondu SR | ",
  "Zápis do evidencie a EČV | Správny poplatok a tabuľky s evidenčným číslom | ",
  "Rezerva na nepredvídané náklady | Povinná, nevyčerpaná časť sa vracia | ",
  "#odmena | 5",
  "= SPOLU cca | Odhad celkovej ceny vozidla na slovenských EČV"
].join("\n");

export interface QuoteRow { item: string; desc: string; amount: string; value: number; pct: number | null; base: number }
export interface Quote { rows: QuoteRow[]; total: number; totalLabel: string; totalDesc: string; markupPct: number; markup: number; reserve: number }

/** Cena auta, zákonné platby a rezerva sa nenavyšujú, skrytá odmena sa rozpúšťa len do ostatných položiek. */
export const isCarRow = (item: string) => /^(kúpna cena|cena vozidla|vozidlo\b|odhad (vydražen|príhoz)|vydražen|príhoz)/i.test(item.trim());
export const isFixedRow = (item: string) => /clo|dph|recykl|eviden|eČv|ečv|rezerv/i.test(item) || isCarRow(item);
export const isReserveRow = (item: string) => /^rezerv/i.test(item.trim());

/**
 * Rozoberie nacenenie. Riadok: Položka | Popis | Suma. Riadok „= …“ je súčet.
 * Riadok „#odmena | 5“ je skrytá odmena v %: je to najmenej toľko percent z konečnej sumy SPOLU
 * (vrátane odmeny samotnej, ceny auta, cla, DPH a rezervy), zaokrúhlené nahor na celé eurá.
 * Rozpustí sa pomerne len do služieb, nie do ceny auta, cla, DPH, zákonných poplatkov a rezervy. V e-maile sa nezobrazí.
 * Viditeľná percentuálna suma (napr. 3 %) sa počíta zo súčtu položiek nad ňou.
 */
export function parseQuote(body: string): Quote {
  let sum = 0;
  let totalLabel = "SPOLU cca";
  let totalDesc = "";
  let markupPct = 0;
  const rows: QuoteRow[] = [];
  for (const raw of body.split("\n")) {
    if (!raw.trim()) continue;
    const [item = "", desc = "", amount = ""] = raw.split("|").map((x) => x.trim());
    if (!item && !desc && !amount) continue;
    if (item.startsWith("#")) { if (/odmen/i.test(item)) markupPct = Number(desc.replace(",", ".").replace(/[^\d.]/g, "")) || 0; continue; }
    if (item.startsWith("=")) { totalLabel = item.slice(1).trim() || totalLabel; totalDesc = desc; continue; }
    const pm = amount.match(/^(\d+(?:[.,]\d+)?)\s*%$/);
    const pct = pm ? Number(pm[1].replace(",", ".")) : null;
    const value = pct != null ? Math.round((sum * pct) / 100) : toNum(amount) || 0;
    sum += value;
    rows.push({ item, desc, amount, value, pct, base: value });
  }
  const reserve = rows.filter((r) => isReserveRow(r.item)).reduce((a, r) => a + r.value, 0);
  // odmena = p % z konečnej sumy: m = p/100 * (sum + m)  =>  m = sum * p / (100 - p)
  const markup = markupPct > 0 && markupPct < 100 ? Math.ceil((sum * markupPct) / (100 - markupPct)) : 0;
  const target = rows.filter((r) => r.pct == null && !isFixedRow(r.item) && r.value > 0);
  const tBase = target.reduce((a, r) => a + r.value, 0);
  if (markup > 0 && tBase > 0) {
    // pomerné rozdelenie na celé eurá, zvyšok po zaokrúhlení ide do najväčších zvyškov
    const parts = target.map((r) => { const x = (markup * r.value) / tBase; return { r, f: Math.floor(x), rem: x - Math.floor(x) }; });
    let left = markup - parts.reduce((a, x) => a + x.f, 0);
    parts.sort((a, b) => b.rem - a.rem).forEach((x) => { x.r.value += x.f + (left-- > 0 ? 1 : 0); });
    sum += markup;
  }
  return { rows, total: sum, totalLabel, totalDesc, markupPct, markup: markup > 0 && tBase > 0 ? markup : 0, reserve };
}

export const RESERVE_NOTE = "Rezerva na nepredvídané náklady je povinnou súčasťou platby. Ak sa nevyčerpá, po prihlásení vozidla Vám nevyčerpanú časť vrátime.";

const amountText = (r: QuoteRow) => (r.value ? eur(r.value) : r.amount);

export const PRESETS: { label: string; parts: string[] }[] = [
  { label: "Ponuka áut", parts: ["intro", "offer", "cta"] },
  { label: "Podmienky a postup", parts: ["text", "terms", "dates", "steps", "cta"] },
  { label: "Ponuka aj podmienky", parts: ["intro", "offer", "terms", "steps", "cta"] }
];

export function compose(parts: string[], base: Partial<ReplyData> = {}): ReplyData {
  return { ...EMPTY_REPLY, ...base, sections: parts.map((id) => PARTS.find((x) => x.id === id)?.make()).filter(Boolean) as Section[] };
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
/** Suma v bunke sa nesmie zalomiť: medzery v čísle a pred menou sa menia na pevné. */
const nb = (s: string) => esc(s).replace(/(?<=\d)[ \u00a0\u202f](?=[\d€$])|[ \u00a0\u202f](?=(?:€|EUR|USD|%))/g, "&nbsp;");
const looksMoney = (s: string) => /\d/.test(s) && /(€|eur|usd|\$|%)/i.test(s) && s.length < 24;
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
  const list = offersOf(d).filter(offerFilled);
  if (list.length > 1) return "Ponuka áut podľa Vášho dopytu";
  if (!list.length) return d.sections.find((x) => x.heading.trim() && sectionFilled(x))?.heading.trim() || "REM Performance";
  return `${list[0].title.trim() || "Vaše auto"}: ponuka a cena na Slovensku`;
}

const F = "font-family:Arial,Helvetica,sans-serif;";
const RED = "#c8102e";
const para = (t: string) => t.trim().split(/\n+/).filter(Boolean).map((x) => `<p style="${F}margin:0 0 12px;font-size:15px;line-height:1.6;color:#22252b">${nb(x)}</p>`).join("");

const table = (list: [string, string][]) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #e4e6ea">${list.map(([k, v], i) =>
    `<tr><td width="38%" style="${F}padding:10px 14px;font-size:13px;color:#6b7078;background:${i % 2 ? "#ffffff" : "#f5f6f8"};border-bottom:1px solid #e4e6ea">${esc(k)}</td><td style="${F}padding:10px 14px;font-size:14px;font-weight:bold;color:#15171b;background:${i % 2 ? "#ffffff" : "#f5f6f8"};border-bottom:1px solid #e4e6ea">${esc(v)}</td></tr>`).join("")}</table>`;

const heading = (t: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 10px"><tr><td style="border-left:4px solid ${RED};padding:2px 0 2px 10px;${F}font-size:13px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#15171b">${esc(t)}</td></tr></table>`;

function priceCell(label: string, note: string, price: string, vatLabel: string, main: boolean, pad: string, width: string) {
  const fg = main ? "#ffffff" : "#15171b";
  const dim = main ? "#c3c7ce" : "#6b7078";
  return `<td width="${width}" valign="top" style="padding:${pad}"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse"><tr><td style="${F}padding:16px;background:${main ? "#15171b" : "#f5f6f8"};border:1px solid ${main ? "#15171b" : "#e4e6ea"};border-top:4px solid ${main ? RED : "#cfd3d9"}"><div style="${F}font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:${fg}">${esc(label)}</div><div style="${F}font-size:26px;font-weight:bold;line-height:1.3;color:${fg};padding:6px 0 2px;white-space:nowrap">${nb(price)}</div><div style="${F}font-size:12px;color:${dim}">${esc(vatLabel)}</div>${note.trim() ? `<div style="${F}font-size:12px;line-height:1.5;color:${dim};padding-top:8px">${esc(note.trim())}</div>` : ""}</td></tr></table></td>`;
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
export const sectionFilled = (s: Section) => (s.kind === "offer" ? !!s.offer && offerFilled(s.offer) : !!s.body.trim());

function sectionHtml(s: Section) {
  const ls = lines(s.body);
  let body = "";
  if (s.kind === "rows") body = table(ls.map(pair));
  else if (s.kind === "list") body = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${ls.map((l, i) => `<tr><td width="34" valign="top" style="padding:0 0 10px"><div style="${F}width:24px;height:24px;line-height:24px;text-align:center;font-size:12px;font-weight:bold;color:#ffffff;background:${RED}">${i + 1}</div></td><td valign="top" style="${F}padding:2px 0 10px;font-size:15px;line-height:1.55;color:#22252b">${esc(l)}</td></tr>`).join("")}</table>`;
  else if (s.kind === "quote") {
    const q = parseQuote(s.body);
    const th = (t: string, right = false) => `<td style="${F}padding:10px 14px;font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#ffffff;background:#15171b;${right ? "text-align:right;" : ""}">${t}</td>`;
    body = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #e4e6ea"><tr>${th("Položka")}${th("Popis")}${th("Suma", true)}</tr>${q.rows.map((r, i) => {
      const bg = i % 2 ? "#f5f6f8" : "#ffffff";
      const desc = r.pct != null ? `${r.desc}${r.desc ? " " : ""}(${String(r.pct).replace(".", ",")} % z celkovej sumy)` : r.desc;
      return `<tr><td style="${F}padding:10px 14px;font-size:14px;color:#15171b;background:${bg};border-bottom:1px solid #e4e6ea">${nb(r.item)}</td><td style="${F}padding:10px 14px;font-size:13px;line-height:1.45;color:#4a4f58;background:${bg};border-bottom:1px solid #e4e6ea">${esc(desc)}</td><td style="${F}padding:10px 14px;font-size:14px;font-weight:bold;color:#15171b;background:${bg};border-bottom:1px solid #e4e6ea;text-align:right;white-space:nowrap">${nb(amountText(r))}</td></tr>`;
    }).join("")}<tr><td style="${F}padding:12px 14px;font-size:14px;font-weight:bold;color:#ffffff;background:#15171b;border-top:4px solid ${RED}">${esc(q.totalLabel)}</td><td style="${F}padding:12px 14px;font-size:13px;color:#c3c7ce;background:#15171b;border-top:4px solid ${RED}">${esc(q.totalDesc)}</td><td style="${F}padding:12px 14px;font-size:17px;font-weight:bold;color:#ffffff;background:#15171b;border-top:4px solid ${RED};text-align:right;white-space:nowrap">${nb(eur(q.total))}</td></tr></table>${q.reserve ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:10px;border-collapse:collapse"><tr><td style="${F}padding:10px 14px;font-size:13px;line-height:1.5;color:#15171b;background:#f5f6f8;border:1px solid #e4e6ea;border-left:4px solid ${RED}">${esc(RESERVE_NOTE)}</td></tr></table>` : ""}<p style="${F}margin:10px 0 0;font-size:12px;line-height:1.55;color:#6b7078">Ceny sú orientačné. Výsledná cena sa môže líšiť podľa kurzu, skutočných poplatkov a výsledku schválenia vozidla.</p>`;
  } else if (s.kind === "table") {
    const [head, ...rest] = ls.map(cells);
    const n = Math.max(1, ...ls.map((l) => cells(l).length));
    const fill = (r: string[]) => Array.from({ length: n }, (_, i) => r[i] || "");
    body = head ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #e4e6ea"><tr>${fill(head).map((c) => `<td style="${F}padding:10px 14px;font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#ffffff;background:#15171b">${esc(c)}</td>`).join("")}</tr>${rest.map((r, i) => `<tr>${fill(r).map((c, k) => { const m = k > 0 && looksMoney(c); return `<td style="${F}padding:10px 14px;font-size:14px;${k ? "font-weight:bold;" : ""}color:#15171b;background:${i % 2 ? "#f5f6f8" : "#ffffff"};border-bottom:1px solid #e4e6ea${m ? ";text-align:right;white-space:nowrap" : ""}">${nb(c)}</td>`; }).join("")}</tr>`).join("")}</table>` : "";
  } else body = para(s.body);
  return `<tr><td style="padding:0 24px 4px">${s.heading.trim() ? heading(s.heading.trim()) : `<div style="height:8px;line-height:8px;font-size:1px">&nbsp;</div>`}${body}</td></tr>`;
}

function sectionText(s: Section) {
  const ls = lines(s.body);
  if (s.kind === "quote") {
    const q = parseQuote(s.body);
    const out = [...q.rows.map((r) => `${r.item}: ${amountText(r)}`), `${q.totalLabel}: ${eur(q.total)}`, q.reserve ? `\n${RESERVE_NOTE}` : ""].filter(Boolean).join("\n");
    return [s.heading.trim().toUpperCase(), out].filter(Boolean).join("\n");
  }
  const body = s.kind === "list" ? ls.map((l, i) => `${i + 1}. ${l}`).join("\n") : s.kind === "table" ? ls.map((l) => cells(l).join("  |  ")).join("\n") : ls.join("\n");
  return [s.heading.trim().toUpperCase(), body].filter(Boolean).join("\n");
}

function offerHtml(d: Offer, n: number, total: number, now: number, divider: boolean) {
  const r = rows(d);
  const s = saleRows(d, now);
  const photos = d.photos.map(safeUrl).filter(Boolean);
  const carUrl = safeUrl(d.carUrl);
  const pNo = priceText(d.priceNoReg);
  const pReg = priceText(d.priceReg);
  const vatLabel = VAT_LABEL[d.vat] || VAT_LABEL.final;
  const fixed = d.saleType === "fixed";
  const basis = basisText(d);
  const prices = pNo && pReg
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${priceCell("Bez prihlásenia", d.noRegNote, pNo, vatLabel, false, "0 6px 0 0", "50%")}${priceCell("S prihlásením", d.regNote, pReg, vatLabel, true, "0 0 0 6px", "50%")}</tr></table>`
    : pReg ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${priceCell("S prihlásením", d.regNote, pReg, vatLabel, true, "0", "100%")}</tr></table>`
      : pNo ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${priceCell("Bez prihlásenia", d.noRegNote, pNo, vatLabel, false, "0", "100%")}</tr></table>` : "";
  return `<tr><td style="padding:${divider ? "26px" : "6px"} 24px 0;${divider ? "border-top:8px solid #eef0f3;" : ""}">
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
    pNo || pReg ? `\nODHADOVANÁ CENA NA SLOVENSKU (${VAT_LABEL[d.vat] || VAT_LABEL.final})` : "",
    pNo ? `Bez prihlásenia: ${pNo}${d.noRegNote.trim() ? ` (${d.noRegNote.trim()})` : ""}` : "",
    pReg ? `S prihlásením: ${pReg}${d.regNote.trim() ? ` (${d.regNote.trim()})` : ""}` : "",
    pNo || pReg ? basisText(d) : "",
    d.note.trim() ? `\n${d.note.trim()}` : "",
    carUrl ? `\nAuto na webe: ${carUrl}` : ""
  ].filter(Boolean).join("\n");
}

/** E-mail pre zákazníka: tabuľkové rozloženie a inline štýly, aby vydržalo vloženie do Gmailu. */
export function buildReply(d: ReplyData, now = Date.now()): { subject: string; html: string; text: string } {
  const secs = d.sections.filter(sectionFilled);
  const total = secs.filter((x) => x.kind === "offer").length;
  const quoteTitle = d.quoteTitle.trim() || "Váš dopyt";
  let n = 0;
  // ponuka má vlastné oddelenie hrubou linkou, medzi ponukou a textom pod ňou ho dopĺňame
  const parts = secs.map((x, i) => {
    if (x.kind === "offer") return offerHtml(x.offer!, ++n, total, now, i > 0);
    const afterOffer = i > 0 && secs[i - 1].kind === "offer";
    return (afterOffer ? `<tr><td style="border-top:8px solid #eef0f3;height:10px;line-height:10px;font-size:1px">&nbsp;</td></tr>` : "") + sectionHtml(x);
  });
  const lastOffer = secs.length > 0 && secs[secs.length - 1].kind === "offer";

  const html = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef0f3"><tr><td align="center" style="padding:20px 10px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;border-collapse:collapse;background:#ffffff">
<tr><td style="background:#0c0d10;padding:22px 24px;border-bottom:4px solid ${RED}"><a href="${SITE.url}" style="text-decoration:none"><img src="${SITE.url}/brand/rem-performance-white.png" width="340" height="18" alt="REM PERFORMANCE" style="display:block;width:340px;max-width:100%;height:auto;border:0;${F}font-size:20px;font-weight:bold;font-style:italic;letter-spacing:1px;color:#ffffff"></a></td></tr>
<tr><td style="padding:24px 24px 0">${para(d.greeting)}</td></tr>
${parts.join("\n")}
<tr><td style="padding:14px 24px 24px;${lastOffer ? "border-top:1px solid #e4e6ea" : ""}">
<p style="${F}margin:8px 0 12px;font-size:15px;line-height:1.6;color:#22252b">S pozdravom,</p>
<img src="${SITE.url}/brand/podpis-email.png" width="552" alt="Lukáš Tonkovič, Managing Director, REM Performance, ${esc(SITE.phone)}, ${SITE.email}" style="display:block;width:100%;max-width:552px;height:auto;border:0;${F}font-size:14px;line-height:1.5;color:#22252b">
</td></tr>
${d.quote.trim() ? `<tr><td style="padding:0 24px 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse"><tr><td style="${F}padding:14px 16px;background:#f5f6f8;border:1px solid #e4e6ea;border-left:4px solid #cfd3d9"><div style="${F}font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#6b7078;padding-bottom:6px">${esc(quoteTitle)}</div><div style="${F}font-size:13px;line-height:1.6;color:#4a4f58">${esc(d.quote.trim()).replace(/\n/g, "<br>")}</div></td></tr></table></td></tr>` : ""}
<tr><td style="background:#f5f6f8;border-top:1px solid #e4e6ea;padding:16px 24px;${F}font-size:12px;line-height:1.7;color:#6b7078">Telefón a WhatsApp: <a href="tel:${SITE.phone.replace(/\s/g, "")}" style="color:#15171b;text-decoration:none;font-weight:bold">${esc(SITE.phone)}</a><br>E-mail: <a href="mailto:${SITE.email}" style="color:#15171b;text-decoration:none;font-weight:bold">${SITE.email}</a><br>Web: <a href="${SITE.url}" style="color:#15171b;text-decoration:none;font-weight:bold">${SITE.url.replace("https://", "")}</a></td></tr>
</table></td></tr></table>`;

  let m = 0;
  const text = [
    d.greeting.trim(), "",
    secs.map((x) => (x.kind === "offer" ? offerText(x.offer!, ++m, total, now) : sectionText(x))).join("\n\n"),
    "",
    "S pozdravom", "Lukáš Tonkovič", SITE.name, SITE.phone, SITE.email,
    d.quote.trim() ? `\n${quoteTitle.toUpperCase()}\n${d.quote.trim()}` : ""
  ].join("\n").replace(/\n{3,}/g, "\n\n").trim();

  return { subject: replySubject(d), html, text };
}

/** Kto ponuku vyhotovil: meno, funkcia, tvar slovesa a podpis ako obrázok (data URL). Ukladá sa v nastaveniach pod kľúčom "signers". */
export interface Signer { id: string; name: string; role: string; made: "Vyhotovil" | "Vyhotovila"; img: string }

/** Skrátené obchodné podmienky na koniec PDF ponuky. Plné znenie je na webe. */
export const PDF_TERMS = [
  "Ponuka je nezáväzná a nie je návrhom na uzavretie zmluvy. Zmluvný vzťah vzniká až podpisom zmluvy o obstaraní, dovoze a dodaní vozidla, ktorá má prednosť pred týmito podmienkami.",
  "Všetky ceny sú odhadom. Výsledná cena závisí najmä od kurzu v deň platby, skutočných nákladov na prepravu a poplatkov, výšky cla a DPH, ktorú určí colný úrad, a od požiadaviek pri schválení vozidla. REM Performance nie je platiteľom DPH.",
  "REM Performance nie je predávajúcim vozidla, vozidlo obstaráva na účet klienta. Údaje o vozidle pochádzajú od predajcu, zo záznamov poisťovní a z kontroly vozidla, za skryté vady a nesprávne údaje predajcu REM Performance nezodpovedá.",
  "Platby sa hradia postupne vopred podľa zmluvy, vždy pred tým, než príslušný náklad vznikne. Clo a dovoznú DPH platí klient ako dovozca priamo colnému úradu. Nevyčerpaná časť rezervy sa po prihlásení vozidla vracia.",
  "Uvedené termíny sú orientačné. Za oneskorenie spôsobené predajcom, prepravcom, prístavom, colnými orgánmi alebo orgánmi pri schválení vozidla REM Performance nezodpovedá.",
  "Klient, ktorý je spotrebiteľom, má právo odstúpiť od zmluvy uzavretej na diaľku do 14 dní za podmienok uvedených v zmluve. Reklamácie a sťažnosti vybavujeme na info@remperformance.sk do 30 dní, spotrebiteľ sa môže obrátiť aj na Slovenskú obchodnú inšpekciu (www.soi.sk).",
];

/**
 * Ponuka vozidla ako samostatný dokument na tlač do PDF (A4).
 * Strana 1: názov a fotky. Strana 2: údaje o aute. Potom každá tabuľka na vlastnej strane
 * (rozpis nákladov s konečnou sumou, platby). Na konci vlastný text (postup, inštrukcie),
 * vyhotovil/vyhotovila s podpisom, skrátené VOP a pätička s logom a kontaktom.
 */
export function offerPdfHtml(d: ReplyData, signer: Signer | null, autoPrint = false, now = Date.now()): string {
  const h = (t: string) => `<h2>${esc(t)}</h2>`;
  const kv = (list: [string, string][]) => `<table class="kv">${list.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${nb(v)}</td></tr>`).join("")}</table>`;
  const date = new Date(now).toLocaleDateString("sk-SK", { day: "numeric", month: "numeric", year: "numeric" });
  const logo = (w: number) => `<img class="logo" src="${SITE.url}/brand/rem-performance-white.png" alt="REM PERFORMANCE" style="width:${w}px">`;
  const top = `<div class="top">${logo(250)}<div>Cenová ponuka<br>${esc(date)}</div></div>`;
  const pages: string[] = [];
  const offers = d.sections.filter(sectionFilled).filter((x) => x.kind === "offer").map((x) => x.offer!);
  offers.forEach((o, n) => {
    const photos = o.photos.map(safeUrl).filter(Boolean);
    const [main, ...rest] = photos;
    pages.push(`${top}${offers.length > 1 ? `<div class="kicker">Ponuka ${n + 1} z ${offers.length}</div>` : ""}<h1>${esc(o.title.trim() || "Vozidlo")}</h1>
${main ? `<img class="main" src="${esc(main)}" alt="">` : ""}${rest.length ? `<div class="grid">${rest.slice(0, 12).map((p) => `<img src="${esc(p)}" alt="">`).join("")}</div>` : ""}`);
    const r = rows(o);
    const sale = saleRows(o, now);
    const pReg = priceText(o.priceReg);
    const pNo = priceText(o.priceNoReg);
    pages.push(`${top}<h1 class="small">${esc(o.title.trim())}</h1>${r.length ? h("Údaje o aute") + kv(r) : ""}${sale.length ? h(o.saleType === "fixed" ? "Ponuka predajcu" : "Stav aukcie") + kv(sale) : ""}
${o.note.trim() ? h("Výbava a poznámky") + `<p>${esc(o.note.trim()).replace(/\n/g, "<br>")}</p>` : ""}
${pReg || pNo ? h("Odhadovaná cena na Slovensku") + `<div class="price"><small>${pReg ? "S prihlásením" : "Bez prihlásenia"}</small><b>${nb(pReg || pNo)}</b><span>${esc((pReg ? o.regNote : o.noRegNote).trim())}</span></div>` : ""}`);
  });
  let totalShown = false;
  for (const x of d.sections.filter(sectionFilled)) {
    if (x.kind !== "table" && x.kind !== "quote") continue;
    let body = "";
    let total = "";
    if (x.kind === "quote") {
      const q = parseQuote(x.body);
      body = `<table class="tb"><tr><th>Položka</th><th>Popis</th><th class="r">Suma</th></tr>${q.rows.map((r) => `<tr><td>${nb(r.item)}</td><td>${esc(r.desc)}</td><td class="r">${nb(amountText(r))}</td></tr>`).join("")}<tr class="sum"><td>${esc(q.totalLabel)}</td><td>${esc(q.totalDesc)}</td><td class="r">${nb(eur(q.total))}</td></tr></table>`;
      total = eur(q.total);
    } else {
      const [head, ...rest] = lines(x.body).map(cells);
      if (!head) continue;
      const n = Math.max(1, ...[head, ...rest].map((c) => c.length));
      const fill = (r: string[]) => Array.from({ length: n }, (_, i) => r[i] || "");
      const isSum = (r: string[]) => /^spolu/i.test((r[0] || "").trim());
      body = `<table class="tb"><tr>${fill(head).map((c, k) => `<th${k === n - 1 ? ' class="r"' : ""}>${esc(c)}</th>`).join("")}</tr>${rest.map((r) => `<tr${isSum(r) ? ' class="sum"' : ""}>${fill(r).map((c, k) => `<td${k > 0 && looksMoney(c) ? ' class="r"' : ""}>${nb(c)}</td>`).join("")}</tr>`).join("")}</table>`;
      const last = rest[rest.length - 1];
      if (last && isSum(last)) total = last[last.length - 1] || "";
    }
    const box = total && !totalShown ? `<div class="total"><small>Konečná suma, odhad</small><b>${nb(total)}</b><span>Odhad celkovej ceny vozidla na slovenských EČV</span></div>` : "";
    if (box) totalShown = true;
    pages.push(`${top}${h(x.heading.trim() || "Rozpis")}${body}${box}`);
  }
  const note = (d.pdfNote || "").trim();
  const sign = signer
    ? `<div class="sign"><div>${esc(signer.made)}:<br><b>${esc(signer.name)}</b>${signer.role ? `<br>${esc(signer.role)}, REM Performance` : ""}<br>${esc(date)}</div><div class="sig">${signer.img ? `<img src="${signer.img}" alt="Podpis">` : ""}</div></div>`
    : "";
  const end = `${note ? h("Postup a inštrukcie") + note.split(/\n{2,}/).map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join("") : ""}${sign}
<div class="foot">${logo(200)}<div>Tel. a WhatsApp: <b>${esc(SITE.phone)}</b><br>E-mail: <b>${SITE.email}</b><br>Web: <b>${SITE.url.replace("https://", "")}</b></div></div>
<div class="vop"><b>Obchodné podmienky (výťah).</b> ${PDF_TERMS.map(esc).join(" ")} Plné znenie obchodných podmienok je na ${SITE.url.replace("https://", "")}/vop.</div>`;
  if (pages.length) pages[pages.length - 1] += `<div class="endblock">${end}</div>`;
  else pages.push(`${top}${end}`);
  const css = `@page{size:A4;margin:12mm 12mm 16mm}*{box-sizing:border-box}html,body{margin:0;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:Arial,Helvetica,sans-serif;color:#15171b;font-size:12.5px;line-height:1.5}
.page{break-after:page;page-break-after:always}.page:last-child{break-after:auto;page-break-after:auto}
.top{display:flex;justify-content:space-between;align-items:center;background:#0c0d10;border-bottom:4px solid ${RED};padding:16px 20px;color:#c9ccd2;font-size:11px;text-align:right;margin-bottom:18px}
.logo{display:block;height:auto}
h1{font-size:24px;line-height:1.25;margin:0 0 14px}h1.small{font-size:18px;margin-bottom:6px}.kicker{color:${RED};font-weight:bold;font-size:11px;letter-spacing:1px;text-transform:uppercase}
h2{font-size:12px;letter-spacing:1px;text-transform:uppercase;margin:18px 0 8px;padding-left:9px;border-left:3px solid ${RED};break-after:avoid}
img.main{display:block;width:100%;height:auto;max-height:118mm;object-fit:cover;margin-bottom:6px}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}.grid img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block}
.kv,.tb{width:100%;border-collapse:collapse;border:1px solid #e4e6ea}.kv td,.tb td,.tb th{padding:7px 11px;border-bottom:1px solid #e4e6ea;vertical-align:top;text-align:left}
.kv td:first-child{color:#6b7078;width:34%;background:#f5f6f8}.kv td:last-child{font-weight:bold}
.tb th{background:#15171b;color:#fff;font-size:10.5px;letter-spacing:1px;text-transform:uppercase}.tb td{font-size:12px}.tb td:first-child{white-space:nowrap}.tb tr:nth-child(odd) td{background:#f7f8fa}
.tb .r{text-align:right;white-space:nowrap;font-weight:bold}.tb tr.sum td{background:#15171b!important;color:#fff;font-weight:bold;border-top:3px solid ${RED}}
tr{break-inside:avoid}
.price,.total{background:#15171b;border-top:4px solid ${RED};color:#fff;padding:14px 18px;margin-top:6px}.price small,.total small{display:block;font-size:10.5px;letter-spacing:1px;text-transform:uppercase;color:#c9ccd2}
.price b{display:block;font-size:26px;margin:2px 0}.price span,.total span{font-size:11px;color:#c9ccd2}.total{margin-top:16px}.total b{display:block;font-size:30px;margin:2px 0}
p{margin:0 0 8px}.endblock{margin-top:14px}
.sign{display:flex;align-items:flex-end;gap:30px;margin:22px 0 18px;font-size:12px;color:#4a4f58}.sign b{color:#15171b}.sig{border-bottom:1px solid #9aa0a8;width:220px;min-height:60px;display:flex;align-items:flex-end}.sig img{height:60px;width:auto;display:block}
.foot{display:flex;justify-content:space-between;align-items:center;background:#0c0d10;border-top:4px solid ${RED};padding:14px 20px;color:#c9ccd2;font-size:11px;line-height:1.7;text-align:right}.foot b{color:#fff}
.vop{margin-top:10px;font-size:7.5px;line-height:1.45;color:#6b7078;text-align:justify}
@media screen{body{background:#e9ebee;padding:20px 0}.page{background:#fff;width:186mm;margin:0 auto 16px;padding:0 0 10px;box-shadow:0 1px 6px rgba(0,0,0,.15)}}`;
  // tlač až po načítaní fotiek, inak by v PDF chýbali
  const js = autoPrint
    ? `<script>window.addEventListener("load",function(){var i=[].slice.call(document.images).filter(function(x){return!x.complete});Promise.all(i.map(function(x){return new Promise(function(r){x.onload=x.onerror=r})})).then(function(){setTimeout(function(){window.print()},300)})});</script>`
    : "";
  return `<!doctype html><html lang="sk"><head><meta charset="utf-8"><title>${esc(replySubject(d) || "Cenová ponuka")}</title><style>${css}</style></head><body>${pages.map((p) => `<section class="page">${p}</section>`).join("")}${js}</body></html>`;
}
