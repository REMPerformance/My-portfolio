/* Sledovanie dovozu: kroky, prístavy, trasy lodí a výpočet stavu. Spoločné pre web aj admin. */

export type Leg = "sea" | "post";
export interface Milestone {
  t: string;          // názov kroku
  d: string;          // popis pre zákazníka
  ph: number;         // fáza 0 až 6
  leg?: Leg;          // úsek trasy na mape
  from?: string;      // plánovaný začiatok (YYYY-MM-DD)
  to?: string;        // plánovaný koniec (YYYY-MM-DD)
  done?: string;      // skutočné dokončenie (YYYY-MM-DD)
  hidden?: boolean;   // krok sa zákazníkovi nezobrazí
  photos?: string[];  // fotky k tomuto kroku
  docs?: { name: string; url: string }[]; // dokumenty (PDF) k tomuto kroku
}

export interface TrackUpdate { id?: string; created_at: string; step: number; text: string; photos: string[]; emailed_at?: string | null; email_to?: string | null }

export interface Shipment {
  id?: string;
  vin: string;
  contract_no: string;
  car_label: string;
  origin: string;
  port_from: string;
  port_to: string;
  vessel: string;
  sea_progress: number | null;
  pickup_place?: string;
  destination_place?: string;
  shipping_line?: string;
  voyage?: string;
  container_no?: string;
  etd?: string | null;
  atd?: string | null;
  eta?: string | null;
  ata?: string | null;
  status: "active" | "done" | "hidden";
  milestones: Milestone[];
  updated_at?: string;
  email_masked?: string;
  updates: TrackUpdate[];
}

export const PHASES = ["Objednávka", "Kúpa vozidla", "Do prístavu", "Na mori", "Clo a doprava", "Schválenie", "Odovzdanie"];
export const PHASE_STATE = ["Objednávka prijatá", "Kúpa vozidla", "Na ceste do prístavu", "Na mori", "Clo a doprava", "Schvaľovanie", "Odovzdané"];

export function defaultMilestones(portFrom = "savannah", portTo = "bremerhaven"): Milestone[] {
  const f = PORTS_FROM[portFrom]?.n || "odoslania", t = PORTS_TO[portTo]?.n || "určenia";
  return [
    { t: "Zmluva podpísaná", d: "Zmluva o sprostredkovaní dovozu je podpísaná oboma stranami.", ph: 0 },
    { t: "Záloha prijatá", d: "Záloha je pripísaná na účet a môžeme pristúpiť ku kúpe vozidla.", ph: 0 },
    { t: "Kúpa vozidla", d: "Vozidlo je kúpené a zaplatené predajcovi.", ph: 1 },
    { t: `Odvoz do prístavu ${f}`, d: "Vozidlo smeruje k nášmu agentovi do prístavného terminálu.", ph: 2 },
    { t: "Kontrola vozidla v prístave", d: "Náš agent v prístave skontroluje vozidlo a doklady a nafotí jeho stav.", ph: 2 },
    { t: "Vývozná dokumentácia", d: "Vybavuje sa vývozné colné konanie a dokumenty k preprave.", ph: 2 },
    { t: "Nakládka na loď", d: "Vozidlo je naložené na lodi a pripravené na plavbu.", ph: 2 },
    { t: "Námorná preprava", d: `Loď prepravuje vozidlo do prístavu ${t}.`, ph: 3, leg: "sea" },
    { t: "Vykládka a colné konanie", d: "Po vykládke prebehne dovozné colné konanie.", ph: 4 },
    { t: "Preprava na Slovensko", d: `Vozidlo prevezie kamión z prístavu ${t} na Slovensko.`, ph: 4, leg: "post" },
    { t: "Kontroly a schválenie", d: "Úradné preklady, technické kontroly a schválenie vozidla na prevádzku.", ph: 5 },
    { t: "Registrácia a odovzdanie", d: "Prihlásenie vozidla, evidenčné čísla a odovzdanie kľúčov.", ph: 6 }
  ];
}

/* ── Prístavy a trasy (lon, lat) ──
   Každý prístav nakládky vedie k jednému z dvoch uzlov: Suez (via "med") alebo stred Atlantiku (via "atl").
   Každý prístav vykládky má trasu z oboch uzlov a cestu kamiónom na Slovensko. */
type P = [number, number];
const SUEZ: P = [32.3, 31.4], ATL: P = [-14, 47.5];
const INDIAN: P[] = [[103.9, 1.25], [100.8, 3.4], [97.8, 5.8], [94, 6.2], [86, 5.6], [80.6, 5.4], [72, 8.5], [60, 12.6], [51.5, 12.4], [44.5, 12.2], [43.3, 12.7], [40.8, 15.8], [38.2, 20.2], [35.4, 25.4], [33.7, 27.8], [32.55, 29.9], SUEZ];
const SCS: P[] = [[119.8, 23.6], [114.5, 16], [109.5, 8], [105.2, 2.6], ...INDIAN];
const ECS: P[] = [[122.8, 26.2], ...SCS];
const JAPAN_S: P[] = [[133, 32.6], [129.8, 31.6], [127.2, 30.6], ...ECS];
const PANAMA: P[] = [[-112, 24.5], [-104, 17.5], [-92, 12.5], [-82, 7.2], [-79.6, 8.7], [-79.9, 9.4], [-77.5, 12], [-72, 14.5], [-67, 16.8], [-64.5, 18.8], [-55, 23.5], [-40, 32], [-25, 40], ATL];
const FLORIDA: P[] = [[-84, 24.2], [-81, 24.1], [-79.8, 25.5], [-79.5, 28], [-76, 32], [-60, 37], [-42, 41.2], [-26, 44.6], ATL];
const MIDDLE_EAST: P[] = [[56.4, 26.5], [58.2, 24.6], [60.2, 22], [57.5, 17.5], [52, 13.6], [45.5, 12.3], [43.3, 12.7], [40.8, 15.8], [38.2, 20.2], [35.4, 25.4], [33.7, 27.8], [32.55, 29.9], SUEZ];

type From = { n: string; country: string; ll: P; via: "med" | "atl"; pts: P[] };
export const PORTS_FROM: Record<string, From> = {
  // USA východ
  newyork: { n: "New York / Newark", country: "USA", ll: [-74.1, 40.65], via: "atl", pts: [[-73.8, 40.3], [-70, 40.2], [-55, 41.5], [-40, 44], [-26, 46.5], ATL] },
  davisville: { n: "Davisville", country: "USA", ll: [-71.42, 41.6], via: "atl", pts: [[-71.4, 41.3], [-65, 41.5], [-50, 43.5], [-35, 46], ATL] },
  baltimore: { n: "Baltimore", country: "USA", ll: [-76.55, 39.25], via: "atl", pts: [[-76.25, 38.4], [-76.05, 37.1], [-75.4, 36.9], [-70, 37.6], [-55, 40.2], [-40, 43.5], [-26, 46], ATL] },
  norfolk: { n: "Norfolk", country: "USA", ll: [-76.3, 36.95], via: "atl", pts: [[-75.9, 36.9], [-70, 37.6], [-55, 40.2], [-40, 43.5], [-26, 46], ATL] },
  charleston: { n: "Charleston", country: "USA", ll: [-79.9, 32.78], via: "atl", pts: [[-79.5, 32.6], [-72, 34], [-58, 38], [-42, 41.6], [-26, 45], ATL] },
  savannah: { n: "Savannah", country: "USA", ll: [-81.1, 32.08], via: "atl", pts: [[-79.2, 31.7], [-72, 33.8], [-58, 37.6], [-42, 41.2], [-26, 44.6], ATL] },
  jacksonville: { n: "Jacksonville", country: "USA", ll: [-81.6, 30.4], via: "atl", pts: [[-81.2, 30.4], [-79, 30.8], [-72, 33.5], [-58, 37.6], [-42, 41.2], [-26, 44.6], ATL] },
  miami: { n: "Miami", country: "USA", ll: [-80.17, 25.77], via: "atl", pts: [[-79.9, 25.8], [-78.5, 27.5], [-74, 31], [-60, 36.5], [-42, 41], [-26, 44.6], ATL] },
  // USA záliv
  houston: { n: "Houston", country: "USA", ll: [-95, 29.7], via: "atl", pts: [[-94.5, 29.1], [-90, 26], ...FLORIDA] },
  galveston: { n: "Galveston", country: "USA", ll: [-94.8, 29.3], via: "atl", pts: [[-94.4, 28.9], [-90, 26], ...FLORIDA] },
  neworleans: { n: "New Orleans", country: "USA", ll: [-90.07, 29.95], via: "atl", pts: [[-89.4, 29.1], [-87, 26.5], ...FLORIDA] },
  mobile: { n: "Mobile", country: "USA", ll: [-88.04, 30.7], via: "atl", pts: [[-88, 30.2], [-87, 27.5], ...FLORIDA] },
  // USA západ
  losangeles: { n: "Los Angeles / Long Beach", country: "USA", ll: [-118.25, 33.73], via: "atl", pts: [[-117.8, 33], ...PANAMA] },
  oakland: { n: "Oakland", country: "USA", ll: [-122.3, 37.8], via: "atl", pts: [[-122.7, 37.7], [-120, 33], ...PANAMA] },
  tacoma: { n: "Seattle / Tacoma", country: "USA", ll: [-122.4, 47.27], via: "atl", pts: [[-122.7, 48.1], [-124.7, 48.4], [-125.5, 46], [-124.5, 40], [-121, 34], ...PANAMA] },
  // Kanada
  halifax: { n: "Halifax", country: "Kanada", ll: [-63.58, 44.65], via: "atl", pts: [[-62.5, 44.1], [-50, 45], [-35, 47], ATL] },
  montreal: { n: "Montreal", country: "Kanada", ll: [-73.55, 45.5], via: "atl", pts: [[-71.2, 46.8], [-68, 48.5], [-64, 49.3], [-60, 47.5], [-55, 46.5], [-45, 46.5], [-30, 47.2], ATL] },
  vancouver: { n: "Vancouver", country: "Kanada", ll: [-123.1, 49.29], via: "atl", pts: [[-123.3, 49.1], [-123.2, 48.4], [-124.7, 48.4], [-125.5, 46], [-124.5, 40], [-121, 34], ...PANAMA] },
  // Kórea
  pusan: { n: "Pusan", country: "Južná Kórea", ll: [129.04, 35.1], via: "med", pts: [[127.2, 32.6], ...ECS] },
  incheon: { n: "Inčchon", country: "Južná Kórea", ll: [126.6, 37.45], via: "med", pts: [[125.5, 37], [124.8, 35], [124, 32], ...ECS] },
  pyeongtaek: { n: "Pchjongtchek", country: "Južná Kórea", ll: [126.83, 36.97], via: "med", pts: [[125.9, 36.9], [124.8, 35], [124, 32], ...ECS] },
  // Japonsko
  yokohama: { n: "Jokohama", country: "Japonsko", ll: [139.65, 35.42], via: "med", pts: [[139.8, 34.9], [137, 33.6], ...JAPAN_S] },
  nagoya: { n: "Nagoja", country: "Japonsko", ll: [136.85, 35.0], via: "med", pts: [[136.9, 34.4], [135.5, 33.4], ...JAPAN_S] },
  kobe: { n: "Kóbe / Osaka", country: "Japonsko", ll: [135.25, 34.65], via: "med", pts: [[135.05, 34.3], [135.05, 33.8], ...JAPAN_S] },
  // Čína
  shanghai: { n: "Šanghaj", country: "Čína", ll: [121.8, 31.2], via: "med", pts: [[123, 30.5], ...ECS] },
  ningbo: { n: "Ning-po", country: "Čína", ll: [121.9, 29.9], via: "med", pts: [[122.6, 29.7], ...ECS] },
  tianjin: { n: "Tchien-ťin", country: "Čína", ll: [117.8, 38.98], via: "med", pts: [[119, 38.6], [121, 38.2], [122.6, 37.6], [123.3, 36], [123.5, 32], ...ECS] },
  shenzhen: { n: "Šen-čen / Kanton", country: "Čína", ll: [113.9, 22.5], via: "med", pts: [[114.3, 22], [114.5, 16], [109.5, 8], [105.2, 2.6], ...INDIAN] },
  hongkong: { n: "Hongkong", country: "Čína", ll: [114.15, 22.3], via: "med", pts: [[114.3, 21.9], [114.5, 16], [109.5, 8], [105.2, 2.6], ...INDIAN] },
  // juhovýchodná Ázia a Blízky východ
  laemchabang: { n: "Laem Chabang", country: "Thajsko", ll: [100.9, 13.08], via: "med", pts: [[100.7, 12.5], [102.5, 8], [104.2, 3], ...INDIAN] },
  jebelali: { n: "Džabal Ali (Dubaj)", country: "SAE", ll: [55.03, 25.0], via: "med", pts: [[54.6, 25.6], ...MIDDLE_EAST] },
  khalifa: { n: "Chalífa (Abú Zabí)", country: "SAE", ll: [54.65, 24.8], via: "med", pts: [[54.3, 25.3], [55.5, 26.2], ...MIDDLE_EAST] }
};

const MED_W: P[] = [[28, 33.6], [20, 35.2], [11.6, 37.4], [3, 37.6], [-5.6, 35.95], [-9.6, 37], [-9.8, 43.2], [-5.6, 48.4]];
const CHANNEL: P[] = [[-5.6, 48.4], [-1.2, 50.1], [2.1, 51.2]];
const ADRIATIC_FROM_MED: P[] = [[28, 33.6], [22, 35.3], [18.6, 38.6], [18.9, 40.3], [16.5, 42.2], [14.2, 44.2]];
const ADRIATIC_FROM_ATL: P[] = [[-9.8, 43.2], [-9.6, 37], [-5.6, 35.95], [3, 37.6], [11.6, 37.4], [15.5, 36.6], [18.6, 38.6], [18.9, 40.3], [16.5, 42.2], [14.2, 44.2]];
const BLACK_FROM_MED: P[] = [[28, 33.6], [25.5, 36.3], [25.3, 38.5], [26.2, 40.0], [26.6, 40.4], [28.5, 40.9], [29.05, 41.15], [29.4, 41.8], [29.5, 43.5]];
const BLACK_FROM_ATL: P[] = [[-9.8, 43.2], [-9.6, 37], [-5.6, 35.95], [3, 37.6], [11.6, 37.4], [20, 35.6], [24.5, 36.4], [25.3, 38.5], [26.2, 40.0], [26.6, 40.4], [28.5, 40.9], [29.05, 41.15], [29.4, 41.8], [29.5, 43.5]];
const north = (approach: P[]) => ({ med: [...MED_W, ...CHANNEL.slice(1), ...approach], atl: [...CHANNEL, ...approach] });
const NORTH_SEA: P[] = [[4.2, 52.6], [7.4, 54.1]];
const VIENNA_W: P[] = [[6, 51], [8.7, 50.1], [11.1, 49.45], [14.3, 48.3], [16.37, 48.21]];

type To = { n: string; country: string; ll: P; med: P[]; atl: P[]; post: P[] };
export const PORTS_TO: Record<string, To> = {
  bremerhaven: { n: "Bremerhaven", country: "Nemecko", ll: [8.55, 53.55], ...north(NORTH_SEA), post: [[10, 52.4], [12.4, 51.3], [14.4, 50.1], [16.6, 49.2]] },
  hamburg: { n: "Hamburg", country: "Nemecko", ll: [9.97, 53.54], ...north([...NORTH_SEA, [8.6, 53.95], [9.4, 53.85]]), post: [[11.6, 52.1], [13.4, 51.05], [14.4, 50.1], [16.6, 49.2]] },
  rotterdam: { n: "Rotterdam", country: "Holandsko", ll: [4.1, 51.95], ...north([[3.4, 52.05]]), post: VIENNA_W },
  antwerpen: { n: "Antverpy", country: "Belgicko", ll: [4.3, 51.27], ...north([[3.2, 51.45]]), post: VIENNA_W },
  zeebrugge: { n: "Zeebrugge", country: "Belgicko", ll: [3.2, 51.33], ...north([[2.9, 51.4]]), post: [[4.4, 51.2], ...VIENNA_W] },
  gdansk: { n: "Gdansk / Gdyňa", country: "Poľsko", ll: [18.65, 54.4], ...north([...NORTH_SEA, [7.5, 55.8], [8.2, 57.3], [10.6, 57.9], [11.6, 56.7], [11.0, 55.4], [12.5, 54.6], [15, 54.9], [18.4, 54.75]]), post: [[18.9, 53.0], [19.45, 51.76], [19.0, 50.26], [18.75, 49.2]] },
  koper: { n: "Koper", country: "Slovinsko", ll: [13.73, 45.55], med: [...ADRIATIC_FROM_MED, [13.4, 45.2]], atl: [...ADRIATIC_FROM_ATL, [13.4, 45.2]], post: [[14.5, 46.05], [15.44, 47.07], [16.37, 48.21]] },
  trieste: { n: "Terst", country: "Taliansko", ll: [13.75, 45.63], med: [...ADRIATIC_FROM_MED, [13.4, 45.35]], atl: [...ADRIATIC_FROM_ATL, [13.4, 45.35]], post: [[14.5, 46.05], [15.44, 47.07], [16.37, 48.21]] },
  rijeka: { n: "Rijeka", country: "Chorvátsko", ll: [14.42, 45.33], med: [...ADRIATIC_FROM_MED, [14.1, 44.85]], atl: [...ADRIATIC_FROM_ATL, [14.1, 44.85]], post: [[15.97, 45.81], [16.8, 46.9], [17.1, 47.7]] },
  constanta: { n: "Konstanca", country: "Rumunsko", ll: [28.65, 44.17], med: BLACK_FROM_MED, atl: BLACK_FROM_ATL, post: [[26.1, 44.43], [23.6, 45.3], [21.2, 45.75], [19.04, 47.5]] }
};
export const BRATISLAVA: P = [17.1, 48.15];

export function routeOf(from: string, to: string) {
  const a = PORTS_FROM[from] || PORTS_FROM.savannah, b = PORTS_TO[to] || PORTS_TO.bremerhaven;
  return { a, b, sea: [a.ll, ...a.pts, ...b[a.via], b.ll] as P[], post: [b.ll, ...b.post, BRATISLAVA] as P[] };
}

/* ── Dátumy ── */
const DAY = 864e5;
export const parseDay = (s?: string) => {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
};
export const todayIso = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
export const fShort = (t: number) => new Date(t).toLocaleDateString("sk-SK", { day: "numeric", month: "numeric", year: "numeric" });
export const fLong = (t: number) => new Date(t).toLocaleDateString("sk-SK", { day: "numeric", month: "long" });
export const plDays = (n: number) => (n === 1 ? "deň" : n >= 2 && n <= 4 ? "dni" : "dní");

export type StepState = "done" | "cur" | "next";
export interface ResolvedStep extends Milestone { i: number; st: StepState; p: number; start: number | null; end: number | null; doneAt: number | null }

/** Stav každého kroku: hotové podľa dátumu dokončenia, aktuálny je prvý nehotový. */
export function resolve(ms: Milestone[], now = Date.now()) {
  const steps: ResolvedStep[] = ms.map((m, i) => {
    const start = parseDay(m.from), endD = parseDay(m.to) ?? start, doneAt = parseDay(m.done);
    return { ...m, i, st: doneAt ? "done" : "next", p: doneAt ? 1 : 0, start, end: endD !== null ? endD + DAY : null, doneAt };
  });
  const vis = steps.filter((s) => !s.hidden);
  let cur = vis.find((s) => s.st !== "done") || null;
  if (cur) {
    cur.st = "cur";
    cur.p = cur.start !== null && cur.end !== null && cur.end > cur.start ? Math.max(0, Math.min(.98, (now - cur.start) / (cur.end - cur.start))) : 0;
  }
  const allDone = !cur && vis.length > 0;
  const prevDone = cur ? [...vis].reverse().find((s) => s.i < cur!.i && s.doneAt) : null;
  const curSince = cur ? (cur.start !== null && cur.start <= now ? cur.start : prevDone?.doneAt ?? cur.start) : null;
  const next = cur ? vis.find((s) => s.i > cur!.i) || null : null;
  const last = vis[vis.length - 1] || null;
  const eta = last ? (last.doneAt ?? last.start ?? last.end) : null;
  const first = vis[0];
  const span = first && last && first.start !== null && eta ? Math.max(0, Math.min(1, (now - (first.doneAt ?? first.start)) / (eta - (first.doneAt ?? first.start) || 1))) : vis.length ? vis.filter((s) => s.st === "done").length / vis.length : 0;
  return { steps, vis, cur, next, last, eta, allDone, curSince, pct: allDone ? 100 : Math.round(span * 100) };
}

export function legProgress(steps: ResolvedStep[], seaOverride: number | null) {
  const pr = (leg: Leg) => {
    const s = steps.find((x) => x.leg === leg);
    if (!s) return 0;
    if (s.st === "done") return 1;
    if (s.st === "cur") return leg === "sea" && seaOverride !== null ? seaOverride / 100 : Math.max(.02, s.p);
    // ak je hotový niektorý neskorší krok, úsek je za nami
    return steps.some((x) => x.i > s.i && x.st !== "next") ? 1 : 0;
  };
  return { sea: pr("sea"), post: pr("post") };
}

/* ── Geometria trasy ── */
const rad = (x: number) => (x * Math.PI) / 180;
export function hav(a: P, b: P) { const R = 3440.1, dl = rad(b[1] - a[1]), dn = rad(b[0] - a[0]); const h = Math.sin(dl / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dn / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); }
export function splitRoute(pts: P[], f: number) {
  const c = [0]; for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + hav(pts[i - 1], pts[i]));
  const L = c[c.length - 1], t = Math.max(0, Math.min(1, f)) * L;
  let i = 1; while (i < pts.length - 1 && c[i] < t) i++;
  const seg = c[i] - c[i - 1] || 1, k = Math.max(0, Math.min(1, (t - c[i - 1]) / seg));
  const a = pts[i - 1], b = pts[i], pos: P = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  return { done: [...pts.slice(0, i), pos], left: [pos, ...pts.slice(i)], pos, a, b, L };
}

export const normVin = (v: string) => v.toUpperCase().replace(/\s/g, "");
export const normContract = (v: string) => v.toUpperCase().replace(/[\s-]/g, "");
export const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/;
export const CONTRACT_RE = /^[A-Z0-9]{4,20}$/;

/** Dátumy plavby (ETD, ATD, ETA, ATA) prenesie do kroku námornej prepravy a nakládky, aby mapa aj priebeh sedeli. */
export function syncSeaDates(ms: Milestone[], d: { etd?: string | null; atd?: string | null; eta?: string | null; ata?: string | null }): Milestone[] {
  const si = ms.findIndex((m) => m.leg === "sea");
  if (si < 0) return ms;
  const out = ms.map((m) => ({ ...m }));
  const sea = out[si];
  const from = d.atd || d.etd || "", to = d.ata || d.eta || "";
  if (from) sea.from = from;
  if (to) sea.to = to;
  if (d.ata) sea.done = d.ata;
  const load = si > 0 && out[si - 1].ph === 2 ? out[si - 1] : null;
  if (load && d.atd && !load.done) load.done = d.atd;
  if (load && !load.from && (d.atd || d.etd)) load.from = d.atd || d.etd || undefined;
  return out;
}
