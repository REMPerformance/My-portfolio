"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { browserClient } from "@/lib/supabase";
import { SITE } from "@/lib/site";

type Ctx = { session: Session; toast: (m: string, err?: boolean) => void; revalidate: (slugs?: string[]) => Promise<void>; newLeads: number; refreshCounts: () => void };
const AdminCtx = createContext<Ctx | null>(null);
export const useAdmin = () => useContext(AdminCtx)!;

export function AdminApp({ children }: { children: React.ReactNode }) {
  const sb = browserClient();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [t, setT] = useState<{ m: string; err?: boolean } | null>(null);
  const [newLeads, setNewLeads] = useState(0);
  const path = usePathname();

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, [sb]);

  useEffect(() => {
    if (!session) { setIsAdmin(null); return; }
    sb.rpc("is_admin").then(({ data }) => setIsAdmin(!!data));
  }, [session, sb]);

  const refreshCounts = useCallback(() => {
    sb.from("leads").select("id", { count: "exact", head: true }).eq("status", "new").then(({ count }) => setNewLeads(count || 0));
  }, [sb]);
  useEffect(() => { if (isAdmin) refreshCounts(); }, [isAdmin, refreshCounts, path]);

  const toast = useCallback((m: string, err = false) => {
    setT({ m, err });
    setTimeout(() => setT(null), 3500);
  }, []);

  const revalidate = useCallback(async (slugs: string[] = []) => {
    const tok = (await sb.auth.getSession()).data.session?.access_token;
    await fetch("/api/revalidate", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${tok}` }, body: JSON.stringify({ slugs }) }).catch(() => {});
  }, [sb]);

  if (session === undefined) return <div className="login"><p className="note">Načítavam…</p></div>;
  if (!session) return <Login />;
  if (isAdmin === null) return <div className="login"><p className="note">Overujem prístup…</p></div>;
  if (!isAdmin)
    return (
      <div className="login">
        <div className="panel">
          <h1 style={{ fontFamily: "var(--cond)", textTransform: "uppercase" }}>Bez prístupu</h1>
          <p className="sub">Účet {session.user.email} nemá administrátorské práva.</p>
          <button className="rc-btn rc-btn--ghost" style={{ marginTop: 16 }} onClick={() => sb.auth.signOut()}>Odhlásiť</button>
        </div>
      </div>
    );

  const nav = [
    { href: "/admin", label: "Autá" },
    { href: "/admin/auta/nove", label: "+ Pridať auto" },
    { href: "/admin/dopyty", label: "Dopyty", badge: newLeads },
    { href: "/admin/obsah", label: "Obsah webu" },
    { href: "/admin/nastavenia", label: "Kalkulačka" },
    { href: "/admin/upozornenia", label: "Upozornenia" },
    { href: "/admin/ucet", label: "Účet" }
  ];
  const on = (h: string) => (h === "/admin" ? path === "/admin" || (path.startsWith("/admin/auta/") && !path.endsWith("/nove")) : path.startsWith(h));

  return (
    <AdminCtx.Provider value={{ session, toast, revalidate, newLeads, refreshCounts }}>
      <div className="adm">
        <aside className="adm__nav">
          <Link href="/admin" className="brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SITE.logo} alt="RACEM" style={{ height: 22 }} />
            <span className="lbl"><b style={{ fontSize: 14 }}>Admin</b><small>REM Performance</small></span>
          </Link>
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className={on(n.href) ? "on" : ""}>
              {n.label}{n.badge ? <span className="badge">{n.badge}</span> : null}
            </Link>
          ))}
          <div className="sp" />
          <a href="/" target="_blank" rel="noopener">Zobraziť web ↗</a>
          <button onClick={() => sb.auth.signOut()}>Odhlásiť</button>
        </aside>
        <main className="adm__main">{children}</main>
      </div>
      {t && <div className={`toast${t.err ? " err" : ""}`} role="status">{t.m}</div>}
    </AdminCtx.Provider>
  );
}

function Login() {
  const sb = browserClient();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setErr("");
    const { error } = await sb.auth.signInWithPassword({ email: String(f.get("email")), password: String(f.get("password")) });
    setBusy(false);
    if (error) setErr("Nesprávny e-mail alebo heslo.");
  }
  return (
    <div className="login">
      <form className="panel" onSubmit={submit}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={SITE.logo} alt="RACEM" style={{ height: 28, marginBottom: 18 }} />
        <h1 style={{ fontFamily: "var(--cond)", fontSize: 34, textTransform: "uppercase", lineHeight: 1, marginBottom: 20 }}>Prihlásenie do adminu</h1>
        <div className="field"><label htmlFor="em">E-mail</label><input className="input" id="em" name="email" type="email" autoComplete="username" required defaultValue={SITE.email} /></div>
        <div className="field"><label htmlFor="pw">Heslo</label><input className="input" id="pw" name="password" type="password" autoComplete="current-password" required /></div>
        <button className="rc-btn rc-btn--primary rc-btn--block" disabled={busy}>{busy ? "Prihlasujem…" : "Prihlásiť"}</button>
        {err && <div className="fmsg err">{err}</div>}
      </form>
    </div>
  );
}
