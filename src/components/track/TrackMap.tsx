"use client";
import { useEffect, useMemo, useRef } from "react";
import { TRACK_DOTS } from "@/lib/trackDots";
import { routeOf, splitRoute } from "@/lib/tracking";

const LON0 = -130, LAT1 = 72, STEP = 1.5, U = 4;
const X = (lon: number) => (lon - LON0) * U, Y = (lat: number) => (LAT1 - lat) * U;
type P = [number, number];
const pathOf = (pts: P[]) => "M" + pts.map((p) => `${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join("L");

let LAND = "";
function land() {
  if (LAND) return LAND;
  for (const row of TRACK_DOTS) {
    const r = row[0], y = Y(LAT1 - r * STEP), off = r % 2 ? STEP / 2 : 0;
    for (let i = 1; i < row.length; i += 2) for (let c = row[i]; c < row[i] + row[i + 1]; c++) LAND += `M${X(LON0 + off + c * STEP).toFixed(1)} ${y.toFixed(1)}h0`;
  }
  return LAND;
}

/** Bodová mapa s trasou lode: prejdená časť červenou, zostávajúca prerušovanou, značka na aktuálnej polohe. */
export function TrackMap({ from, to, sea, post, className, decorative }: { from: string; to: string; sea: number; post: number; className?: string; decorative?: boolean }) {
  const r = useMemo(() => routeOf(from, to), [from, to]);
  const ref = useRef<SVGSVGElement>(null);
  const all = [...r.sea, ...r.post];
  let w0 = Math.min(...all.map((p) => p[0])) - 11, w1 = Math.max(...all.map((p) => p[0])) + 11;
  let s0 = Math.min(...all.map((p) => p[1])) - 6, s1 = Math.max(...all.map((p) => p[1])) + 6;
  const A = 1.9;
  if ((w1 - w0) / (s1 - s0) > A) { const h = (w1 - w0) / A, m = (s0 + s1) / 2; s0 = m - h / 2; s1 = m + h / 2; }
  else { const w = (s1 - s0) * A, m = (w0 + w1) / 2; w0 = m - w / 2; w1 = m + w / 2; }
  if (s1 > 71) { s0 -= s1 - 71; s1 = 71; }
  const vb = [X(w0), Y(s1), (w1 - w0) * U, (s1 - s0) * U];
  const k = vb[2] / 560, fs = 11 * k;
  const onSea = post === 0 && sea > 0 && sea < 1;

  const labels: { ll: P; n: string; dx: number; dy: number }[] = [
    { ll: r.a.ll, n: r.a.n, dx: r.a.ll[0] > 60 ? 1 : 1, dy: -1 },
    { ll: r.b.ll, n: r.b.n, dx: -1, dy: -1 },
    { ll: r.post[r.post.length - 1], n: "Bratislava", dx: 1, dy: 1 }
  ];

  useEffect(() => {
    const svg = ref.current; if (!svg) return;
    const q = (id: string) => svg.querySelector<SVGPathElement>(`[data-k="${id}"]`)!;
    const mk = svg.querySelector<SVGGElement>("[data-k=mk]")!, shape = svg.querySelector<SVGGElement>("[data-k=shape]")!;
    const set = (t: number) => {
      let pos: P = r.sea[0], ang = 0;
      const legs: [string, P[], number][] = [["sea", r.sea, sea], ["post", r.post, post]];
      for (const [g, pts, f] of legs) {
        const tg = f * t, sp = splitRoute(pts, tg);
        q("D" + g).setAttribute("d", tg > 0 ? pathOf(sp.done as P[]) : "");
        q("L" + g).setAttribute("d", pathOf(tg > 0 ? (sp.left as P[]) : pts));
        if ((g === "sea" && post === 0) || (g === "post" && post > 0)) {
          pos = sp.pos; ang = (Math.atan2(Y(sp.b[1]) - Y(sp.a[1]), X(sp.b[0]) - X(sp.a[0])) * 180) / Math.PI;
        }
      }
      mk.setAttribute("transform", `translate(${X(pos[0]).toFixed(1)} ${Y(pos[1]).toFixed(1)})`);
      shape.setAttribute("transform", `rotate(${onSea ? ang.toFixed(1) : 0})`);
    };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { set(1); return; }
    let raf = 0; const t0 = performance.now(), D = 1900;
    const tick = (n: number) => { const x = Math.min(1, (n - t0) / D); set(1 - Math.pow(1 - x, 3)); if (x < 1) raf = requestAnimationFrame(tick); };
    set(0.0001); raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [r, sea, post, onSea]);

  return (
    <svg ref={ref} className={className} viewBox={vb.join(" ")} role={decorative ? undefined : "img"} aria-hidden={decorative || undefined} aria-label={decorative ? undefined : `Mapa trasy z prístavu ${r.a.n} do prístavu ${r.b.n} a na Slovensko`}>
      <path className="trk-land" d={land()} strokeWidth={3.4} />
      {(["sea", "post"] as const).map((g) => (
        <g key={g}>
          <path data-k={"L" + g} className="trk-left" strokeWidth={2.4 * k} strokeDasharray={`${5 * k} ${5 * k}`} />
          <path data-k={"D" + g} className="trk-done" strokeWidth={3 * k} />
        </g>
      ))}
      {labels.map((l) => {
        const x = X(l.ll[0]), y = Y(l.ll[1]), tw = l.n.length * fs * 0.62;
        let dx = l.dx;
        if (dx < 0 && x - 8 * k - tw < vb[0]) dx = 1;
        if (dx > 0 && x + 8 * k + tw > vb[0] + vb[2]) dx = -1;
        return (
          <g className="trk-port" key={l.n}>
            <circle cx={x} cy={y} r={3.2 * k} strokeWidth={1.4 * k} />
            <text x={x + dx * 8 * k} y={y + (l.dy > 0 ? 14 : -7) * k} fontSize={fs} strokeWidth={3 * k} textAnchor={dx < 0 ? "end" : "start"}>{l.n}</text>
          </g>
        );
      })}
      <g data-k="mk">
        <circle className="trk-ring" r={7 * k} />
        <g data-k="shape">
          {onSea
            ? <path className="trk-core" d={`M${8 * k} 0L${-6 * k} ${-5 * k}L${-3 * k} 0L${-6 * k} ${5 * k}Z`} strokeWidth={1.2 * k} />
            : <circle className="trk-core" r={4.4 * k} strokeWidth={1.6 * k} />}
        </g>
      </g>
    </svg>
  );
}
