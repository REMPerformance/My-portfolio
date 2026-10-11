"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { browserClient } from "@/lib/supabase";
import type { Lead, Mail } from "@/lib/types";
import { eur, fmtDate, num } from "@/lib/format";
import { OFFER_STATUS, offerFilled, type Offer, type OfferStatus } from "@/lib/replyMail";
import { useAdmin } from "@/components/admin/AdminApp";
import { mailData } from "@/components/admin/mailStore";

/** Jedno auto ponúknuté jednému človeku: riadok evidencie. */
type Row = { mail: Mail; sec: number; offer: Offer; person: string; email: string; date: string; sent: boolean };

const n = (s: string) => Number(String(s).replace(/[^\d]/g, "")) || 0;
const link = (u: string) => (/^https?:\/\//i.test(u.trim()) ? u.trim() : "");

export default function OffersPage() {
  const sb = browserClient();
  const { toast } = useAdmin();
  const [mails, setMails] = useState<Mail[] | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [q, setQ] = useState("");
  const [stF, setStF] = useState<"all" | OfferStatus>("all");
  const [sentOnly, setSentOnly] = useState(false);

  const load = useCallback(async () => {
    const [{ data: m, error }, { data: l }] = await Promise.all([
      sb.from("mails").select("*").order("created_at", { ascending: false }),
      sb.from("leads").select("*")
    ]);
    if (error) toast(error.message, true);
    setMails((m as Mail[]) || []);
    setLeads((l as Lead[]) || []);
  }, [sb, toast]);
  useEffect(() => { load(); }, [load]);

  const rows = useMemo<Row[]>(() => (mails || []).flatMap((mail) => {
    const lead = leads.find((l) => l.id === mail.lead_id);
    const email = (mail.to_email || lead?.email || "").trim().toLowerCase();
    const person = mail.to_name.trim() || lead?.name?.trim() || email || "Bez adresáta";
    return mailData(mail).sections.flatMap((s, sec) => (s.kind === "offer" && s.offer && offerFilled(s.offer)
      ? [{ mail, sec, offer: s.offer, person, email, date: (mail.status === "sent" && mail.sent_at) || mail.created_at, sent: mail.status === "sent" }] : []));
  }), [mails, leads]);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) => (stF === "all" || r.offer.status === stF) && (!sentOnly || r.sent) && (!s || [r.person, r.email, r.offer.title, r.offer.vin].join(" ").toLowerCase().includes(s)));
  }, [rows, q, stF, sentOnly]);

  // zoskupenie podľa človeka: rozhoduje e-mail, bez neho meno
  const groups = useMemo(() => {
    const map = new Map<string, { person: string; email: string; lead: string | null; rows: Row[] }>();
    for (const r of shown) {
      const k = r.email || r.person.toLowerCase();
      const g = map.get(k) || { person: r.person, email: r.email, lead: r.mail.lead_id, rows: [] };
      g.rows.push(r);
      if (!g.lead) g.lead = r.mail.lead_id;
      map.set(k, g);
    }
    return [...map.values()].sort((a, b) => (a.rows[0].date < b.rows[0].date ? 1 : -1));
  }, [shown]);

  /** Stav a poznámka sa ukladajú priamo k autu v e-maile, v ktorom bolo ponúknuté. */
  async function update(r: Row, p: Partial<Pick<Offer, "status" | "internalNote">>) {
    const d = mailData(r.mail);
    const data = { ...d, sections: d.sections.map((s, i) => (i === r.sec && s.offer ? { ...s, offer: { ...s.offer, ...p } } : s)) };
    setMails((x) => (x || []).map((m) => (m.id === r.mail.id ? { ...m, data } : m)));
    const { error } = await sb.from("mails").update({ data }).eq("id", r.mail.id);
    if (error) { toast(error.message, true); load(); }
  }

  function exportCsv() {
    const out = [["Zákazník", "E-mail", "Auto", "VIN", "Suma vydraženia", "Mena", "Bez prihlásenia EUR", "S prihlásením EUR", "Dátum", "E-mail odoslaný", "Stav", "Inzerát", "Poznámka"]];
    shown.forEach((r) => out.push([r.person, r.email, r.offer.title, r.offer.vin, r.offer.estBid, r.offer.currency, r.offer.priceNoReg, r.offer.priceReg, fmtDate(r.date), r.sent ? "áno" : "nie", OFFER_STATUS[r.offer.status], r.offer.sourceUrl, r.offer.internalNote]));
    const csv = "﻿" + out.map((x) => x.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `ponuky-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <>
      <div className="adm__head">
        <h1>Evidencia ponúk</h1>
        <button className="rc-btn rc-btn--ghost" onClick={exportCsv} disabled={!shown.length}>Export CSV</button>
      </div>
      <p className="note" style={{ marginTop: 0 }}>Každé auto, ktoré ste komu ponúkli v e-maile. Evidencia sa plní sama z časti E-maily, tu si len označíte, ako ponuka dopadla.</p>
      <div className="toolbar">
        <input className="input" style={{ maxWidth: 320 }} value={q} placeholder="Hľadať meno, e-mail, auto alebo VIN" onChange={(e) => setQ(e.target.value)} />
        <select className="input" value={stF} onChange={(e) => setStF(e.target.value as typeof stF)}>
          <option value="all">Všetky stavy</option>
          {(Object.keys(OFFER_STATUS) as OfferStatus[]).map((k) => <option key={k} value={k}>{OFFER_STATUS[k]}</option>)}
        </select>
        <label className="note" style={{ margin: 0, display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}><input type="checkbox" checked={sentOnly} onChange={(e) => setSentOnly(e.target.checked)} /> len odoslané</label>
        <span className="note" style={{ margin: 0 }}>{shown.length} áut, {groups.length} ľudí</span>
      </div>
      {mails === null ? <p className="note">Načítavam…</p> : groups.length === 0 ? <div className="empty">Zatiaľ žiadne ponuky. Pridajú sa samy, keď v časti <Link href="/admin/emaily">E-maily</Link> pošlete niekomu auto.</div> : groups.map((g) => (
        <div className="offers" key={g.email || g.person}>
          <div className="offers__head">
            <div><b>{g.person}</b><small>{g.email}{g.lead ? <>{g.email ? " · " : ""}<Link className="link" href="/admin/dopyty">dopyt z webu</Link></> : null}</small></div>
            <span className="note" style={{ margin: 0 }}>{g.rows.length} {g.rows.length === 1 ? "auto" : g.rows.length < 5 ? "autá" : "áut"}</span>
          </div>
          <div className="tbl-wrap" style={{ border: 0, borderRadius: 0 }}>
            <table className="tbl">
              <thead><tr><th>Auto</th><th>Suma vydraženia</th><th>Cena na Slovensku</th><th>E-mail</th><th>Stav</th><th>Poznámka</th><th /></tr></thead>
              <tbody>
                {g.rows.map((r) => {
                  const o = r.offer, src = link(o.sourceUrl), web = link(o.carUrl);
                  return (
                    <tr key={r.mail.id + r.sec}>
                      <td className="name">{o.title.trim() || "Auto bez názvu"}<small>{[o.year, o.vin].filter(Boolean).join(" · ")}</small></td>
                      <td style={{ whiteSpace: "nowrap" }}>{n(o.estBid) ? `${num(n(o.estBid))} ${o.currency}` : "—"}</td>
                      <td className="name" style={{ whiteSpace: "nowrap" }}>{n(o.priceReg) ? eur(n(o.priceReg)) : "—"}<small>{n(o.priceNoReg) ? `bez prihlásenia ${eur(n(o.priceNoReg))}` : ""}</small></td>
                      <td style={{ whiteSpace: "nowrap" }}><span className={`pill ${r.sent ? "published" : "draft"}`}>{r.sent ? `Odoslané ${fmtDate(r.date)}` : "Rozpísané"}</span></td>
                      <td>
                        <select className={`input offers__st st-${o.status}`} value={o.status} onChange={(e) => update(r, { status: e.target.value as OfferStatus })}>
                          {(Object.keys(OFFER_STATUS) as OfferStatus[]).map((k) => <option key={k} value={k}>{OFFER_STATUS[k]}</option>)}
                        </select>
                      </td>
                      <td><input className="input offers__note" placeholder="Interná poznámka" defaultValue={o.internalNote} onBlur={(e) => e.target.value !== o.internalNote && update(r, { internalNote: e.target.value })} /></td>
                      <td>
                        <div className="row-actions" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
                          {src && <a className="rc-btn rc-btn--ghost rc-btn--sm" href={src} target="_blank" rel="noopener noreferrer">Inzerát ↗</a>}
                          {web && <a className="rc-btn rc-btn--ghost rc-btn--sm" href={web} target="_blank" rel="noopener noreferrer">Web ↗</a>}
                          <Link className="rc-btn rc-btn--ghost rc-btn--sm" href={`/admin/emaily?m=${r.mail.id}`}>E-mail</Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </>
  );
}
