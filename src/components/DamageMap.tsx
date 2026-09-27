"use client";
import type { DamageZone, Severity } from "@/lib/types";
import { DAMAGE_FLAGS, DAMAGE_ZONES, SEVERITY, SEVERITY_ORDER, damageLabel } from "@/lib/damage";

const BODY = "M60,12 Q100,2 140,12 Q176,20 178,62 L180,358 Q178,400 140,408 Q100,416 60,408 Q22,400 20,358 L22,62 Q24,20 60,12 Z";

/** Geometria zón na nákrese zhora (predok hore). */
const SHAPES: Record<string, { d: string; clip?: boolean }> = {
  front_bumper: { d: "M18,4 H182 V38 H18 Z", clip: true },
  hood: { d: "M50,38 H150 V118 H50 Z", clip: true },
  fl_fender: { d: "M18,38 H50 V118 H18 Z", clip: true },
  fr_fender: { d: "M150,38 H182 V118 H150 Z", clip: true },
  windshield: { d: "M54,120 H146 L140,154 H60 Z" },
  roof: { d: "M60,156 H140 V262 H60 Z" },
  fl_door: { d: "M18,120 H52 V198 H18 Z", clip: true },
  rl_door: { d: "M18,200 H52 V276 H18 Z", clip: true },
  fr_door: { d: "M148,120 H182 V198 H148 Z", clip: true },
  rr_door: { d: "M148,200 H182 V276 H148 Z", clip: true },
  rear_window: { d: "M60,264 H140 L146,292 H54 Z" },
  rl_quarter: { d: "M18,278 H52 V370 H18 Z", clip: true },
  rr_quarter: { d: "M148,278 H182 V370 H148 Z", clip: true },
  trunk: { d: "M52,294 H148 V370 H52 Z", clip: true },
  rear_bumper: { d: "M18,370 H182 V420 H18 Z", clip: true },
  fl_wheel: { d: "M4,62 h14 a3,3 0 0 1 3,3 v38 a3,3 0 0 1 -3,3 h-14 a3,3 0 0 1 -3,-3 v-38 a3,3 0 0 1 3,-3 Z" },
  fr_wheel: { d: "M182,62 h14 a3,3 0 0 1 3,3 v38 a3,3 0 0 1 -3,3 h-14 a3,3 0 0 1 -3,-3 v-38 a3,3 0 0 1 3,-3 Z" },
  rl_wheel: { d: "M4,300 h14 a3,3 0 0 1 3,3 v38 a3,3 0 0 1 -3,3 h-14 a3,3 0 0 1 -3,-3 v-38 a3,3 0 0 1 3,-3 Z" },
  rr_wheel: { d: "M182,300 h14 a3,3 0 0 1 3,3 v38 a3,3 0 0 1 -3,3 h-14 a3,3 0 0 1 -3,-3 v-38 a3,3 0 0 1 3,-3 Z" }
};

const BASE = "#17181d";
const GLASS = "#0f1a22";

export function DamageMap({
  zones,
  onChange,
  showList = true
}: {
  zones: DamageZone[];
  onChange?: (z: DamageZone[]) => void;
  showList?: boolean;
}) {
  const edit = !!onChange;
  const sev = (id: string) => zones.find((z) => z.zone === id)?.severity ?? null;
  const cycle = (id: string) => {
    if (!onChange) return;
    const cur = sev(id);
    const next = SEVERITY_ORDER[(SEVERITY_ORDER.indexOf(cur) + 1) % SEVERITY_ORDER.length];
    const rest = zones.filter((z) => z.zone !== id);
    onChange(next ? [...rest, { zone: id, severity: next as Severity }] : rest);
  };
  const fill = (id: string, base = BASE) => {
    const s = sev(id);
    return s ? SEVERITY[s].color : base;
  };
  const ordered = [...zones].sort((a, b) => SEVERITY_ORDER.indexOf(b.severity) - SEVERITY_ORDER.indexOf(a.severity));
  const flags = DAMAGE_FLAGS.filter((f) => edit || sev(f.id));

  return (
    <div className={`dmg${edit ? " edit" : ""}`}>
      <svg viewBox="-4 -14 208 450" role="img" aria-label="Nákres auta zhora s vyznačeným poškodením">
        <defs>
          <clipPath id="dmg-body"><path d={BODY} /></clipPath>
          <filter id="dmg-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <text x="100" y="-3" textAnchor="middle" fill="rgba(255,255,255,.45)" fontSize="9" fontWeight="700" letterSpacing="2">PREDOK</text>
        <text x="100" y="432" textAnchor="middle" fill="rgba(255,255,255,.45)" fontSize="9" fontWeight="700" letterSpacing="2">ZADOK</text>
        {/* kolesá */}
        {["fl_wheel", "fr_wheel", "rl_wheel", "rr_wheel"].map((id) => (
          <path key={id} d={SHAPES[id].d} className="dmg-zone" fill={sev(id) ? fill(id) : "#0a0a0c"} stroke="rgba(255,255,255,.35)" strokeWidth="1.2" onClick={() => cycle(id)}>
            <title>{damageLabel(id)}{sev(id) ? ` – ${SEVERITY[sev(id)!].label}` : ""}</title>
          </path>
        ))}
        <path d={BODY} fill={BASE} />
        <g clipPath="url(#dmg-body)">
          {Object.entries(SHAPES).filter(([id]) => SHAPES[id].clip).map(([id, s]) => (
            <path key={id} d={s.d} className="dmg-zone" fill={fill(id)} stroke="#050505" strokeWidth="1.5" filter={sev(id) === "heavy" ? "url(#dmg-glow)" : undefined} onClick={() => cycle(id)}>
              <title>{damageLabel(id)}{sev(id) ? ` – ${SEVERITY[sev(id)!].label}` : ""}</title>
            </path>
          ))}
        </g>
        {["windshield", "roof", "rear_window"].map((id) => (
          <path key={id} d={SHAPES[id].d} className="dmg-zone" fill={fill(id, id === "roof" ? "#121318" : GLASS)} stroke="#050505" strokeWidth="1.5" onClick={() => cycle(id)}>
            <title>{damageLabel(id)}{sev(id) ? ` – ${SEVERITY[sev(id)!].label}` : ""}</title>
          </path>
        ))}
        {/* obrys a detaily */}
        <path d={BODY} fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="2" pointerEvents="none" />
        <g stroke="rgba(255,255,255,.18)" strokeWidth="1" fill="none" pointerEvents="none">
          <path d="M52,120 V276 M148,120 V276 M52,198 H60 M140,198 H148" />
          <path d="M18,128 l-10,6 v8 l10,2 M182,128 l10,6 v8 l-10,2" stroke="rgba(255,255,255,.4)" />
        </g>
        <rect x="28" y="16" width="22" height="7" rx="3" fill="rgba(255,255,255,.7)" pointerEvents="none" />
        <rect x="150" y="16" width="22" height="7" rx="3" fill="rgba(255,255,255,.7)" pointerEvents="none" />
        <rect x="26" y="396" width="24" height="6" rx="2" fill="#c8102e" pointerEvents="none" />
        <rect x="150" y="396" width="24" height="6" rx="2" fill="#c8102e" pointerEvents="none" />
      </svg>

      <div>
        <div className="dmg-legend" aria-hidden="true">
          {(Object.keys(SEVERITY) as Severity[]).map((k) => (
            <span key={k}><i style={{ background: SEVERITY[k].color }} />{SEVERITY[k].label}</span>
          ))}
          <span><i style={{ background: BASE, border: "1px solid rgba(255,255,255,.3)" }} />Bez poškodenia</span>
        </div>
        {edit && <p className="note" style={{ marginTop: 0, marginBottom: 12 }}>Kliknite na časť auta: ľahké → stredné → ťažké → bez poškodenia.</p>}
        {showList && (
          ordered.filter((z) => DAMAGE_ZONES.some((d) => d.id === z.zone)).length > 0 ? (
            <ul className="dmg-list">
              {ordered.filter((z) => DAMAGE_ZONES.some((d) => d.id === z.zone)).map((z) => (
                <li key={z.zone}><span>{damageLabel(z.zone)}</span><b style={{ color: SEVERITY[z.severity].color }}>{SEVERITY[z.severity].label}</b></li>
              ))}
            </ul>
          ) : !edit ? <p className="note" style={{ marginTop: 0 }}>Na karosérii nie je vyznačené poškodenie.</p> : null
        )}
        {flags.length > 0 && (
          <>
            <div className="lbl-sm" style={{ marginTop: 16 }}>{edit ? "Ďalšie poškodenia (klikni)" : "Ďalšie poškodenia"}</div>
            <div className="flags">
              {flags.map((f) => {
                const s = sev(f.id);
                return edit ? (
                  <button type="button" key={f.id} className="flag" onClick={() => cycle(f.id)} style={s ? { borderColor: SEVERITY[s].color, color: SEVERITY[s].color } : undefined}>
                    {f.label}{s ? ` · ${SEVERITY[s].label}` : ""}
                  </button>
                ) : (
                  <span key={f.id} className="flag" style={{ borderColor: SEVERITY[s!].color, color: SEVERITY[s!].color }}>{f.label} · {SEVERITY[s!].label}</span>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
