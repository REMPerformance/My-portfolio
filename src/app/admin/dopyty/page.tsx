"use client";
import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { browserClient } from "@/lib/supabase";
import type { Lead } from "@/lib/types";
import { eur, fmtDateTime } from "@/lib/format";
import { useAdmin } from "@/components/admin/AdminApp";

const STATUS: Record<Lead["status"], string> = { new: "Nový", contacted: "Kontaktovaný", contract: "Zmluva", deposit: "Záloha prijatá", won: "Vydražené", lost: "Neúspešné" };

function Leads() {
  const sb = browserClient();
  const { toast, refreshCounts } = useAdmin();
  const params = useSearchParams();
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [cars, setCars] = useState<{ id: string; year: number | null; make: string; model: string; slug: string }[]>([]);
  const [carF, setCarF] = useState(params.get("auto") || "all");
  const [stF, setStF] = useState("all");

  const load = useCallback(async () => {
    const [{ data: l, error }, { data: c }] = await Promise.all([
      sb.from("leads").select("*").order("created_at", { ascending: false }),
      sb.from("cars").select("id,year,make,model,slug").order("created_at", { ascending: false })
    ]);
    if (error) toast(error.message, true);
    setLeads((l as Lead[]) || []);
    setCars(c || []);
  }, [sb, toast]);
  useEffect(() => { load(); }, [load]);

  const list = useMemo(() => (leads || []).filter((l) => (carF === "all" || (carF === "none" ? !l.car_id : l.car_id === carF)) && (stF === "all" || l.status === stF)), [leads, carF, stF]);

  async function update(l: Lead, patch: Partial<Lead>) {
    const { error } = await sb.from("leads").update(patch).eq("id", l.id);
    if (error) return toast(error.message, true);
    setLeads((ls) => (ls || []).map((x) => (x.id === l.id ? { ...x, ...patch } : x)));
    refreshCounts();
  }
  async function remove(l: Lead) {
    if (!confirm(`Zmazať dopyt od ${l.name}?`)) return;
    const { error } = await sb.from("leads").delete().eq("id", l.id);
    if (error) return toast(error.message, true);
    setLeads((ls) => (ls || []).filter((x) => x.id !== l.id));
    refreshCounts();
  }
  function exportCsv() {
    const rows = [["Dátum", "Auto", "Meno", "E-mail", "Telefón", "Rozpočet", "Stav", "Odkaz", "Správa", "Poznámka"]];
    list.forEach((l) => rows.push([fmtDateTime(l.created_at), l.car_label || "", l.name, l.email, l.phone, String(l.max_budget_eur ?? ""), STATUS[l.status], l.link || "", l.message || "", l.admin_note || ""]));
    const csv = "﻿" + rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `dopyty-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const carName = (id: string | null) => { const c = cars.find((x) => x.id === id); return c ? `${c.year ?? ""} ${c.make} ${c.model}` : null; };

  return (
    <>
      <div className="adm__head">
        <h1>Dopyty</h1>
        <button className="rc-btn rc-btn--ghost" onClick={exportCsv} disabled={!list.length}>Export CSV</button>
      </div>
      <div className="toolbar">
        <select className="input" value={carF} onChange={(e) => setCarF(e.target.value)}>
          <option value="all">Všetky autá</option>
          <option value="none">Bez konkrétneho auta</option>
          {cars.map((c) => <option key={c.id} value={c.id}>{c.year} {c.make} {c.model}</option>)}
        </select>
        <select className="input" value={stF} onChange={(e) => setStF(e.target.value)}>
          <option value="all">Všetky stavy</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <span className="note" style={{ margin: 0 }}>{list.length} dopytov</span>
      </div>
      {leads === null ? <p className="note">Načítavam…</p> : list.length === 0 ? <div className="empty">Zatiaľ žiadne dopyty.</div> : (
        <div className="leads">
          {list.map((l) => (
            <div key={l.id} className={`lead-card${l.status === "new" ? " is-new" : ""}`}>
              <div className="top">
                <div className="who">
                  <b>{l.name}</b>
                  <small>{fmtDateTime(l.created_at)} · {l.car_id ? <Link className="link" href={`/admin/auta/${l.car_id}`}>{carName(l.car_id) || l.car_label}</Link> : l.car_label || "Všeobecný dopyt"}</small>
                </div>
                <div className="row-actions">
                  <select className="input" style={{ width: "auto", padding: "8px 36px 8px 12px" }} value={l.status} onChange={(e) => update(l, { status: e.target.value as Lead["status"] })}>
                    {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <button className="rc-btn rc-btn--ghost rc-btn--sm" onClick={() => remove(l)}>Zmazať</button>
                </div>
              </div>
              <div className="meta">
                <a href={`tel:${l.phone.replace(/\s/g, "")}`}>{l.phone}</a>
                <a href={`mailto:${l.email}?subject=${encodeURIComponent("REM Performance – " + (l.car_label || "dopyt"))}`}>{l.email}</a>
                {l.max_budget_eur ? <span>Rozpočet: <b>{eur(l.max_budget_eur)}</b></span> : null}
                {l.link && <a href={l.link} target="_blank" rel="noopener noreferrer">Odkaz na auto ↗</a>}
              </div>
              {l.message && <div className="msg">{l.message}</div>}
              <input className="input" placeholder="Interná poznámka (uloží sa po opustení poľa)" defaultValue={l.admin_note || ""} onBlur={(e) => e.target.value !== (l.admin_note || "") && update(l, { admin_note: e.target.value || null })} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function LeadsPage() {
  return <Suspense fallback={<p className="note">Načítavam…</p>}><Leads /></Suspense>;
}
