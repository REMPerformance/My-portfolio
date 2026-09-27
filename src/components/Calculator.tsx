"use client";
import { useMemo, useState } from "react";
import { calc } from "@/lib/calc";
import type { CalcConfig, CarType, Region } from "@/lib/types";
import { Breakdown } from "./Breakdown";

export function Calculator({ cfg }: { cfg: CalcConfig }) {
  const [bid, setBid] = useState(12000);
  const [type, setType] = useState<CarType>("car");
  const [region, setRegion] = useState<Region>("central");
  const [repair, setRepair] = useState(2500);
  const [sk, setSk] = useState(32000);
  const [rate, setRate] = useState(cfg.usdToEur);
  const r = useMemo(() => calc(cfg, { bidUsd: Math.max(0, bid || 0), type, region, repairEur: Math.max(0, repair || 0), rate }), [cfg, bid, type, region, repair, rate]);

  return (
    <div className="calc">
      <div className="panel">
        <h2>Parametre</h2>
        <div className="field">
          <label htmlFor="cBid">Cena na aukcii</label>
          <div className="iw"><input className="input" id="cBid" type="number" min={0} step={100} value={bid} inputMode="numeric" onChange={(e) => setBid(+e.target.value)} /><span className="u">USD</span></div>
          <input type="range" min={500} max={80000} step={100} value={bid} aria-label="Cena na aukcii – posuvník" onChange={(e) => setBid(+e.target.value)} />
        </div>
        <div className="two">
          <div className="field">
            <label htmlFor="cType">Typ vozidla</label>
            <select className="input" id="cType" value={type} onChange={(e) => setType(e.target.value as CarType)}>
              <option value="car">Osobné / SUV (clo {Math.round(cfg.dutyRate.car * 100)} %)</option>
              <option value="truck">Pickup / úžitkové ({Math.round(cfg.dutyRate.truck * 100)} %)</option>
              <option value="moto">Motocykel (clo {Math.round(cfg.dutyRate.moto * 100)} %)</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="cRegion">Kde auto stojí</label>
            <select className="input" id="cRegion" value={region} onChange={(e) => setRegion(e.target.value as Region)}>
              <option value="east">Východ (NY, NJ, GA, FL)</option>
              <option value="central">Stred / Texas</option>
              <option value="west">Západ (CA, WA, AZ)</option>
            </select>
          </div>
        </div>
        <div className="two">
          <div className="field">
            <label htmlFor="cRepair">Odhad opravy</label>
            <div className="iw"><input className="input" id="cRepair" type="number" min={0} step={100} value={repair} inputMode="numeric" onChange={(e) => setRepair(+e.target.value)} /><span className="u">EUR</span></div>
          </div>
          <div className="field">
            <label htmlFor="cSk">Podobné auto na SK</label>
            <div className="iw"><input className="input" id="cSk" type="number" min={0} step={500} value={sk} inputMode="numeric" onChange={(e) => setSk(+e.target.value)} /><span className="u">EUR</span></div>
          </div>
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="cRate">Kurz USD → EUR</label>
          <input className="input" id="cRate" type="number" min={0.5} max={1.5} step={0.01} value={rate} onChange={(e) => setRate(+e.target.value)} />
        </div>
        <p className="note">Všetky položky sú odhad. Presnú ponuku ku konkrétnemu autu Vám pošleme pred dražbou.</p>
      </div>
      <div className="panel" aria-live="polite"><Breakdown r={r} skPrice={sk} /></div>
    </div>
  );
}
