"use client";
import { useCallback, useEffect, useState } from "react";
import { browserClient } from "@/lib/supabase";
import { useAdmin } from "@/components/admin/AdminApp";

type Factor = { id: string; friendly_name?: string; status: string; created_at: string };
type Sess = { id: string; created: string; seen: string; ip: string | null; ua: string | null; aal: string | null; current: boolean };
type Enroll = { id: string; qr: string; secret: string };

const when = (t: string) => new Date(t).toLocaleString("sk-SK", { day: "numeric", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
function device(ua: string | null) {
  if (!ua) return "Neznáme zariadenie";
  const os = /iphone|ipad/i.test(ua) ? "iPhone alebo iPad" : /android/i.test(ua) ? "Android" : /windows/i.test(ua) ? "Windows" : /mac os/i.test(ua) ? "Mac" : /linux/i.test(ua) ? "Linux" : "Iné zariadenie";
  const br = /edg\//i.test(ua) ? "Edge" : /opr\//i.test(ua) ? "Opera" : /firefox/i.test(ua) ? "Firefox" : /chrome|crios/i.test(ua) ? "Chrome" : /safari/i.test(ua) ? "Safari" : "";
  return br ? `${os}, ${br}` : os;
}

export default function Account() {
  const sb = browserClient();
  const { session, toast, refreshMfa } = useAdmin();
  const [busy, setBusy] = useState(false);
  const [factors, setFactors] = useState<Factor[] | null>(null);
  const [enroll, setEnroll] = useState<Enroll | null>(null);
  const [sessions, setSessions] = useState<Sess[]>([]);

  const load = useCallback(async () => {
    const { data } = await sb.auth.mfa.listFactors();
    setFactors(((data?.all || []) as Factor[]).filter((f) => f.status === "verified"));
    const { data: ss } = await sb.rpc("admin_sessions");
    setSessions((ss as Sess[]) || []);
  }, [sb]);
  useEffect(() => { load(); }, [load]);

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const a = String(f.get("p1")), b = String(f.get("p2"));
    if (a.length < 12) return toast("Heslo musí mať aspoň 12 znakov.", true);
    if (!/[a-z]/.test(a) || !/[A-Z]/.test(a) || !/\d/.test(a)) return toast("Heslo musí obsahovať malé aj veľké písmeno a číslicu.", true);
    if (a !== b) return toast("Heslá sa nezhodujú.", true);
    setBusy(true);
    const { error } = await sb.auth.updateUser({ password: a });
    setBusy(false);
    if (error) return toast(error.message, true);
    form.reset();
    await sb.auth.signOut({ scope: "others" });
    load();
    toast("Heslo zmenené, ostatné zariadenia boli odhlásené");
  }

  async function startEnroll() {
    setBusy(true);
    // odstráni nedokončené pokusy, aby nezavadzali
    const { data: all } = await sb.auth.mfa.listFactors();
    for (const f of (all?.all || []) as Factor[]) if (f.status !== "verified") await sb.auth.mfa.unenroll({ factorId: f.id });
    const { data, error } = await sb.auth.mfa.enroll({ factorType: "totp", friendlyName: `Telefón ${new Date().toLocaleDateString("sk-SK")}`, issuer: "REM Performance admin" });
    setBusy(false);
    if (error || !data) return toast(error?.message || "Nastavenie sa nepodarilo.", true);
    setEnroll({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  }

  async function confirmEnroll(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!enroll) return;
    const code = String(new FormData(e.currentTarget).get("code")).replace(/\D/g, "");
    if (code.length !== 6) return toast("Zadajte 6 číslic z aplikácie.", true);
    setBusy(true);
    const { error } = await sb.auth.mfa.challengeAndVerify({ factorId: enroll.id, code });
    setBusy(false);
    if (error) return toast("Nesprávny kód. Skúste aktuálny kód z aplikácie.", true);
    setEnroll(null);
    await sb.auth.signOut({ scope: "others" });
    refreshMfa(); load();
    toast("Dvojstupňové overenie je zapnuté");
  }

  async function removeFactor(id: string) {
    if (!window.confirm("Naozaj vypnúť dvojstupňové overenie? Účet potom bude chrániť len heslo.")) return;
    const { error } = await sb.auth.mfa.unenroll({ factorId: id });
    if (error) return toast(error.message, true);
    await sb.auth.refreshSession();
    refreshMfa(); load();
    toast("Dvojstupňové overenie je vypnuté");
  }

  async function signOutOthers() {
    const { error } = await sb.auth.signOut({ scope: "others" });
    if (error) return toast(error.message, true);
    load();
    toast("Ostatné zariadenia boli odhlásené");
  }

  const on = !!factors?.length;
  return (
    <>
      <div className="adm__head"><h1>Účet a zabezpečenie</h1></div>

      <div className="panel" style={{ maxWidth: 640 }}>
        <h2>Dvojstupňové overenie</h2>
        {factors === null ? <p className="note" style={{ marginTop: 0 }}>Načítavam…</p> : on ? (
          <>
            <p className="sec-ok">Zapnuté</p>
            <p className="note">Pri každom prihlásení sa okrem hesla pýta aj kód z aplikácie v telefóne. Bez telefónu sa do administrácie nedostane nikto, ani so správnym heslom.</p>
            <div className="seclist" style={{ marginTop: 14 }}>
              {factors.map((f) => (
                <div key={f.id}><span>{f.friendly_name || "Overovacia aplikácia"} <small>pridané {when(f.created_at)}</small></span><button type="button" className="tlink" onClick={() => removeFactor(f.id)}>Vypnúť</button></div>
              ))}
            </div>
          </>
        ) : enroll ? (
          <form onSubmit={confirmEnroll}>
            <p className="note" style={{ marginTop: 0 }}>1. V telefóne otvorte overovaciu aplikáciu (Google Authenticator, Microsoft Authenticator, Authy alebo 1Password) a naskenujte tento kód.</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="qr" src={enroll.qr} alt="QR kód pre overovaciu aplikáciu" />
            <p className="note">Ak sa kód nedá naskenovať, zadajte do aplikácie ručne tento kľúč: <code>{enroll.secret}</code></p>
            <p className="note">2. Zadajte 6 miestny kód, ktorý aplikácia ukáže.</p>
            <div className="field" style={{ maxWidth: 220 }}><label htmlFor="code">Kód z aplikácie</label><input className="input otp" id="code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={7} required /></div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="rc-btn rc-btn--primary" disabled={busy}>{busy ? "Overujem…" : "Zapnúť overenie"}</button>
              <button type="button" className="rc-btn rc-btn--ghost" onClick={() => { sb.auth.mfa.unenroll({ factorId: enroll.id }); setEnroll(null); }}>Zrušiť</button>
            </div>
          </form>
        ) : (
          <>
            <div className="sec-warn">Vypnuté. Účet teraz chráni len heslo.</div>
            <p className="note" style={{ marginTop: 0 }}>Po zapnutí sa pri prihlásení bude pýtať aj kód z aplikácie v telefóne. Je to najúčinnejšia ochrana proti ukradnutému alebo uhádnutému heslu.</p>
            <button type="button" className="rc-btn rc-btn--primary" style={{ marginTop: 14 }} disabled={busy} onClick={startEnroll}>{busy ? "Pripravujem…" : "Zapnúť dvojstupňové overenie"}</button>
          </>
        )}
      </div>

      <div className="panel" style={{ maxWidth: 640 }}>
        <h2>Prihlásené zariadenia</h2>
        <div className="seclist">
          {sessions.map((x) => (
            <div key={x.id}>
              <span>{device(x.ua)}{x.current ? <b> (toto zariadenie)</b> : null}<br /><small>prihlásené {when(x.created)}, naposledy aktívne {when(x.seen)}{x.ip ? `, IP ${x.ip}` : ""}</small></span>
              <small>{x.aal === "aal2" ? "overené kódom" : "len heslo"}</small>
            </div>
          ))}
          {!sessions.length && <p className="note" style={{ marginTop: 0 }}>Žiadne záznamy.</p>}
        </div>
        <p className="note">Ak tu vidíte zariadenie, ktoré nepoznáte, odhláste ostatné zariadenia a hneď zmeňte heslo.</p>
        <button type="button" className="rc-btn rc-btn--ghost" style={{ marginTop: 12 }} onClick={signOutOthers} disabled={sessions.length < 2}>Odhlásiť ostatné zariadenia</button>
      </div>

      <form className="panel" style={{ maxWidth: 640 }} onSubmit={changePassword}>
        <h2>Zmena hesla</h2>
        <p className="note" style={{ marginTop: 0 }}>Prihlásený: {session.user.email}. Heslo musí mať aspoň 12 znakov, malé aj veľké písmeno a číslicu. Po zmene sa ostatné zariadenia odhlásia.</p>
        <div className="field"><label htmlFor="p1">Nové heslo</label><input className="input" id="p1" name="p1" type="password" autoComplete="new-password" minLength={12} required /></div>
        <div className="field"><label htmlFor="p2">Nové heslo znova</label><input className="input" id="p2" name="p2" type="password" autoComplete="new-password" minLength={12} required /></div>
        <button className="rc-btn rc-btn--primary" disabled={busy}>{busy ? "Ukladám…" : "Zmeniť heslo"}</button>
      </form>
    </>
  );
}
