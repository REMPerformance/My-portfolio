"use client";
import { useMemo, useRef, useState } from "react";
import { placesEn } from "@/lib/origins";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Výber štátu / regiónu s písaním – hľadá v anglickom aj slovenskom názve a v skratke (TX, CA…). */
export function PlacePicker({ country, value, onChange }: { country: string; value: string | null; onChange: (v: string | null) => void }) {
  const list = useMemo(() => placesEn(country), [country]);
  const us = country === "US";
  const label = (p: (typeof list)[number]) => `${p.en}${us ? ` (${p.code})` : ""}`;
  const cur = list.find((p) => p.code === value);
  const [q, setQ] = useState<string | null>(null);
  const [hi, setHi] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  const hits = useMemo(() => {
    if (q === null || !q.trim()) return list;
    const n = norm(q.trim());
    const score = (p: (typeof list)[number]) => {
      const code = p.code.toLowerCase();
      if (code === n) return 0;
      if (norm(p.en).startsWith(n)) return 1;
      if (norm(p.name).startsWith(n)) return 2;
      if (norm(p.en).includes(n) || norm(p.name).includes(n)) return 3;
      if (code.startsWith(n)) return 4;
      return 9;
    };
    return list.map((p) => [p, score(p)] as const).filter(([, s]) => s < 9).sort((a, b) => a[1] - b[1]).map(([p]) => p);
  }, [q, list]);

  const pick = (code: string) => { onChange(code); setQ(null); setHi(0); };

  return (
    <div className="pp" ref={box} onBlur={(e) => { if (!box.current?.contains(e.relatedTarget as Node)) setQ(null); }}>
      <input
        className="input"
        value={q ?? (cur ? label(cur) : "")}
        placeholder="Začnite písať, napr. Texas alebo TX"
        onFocus={(e) => { setQ(""); setHi(0); e.currentTarget.select(); }}
        onChange={(e) => { setQ(e.target.value); setHi(0); }}
        onKeyDown={(e) => {
          if (q === null) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(h + 1, hits.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
          else if (e.key === "Enter") { e.preventDefault(); if (hits[hi]) { pick(hits[hi].code); (e.target as HTMLInputElement).blur(); } }
          else if (e.key === "Escape") { setQ(null); (e.target as HTMLInputElement).blur(); }
        }}
        role="combobox"
        aria-expanded={q !== null}
        aria-autocomplete="list"
      />
      {q !== null && (
        <ul className="pp__list" role="listbox">
          {hits.length ? hits.map((p, i) => (
            <li key={p.code} role="option" aria-selected={i === hi}>
              <button type="button" tabIndex={-1} className={i === hi ? "on" : ""} onMouseDown={(e) => e.preventDefault()} onClick={() => pick(p.code)} onMouseEnter={() => setHi(i)}>
                {label(p)}{p.en !== p.name && <small>{p.name}</small>}
              </button>
            </li>
          )) : <li className="pp__none">Nič sa nenašlo</li>}
        </ul>
      )}
    </div>
  );
}
