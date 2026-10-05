/** Vlajky ako SVG – emoji vlajky sa na Windows zobrazujú len ako písmená (US, AE…). */
const star = (cx: number, cy: number, r: number, rot = 0) => {
  const p: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = ((i * 36 + rot - 90) * Math.PI) / 180, rr = i % 2 ? r * 0.382 : r;
    p.push(`${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`);
  }
  return p.join(" ");
};

function Body({ code }: { code: string }) {
  switch (code) {
    case "US":
      return (
        <>
          <rect width="30" height="20" fill="#fff" />
          {Array.from({ length: 7 }, (_, i) => <rect key={i} y={(i * 20) / 6.5} width="30" height={20 / 13} fill="#b22234" />)}
          <rect width="13" height={(20 / 13) * 7} fill="#3c3b6e" />
          {Array.from({ length: 20 }, (_, i) => <circle key={i} cx={1.4 + (i % 5) * 2.55} cy={1.4 + Math.floor(i / 5) * 2.5} r=".55" fill="#fff" />)}
        </>
      );
    case "AE":
      return (
        <>
          <rect width="30" height="20" fill="#fff" />
          <rect width="30" height="6.67" fill="#00732f" />
          <rect y="13.33" width="30" height="6.67" fill="#000" />
          <rect width="7.5" height="20" fill="#ff0000" />
        </>
      );
    case "CA":
      return (
        <>
          <rect width="30" height="20" fill="#fff" />
          <rect width="7.5" height="20" fill="#d80621" />
          <rect x="22.5" width="7.5" height="20" fill="#d80621" />
          <path d="M15 3.2l1.1 2.1 1.3-.5-.5 3.6 1.9-2 .5 1.1 2-.4-.7 2.2.9.5-3.2 2.6.4 1.2-3.2-.4.1 3.4h-1.2l.1-3.4-3.2.4.4-1.2-3.2-2.6.9-.5-.7-2.2 2 .4.5-1.1 1.9 2-.5-3.6 1.3.5z" fill="#d80621" />
        </>
      );
    case "KR":
      return (
        <>
          <rect width="30" height="20" fill="#fff" />
          <g transform="rotate(33.7 15 10)">
            <path d="M10 10a5 5 0 0 1 10 0z" fill="#cd2e3a" />
            <path d="M10 10a5 5 0 0 0 10 0z" fill="#0047a0" />
            <circle cx="12.5" cy="10" r="2.5" fill="#cd2e3a" />
            <circle cx="17.5" cy="10" r="2.5" fill="#0047a0" />
          </g>
          <g fill="#000">
            <g transform="rotate(-56.3 15 10)"><rect x="5.2" y="7.4" width=".9" height="5.2" /><rect x="6.5" y="7.4" width=".9" height="5.2" /><rect x="7.8" y="7.4" width=".9" height="5.2" /></g>
            <g transform="rotate(56.3 15 10)"><rect x="5.2" y="7.4" width=".9" height="5.2" /><rect x="6.5" y="7.4" width=".9" height="2.3" /><rect x="6.5" y="10.3" width=".9" height="2.3" /><rect x="7.8" y="7.4" width=".9" height="5.2" /></g>
            <g transform="rotate(123.7 15 10)"><rect x="5.2" y="7.4" width=".9" height="2.3" /><rect x="5.2" y="10.3" width=".9" height="2.3" /><rect x="6.5" y="7.4" width=".9" height="5.2" /><rect x="7.8" y="7.4" width=".9" height="2.3" /><rect x="7.8" y="10.3" width=".9" height="2.3" /></g>
            <g transform="rotate(-123.7 15 10)"><rect x="5.2" y="7.4" width=".9" height="2.3" /><rect x="5.2" y="10.3" width=".9" height="2.3" /><rect x="6.5" y="7.4" width=".9" height="2.3" /><rect x="6.5" y="10.3" width=".9" height="2.3" /><rect x="7.8" y="7.4" width=".9" height="2.3" /><rect x="7.8" y="10.3" width=".9" height="2.3" /></g>
          </g>
        </>
      );
    case "JP":
      return (
        <>
          <rect width="30" height="20" fill="#fff" />
          <circle cx="15" cy="10" r="6" fill="#bc002d" />
        </>
      );
    case "CN":
      return (
        <>
          <rect width="30" height="20" fill="#de2910" />
          <polygon points={star(5, 5, 3)} fill="#ffde00" />
          <polygon points={star(10, 2, 1, 23)} fill="#ffde00" />
          <polygon points={star(12, 4, 1, 45)} fill="#ffde00" />
          <polygon points={star(12, 7, 1, 70)} fill="#ffde00" />
          <polygon points={star(10, 9, 1, 21)} fill="#ffde00" />
        </>
      );
    case "EU":
      return (
        <>
          <rect width="30" height="20" fill="#003399" />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i * 30 * Math.PI) / 180;
            return <polygon key={i} points={star(15 + 6.2 * Math.sin(a), 10 - 6.2 * Math.cos(a), 1.05)} fill="#ffcc00" />;
          })}
        </>
      );
    default:
      return <rect width="30" height="20" fill="#d6d9de" />;
  }
}

export function Flag({ code, className = "flagi" }: { code?: string | null; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 30 20" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <Body code={code || "US"} />
    </svg>
  );
}
