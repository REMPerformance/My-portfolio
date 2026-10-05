"use client";
import { useState } from "react";
import type { CalcConfig, CalcOverride, CarExtra, CarType } from "@/lib/types";
import { originCosts } from "@/lib/calc";

const EQUIP_SUGGEST = [
  "Kožené sedadlá", "Vyhrievané sedadlá", "Ventilované sedadlá", "Navigácia", "Apple CarPlay / Android Auto", "Cúvacia kamera",
  "360° kamera", "Adaptívny tempomat", "Head-up displej", "Panoramatická strecha", "Strešné okno", "LED svetlá", "Matrix LED",
  "Prémiové audio", "Keyless", "Elektrické 5. dvere", "Ťažné zariadenie", "Športový podvozok", "Športový výfuk", "Performance balík"
];

export function ExtrasPanel({ extra, onChange }: { extra: CarExtra; onChange: (e: CarExtra) => void }) {
  const specs = extra.specs || [];
  const equip = extra.equipment || [];
  const [tag, setTag] = useState("");
  const setSpecs = (s: CarExtra["specs"]) => onChange({ ...extra, specs: s });
  const addEquip = (v: string) => {
    const t = v.trim();
    if (!t || equip.includes(t)) return;
    onChange({ ...extra, equipment: [...equip, t] });
  };
  return (
    <div className="panel">
      <h2>Vlastné parametre, výbava, história</h2>
      <div className="lbl-sm" style={{ marginBottom: 8 }}>Ďalšie parametre (zobrazia sa v tabuľke parametrov)</div>
      {specs.map((s, i) => (
        <div className="kv" key={i}>
          <input className="input" placeholder="Názov (napr. Výkon)" value={s.label} onChange={(e) => setSpecs(specs.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} />
          <input className="input" placeholder="Hodnota (napr. 460 k)" value={s.value} onChange={(e) => setSpecs(specs.map((x, k) => (k === i ? { ...x, value: e.target.value } : x)))} />
          <button type="button" className="rc-btn rc-btn--ghost rc-btn--sm" onClick={() => setSpecs(specs.filter((_, k) => k !== i))} aria-label="Odstrániť">✕</button>
        </div>
      ))}
      <button type="button" className="rc-btn rc-btn--ghost rc-btn--sm" onClick={() => setSpecs([...specs, { label: "", value: "" }])}>+ Pridať parameter</button>

      <div className="lbl-sm" style={{ margin: "20px 0 8px" }}>Výbava</div>
      <div className="tags">
        {equip.map((e) => (
          <span className="tagx" key={e}>{e}<button type="button" onClick={() => onChange({ ...extra, equipment: equip.filter((x) => x !== e) })} aria-label={`Odstrániť ${e}`}>✕</button></span>
        ))}
      </div>
      <div className="kv" style={{ gridTemplateColumns: "1fr auto" }}>
        <input className="input" placeholder="Napíšte a stlačte Enter" value={tag} onChange={(e) => setTag(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addEquip(tag); setTag(""); } }} />
        <button type="button" className="rc-btn rc-btn--ghost rc-btn--sm" onClick={() => { addEquip(tag); setTag(""); }}>Pridať</button>
      </div>
      <div className="suggest">
        {EQUIP_SUGGEST.filter((s) => !equip.includes(s)).map((s) => <button type="button" key={s} onClick={() => addEquip(s)}>+ {s}</button>)}
      </div>

      <div className="field" style={{ marginTop: 20 }}>
        <label>História a doplňujúce info</label>
        <textarea className="input" rows={3} value={extra.history || ""} onChange={(e) => onChange({ ...extra, history: e.target.value })} placeholder="Počet majiteľov, servisná história, Carfax, čo presne sa zistilo z fotiek…" />
      </div>
    </div>
  );
}

export function CalcOverridePanel({ o, onChange, cfg, type, country, place }: { o: CalcOverride; onChange: (o: CalcOverride) => void; cfg: CalcConfig; type: CarType; country: string; place: string | null }) {
  const oc = originCosts(cfg, country, place);
  const num = (k: keyof CalcOverride, v: string) => {
    const n = { ...o } as Record<string, unknown>;
    if (v === "") delete n[k]; else n[k] = Number(v);
    onChange(n as CalcOverride);
  };
  const extras = o.extraCosts || [];
  const F = ({ k, label, unit, def, scale = 1 }: { k: keyof CalcOverride; label: string; unit: string; def: number; scale?: number }) => (
    <div className="field">
      <label>{label}</label>
      <div className="iw">
        <input className="input" type="number" step="any" placeholder={`predvolené ${Math.round(def * scale * 100) / 100}`} value={o[k] === undefined ? "" : Math.round((o[k] as number) * scale * 100) / 100} onChange={(e) => num(k, e.target.value === "" ? "" : String(Number(e.target.value) / scale))} />
        <span className="u">{unit}</span>
      </div>
    </div>
  );
  return (
    <div className="panel">
      <h2>Vlastná kalkulácia pre toto auto</h2>
      <p className="note" style={{ marginTop: 0 }}>Prázdne pole = použije sa globálne nastavenie z Kalkulačky. Vyplňte len to, čo je pri tomto aute iné. Všetky sumy zadávajte bez DPH.</p>
      <div className="three">
        <div className="field">
          <label>Cena na webe</label>
          <select className="input" value={o.priceMode || ""} onChange={(e) => { const n = { ...o }; if (e.target.value) n.priceMode = e.target.value as "gross" | "net"; else delete n.priceMode; onChange(n); }}>
            <option value="">Predvolené ({cfg.priceMode === "net" ? "bez DPH" : "s DPH"})</option>
            <option value="gross">Konečná cena s DPH</option>
            <option value="net">Konečná cena bez DPH</option>
          </select>
        </div>
        {F({ k: "serviceFeePct", label: "Váš poplatok", unit: "%", def: cfg.serviceFeePct ?? 0, scale: 100 })}
      </div>
      <div className="three">
        {F({ k: "dutyRate", label: "Clo", unit: "%", def: cfg.dutyRate[type], scale: 100 })}
        {F({ k: "euPortEur", label: "Prístav + deklarant", unit: "EUR", def: cfg.euPortEur })}
      </div>
      <div className="three">
        {F({ k: "inlandUsd", label: oc.country.local ? "Preprava na Slovensko" : `Odvoz do prístavu (${oc.port.name})`, unit: "USD", def: oc.inlandUsd })}
        {F({ k: "oceanUsd", label: "Námorná preprava", unit: "USD", def: oc.oceanUsd })}
        {F({ k: "truckEur", label: "Kamión do SR", unit: "EUR", def: cfg.truckEur })}
      </div>
      <div className="three">
        {F({ k: "homologEur", label: "Homologizácia, STK, EČV", unit: "EUR", def: cfg.homologEur })}
      </div>
      <div className="lbl-sm" style={{ margin: "6px 0 8px" }}>Ďalšie náklady (napr. diely, lakovanie, doprava k lakovni)</div>
      {extras.map((x, i) => (
        <div className="kv" key={i}>
          <input className="input" placeholder="Položka" value={x.label} onChange={(e) => onChange({ ...o, extraCosts: extras.map((y, k) => (k === i ? { ...y, label: e.target.value } : y)) })} />
          <div className="iw"><input className="input" type="number" placeholder="0" value={x.eur || ""} onChange={(e) => onChange({ ...o, extraCosts: extras.map((y, k) => (k === i ? { ...y, eur: Number(e.target.value) } : y)) })} /><span className="u">EUR</span></div>
          <button type="button" className="rc-btn rc-btn--ghost rc-btn--sm" onClick={() => onChange({ ...o, extraCosts: extras.filter((_, k) => k !== i) })} aria-label="Odstrániť">✕</button>
        </div>
      ))}
      <button type="button" className="rc-btn rc-btn--ghost rc-btn--sm" onClick={() => onChange({ ...o, extraCosts: [...extras, { label: "", eur: 0 }] })}>+ Pridať náklad</button>
    </div>
  );
}
