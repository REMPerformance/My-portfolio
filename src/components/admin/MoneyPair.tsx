"use client";
import { useState } from "react";

/** Dve prepojené polia: suma v mene auta ↔ v EUR. Ukladá sa suma v mene auta. */
export function MoneyPair({ label, value, currency, rate, onChange, hint, required }: { label: string; value: number | null; currency: string; rate: number; onChange: (v: number | null) => void; hint?: string; required?: boolean }) {
  const [eurTxt, setEurTxt] = useState<string | null>(null);
  const eurVal = value == null ? "" : String(Math.round(value * rate));
  if (currency === "EUR") {
    return (
      <div className="field"><label>{label}{required ? " *" : ""}</label>
        <div className="iw"><input className="input" type="number" value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))} /><span className="u">EUR</span></div>
        {hint && <span className="hint">{hint}</span>}
      </div>
    );
  }
  return (
    <div className="field">
      <label>{label}{required ? " *" : ""}</label>
      <div className="mpair">
        <div className="iw"><input className="input" type="number" value={value ?? ""} onChange={(e) => { setEurTxt(null); onChange(e.target.value === "" ? null : Number(e.target.value)); }} /><span className="u">{currency}</span></div>
        <span className="eq">=</span>
        <div className="iw"><input className="input" type="number" value={eurTxt ?? eurVal} onChange={(e) => { setEurTxt(e.target.value); onChange(e.target.value === "" ? null : Math.round(Number(e.target.value) / rate)); }} onBlur={() => setEurTxt(null)} /><span className="u">EUR</span></div>
      </div>
      <span className="hint">{hint ? `${hint} · ` : ""}kurz 1 {currency} = {rate.toLocaleString("sk-SK", { maximumSignificantDigits: 4 })} €</span>
    </div>
  );
}
