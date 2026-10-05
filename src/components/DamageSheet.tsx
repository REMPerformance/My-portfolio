import type { DamageZone, Severity } from "@/lib/types";
import { SEVERITY, damageLabel, isBodyZone, sevRank } from "@/lib/damage";

/* Nákres auta zhora pre zákazníka: svetlý technický výkres, poškodené diely sú zafarbené a očíslované,
   čísla zodpovedajú zoznamu pod nákresom. Kreslí sa v súradniciach 220 × 480 (predok hore) a otočí sa na šírku. */

const BODY = "M70,18 C88,10 132,10 150,18 C170,26 182,40 184,70 L187,122 C189,142 187,160 185,180 L185,300 C187,320 189,338 187,358 L184,402 C182,428 168,442 150,447 C130,452 90,452 70,447 C52,442 38,428 36,402 L33,358 C31,338 33,320 35,300 L35,180 C33,160 31,142 33,122 L36,70 C38,40 50,26 70,18 Z";
const mx = (d: string) => d.replace(/([MLHVCQ ,])(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_m, p, x, y) => `${p}${220 - Number(x)},${y}`);

type P = { zone: string; d: string; kind?: "glass" | "light" | "tail" | "dark" };
/** diely orezané obrysom karosérie */
const PANELS: P[] = [
  { zone: "front_bumper", d: "M0,0 L220,0 L220,46 Q110,30 0,46 Z" },
  { zone: "fl_fender", d: "M0,46 Q34,40 64,50 L60,150 L0,150 Z" },
  { zone: "fr_fender", d: mx("M0,46 Q34,40 64,50 L60,150 L0,150 Z") },
  { zone: "hood", d: "M64,50 Q110,36 156,50 L160,150 Q110,138 60,150 Z" },
  { zone: "fl_door", d: "M0,150 L67,150 L67,236 L0,236 Z" },
  { zone: "rl_door", d: "M0,236 L67,236 L67,318 L0,318 Z" },
  { zone: "fr_door", d: mx("M0,150 L67,150 L67,236 L0,236 Z") },
  { zone: "rr_door", d: mx("M0,236 L67,236 L67,318 L0,318 Z") },
  { zone: "rl_quarter", d: "M0,318 L67,318 L62,410 Q30,418 0,414 Z" },
  { zone: "rr_quarter", d: mx("M0,318 L67,318 L62,410 Q30,418 0,414 Z") },
  { zone: "trunk", d: "M67,338 Q110,348 153,338 L158,410 Q110,424 62,410 Z" },
  { zone: "rear_bumper", d: "M0,414 Q30,418 62,410 Q110,424 158,410 Q190,418 220,414 L220,480 L0,480 Z" }
];
/** diely kreslené voľne nad karosériou */
const PARTS: P[] = [
  { zone: "windshield", kind: "glass", d: "M68,156 C94,146 126,146 152,156 L142,198 C122,193 98,193 78,198 Z" },
  { zone: "roof", d: "M78,198 C98,193 122,193 142,198 L144,300 C124,305 96,305 76,300 Z" },
  { zone: "rear_window", kind: "glass", d: "M76,300 C96,305 124,305 144,300 L152,334 C126,342 94,342 68,334 Z" },
  { zone: "fl_window", kind: "glass", d: "M66,164 L75,201 L74,247 L66,247 Z" },
  { zone: "rl_window", kind: "glass", d: "M66,251 L74,251 L73,297 L66,326 Z" },
  { zone: "fr_window", kind: "glass", d: mx("M66,164 L75,201 L74,247 L66,247 Z") },
  { zone: "rr_window", kind: "glass", d: mx("M66,251 L74,251 L73,297 L66,326 Z") },
  { zone: "grille", kind: "dark", d: "M88,21 C101,18 119,18 132,21 L130,31 H90 Z" },
  { zone: "fl_light", kind: "light", d: "M45,45 C49,34 58,27 71,23 L79,27 L74,41 C62,43 53,46 45,51 Z" },
  { zone: "fr_light", kind: "light", d: mx("M45,45 C49,34 58,27 71,23 L79,27 L74,41 C62,43 53,46 45,51 Z") },
  { zone: "rl_light", kind: "tail", d: "M41,408 C50,415 60,420 73,425 L75,437 C60,435 49,428 41,419 Z" },
  { zone: "rr_light", kind: "tail", d: mx("M41,408 C50,415 60,420 73,425 L75,437 C60,435 49,428 41,419 Z") }
];
const MIRRORS: P[] = [
  { zone: "l_mirror", d: "M16,160 C20,154 27,152 35,154 L36,169 C29,172 21,172 17,170 Z" },
  { zone: "r_mirror", d: mx("M16,160 C20,154 27,152 35,154 L36,169 C29,172 21,172 17,170 Z") }
];
const WHEELS: { zone: string; x: number; y: number }[] = [
  { zone: "fl_wheel", x: 22, y: 76 }, { zone: "fr_wheel", x: 182, y: 76 }, { zone: "rl_wheel", x: 22, y: 318 }, { zone: "rr_wheel", x: 182, y: 318 }
];
/** kam patrí číslo dielu */
const PIN: Record<string, [number, number]> = {
  front_bumper: [142, 24], grille: [110, 27], fl_light: [60, 37], fr_light: [160, 37], hood: [110, 96],
  fl_fender: [47, 100], fr_fender: [173, 100], windshield: [110, 174], roof: [110, 248], rear_window: [110, 321],
  fl_door: [50, 193], rl_door: [50, 278], fr_door: [170, 193], rr_door: [170, 278],
  fl_window: [70, 212], rl_window: [70, 280], fr_window: [150, 212], rr_window: [150, 280],
  l_sill: [37, 236], r_sill: [183, 236], l_mirror: [24, 162], r_mirror: [196, 162],
  rl_quarter: [48, 366], rr_quarter: [172, 366], trunk: [110, 380], rear_bumper: [110, 437],
  rl_light: [58, 423], rr_light: [162, 423], fl_wheel: [27, 107], fr_wheel: [193, 107], rl_wheel: [27, 349], rr_wheel: [193, 349]
};
const ROT = "matrix(0,-1,1,0,0,220)";
const rot = ([x, y]: [number, number]): [number, number] => [y, 220 - x];

export function DamageSheet({ zones }: { zones: DamageZone[] }) {
  const sorted = [...zones].sort((a, b) => sevRank(b.severity) - sevRank(a.severity));
  const body = sorted.filter((z) => isBodyZone(z.zone));
  const other = sorted.filter((z) => !isBodyZone(z.zone));
  const num = new Map(body.map((z, i) => [z.zone, i + 1]));
  const sevOf = new Map(zones.map((z) => [z.zone, z.severity]));
  const color = (id: string) => { const s = sevOf.get(id); return s ? SEVERITY[s].color : null; };
  const base = (p: P) => (p.kind === "glass" ? "#dbe4ec" : p.kind === "light" ? "#f3f5f8" : p.kind === "tail" ? "#f1c9cf" : p.kind === "dark" ? "#3c4049" : "transparent");
  const draw = (p: P) => {
    const c = color(p.zone);
    return <path key={p.zone} d={p.d} fill={c ?? base(p)} fillOpacity={c ? 0.42 : 1} stroke={c ?? "#b9bec8"} strokeWidth={c ? 1.8 : 1} strokeLinejoin="round" />;
  };
  const total = zones.length;

  return (
    <div className="ds">
      {total > 0 && (
        <div className="ds-head">
          <b>{total} {total === 1 ? "poškodená časť" : total < 5 ? "poškodené časti" : "poškodených častí"}</b>
          <div className="ds-legend">
            {(Object.keys(SEVERITY) as Severity[]).map((k) => {
              const n = zones.filter((z) => z.severity === k).length;
              return n ? <span key={k}><i style={{ background: SEVERITY[k].color }} />{n}× {SEVERITY[k].label.toLowerCase()}</span> : null;
            })}
          </div>
        </div>
      )}
      <div className="ds-stage">
        <svg viewBox="-16 -26 512 272" role="img" aria-label={total ? `Nákres auta zhora s vyznačeným poškodením: ${body.map((z) => damageLabel(z.zone)).join(", ")}` : "Nákres auta zhora"}>
          <defs><clipPath id="ds-body"><path d={BODY} /></clipPath></defs>
          <text x="0" y="-10" className="ds-t" textAnchor="start">← PREDOK</text>
          <text x="480" y="-10" className="ds-t" textAnchor="end">ZADOK →</text>
          <text x="240" y="-10" className="ds-t ds-t--dim" textAnchor="middle">PRAVÁ STRANA</text>
          <text x="240" y="240" className="ds-t ds-t--dim" textAnchor="middle">ĽAVÁ STRANA</text>
          <g transform={ROT}>
            {WHEELS.map((w) => { const c = color(w.zone); return <rect key={w.zone} x={w.x} y={w.y} width="16" height="62" rx="5" fill={c ?? "#3c4049"} fillOpacity={c ? 0.85 : 1} stroke={c ?? "none"} strokeWidth="1.5" />; })}
            {MIRRORS.map((p) => { const c = color(p.zone); return <path key={p.zone} d={p.d} fill={c ?? "#eceef2"} fillOpacity={c ? 0.6 : 1} stroke={c ?? "#9aa0ab"} strokeWidth="1.2" />; })}
            <path d={BODY} fill="#fbfbfc" />
            <g clipPath="url(#ds-body)">{PANELS.map(draw)}</g>
            {PARTS.map(draw)}
            <path d={BODY} fill="none" stroke="#6f7682" strokeWidth="2" strokeLinejoin="round" />
          </g>
          {body.map((z) => {
            const p = PIN[z.zone];
            if (!p) return null;
            const [x, y] = rot(p);
            const n = num.get(z.zone)!;
            return (
              <g key={z.zone}>
                <circle cx={x} cy={y} r="11.5" fill={SEVERITY[z.severity].color} stroke="#fff" strokeWidth="2.5" />
                <text x={x} y={y + 4} textAnchor="middle" className="ds-n" fill={z.severity === "light" ? "#3b2a00" : "#fff"}>{n}</text>
              </g>
            );
          })}
        </svg>
      </div>

      {body.length > 0 && (
        <ol className="ds-list">
          {body.map((z) => (
            <li key={z.zone}>
              <i style={{ background: SEVERITY[z.severity].color, color: z.severity === "light" ? "#3b2a00" : "#fff" }}>{num.get(z.zone)}</i>
              <span>{damageLabel(z.zone)}{z.note && !/^(podľa inzerátu|z poznámky predajcu)$/i.test(z.note) ? <small>{z.note}</small> : null}</span>
              <em style={{ color: SEVERITY[z.severity].color }}>{SEVERITY[z.severity].label}</em>
            </li>
          ))}
        </ol>
      )}
      {other.length > 0 && (
        <>
          <div className="ds-sub">Mechanika a ostatné</div>
          <ul className="ds-list ds-list--other">
            {other.map((z) => (
              <li key={z.zone}>
                <i className="dot" style={{ background: SEVERITY[z.severity].color }} />
                <span>{damageLabel(z.zone)}{z.note && !/^(podľa inzerátu|z poznámky predajcu)$/i.test(z.note) ? <small>{z.note}</small> : null}</span>
                <em style={{ color: SEVERITY[z.severity].color }}>{SEVERITY[z.severity].label}</em>
              </li>
            ))}
          </ul>
        </>
      )}
      {total === 0 && <p className="ds-empty">Poškodenie zatiaľ nie je na nákrese vyznačené. Pozrite si fotky alebo sa nás opýtajte, pošleme Vám podrobnosti.</p>}
    </div>
  );
}
