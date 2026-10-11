"use client";
import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { browserClient } from "@/lib/supabase";
import type { Lead, Mail } from "@/lib/types";
import { fmtDateTime } from "@/lib/format";
import { PARTS, PRESETS } from "@/lib/replyMail";
import { useAdmin } from "@/components/admin/AdminApp";
import { MailComposer } from "@/components/admin/MailComposer";
import { createMail, mailCars, mailData } from "@/components/admin/mailStore";

type CarOpt = { id: string; year: number | null; make: string; model: string; slug: string };

function Mails() {
  const sb = browserClient();
  const router = useRouter();
  const params = useSearchParams();
  const openId = params.get("m");
  const { toast } = useAdmin();
  const [mails, setMails] = useState<Mail[] | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [cars, setCars] = useState<CarOpt[]>([]);
  const [stF, setStF] = useState<"all" | Mail["status"]>("all");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [rcpt, setRcpt] = useState({ email: "", name: "" });

  const load = useCallback(async () => {
    const [{ data: m, error }, { data: l }, { data: c }] = await Promise.all([
      sb.from("mails").select("*").order("updated_at", { ascending: false }),
      sb.from("leads").select("*").order("created_at", { ascending: false }),
      sb.from("cars").select("id,year,make,model,slug").order("created_at", { ascending: false })
    ]);
    if (error) toast(error.message, true);
    setMails((m as Mail[]) || []);
    setLeads((l as Lead[]) || []);
    setCars(c || []);
  }, [sb, toast]);
  useEffect(() => { load(); }, [load]);

  const open = (id: string | null) => router.replace(id ? `/admin/emaily?m=${id}` : "/admin/emaily", { scroll: false });
  const current = openId ? (mails || []).find((m) => m.id === openId) : null;
  useEffect(() => { if (openId && mails && !current) toast("E-mail sa nenašiel.", true); }, [openId, mails, current, toast]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (mails || []).filter((m) => (stF === "all" || m.status === stF) && (!s || [m.to_email, m.to_name, m.subject, ...mailCars(m).map((c) => c.title)].join(" ").toLowerCase().includes(s)));
  }, [mails, stF, q]);

  // časti idú do e-mailu v poradí, v akom ich zakliknete; tú istú časť možno pridať aj viackrát až v editore
  const toggle = (id: string) => setPicked((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));
  async function create() {
    if (busy) return;
    setBusy(true);
    try {
      const m = await createMail(sb, { parts: picked, to_email: rcpt.email.trim(), to_name: rcpt.name.trim() });
      setMails((x) => [m, ...(x || [])]);
      setPicking(false); setPicked([]); setRcpt({ email: "", name: "" });
      open(m.id);
    } catch (e) { toast((e as Error).message, true); }
    setBusy(false);
  }
  async function duplicate(m: Mail) {
    try {
      const n = await createMail(sb, { data: mailData(m), to_email: m.to_email, to_name: m.to_name, lead: leads.find((l) => l.id === m.lead_id) || null });
      setMails((x) => [n, ...(x || [])]);
      open(n.id);
    } catch (e) { toast((e as Error).message, true); }
  }
  async function remove(m: Mail) {
    if (!confirm(`Zmazať e-mail ${m.subject || "bez predmetu"}?`)) return;
    const { error } = await sb.from("mails").delete().eq("id", m.id);
    if (error) return toast(error.message, true);
    setMails((x) => (x || []).filter((y) => y.id !== m.id));
  }

  return (
    <>
      <div className="adm__head">
        <h1>E-maily</h1>
        {!picking && <button className="rc-btn rc-btn--primary" onClick={() => setPicking(true)}>+ Nový e-mail</button>}
      </div>
      {picking ? (
        <div className="newmail">
          <h2>Nový e-mail</h2>
          <p className="note" style={{ margin: 0 }}>Zakliknite, čo má e-mail obsahovať. Časti pôjdu v poradí, v akom ich zakliknete. V editore ich potom môžete presúvať, pridávať aj mazať. Hlavičku s logom, podpis a kontakty má e-mail vždy.</p>
          <div className="row-actions" style={{ marginTop: 12 }}>
            {PRESETS.map((p) => <button key={p.label} type="button" className="rc-btn rc-btn--ghost rc-btn--sm" onClick={() => setPicked(p.parts)}>{p.label}</button>)}
            {picked.length > 0 && <button type="button" className="rc-btn rc-btn--ghost rc-btn--sm" onClick={() => setPicked([])}>Zrušiť výber</button>}
          </div>
          <div className="picks">
            {PARTS.map((p) => {
              const n = picked.indexOf(p.id);
              return <button key={p.id} type="button" className={n >= 0 ? "on" : ""} onClick={() => toggle(p.id)}><i>{n >= 0 ? n + 1 : ""}</i><span><b>{p.label}</b><small>{p.hint}</small></span></button>;
            })}
          </div>
          {picked.length > 0 && <div className="order">Poradie v e-maile: {picked.map((id, i) => <span key={id}>{i + 1}. {PARTS.find((p) => p.id === id)?.label}</span>)}</div>}
          <div className="reply__g" style={{ maxWidth: 720 }}>
            <div className="field"><label>E-mail adresáta (môžete doplniť neskôr)</label><input className="input" type="email" value={rcpt.email} placeholder="zakaznik@email.sk" onChange={(e) => setRcpt((x) => ({ ...x, email: e.target.value }))} /></div>
            <div className="field"><label>Meno alebo firma</label><input className="input" value={rcpt.name} placeholder="Ján Novák" onChange={(e) => setRcpt((x) => ({ ...x, name: e.target.value }))} /></div>
          </div>
          <div className="row-actions">
            <button type="button" className="rc-btn rc-btn--primary" disabled={busy} onClick={create}>{picked.length ? "Vytvoriť e-mail" : "Vytvoriť prázdny e-mail"}</button>
            <button type="button" className="rc-btn rc-btn--ghost" onClick={() => setPicking(false)}>Zrušiť</button>
          </div>
        </div>
      ) : <p className="note" style={{ marginTop: 0 }}>Tu píšete e-maily zákazníkom v jednotnom vzhľade, aj bez dopytu z webu. Rozpísané e-maily sa ukladajú samy a nájdete ich z každého zariadenia.</p>}
      <div className="toolbar">
        <select className="input" value={stF} onChange={(e) => setStF(e.target.value as typeof stF)}>
          <option value="all">Všetky</option>
          <option value="draft">Rozpísané</option>
          <option value="sent">Odoslané</option>
        </select>
        <input className="input" style={{ maxWidth: 320 }} value={q} placeholder="Hľadať meno, e-mail alebo auto" onChange={(e) => setQ(e.target.value)} />
        <span className="note" style={{ margin: 0 }}>{list.length} e-mailov</span>
      </div>
      {mails === null ? <p className="note">Načítavam…</p> : list.length === 0 ? <div className="empty">Zatiaľ žiadne e-maily. Začnite tlačidlom Nový e-mail.</div> : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Adresát</th><th>Predmet a autá</th><th>Stav</th><th>Upravené</th><th /></tr></thead>
            <tbody>
              {list.map((m) => {
                const cs = mailCars(m);
                return (
                  <tr key={m.id}>
                    <td className="name">{m.to_name || m.to_email || "Bez adresáta"}<small>{m.to_name ? m.to_email : ""}{m.lead_id ? <>{m.to_name && m.to_email ? " · " : ""}<Link className="link" href="/admin/dopyty">k dopytu</Link></> : null}</small></td>
                    <td className="name">{m.subject || "Bez predmetu"}<small>{cs.map((c) => c.title).join(", ")}</small></td>
                    <td><span className={`pill ${m.status === "sent" ? "published" : "draft"}`}>{m.status === "sent" ? "Odoslaný" : "Rozpísaný"}</span></td>
                    <td style={{ whiteSpace: "nowrap" }}>{fmtDateTime(m.status === "sent" && m.sent_at ? m.sent_at : m.updated_at)}</td>
                    <td>
                      <div className="row-actions" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
                        <button className="rc-btn rc-btn--primary rc-btn--sm" onClick={() => open(m.id)}>Otvoriť</button>
                        <button className="rc-btn rc-btn--ghost rc-btn--sm" onClick={() => duplicate(m)}>Duplikovať</button>
                        <button className="rc-btn rc-btn--ghost rc-btn--sm" onClick={() => remove(m)}>Zmazať</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {current && (
        <MailComposer
          key={current.id}
          mail={current}
          lead={leads.find((l) => l.id === current.lead_id) || null}
          cars={cars}
          onClose={(m) => { setMails((x) => [m, ...(x || []).filter((y) => y.id !== m.id)]); open(null); }}
        />
      )}
    </>
  );
}

export default function MailsPage() {
  return <Suspense fallback={<p className="note">Načítavam…</p>}><Mails /></Suspense>;
}
