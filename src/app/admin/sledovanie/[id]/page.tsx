"use client";
import Link from "next/link";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase";
import { compressImage } from "@/lib/imageImport";
import { useAdmin } from "@/components/admin/AdminApp";
import { SITE } from "@/lib/site";
import { CONTRACT_RE, PHASES, PORTS_FROM, PORTS_TO, VIN_RE, normContract, normVin, resolve, syncSeaDates, todayIso, type Milestone } from "@/lib/tracking";

type Ship = {
  id: string; vin: string; contract_no: string; car_label: string; origin: string; port_from: string; port_to: string;
  pickup_place: string; destination_place: string; shipping_line: string; vessel: string; voyage: string; container_no: string;
  seal_no: string; booking_no: string; bl_no: string; etd: string | null; atd: string | null; eta: string | null; ata: string | null;
  sea_progress: number | null; customer_name: string; customer_email: string; status: "active" | "done" | "hidden";
  milestones: Milestone[]; admin_note: string; updated_at: string;
};

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const fDate = (s?: string | null) => (s ? new Date(s + "T12:00:00").toLocaleDateString("sk-SK", { day: "numeric", month: "numeric", year: "numeric" }) : "");

async function copyRich(html: string, text: string) {
  if (navigator.clipboard && typeof ClipboardItem !== "undefined") {
    await navigator.clipboard.write([new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([text], { type: "text/plain" }) })]);
    return;
  }
  const el = document.createElement("div");
  el.contentEditable = "true";
  el.style.cssText = "position:fixed;left:-9999px;top:0;background:#fff";
  el.innerHTML = html;
  document.body.appendChild(el);
  const range = document.createRange(); range.selectNodeContents(el);
  const sel = window.getSelection(); sel?.removeAllRanges(); sel?.addRange(range);
  const ok = document.execCommand("copy");
  sel?.removeAllRanges(); el.remove();
  if (!ok) throw new Error("Kopírovanie sa nepodarilo.");
}

export default function EditShipment({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const sb = browserClient();
  const router = useRouter();
  const { toast } = useAdmin();
  const [s, setS] = useState<Ship | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyStep, setBusyStep] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const pickFor = useRef<number>(0);

  // kópia e-mailu
  const [mailOn, setMailOn] = useState(false);
  const [mStep, setMStep] = useState(0);
  const [mText, setMText] = useState("");
  const [mPhotos, setMPhotos] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await sb.from("shipments").select("*").eq("id", id).maybeSingle();
    if (error || !data) { toast(error?.message || "Zásielka sa nenašla.", true); return; }
    setS(data as Ship); setDirty(false);
    const R = resolve((data as Ship).milestones || []);
    const last = [...R.steps].reverse().find((x) => x.st === "done");
    const def = last ?? R.cur ?? R.steps[0];
    if (def) { setMStep(def.i); setMText(def.d); }
  }, [sb, id, toast]);
  useEffect(() => { load(); }, [load]);

  if (!s) return <p className="note">Načítavam…</p>;
  const R = resolve(s.milestones);
  const upd = (p: Partial<Ship>) => { setS((x) => (x ? { ...x, ...p } : x)); setDirty(true); };
  const updM = (i: number, p: Partial<Milestone>) => upd({ milestones: s.milestones.map((m, k) => (k === i ? { ...m, ...p } : m)) });
  const updDates = (p: Partial<Pick<Ship, "etd" | "atd" | "eta" | "ata">>) => {
    const next = { etd: s.etd, atd: s.atd, eta: s.eta, ata: s.ata, ...p };
    upd({ ...p, milestones: syncSeaDates(s.milestones, next) });
  };

  const cleanMs = (ms: Milestone[]) => ms.map((m) => Object.fromEntries(Object.entries(m).filter(([, v]) => v !== "" && v !== undefined && v !== false && !(Array.isArray(v) && !v.length))) as unknown as Milestone);

  async function save() {
    if (!s) return;
    const vin = normVin(s.vin), contract_no = normContract(s.contract_no);
    if (!VIN_RE.test(vin)) return toast("VIN musí mať 17 znakov bez písmen I, O a Q.", true);
    if (!CONTRACT_RE.test(contract_no)) return toast("Skontrolujte číslo zmluvy.", true);
    setSaving(true);
    const t = (v: string) => (v || "").trim();
    const { error } = await sb.from("shipments").update({
      vin, contract_no, car_label: t(s.car_label), origin: PORTS_FROM[s.port_from]?.country || s.origin, port_from: s.port_from, port_to: s.port_to,
      pickup_place: t(s.pickup_place), destination_place: t(s.destination_place), shipping_line: t(s.shipping_line), vessel: t(s.vessel), voyage: t(s.voyage),
      container_no: t(s.container_no).toUpperCase(), seal_no: t(s.seal_no), booking_no: t(s.booking_no), bl_no: t(s.bl_no),
      etd: s.etd || null, atd: s.atd || null, eta: s.eta || null, ata: s.ata || null, sea_progress: s.sea_progress,
      customer_name: t(s.customer_name), customer_email: t(s.customer_email), status: s.status, milestones: cleanMs(s.milestones), admin_note: s.admin_note
    }).eq("id", s.id);
    setSaving(false);
    if (error) return toast(error.message, true);
    toast("Uložené"); setDirty(false);
  }

  /** Fotky ku kroku: nahrajú sa a krok sa hneď uloží (bez e-mailu). */
  async function uploadTo(i: number, files: FileList | File[]) {
    if (!s) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    setBusyStep(i);
    const urls: string[] = [];
    for (const f of list) {
      try {
        const blob = await compressImage(f, 1800, 0.84);
        const path = `${id}/${i}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}.webp`;
        const { error } = await sb.storage.from("tracking-photos").upload(path, blob, { contentType: blob.type || "image/webp", cacheControl: "31536000" });
        if (error) throw error;
        urls.push(sb.storage.from("tracking-photos").getPublicUrl(path).data.publicUrl);
      } catch (e) { toast(`${f.name}: ${(e as Error).message}`, true); }
    }
    setBusyStep(null);
    if (!urls.length) return;
    const ms = s.milestones.map((m, k) => (k === i ? { ...m, photos: [...(m.photos || []), ...urls] } : m));
    setS({ ...s, milestones: ms });
    const { error } = await sb.from("shipments").update({ milestones: cleanMs(ms) }).eq("id", s.id);
    if (error) toast(error.message, true); else toast(urls.length === 1 ? "Fotka pridaná" : `Pridané fotky: ${urls.length}`);
  }
  /** Dokumenty (PDF) ku kroku, napríklad zmluva alebo B/L. Názov súboru je náhodný, aby sa nedal uhádnuť. */
  async function uploadDocs(i: number, files: FileList | File[]) {
    if (!s) return;
    const list = Array.from(files).filter((f) => f.type === "application/pdf" || /\.pdf$/i.test(f.name));
    if (!list.length) return toast("Nahrať sa dajú len PDF súbory.", true);
    setBusyStep(i);
    const docs: { name: string; url: string }[] = [];
    for (const f of list) {
      if (f.size > 15 * 1024 * 1024) { toast(`${f.name}: súbor je väčší ako 15 MB.`, true); continue; }
      const path = `${id}/docs/${crypto.randomUUID()}.pdf`;
      const { error } = await sb.storage.from("tracking-photos").upload(path, f, { contentType: "application/pdf", cacheControl: "3600" });
      if (error) { toast(`${f.name}: ${error.message}`, true); continue; }
      docs.push({ name: f.name.replace(/\.pdf$/i, ""), url: sb.storage.from("tracking-photos").getPublicUrl(path).data.publicUrl });
    }
    setBusyStep(null);
    if (!docs.length) return;
    const ms = s.milestones.map((m, k) => (k === i ? { ...m, docs: [...(m.docs || []), ...docs] } : m));
    setS({ ...s, milestones: ms });
    const { error } = await sb.from("shipments").update({ milestones: cleanMs(ms) }).eq("id", s.id);
    if (error) toast(error.message, true); else toast(docs.length === 1 ? "Dokument pridaný" : `Pridané dokumenty: ${docs.length}`);
  }
  async function removeDoc(i: number, url: string) {
    if (!s || !window.confirm("Odstrániť dokument?")) return;
    const ms = s.milestones.map((m, k) => (k === i ? { ...m, docs: (m.docs || []).filter((d) => d.url !== url) } : m));
    setS({ ...s, milestones: ms });
    await sb.from("shipments").update({ milestones: cleanMs(ms) }).eq("id", s.id);
    const path = url.split("/tracking-photos/")[1];
    if (path) await sb.storage.from("tracking-photos").remove([path]);
  }
  function renameDoc(i: number, url: string, name: string) {
    updM(i, { docs: (s!.milestones[i].docs || []).map((d) => (d.url === url ? { ...d, name } : d)) });
  }
  async function removePhoto(i: number, url: string) {
    if (!s || !window.confirm("Odstrániť fotku?")) return;
    const ms = s.milestones.map((m, k) => (k === i ? { ...m, photos: (m.photos || []).filter((p) => p !== url) } : m));
    setS({ ...s, milestones: ms });
    await sb.from("shipments").update({ milestones: cleanMs(ms) }).eq("id", s.id);
    const path = url.split("/tracking-photos/")[1];
    if (path) await sb.storage.from("tracking-photos").remove([path]);
  }

  async function delShipment() {
    if (!s || !window.confirm("Zmazať celú zásielku aj s fotkami? Zákazník ju už nenájde.")) return;
    const paths = s.milestones.flatMap((m) => [...(m.photos || []), ...(m.docs || []).map((d) => d.url)]).map((p) => p.split("/tracking-photos/")[1]).filter(Boolean);
    if (paths.length) await sb.storage.from("tracking-photos").remove(paths);
    const { error } = await sb.from("shipments").delete().eq("id", s.id);
    if (error) return toast(error.message, true);
    router.push("/admin/sledovanie");
  }

  function asCustomer() {
    if (!s) return;
    try { sessionStorage.setItem("rem-track", JSON.stringify({ vin: s.vin, contract: s.contract_no })); } catch { /* ignore */ }
    window.open("/sledovanie/stav", "_blank");
  }

  /* ── kópia e-mailu ── */
  const ms = s.milestones[mStep];
  const subject = `${s.car_label}: ${ms?.t || "stav dovozu"}`;
  const photos = mPhotos ? (ms?.photos || []).slice(0, 6) : [];
  const facts: [string, string][] = [
    ["Trasa", [s.pickup_place, PORTS_FROM[s.port_from]?.n, PORTS_TO[s.port_to]?.n, s.destination_place].filter(Boolean).join(" → ")],
    ["Loď", [s.vessel, s.voyage && `plavba ${s.voyage}`].filter(Boolean).join(", ")],
    ["Kontajner", s.container_no],
    [s.atd ? "Odplávanie" : "Plánované odplávanie", fDate(s.atd || s.etd)],
    [s.ata ? "Prílev" : "Predpokladaný prílev", fDate(s.ata || s.eta)]
  ].filter(([, v]) => v) as [string, string][];
  const link = `${SITE.url}/sledovanie`;
  const mailText = [
    "Dobrý deň,", "",
    `posielame Vám informáciu o dovoze Vášho vozidla ${s.car_label} podľa zmluvy ${s.contract_no}.`, "",
    `${ms?.t || ""}`, mText.trim(), "",
    ...facts.map(([k, v]) => `${k}: ${v}`), facts.length ? "" : "",
    photos.length ? `Fotky k tomuto kroku nájdete na stránke sledovania.` : "",
    `Aktuálny stav a polohu vozidla nájdete na ${link} po zadaní VIN a čísla zmluvy.`, "",
    "S pozdravom", "REM Performance", `${SITE.phone} · ${SITE.email}`
  ].filter((x, i, a) => !(x === "" && a[i - 1] === "")).join("\n");
  const mailHtml = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#15171b;max-width:600px">
<p>Dobrý deň,</p>
<p>posielame Vám informáciu o dovoze Vášho vozidla <b>${esc(s.car_label)}</b> podľa zmluvy ${esc(s.contract_no)}.</p>
<table cellpadding="0" cellspacing="0" style="border:1px solid #e4e6ea;border-top:3px solid #c8102e;width:100%;margin:6px 0 12px"><tr><td style="padding:10px 12px">
<div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#7b818b;font-weight:700">Aktuálny krok</div>
<div style="font-size:16px;font-weight:700">${esc(ms?.t || "")}</div>${mText.trim() ? `<div style="margin-top:4px">${esc(mText.trim()).replace(/\n/g, "<br>")}</div>` : ""}</td></tr></table>
${facts.length ? `<table cellpadding="0" cellspacing="0" style="font-size:14px;margin-bottom:12px">${facts.map(([k, v]) => `<tr><td style="padding:2px 16px 2px 0;color:#7b818b;white-space:nowrap">${esc(k)}</td><td style="padding:2px 0;font-weight:700">${esc(v)}</td></tr>`).join("")}</table>` : ""}
${photos.length ? `<p>${photos.map((p) => `<a href="${esc(p)}"><img src="${esc(p)}" width="180" height="135" alt="" style="width:180px;height:135px;object-fit:cover;margin:0 6px 6px 0;border:1px solid #e4e6ea"></a>`).join("")}</p>` : ""}
<p>Aktuálny stav a polohu vozidla nájdete na <a href="${link}" style="color:#c8102e;font-weight:700">${link.replace("https://", "")}</a> po zadaní VIN a čísla zmluvy.</p>
<p>S pozdravom<br>REM Performance<br>${SITE.phone} · ${SITE.email}</p></div>`;

  async function copy(kind: "mail" | "subject" | "to") {
    if (!s) return;
    try {
      if (kind === "mail") await copyRich(mailHtml, mailText);
      else await navigator.clipboard.writeText(kind === "subject" ? subject : s.customer_email);
      toast(kind === "mail" ? "E-mail skopírovaný, vložte ho do Gmailu" : "Skopírované");
    } catch (e) { toast((e as Error).message, true); }
  }

  const sel = (k: keyof Ship, opts: Record<string, { n: string; country?: string }>) => (
    <select className="input" id={`s-${String(k)}`} value={String(s[k] ?? "")} onChange={(e) => upd({ [k]: e.target.value } as Partial<Ship>)}>
      {Object.entries(opts).map(([key, p]) => <option key={key} value={key}>{p.n}{p.country ? ` (${p.country})` : ""}</option>)}
    </select>
  );
  const txt = (k: keyof Ship, label: string, ph = "") => (
    <div className="field"><label htmlFor={`s-${String(k)}`}>{label}</label><input className="input" id={`s-${String(k)}`} placeholder={ph} value={String(s[k] ?? "")} onChange={(e) => upd({ [k]: e.target.value } as Partial<Ship>)} /></div>
  );
  const dt = (k: "etd" | "atd" | "eta" | "ata", label: string) => (
    <div className="field"><label htmlFor={`s-${k}`}>{label}</label><input className="input" type="date" id={`s-${k}`} value={s[k] || ""} onChange={(e) => updDates({ [k]: e.target.value || null })} /></div>
  );

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
            <h2>Zásielka a zákazník</h2>
            <div className="three">
              <div className="field"><label htmlFor="s-vin">VIN</label><input className="input" id="s-vin" value={s.vin} maxLength={17} onChange={(e) => upd({ vin: normVin(e.target.value) })} /></div>
              <div className="field"><label htmlFor="s-con">Číslo zmluvy</label><input className="input" id="s-con" value={s.contract_no} onChange={(e) => upd({ contract_no: normContract(e.target.value) })} /></div>
              {txt("car_label", "Auto")}
              {txt("customer_name", "Zákazník")}
              <div className="field"><label htmlFor="s-mail">E-mail zákazníka</label><input className="input" id="s-mail" type="email" autoComplete="off" value={s.customer_email} onChange={(e) => upd({ customer_email: e.target.value })} /></div>
              <div className="field"><label htmlFor="s-st">Viditeľnosť</label><select className="input" id="s-st" value={s.status} onChange={(e) => upd({ status: e.target.value as Ship["status"] })}><option value="active">Aktívna</option><option value="done">Ukončená</option><option value="hidden">Skrytá pre zákazníka</option></select></div>
            </div>
          </div>

          <div className="panel">
            <h2>Preprava</h2>
            <div className="shp-route">
              {txt("pickup_place", "Odkiaľ (miesto vyzdvihnutia)", "napr. Soul, Južná Kórea")}
              <div className="field"><label htmlFor="s-port_from">Prístav nakládky</label>{sel("port_from", PORTS_FROM)}</div>
              <div className="field"><label htmlFor="s-port_to">Prístav vykládky</label>{sel("port_to", PORTS_TO)}</div>
              {txt("destination_place", "Kam (miesto odovzdania)", "napr. Nitra")}
            </div>
            <div className="four">
              {txt("shipping_line", "Lodná spoločnosť", "napr. Glovis, Wallenius")}
              {txt("vessel", "Loď", "názov lode")}
              {txt("voyage", "Číslo plavby", "voyage")}
              {txt("container_no", "Číslo kontajnera", "ABCU1234567")}
            </div>
            <div className="four">
              {dt("etd", "Odplávanie plán (ETD)")}
              {dt("atd", "Odplávanie skutočné")}
              {dt("eta", "Prílev plán (ETA)")}
              {dt("ata", "Prílev skutočný")}
            </div>
            <div className="four">
              {txt("bl_no", "Číslo B/L (interné)")}
              {txt("booking_no", "Booking (interné)")}
              {txt("seal_no", "Plomba (interné)")}
              <div className="field"><label htmlFor="s-sea">Poloha lode v %</label><input className="input" id="s-sea" inputMode="numeric" placeholder="podľa dátumov" value={s.sea_progress ?? ""} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); upd({ sea_progress: v === "" ? null : Math.min(100, Number(v)) }); }} /></div>
            </div>
            <div className="field" style={{ marginBottom: 0 }}><label htmlFor="s-note">Interná poznámka</label><input className="input" id="s-note" value={s.admin_note} onChange={(e) => upd({ admin_note: e.target.value })} /></div>
          </div>

          <div className="panel">
            <h2>Kroky dovozu a fotky</h2>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { if (e.target.files) uploadTo(pickFor.current, e.target.files); e.target.value = ""; }} />
            <input ref={docRef} type="file" accept="application/pdf,.pdf" multiple hidden onChange={(e) => { if (e.target.files) uploadDocs(pickFor.current, e.target.files); e.target.value = ""; }} />
            <div className="shp-ms">
              {R.steps.map((m) => (
                <div className={`shp-m2 ${m.st}${m.hidden ? " hidden" : ""}`} key={m.i}
                  onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const fs = Array.from(e.dataTransfer.files); const pdf = fs.filter((f) => /pdf/i.test(f.type)); const img = fs.filter((f) => f.type.startsWith("image/")); if (img.length) uploadTo(m.i, img); if (pdf.length) uploadDocs(m.i, pdf); }}>
                  <div className="top">
                    <span className="i">{m.i + 1}</span>
                    <div className="t">
                      <input className="input" value={m.t} onChange={(e) => updM(m.i, { t: e.target.value })} aria-label="Názov kroku" />
                      <input className="input sm" value={m.d} onChange={(e) => updM(m.i, { d: e.target.value })} aria-label="Popis kroku" />
                    </div>
                    <span className={`st ${m.st}`}>{{ done: "Hotovo", cur: "Aktuálny", next: "Plánovaný" }[m.st]}</span>
                  </div>
                  <div className="dates">
                    <label><small>Plán od</small><input className="input" type="date" value={m.from || ""} onChange={(e) => updM(m.i, { from: e.target.value })} /></label>
                    <label><small>Plán do</small><input className="input" type="date" value={m.to || ""} onChange={(e) => updM(m.i, { to: e.target.value })} /></label>
                    <label><small>Hotovo</small><input className="input" type="date" value={m.done || ""} onChange={(e) => updM(m.i, { done: e.target.value })} /></label>
                    {!m.done && <button type="button" className="rc-btn rc-btn--ghost rc-btn--sm" onClick={() => updM(m.i, { done: todayIso() })}>Hotovo dnes</button>}
                    <button type="button" className="hide" onClick={() => updM(m.i, { hidden: !m.hidden })}>{m.hidden ? "Zobraziť" : "Skryť"}</button>
                  </div>
                  <div className="ph">
                    {(m.photos || []).map((p) => (
                      <div className="pi" key={p}>{/* eslint-disable-next-line @next/next/no-img-element */}<a href={p} target="_blank" rel="noopener"><img src={p} alt="" /></a><button type="button" aria-label="Odstrániť fotku" onClick={() => removePhoto(m.i, p)}>×</button></div>
                    ))}
                    <button type="button" className="add" disabled={busyStep !== null} onClick={() => { pickFor.current = m.i; fileRef.current?.click(); }}>
                      {busyStep === m.i ? "Nahrávam…" : "+ Fotky"}
                    </button>
                    <button type="button" className="add" disabled={busyStep !== null} onClick={() => { pickFor.current = m.i; docRef.current?.click(); }}>+ PDF</button>
                  </div>
                  {(m.docs || []).length > 0 && (
                    <div className="docs">
                      {(m.docs || []).map((d) => (
                        <div className="doc" key={d.url}>
                          <span className="ic">PDF</span>
                          <input className="input sm" value={d.name} onChange={(e) => renameDoc(m.i, d.url, e.target.value)} aria-label="Názov dokumentu" />
                          <a className="rc-btn rc-btn--ghost rc-btn--sm" href={d.url} target="_blank" rel="noopener">Otvoriť</a>
                          <button type="button" className="rc-btn rc-btn--ghost rc-btn--sm" onClick={() => removeDoc(m.i, d.url)}>Odstrániť</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <small className="phase">{PHASES[m.ph]}</small>
                </div>
              ))}
            </div>
          </div>
          <button className="tlink" style={{ alignSelf: "flex-start" }} onClick={delShipment}>Zmazať zásielku</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0, position: "sticky", top: 20 }}>
          <div className="panel">
            <label className="check" style={{ margin: 0, fontWeight: 700, color: "var(--rc-text)" }}>
              <input type="checkbox" checked={mailOn} onChange={(e) => setMailOn(e.target.checked)} /> <span>Vyhotoviť kópiu pre e-mail</span>
            </label>
            {mailOn && (
              <div style={{ marginTop: 16 }}>
                <div className="field"><label htmlFor="m-step">Krok</label>
                  <select className="input" id="m-step" value={mStep} onChange={(e) => { const i = Number(e.target.value); setMStep(i); setMText(s.milestones[i]?.d || ""); }}>
                    {R.steps.map((m) => <option key={m.i} value={m.i}>{m.i + 1}. {m.t}{m.st === "done" ? " (hotovo)" : m.st === "cur" ? " (aktuálny)" : ""}</option>)}
                  </select>
                </div>
                <div className="field"><label htmlFor="m-text">Text pre zákazníka</label><textarea className="input" id="m-text" rows={4} value={mText} onChange={(e) => setMText(e.target.value)} /></div>
                {(ms?.photos || []).length > 0 && <label className="check"><input type="checkbox" checked={mPhotos} onChange={(e) => setMPhotos(e.target.checked)} /> <span>Pridať fotky z tohto kroku ({ms?.photos?.length})</span></label>}
                <div className="shp-copy">
                  <div><small>Komu</small><b>{s.customer_email || "e-mail nie je vyplnený"}</b>{s.customer_email && <button type="button" className="rc-btn rc-btn--ghost rc-btn--sm" onClick={() => copy("to")}>Kopírovať</button>}</div>
                  <div><small>Predmet</small><b>{subject}</b><button type="button" className="rc-btn rc-btn--ghost rc-btn--sm" onClick={() => copy("subject")}>Kopírovať</button></div>
                </div>
                <div className="shp-mail2" dangerouslySetInnerHTML={{ __html: mailHtml }} />
                <button className="rc-btn rc-btn--primary rc-btn--block" style={{ marginTop: 14 }} onClick={() => copy("mail")}>Kopírovať e-mail</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
