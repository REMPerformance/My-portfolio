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

/* ── Prístavy a trasy (lon, lat) ── */
type P = [number, number];
const RED_SEA_MED: P[] = [[43.3, 12.7], [40.8, 15.8], [38.2, 20.2], [35.4, 25.4], [33.7, 27.8], [32.55, 29.9], [32.3, 31.4], [28, 33.6], [20, 35.2], [11.6, 37.4], [3, 37.6], [-5.6, 35.95], [-9.6, 37], [-9.8, 43.2]];
const CHANNEL: P[] = [[-5.6, 48.4], [-1.2, 50.1], [2.1, 51.2]];

export const PORTS_FROM: Record<string, { n: string; country: string; ll: P; pts: P[] }> = {
  savannah: { n: "Savannah", country: "USA", ll: [-81.1, 32.08], pts: [[-79.2, 31.7], [-72, 33.8], [-58, 37.6], [-42, 41.2], [-26, 44.6], [-14, 47.6]] },
  newyork: { n: "New York", country: "USA", ll: [-74.1, 40.65], pts: [[-73.8, 40.3], [-70, 40.2], [-55, 41.5], [-40, 44], [-26, 46.5], [-14, 48]] },
  baltimore: { n: "Baltimore", country: "USA", ll: [-76.55, 39.25], pts: [[-76.25, 38.4], [-76.05, 37.1], [-75.4, 36.9], [-70, 37.6], [-55, 40.2], [-40, 43.5], [-26, 46], [-14, 47.8]] },
  houston: { n: "Houston", country: "USA", ll: [-95, 29.7], pts: [[-94.5, 29.1], [-90, 26], [-84, 24.2], [-81, 24.1], [-79.8, 25.5], [-79.5, 28], [-76, 32], [-60, 37], [-42, 41.2], [-26, 44.6], [-14, 47.6]] },
  losangeles: { n: "Los Angeles", country: "USA", ll: [-118.25, 33.73], pts: [[-117.8, 33], [-112, 24.5], [-104, 17.5], [-92, 12.5], [-82, 7.2], [-79.6, 8.7], [-79.9, 9.4], [-77.5, 12], [-72, 14.5], [-67, 16.8], [-64.5, 18.8], [-55, 23.5], [-40, 32], [-25, 40], [-14, 46]] },
  halifax: { n: "Halifax", country: "Kanada", ll: [-63.58, 44.65], pts: [[-62.5, 44.1], [-50, 45], [-35, 47], [-20, 48.5], [-10, 49.2]] },
  pusan: { n: "Pusan", country: "Južná Kórea", ll: [129.04, 35.1], pts: [[127.2, 32.6], [122.8, 26.2], [119.8, 23.6], [114.5, 16], [109.5, 8], [105.2, 2.6], [103.9, 1.25], [100.8, 3.4], [97.8, 5.8], [94, 6.2], [86, 5.6], [80.6, 5.4], [72, 8.5], [60, 12.6], [51.5, 12.4], [44.5, 12.2], ...RED_SEA_MED] },
  yokohama: { n: "Jokohama", country: "Japonsko", ll: [139.65, 35.42], pts: [[139.8, 34.9], [137, 33.6], [133, 32.6], [129.8, 31.6], [127.2, 30.6], [122.8, 26.2], [119.8, 23.6], [114.5, 16], [109.5, 8], [105.2, 2.6], [103.9, 1.25], [100.8, 3.4], [97.8, 5.8], [94, 6.2], [86, 5.6], [80.6, 5.4], [72, 8.5], [60, 12.6], [51.5, 12.4], [44.5, 12.2], ...RED_SEA_MED] },
  jebelali: { n: "Džabal Ali", country: "SAE", ll: [55.03, 25.0], pts: [[54.6, 25.6], [56.4, 26.5], [58.2, 24.6], [60.2, 22], [57.5, 17.5], [52, 13.6], [45.5, 12.3], ...RED_SEA_MED] }
};

export const PORTS_TO: Record<string, { n: string; ll: P; pts: P[]; post: P[] }> = {
  bremerhaven: { n: "Bremerhaven", ll: [8.55, 53.55], pts: [[4.2, 52.6], [7.4, 54.1]], post: [[10, 52.4], [12.4, 51.3], [14.4, 50.1], [16.6, 49.2]] },
  rotterdam: { n: "Rotterdam", ll: [4.1, 51.95], pts: [[3.4, 52.05]], post: [[6, 51.2], [8.7, 50.1], [11.1, 49.45], [14.3, 48.3], [16.37, 48.21]] },
  antwerpen: { n: "Antverpy", ll: [4.3, 51.27], pts: [[3.2, 51.45]], post: [[6, 51], [8.7, 50.1], [11.1, 49.45], [14.3, 48.3], [16.37, 48.21]] }
};
export const BRATISLAVA: P = [17.1, 48.15];

export function routeOf(from: string, to: string) {
  const a = PORTS_FROM[from] || PORTS_FROM.savannah, b = PORTS_TO[to] || PORTS_TO.bremerhaven;
  return { a, b, sea: [a.ll, ...a.pts, ...CHANNEL, ...b.pts, b.ll] as P[], post: [b.ll, ...b.post, BRATISLAVA] as P[] };
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
