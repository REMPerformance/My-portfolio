"use client";
import { useEffect, useMemo, useState } from "react";
import { browserClient } from "@/lib/supabase";
import { calc, mergeCalc } from "@/lib/calc";
import { COUNTRIES, CURRENCIES, DEFAULT_FX, countryDef, placeKey } from "@/lib/origins";
import type { CalcConfig } from "@/lib/types";
import { useAdmin } from "@/components/admin/AdminApp";
import { Breakdown } from "@/components/Breakdown";

function Num({ label, value, onChange, unit, step = 1 }: { label: string; value: number; onChange: (v: number) => void; unit?: string; step?: number }) {
  return (
    <div className="field"><label>{label}</label><div className="iw"><input className="input" type="number" step={step} value={value} onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))} />{unit && <span className="u">{unit}</span>}</div></div>
  );
}

export default function Settings() {
  const sb = browserClient();
  const { toast, revalidate } = useAdmin();
  const [c, setC] = useState<CalcConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("US");

  useEffect(() => {
    sb.from("settings").select("value").eq("key", "calc").maybeSingle().then(({ data }) => setC(mergeCalc(data?.value)));
  }, [sb]);

  const preview = useMemo(() => (c ? calc(c, { price: 12000, type: "car", country: "US", place: "TX", repairEur: 2500 }) : null), [c]);
  if (!c) return <p className="note">Načítavam…</p>;

  const upd = (patch: Partial<CalcConfig>) => setC({ ...c, ...patch });
  const pct = (v: number) => Math.round(v * 1000) / 10;

  async function save() {
    setSaving(true);
    const { error } = await sb.from("settings").upsert({ key: "calc", value: c, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) return toast(error.message, true);
    toast("Nastavenia kalkulačky uložené");
    revalidate();
  }

  return (
    <>
      <div className="adm__head">
        <h1>Kalkulácia a doprava</h1>
        <button className="rc-btn rc-btn--primary" onClick={save} disabled={saving}>{saving ? "Ukladám…" : "Uložiť nastavenia"}</button>
      </div>
      <div className="edit-grid">
        <div>
          <div className="panel">
            <h2>Poplatky a aukcie</h2>
            <div className="three">
              <Num label="Kurz USD → EUR" value={c.usdToEur} step={0.01} onChange={(v) => upd({ usdToEur: v })} />
              <Num label="Váš poplatok" value={c.serviceFeeEur} unit="EUR" onChange={(v) => upd({ serviceFeeEur: v })} />
              <Num label="Fixné aukčné extra" value={c.fixedAuctionExtras} unit="USD" onChange={(v) => upd({ fixedAuctionExtras: v })} />
            </div>
            <div className="lbl-sm" style={{ margin: "6px 0 10px" }}>Aukčný poplatok podľa ceny (do sumy → poplatok v USD)</div>
            {c.auctionFeeTiers.map(([max, fee], i) => (
              <div className="three" key={i}>
                <Num label={`Do sumy #${i + 1}`} value={max} unit="USD" onChange={(v) => { const t = [...c.auctionFeeTiers]; t[i] = [v, fee]; upd({ auctionFeeTiers: t }); }} />
                <Num label="Poplatok" value={fee} unit="USD" onChange={(v) => { const t = [...c.auctionFeeTiers]; t[i] = [max, v]; upd({ auctionFeeTiers: t }); }} />
                <div className="field"><label>&nbsp;</label><button className="rc-btn rc-btn--ghost" onClick={() => upd({ auctionFeeTiers: c.auctionFeeTiers.filter((_, k) => k !== i) })}>Odstrániť</button></div>
              </div>
            ))}
            <div className="two">
              <button className="rc-btn rc-btn--ghost" onClick={() => { const last = c.auctionFeeTiers[c.auctionFeeTiers.length - 1] || [0, 0]; upd({ auctionFeeTiers: [...c.auctionFeeTiers, [last[0] + 5000, last[1] + 150]] }); }}>+ Pridať pásmo</button>
              <Num label="Nad posledné pásmo (% z ceny)" value={pct(c.auctionFeeOverPct)} unit="%" step={0.1} onChange={(v) => upd({ auctionFeeOverPct: v / 100 })} />
            </div>
          </div>

          <div className="panel">
            <h2>Kurzy mien</h2>
            <p className="note" style={{ marginTop: 0 }}>Koľko EUR je 1 jednotka meny. Kurz USD je ten istý ako hore.</p>
            <div className="three">
              {CURRENCIES.filter((x) => x.code !== "EUR" && x.code !== "USD").map((x) => (
                <Num key={x.code} label={`1 ${x.code} (${x.name})`} value={c.fx?.[x.code] ?? DEFAULT_FX[x.code]} step={0.0001} unit="EUR" onChange={(v) => upd({ fx: { ...c.fx, [x.code]: v } })} />
              ))}
            </div>
          </div>

          <div className="panel">
            <h2>Doprava podľa krajiny</h2>
            <p className="note" style={{ marginTop: 0 }}>Prázdne pole = predvolená hodnota (sivá). Ceny v USD.</p>
            <div className="toolbar" style={{ marginTop: 10 }}>
              {COUNTRIES.map((x) => <button key={x.code} type="button" className={`chip${tab === x.code ? " active" : ""}`} onClick={() => setTab(x.code)}>{x.flag} {x.name}</button>)}
            </div>
            <div className="lbl-sm" style={{ margin: "8px 0" }}>Námorná preprava z prístavu do EÚ + poistenie</div>
            <table className="otable"><tbody>
              {countryDef(tab).ports.map((pt) => (
                <tr key={pt.id}><td>{pt.name}</td><td style={{ width: 140 }}>
                  <input className="input" type="number" placeholder={String(pt.oceanUsd)} value={c.ports?.[pt.id] ?? ""} onChange={(e) => { const n = { ...(c.ports || {}) }; if (e.target.value === "") delete n[pt.id]; else n[pt.id] = Number(e.target.value); upd({ ports: n }); }} />
                </td></tr>
              ))}
            </tbody></table>
            <div className="lbl-sm" style={{ margin: "16px 0 8px" }}>Odvoz do prístavu podľa miesta</div>
            <table className="otable">
              <thead><tr><th>{countryDef(tab).placeLabel}</th><th>Prístav</th><th>USD</th></tr></thead>
              <tbody>
                {[...countryDef(tab).places].sort((a, b) => a.name.localeCompare(b.name, "sk")).map((pl) => {
                  const k = placeKey(tab, pl.code);
                  return (
                    <tr key={pl.code}><td>{pl.name}</td><td style={{ color: "var(--rc-text-dim)" }}>{countryDef(tab).ports.find((x) => x.id === pl.port)?.name}</td><td style={{ width: 140 }}>
                      <input className="input" type="number" placeholder={String(pl.inlandUsd)} value={c.inland?.[k] ?? ""} onChange={(e) => { const n = { ...(c.inland || {}) }; if (e.target.value === "") delete n[k]; else n[k] = Number(e.target.value); upd({ inland: n }); }} />
                    </td></tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="panel">
            <h2>Európa a Slovensko</h2>
            <div className="three">
              <Num label="Prístav + deklarant" value={c.euPortEur} unit="EUR" onChange={(v) => upd({ euPortEur: v })} />
              <Num label="Kamión do SR" value={c.truckEur} unit="EUR" onChange={(v) => upd({ truckEur: v })} />
              <Num label="Homologizácia, STK, EČV" value={c.homologEur} unit="EUR" onChange={(v) => upd({ homologEur: v })} />
            </div>
          </div>

          <div className="panel">
            <h2>Clo, DPH a záloha</h2>
            <div className="three">
              <Num label="Clo osobné / SUV" value={pct(c.dutyRate.car)} unit="%" step={0.1} onChange={(v) => upd({ dutyRate: { ...c.dutyRate, car: v / 100, suv: v / 100 } })} />
              <Num label="Clo pickup / úžitkové" value={pct(c.dutyRate.truck)} unit="%" step={0.1} onChange={(v) => upd({ dutyRate: { ...c.dutyRate, truck: v / 100 } })} />
              <Num label="Clo motocykel" value={pct(c.dutyRate.moto)} unit="%" step={0.1} onChange={(v) => upd({ dutyRate: { ...c.dutyRate, moto: v / 100 } })} />
            </div>
            <div className="three">
              <Num label="DPH" value={pct(c.vatRate)} unit="%" step={0.1} onChange={(v) => upd({ vatRate: v / 100 })} />
              <Num label="Záloha" value={pct(c.depositPct)} unit="%" step={1} onChange={(v) => upd({ depositPct: v / 100 })} />
              <Num label="Minimálna záloha" value={c.depositMinEur} unit="EUR" onChange={(v) => upd({ depositMinEur: v })} />
            </div>
          </div>

          <div className="panel">
            <h2>Kredit RACEM</h2>
            {c.racemCredit.map(([max, v], i) => (
              <div className="two" key={i}>
                <Num label={i === c.racemCredit.length - 1 ? "Nad (posledné pásmo)" : `Auto do sumy`} value={max} unit="EUR" onChange={(x) => { const t = [...c.racemCredit]; t[i] = [x, v]; upd({ racemCredit: t }); }} />
                <Num label="Kredit" value={v} unit="EUR" onChange={(x) => { const t = [...c.racemCredit]; t[i] = [max, x]; upd({ racemCredit: t }); }} />
              </div>
            ))}
            <p className="note">Posledné pásmo nechajte s veľmi vysokou sumou (napr. 999999999).</p>
          </div>
        </div>
        <aside className="edit-side">
          <div className="panel">
            <h2>Náhľad: $12 000, Texas</h2>
            {preview && <Breakdown r={preview} compact />}
          </div>
        </aside>
      </div>
    </>
  );
}
