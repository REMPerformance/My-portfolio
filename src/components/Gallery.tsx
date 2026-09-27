"use client";
import { useCallback, useEffect, useState } from "react";
import type { Car } from "@/lib/types";
import { CarImage } from "./CarImage";

export function Gallery({ car, children }: { car: Car; children?: React.ReactNode }) {
  const [i, setI] = useState(0);
  const n = car.images?.length || 0;
  const go = useCallback((d: number) => n && setI((x) => (x + d + n) % n), [n]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input,textarea,select")) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [go]);
  return (
    <div>
      <div className="gallery__main">
        <CarImage car={car} index={i} eager={i === 0} />
        {children}
        {n > 1 && (
          <>
            <button className="gallery__nav prev" aria-label="Predchádzajúca fotka" onClick={() => go(-1)}><svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg></button>
            <button className="gallery__nav next" aria-label="Ďalšia fotka" onClick={() => go(1)}><svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg></button>
            <span className="gallery__count">{i + 1} / {n}</span>
          </>
        )}
      </div>
      {n > 1 && (
        <div className="thumbs">
          {car.images.map((src, k) => (
            <button key={src + k} className={k === i ? "on" : ""} onClick={() => setI(k)} aria-label={`Fotka ${k + 1}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
