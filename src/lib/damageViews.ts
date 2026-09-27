/** Geometria nákresov auta pre mapu poškodenia (SVG path dáta). */
export type PartKind = "panel" | "glass" | "light" | "tail" | "grille" | "trim" | "tire";
export interface Part { zone?: string; d: string; kind: PartKind; clip?: boolean }
export interface Wheel { zone: string; cx: number; cy: number; r: number }
export interface View {
  id: "top" | "left" | "right" | "front" | "rear";
  label: string;
  w: number;
  h: number;
  body: string;
  under?: Part[];
  parts: Part[];
  wheels?: Wheel[];
  deco: string;
  mirror?: boolean;
  labels: { x: number; y: number; t: string; a?: "start" | "middle" | "end" }[];
}

/* ───────── ZHORA (predok hore, ľavá strana auta vľavo) ───────── */
const TOP_BODY =
  "M70,18 C88,10 132,10 150,18 C170,26 182,40 184,70 L187,122 C189,142 187,160 185,180 L185,300 C187,320 189,338 187,358 L184,402 C182,428 168,442 150,447 C130,452 90,452 70,447 C52,442 38,428 36,402 L33,358 C31,338 33,320 35,300 L35,180 C33,160 31,142 33,122 L36,70 C38,40 50,26 70,18 Z";
const mx = (d: string, W = 220) =>
  d.replace(/([MLHVCQ ,])(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_m, p, x, y) => `${p}${W - Number(x)},${y}`);

export const VIEW_TOP: View = {
  id: "top",
  label: "Zhora",
  w: 220,
  h: 480,
  body: TOP_BODY,
  under: [
    { zone: "fl_wheel", kind: "tire", d: "M20,76 h18 v62 h-18 Z" },
    { zone: "fr_wheel", kind: "tire", d: "M182,76 h18 v62 h-18 Z" },
    { zone: "rl_wheel", kind: "tire", d: "M20,318 h18 v62 h-18 Z" },
    { zone: "rr_wheel", kind: "tire", d: "M182,318 h18 v62 h-18 Z" }
  ],
  parts: [
    { zone: "front_bumper", kind: "panel", clip: true, d: "M20,4 H200 V44 H20 Z" },
    { zone: "hood", kind: "panel", clip: true, d: "M62,44 H158 V150 H62 Z" },
    { zone: "fl_fender", kind: "panel", clip: true, d: "M20,44 H62 V150 H20 Z" },
    { zone: "fr_fender", kind: "panel", clip: true, d: "M158,44 H200 V150 H158 Z" },
    { zone: "fl_door", kind: "panel", clip: true, d: "M20,150 H66 V236 H20 Z" },
    { zone: "rl_door", kind: "panel", clip: true, d: "M20,236 H66 V318 H20 Z" },
    { zone: "fr_door", kind: "panel", clip: true, d: "M154,150 H200 V236 H154 Z" },
    { zone: "rr_door", kind: "panel", clip: true, d: "M154,236 H200 V318 H154 Z" },
    { zone: "rl_quarter", kind: "panel", clip: true, d: "M20,318 H66 V412 H20 Z" },
    { zone: "rr_quarter", kind: "panel", clip: true, d: "M154,318 H200 V412 H154 Z" },
    { zone: "trunk", kind: "panel", clip: true, d: "M66,338 H154 V412 H66 Z" },
    { zone: "rear_bumper", kind: "panel", clip: true, d: "M20,412 H200 V460 H20 Z" },
    { zone: "roof", kind: "panel", d: "M78,198 C96,194 124,194 142,198 L144,300 C124,304 96,304 76,300 Z" },
    { zone: "windshield", kind: "glass", d: "M68,154 C94,146 126,146 152,154 L142,198 C122,194 98,194 78,198 Z" },
    { zone: "rear_window", kind: "glass", d: "M76,300 C96,304 124,304 144,300 L152,336 C126,342 94,342 68,336 Z" },
    { zone: "grille", kind: "grille", d: "M86,22 C100,19 120,19 134,22 L132,36 H88 Z" },
    { zone: "fl_light", kind: "light", d: "M44,46 C48,34 58,26 72,22 L80,26 L74,44 C62,46 52,50 44,54 Z" },
    { zone: "fr_light", kind: "light", d: mx("M44,46 C48,34 58,26 72,22 L80,26 L74,44 C62,46 52,50 44,54 Z") },
    { zone: "rl_light", kind: "tail", d: "M40,404 C50,412 60,418 74,424 L76,438 C60,436 48,428 40,418 Z" },
    { zone: "rr_light", kind: "tail", d: mx("M40,404 C50,412 60,418 74,424 L76,438 C60,436 48,428 40,418 Z") },
    { zone: "l_mirror", kind: "trim", d: "M14,160 C18,154 26,152 34,154 L35,170 C28,172 20,172 15,170 Z" },
    { zone: "r_mirror", kind: "trim", d: mx("M14,160 C18,154 26,152 34,154 L35,170 C28,172 20,172 15,170 Z") }
  ],
  deco:
    "M110,46 V146 M66,152 V318 M154,152 V318 M36,236 H66 M154,236 H184 M84,60 C100,56 120,56 136,60 M68,340 C94,346 126,346 152,340",
  labels: [
    { x: 110, y: -2, t: "PREDOK", a: "middle" },
    { x: 110, y: 484, t: "ZADOK", a: "middle" }
  ]
};

/* ───────── ĽAVÝ BOK (predok vľavo) ───────── */
const SIDE_BODY =
  "M22,176 C16,160 18,142 28,130 L62,118 C104,110 162,104 214,100 L278,60 C292,53 380,51 404,56 L472,92 C512,96 548,100 572,106 C590,112 598,128 598,150 L596,176 C594,186 586,190 576,190 L512,190 A48,48 0 0 0 416,190 L180,190 A48,48 0 0 0 84,190 L36,190 C28,190 24,186 22,176 Z";

export const VIEW_LEFT: View = {
  id: "left",
  label: "Ľavý bok",
  w: 620,
  h: 250,
  body: SIDE_BODY,
  parts: [
    { zone: "front_bumper", kind: "panel", clip: true, d: "M0,40 H68 V240 H0 Z" },
    { zone: "hood", kind: "panel", clip: true, d: "M68,40 H214 V121 L68,125 Z" },
    { zone: "fl_fender", kind: "panel", clip: true, d: "M68,125 L214,121 L210,196 H68 Z" },
    { zone: "fl_door", kind: "panel", clip: true, d: "M214,104 H332 V178 H210 Z" },
    { zone: "rl_door", kind: "panel", clip: true, d: "M332,104 H442 L440,178 H332 Z" },
    { zone: "rl_quarter", kind: "panel", clip: true, d: "M442,104 L474,96 H560 V196 H440 Z" },
    { zone: "trunk", kind: "panel", clip: true, d: "M474,40 H620 V110 L560,104 H474 Z" },
    { zone: "rear_bumper", kind: "panel", clip: true, d: "M560,104 L620,110 V240 H560 Z" },
    { zone: "roof", kind: "panel", clip: true, d: "M260,30 H420 V64 H260 Z" },
    { zone: "l_sill", kind: "trim", clip: true, d: "M180,178 H416 V194 H180 Z" },
    { zone: "windshield", kind: "glass", d: "M216,100 L278,62 L292,58 L236,101 Z" },
    { zone: "fl_window", kind: "glass", d: "M240,101 L294,63 C306,60 318,60 330,60 L330,101 Z" },
    { zone: "rl_window", kind: "glass", d: "M336,60 C356,59 378,59 396,60 L446,95 L336,101 Z" },
    { zone: "rear_window", kind: "glass", d: "M402,58 L470,92 L452,95 L398,61 Z" },
    { zone: "fl_light", kind: "light", d: "M26,132 L62,120 C68,120 72,124 72,130 L66,140 L32,146 Z" },
    { zone: "rl_light", kind: "tail", d: "M566,108 L594,116 C598,122 598,130 596,136 L570,132 Z" },
    { zone: "l_mirror", kind: "trim", d: "M226,98 C230,90 242,88 252,90 L254,104 L232,106 Z" }
  ],
  wheels: [
    { zone: "fl_wheel", cx: 132, cy: 190, r: 40 },
    { zone: "rl_wheel", cx: 464, cy: 190, r: 40 }
  ],
  deco:
    "M214,102 L472,94 M332,104 V178 M442,104 L440,178 M214,104 L210,178 M300,118 h18 M406,118 h18 M40,168 H70 M570,168 H592",
  labels: [
    { x: 16, y: 18, t: "◄ PREDOK", a: "start" },
    { x: 604, y: 18, t: "ZADOK", a: "end" }
  ]
};

/** Pravý bok = zrkadlový ľavý bok s pravými zónami. */
const L2R: Record<string, string> = {
  fl_fender: "fr_fender", fl_door: "fr_door", rl_door: "rr_door", rl_quarter: "rr_quarter",
  l_sill: "r_sill", fl_window: "fr_window", rl_window: "rr_window", fl_light: "fr_light",
  rl_light: "rr_light", l_mirror: "r_mirror", fl_wheel: "fr_wheel", rl_wheel: "rr_wheel"
};
export const VIEW_RIGHT: View = {
  ...VIEW_LEFT,
  id: "right",
  label: "Pravý bok",
  mirror: true,
  parts: VIEW_LEFT.parts.map((p) => ({ ...p, zone: p.zone ? L2R[p.zone] || p.zone : undefined })),
  wheels: VIEW_LEFT.wheels!.map((w) => ({ ...w, zone: L2R[w.zone] || w.zone })),
  labels: [
    { x: 16, y: 18, t: "ZADOK", a: "start" },
    { x: 604, y: 18, t: "PREDOK ►", a: "end" }
  ]
};

/* ───────── PREDOK (ľavá strana auta je vpravo) ───────── */
const FRONT_BODY =
  "M40,198 L36,146 C36,126 46,112 64,106 L92,64 C100,52 112,48 124,48 L196,48 C208,48 220,52 228,64 L256,106 C274,112 284,126 284,146 L280,198 C280,206 276,210 268,210 L52,210 C44,210 40,206 40,198 Z";
const m320 = (d: string) => mx(d, 320);

export const VIEW_FRONT: View = {
  id: "front",
  label: "Predok",
  w: 320,
  h: 250,
  body: FRONT_BODY,
  under: [
    { zone: "fr_wheel", kind: "tire", d: "M46,196 h36 v36 h-36 Z" },
    { zone: "fl_wheel", kind: "tire", d: "M238,196 h36 v36 h-36 Z" }
  ],
  parts: [
    { zone: "hood", kind: "panel", clip: true, d: "M30,104 H290 V136 H30 Z" },
    { zone: "front_bumper", kind: "panel", clip: true, d: "M30,136 H290 V220 H30 Z" },
    { zone: "roof", kind: "panel", clip: true, d: "M100,40 H220 V62 H100 Z" },
    { zone: "windshield", kind: "glass", d: "M100,64 C140,60 180,60 220,64 L246,102 C190,98 130,98 74,102 Z" },
    { zone: "grille", kind: "grille", d: "M118,142 H202 C206,142 208,146 208,150 V166 C208,170 206,172 202,172 H118 C114,172 112,170 112,166 V150 C112,146 114,142 118,142 Z" },
    { zone: "fr_light", kind: "light", d: "M46,130 C66,132 88,136 106,140 L104,156 C84,156 64,154 48,150 Z" },
    { zone: "fl_light", kind: "light", d: m320("M46,130 C66,132 88,136 106,140 L104,156 C84,156 64,154 48,150 Z") },
    { zone: "r_mirror", kind: "trim", d: "M20,96 C26,90 38,90 48,94 L52,108 L24,112 Z" },
    { zone: "l_mirror", kind: "trim", d: m320("M20,96 C26,90 38,90 48,94 L52,108 L24,112 Z") }
  ],
  deco: "M120,150 H200 M120,158 H200 M120,166 H200 M60,186 H112 M208,186 H260 M130,190 H190 V202 H130 Z",
  labels: [
    { x: 14, y: 20, t: "PRAVÁ STRANA", a: "start" },
    { x: 306, y: 20, t: "ĽAVÁ STRANA", a: "end" }
  ]
};

/* ───────── ZADOK (ľavá strana auta je vľavo) ───────── */
export const VIEW_REAR: View = {
  id: "rear",
  label: "Zadok",
  w: 320,
  h: 250,
  body: FRONT_BODY,
  under: [
    { zone: "rl_wheel", kind: "tire", d: "M46,196 h36 v36 h-36 Z" },
    { zone: "rr_wheel", kind: "tire", d: "M238,196 h36 v36 h-36 Z" }
  ],
  parts: [
    { zone: "trunk", kind: "panel", clip: true, d: "M30,102 H290 V150 H30 Z" },
    { zone: "rear_bumper", kind: "panel", clip: true, d: "M30,150 H290 V220 H30 Z" },
    { zone: "roof", kind: "panel", clip: true, d: "M100,40 H220 V62 H100 Z" },
    { zone: "rear_window", kind: "glass", d: "M104,64 C140,60 180,60 216,64 L238,100 C186,96 134,96 82,100 Z" },
    { zone: "rl_light", kind: "tail", d: "M42,116 C62,118 86,120 106,124 L106,140 C84,140 62,138 44,134 Z" },
    { zone: "rr_light", kind: "tail", d: m320("M42,116 C62,118 86,120 106,124 L106,140 C84,140 62,138 44,134 Z") },
    { zone: "l_mirror", kind: "trim", d: "M20,96 C26,90 38,90 48,94 L52,108 L24,112 Z" },
    { zone: "r_mirror", kind: "trim", d: m320("M20,96 C26,90 38,90 48,94 L52,108 L24,112 Z") }
  ],
  deco: "M106,132 H214 M126,160 H194 V180 H126 Z M70,196 a8,6 0 1,0 16,0 a8,6 0 1,0 -16,0 M234,196 a8,6 0 1,0 16,0 a8,6 0 1,0 -16,0",
  labels: [
    { x: 14, y: 20, t: "ĽAVÁ STRANA", a: "start" },
    { x: 306, y: 20, t: "PRAVÁ STRANA", a: "end" }
  ]
};

export const VIEWS: View[] = [VIEW_TOP, VIEW_LEFT, VIEW_RIGHT, VIEW_FRONT, VIEW_REAR];

export function viewZones(v: View) {
  return new Set([...(v.under || []), ...v.parts].map((p) => p.zone).concat((v.wheels || []).map((w) => w.zone)).filter(Boolean) as string[]);
}
