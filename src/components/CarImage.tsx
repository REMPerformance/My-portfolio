import type { Car } from "@/lib/types";

export function CarPlaceholder({ car }: { car: Pick<Car, "id" | "make" | "model"> }) {
  const id = "g" + String(car.id).replace(/[^a-z0-9]/gi, "").slice(0, 12);
  const name = `${car.make} ${car.model}`.toUpperCase();
  return (
    <svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={`${car.make} ${car.model} – fotky čoskoro`}>
      <defs>
        <radialGradient id={id} cx=".75" cy=".3" r=".9">
          <stop offset="0" stopColor="#3a0710" />
          <stop offset=".55" stopColor="#0d0d10" />
          <stop offset="1" stopColor="#050505" />
        </radialGradient>
      </defs>
      <rect width="800" height="500" fill={`url(#${id})`} />
      <g stroke="rgba(255,255,255,.035)">
        {Array.from({ length: 15 }, (_, i) => <path key={"v" + i} d={`M${i * 56} 0V500`} />)}
        {Array.from({ length: 9 }, (_, i) => <path key={"h" + i} d={`M0 ${i * 56}H800`} />)}
      </g>
      <path d="M110 330 C150 282 230 256 300 250 L392 206 C432 188 522 187 572 212 L642 256 C692 264 720 286 720 324 L720 348 L110 348 Z" fill="rgba(200,16,46,.08)" stroke="#c8102e" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="235" cy="348" r="42" fill="#070707" stroke="rgba(255,255,255,.4)" strokeWidth="4" />
      <circle cx="600" cy="348" r="42" fill="#070707" stroke="rgba(255,255,255,.4)" strokeWidth="4" />
      <text x="400" y="150" textAnchor="middle" fill="rgba(255,255,255,.9)" fontFamily="Barlow Condensed,Arial Narrow,sans-serif" fontWeight="800" fontSize={Math.min(50, Math.round(1300 / name.length))}>{name}</text>
    </svg>
  );
}

export function CarImage({ car, index = 0, eager = false }: { car: Pick<Car, "id" | "make" | "model" | "year" | "images">; index?: number; eager?: boolean }) {
  const src = car.images?.[index];
  if (!src) return <CarPlaceholder car={car} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={`${car.year ?? ""} ${car.make} ${car.model} – foto ${index + 1}`.trim()} loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : undefined} decoding="async" />;
}
