"use client";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase";
import type { Car, DamageZone } from "@/lib/types";
import { carEstimate, fxRate } from "@/lib/calc";
import { eur, money, slugify } from "@/lib/format";
import { COUNTRIES, CURRENCIES, countryDef, guessPlace } from "@/lib/origins";
import { parseListing, type Parsed } from "@/lib/listingParse";
import { useAdmin } from "@/components/admin/AdminApp";
import { ImageManager } from "@/components/admin/ImageManager";
import { DamageMap } from "@/components/DamageMap";
import { CalcOverridePanel, ExtrasPanel } from "@/components/admin/CarExtras";
import { Breakdown } from "@/components/Breakdown";
import { MoneyPair } from "@/components/admin/MoneyPair";
import { DateTimePicker } from "@/components/admin/DateTimePicker";
import { useCalcCfg } from "@/components/admin/useCalcCfg";

type Form = Omit<Car, "created_at" | "updated_at" | "views" | "leads_count">;

const AUCTIONS = ["Copart", "IAAI", "Manheim", "Emirates Auction", "Iná"];

function blank(): Form {
  return {
    id: crypto.randomUUID(), slug: "", status: "draft", is_demo: false, featured: false, type: "car",
    year: new Date().getFullYear() - 3, make: "", model: "", trim: "", vin: "", odometer_mi: null, engine: "", transmission: "", drive: "", fuel: "Benzín", color: "",
    keys: true, run_status: "run_drive", title_type: "Salvage", primary_damage: "", secondary_damage: "", damage_zones: [],
    location: "", region: "central", auction: "Copart", lot: "", auction_url: "", images: [],
    sale_type: "auction", price_usd: null, seller_fee_usd: null, country: "US", state: null, currency: "USD", published_at: null,
    current_bid_usd: null, est_bid_usd: null, repair_eur: null, sk_price_eur: null, sk_price_source: "",
    order_close_at: null, auction_end_at: null, description: "", note: "", seo_title: "", seo_description: "", extra: {}, calc_override: {}
  };
}

const STEPS = ["Auto", "Pôvod a cena", "Fotky", "Poškodenie", "Popis a zverejnenie"];

export default function EditCar({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === "nove";
  const sb = browserClient();
  const router = useRouter();
  const { toast, revalidate, session } = useAdmin();
  const [f, setF] = useState<Form | null>(isNew ? blank() : null);
  const { cfg } = useCalcCfg();
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [stats, setStats] = useState<{ views: number; leads: number } | null>(null);
  const [step, setStep] = useState(0);
  const [unit, setUnit] = useState<"mi" | "km">("mi");
  const [paste, setPaste] = useState("");
  const [vinBusy, setVinBusy] = useState(false);

  useEffect(() => {
    if (!isNew) {
      sb.from("cars").select("*").eq("id", id).maybeSingle().then(({ data, error }) => {
        if (error || !data) { toast("Auto sa nenašlo", true); router.push("/admin"); return; }
        const { created_at: _c, updated_at: _u, views, leads_count, ...rest } = data as Car;
        setStats({ views, leads: leads_count });
        setF({ ...rest, country: rest.country || "US", currency: rest.currency || "USD", state: rest.state ?? guessPlace(rest.country || "US", rest.location || "") });
        if (rest.country && rest.country !== "US") setUnit("km");
      });
    }
  }, [id, isNew, sb, router, toast]);

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const patch = (p: Partial<Form>) => {
    setDirty(true);
    setF((o) => {
      if (!o) return o;
      const n = { ...o, ...p };
      if (!slugTouched && ["year", "make", "model", "trim"].some((k) => k in p)) n.slug = slugify([n.year, n.make, n.model, n.trim].filter(Boolean).join(" "));
      if ("auction_end_at" in p && p.auction_end_at && o.sale_type !== "fixed") {
        const end = Date.parse(p.auction_end_at);
        const oldEnd = o.auction_end_at ? Date.parse(o.auction_end_at) : null;
        const close = o.order_close_at ? Date.parse(o.order_close_at) : null;
        // uzávierka chýba, je po novom konci, alebo bola naviazaná na starý koniec (24 h) → posuň ju
        if (close === null || close >= end || (oldEnd !== null && Math.abs(oldEnd - close - 24 * 3600e3) < 60e3)) {
          const c24 = end - 24 * 3600e3;
          n.order_close_at = new Date(c24 > Date.now() + 3600e3 ? c24 : end - 2 * 3600e3).toISOString();
        }
      }
      return n;
    });
  };
  const set = <K extends keyof Form>(k: K, v: Form[K]) => patch({ [k]: v } as Partial<Form>);
  const numv = (v: string) => (v === "" ? null : Number(v));
  const fixed = f?.sale_type === "fixed";
  const cd = countryDef(f?.country);

  const setCountry = (c: string) => {
    const d = countryDef(c);
    patch({ country: c, currency: d.currency, state: d.places[0].code, ...(c !== "US" && c !== "CA" ? { sale_type: "fixed" as const, auction: "Dealer", auction_end_at: null } : {}) });
    if (c !== "US") setUnit("km");
  };
  const switchSale = (t: Form["sale_type"]) => {
    if (!f || f.sale_type === t) return;
    if (t === "fixed") patch({ sale_type: t, auction_end_at: null, auction: AUCTIONS.includes(f.auction || "") ? "Dealer" : f.auction });
    else patch({ sale_type: t, auction: AUCTIONS.includes(f.auction || "") ? f.auction : "Copart" });
  };

  const apply = (d: Parsed, src: string) => {
    if (!f) return;
    const p: Partial<Form> = {};
    const keys: (keyof Parsed & keyof Form)[] = ["year", "make", "model", "trim", "vin", "type", "engine", "transmission", "drive", "fuel", "color", "odometer_mi", "keys", "run_status", "title_type", "primary_damage", "secondary_damage", "lot", "location", "state"];
    keys.forEach((k) => { if (d[k] !== undefined && d[k] !== "") (p as Record<string, unknown>)[k] = d[k]; });
    if (d.auction) p.auction = d.auction;
    if (d.current_bid) p.current_bid_usd = d.current_bid;
    if (d.buy_now && fixed) p.price_usd = d.buy_now;
    if (d.state) { p.country = "US"; p.currency = "USD"; }
    const n = Object.keys(p).length;
    if (!n) return toast(`Z ${src} sa nič nepodarilo rozpoznať.`, true);
    patch(p);
    toast(`Doplnené z ${src}: ${n} ${n === 1 ? "údaj" : n < 5 ? "údaje" : "údajov"}. Skontrolujte ich.`);
  };

  async function decodeVin() {
    if (!f?.vin || f.vin.length < 11) return toast("Zadajte VIN (17 znakov).", true);
    setVinBusy(true);
    const r = await fetch(`/api/vin?vin=${encodeURIComponent(f.vin)}`, { headers: { authorization: `Bearer ${session.access_token}` } }).catch(() => null);
    setVinBusy(false);
    const j = r ? await r.json().catch(() => ({})) : {};
    if (!r || !r.ok) return toast((j as { error?: string }).error || "VIN sa nepodarilo overiť.", true);
    apply((j as { data: Parsed }).data, "VIN");
  }

  const est = useMemo(() => (f && cfg ? carEstimate(cfg, f) : null), [f, cfg]);

  async function save(status?: Form["status"]) {
    if (!f) return;
    if (!f.make.trim() || !f.model.trim()) { setStep(0); return toast("Vyplňte značku a model.", true); }
    const slug = slugify(f.slug || [f.year, f.make, f.model, f.trim].filter(Boolean).join(" "));
    if (!slug) return toast("Chýba URL adresa (slug).", true);
    const payload = { ...f, slug, status: status ?? f.status, location: f.location || [f.state && cd.places.find((p) => p.code === f.state)?.name, cd.code !== "US" ? cd.name : null].filter(Boolean).join(", ") };
    if (payload.sale_type === "fixed") {
      payload.auction_end_at = null;
      if (payload.status === "published" && !payload.price_usd) { setStep(1); return toast("Pred zverejnením vyplňte cenu auta.", true); }
    } else if (payload.status === "published" && !payload.auction_end_at) { setStep(1); return toast("Pred zverejnením vyplňte koniec aukcie.", true); }
    if (payload.sale_type !== "fixed" && payload.order_close_at && payload.auction_end_at && Date.parse(payload.order_close_at) > Date.parse(payload.auction_end_at)) {
      setStep(1); return toast("Uzávierka objednávok musí byť pred koncom aukcie.", true);
    }
    setSaving(true);
    const { error } = await sb.from("cars").upsert(payload, { onConflict: "id" });
    setSaving(false);
    if (error) return toast(/duplicate key.*slug/i.test(error.message) ? "Táto URL adresa už existuje, zmeňte ju v kroku 5." : error.message, true);
    setF(payload); setDirty(false);
    toast(payload.status === "published" ? "Uložené a zverejnené" : "Uložené");
    await revalidate([slug]);
    if (isNew) router.replace(`/admin/auta/${f.id}`);
  }

  if (!f || !cfg) return <p className="note">Načítavam…</p>;
  const cur = f.currency || cd.currency;
  const rate = fxRate(cfg, cur);
  const odoShown = f.odometer_mi == null ? "" : unit === "mi" ? f.odometer_mi : Math.round(f.odometer_mi * 1.609344);
  const titleLen = (f.seo_title || "").length, descLen = (f.seo_description || "").length;
  const name = [f.year, f.make, f.model, f.trim].filter(Boolean).join(" ");
  const autoTitle = `${name} ${cd.from} – ${est ? eur(est.total) : ""} na SK značkách`;
  const autoDesc = `${name} ${fixed ? "za pevnú cenu" : `z aukcie ${f.auction || "Copart"}`} (${f.location || cd.name}). ${fixed ? "Cena s dovozom" : "Odhad celkovej ceny"} na Slovensku ${est ? eur(est.total) : ""} vrátane dopravy, cla a DPH.`;
  const checks = [
    { ok: !!(f.make && f.model && f.year), l: "Značka, model, rok" },
    { ok: fixed ? !!f.price_usd : !!(f.est_bid_usd || f.current_bid_usd), l: fixed ? "Cena auta" : "Odhad vydraženia" },
    { ok: fixed || !!f.auction_end_at, l: fixed ? "Pevná cena (bez termínu)" : "Koniec aukcie" },
    { ok: f.images.length >= 3, l: `Fotky (${f.images.length})` },
    { ok: f.damage_zones.length > 0 || /bez poškod/i.test(f.primary_damage || ""), l: "Poškodenie vyznačené" },
    { ok: (f.description || "").length > 60, l: "Popis auta" }
  ];
  const doneStep = [checks[0].ok, checks[1].ok && checks[2].ok, checks[3].ok, checks[4].ok, checks[5].ok];

  return (
    <>
      <div className="adm__head">
        <div>
          <Link href="/admin" className="note" style={{ margin: 0 }}>← Späť na autá</Link>
          <h1>{isNew ? "Pridať auto" : name || "Auto"}</h1>
          {stats && <p className="note" style={{ margin: 0 }}>{stats.views} zobrazení · <Link className="link" href={`/admin/dopyty?auto=${f.id}`}>{stats.leads} záujemcov</Link></p>}
        </div>
        <div className="row-actions">
          {!isNew && (f.status === "published" || f.status === "sold") && <a className="rc-btn rc-btn--ghost" href={`/auta/${f.slug}`} target="_blank" rel="noopener">Zobraziť na webe ↗</a>}
          <button className="rc-btn rc-btn--ghost" onClick={() => save()} disabled={saving}>{saving ? "Ukladám…" : "Uložiť koncept"}</button>
        </div>
      </div>

      <nav className="wiz" aria-label="Kroky">
        {STEPS.map((s, i) => (
          <button key={s} type="button" className={`${step === i ? "on" : ""}${doneStep[i] ? " done" : ""}`} onClick={() => setStep(i)}>
            <i>{doneStep[i] && step !== i ? "✓" : i + 1}</i>{s}
          </button>
        ))}
      </nav>

      <div className="edit-grid">
        <div>
          {step === 0 && (
            <>
              <div className="panel">
                <h2>Rýchle vyplnenie</h2>
                <p className="help">Zadajte VIN a údaje sa doplnia samy (funguje pre autá vyrobené pre USA). Alebo skopírujte text z inzerátu na Coparte, IAAI či u dealera a vložte ho sem.</p>
                <div className="field">
                  <label htmlFor="vin">VIN</label>
                  <div className="vinbox">
                    <input id="vin" className="input" value={f.vin ?? ""} onChange={(e) => set("vin", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} maxLength={17} placeholder="1FA6P8CF0L5123456" style={{ fontFamily: "ui-monospace,monospace", letterSpacing: ".05em" }} />
                    <button type="button" className="rc-btn rc-btn--primary" onClick={decodeVin} disabled={vinBusy}>{vinBusy ? "Overujem…" : "Doplniť z VIN"}</button>
                  </div>
                </div>
                <details className="fold">
                  <summary>Vložiť text z inzerátu</summary>
                  <div>
                    <textarea className="input" rows={6} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={"Označte na stránke inzerátu všetko (Ctrl+A), skopírujte (Ctrl+C) a vložte sem.\nRozpoznám rok, značku, model, VIN, km, poškodenie, lokalitu, lot, kľúče…"} />
                    <button type="button" className="rc-btn rc-btn--ghost" style={{ marginTop: 8 }} onClick={() => apply(parseListing(paste), "textu")} disabled={!paste.trim()}>Rozpoznať údaje</button>
                  </div>
                </details>
              </div>

              <div className="panel">
                <h2>Základné údaje</h2>
                <div className="three">
                  <div className="field"><label>Značka *</label><input className="input" value={f.make} onChange={(e) => set("make", e.target.value)} placeholder="Ford" /></div>
                  <div className="field"><label>Model *</label><input className="input" value={f.model} onChange={(e) => set("model", e.target.value)} placeholder="Mustang" /></div>
                  <div className="field"><label>Rok výroby</label><input className="input" type="number" value={f.year ?? ""} onChange={(e) => set("year", numv(e.target.value))} /></div>
                </div>
                <div className="three">
                  <div className="field"><label>Verzia</label><input className="input" value={f.trim ?? ""} onChange={(e) => set("trim", e.target.value)} placeholder="GT 5.0 Premium" /></div>
                  <div className="field"><label>Typ (určuje clo)</label>
                    <select className="input" value={f.type} onChange={(e) => set("type", e.target.value as Form["type"])}>
                      <option value="car">Osobné auto</option><option value="suv">SUV</option><option value="truck">Pickup / úžitkové</option><option value="moto">Motocykel</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Najazdené</label>
                    <div className="vinbox">
                      <input className="input" type="number" value={odoShown} onChange={(e) => { const v = numv(e.target.value); set("odometer_mi", v == null ? null : unit === "mi" ? v : Math.round(v / 1.609344)); }} />
                      <select className="input" style={{ width: 76 }} value={unit} onChange={(e) => setUnit(e.target.value as "mi" | "km")} aria-label="Jednotka"><option value="mi">mi</option><option value="km">km</option></select>
                    </div>
                    {f.odometer_mi && unit === "mi" ? <span className="hint">≈ {Math.round(f.odometer_mi * 1.609344).toLocaleString("sk-SK")} km</span> : null}
                  </div>
                </div>
                <div className="three">
                  <div className="field"><label>Motor</label><input className="input" value={f.engine ?? ""} onChange={(e) => set("engine", e.target.value)} placeholder="5.0 V8" /></div>
                  <div className="field"><label>Prevodovka</label><input className="input" value={f.transmission ?? ""} onChange={(e) => set("transmission", e.target.value)} placeholder="Automat 10st." /></div>
                  <div className="field"><label>Pohon</label>
                    <select className="input" value={f.drive ?? ""} onChange={(e) => set("drive", e.target.value)}><option value="">—</option><option>FWD</option><option>RWD</option><option>AWD</option><option>4x4</option></select>
                  </div>
                </div>
                <div className="three">
                  <div className="field"><label>Palivo</label>
                    <select className="input" value={f.fuel ?? ""} onChange={(e) => set("fuel", e.target.value)}><option>Benzín</option><option>Diesel</option><option>Hybrid</option><option>Plug-in hybrid</option><option>Elektro</option></select>
                  </div>
                  <div className="field"><label>Farba</label><input className="input" value={f.color ?? ""} onChange={(e) => set("color", e.target.value)} /></div>
                  <div className="field"><label>Stav</label>
                    <select className="input" value={f.run_status ?? "unknown"} onChange={(e) => set("run_status", e.target.value as Form["run_status"])}>
                      <option value="run_drive">Štartuje a jazdí</option><option value="starts">Štartuje</option><option value="no_start">Neštartuje</option><option value="unknown">Neoverené</option>
                    </select>
                  </div>
                </div>
                <div className="three">
                  <div className="field"><label>Titul / doklady</label>
                    <select className="input" value={f.title_type ?? ""} onChange={(e) => set("title_type", e.target.value)}>
                      <option>Clean</option><option>Salvage</option><option>Rebuilt</option><option>Certificate of Destruction</option><option>Parts only</option>
                    </select>
                  </div>
                  <div className="field" style={{ justifyContent: "flex-end" }}><label className="switch" style={{ minHeight: 42 }}><input type="checkbox" checked={!!f.keys} onChange={(e) => set("keys", e.target.checked)} /> Kľúče k dispozícii</label></div>
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="panel">
                <h2>Odkiaľ auto je</h2>
                <div className="three">
                  <div className="field"><label>Krajina</label>
                    <select className="input" value={f.country} onChange={(e) => setCountry(e.target.value)}>
                      {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="field"><label>{cd.placeLabel}</label>
                    <select className="input" value={f.state ?? ""} onChange={(e) => set("state", e.target.value || null)}>
                      <option value="">— vyberte —</option>
                      {[...cd.places].sort((a, b) => a.name.localeCompare(b.name, "sk")).map((p) => <option key={p.code} value={p.code}>{p.name}{cd.code === "US" ? ` (${p.code})` : ""}</option>)}
                    </select>
                  </div>
                  <div className="field"><label>Mesto (nepovinné)</label><input className="input" value={f.location ?? ""} onChange={(e) => set("location", e.target.value)} placeholder={cd.code === "US" ? "Dallas, TX" : cd.places[0].name} /></div>
                </div>
                {est && <p className="help" style={{ margin: 0 }}>Doprava: {est.placeName} → prístav {est.portName} · spolu {eur(est.inlandEur + est.oceanEur)}</p>}
                {cd.note && <p className="note">{cd.note}</p>}
              </div>

              <div className="panel">
                <h2>Spôsob predaja a cena</h2>
                <div className="seg" role="radiogroup" aria-label="Typ predaja">
                  <button type="button" role="radio" aria-checked={!fixed} className={!fixed ? "on" : ""} onClick={() => switchSale("auction")}><b>Aukcia</b><small>Dražba, cena sa ukáže až na konci</small></button>
                  <button type="button" role="radio" aria-checked={fixed} className={fixed ? "on" : ""} onClick={() => switchSale("fixed")}><b>Pevná cena</b><small>Dealer, Buy Now, súkromný predajca</small></button>
                </div>
                <div className="three">
                  {fixed ? (
                    <div className="field"><label>Predajca</label>
                      <input className="input" list="sellers" value={f.auction ?? ""} onChange={(e) => set("auction", e.target.value)} placeholder="Dealer" />
                      <datalist id="sellers"><option value="Dealer" /><option value="Copart Buy It Now" /><option value="IAAI Buy Now" /><option value="Súkromný predajca" /></datalist>
                    </div>
                  ) : (
                    <div className="field"><label>Aukcia</label>
                      <select className="input" value={f.auction ?? ""} onChange={(e) => set("auction", e.target.value)}>{AUCTIONS.map((a) => <option key={a}>{a}</option>)}</select>
                    </div>
                  )}
                  <div className="field"><label>{fixed ? "Číslo inzerátu" : "Číslo lotu"}</label><input className="input" value={f.lot ?? ""} onChange={(e) => set("lot", e.target.value)} /></div>
                  <div className="field"><label>Mena ceny</label>
                    <select className="input" value={cur} onChange={(e) => set("currency", e.target.value)}>
                      {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code} – {c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="field"><label>Odkaz na {fixed ? "inzerát" : "aukciu"} (len pre Vás)</label><input className="input" type="url" value={f.auction_url ?? ""} onChange={(e) => set("auction_url", e.target.value)} placeholder="https://…" /></div>
                {fixed ? (
                  <>
                    <div className="two">
                      <MoneyPair label="Buy-out cena auta" required value={f.price_usd} currency={cur} rate={rate} onChange={(v) => set("price_usd", v)} hint="Buy Now / cena u predajcu" />
                      <MoneyPair label="Poplatky predajcu" value={f.seller_fee_usd} currency={cur} rate={rate} onChange={(v) => set("seller_fee_usd", v)} hint="Doc fee, Buy Now fee…" />
                    </div>
                    <div className="three">
                      <DateTimePicker label="Ponuka platí do" value={f.order_close_at} onChange={(v) => set("order_close_at", v)} hint="Prázdne = do predaja" quick={[3, 7, 14, 30]} defaultHour={23} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="two">
                      <MoneyPair label="Aktuálna ponuka" value={f.current_bid_usd} currency={cur} rate={rate} onChange={(v) => set("current_bid_usd", v)} />
                      <MoneyPair label="Váš odhad vydraženia" required value={f.est_bid_usd} currency={cur} rate={rate} onChange={(v) => set("est_bid_usd", v)} hint="Z tohto sa počíta cena na webe" />
                    </div>
                    <div className="three">
                      <DateTimePicker label="Koniec aukcie" required value={f.auction_end_at} onChange={(v) => set("auction_end_at", v)} hint="Slovenský čas" />
                      <DateTimePicker label="Uzávierka objednávok" value={f.order_close_at} onChange={(v) => set("order_close_at", v)} hint="Predvolene 24 h pred koncom (pri skorej aukcii 2 h)" />
                    </div>
                  </>
                )}
                <div className="three">
                  <div className="field"><label>Odhad opravy</label><div className="iw"><input className="input" type="number" value={f.repair_eur ?? ""} onChange={(e) => set("repair_eur", numv(e.target.value))} /><span className="u">EUR</span></div></div>
                  <div className="field"><label>Cena takého auta na SK</label><div className="iw"><input className="input" type="number" value={f.sk_price_eur ?? ""} onChange={(e) => set("sk_price_eur", numv(e.target.value))} /><span className="u">EUR</span></div></div>
                  <div className="field"><label>Zdroj ceny na SK</label><input className="input" value={f.sk_price_source ?? ""} onChange={(e) => set("sk_price_source", e.target.value)} placeholder="Autobazar.eu, priemer 5 inzerátov" /></div>
                </div>
              </div>
              <CalcOverridePanel o={f.calc_override || {}} onChange={(x) => set("calc_override", x)} cfg={cfg} type={f.type} country={f.country} place={f.state} />
            </>
          )}

          {step === 2 && (
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
              <p className="note">Prvá fotka je titulná. Poradie zmeníte potiahnutím. {isNew ? "Fotky sa priradia k autu po prvom uložení." : "Zmeny fotiek sa ukladajú automaticky."}</p>
            </div>
          )}

          {step === 3 && (
            <div className="panel">
              <h2>Poškodenie</h2>
              <div className="two">
                <div className="field"><label>Hlavné poškodenie</label><input className="input" list="dmgs" value={f.primary_damage ?? ""} onChange={(e) => set("primary_damage", e.target.value)} placeholder="Predok" /></div>
                <div className="field"><label>Vedľajšie poškodenie</label><input className="input" list="dmgs" value={f.secondary_damage ?? ""} onChange={(e) => set("secondary_damage", e.target.value)} placeholder="Ľavý bok" /></div>
                <datalist id="dmgs">{["Bez poškodenia", "Predok", "Zadok", "Ľavý bok", "Pravý bok", "Strecha", "Krupobitie", "Záplava", "Mechanické", "Drobné škrabance / preliačiny", "Celé auto"].map((d) => <option key={d} value={d} />)}</datalist>
              </div>
              <p className="help">Kliknite na časť auta na nákrese a vyberte, ako veľmi je poškodená. Môžete prepínať pohľady.</p>
              <DamageMap zones={f.damage_zones} onChange={(z: DamageZone[]) => set("damage_zones", z)} />
            </div>
          )}

          {step === 4 && (
            <>
              <div className="panel">
                <h2>Popis</h2>
                <div className="field"><label>Popis auta (zobrazí sa na webe, dôležitý pre Google)</label><textarea className="input" rows={6} value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} placeholder="2–4 vety: výbava, stav, čo treba opraviť, prečo sa auto oplatí. Odseky oddeľte prázdnym riadkom." /></div>
                <div className="field"><label>Váš komentár (zvýraznená poznámka)</label><textarea className="input" rows={3} value={f.note ?? ""} onChange={(e) => set("note", e.target.value)} /></div>
              </div>
              <ExtrasPanel extra={f.extra || {}} onChange={(x) => set("extra", x)} />
              <div className="panel">
                <h2>Zverejnenie</h2>
                <div className="two">
                  <div className="field"><label>Stav na webe</label>
                    <select className="input" value={f.status} onChange={(e) => set("status", e.target.value as Form["status"])}>
                      <option value="draft">Koncept (neviditeľné)</option><option value="published">Zverejnené</option><option value="sold">Predané</option><option value="archived">Archív (neviditeľné)</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Adresa na webe</label>
                    <div className="iw"><input className="input" value={f.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} style={{ paddingLeft: 62 }} /><span className="u" style={{ left: 12, right: "auto" }}>/auta/</span></div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                  <label className="switch"><input type="checkbox" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} /> Zvýraznené</label>
                  <label className="switch"><input type="checkbox" checked={f.is_demo} onChange={(e) => set("is_demo", e.target.checked)} /> Ukážkové auto</label>
                </div>
              </div>
              <details className="fold" style={{ background: "var(--rc-surface)" }}>
                <summary>SEO – vlastný titulok a popis pre Google (nepovinné)</summary>
                <div>
                  <div className="field"><label>Titulok</label><input className="input" value={f.seo_title ?? ""} onChange={(e) => set("seo_title", e.target.value)} placeholder={autoTitle} /><span className={`cnt${titleLen > 60 ? " bad" : ""}`}>{titleLen}/60</span></div>
                  <div className="field"><label>Popis</label><textarea className="input" rows={3} value={f.seo_description ?? ""} onChange={(e) => set("seo_description", e.target.value)} placeholder={autoDesc} /><span className={`cnt${descLen > 160 ? " bad" : ""}`}>{descLen}/160</span></div>
                  <div className="serp">
                    <div className="u">remperformance.sk › auta › {f.slug || "…"}</div>
                    <div className="t">{(() => { const t = f.seo_title || autoTitle; return (t.length > 58 ? t : t + " | REM").slice(0, 70); })()}</div>
                    <div className="d">{(f.seo_description || autoDesc).slice(0, 160)}</div>
                  </div>
                </div>
              </details>
            </>
          )}

          <div className="wiz-foot">
            <button type="button" className="rc-btn rc-btn--ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>← Späť</button>
            {step < STEPS.length - 1 ? (
              <button type="button" className="rc-btn rc-btn--primary" onClick={() => { setStep((s) => s + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Ďalej: {STEPS[step + 1]} →</button>
            ) : (
              <button type="button" className="rc-btn rc-btn--primary" onClick={() => save("published")} disabled={saving}>{f.status === "published" ? "Uložiť zmeny" : "Zverejniť auto"}</button>
            )}
          </div>
        </div>

        <aside className="edit-side">
          <div className="panel sumcard">
            <div className="note" style={{ margin: 0 }}>{fixed ? "Cena spolu na SK značkách" : "Odhad spolu na SK značkách"}</div>
            <div className="big">{est ? eur(est.total) : "—"}</div>
            {est && <p className="note" style={{ marginTop: 4 }}>Auto {money(est.price, est.currency)} = {eur(est.carEur)} · {est.placeName} → {est.portName}{cfg.fxDate ? ` · kurz ECB ${new Date(cfg.fxDate).toLocaleDateString("sk-SK")}` : ""}</p>}
            {est && (
              <details className="fold" style={{ marginTop: 12 }}>
                <summary>Rozpis</summary>
                <div><Breakdown r={est} skPrice={f.sk_price_eur} compact /></div>
              </details>
            )}
          </div>
          <div className="panel">
            <h3 style={{ fontSize: 15, marginBottom: 10 }}>Pred zverejnením</h3>
            <ul className="checklist">{checks.map((c) => <li key={c.l} className={c.ok ? "ok" : ""}>{c.l}</li>)}</ul>
            <button className="rc-btn rc-btn--primary rc-btn--block" style={{ marginTop: 16 }} onClick={() => save(f.status === "published" ? undefined : "published")} disabled={saving}>{f.status === "published" ? "Uložiť zmeny" : "Uložiť a zverejniť"}</button>
            <button className="rc-btn rc-btn--ghost rc-btn--block" style={{ marginTop: 8 }} onClick={() => save()} disabled={saving}>Uložiť bez zmeny stavu</button>
            {dirty && <p className="note">Máte neuložené zmeny.</p>}
          </div>
        </aside>
      </div>
    </>
  );
}
