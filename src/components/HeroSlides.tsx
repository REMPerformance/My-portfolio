"use client";
import { useEffect, useState } from "react";

/** Striedajúce sa fotky na pozadí úvodnej sekcie (prelínanie + jemný zoom). */
/** Shopify CDN – požadovaná šírka obrázka (menšie súbory pre mobil). */
const sized = (src: string, w: number) => {
  if (!/cdn\/shop\//.test(src)) return src;
  return /[?&]width=\d+/.test(src) ? src.replace(/([?&])width=\d+/, `$1width=${w}`) : `${src}${src.includes("?") ? "&" : "?"}width=${w}`;
};

export function HeroSlides({ images, interval = 6000 }: { images: string[]; interval?: number }) {
  const [i, setI] = useState(0);
  const [ready, setReady] = useState(1); // koľko fotiek už môže načítať prehliadač
  useEffect(() => {
    if (images.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setReady(images.length);
    const t = setInterval(() => setI((x) => (x + 1) % images.length), interval);
    return () => clearInterval(t);
  }, [images.length, interval]);
  return (
    <div className="hero__slides" aria-hidden="true">
      {images.slice(0, ready).map((src, k) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src + k}
          className={`hero__img${k === i ? " on" : ""}`}
          src={sized(src, 1400)}
          srcSet={/[?&]width=/.test(src) || /cdn\/shop\//.test(src) ? [640, 960, 1400, 2000].map((w) => `${sized(src, w)} ${w}w`).join(", ") : undefined}
          sizes="100vw"
          alt=""
          fetchPriority={k === 0 ? "high" : "low"}
          loading={k === 0 ? "eager" : "lazy"}
          decoding="async"
        />
      ))}
      {images.length > 1 && (
        <div className="hero__dots">
          {images.map((_, k) => <span key={k} className={k === i ? "on" : ""} />)}
        </div>
      )}
    </div>
  );
}
