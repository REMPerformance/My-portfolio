"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase";
import { useAdmin } from "@/components/admin/AdminApp";
import { CONTRACT_RE, PHASE_STATE, PORTS_FROM, PORTS_TO, VIN_RE, defaultMilestones, fShort, normContract, normVin, resolve, type Milestone } from "@/lib/tracking";

type Row = { id: string; vin: string; contract_no: string; car_label: string; customer_name: string; customer_email: string; port_from: string; port_to: string; status: string; milestones: Milestone[]; updated_at: string };
const ST: Record<string, string> = { active: "Aktívna", done: "Ukončená", hidden: "Skrytá" };

export default function AdminTracking() {
  const sb = browserClient();
  const router = useRouter();
  const { toast } = useAdmin();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ vin: "", contract_no: "", car_label: "", customer_name: "", customer_email: "", port_from: "savannah", port_to: "bremerhaven" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await sb.from("shipments").select("id,vin,contract_no,car_label,customer_name,customer_email,port_from,port_to,status,milestones,updated_at").order("updated_at", { ascending: false });
    if (error) toast(error.message, true);
    setRows((data as Row[]) || []);
  }, [sb, toast]);
  useEffect(() => { load(); }, [load]);

  const shown = useMemo(() => (rows || []).filter((r) => `${r.vin} ${r.contract_no} ${r.car_label} ${r.customer_name} ${r.customer_email}`.toLowerCase().includes(q.toLowerCase())), [rows, q]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const vin = normVin(f.vin), contract_no = normContract(f.contract_no);
    if (!VIN_RE.test(vin)) return toast("VIN musí mať 17 znakov bez písmen I, O a Q.", true);
    if (!CONTRACT_RE.test(contract_no)) return toast("Zadajte číslo zmluvy, napríklad REM261026A.", true);
    if (!f.car_label.trim()) return toast("Zadajte názov auta.", true);
    setBusy(true);
    const { data, error } = await sb.from("shipments").insert({ ...f, vin, contract_no, car_label: f.car_label.trim(), customer_email: f.customer_email.trim(), origin: PORTS_FROM[f.port_from]?.country || "", milestones: defaultMilestones(f.port_from, f.port_to) }).select("id").single();
    setBusy(false);
    if (error) return toast(/duplicate|unique/i.test(error.message) ? "Zásielka s týmto VIN a zmluvou už existuje." : error.message, true);
    router.push(`/admin/sledovanie/${data.id}`);
  }

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  return (
    <>
      <div className="adm__head">
        <h1>Sledovanie zásielok</h1>
        <div className="row-actions">
          <a className="rc-btn rc-btn--ghost" href="/sledovanie" target="_blank" rel="noopener">Stránka sledovania ↗</a>
          <button className="rc-btn rc-btn--primary" onClick={() => setOpen((o) => !o)}>{open ? "Zavrieť" : "+ Nová zásielka"}</button>
        </div>
      </div>
      {open && (
        <form className="panel" style={{ marginBottom: 20 }} onSubmit={create}>
          <h2>Nová zásielka</h2>
          <div className="three">
            <div className="field"><label htmlFor="n-vin">VIN</label><input className="input" id="n-vin" value={f.vin} maxLength={17} onChange={(e) => setF((x) => ({ ...x, vin: normVin(e.target.value) }))} /></div>
            <div className="field"><label htmlFor="n-con">Číslo zmluvy</label><input className="input" id="n-con" value={f.contract_no} onChange={(e) => setF((x) => ({ ...x, contract_no: normContract(e.target.value) }))} /></div>
            <div className="field"><label htmlFor="n-car">Auto</label><input className="input" id="n-car" value={f.car_label} placeholder="Kia Carnival 2024" onChange={set("car_label")} /></div>
            <div className="field"><label htmlFor="n-name">Zákazník</label><input className="input" id="n-name" value={f.customer_name} onChange={set("customer_name")} /></div>
            <div className="field"><label htmlFor="n-mail">E-mail zákazníka</label><input className="input" id="n-mail" type="email" value={f.customer_email} onChange={set("customer_email")} /></div>
            <div className="field"><label htmlFor="n-pf">Prístav odoslania</label><select className="input" id="n-pf" value={f.port_from} onChange={set("port_from")}>{Object.entries(PORTS_FROM).map(([k, p]) => <option key={k} value={k}>{p.n} ({p.country})</option>)}</select></div>
            <div className="field"><label htmlFor="n-pt">Prístav určenia</label><select className="input" id="n-pt" value={f.port_to} onChange={set("port_to")}>{Object.entries(PORTS_TO).map(([k, p]) => <option key={k} value={k}>{p.n}</option>)}</select></div>
          </div>
          <button className="rc-btn rc-btn--primary" disabled={busy}>{busy ? "Vytváram…" : "Vytvoriť zásielku"}</button>
        </form>
      )}
      <div className="toolbar"><input className="input" style={{ maxWidth: 340 }} value={q} placeholder="Hľadať VIN, zmluvu, auto alebo zákazníka" onChange={(e) => setQ(e.target.value)} /></div>
      {rows === null ? <p className="note">Načítavam…</p> : shown.length === 0 ? (
        <div className="empty">Zatiaľ žiadne zásielky. Vytvorte prvú tlačidlom Nová zásielka, zákazník ju potom nájde na stránke sledovania podľa VIN a čísla zmluvy.</div>
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Auto</th><th>Zmluva</th><th>Zákazník</th><th>Trasa</th><th>Aktuálny krok</th><th>Stav</th><th>Zmena</th></tr></thead>
            <tbody>
              {shown.map((r) => {
                const R = resolve(r.milestones || []);
                return (
                  <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => router.push(`/admin/sledovanie/${r.id}`)}>
                    <td className="name"><Link href={`/admin/sledovanie/${r.id}`}>{r.car_label || "Bez názvu"}</Link><small>{r.vin}</small></td>
                    <td>{r.contract_no}</td>
                    <td className="name">{r.customer_name || "—"}<small>{r.customer_email}</small></td>
                    <td style={{ whiteSpace: "nowrap" }}>{PORTS_FROM[r.port_from]?.n} → {PORTS_TO[r.port_to]?.n}</td>
                    <td className="name">{R.allDone ? "Odovzdané" : R.cur?.t || "—"}<small>{R.allDone ? "" : PHASE_STATE[R.cur?.ph ?? 0]}</small></td>
                    <td><span className={`pill ${r.status === "active" ? "published" : "draft"}`}>{ST[r.status] || r.status}</span></td>
                    <td style={{ whiteSpace: "nowrap" }}>{fShort(new Date(r.updated_at).getTime())}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
