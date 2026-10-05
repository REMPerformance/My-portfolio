"use client";
import { useCallback, useEffect, useState } from "react";
import { browserClient } from "@/lib/supabase";
import { useAdmin } from "@/components/admin/AdminApp";
import { TrafficView, countryName, type Filter, type Stats } from "@/components/admin/TrafficView";

const RANGES = [{ d: 1, l: "Dnes" }, { d: 7, l: "7 dní" }, { d: 30, l: "30 dní" }, { d: 90, l: "90 dní" }, { d: 365, l: "Rok" }];

export default function Traffic() {
  const { toast } = useAdmin();
  const [days, setDays] = useState(30);
  const [filter, setFilter] = useState<Filter>({ country: null, device: null });
  const [s, setS] = useState<Stats | null>(null);
  const [at, setAt] = useState<Date | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    const { data, error } = await browserClient().rpc("traffic_stats_v2", { p_days: days, p_country: filter.country, p_device: filter.device });
    setBusy(false);
    if (error) { toast(error.message, true); return; }
    setS(data as Stats); setAt(new Date());
  }, [days, filter, toast]);

  useEffect(() => {
    load();
    const t = setInterval(() => { if (document.visibilityState === "visible") load(); }, 30000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <>
      <div className="adm__head">
        <h1>Návštevnosť</h1>
        <div className="tseg">
          {RANGES.map((r) => <button key={r.d} type="button" className={days === r.d ? "on" : ""} onClick={() => setDays(r.d)}>{r.l}</button>)}
        </div>
      </div>
      <div className="tbarline">
        {filter.country && <button type="button" className="tchip" onClick={() => setFilter({ ...filter, country: null })}>Krajina: {countryName(filter.country)} ✕</button>}
        {filter.device && <button type="button" className="tchip" onClick={() => setFilter({ ...filter, device: null })}>Zariadenie: {filter.device} ✕</button>}
        <span>{at ? `Aktualizované ${at.toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}, obnovuje sa samo každých 30 sekúnd` : "Načítavam"}</span>
        <button type="button" className="tlink" onClick={load} disabled={busy}>{busy ? "Obnovujem" : "Obnoviť teraz"}</button>
      </div>
      {!s ? <div className="panel">Načítavam…</div> : <TrafficView s={s} filter={filter} setFilter={setFilter} />}
    </>
  );
}
