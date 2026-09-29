"use client";
import { useEffect, useState } from "react";
import { browserClient } from "@/lib/supabase";
import { DEFAULT_CONTENT, mergeContent, type SiteContent } from "@/lib/content";
import { useAdmin } from "@/components/admin/AdminApp";

type Field<T> = { k: keyof T; label: string; area?: boolean; num?: boolean };

/** Editor zoznamu položiek (pridať, zmazať, posunúť). */
function ListEditor<T extends Record<string, unknown>>({
  items, onChange, fields, blank, addLabel
}: { items: T[]; onChange: (v: T[]) => void; fields: Field<T>[]; blank: T; addLabel: string }) {
  const move = (i: number, d: number) => {
    const a = [...items]; const j = i + d;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]]; onChange(a);
  };
  return (
    <div className="listed">
      {items.map((it, i) => (
        <div className="listed__row" key={i}>
          <div className="listed__fields">
            {fields.map((f) => (
              <div className="field" key={String(f.k)} style={{ marginBottom: 8 }}>
                <label>{f.label}</label>
                {f.area ? (
                  <textarea className="input" rows={3} value={String(it[f.k] ?? "")} onChange={(e) => onChange(items.map((x, k) => (k === i ? { ...x, [f.k]: e.target.value } : x)))} />
                ) : (
                  <input className="input" type={f.num ? "number" : "text"} value={String(it[f.k] ?? "")} onChange={(e) => onChange(items.map((x, k) => (k === i ? { ...x, [f.k]: f.num ? Number(e.target.value) : e.target.value } : x)))} />
                )}
              </div>
            ))}
          </div>
          <div className="listed__act">
            <button type="button" className="rc-btn rc-btn--ghost rc-btn--sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Hore">↑</button>
            <button type="button" className="rc-btn rc-btn--ghost rc-btn--sm" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Dole">↓</button>
            <button type="button" className="rc-btn rc-btn--ghost rc-btn--sm" onClick={() => onChange(items.filter((_, k) => k !== i))} aria-label="Zmazať">✕</button>
          </div>
        </div>
      ))}
      <button type="button" className="rc-btn rc-btn--ghost rc-btn--sm" onClick={() => onChange([...items, { ...blank }])}>{addLabel}</button>
    </div>
  );
}

export default function ContentAdmin() {
  const sb = browserClient();
  const { toast, revalidate } = useAdmin();
  const [c, setC] = useState<SiteContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("hero");

  useEffect(() => {
    sb.from("settings").select("value").eq("key", "content").maybeSingle().then(({ data }) => setC(mergeContent(data?.value)));
  }, [sb]);
  if (!c) return <p className="note">Načítavam…</p>;

  const up = (patch: Partial<SiteContent>) => setC({ ...c, ...patch });
  async function save() {
    setSaving(true);
    const { error } = await sb.from("settings").upsert({ key: "content", value: c, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) return toast(error.message, true);
    toast("Obsah webu uložený");
    revalidate();
  }
  const tabs = [
    ["hero", "Úvod"], ["feats", "Výhody"], ["steps", "Postup"], ["why", "Prečo my"], ["bonus", "Bonus RACEM"], ["faq", "Otázky (FAQ)"], ["contact", "Kontakt"]
  ];
  const txt = (label: string, value: string, on: (v: string) => void, area = false) => (
    <div className="field">
      <label>{label}</label>
      {area ? <textarea className="input" rows={4} value={value} onChange={(e) => on(e.target.value)} /> : <input className="input" value={value} onChange={(e) => on(e.target.value)} />}
    </div>
  );

  return (
    <>
      <div className="adm__head">
        <h1>Obsah webu</h1>
        <div className="row-actions">
          <button className="rc-btn rc-btn--ghost" onClick={() => { if (confirm("Obnoviť pôvodné texty? Neuložené zmeny sa stratia.")) setC(DEFAULT_CONTENT); }}>Pôvodné texty</button>
          <button className="rc-btn rc-btn--primary" onClick={save} disabled={saving}>{saving ? "Ukladám…" : "Uložiť a zverejniť"}</button>
        </div>
      </div>
      <div className="dv-tabs">
        {tabs.map(([k, l]) => <button key={k} type="button" className={`dv-tab${tab === k ? " on" : ""}`} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      <div className="panel" style={{ maxWidth: 900 }}>
        {tab === "hero" && (
          <>
            <h2>Úvodná sekcia</h2>
            {txt("Horná lišta (časti oddeľte „ · “)", c.topbar, (v) => up({ topbar: v }))}
            <div className="three">
              {txt("Nadpis – 1. riadok", c.hero.title1, (v) => up({ hero: { ...c.hero, title1: v } }))}
              {txt("Nadpis – červený riadok", c.hero.title2, (v) => up({ hero: { ...c.hero, title2: v } }))}
              {txt("Nadpis – 3. riadok", c.hero.title3, (v) => up({ hero: { ...c.hero, title3: v } }))}
            </div>
            {txt("Úvodný text", c.hero.lead, (v) => up({ hero: { ...c.hero, lead: v } }), true)}
            <div className="field">
              <label>Fotky na pozadí úvodu – striedajú sa každých 6 sekúnd (jedna adresa obrázka na riadok)</label>
              <textarea className="input" rows={5} value={c.hero.images.join("\n")} onChange={(e) => up({ hero: { ...c.hero, images: e.target.value.split("\n") } })} />
              <small className="note">Najlepšie široké fotky áut (aspoň 1600 px). Tip: v RACEM Shopify → Súbory skopírujte odkaz na obrázok.</small>
            </div>
            <div className="lbl-sm" style={{ margin: "20px 0 8px" }}>Príklad výpočtu vpravo</div>
            <div className="two">
              {txt("Názov auta", c.quick.title, (v) => up({ quick: { ...c.quick, title: v } }))}
              <div className="field"><label>Cena na aukcii (USD)</label><input className="input" type="number" value={c.quick.bidUsd} onChange={(e) => up({ quick: { ...c.quick, bidUsd: Number(e.target.value) } })} /></div>
              <div className="field"><label>Oprava (EUR)</label><input className="input" type="number" value={c.quick.repairEur} onChange={(e) => up({ quick: { ...c.quick, repairEur: Number(e.target.value) } })} /></div>
              <div className="field"><label>Cena na SK trhu (EUR)</label><input className="input" type="number" value={c.quick.skPrice} onChange={(e) => up({ quick: { ...c.quick, skPrice: Number(e.target.value) } })} /></div>
            </div>
          </>
        )}
        {tab === "feats" && (<><h2>Výhody (pás pod úvodom, max. 4)</h2><ListEditor items={c.feats} onChange={(v) => up({ feats: v })} fields={[{ k: "t", label: "Nadpis" }, { k: "d", label: "Text" }]} blank={{ t: "", d: "" }} addLabel="+ Pridať výhodu" /></>)}
        {tab === "steps" && (<><h2>Ako to funguje – kroky</h2><ListEditor items={c.steps} onChange={(v) => up({ steps: v })} fields={[{ k: "t", label: "Nadpis" }, { k: "d", label: "Popis", area: true }, { k: "tag", label: "Štítok (čas)" }]} blank={{ t: "", d: "", tag: "" }} addLabel="+ Pridať krok" /></>)}
        {tab === "why" && (
          <>
            <h2>Prečo cez nás</h2>
            <ListEditor items={c.why} onChange={(v) => up({ why: v })} fields={[{ k: "t", label: "Nadpis" }, { k: "d", label: "Text", area: true }]} blank={{ t: "", d: "" }} addLabel="+ Pridať" />
            <div style={{ marginTop: 16 }}>{txt("Úprimne o riziku (prázdne = skryté)", c.risk, (v) => up({ risk: v }), true)}</div>
          </>
        )}
        {tab === "bonus" && (
          <>
            <h2>Bonus RACEM</h2>
            {txt("Nadpis (posledné 3 slová budú červené)", c.bonus.title, (v) => up({ bonus: { ...c.bonus, title: v } }))}
            {txt("Text", c.bonus.text, (v) => up({ bonus: { ...c.bonus, text: v } }), true)}
            <div className="lbl-sm" style={{ margin: "8px 0" }}>Odrážky</div>
            <ListEditor items={c.bonus.points.map((p) => ({ p }))} onChange={(v) => up({ bonus: { ...c.bonus, points: v.map((x) => x.p) } })} fields={[{ k: "p", label: "Text" }]} blank={{ p: "" }} addLabel="+ Pridať odrážku" />
            <div className="lbl-sm" style={{ margin: "20px 0 8px" }}>Úrovne kreditu (zobrazenie; výpočet sa nastavuje v Kalkulačke)</div>
            <ListEditor items={c.bonus.tiers} onChange={(v) => up({ bonus: { ...c.bonus, tiers: v } })} fields={[{ k: "label", label: "Popis" }, { k: "v", label: "Kredit (€)", num: true }]} blank={{ label: "", v: 0 }} addLabel="+ Pridať úroveň" />
          </>
        )}
        {tab === "faq" && (<><h2>Časté otázky</h2><p className="note" style={{ marginTop: 0 }}>Prvých 6 sa zobrazí na úvodnej stránke. Všetky sú na stránke Časté otázky a Google ich vidí ako FAQ.</p><ListEditor items={c.faq} onChange={(v) => up({ faq: v })} fields={[{ k: "q", label: "Otázka" }, { k: "a", label: "Odpoveď", area: true }]} blank={{ q: "", a: "" }} addLabel="+ Pridať otázku" /></>)}
        {tab === "contact" && (
          <>
            <h2>Kontakt</h2>
            <div className="two">
              {txt("Telefón (prázdne = nezobrazí sa)", c.contact.phone, (v) => up({ contact: { ...c.contact, phone: v } }))}
              {txt("Kedy voláte (napr. Po–Pi 9–18)", c.contact.hours, (v) => up({ contact: { ...c.contact, hours: v } }))}
            </div>
            {txt("Veta pod kontaktom", c.contact.human, (v) => up({ contact: { ...c.contact, human: v } }))}
          </>
        )}
      </div>
    </>
  );
}
