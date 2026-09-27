"use client";
import { useEffect, useState } from "react";
import { browserClient } from "@/lib/supabase";
import { useAdmin } from "@/components/admin/AdminApp";
import { DEFAULT_NOTIFY, mergeNotify, type NotifySettings } from "@/lib/notify";

export default function NotifyAdmin() {
  const sb = browserClient();
  const { toast, session } = useAdmin();
  const [n, setN] = useState<NotifySettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ configured: boolean } | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    sb.from("settings").select("value").eq("key", "notify").maybeSingle().then(({ data }) => setN(mergeNotify(data?.value)));
    fetch("/api/lead/status").then((r) => r.json()).then(setStatus).catch(() => setStatus({ configured: false }));
  }, [sb]);
  if (!n) return <p className="note">Načítavam…</p>;

  async function save() {
    setSaving(true);
    const { error } = await sb.from("settings").upsert({ key: "notify", value: n, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) return toast(error.message, true);
    toast("Nastavenia upozornení uložené");
  }
  async function test() {
    setTesting(true);
    const r = await fetch("/api/lead/test", { method: "POST", headers: { authorization: `Bearer ${session.access_token}` } });
    const j = await r.json().catch(() => ({}));
    setTesting(false);
    toast(r.ok ? "Testovací e-mail odoslaný" : `Nepodarilo sa: ${j.error || r.status}`, !r.ok);
  }

  return (
    <>
      <div className="adm__head">
        <h1>Upozornenia</h1>
        <div className="row-actions">
          <button className="rc-btn rc-btn--ghost" onClick={test} disabled={testing || !status?.configured}>{testing ? "Posielam…" : "Poslať testovací e-mail"}</button>
          <button className="rc-btn rc-btn--primary" onClick={save} disabled={saving}>{saving ? "Ukladám…" : "Uložiť"}</button>
        </div>
      </div>

      {status && !status.configured && (
        <div className="risk" style={{ maxWidth: 900, marginBottom: 16 }}>
          <b>E-maily zatiaľ nejdú</b>
          <p>Chýba napojenie na e-mailovú službu Resend (premenná <code>RESEND_API_KEY</code> vo Verceli). Dopyty sa ukladajú do adminu aj bez nej. Po nastavení začnú chodiť e-maily automaticky.</p>
        </div>
      )}

      <div className="panel" style={{ maxWidth: 900 }}>
        <h2>E-mail pri novom dopyte</h2>
        <label className="switch" style={{ marginBottom: 14 }}><input type="checkbox" checked={n.notifyAdmin} onChange={(e) => setN({ ...n, notifyAdmin: e.target.checked })} /> Posielať mi e-mail pri každom novom dopyte</label>
        <div className="field">
          <label>Komu posielať (oddeľte čiarkou)</label>
          <input className="input" value={n.adminEmails.join(", ")} onChange={(e) => setN({ ...n, adminEmails: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} />
        </div>
      </div>

      <div className="panel" style={{ maxWidth: 900, marginTop: 16 }}>
        <h2>Automatická odpoveď zákazníkovi</h2>
        <label className="switch" style={{ marginBottom: 14 }}><input type="checkbox" checked={n.autoReply} onChange={(e) => setN({ ...n, autoReply: e.target.checked })} /> Poslať zákazníkovi potvrdenie hneď po odoslaní dopytu</label>
        <div className="two">
          <div className="field"><label>Meno odosielateľa</label><input className="input" value={n.fromName} onChange={(e) => setN({ ...n, fromName: e.target.value })} /></div>
          <div className="field"><label>Predmet</label><input className="input" value={n.replySubject} onChange={(e) => setN({ ...n, replySubject: e.target.value })} /></div>
        </div>
        <div className="field">
          <label>Text e-mailu</label>
          <textarea className="input" rows={9} value={n.replyBody} onChange={(e) => setN({ ...n, replyBody: e.target.value })} />
          <span className="hint">Premenné: <code>{"{meno}"}</code>, <code>{"{auto}"}</code>, <code>{"{auto_veta}"}</code> (napr. „ na auto 2020 Ford Mustang“), <code>{"{rozpocet}"}</code>, <code>{"{odkaz}"}</code> (odkaz na auto).</span>
        </div>
        <button className="rc-btn rc-btn--ghost rc-btn--sm" onClick={() => setN({ ...n, replySubject: DEFAULT_NOTIFY.replySubject, replyBody: DEFAULT_NOTIFY.replyBody })}>Obnoviť pôvodný text</button>
      </div>
    </>
  );
}
