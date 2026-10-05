"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { browserClient } from "@/lib/supabase";
import { LogoMark, LogoWord } from "../Logo";

type Ctx = { session: Session; toast: (m: string, err?: boolean) => void; revalidate: (slugs?: string[]) => Promise<void>; newLeads: number; refreshCounts: () => void; hasMfa: boolean; refreshMfa: () => void };
const IDLE_MS = 60 * 60 * 1000; // po hodine bez aktivity sa admin sám odhlási
const AdminCtx = createContext<Ctx | null>(null);
export const useAdmin = () => useContext(AdminCtx)!;

export function AdminApp({ children }: { children: React.ReactNode }) {
  const sb = browserClient();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [aal, setAal] = useState<{ need: boolean; has: boolean } | null>(null);
  const [t, setT] = useState<{ m: string; err?: boolean } | null>(null);
  const [newLeads, setNewLeads] = useState(0);
  const path = usePathname();

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, [sb]);

  const refreshMfa = useCallback(() => {
    sb.auth.mfa.getAuthenticatorAssuranceLevel().then(({ data }) =>
      setAal({ need: data?.nextLevel === "aal2" && data?.currentLevel !== "aal2", has: data?.nextLevel === "aal2" }));
  }, [sb]);

  useEffect(() => {
    if (!session) { setIsAdmin(null); setAal(null); return; }
    refreshMfa();
  }, [session, refreshMfa]);

  useEffect(() => {
    if (!session || !aal || aal.need) { setIsAdmin(null); return; }
    sb.rpc("is_admin").then(({ data }) => setIsAdmin(!!data));
  }, [session, aal, sb]);

  // tento prehliadač patrí adminovi: jeho návštevy webu sa nepočítajú ani po odhlásení
  useEffect(() => {
    if (!session) return;
    try { localStorage.setItem("rem-no-track", "1"); } catch { /* ignore */ }
  }, [session]);

  // automatické odhlásenie po dlhej nečinnosti
  useEffect(() => {
    if (!session) return;
    let last = Date.now();
    const touch = () => { last = Date.now(); };
    const evs = ["pointerdown", "keydown", "scroll"] as const;
    evs.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    const t = setInterval(() => { if (Date.now() - last > IDLE_MS) sb.auth.signOut(); }, 30000);
    return () => { evs.forEach((e) => window.removeEventListener(e, touch)); clearInterval(t); };
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
  if (aal?.need) return <MfaChallenge />;
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
    { href: "/admin/navstevnost", label: "Návštevnosť", icon: I("M4 20V10M10 20V4M16 20v-7M22 20H2") },
    { sec: "Nastavenia" },
    { href: "/admin/nastavenia", label: "Kalkulácia a doprava", icon: I("M5 3h14v18H5zM8 7h8M8 11h2M12 11h2M8 15h2M12 15h2") },
    { href: "/admin/obsah", label: "Texty webu", icon: I("M4 6h16M4 12h10M4 18h13") },
    { href: "/admin/upozornenia", label: "E-maily", icon: I("M4 6h16v12H4zM4 7l8 6 8-6") },
    { href: "/admin/ucet", label: "Účet", icon: I("M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0") }
  ] as ({ sec: string } | { href: string; label: string; icon: React.ReactNode; badge?: number })[];
  const on = (h: string) => (h === "/admin" ? path === "/admin" || path.startsWith("/admin/auta/") : path.startsWith(h));

  return (
    <AdminCtx.Provider value={{ session, toast, revalidate, newLeads, refreshCounts, hasMfa: !!aal?.has, refreshMfa }}>
      <div className="adm">
        <aside className="adm__nav">
          <Link href="/admin" className="brand">
            <LogoMark className="brand__mark" />
            <span style={{ display: "grid", gap: 5 }}><LogoWord className="brand__word" /><small style={{ fontSize: 11, color: "var(--rc-text-dim)" }}>Administrácia</small></span>
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
        <main className="adm__main">
          {aal && !aal.has && path !== "/admin/ucet" && (
            <div className="sec-warn">Účet chráni len heslo. Zapnite si dvojstupňové overenie cez aplikáciu v telefóne, aby sa do administrácie nedostal nikto ani s ukradnutým heslom. <Link href="/admin/ucet">Zapnúť v časti Účet</Link></div>
          )}
          {children}
        </main>
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
    if (error) setErr(/rate|too many/i.test(error.message) ? "Priveľa pokusov. Skúste to znova o pár minút." : "Nesprávny e-mail alebo heslo.");
  }
  return (
    <div className="login">
      <form className="panel" onSubmit={submit}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}><LogoMark className="brand__mark" /><LogoWord className="brand__word" /></div>
        <h1 style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.2, marginBottom: 20 }}>Prihlásenie do administrácie</h1>
        <div className="field"><label htmlFor="em">E-mail</label><input className="input" id="em" name="email" type="email" autoComplete="username" required /></div>
        <div className="field"><label htmlFor="pw">Heslo</label><input className="input" id="pw" name="password" type="password" autoComplete="current-password" required /></div>
        <button className="rc-btn rc-btn--primary rc-btn--block" disabled={busy}>{busy ? "Prihlasujem…" : "Prihlásiť"}</button>
        {err && <div className="fmsg err">{err}</div>}
      </form>
    </div>
  );
}

function MfaChallenge() {
  const sb = browserClient();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("code")).replace(/\D/g, "");
    if (code.length !== 6) return setErr("Zadajte 6 číslic z aplikácie.");
    setBusy(true); setErr("");
    const { data: f } = await sb.auth.mfa.listFactors();
    const factor = f?.totp?.find((x) => x.status === "verified");
    if (!factor) { setBusy(false); return setErr("Overenie nie je nastavené. Odhláste sa a prihláste znova."); }
    const { error } = await sb.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
    setBusy(false);
    if (error) setErr(/rate|too many/i.test(error.message) ? "Priveľa pokusov. Skúste to znova o pár minút." : "Nesprávny kód. Skúste aktuálny kód z aplikácie.");
  }
  return (
    <div className="login">
      <form className="panel" onSubmit={submit}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}><LogoMark className="brand__mark" /><LogoWord className="brand__word" /></div>
        <h1 style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.2, marginBottom: 8 }}>Overenie v dvoch krokoch</h1>
        <p className="note" style={{ margin: "0 0 18px" }}>Zadajte 6 miestny kód z overovacej aplikácie v telefóne.</p>
        <div className="field"><label htmlFor="otp">Kód</label><input className="input otp" id="otp" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]*" maxLength={7} autoFocus required /></div>
        <button className="rc-btn rc-btn--primary rc-btn--block" disabled={busy}>{busy ? "Overujem…" : "Overiť"}</button>
        {err && <div className="fmsg err">{err}</div>}
        <button type="button" className="tlink" style={{ marginTop: 16 }} onClick={() => sb.auth.signOut()}>Odhlásiť</button>
      </form>
    </div>
  );
}
