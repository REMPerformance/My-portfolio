"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CONTRACT_RE, VIN_RE, normContract, normVin } from "@/lib/tracking";
import { STORE_KEY, readStored } from "./TrackStatus";
import { TrackMap } from "./TrackMap";

export function TrackLookup() {
  const router = useRouter();
  const [vin, setVin] = useState("");
  const [con, setCon] = useState("");
  const [err, setErr] = useState<{ m: string; f?: "vin" | "con" } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { const s = readStored(); if (s) { setVin(s.vin); setCon(s.contract); } }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = normVin(vin), c = normContract(con);
    if (!VIN_RE.test(v)) return setErr({ m: "VIN má 17 znakov a neobsahuje písmená I, O ani Q.", f: "vin" });
    if (!CONTRACT_RE.test(c)) return setErr({ m: "Číslo zmluvy nájdete v hlavičke zmluvy, napríklad REM261026A.", f: "con" });
    setBusy(true); setErr(null);
    const r = await fetch("/api/tracking", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ vin: v, contract: c }) }).catch(() => null);
    setBusy(false);
    if (!r || r.status >= 500) return setErr({ m: "Stav sa teraz nepodarilo načítať. Skúste to o chvíľu znova." });
    if (!r.ok) return setErr({ m: "Objednávku s týmto VIN a číslom zmluvy sme nenašli. Skontrolujte údaje v zmluve alebo nás kontaktujte." });
    const j = await r.json();
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify({ vin: v, contract: c, shipment: j.shipment })); } catch { /* ignore */ }
    router.push("/sledovanie/stav");
  }

  return (
    <div className="trk-search dark">
      <TrackMap className="trk-bgmap" from="savannah" to="bremerhaven" sea={0.62} post={0} decorative />
      <form className="trk-form" onSubmit={submit} noValidate>
        <span className="eyebrow">Sledovanie dovozu</span>
        <h1>Kde je <em>Vaše auto?</em></h1>
        <div className="field">
          <label htmlFor="trk-vin">VIN vozidla</label>
          <input className="input mono" id="trk-vin" value={vin} maxLength={17} autoComplete="off" spellCheck={false} placeholder="17 znakov" aria-invalid={err?.f === "vin" || undefined}
            onChange={(e) => { setVin(normVin(e.target.value)); setErr(null); }} />
        </div>
        <div className="field">
          <label htmlFor="trk-con">Číslo zmluvy</label>
          <input className="input mono" id="trk-con" value={con} maxLength={20} autoComplete="off" spellCheck={false} placeholder="REM000000A" aria-invalid={err?.f === "con" || undefined}
            onChange={(e) => { setCon(normContract(e.target.value)); setErr(null); }} />
        </div>
        {err && <p className="fmsg err" role="alert">{err.m}</p>}
        <button className="rc-btn rc-btn--primary rc-btn--block" disabled={busy}>{busy ? "Hľadám…" : "Zobraziť stav"}</button>
      </form>
    </div>
  );
}
