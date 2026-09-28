"use client";
import { useEffect, useRef, useState } from "react";

const MONTHS = ["január", "február", "marec", "apríl", "máj", "jún", "júl", "august", "september", "október", "november", "december"];
const DAYS = ["Po", "Ut", "St", "Št", "Pi", "So", "Ne"];
const p2 = (n: number) => String(n).padStart(2, "0");
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function fmtDT(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
}

/** Kalendár na vyklikanie dátumu + čas v 24 h formáte (slovenský čas). Hodnota je ISO reťazec alebo null. */
export function DateTimePicker({ label, value, onChange, hint, required, defaultHour = 18, quick = [0, 1, 2, 3, 7] }: {
  label: string; value: string | null; onChange: (iso: string | null) => void; hint?: string; required?: boolean; defaultHour?: number; quick?: number[];
}) {
  const cur = value ? new Date(value) : null;
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => { const d = cur || new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", h); document.addEventListener("keydown", k);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("keydown", k); };
  }, [open]);

  const hour = cur ? cur.getHours() : defaultHour;
  const minute = cur ? cur.getMinutes() : 0;
  const emit = (y: number, m: number, d: number, h: number, mi: number) => onChange(new Date(y, m, d, h, mi, 0, 0).toISOString());
  const pickDay = (d: Date) => emit(d.getFullYear(), d.getMonth(), d.getDate(), hour, minute);
  const setTime = (h: number, mi: number) => { const b = cur || new Date(); emit(b.getFullYear(), b.getMonth(), b.getDate(), h, mi); };

  const first = (view.getDay() + 6) % 7;
  const daysIn = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [...Array(first).fill(null), ...Array.from({ length: daysIn }, (_, i) => new Date(view.getFullYear(), view.getMonth(), i + 1))];
  const today = new Date();
  const mins = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  if (!mins.includes(minute)) mins.push(minute);
  mins.sort((a, b) => a - b);

  return (
    <div className="field dtp" ref={box}>
      <label>{label}{required ? " *" : ""}</label>
      <button type="button" className={`input dtp__btn${value ? "" : " empty"}`} onClick={() => { setOpen((o) => !o); if (cur) setView(new Date(cur.getFullYear(), cur.getMonth(), 1)); }} aria-expanded={open}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4" /></svg>
        <span>{value ? fmtDT(value) : "Vybrať dátum a čas"}</span>
      </button>
      {hint && <span className="hint">{hint}</span>}
      {open && (
        <div className="dtp__pop" role="dialog" aria-label={label}>
          <div className="dtp__quick">
            {quick.map((n) => {
              const d = new Date(); d.setDate(d.getDate() + n);
              return <button type="button" key={n} className="chip" onClick={() => { pickDay(d); setView(new Date(d.getFullYear(), d.getMonth(), 1)); }}>{n === 0 ? "Dnes" : n === 1 ? "Zajtra" : `+${n} dni`}</button>;
            })}
          </div>
          <div className="dtp__head">
            <button type="button" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))} aria-label="Predchádzajúci mesiac">‹</button>
            <b>{MONTHS[view.getMonth()]} {view.getFullYear()}</b>
            <button type="button" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))} aria-label="Ďalší mesiac">›</button>
          </div>
          <div className="dtp__grid">
            {DAYS.map((d) => <span key={d} className="dow">{d}</span>)}
            {cells.map((d, i) => d ? (
              <button type="button" key={i} className={`${cur && sameDay(d, cur) ? "on" : ""}${sameDay(d, today) ? " today" : ""}${d < new Date(today.getFullYear(), today.getMonth(), today.getDate()) ? " past" : ""}`} onClick={() => pickDay(d)}>{d.getDate()}</button>
            ) : <span key={i} />)}
          </div>
          <div className="dtp__time">
            <span>Čas</span>
            <select className="input" value={hour} onChange={(e) => setTime(+e.target.value, minute)} aria-label="Hodina">
              {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{p2(h)}</option>)}
            </select>
            <b>:</b>
            <select className="input" value={minute} onChange={(e) => setTime(hour, +e.target.value)} aria-label="Minúty">
              {mins.map((m) => <option key={m} value={m}>{p2(m)}</option>)}
            </select>
          </div>
          <div className="dtp__foot">
            <button type="button" className="linkbtn" onClick={() => { onChange(null); setOpen(false); }}>Vymazať</button>
            <button type="button" className="rc-btn rc-btn--primary rc-btn--sm" onClick={() => { if (!value) setTime(hour, minute); setOpen(false); }}>Hotovo</button>
          </div>
        </div>
      )}
    </div>
  );
}
