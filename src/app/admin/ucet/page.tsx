"use client";
import { useState } from "react";
import { browserClient } from "@/lib/supabase";
import { useAdmin } from "@/components/admin/AdminApp";

export default function Account() {
  const sb = browserClient();
  const { session, toast } = useAdmin();
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const a = String(f.get("p1")), b = String(f.get("p2"));
    if (a.length < 10) return toast("Heslo musí mať aspoň 10 znakov.", true);
    if (a !== b) return toast("Heslá sa nezhodujú.", true);
    setBusy(true);
    const { error } = await sb.auth.updateUser({ password: a });
    setBusy(false);
    if (error) return toast(error.message, true);
    (e.target as HTMLFormElement).reset();
    toast("Heslo zmenené");
  }
  return (
    <>
      <div className="adm__head"><h1>Účet</h1></div>
      <form className="panel" style={{ maxWidth: 520 }} onSubmit={submit}>
        <h2>Zmena hesla</h2>
        <p className="note" style={{ marginTop: 0 }}>Prihlásený: {session.user.email}</p>
        <div className="field"><label htmlFor="p1">Nové heslo</label><input className="input" id="p1" name="p1" type="password" autoComplete="new-password" required /></div>
        <div className="field"><label htmlFor="p2">Nové heslo znova</label><input className="input" id="p2" name="p2" type="password" autoComplete="new-password" required /></div>
        <button className="rc-btn rc-btn--primary" disabled={busy}>{busy ? "Ukladám…" : "Zmeniť heslo"}</button>
      </form>
    </>
  );
}
