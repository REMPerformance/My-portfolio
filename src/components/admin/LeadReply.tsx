"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { browserClient } from "@/lib/supabase";
import type { Car, Lead } from "@/lib/types";
import { carEstimate, isFixed } from "@/lib/calc";
import { carFullName, eur, fmtDate, RUN_LABEL } from "@/lib/format";
import { SITE } from "@/lib/site";
import { CURRENCIES } from "@/lib/origins";
import { buildReply, EMPTY_OFFER, EMPTY_REPLY, normalizeReply, timeLeft, type Offer, type ReplyData } from "@/lib/replyMail";
import { DateTimePicker } from "./DateTimePicker";
import { useCalcCfg } from "./useCalcCfg";
import { useAdmin } from "./AdminApp";

type CarOpt = { id: string; year: number | null; make: string; model: string; slug: string };
const key = (id: string) => `rem-reply:${id}`;

function fresh(lead: Lead): ReplyData {
  return {
    ...EMPTY_REPLY,
    offers: [{ ...EMPTY_OFFER, title: (lead.car_label || "").replace(/^na mieru:\s*/i, "") }],
    quoteTitle: `Váš dopyt z ${fmtDate(lead.created_at)}`,
    quote: [lead.message?.trim(), lead.max_budget_eur ? `Rozpočet: ${eur(lead.max_budget_eur)}` : ""].filter(Boolean).join("\n")
  };
}
function initial(lead: Lead): ReplyData {
  try {
    const s = localStorage.getItem(key(lead.id));
    const saved = s ? normalizeReply(JSON.parse(s)) : null;
    if (saved) return saved;
  } catch { /* bez uloženého konceptu */ }
  return fresh(lead);
}

/** Fotku zmenší a uloží ako JPEG, ktorý zobrazí každý e-mailový klient. */
async function toJpeg(file: Blob, max = 1400, quality = 0.82): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const cv = document.createElement("canvas");
  cv.width = Math.round(bmp.width * k);
  cv.height = Math.round(bmp.height * k);
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.drawImage(bmp, 0, 0, cv.width, cv.height);
  bmp.close();
  return new Promise((res, rej) => cv.toBlob((b) => (b ? res(b) : rej(new Error("Fotku sa nepodarilo spracovať."))), "image/jpeg", quality));
}

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
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
  const ok = document.execCommand("copy");
  sel?.removeAllRanges();
  el.remove();
  if (!ok) throw new Error("Kopírovanie sa nepodarilo.");
}

/** Odpoveď na dopyt: formulár s jednou alebo viacerými ponukami, náhľad e-mailu a otvorenie Gmailu s predvyplneným adresátom. */
export function LeadReply({ lead, cars, onClose, onOpened }: { lead: Lead; cars: CarOpt[]; onClose: () => void; onOpened: () => void }) {
  const sb = browserClient();
  const { toast } = useAdmin();
  const { cfg } = useCalcCfg();
  const [d, setD] = useState<ReplyData>(() => initial(lead));
  const [tab, setTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [over, setOver] = useState(false);
  const [url, setUrl] = useState("");
  const file = useRef<HTMLInputElement>(null);

  const cur = Math.min(tab, d.offers.length - 1);
  const o = d.offers[cur];
  const set = <K extends keyof ReplyData>(k: K, v: ReplyData[K]) => setD((x) => ({ ...x, [k]: v }));
  const patch = (i: number, p: Partial<Offer> | ((x: Offer) => Partial<Offer>)) =>
    setD((x) => ({ ...x, offers: x.offers.map((of, j) => (j === i ? { ...of, ...(typeof p === "function" ? p(of) : p) } : of)) }));
  const setO = <K extends keyof Offer>(k: K, v: Offer[K]) => patch(cur, { [k]: v } as Partial<Offer>);

  useEffect(() => {
    try { localStorage.setItem(key(lead.id), JSON.stringify(d)); } catch { /* úložisko nie je dostupné */ }
  }, [d, lead.id]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [onClose]);

  const mail = useMemo(() => buildReply(d), [d]);
  const left = timeLeft(o.auctionEnd);

  function addOffer(copy?: boolean) {
    setD((x) => ({ ...x, offers: [...x.offers, copy ? { ...x.offers[cur], photos: [...x.offers[cur].photos] } : { ...EMPTY_OFFER }] }));
    setTab(d.offers.length);
  }
  function removeOffer() {
    if (d.offers.length < 2 || !confirm(`Odstrániť ponuku ${cur + 1}?`)) return;
    setD((x) => ({ ...x, offers: x.offers.filter((_, j) => j !== cur) }));
    setTab(Math.max(0, cur - 1));
  }

  async function fillFromCar(id: string) {
    if (!id) return;
    const i = cur;
    const { data, error } = await sb.from("cars").select("*").eq("id", id).maybeSingle();
    if (error || !data) return toast(error?.message || "Auto sa nenašlo.", true);
    const c = data as Car;
    const fixed = isFixed(c);
    const full = cfg ? carEstimate(cfg, c) : null;
    const bare = cfg ? carEstimate(cfg, c, { noHomolog: true }) : null;
    const vat = full?.priceMode === "net" ? "net" : "gross";
    const price = (r: typeof full) => (r ? String(Math.round(vat === "net" ? r.net : r.gross)) : "");
    patch(i, {
      title: carFullName(c),
      photos: (c.images || []).filter((u) => /^https?:\/\//i.test(u)).slice(0, 7),
      carUrl: c.status === "published" ? `${SITE.url}/auta/${c.slug}` : "",
      vin: c.vin || "",
      year: c.year ? String(c.year) : "",
      mileage: c.odometer_mi ? String(c.odometer_mi) : "",
      mileageUnit: "mi",
      color: c.color || "",
      engine: c.engine || "",
      transmission: c.transmission || "",
      drive: c.drive || "",
      fuel: c.fuel || "",
      docs: c.title_type || "",
      keys: c.keys === true ? "Áno" : c.keys === false ? "Nie" : "",
      condition: c.run_status && c.run_status !== "unknown" ? RUN_LABEL[c.run_status] : "",
      damage: [c.primary_damage, c.secondary_damage].filter(Boolean).join(", "),
      saleType: fixed ? "fixed" : "auction",
      bid: String((fixed ? c.price_usd : c.current_bid_usd) || ""),
      currency: c.currency || "USD",
      auctionEnd: (fixed ? c.order_close_at : c.auction_end_at) || null,
      location: c.location || "",
      priceNoReg: price(bare),
      priceReg: price(full),
      vat
    });
    toast("Údaje predvyplnené z auta v ponuke. Skontrolujte ich prosím.");
  }

  async function upload(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    const i = cur;
    setUploading(list.length);
    const out: string[] = [];
    for (const [k, f] of list.entries()) {
      try {
        const blob = await toJpeg(f);
        const path = `dopyty/${lead.id}/${Date.now().toString(36)}-${k}.jpg`;
        const { error } = await sb.storage.from("car-images").upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000", upsert: false });
        if (error) throw error;
        out.push(sb.storage.from("car-images").getPublicUrl(path).data.publicUrl);
      } catch (e) {
        toast(`Nahrávanie ${f.name} zlyhalo: ${(e as Error).message}`, true);
      } finally {
        setUploading((n) => Math.max(0, n - 1));
      }
    }
    if (out.length) patch(i, (x) => ({ photos: [...x.photos, ...out] }));
  }
  function addUrl() {
    const u = url.trim();
    if (!/^https?:\/\//i.test(u)) return toast("Zadajte celú adresu obrázka, ktorá začína na https://", true);
    setO("photos", [...o.photos, u]);
    setUrl("");
  }
  function removePhoto(i: number) {
    const path = o.photos[i].split("/car-images/")[1];
    // z úložiska mažeme len fotky nahraté k tomuto dopytu, nie fotky áut z ponuky
    if (path?.startsWith(`dopyty/${lead.id}/`) && !d.offers.some((x, j) => j !== cur && x.photos.includes(o.photos[i]))) sb.storage.from("car-images").remove([path]);
    setO("photos", o.photos.filter((_, j) => j !== i));
  }
  function movePhoto(i: number, to: number) {
    if (to < 0 || to >= o.photos.length) return;
    const arr = [...o.photos];
    const [x] = arr.splice(i, 1);
    arr.splice(to, 0, x);
    setO("photos", arr);
  }

  const gmailUrl = `https://mail.google.com/mail/?authuser=${encodeURIComponent(SITE.email)}&view=cm&fs=1&to=${encodeURIComponent(lead.email)}&su=${encodeURIComponent(mail.subject)}`;

  async function copy(open: boolean) {
    // okno otvárame hneď pri kliknutí, inak ho prehliadač zablokuje ako vyskakovacie
    const win = open ? window.open("about:blank", "_blank") : null;
    try {
      await copyRich(mail.html, mail.text);
      setCopied(true);
      if (win) { win.location.href = gmailUrl; onOpened(); }
      toast(open ? "E-mail je skopírovaný. V Gmaili kliknite do správy a stlačte Ctrl+V." : "E-mail je skopírovaný do schránky");
    } catch (e) {
      win?.close();
      toast(e instanceof Error ? e.message : "Kopírovanie sa nepodarilo.", true);
    }
  }
  function reset() {
    if (!confirm("Vymazať všetky vyplnené údaje?")) return;
    setTab(0);
    setD(fresh(lead));
  }

  const txt = (k: keyof Offer, label: string, ph?: string) => (
    <div className="field"><label>{label}</label><input className="input" value={o[k] as string} placeholder={ph} onChange={(e) => setO(k, e.target.value as never)} /></div>
  );

  return (
    <div className="reply" role="dialog" aria-modal="true" aria-label="Odpoveď na dopyt">
      <div className="reply__bar">
        <div>
          <b>Odpoveď na dopyt</b>
          <small>{lead.name || lead.phone} · {lead.email}</small>
        </div>
        <div className="row-actions">
          <button className="rc-btn rc-btn--ghost rc-btn--sm" onClick={reset}>Vymazať</button>
          <button className="rc-btn rc-btn--ghost rc-btn--sm" onClick={() => copy(false)}>Len skopírovať</button>
          <button className="rc-btn rc-btn--primary rc-btn--sm" onClick={() => copy(true)} disabled={uploading > 0}>Skopírovať a otvoriť Gmail</button>
          <button className="rc-btn rc-btn--ghost rc-btn--sm" onClick={onClose}>Zavrieť</button>
        </div>
      </div>
      {copied && <div className="reply__hint">E-mail je v schránke. V Gmaili je už vyplnený adresát aj predmet, kliknite do tela správy a vložte ho cez <b>Ctrl+V</b>.</div>}
      <div className="reply__body">
        <div className="reply__form">
          {lead.message && <div className="reply__ask"><small>Dopyt zákazníka</small>{lead.message}</div>}

          <h3>Úvod</h3>
          <div className="field"><label>Oslovenie</label><input className="input" value={d.greeting} placeholder="Dobrý deň, pán Novák," onChange={(e) => set("greeting", e.target.value)} /></div>
          <div className="field"><label>Úvodný text</label><textarea className="input" rows={3} value={d.intro} onChange={(e) => set("intro", e.target.value)} /></div>

          <div className="wiz reply__tabs">
            {d.offers.map((x, i) => (
              <button type="button" key={i} className={i === cur ? "on" : ""} onClick={() => setTab(i)}><i>{i + 1}</i>{x.title.trim() || `Ponuka ${i + 1}`}</button>
            ))}
            <button type="button" onClick={() => addOffer()}>+ Pridať ponuku</button>
          </div>
          <div className="row-actions" style={{ marginBottom: 14 }}>
            <button type="button" className="rc-btn rc-btn--ghost rc-btn--sm" onClick={() => addOffer(true)}>Duplikovať túto ponuku</button>
            {d.offers.length > 1 && <button type="button" className="rc-btn rc-btn--ghost rc-btn--sm" onClick={removeOffer}>Odstrániť ponuku {cur + 1}</button>}
          </div>

          {cars.length > 0 && (
            <div className="field">
              <label>Predvyplniť z auta v ponuke</label>
              <select className="input" value="" onChange={(e) => fillFromCar(e.target.value)}>
                <option value="">Vybrať auto…</option>
                {cars.map((c) => <option key={c.id} value={c.id}>{c.year} {c.make} {c.model}</option>)}
              </select>
              <span className="hint">Doplní údaje, fotky aj odhadované ceny podľa kalkulácie. Všetko sa dá potom upraviť.</span>
            </div>
          )}

          <h3>Auto</h3>
          {txt("title", "Názov auta", "2021 Jeep Wrangler Unlimited Rubicon 392")}
          <div className="reply__g">
            {txt("year", "Rok výroby", "2021")}
            <div className="field">
              <label>Najazdené</label>
              <div className="reply__pair">
                <input className="input" inputMode="numeric" value={o.mileage} placeholder="36672" onChange={(e) => setO("mileage", e.target.value)} />
                <select className="input" value={o.mileageUnit} onChange={(e) => setO("mileageUnit", e.target.value as Offer["mileageUnit"])}><option value="mi">míle</option><option value="km">km</option></select>
              </div>
              <span className="hint">Míle sa v e-maile prepočítajú na kilometre.</span>
            </div>
            {txt("engine", "Motor", "6.4L V8, 470 HP")}
            {txt("transmission", "Prevodovka", "Automatická")}
            {txt("drive", "Pohon", "4x4")}
            {txt("fuel", "Palivo", "Benzín")}
            {txt("color", "Farba", "Červená")}
            {txt("keys", "Kľúče", "Áno")}
            {txt("condition", "Stav", "Štartuje a jazdí")}
            {txt("damage", "Poškodenie", "Predná časť, bez poškodenia rámu")}
            {txt("docs", "Doklady", "Originál (Texas)")}
            {txt("vin", "VIN")}
          </div>

          <h3>Fotky</h3>
          <div
            className={`drop${over ? " over" : ""}`}
            onClick={() => file.current?.click()}
            onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setOver(true); } }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => { if (e.dataTransfer.files.length) { e.preventDefault(); setOver(false); upload(e.dataTransfer.files); } }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") file.current?.click(); }}
          >
            <b>Pretiahnite fotky sem</b> alebo kliknite a vyberte zo zariadenia.
            <div className="note" style={{ marginTop: 6 }}>Prvá fotka je v e-maile veľká, ostatné sú pod ňou po tri v rade.</div>
            <input ref={file} type="file" accept="image/*" multiple hidden onChange={(e) => { if (e.target.files) upload(e.target.files); e.target.value = ""; }} />
          </div>
          {(o.photos.length > 0 || uploading > 0) && (
            <div className="imgs">
              {o.photos.map((src, i) => (
                <div key={src + i} className={`it${i === 0 ? " cover" : ""}`} style={{ cursor: "default" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" />
                  <div className="bar">
                    <span>{i === 0 ? "Hlavná" : i + 1}</span>
                    <span style={{ display: "flex", gap: 4 }}>
                      {i > 0 && <button type="button" title="Posunúť dopredu" onClick={() => movePhoto(i, i - 1)}>←</button>}
                      {i < o.photos.length - 1 && <button type="button" title="Posunúť dozadu" onClick={() => movePhoto(i, i + 1)}>→</button>}
                      <button type="button" title="Odstrániť" onClick={() => removePhoto(i)}>✕</button>
                    </span>
                  </div>
                </div>
              ))}
              {Array.from({ length: uploading }, (_, i) => <div key={`u${i}`} className="it up">Nahrávam…</div>)}
            </div>
          )}
          <div className="field" style={{ marginTop: 12 }}>
            <label>Alebo adresa obrázka</label>
            <div className="reply__pair" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
              <input className="input" value={url} placeholder="https://…" onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addUrl(); } }} />
              <button type="button" className="rc-btn rc-btn--ghost rc-btn--sm" onClick={addUrl}>Pridať</button>
            </div>
            <span className="hint">Fotky nahraté zo zariadenia sú spoľahlivejšie, adresy z aukčných stránok sa zákazníkovi nemusia zobraziť.</span>
          </div>

          <h3>{o.saleType === "fixed" ? "Ponuka predajcu" : "Aukcia"}</h3>
          <div className="reply__g">
            <div className="field">
              <label>Typ predaja</label>
              <select className="input" value={o.saleType} onChange={(e) => setO("saleType", e.target.value as Offer["saleType"])}><option value="auction">Aukcia</option><option value="fixed">Od predajcu</option></select>
            </div>
            <div className="field">
              <label>{o.saleType === "fixed" ? "Cena u predajcu" : "Aktuálna ponuka"}</label>
              <div className="reply__pair">
                <input className="input" inputMode="numeric" value={o.bid} placeholder="24500" onChange={(e) => setO("bid", e.target.value)} />
                <select className="input" value={o.currency} onChange={(e) => setO("currency", e.target.value)}>{CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}</select>
              </div>
            </div>
            <DateTimePicker key={cur} label={o.saleType === "fixed" ? "Ponuka platí do" : "Koniec aukcie"} value={o.auctionEnd} onChange={(v) => setO("auctionEnd", v)} hint={left ? `V e-maile: ${left}` : "Počet dní do konca sa dopočíta sám."} />
            {txt("location", "Lokalita", "Houston, Texas, USA")}
          </div>

          <h3>Cena na Slovensku</h3>
          <div className="reply__g">
            <div className="field"><label>Bez prihlásenia (EUR)</label><input className="input" inputMode="numeric" value={o.priceNoReg} placeholder="46900" onChange={(e) => setO("priceNoReg", e.target.value)} /></div>
            <div className="field"><label>S prihlásením (EUR)</label><input className="input" inputMode="numeric" value={o.priceReg} placeholder="52900" onChange={(e) => setO("priceReg", e.target.value)} /></div>
            {txt("noRegNote", "Popis pod cenou bez prihlásenia")}
            {txt("regNote", "Popis pod cenou s prihlásením")}
            <div className="field">
              <label>Ceny sú uvedené</label>
              <select className="input" value={o.vat} onChange={(e) => setO("vat", e.target.value as Offer["vat"])}><option value="gross">s DPH</option><option value="net">bez DPH</option></select>
            </div>
            {txt("carUrl", "Odkaz na auto na webe", `${SITE.url}/auta/…`)}
          </div>
          <p className="note" style={{ marginTop: 0 }}>V e-maile sú ceny vždy označené ako odhadované.</p>
          <div className="field"><label>Poznámka k tomuto autu</label><textarea className="input" rows={2} value={o.note} placeholder="Napríklad prečo ho odporúčate" onChange={(e) => setO("note", e.target.value)} /></div>

          <h3>Záver e-mailu</h3>
          <div className="field"><label>Záverečný text</label><textarea className="input" rows={3} value={d.outro} onChange={(e) => set("outro", e.target.value)} /></div>
          <div className="field"><label>Dopyt zákazníka na konci e-mailu</label><textarea className="input" rows={6} value={d.quote} onChange={(e) => set("quote", e.target.value)} /><span className="hint">Zákazník vidí, na čo odpovedáte. Ak pole vymažete, časť sa v e-maile nezobrazí.</span></div>
        </div>
        <div className="reply__preview">
          <div className="reply__subj"><small>Predmet</small>{mail.subject}</div>
          <iframe title="Náhľad e-mailu" sandbox="" srcDoc={`<!doctype html><html><head><meta charset="utf-8"><base target="_blank"></head><body style="margin:0;background:#eef0f3">${mail.html}</body></html>`} />
        </div>
      </div>
    </div>
  );
}
