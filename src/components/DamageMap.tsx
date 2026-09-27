"use client";
import { useId, useMemo, useState } from "react";
import type { DamageZone, Severity } from "@/lib/types";
import { DAMAGE_FLAGS, SEVERITY, damageLabel, isBodyZone, sevRank } from "@/lib/damage";
import { VIEWS, viewZones, type Part, type View } from "@/lib/damageViews";

/* ───────── Jeden nákres ───────── */
function CarView({
  view,
  sev,
  selected,
  onPick,
  small = false
}: {
  view: View;
  sev: (id: string) => Severity | null;
  selected?: string | null;
  onPick?: (id: string) => void;
  small?: boolean;
}) {
  const uid = useId().replace(/[:«»]/g, "");
  const clip = `b-${uid}`;
  const dmgFill = (id?: string) => (id && sev(id) ? SEVERITY[sev(id)!].color : null);
  const edit = !!onPick;
  const cls = (id?: string) => ["dz", edit && id ? "dz-edit" : "", id && selected === id ? "dz-sel" : ""].join(" ");
  const click = (id?: string) => (edit && id ? () => onPick!(id) : undefined);

  const baseFill = (p: Part) =>
    p.kind === "glass" ? `url(#glass-${uid})` : p.kind === "light" ? `url(#light-${uid})` : p.kind === "tail" ? `url(#tail-${uid})` : p.kind === "grille" ? "#0b0c0f" : p.kind === "tire" ? "#0a0a0b" : p.kind === "trim" ? "#1b1c21" : "transparent";

  const renderPart = (p: Part, i: number) => {
    const f = dmgFill(p.zone);
    const heavy = p.zone && sev(p.zone) === "heavy";
    return (
      <path
        key={(p.zone || "x") + i}
        d={p.d}
        className={cls(p.zone)}
        fill={f ?? baseFill(p)}
        fillOpacity={f ? 0.9 : 1}
        stroke={p.kind === "panel" ? "rgba(0,0,0,.55)" : "rgba(255,255,255,.28)"}
        strokeWidth={p.kind === "panel" ? 1.2 : 1}
        filter={heavy ? `url(#glow-${uid})` : undefined}
        onClick={click(p.zone)}
        aria-label={p.zone ? damageLabel(p.zone) : undefined}
      />
    );
  };

  const inner = (
    <>
      {(view.under || []).map(renderPart)}
      <path d={view.body} fill={`url(#paint-${uid})`} />
      <g clipPath={`url(#${clip})`}>{view.parts.filter((p) => p.clip).map(renderPart)}</g>
      {/* lesk karosérie */}
      <path d={view.body} fill={`url(#sheen-${uid})`} pointerEvents="none" />
      {view.parts.filter((p) => !p.clip).map(renderPart)}
      {(view.wheels || []).map((w) => {
        const f = dmgFill(w.zone);
        return (
          <g key={w.zone} className={cls(w.zone)} onClick={click(w.zone)} aria-label={damageLabel(w.zone)}>
            <circle cx={w.cx} cy={w.cy} r={w.r} fill={f ?? "#0a0a0b"} fillOpacity={f ? 0.9 : 1} stroke="rgba(255,255,255,.25)" strokeWidth="1.5" />
            <circle cx={w.cx} cy={w.cy} r={w.r * 0.62} fill={`url(#rim-${uid})`} stroke="rgba(255,255,255,.35)" strokeWidth="1" pointerEvents="none" />
            {Array.from({ length: 5 }, (_, k) => {
              const a = (k * 72 * Math.PI) / 180;
              return <line key={k} x1={w.cx} y1={w.cy} x2={w.cx + Math.cos(a) * w.r * 0.58} y2={w.cy + Math.sin(a) * w.r * 0.58} stroke="rgba(0,0,0,.55)" strokeWidth={w.r * 0.12} strokeLinecap="round" pointerEvents="none" />;
            })}
            <circle cx={w.cx} cy={w.cy} r={w.r * 0.14} fill="#c8102e" pointerEvents="none" />
          </g>
        );
      })}
      <path d={view.body} fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="1.8" pointerEvents="none" />
      <path d={view.deco} fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="1.2" pointerEvents="none" />
    </>
  );

  const pad = 26;
  return (
    <svg viewBox={`-10 ${-pad} ${view.w + 20} ${view.h + pad + 10}`} className={small ? "dv-svg small" : "dv-svg"} role="img" aria-label={`Nákres auta – ${view.label}`}>
      <defs>
        <clipPath id={clip}><path d={view.body} /></clipPath>
        <linearGradient id={`paint-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a3d46" />
          <stop offset=".45" stopColor="#23252c" />
          <stop offset="1" stopColor="#121317" />
        </linearGradient>
        <linearGradient id={`sheen-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".10" />
          <stop offset=".35" stopColor="#fff" stopOpacity="0" />
          <stop offset=".7" stopColor="#fff" stopOpacity=".04" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`glass-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b5366" />
          <stop offset=".5" stopColor="#152029" />
          <stop offset="1" stopColor="#0b1117" />
        </linearGradient>
        <linearGradient id={`light-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#e8eef5" />
          <stop offset="1" stopColor="#7d8894" />
        </linearGradient>
        <linearGradient id={`tail-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ff2e35" />
          <stop offset="1" stopColor="#6d0714" />
        </linearGradient>
        <radialGradient id={`rim-${uid}`}>
          <stop offset="0" stopColor="#9aa1ad" />
          <stop offset="1" stopColor="#3a3e47" />
        </radialGradient>
        <filter id={`glow-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {view.labels.map((l) => (
        <text key={l.t} x={l.x} y={l.y - (view.id === "top" ? 12 : 12)} textAnchor={l.a || "middle"} fill="rgba(255,255,255,.45)" fontSize={view.id === "top" ? 11 : 12} fontWeight="700" letterSpacing="2">{l.t}</text>
      ))}
      {view.mirror ? <g transform={`translate(${view.w},0) scale(-1,1)`}>{inner}</g> : inner}
    </svg>
  );
}

/* ───────── Mapa poškodenia (zobrazenie + editor) ───────── */
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
  const byId = useMemo(() => new Map(zones.map((z) => [z.zone, z])), [zones]);
  const sev = (id: string) => byId.get(id)?.severity ?? null;
  const counts = useMemo(() => VIEWS.map((v) => { const s = viewZones(v); return zones.filter((z) => s.has(z.zone)).length; }), [zones]);
  const firstWithDamage = counts.findIndex((c) => c > 0);
  const [vi, setVi] = useState(edit ? 0 : Math.max(0, firstWithDamage));
  const [sel, setSel] = useState<string | null>(null);
  const view = VIEWS[vi];

  const setZone = (id: string, patch: Partial<DamageZone> | null) => {
    if (!onChange) return;
    const rest = zones.filter((z) => z.zone !== id);
    if (!patch) return onChange(rest);
    const cur = byId.get(id);
    onChange([...rest, { zone: id, severity: patch.severity ?? cur?.severity ?? "medium", note: patch.note ?? cur?.note ?? "" }]);
  };

  const body = [...zones].filter((z) => isBodyZone(z.zone)).sort((a, b) => sevRank(b.severity) - sevRank(a.severity));
  const flags = zones.filter((z) => !isBodyZone(z.zone));
  const selZone = sel ? byId.get(sel) : null;

  return (
    <div className={`dmg2${edit ? " edit" : ""}`}>
      <div className="dv-tabs" role="tablist" aria-label="Pohľad na auto">
        {VIEWS.map((v, i) => (
          <button key={v.id} type="button" role="tab" aria-selected={vi === i} className={`dv-tab${vi === i ? " on" : ""}`} onClick={() => setVi(i)}>
            {v.label}{counts[i] > 0 && <span className="dv-count">{counts[i]}</span>}
          </button>
        ))}
      </div>

      <div className="dv-grid">
        <div className="dv-stage">
          <CarView view={view} sev={sev} selected={sel} onPick={edit ? (id) => setSel(id) : undefined} />
          <div className="dmg-legend" aria-hidden="true">
            {(Object.keys(SEVERITY) as Severity[]).map((k) => (
              <span key={k}><i style={{ background: SEVERITY[k].color }} />{SEVERITY[k].label}</span>
            ))}
            <span><i style={{ background: "#2a2c33", border: "1px solid rgba(255,255,255,.3)" }} />Bez poškodenia</span>
          </div>
          <div className="dv-thumbs" aria-hidden="true">
            {VIEWS.map((v, i) => (
              <button type="button" key={v.id} className={`dv-thumb${vi === i ? " on" : ""}`} onClick={() => setVi(i)} tabIndex={-1}>
                <CarView view={v} sev={sev} small />
              </button>
            ))}
          </div>
        </div>

        <div className="dv-side">
          {edit && (
            <div className="dv-editor">
              {sel ? (
                <>
                  <div className="lbl-sm">Vybraná časť</div>
                  <b className="dv-selname">{damageLabel(sel)}</b>
                  <div className="dv-sevbtns">
                    {(Object.keys(SEVERITY) as Severity[]).map((k) => (
                      <button type="button" key={k} className={`dv-sev${selZone?.severity === k ? " on" : ""}`} style={{ "--c": SEVERITY[k].color } as React.CSSProperties} onClick={() => setZone(sel, { severity: k })}>
                        {SEVERITY[k].label}
                      </button>
                    ))}
                    <button type="button" className="dv-sev clear" onClick={() => setZone(sel, null)}>Bez poškodenia</button>
                  </div>
                  {selZone && (
                    <input className="input" placeholder="Poznámka (napr. prasknutý kryt, treba vymeniť)" value={selZone.note || ""} onChange={(e) => setZone(sel, { note: e.target.value })} />
                  )}
                </>
              ) : (
                <p className="note" style={{ margin: 0 }}>Kliknite na časť auta v nákrese a nastavte rozsah poškodenia a poznámku. Pohľady prepínate hore.</p>
              )}
            </div>
          )}

          {showList && (
            body.length ? (
              <ul className="dmg-list">
                {body.map((z) => (
                  <li key={z.zone} className={sel === z.zone ? "on" : ""} onClick={edit ? () => setSel(z.zone) : undefined}>
                    <span>
                      {damageLabel(z.zone)}
                      {z.note ? <small>{z.note}</small> : null}
                    </span>
                    <b style={{ color: SEVERITY[z.severity].color }}>{SEVERITY[z.severity].label}</b>
                  </li>
                ))}
              </ul>
            ) : !edit ? <p className="note" style={{ marginTop: 0 }}>Na karosérii nie je vyznačené poškodenie.</p> : null
          )}

          {(edit || flags.length > 0) && (
            <>
              <div className="lbl-sm" style={{ marginTop: 16 }}>{edit ? "Ďalšie poškodenia (klikni pre zmenu)" : "Ďalšie poškodenia"}</div>
              <div className="flags">
                {(edit ? DAMAGE_FLAGS : DAMAGE_FLAGS.filter((f) => byId.has(f.id))).map((f) => {
                  const s = sev(f.id);
                  const st = s ? { borderColor: SEVERITY[s].color, color: SEVERITY[s].color } : undefined;
                  return edit ? (
                    <button type="button" key={f.id} className={`flag${sel === f.id ? " sel" : ""}`} style={st} onClick={() => { if (!s) setZone(f.id, { severity: "medium" }); setSel(f.id); }}>
                      {f.label}{s ? ` · ${SEVERITY[s].label}` : ""}
                    </button>
                  ) : (
                    <span key={f.id} className="flag" style={st} title={byId.get(f.id)?.note || undefined}>
                      {f.label} · {SEVERITY[s!].label}{byId.get(f.id)?.note ? ` – ${byId.get(f.id)!.note}` : ""}
                    </span>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
