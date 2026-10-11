"use client";
import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { browserClient } from "@/lib/supabase";
import type { Lead, Mail } from "@/lib/types";
import { fmtDateTime } from "@/lib/format";
import { TEMPLATES } from "@/lib/replyMail";
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

  async function create(template: string) {
    if (busy) return;
    setBusy(true);
    try {
      const m = await createMail(sb, { template });
      setMails((x) => [m, ...(x || [])]);
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
      </div>
      <p className="note" style={{ marginTop: 0 }}>Tu píšete e-maily zákazníkom v jednotnom vzhľade, aj bez dopytu z webu. Rozpísané e-maily sa ukladajú samy a nájdete ich z každého zariadenia.</p>
      <div className="tpls">
        {TEMPLATES.map((t) => <button key={t.id} type="button" disabled={busy} onClick={() => create(t.id)}><b>+ {t.label}</b><small>{t.hint}</small></button>)}
      </div>
      <div className="toolbar">
        <select className="input" value={stF} onChange={(e) => setStF(e.target.value as typeof stF)}>
          <option value="all">Všetky</option>
          <option value="draft">Rozpísané</option>
          <option value="sent">Odoslané</option>
        </select>
        <input className="input" style={{ maxWidth: 320 }} value={q} placeholder="Hľadať meno, e-mail alebo auto" onChange={(e) => setQ(e.target.value)} />
        <span className="note" style={{ margin: 0 }}>{list.length} e-mailov</span>
      </div>
      {mails === null ? <p className="note">Načítavam…</p> : list.length === 0 ? <div className="empty">Zatiaľ žiadne e-maily. Začnite jednou z predlôh vyššie.</div> : (
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
