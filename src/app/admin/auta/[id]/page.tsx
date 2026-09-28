"use client";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase";
import type { Car, CalcConfig, DamageZone } from "@/lib/types";
import { carEstimate, mergeCalc } from "@/lib/calc";
import { eur, regionFromLocation, slugify } from "@/lib/format";
import { useAdmin } from "@/components/admin/AdminApp";
import { ImageManager } from "@/components/admin/ImageManager";
import { DamageMap } from "@/components/DamageMap";
import { CalcOverridePanel, ExtrasPanel } from "@/components/admin/CarExtras";
import { Breakdown } from "@/components/Breakdown";

type Form = Omit<Car, "created_at" | "updated_at" | "views" | "leads_count">;

const toLocal = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const fromLocal = (v: string) => (v ? new Date(v).toISOString() : null);

function blank(): Form {
  return {
    id: crypto.randomUUID(), slug: "", status: "draft", is_demo: false, featured: false, type: "car",
    year: new Date().getFullYear() - 3, make: "", model: "", trim: "", vin: "", odometer_mi: null, engine: "", transmission: "", drive: "", fuel: "Benzín", color: "",
    keys: true, run_status: "run_drive", title_type: "Salvage", primary_damage: "", secondary_damage: "", damage_zones: [],
    location: "", region: "central", auction: "Copart", lot: "", auction_url: "", images: [],
    sale_type: "auction", price_usd: null, seller_fee_usd: null,
    current_bid_usd: null, est_bid_usd: null, repair_eur: null, sk_price_eur: null, sk_price_source: "",
    order_close_at: null, auction_end_at: null, description: "", note: "", seo_title: "", seo_description: "", extra: {}, calc_override: {}
  };
}

export default function EditCar({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === "nove";
  const sb = browserClient();
  const router = useRouter();
  const { toast, revalidate } = useAdmin();
  const [f, setF] = useState<Form | null>(isNew ? blank() : null);
  const [cfg, setCfg] = useState<CalcConfig | null>(null);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [stats, setStats] = useState<{ views: number; leads: number } | null>(null);

  useEffect(() => {
    sb.from("settings").select("value").eq("key", "calc").maybeSingle().then(({ data }) => setCfg(mergeCalc(data?.value)));
    if (!isNew) {
      sb.from("cars").select("*").eq("id", id).maybeSingle().then(({ data, error }) => {
        if (error || !data) { toast("Auto sa nenašlo", true); router.push("/admin"); return; }
        const { created_at: _c, updated_at: _u, views, leads_count, ...rest } = data as Car;
        setStats({ views, leads: leads_count });
        setF(rest);
      });
    }
  }, [id, isNew, sb, router, toast]);

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setDirty(true);
    setF((p) => {
      if (!p) return p;
      const n = { ...p, [k]: v };
      if (!slugTouched && ["year", "make", "model", "trim"].includes(k as string)) n.slug = slugify([n.year, n.make, n.model, n.trim].filter(Boolean).join(" "));
      if (k === "location" && typeof v === "string") n.region = regionFromLocation(v);
      if (k === "auction_end_at" && v && !p.order_close_at && p.sale_type !== "fixed") n.order_close_at = new Date(Date.parse(v as string) - 24 * 3600e3).toISOString();
      return n;
    });
  };
  const numv = (v: string) => (v === "" ? null : Number(v));
  const fixed = f?.sale_type === "fixed";
  const switchSale = (t: Form["sale_type"]) => {
    if (!f || f.sale_type === t) return;
    set("sale_type", t);
    if (t === "fixed") {
      if (["Copart", "IAAI", "Manheim", "Iná"].includes(f.auction || "")) set("auction", "Dealer");
      set("auction_end_at", null);
    } else if (!["Copart", "IAAI", "Manheim", "Iná"].includes(f.auction || "")) set("auction", "Copart");
  };

  const est = useMemo(() => (f && cfg ? carEstimate(cfg, f) : null), [f, cfg]);

  async function save(status?: Form["status"]) {
    if (!f) return;
    if (!f.make.trim() || !f.model.trim()) return toast("Vyplňte značku a model.", true);
    const slug = slugify(f.slug || [f.year, f.make, f.model, f.trim].filter(Boolean).join(" "));
    if (!slug) return toast("Chýba URL adresa (slug).", true);
    const payload = { ...f, slug, status: status ?? f.status };
    if (payload.sale_type === "fixed") {
      payload.auction_end_at = null;
      if (payload.status === "published" && !payload.price_usd) return toast("Pred zverejnením vyplňte cenu auta.", true);
    } else if (payload.status === "published" && !payload.auction_end_at) return toast("Pred zverejnením vyplňte koniec aukcie.", true);
    if (payload.sale_type !== "fixed" && payload.order_close_at && payload.auction_end_at && Date.parse(payload.order_close_at) > Date.parse(payload.auction_end_at))
      return toast("Uzávierka objednávok musí byť pred koncom aukcie.", true);
    setSaving(true);
    const { error } = await sb.from("cars").upsert(payload, { onConflict: "id" });
    setSaving(false);
    if (error) return toast(/duplicate key.*slug/i.test(error.message) ? "Táto URL adresa už existuje, zmeňte slug." : error.message, true);
    setF(payload); setDirty(false);
    toast(payload.status === "published" ? "Uložené a zverejnené" : "Uložené");
    await revalidate([slug]);
    if (isNew) router.replace(`/admin/auta/${f.id}`);
  }

  if (!f || !cfg) return <p className="note">Načítavam…</p>;
  const titleLen = (f.seo_title || "").length, descLen = (f.seo_description || "").length;
  const autoTitle = `${[f.year, f.make, f.model, f.trim].filter(Boolean).join(" ")} z USA – ${est ? eur(est.total) : ""} na SK značkách`;
  const autoDesc = `${[f.year, f.make, f.model, f.trim].filter(Boolean).join(" ")} ${fixed ? "za pevnú cenu" : `z aukcie ${f.auction || "Copart"}`} (${f.location || "USA"}). ${fixed ? "Cena s dovozom" : "Odhad celkovej ceny"} na Slovensku ${est ? eur(est.total) : ""} vrátane cla, DPH a dopravy.`;

  return (
    <>
      <div className="adm__head">
        <div>
          <Link href="/admin" className="note" style={{ margin: 0 }}>← Späť na autá</Link>
          <h1>{isNew ? "Nové auto" : [f.year, f.make, f.model].filter(Boolean).join(" ") || "Auto"}</h1>
          {stats && <p className="note" style={{ margin: 0 }}>{stats.views} zobrazení · <Link className="link" href={`/admin/dopyty?auto=${f.id}`}>{stats.leads} záujemcov</Link></p>}
        </div>
        <div className="row-actions">
          {!isNew && (f.status === "published" || f.status === "sold") && <a className="rc-btn rc-btn--ghost" href={`/auta/${f.slug}`} target="_blank" rel="noopener">Zobraziť na webe ↗</a>}
          <button className="rc-btn rc-btn--ghost" onClick={() => save()} disabled={saving}>{saving ? "Ukladám…" : "Uložiť"}</button>
          {f.status !== "published" && <button className="rc-btn rc-btn--primary" onClick={() => save("published")} disabled={saving}>Uložiť a zverejniť</button>}
        </div>
      </div>

      <div className="edit-grid">
        <div>
          <div className="panel">
            <h2>Základ</h2>
            <div className="three">
              <div className="field"><label>Značka *</label><input className="input" value={f.make} onChange={(e) => set("make", e.target.value)} placeholder="Ford" /></div>
              <div className="field"><label>Model *</label><input className="input" value={f.model} onChange={(e) => set("model", e.target.value)} placeholder="Mustang" /></div>
              <div className="field"><label>Rok</label><input className="input" type="number" value={f.year ?? ""} onChange={(e) => set("year", numv(e.target.value))} /></div>
            </div>
            <div className="three">
              <div className="field"><label>Výbava / verzia</label><input className="input" value={f.trim ?? ""} onChange={(e) => set("trim", e.target.value)} placeholder="GT 5.0 Premium" /></div>
              <div className="field"><label>Typ (určuje clo)</label>
                <select className="input" value={f.type} onChange={(e) => set("type", e.target.value as Form["type"])}>
                  <option value="car">Osobné auto</option><option value="suv">SUV</option><option value="truck">Pickup / úžitkové</option><option value="moto">Motocykel</option>
                </select>
              </div>
              <div className="field"><label>Stav na webe</label>
                <select className="input" value={f.status} onChange={(e) => set("status", e.target.value as Form["status"])}>
                  <option value="draft">Koncept (neviditeľné)</option><option value="published">Zverejnené</option><option value="sold">Predané</option><option value="archived">Archív (neviditeľné)</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label>URL adresa (slug)</label>
              <div className="iw"><input className="input" value={f.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} style={{ paddingLeft: 66 }} /><span className="u" style={{ left: 14, right: "auto" }}>/auta/</span></div>
              <span className="hint">Vytvorí sa automaticky. Po zverejnení ju už radšej nemeňte (SEO).</span>
            </div>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              <label className="switch"><input type="checkbox" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} /> Zvýraznené</label>
              <label className="switch"><input type="checkbox" checked={f.is_demo} onChange={(e) => set("is_demo", e.target.checked)} /> Ukážkové auto (štítok „Ukážka“)</label>
            </div>
          </div>

          <div className="panel">
            <h2>{fixed ? "Predaj a cena" : "Aukcia a termíny"}</h2>
            <div className="seg" role="radiogroup" aria-label="Typ predaja">
              <button type="button" role="radio" aria-checked={!fixed} className={!fixed ? "on" : ""} onClick={() => switchSale("auction")}>
                <b>Aukcia</b><small>Dražba na Copart / IAAI, odhad vydraženia</small>
              </button>
              <button type="button" role="radio" aria-checked={fixed} className={fixed ? "on" : ""} onClick={() => switchSale("fixed")}>
                <b>Pevná cena</b><small>Auto za presnú sumu + dovoz (dealer, Buy Now…)</small>
              </button>
            </div>
            {fixed ? (
              <>
                <div className="three">
                  <div className="field"><label>Predajca</label>
                    <input className="input" list="sellers" value={f.auction ?? ""} onChange={(e) => set("auction", e.target.value)} placeholder="Dealer" />
                    <datalist id="sellers"><option value="Dealer" /><option value="Copart Buy It Now" /><option value="IAAI Buy Now" /><option value="Súkromný predajca" /></datalist>
                  </div>
                  <div className="field"><label>Číslo inzerátu / lotu</label><input className="input" value={f.lot ?? ""} onChange={(e) => set("lot", e.target.value)} /></div>
                  <div className="field"><label>Lokalita</label><input className="input" value={f.location ?? ""} onChange={(e) => set("location", e.target.value)} placeholder="Miami, FL" /></div>
                </div>
                <div className="field"><label>Odkaz na inzerát</label><input className="input" type="url" value={f.auction_url ?? ""} onChange={(e) => set("auction_url", e.target.value)} placeholder="https://…" /><span className="hint">Neukazuje sa na webe, len pre Vás.</span></div>
                <div className="three">
                  <div className="field"><label>Cena auta *</label><div className="iw"><input className="input" type="number" value={f.price_usd ?? ""} onChange={(e) => set("price_usd", numv(e.target.value))} /><span className="u">USD</span></div><span className="hint">Presná cena u predajcu.</span></div>
                  <div className="field"><label>Poplatky predajcu</label><div className="iw"><input className="input" type="number" value={f.seller_fee_usd ?? ""} onChange={(e) => set("seller_fee_usd", numv(e.target.value))} /><span className="u">USD</span></div><span className="hint">Doc fee, Buy Now fee… (nepovinné)</span></div>
                  <div className="field"><label>Odhad opravy</label><div className="iw"><input className="input" type="number" value={f.repair_eur ?? ""} onChange={(e) => set("repair_eur", numv(e.target.value))} /><span className="u">EUR</span></div></div>
                </div>
                <div className="two">
                  <div className="field"><label>Ponuka platí do</label><input className="input" type="datetime-local" value={toLocal(f.order_close_at)} onChange={(e) => set("order_close_at", fromLocal(e.target.value))} /><span className="hint">Prázdne = platí, kým auto neoznačíte ako predané.</span></div>
                  <div className="field"><label>Región (doprava)</label>
                    <select className="input" value={f.region} onChange={(e) => set("region", e.target.value as Form["region"])}><option value="east">Východ</option><option value="central">Stred / Texas</option><option value="west">Západ</option></select>
                    <span className="hint">Nastaví sa podľa štátu v lokalite.</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="three">
                  <div className="field"><label>Aukcia</label>
                    <select className="input" value={f.auction ?? ""} onChange={(e) => set("auction", e.target.value)}><option>Copart</option><option>IAAI</option><option>Manheim</option><option>Iná</option></select>
                  </div>
                  <div className="field"><label>Číslo lotu</label><input className="input" value={f.lot ?? ""} onChange={(e) => set("lot", e.target.value)} /></div>
                  <div className="field"><label>Lokalita</label><input className="input" value={f.location ?? ""} onChange={(e) => set("location", e.target.value)} placeholder="Dallas, TX" /></div>
                </div>
                <div className="field"><label>Odkaz na aukciu</label><input className="input" type="url" value={f.auction_url ?? ""} onChange={(e) => set("auction_url", e.target.value)} placeholder="https://www.copart.com/lot/…" /></div>
                <div className="three">
                  <div className="field"><label>Koniec aukcie *</label><input className="input" type="datetime-local" value={toLocal(f.auction_end_at)} onChange={(e) => set("auction_end_at", fromLocal(e.target.value))} /></div>
                  <div className="field"><label>Uzávierka objednávok</label><input className="input" type="datetime-local" value={toLocal(f.order_close_at)} onChange={(e) => set("order_close_at", fromLocal(e.target.value))} /><span className="hint">Predvolene 24 h pred koncom aukcie.</span></div>
                  <div className="field"><label>Región (doprava)</label>
                    <select className="input" value={f.region} onChange={(e) => set("region", e.target.value as Form["region"])}><option value="east">Východ</option><option value="central">Stred / Texas</option><option value="west">Západ</option></select>
                    <span className="hint">Nastaví sa podľa štátu v lokalite.</span>
                  </div>
                </div>
                <div className="three">
                  <div className="field"><label>Aktuálna ponuka</label><div className="iw"><input className="input" type="number" value={f.current_bid_usd ?? ""} onChange={(e) => set("current_bid_usd", numv(e.target.value))} /><span className="u">USD</span></div></div>
                  <div className="field"><label>Váš odhad vydraženia</label><div className="iw"><input className="input" type="number" value={f.est_bid_usd ?? ""} onChange={(e) => set("est_bid_usd", numv(e.target.value))} /><span className="u">USD</span></div><span className="hint">Z tohto sa počíta odhad ceny.</span></div>
                  <div className="field"><label>Odhad opravy</label><div className="iw"><input className="input" type="number" value={f.repair_eur ?? ""} onChange={(e) => set("repair_eur", numv(e.target.value))} /><span className="u">EUR</span></div></div>
                </div>
              </>
            )}
            <div className="two">
              <div className="field"><label>Cena takého auta na SK</label><div className="iw"><input className="input" type="number" value={f.sk_price_eur ?? ""} onChange={(e) => set("sk_price_eur", numv(e.target.value))} /><span className="u">EUR</span></div></div>
              <div className="field"><label>Zdroj ceny na SK</label><input className="input" value={f.sk_price_source ?? ""} onChange={(e) => set("sk_price_source", e.target.value)} placeholder="Autobazar.eu, priemer 5 inzerátov" /></div>
            </div>
          </div>

          <div className="panel">
            <h2>Fotky</h2>
            <ImageManager
              carId={f.id}
              slugHint={f.slug}
              images={f.images}
              onError={(m) => toast(m, true)}
              onChange={(imgs) => {
                set("images", imgs);
                if (!isNew) sb.from("cars").update({ images: imgs }).eq("id", f.id).then(({ error }) => { if (!error) revalidate([f.slug]); });
              }}
            />
            <p className="note">{isNew ? "Fotky sa priradia k autu po prvom uložení." : "Zmeny fotiek sa ukladajú automaticky."}</p>
          </div>

          <div className="panel">
            <h2>Technické údaje</h2>
            <div className="three">
              <div className="field"><label>Najazdené (míle)</label><div className="iw"><input className="input" type="number" value={f.odometer_mi ?? ""} onChange={(e) => set("odometer_mi", numv(e.target.value))} /><span className="u">MI</span></div>{f.odometer_mi ? <span className="hint">≈ {Math.round(f.odometer_mi * 1.609344).toLocaleString("sk-SK")} km</span> : null}</div>
              <div className="field"><label>Motor</label><input className="input" value={f.engine ?? ""} onChange={(e) => set("engine", e.target.value)} placeholder="5.0 V8" /></div>
              <div className="field"><label>Prevodovka</label><input className="input" value={f.transmission ?? ""} onChange={(e) => set("transmission", e.target.value)} placeholder="Automat 10st." /></div>
            </div>
            <div className="three">
              <div className="field"><label>Pohon</label><input className="input" value={f.drive ?? ""} onChange={(e) => set("drive", e.target.value)} placeholder="RWD / AWD / 4x4" /></div>
              <div className="field"><label>Palivo</label>
                <select className="input" value={f.fuel ?? ""} onChange={(e) => set("fuel", e.target.value)}><option>Benzín</option><option>Diesel</option><option>Hybrid</option><option>Elektro</option><option>Plug-in hybrid</option></select>
              </div>
              <div className="field"><label>Farba</label><input className="input" value={f.color ?? ""} onChange={(e) => set("color", e.target.value)} /></div>
            </div>
            <div className="three">
              <div className="field"><label>VIN</label><input className="input" value={f.vin ?? ""} onChange={(e) => set("vin", e.target.value.toUpperCase())} maxLength={17} /></div>
              <div className="field"><label>Stav motora</label>
                <select className="input" value={f.run_status ?? "unknown"} onChange={(e) => set("run_status", e.target.value as Form["run_status"])}>
                  <option value="run_drive">Štartuje a jazdí</option><option value="starts">Štartuje</option><option value="no_start">Neštartuje</option><option value="unknown">Neoverené</option>
                </select>
              </div>
              <div className="field"><label>Titul</label>
                <select className="input" value={f.title_type ?? ""} onChange={(e) => set("title_type", e.target.value)}>
                  <option>Salvage</option><option>Clean</option><option>Rebuilt</option><option>Certificate of Destruction</option><option>Parts only</option>
                </select>
              </div>
            </div>
            <label className="switch"><input type="checkbox" checked={!!f.keys} onChange={(e) => set("keys", e.target.checked)} /> Kľúče sú k dispozícii</label>
          </div>

          <div className="panel">
            <h2>Poškodenie</h2>
            <div className="two">
              <div className="field"><label>Hlavné poškodenie</label><input className="input" value={f.primary_damage ?? ""} onChange={(e) => set("primary_damage", e.target.value)} placeholder="Predok" /></div>
              <div className="field"><label>Vedľajšie poškodenie</label><input className="input" value={f.secondary_damage ?? ""} onChange={(e) => set("secondary_damage", e.target.value)} placeholder="Ľavý bok" /></div>
            </div>
            <DamageMap zones={f.damage_zones} onChange={(z: DamageZone[]) => set("damage_zones", z)} />
          </div>

          <div className="panel">
            <h2>Popis</h2>
            <div className="field"><label>Popis auta (zobrazí sa na webe, dôležité pre Google)</label><textarea className="input" rows={6} value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} placeholder="Napíšte 2–4 vety: výbava, stav, čo treba opraviť, prečo sa auto oplatí. Odseky oddeľte prázdnym riadkom." /></div>
            <div className="field"><label>Váš komentár (zvýraznená poznámka)</label><textarea className="input" rows={3} value={f.note ?? ""} onChange={(e) => set("note", e.target.value)} /></div>
          </div>

          <ExtrasPanel extra={f.extra || {}} onChange={(x) => set("extra", x)} />

          <CalcOverridePanel o={f.calc_override || {}} onChange={(x) => set("calc_override", x)} cfg={cfg} type={f.type} region={f.region} />

          <div className="panel">
            <h2>SEO (Google)</h2>
            <p className="note" style={{ marginTop: 0 }}>Nechajte prázdne a použije sa automatický text. Vyplňte, ak chcete vlastný.</p>
            <div className="field"><label>Titulok</label><input className="input" value={f.seo_title ?? ""} onChange={(e) => set("seo_title", e.target.value)} placeholder={autoTitle} /><span className={`cnt${titleLen > 60 ? " bad" : ""}`}>{titleLen}/60</span></div>
            <div className="field"><label>Popis</label><textarea className="input" rows={3} value={f.seo_description ?? ""} onChange={(e) => set("seo_description", e.target.value)} placeholder={autoDesc} /><span className={`cnt${descLen > 160 ? " bad" : ""}`}>{descLen}/160</span></div>
            <div className="lbl-sm" style={{ marginBottom: 8 }}>Náhľad vo výsledkoch Google</div>
            <div className="serp">
              <div className="u">remperformance.sk › auta › {f.slug || "…"}</div>
              <div className="t">{(() => { const t = f.seo_title || autoTitle; return (t.length > 58 ? t : t + " | REM").slice(0, 70); })()}</div>
              <div className="d">{(f.seo_description || autoDesc).slice(0, 160)}</div>
            </div>
          </div>
        </div>

        <aside className="edit-side">
          <div className="panel">
            <h2>Odhad ceny (živý)</h2>
            {est ? <Breakdown r={est} skPrice={f.sk_price_eur} compact /> : <p className="note">Doplňte ceny.</p>}
          </div>
          <div className="panel">
            <button className="rc-btn rc-btn--primary rc-btn--block" onClick={() => save(f.status === "published" ? undefined : "published")} disabled={saving}>{f.status === "published" ? "Uložiť zmeny" : "Uložiť a zverejniť"}</button>
            <button className="rc-btn rc-btn--ghost rc-btn--block" style={{ marginTop: 8 }} onClick={() => save()} disabled={saving}>Uložiť bez zmeny stavu</button>
            {dirty && <p className="note">Máte neuložené zmeny.</p>}
          </div>
        </aside>
      </div>
    </>
  );
}
