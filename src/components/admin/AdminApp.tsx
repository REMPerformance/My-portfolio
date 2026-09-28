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
          <h1 style={{ fontSize: 24 }}>Bez prístupu</h1>
          <p className="sub">Účet {session.user.email} nemá administrátorské práva.</p>
          <button className="rc-btn rc-btn--ghost" style={{ marginTop: 16 }} onClick={() => sb.auth.signOut()}>Odhlásiť</button>
        </div>
      </div>
    );

  const I = (d: string) => <svg viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg>;
  const nav = [
    { sec: "Ponuka" },
    { href: "/admin", label: "Autá", icon: I("M5 17h14M6 17l1.5-5h9L18 17M7 17v2M17 17v2M8 12l1-3h6l1 3") },
    { href: "/admin/dopyty", label: "Dopyty", badge: newLeads, icon: I("M4 5h16v11H8l-4 4z") },
    { sec: "Nastavenia" },
    { href: "/admin/nastavenia", label: "Kalkulácia a doprava", icon: I("M5 3h14v18H5zM8 7h8M8 11h2M12 11h2M8 15h2M12 15h2") },
    { href: "/admin/obsah", label: "Texty webu", icon: I("M4 6h16M4 12h10M4 18h13") },
    { href: "/admin/upozornenia", label: "E-maily", icon: I("M4 6h16v12H4zM4 7l8 6 8-6") },
    { href: "/admin/ucet", label: "Účet", icon: I("M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0") }
  ] as ({ sec: string } | { href: string; label: string; icon: React.ReactNode; badge?: number })[];
  const on = (h: string) => (h === "/admin" ? path === "/admin" || path.startsWith("/admin/auta/") : path.startsWith(h));

  return (
    <AdminCtx.Provider value={{ session, toast, revalidate, newLeads, refreshCounts }}>
      <div className="adm">
        <aside className="adm__nav">
          <Link href="/admin" className="brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SITE.logo} alt="RACEM" style={{ height: 22 }} />
            <span className="lbl"><b style={{ fontSize: 14 }}>REM Performance</b><small>Administrácia</small></span>
          </Link>
          <Link href="/admin/auta/nove" className="cta">+ Pridať auto</Link>
          {nav.map((n) =>
            "sec" in n ? <div className="sec" key={n.sec}>{n.sec}</div> : (
              <Link key={n.href} href={n.href} className={on(n.href) ? "on" : ""}>
                {n.icon}{n.label}{n.badge ? <span className="badge">{n.badge}</span> : null}
              </Link>
            )
          )}
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
        <h1 style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.2, marginBottom: 20 }}>Prihlásenie do administrácie</h1>
        <div className="field"><label htmlFor="em">E-mail</label><input className="input" id="em" name="email" type="email" autoComplete="username" required defaultValue={SITE.email} /></div>
        <div className="field"><label htmlFor="pw">Heslo</label><input className="input" id="pw" name="password" type="password" autoComplete="current-password" required /></div>
        <button className="rc-btn rc-btn--primary rc-btn--block" disabled={busy}>{busy ? "Prihlasujem…" : "Prihlásiť"}</button>
        {err && <div className="fmsg err">{err}</div>}
      </form>
    </div>
  );
}
