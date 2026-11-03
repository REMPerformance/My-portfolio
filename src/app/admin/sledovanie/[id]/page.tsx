"use client";
import Link from "next/link";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase";
import { compressImage } from "@/lib/imageImport";
import { useAdmin } from "@/components/admin/AdminApp";
import { CONTRACT_RE, PHASES, PORTS_FROM, PORTS_TO, VIN_RE, fShort, normContract, normVin, resolve, todayIso, type Milestone, type TrackUpdate } from "@/lib/tracking";

type Ship = { id: string; vin: string; contract_no: string; car_label: string; origin: string; port_from: string; port_to: string; vessel: string; sea_progress: number | null; customer_name: string; customer_email: string; status: "active" | "done" | "hidden"; milestones: Milestone[]; admin_note: string; updated_at: string };
type Upd = TrackUpdate & { id: string };

export default function EditShipment({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const sb = browserClient();
  const router = useRouter();
  const { toast, session } = useAdmin();
  const [s, setS] = useState<Ship | null>(null);
  const [ups, setUps] = useState<Upd[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // nová aktualizácia
  const [step, setStep] = useState(0);
  const [text, setText] = useState("");
  const [markDone, setMarkDone] = useState(false);
  const [mail, setMail] = useState(true);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(0);
  const [over, setOver] = useState(false);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const [{ data, error }, { data: u }] = await Promise.all([
      sb.from("shipments").select("*").eq("id", id).maybeSingle(),
      sb.from("shipment_updates").select("*").eq("shipment_id", id).order("created_at", { ascending: false })
    ]);
    if (error || !data) { toast(error?.message || "Zásielka sa nenašla.", true); return; }
    setS(data as Ship); setUps((u as Upd[]) || []); setDirty(false);
    const R = resolve((data as Ship).milestones || []);
    setStep(R.cur?.i ?? 0);
    setText(R.cur?.d ?? "");
  }, [sb, id, toast]);
  useEffect(() => { load(); }, [load]);

  if (!s) return <p className="note">Načítavam…</p>;
  const R = resolve(s.milestones);
  const upd = (p: Partial<Ship>) => { setS((x) => (x ? { ...x, ...p } : x)); setDirty(true); };
  const updM = (i: number, p: Partial<Milestone>) => upd({ milestones: s.milestones.map((m, k) => (k === i ? { ...m, ...p } : m)) });

  async function save() {
    if (!s) return;
    const vin = normVin(s.vin), contract_no = normContract(s.contract_no);
    if (!VIN_RE.test(vin)) return toast("VIN musí mať 17 znakov bez písmen I, O a Q.", true);
    if (!CONTRACT_RE.test(contract_no)) return toast("Skontrolujte číslo zmluvy.", true);
    setSaving(true);
    const clean = s.milestones.map((m) => Object.fromEntries(Object.entries(m).filter(([, v]) => v !== "" && v !== undefined && v !== false)) as unknown as Milestone);
    const { error } = await sb.from("shipments").update({
      vin, contract_no, car_label: s.car_label.trim(), origin: PORTS_FROM[s.port_from]?.country || s.origin, port_from: s.port_from, port_to: s.port_to,
      vessel: s.vessel.trim(), sea_progress: s.sea_progress, customer_name: s.customer_name.trim(), customer_email: s.customer_email.trim(),
      status: s.status, milestones: clean, admin_note: s.admin_note
    }).eq("id", s.id);
    setSaving(false);
    if (error) return toast(error.message, true);
    toast("Uložené"); setDirty(false);
  }

  async function upload(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    setUploading(list.length);
    const out: string[] = [];
    for (const f of list) {
      try {
        const blob = await compressImage(f, 1800, 0.84);
        const path = `${id}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.webp`;
        const { error } = await sb.storage.from("tracking-photos").upload(path, blob, { contentType: blob.type || "image/webp", cacheControl: "31536000", upsert: false });
        if (error) throw error;
        out.push(sb.storage.from("tracking-photos").getPublicUrl(path).data.publicUrl);
      } catch (e) { toast(`Nahrávanie ${f.name} zlyhalo: ${(e as Error).message}`, true); }
      finally { setUploading((n) => Math.max(0, n - 1)); }
    }
    setPhotos((p) => [...p, ...out]);
  }
  async function dropPhoto(url: string) {
    setPhotos((p) => p.filter((x) => x !== url));
    const path = url.split("/tracking-photos/")[1];
    if (path) await sb.storage.from("tracking-photos").remove([path]);
  }

  async function sendMail(updId: string) {
    const r = await fetch("/api/tracking/notify", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ id: updId }) }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    if (!r?.ok) { toast(j.error || "E-mail sa neodoslal.", true); return false; }
    toast(`E-mail odoslaný na ${j.to}`); return true;
  }

  async function post() {
    if (!s) return;
    if (!text.trim() && !photos.length) return toast("Pridajte text správy alebo aspoň jednu fotku.", true);
    if (mail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.customer_email.trim())) return toast("Zákazník nemá vyplnený platný e-mail. Doplňte ho v údajoch a uložte.", true);
    if (dirty) await save();
    setPosting(true);
    if (markDone) {
      const ms = s.milestones.map((m, k) => (k === step ? { ...m, done: todayIso() } : m));
      const { error } = await sb.from("shipments").update({ milestones: ms }).eq("id", s.id);
      if (error) { setPosting(false); return toast(error.message, true); }
    } else {
      await sb.from("shipments").update({ updated_at: new Date().toISOString() }).eq("id", s.id);
    }
    const { data, error } = await sb.from("shipment_updates").insert({ shipment_id: s.id, step, text: text.trim(), photos }).select("id").single();
    if (error) { setPosting(false); return toast(error.message, true); }
    if (mail) await sendMail(data.id); else toast("Aktualizácia uložená");
    setPosting(false); setPhotos([]); setMarkDone(false);
    load();
  }

  async function delUpdate(u: Upd) {
    if (!window.confirm("Zmazať túto aktualizáciu aj s fotkami?")) return;
    const paths = (u.photos || []).map((p) => p.split("/tracking-photos/")[1]).filter(Boolean);
    if (paths.length) await sb.storage.from("tracking-photos").remove(paths);
    const { error } = await sb.from("shipment_updates").delete().eq("id", u.id);
    if (error) return toast(error.message, true);
    setUps((x) => x.filter((y) => y.id !== u.id));
  }

  async function delShipment() {
    if (!s || !window.confirm("Zmazať celú zásielku vrátane aktualizácií? Zákazník ju už nenájde.")) return;
    const all = ups.flatMap((u) => (u.photos || []).map((p) => p.split("/tracking-photos/")[1]).filter(Boolean));
    if (all.length) await sb.storage.from("tracking-photos").remove(all);
    const { error } = await sb.from("shipments").delete().eq("id", s.id);
    if (error) return toast(error.message, true);
    router.push("/admin/sledovanie");
  }

  function asCustomer() {
    if (!s) return;
    try { sessionStorage.setItem("rem-track", JSON.stringify({ vin: s.vin, contract: s.contract_no })); } catch { /* ignore */ }
    window.open("/sledovanie/stav", "_blank");
  }

  const stepT = s.milestones[step]?.t || "";

  return (
    <>
      <div className="adm__head">
        <div><Link href="/admin/sledovanie" className="note" style={{ margin: 0 }}>← Sledovanie zásielok</Link><h1>{s.car_label || "Zásielka"}</h1></div>
        <div className="row-actions">
          <button className="rc-btn rc-btn--ghost" onClick={asCustomer} disabled={dirty} title={dirty ? "Najprv uložte zmeny" : undefined}>Zobraziť ako zákazník ↗</button>
          <button className="rc-btn rc-btn--primary" onClick={save} disabled={!dirty || saving}>{saving ? "Ukladám…" : dirty ? "Uložiť zmeny" : "Uložené"}</button>
        </div>
      </div>

      <div className="shp-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
          <div className="panel">
            <h2>Údaje zásielky</h2>
            <div className="three">
              <div className="field"><label htmlFor="s-vin">VIN</label><input className="input" id="s-vin" value={s.vin} maxLength={17} onChange={(e) => upd({ vin: normVin(e.target.value) })} /></div>
              <div className="field"><label htmlFor="s-con">Číslo zmluvy</label><input className="input" id="s-con" value={s.contract_no} onChange={(e) => upd({ contract_no: normContract(e.target.value) })} /></div>
              <div className="field"><label htmlFor="s-car">Auto</label><input className="input" id="s-car" value={s.car_label} onChange={(e) => upd({ car_label: e.target.value })} /></div>
              <div className="field"><label htmlFor="s-name">Zákazník</label><input className="input" id="s-name" value={s.customer_name} onChange={(e) => upd({ customer_name: e.target.value })} /></div>
              <div className="field"><label htmlFor="s-mail">E-mail zákazníka</label><input className="input" id="s-mail" type="email" value={s.customer_email} onChange={(e) => upd({ customer_email: e.target.value })} /></div>
              <div className="field"><label htmlFor="s-st">Viditeľnosť</label><select className="input" id="s-st" value={s.status} onChange={(e) => upd({ status: e.target.value as Ship["status"] })}><option value="active">Aktívna</option><option value="done">Ukončená</option><option value="hidden">Skrytá pre zákazníka</option></select></div>
              <div className="field"><label htmlFor="s-pf">Prístav odoslania</label><select className="input" id="s-pf" value={s.port_from} onChange={(e) => upd({ port_from: e.target.value })}>{Object.entries(PORTS_FROM).map(([k, p]) => <option key={k} value={k}>{p.n} ({p.country})</option>)}</select></div>
              <div className="field"><label htmlFor="s-pt">Prístav určenia</label><select className="input" id="s-pt" value={s.port_to} onChange={(e) => upd({ port_to: e.target.value })}>{Object.entries(PORTS_TO).map(([k, p]) => <option key={k} value={k}>{p.n}</option>)}</select></div>
              <div className="field"><label htmlFor="s-ves">Loď</label><input className="input" id="s-ves" value={s.vessel} onChange={(e) => upd({ vessel: e.target.value })} /></div>
              <div className="field"><label htmlFor="s-sea">Poloha lode v %</label><input className="input" id="s-sea" inputMode="numeric" placeholder="podľa dátumov" value={s.sea_progress ?? ""} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); upd({ sea_progress: v === "" ? null : Math.min(100, Number(v)) }); }} /></div>
            </div>
            <div className="field" style={{ marginBottom: 0 }}><label htmlFor="s-note">Interná poznámka</label><input className="input" id="s-note" value={s.admin_note} onChange={(e) => upd({ admin_note: e.target.value })} /></div>
          </div>

          <div className="panel">
            <h2>Kroky dovozu</h2>
            <div className="shp-head"><span>#</span><span>Krok a popis pre zákazníka</span><span>Plán od</span><span>Plán do</span><span>Hotovo</span><span /></div>
            <div className="shp-ms">
              {R.steps.map((m) => (
                <div className={`shp-m ${m.st}${m.hidden ? " hidden" : ""}`} key={m.i}>
                  <span className="i">{m.i + 1}</span>
                  <div className="t">
                    <input className="input" value={m.t} onChange={(e) => updM(m.i, { t: e.target.value })} aria-label="Názov kroku" />
                    <input className="input" value={m.d} onChange={(e) => updM(m.i, { d: e.target.value })} aria-label="Popis kroku" />
                    <small>{PHASES[m.ph]}{m.leg === "sea" ? " · poloha lode podľa dátumov" : ""}</small>
                  </div>
                  <label><small>Plán od</small><input className="input" type="date" value={m.from || ""} onChange={(e) => updM(m.i, { from: e.target.value })} /></label>
                  <label><small>Plán do</small><input className="input" type="date" value={m.to || ""} onChange={(e) => updM(m.i, { to: e.target.value })} /></label>
                  <label><small>Hotovo</small><input className="input" type="date" value={m.done || ""} onChange={(e) => updM(m.i, { done: e.target.value })} /></label>
                  <button type="button" className="hide" title={m.hidden ? "Zobraziť zákazníkovi" : "Skryť pred zákazníkom"} onClick={() => updM(m.i, { hidden: !m.hidden })}>{m.hidden ? "◌" : "●"}</button>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <h2>História aktualizácií</h2>
            {ups.length === 0 ? <p className="note" style={{ margin: 0 }}>Zatiaľ bez aktualizácií.</p> : (
              <div className="shp-hist">
                {ups.map((u) => (
                  <div className="h" key={u.id}>
                    <span className="note" style={{ margin: 0 }}>{fShort(new Date(u.created_at).getTime())}</span>
                    <div>
                      <b>{s.milestones[u.step]?.t || "Krok"}</b>{u.text ? <> · {u.text}</> : null}
                      {u.photos?.length ? <div className="ph">{u.photos.map((p) => /* eslint-disable-next-line @next/next/no-img-element */ <img key={p} src={p} alt="" />)}</div> : null}
                    </div>
                    <div className="row-actions" style={{ justifyContent: "flex-end" }}>
                      {u.emailed_at ? <span className="pill published">E-mail {fShort(new Date(u.emailed_at).getTime())}</span> : <button className="rc-btn rc-btn--ghost rc-btn--sm" onClick={async () => { if (await sendMail(u.id)) load(); }}>Poslať e-mail</button>}
                      <button className="rc-btn rc-btn--ghost rc-btn--sm" onClick={() => delUpdate(u)}>Zmazať</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button className="tlink" style={{ alignSelf: "flex-start" }} onClick={delShipment}>Zmazať zásielku</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0, position: "sticky", top: 20 }}>
          <div className="panel">
            <h2>Nová aktualizácia</h2>
            <div className="field"><label htmlFor="u-step">Krok</label>
              <select className="input" id="u-step" value={step} onChange={(e) => { const i = Number(e.target.value); setStep(i); setText(s.milestones[i]?.d || ""); }}>
                {R.steps.map((m) => <option key={m.i} value={m.i}>{m.i + 1}. {m.t}{m.st === "done" ? " (hotovo)" : m.st === "cur" ? " (aktuálny)" : ""}</option>)}
              </select>
            </div>
            <label className="note" style={{ margin: "0 0 14px", display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}><input type="checkbox" checked={markDone} onChange={(e) => setMarkDone(e.target.checked)} /> Označiť krok ako dokončený dnes</label>
            <div className="field"><label htmlFor="u-text">Správa pre zákazníka</label><textarea className="input" id="u-text" rows={4} value={text} onChange={(e) => setText(e.target.value)} /></div>
            <div className="field">
              <label>Fotky</label>
              <div className={`shp-drop${over ? " over" : ""}`} role="button" tabIndex={0}
                onClick={() => fileRef.current?.click()} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
                onDrop={(e) => { e.preventDefault(); setOver(false); upload(e.dataTransfer.files); }}>
                <b>{uploading ? `Nahrávam ${uploading}…` : "Pridať fotky"}</b>Potiahnite sem fotky z cesty alebo kliknite a vyberte ich.
                <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { if (e.target.files) upload(e.target.files); e.target.value = ""; }} />
              </div>
              {photos.length > 0 && <div className="shp-prev">{photos.map((p) => <div className="pi" key={p}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={p} alt="" /><button type="button" aria-label="Odstrániť fotku" onClick={() => dropPhoto(p)}>×</button></div>)}</div>}
            </div>
            <label className="note" style={{ margin: "0 0 16px", display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}><input type="checkbox" checked={mail} onChange={(e) => setMail(e.target.checked)} /> Poslať e-mail na {s.customer_email || "e-mail zákazníka (nevyplnený)"}</label>
            <button className="rc-btn rc-btn--primary rc-btn--block" onClick={post} disabled={posting || uploading > 0}>{posting ? "Ukladám…" : mail ? "Uložiť a poslať e-mail" : "Uložiť aktualizáciu"}</button>
          </div>

          <div className="panel" style={{ opacity: mail ? 1 : 0.5 }}>
            <h2>Náhľad e-mailu</h2>
            <p className="note" style={{ margin: "0 0 12px" }}>Predmet: {s.car_label}: {stepT}</p>
            <div className="shp-mail">
              <div className="top">RE<b>M</b>PERFORMANCE</div>
              <div className="bd">
                <p>Dobrý deň,</p>
                <p>posielame Vám novú informáciu o dovoze Vášho vozidla <b>{s.car_label}</b> podľa zmluvy {s.contract_no}.</p>
                <div className="box"><small>Aktuálny krok</small><b>{stepT}</b></div>
                {text.trim() && <p style={{ whiteSpace: "pre-line" }}>{text.trim()}</p>}
                {photos.length > 0 && <div className="imgs">{photos.slice(0, 6).map((p) => /* eslint-disable-next-line @next/next/no-img-element */ <img key={p} src={p} alt="" />)}</div>}
                <span className="cta">Sledovať objednávku</span>
                <p className="ft">Na stránke sledovania zadajte VIN a číslo zmluvy. Uvidíte aktuálny stav, polohu lode a všetky fotky z cesty.<br /><br />S pozdravom<br />REM Performance</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
