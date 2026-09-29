"use client";
import { useEffect, useState } from "react";

/** Striedajúce sa fotky na pozadí úvodnej sekcie (prelínanie + jemný zoom). */
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
        <div key={src + k} className={`hero__img${k === i ? " on" : ""}`} style={{ backgroundImage: `url('${src}')` }} />
      ))}
      {images.length > 1 && (
        <div className="hero__dots">
          {images.map((_, k) => <span key={k} className={k === i ? "on" : ""} />)}
        </div>
      )}
    </div>
  );
}
