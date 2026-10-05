"use client";
import { useMemo, useState } from "react";
import { calc, fxRate } from "@/lib/calc";
import type { CalcConfig, CarType } from "@/lib/types";
import { COUNTRIES, countryDef } from "@/lib/origins";
import { money } from "@/lib/format";
import { Breakdown } from "./Breakdown";

const DEFAULT_PRICE: Record<string, number> = { USD: 12000, CAD: 16000, AED: 45000, KRW: 16000000, JPY: 1800000, CNY: 85000, EUR: 15000 };

export function Calculator({ cfg, hideFee = false }: { cfg: CalcConfig; hideFee?: boolean }) {
  const [country, setCountry] = useState("US");
  const cd = countryDef(country);
  const [place, setPlace] = useState("TX");
  const [price, setPrice] = useState(12000);
  const [mode, setMode] = useState<"auction" | "fixed">("auction");
  const [type, setType] = useState<CarType>("car");
  const [repair, setRepair] = useState(0);
  const [sk, setSk] = useState<number | "">("");

  const [own, setOwn] = useState(false);
  const pickCountry = (c: string) => {
    const d = countryDef(c);
    setCountry(c);
    setPlace(d.places[0].code);
    setPrice(DEFAULT_PRICE[d.currency] ?? 10000);
    if (c !== "US" && c !== "CA") setMode("fixed");
  };

  const r = useMemo(
    () => calc(cfg, { price: Math.max(0, price || 0), currency: cd.currency, country, place, type, repairEur: Math.max(0, repair || 0), sellerFee: mode === "fixed" ? 0 : undefined, noHomolog: own }),
    [cfg, price, cd.currency, country, place, type, repair, mode, own]
  );
  const priceEur = (price || 0) * fxRate(cfg, cd.currency);

  return (
    <div className="calc">
      <div className="panel">
        <h2>Parametre auta</h2>
        <div className="two">
          <div className="field">
            <label htmlFor="cCountry">Krajina</label>
            <select className="input" id="cCountry" value={country} onChange={(e) => pickCountry(e.target.value)}>
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="cPlace">{cd.placeLabel}</label>
            <select className="input" id="cPlace" value={place} onChange={(e) => setPlace(e.target.value)}>
              {[...cd.places].sort((a, b) => a.name.localeCompare(b.name, "sk")).map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
            </select>
          </div>
        </div>
        <div className="seg" role="radiogroup" aria-label="Spôsob kúpy">
          <button type="button" role="radio" aria-checked={mode === "auction"} className={mode === "auction" ? "on" : ""} onClick={() => setMode("auction")}><b>Aukcia</b><small>Copart, IAAI – s aukčnými poplatkami</small></button>
          <button type="button" role="radio" aria-checked={mode === "fixed"} className={mode === "fixed" ? "on" : ""} onClick={() => setMode("fixed")}><b>Od predajcu</b><small>Dealer, Buy Now, súkromný predajca</small></button>
        </div>
        <div className="field">
          <label htmlFor="cPrice">{mode === "auction" ? "Cena na aukcii" : "Cena auta u predajcu"}</label>
          <div className="iw"><input className="input" id="cPrice" type="number" min={0} step={cd.currency === "KRW" || cd.currency === "JPY" ? 10000 : 100} value={price} inputMode="numeric" onChange={(e) => setPrice(+e.target.value)} /><span className="u">{cd.currency}</span></div>
          {cd.currency !== "EUR" && <span className="hint">≈ {money(priceEur, "EUR")} pri kurze {fxRate(cfg, cd.currency).toLocaleString("sk-SK", { maximumSignificantDigits: 3 })} €</span>}
        </div>
        <div className="two">
          <div className="field">
            <label htmlFor="cType">Typ vozidla</label>
            <select className="input" id="cType" value={type} onChange={(e) => setType(e.target.value as CarType)}>
              <option value="car">Osobné / SUV (clo {Math.round(cfg.dutyRate.car * 100)} %)</option>
              <option value="truck">Pickup / úžitkové ({Math.round(cfg.dutyRate.truck * 100)} %)</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="cRepair">Odhad opravy</label>
            <div className="iw"><input className="input" id="cRepair" type="number" min={0} step={100} value={repair} inputMode="numeric" onChange={(e) => setRepair(+e.target.value)} /><span className="u">EUR</span></div>
          </div>
        </div>
        <label className="switch" style={{ margin: "0 0 16px" }}>
          <input type="checkbox" checked={own} onChange={(e) => setOwn(e.target.checked)} />
          {cd.local ? "Bez opravy a prihlásenia, vybavím si ich sám" : "Bez opravy a homologizácie, vybavím si ich sám (homologizujeme len autá opravené u nás)"}
        </label>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="cSk">Cena podobného auta na Slovensku (nepovinné)</label>
          <div className="iw"><input className="input" id="cSk" type="number" min={0} step={500} value={sk} inputMode="numeric" placeholder="na porovnanie" onChange={(e) => setSk(e.target.value === "" ? "" : +e.target.value)} /><span className="u">EUR</span></div>
        </div>
        {cd.note && <p className="note">{cd.note}</p>}
        <p className="note">Všetky položky sú odhad. Presnú kalkuláciu ku konkrétnemu autu Vám pošleme pred kúpou.</p>
      </div>
      <div className="panel" aria-live="polite"><Breakdown r={r} skPrice={sk || null} hideFee={hideFee} /></div>
    </div>
  );
}
