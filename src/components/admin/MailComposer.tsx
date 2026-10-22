"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { browserClient } from "@/lib/supabase";
import type { Car, Lead, Mail } from "@/lib/types";
import { auctionFee, carEstimate, isFixed } from "@/lib/calc";
import { carFullName, RUN_LABEL } from "@/lib/format";
import { SITE } from "@/lib/site";
import { CURRENCIES } from "@/lib/origins";
import { bookmarklet, decodeImport, fromImport } from "@/lib/importListing";
import { importImages } from "@/lib/imageImport";
import { basisText, buildReply, EMPTY_OFFER, offerSection, offersOf, parseQuote, PARTS, timeLeft, type Offer, type ReplyData, type Section } from "@/lib/replyMail";
import { eur } from "@/lib/format";
import { DateTimePicker } from "./DateTimePicker";
import { useCalcCfg } from "./useCalcCfg";
import { useAdmin } from "./AdminApp";
import { getImportTarget, mailData, setImportTarget } from "./mailStore";

type CarOpt = { id: string; year: number | null; make: string; model: string; slug: string };
type EstCar = Parameters<typeof carEstimate>[1];
const digits = (s: string) => Number(String(s).replace(/[^\d]/g, "")) || 0;

const KIND: Record<Section["kind"], { label: string; hint: string; ph: string }> = {
  text: { label: "Text", hint: "Každý riadok je samostatný odsek.", ph: "Voľný text…" },
  rows: { label: "Tabuľka údajov", hint: "Jeden údaj na riadok v tvare Názov: hodnota.", ph: "Záloha pred dražbou: 2 500 €\nÚhrada po vydražení: do 2 dní" },
  list: { label: "Číslovaný zoznam", hint: "Jeden krok na riadok, číslovanie sa doplní samo.", ph: "Potvrdíte maximálnu sumu príhozu.\nPripravíme zmluvu." },
  table: { label: "Cenová tabuľka", hint: "Prvý riadok je hlavička, stĺpce oddeľte zvislou čiarou |.", ph: "Vydražená cena | Cena na Slovensku\n20 000 USD | 38 800 €" },
  quote: { label: "Individuálne nacenenie", hint: "", ph: "" },
  offer: { label: "Ponuka auta", hint: "", ph: "" }
};

/** Editor nacenenia: položky v tabuľke, súčet sa počíta priebežne. Obsah sa ukladá ako riadky Položka | Popis | Suma. */
function QuoteEditor({ body, onChange }: { body: string; onChange: (b: string) => void }) {
  const lines = body.split("\n").filter((l) => l.trim()).map((l) => { const [a = "", b = "", c = ""] = l.split("|").map((x) => x.trim()); return [a, b, c]; });
  const totalIdx = lines.findIndex((l) => l[0].startsWith("="));
  const items = lines.filter((_, i) => i !== totalIdx);
  const total = totalIdx >= 0 ? lines[totalIdx] : ["= SPOLU cca", "Odhad celkovej ceny vozidla na slovenských EČV", ""];
  const q = parseQuote(body);
  const clean = (x: string) => x.replace(/\|/g, "/").replace(/\n/g, " ");
  const save = (next: string[][], t = total) => onChange([...next, t].map((l) => l.slice(0, 3).map(clean).join(" | ")).join("\n"));
  const setCell = (i: number, k: number, v: string) => save(items.map((l, j) => (j === i ? l.map((c, m) => (m === k ? v : c)) : l)));
  const move = (i: number, dir: -1 | 1) => { const n = [...items]; const j = i + dir; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; save(n); };
  return (
    <div className="quote">
      <div className="quote__row quote__row--head"><span>Položka</span><span>Popis pre zákazníka</span><span>Suma</span><span /></div>
      {items.map((l, i) => {
        const r = parseQuote(items.slice(0, i + 1).map((x) => x.join(" | ")).join("\n")).rows.at(-1);
        return (
          <div className="quote__row" key={i}>
            <input className="input" value={l[0]} placeholder="Položka" onChange={(e) => setCell(i, 0, e.target.value)} />
            <input className="input" value={l[1]} placeholder="Popis" onChange={(e) => setCell(i, 1, e.target.value)} />
            <span className="quote__amt">
              <input className="input" value={l[2]} placeholder="0 € alebo 3 %" inputMode="decimal" onChange={(e) => setCell(i, 2, e.target.value)} />
              {r?.pct != null && <small>= {eur(r.value)}</small>}
            </span>
            <span className="blk__act">
              <button type="button" title="Vyššie" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
              <button type="button" title="Nižšie" disabled={i === items.length - 1} onClick={() => move(i, 1)}>↓</button>
              <button type="button" title="Odstrániť" onClick={() => save(items.filter((_, j) => j !== i))}>✕</button>
            </span>
          </div>
        );
      })}
      <div className="quote__row quote__row--total">
        <input className="input" value={total[0].replace(/^=\s*/, "")} onChange={(e) => save(items, ["= " + e.target.value, total[1], ""])} />
        <input className="input" value={total[1]} onChange={(e) => save(items, [total[0], e.target.value, ""])} />
        <b>{eur(q.total)}</b>
        <span />
      </div>
      <div className="row-actions" style={{ marginTop: 10 }}>
        <button type="button" className="rc-btn rc-btn--ghost rc-btn--sm" onClick={() => save([...items, ["", "", ""]])}>+ Pridať položku</button>
      </div>
      <span className="hint">Sumu píšte v eurách. Ak napíšete percentá (napríklad 3 %), vypočítajú sa zo súčtu položiek nad nimi. Prázdne sumy sa v e-maile zobrazia bez čísla.</span>
    </div>
  );
}
const TEXT_KINDS = ["text", "rows", "list", "table"] as const;

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

/** Obe ceny na Slovensku (bez prihlásenia a s prihlásením) pre danú sumu vydraženia. */
function pricesFor(cfg: NonNullable<ReturnType<typeof useCalcCfg>["cfg"]>, o: Pick<Offer, "calcCar" | "saleType" | "currency" | "location">, bid: number) {
  const base = (o.calcCar || {}) as Partial<EstCar>;
  const fixed = o.saleType === "fixed";
  const car = { type: "car", country: "US", repair_eur: 0, location: o.location, ...base, currency: o.currency || base.currency || "USD", sale_type: fixed ? "fixed" : "auction", est_bid_usd: bid, current_bid_usd: bid, price_usd: bid } as EstCar;
  // poplatky prevzaté z kalkulačky aukcie platia len pre sumu, pri ktorej boli načítané
  if (!fixed && base.est_bid_usd !== bid) delete (car as { seller_fee_usd?: unknown }).seller_fee_usd;
  const full = carEstimate(cfg, car);
  const bare = carEstimate(cfg, car, { noHomolog: true });
  const vat: Offer["vat"] = full.priceMode === "net" ? "net" : "final";
  const p = (r: typeof full) => String(Math.round(vat === "net" ? r.net : r.gross));
  return { priceNoReg: p(bare), priceReg: p(full), vat };
}

/** Editor e-mailu: adresát, časti poskladané v ľubovoľnom poradí, náhľad a otvorenie Gmailu. Koncept sa priebežne ukladá do databázy. */
export function MailComposer({ mail, lead, cars, onClose }: { mail: Mail; lead: Lead | null; cars: CarOpt[]; onClose: (m: Mail) => void }) {
  const sb = browserClient();
  const { toast, session } = useAdmin();
  const { cfg } = useCalcCfg();
  const [d, setD] = useState<ReplyData>(() => mailData(mail));
  const [to, setTo] = useState({ email: mail.to_email, name: mail.to_name });
  const [status, setStatus] = useState<Mail["status"]>(mail.status);
  const [sentAt, setSentAt] = useState(mail.sent_at);
  const [sel, setSel] = useState(() => { const s = mailData(mail).sections; return s.length === 1 ? 0 : s.findIndex((x) => !x.body.trim() && !(x.offer && (x.offer.title.trim() || x.offer.photos.length))); });
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [over, setOver] = useState(false);
  const [url, setUrl] = useState("");
  const [saved, setSaved] = useState<"ok" | "saving" | "err">("ok");
  const [waiting, setWaiting] = useState(false);
  const [imp, setImp] = useState<{ done: number; total: number } | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const bmRef = useRef<HTMLAnchorElement>(null);
  const importRan = useRef(false);
  const first = useRef(true);

  const cur = sel;
  const o: Offer | undefined = d.sections[sel]?.kind === "offer" ? d.sections[sel].offer : undefined;
  const set = <K extends keyof ReplyData>(k: K, v: ReplyData[K]) => setD((x) => ({ ...x, [k]: v }));
  const setS = (i: number, p: Partial<Section>) => setD((x) => ({ ...x, sections: x.sections.map((s, j) => (j === i ? { ...s, ...p } : s)) }));
  const patch = (i: number, p: Partial<Offer> | ((x: Offer) => Partial<Offer>)) =>
    setD((x) => ({ ...x, sections: x.sections.map((s, j) => (j === i && s.offer ? { ...s, offer: { ...s.offer, ...(typeof p === "function" ? p(s.offer) : p) } } : s)) }));
  const setO = <K extends keyof Offer>(k: K, v: Offer[K]) => patch(cur, { [k]: v } as Partial<Offer>);

  const mail_ = useMemo(() => buildReply(d), [d]);
  const row = useCallback((): Mail => ({ ...mail, to_email: to.email.trim(), to_name: to.name.trim(), subject: mail_.subject, data: d, status, sent_at: sentAt, updated_at: new Date().toISOString() }), [mail, to, mail_.subject, d, status, sentAt]);
  const latest = useRef(row);
  latest.current = row;

  // priebežné ukladanie do databázy, aby koncept bol dostupný z každého zariadenia
  const save = useCallback(async () => {
    const r = latest.current();
    const { error } = await sb.from("mails").update({ to_email: r.to_email, to_name: r.to_name, subject: r.subject, data: r.data, status: r.status, sent_at: r.sent_at, updated_at: r.updated_at }).eq("id", r.id);
    setSaved(error ? "err" : "ok");
    return !error;
  }, [sb]);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setSaved("saving");
    const t = setTimeout(save, 700);
    return () => clearTimeout(t);
  }, [d, to, status, sentAt, save]);

  const close = useCallback(async () => { await save(); onClose(latest.current()); }, [save, onClose]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [close]);

  useEffect(() => { setWaiting(getImportTarget() === mail.id); }, [mail.id]);
  useEffect(() => { bmRef.current?.setAttribute("href", bookmarklet(window.location.origin)); });

  // auto poslané záložkou z aukcie: údaje prídu v adrese za znakom #
  useEffect(() => {
    if (importRan.current || !cfg) return;
    const data = decodeImport(window.location.hash);
    if (!data) return;
    importRan.current = true;
    history.replaceState(null, "", window.location.pathname + window.location.search);
    setImportTarget(null);
    setWaiting(false);
    const r = fromImport(data);
    const p = r.parsed;
    const fixed = r.patch.sale_type === "fixed";
    const currency = r.patch.currency || "USD";
    const est = fixed ? r.patch.price_usd || p.buy_now || 0 : r.patch.est_bid_usd || 0;
    const calcCar = { type: p.type || "car", country: r.patch.country || "US", state: r.patch.state ?? p.state ?? null, currency, sale_type: fixed ? "fixed" : "auction", seller_fee_usd: r.feeForPrice ? Math.max(r.patch.seller_fee_usd || 0, Math.round(auctionFee(cfg, r.feeForPrice))) : r.patch.seller_fee_usd ?? null, location: p.location || "", calc_override: r.patch.calc_override || {}, est_bid_usd: est || null, repair_eur: 0 };
    const offer: Offer = {
      ...EMPTY_OFFER,
      title: [p.year, p.make, p.model, p.trim].filter(Boolean).join(" "),
      sourceUrl: r.url,
      vin: p.vin || "", year: p.year ? String(p.year) : "", mileage: p.odometer_mi ? String(p.odometer_mi) : "", mileageUnit: "mi",
      color: p.color || "", engine: p.engine || "", transmission: p.transmission || "", drive: p.drive || "", fuel: p.fuel || "",
      docs: p.title_type || "", keys: p.keys === true ? "Áno" : p.keys === false ? "Nie" : "",
      condition: p.run_status && p.run_status !== "unknown" ? RUN_LABEL[p.run_status] : "",
      damage: [p.primary_damage, p.secondary_damage].filter(Boolean).join(", "),
      saleType: fixed ? "fixed" : "auction",
      bid: String((fixed ? est : p.current_bid) || ""), currency, auctionEnd: r.saleEnd || r.patch.order_close_at || null, location: p.location || "",
      estBid: est ? String(est) : "", calcCar,
      ...(est ? pricesFor(cfg, { calcCar, saleType: fixed ? "fixed" : "auction", currency, location: p.location || "" }, est) : {})
    };
    setD((x) => {
      // prázdnu ponuku nahradíme, inak auto zaradíme za poslednú ponuku, prípadne na koniec
      const blank = x.sections.findIndex((s) => s.kind === "offer" && s.offer && !s.offer.title.trim() && !s.offer.photos.length && !s.offer.vin.trim() && !s.offer.priceReg.trim());
      const lastOffer = x.sections.map((s) => s.kind).lastIndexOf("offer");
      const at = blank >= 0 ? blank : lastOffer >= 0 ? lastOffer + 1 : x.sections.length;
      const sections = [...x.sections];
      sections.splice(at, blank >= 0 ? 1 : 0, offerSection(offer));
      setTimeout(() => setSel(at), 0);
      return { ...x, sections };
    });
    toast(`Auto z ${r.source} pridané${est ? "" : ". Doplňte sumu vydraženia a prepočítajte ceny"}.`);
    const urls = r.images.slice(0, 13);
    if (!urls.length) return;
    setImp({ done: 0, total: urls.length });
    importImages(urls, { carId: `emaily/${mail.id}`, slugHint: "foto", token: session.access_token, jpeg: true, onProgress: (done, total) => setImp({ done, total }) }).then(({ urls: got, failed }) => {
      setImp(null);
      if (got.length) setD((x) => ({ ...x, sections: x.sections.map((s) => (s.offer && s.offer.sourceUrl === r.url && !s.offer.photos.length ? { ...s, offer: { ...s.offer, photos: got } } : s)) }));
      if (failed) toast(`Stiahnutých ${got.length} fotiek, ${failed} sa nepodarilo. Doplňte ich ručne.`, !got.length);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg]);

  function addPart(id: string) {
    const part = PARTS.find((x) => x.id === id);
    if (!part) return;
    const at = d.sections.length;
    setD((x) => ({ ...x, sections: [...x.sections, part.make()] }));
    setSel(at);
  }
  function duplicate(i: number) {
    setD((x) => { const a = [...x.sections]; const s = a[i]; a.splice(i + 1, 0, s.offer ? offerSection(s.offer) : { ...s }); return { ...x, sections: a }; });
    setSel(i + 1);
  }
  function removeSection(i: number) {
    const s = d.sections[i];
    const filled = s.kind === "offer" ? !!(s.offer?.title.trim() || s.offer?.photos.length) : !!s.body.trim();
    if (filled && !confirm("Odstrániť túto časť e-mailu?")) return;
    setD((x) => ({ ...x, sections: x.sections.filter((_, j) => j !== i) }));
    setSel(-1);
  }
  function moveSection(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= d.sections.length) return;
    setD((x) => { const a = [...x.sections]; [a[i], a[j]] = [a[j], a[i]]; return { ...x, sections: a }; });
    setSel((s) => (s === i ? j : s === j ? i : s));
  }
  function waitForImport() {
    const on = !waiting;
    setImportTarget(on ? mail.id : null);
    setWaiting(on);
  }
  function recalc() {
    if (!o || !cfg) return;
    const bid = digits(o.estBid);
    if (!bid) return toast("Zadajte sumu vydraženia, z ktorej sa majú ceny vypočítať.", true);
    patch(cur, pricesFor(cfg, o, bid));
    toast("Ceny prepočítané podľa kalkulácie v nastaveniach. Skontrolujte ich prosím.");
  }

  async function fillFromCar(id: string) {
    if (!id || !o) return;
    const i = cur;
    const { data, error } = await sb.from("cars").select("*").eq("id", id).maybeSingle();
    if (error || !data) return toast(error?.message || "Auto sa nenašlo.", true);
    const c = data as Car;
    const fixed = isFixed(c);
    const full = cfg ? carEstimate(cfg, c) : null;
    const bare = cfg ? carEstimate(cfg, c, { noHomolog: true }) : null;
    const vat: Offer["vat"] = full?.priceMode === "net" ? "net" : "final";
    const price = (r: typeof full) => (r ? String(Math.round(vat === "net" ? r.net : r.gross)) : "");
    const est = (fixed ? c.price_usd : c.est_bid_usd || c.current_bid_usd) || 0;
    patch(i, {
      title: carFullName(c),
      photos: (c.images || []).filter((u) => /^https?:\/\//i.test(u)).slice(0, 7),
      carUrl: c.status === "published" ? `${SITE.url}/auta/${c.slug}` : "",
      sourceUrl: c.auction_url || "",
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
      estBid: est ? String(est) : "",
      calcCar: { type: c.type, country: c.country, state: c.state, currency: c.currency, sale_type: c.sale_type, seller_fee_usd: c.seller_fee_usd, location: c.location, calc_override: c.calc_override, est_bid_usd: est || null, repair_eur: c.repair_eur || 0 },
      priceNoReg: price(bare),
      priceReg: price(full),
      vat
    });
    toast("Údaje predvyplnené z auta v ponuke. Skontrolujte ich prosím.");
  }

  async function upload(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length || !o) return;
    const i = cur;
    setUploading(list.length);
    const out: string[] = [];
    for (const [k, f] of list.entries()) {
      try {
        const blob = await toJpeg(f);
        const path = `emaily/${mail.id}/${Date.now().toString(36)}-${k}.jpg`;
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
    if (!o) return;
    if (!/^https?:\/\//i.test(u)) return toast("Zadajte celú adresu obrázka, ktorá začína na https://", true);
    setO("photos", [...o.photos, u]);
    setUrl("");
  }
  function removePhoto(i: number) {
    if (!o) return;
    const path = o.photos[i].split("/car-images/")[1];
    // z úložiska mažeme len fotky nahraté k tomuto e-mailu, nie fotky áut z ponuky
    if (path?.startsWith(`emaily/${mail.id}/`) && offersOf(d).filter((x) => x.photos.includes(o.photos[i])).length < 2) sb.storage.from("car-images").remove([path]);
    setO("photos", o.photos.filter((_, j) => j !== i));
  }
  function movePhoto(i: number, to_: number) {
    if (!o || to_ < 0 || to_ >= o.photos.length) return;
    const arr = [...o.photos];
    const [x] = arr.splice(i, 1);
    arr.splice(to_, 0, x);
    setO("photos", arr);
  }

  const gmailUrl = `https://mail.google.com/mail/?authuser=${encodeURIComponent(SITE.email)}&view=cm&fs=1&to=${encodeURIComponent(to.email.trim())}&su=${encodeURIComponent(mail_.subject)}`;

  async function copy(open: boolean) {
    if (open && !/^\S+@\S+\.\S+$/.test(to.email.trim())) return toast("Doplňte e-mail adresáta.", true);
    // okno otvárame hneď pri kliknutí, inak ho prehliadač zablokuje ako vyskakovacie
    const win = open ? window.open("about:blank", "_blank") : null;
    try {
      await copyRich(mail_.html, mail_.text);
      setCopied(true);
      if (win) { win.location.href = gmailUrl; setStatus("sent"); setSentAt(new Date().toISOString()); }
      toast(open ? "E-mail je skopírovaný. V Gmaili kliknite do správy a stlačte Ctrl+V." : "E-mail je skopírovaný do schránky");
    } catch (e) {
      win?.close();
      toast(e instanceof Error ? e.message : "Kopírovanie sa nepodarilo.", true);
    }
  }

  const left = o ? timeLeft(o.auctionEnd) : "";
  const txt = (k: keyof Offer, label: string, ph?: string) => (
    <div className="field"><label>{label}</label><input className="input" value={(o?.[k] as string) || ""} placeholder={ph} onChange={(e) => setO(k, e.target.value as never)} /></div>
  );
  const summary = (s: Section) => (s.kind === "offer" ? s.offer?.title.trim() || "Auto bez názvu" : s.heading.trim() || s.body.trim().split("\n")[0].slice(0, 70) || "Prázdna časť");

  const offerForm = o && (
    <>
      {cars.length > 0 && (
        <div className="field">
          <label>Predvyplniť z auta na webe</label>
          <select className="input" value="" onChange={(e) => fillFromCar(e.target.value)}>
            <option value="">Vybrať auto…</option>
            {cars.map((c) => <option key={c.id} value={c.id}>{c.year} {c.make} {c.model}</option>)}
          </select>
        </div>
      )}
      <div className="field">
        <label>Odkaz na inzerát (interný)</label>
        <div className="reply__pair" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
          <input className="input" value={o.sourceUrl} placeholder="https://www.autobidmaster.com/…" onChange={(e) => setO("sourceUrl", e.target.value)} />
          {/^https?:\/\//i.test(o.sourceUrl.trim()) ? <a className="rc-btn rc-btn--ghost rc-btn--sm" href={o.sourceUrl.trim()} target="_blank" rel="noopener noreferrer">Otvoriť ↗</a> : <span />}
        </div>
        <span className="hint">Len pre Vás, aby ste auto pri dopyte vždy našli. V e-maile sa nezobrazuje.</span>
      </div>

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
        <div className="note" style={{ marginTop: 6 }}>Prvá fotka je v e-maile veľká, ostatné sú pod ňou po tri v rade. Zákazník si každú zväčší kliknutím.</div>
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
      <div className="field">
        <label>{o.saleType === "fixed" ? "Cena u predajcu, z ktorej sú ceny vypočítané" : "Suma vydraženia, z ktorej sú ceny vypočítané"} ({o.currency})</label>
        <div className="reply__pair" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
          <input className="input" inputMode="numeric" value={o.estBid} placeholder="25000" onChange={(e) => setO("estBid", e.target.value)} />
          <button type="button" className="rc-btn rc-btn--ghost rc-btn--sm" onClick={recalc} disabled={!cfg}>Prepočítať ceny</button>
        </div>
        <span className="hint">{basisText(o) ? `V e-maile pod cenami: ${basisText(o)}` : "Zákazník pod cenami uvidí, z akej sumy sú vypočítané. Tlačidlo dopočíta obe ceny podľa Vašej kalkulácie."}</span>
      </div>
      <div className="reply__g">
        <div className="field"><label>Bez prihlásenia (EUR)</label><input className="input" inputMode="numeric" value={o.priceNoReg} placeholder="46900" onChange={(e) => setO("priceNoReg", e.target.value)} /></div>
        <div className="field"><label>S prihlásením (EUR)</label><input className="input" inputMode="numeric" value={o.priceReg} placeholder="52900" onChange={(e) => setO("priceReg", e.target.value)} /></div>
        {txt("noRegNote", "Popis pod cenou bez prihlásenia")}
        {txt("regNote", "Popis pod cenou s prihlásením")}
        <div className="field">
          <label>Ceny sú uvedené</label>
          <select className="input" value={o.vat} onChange={(e) => setO("vat", e.target.value as Offer["vat"])}><option value="final">odhad (nie sme platiteľ DPH)</option><option value="gross">s DPH</option><option value="net">bez DPH</option></select>
        </div>
        {txt("carUrl", "Odkaz na auto na webe", `${SITE.url}/auta/…`)}
      </div>
      <p className="note" style={{ marginTop: 0 }}>V e-maile sú ceny vždy označené ako odhadované.</p>
      <div className="field"><label>Poznámka k tomuto autu</label><textarea className="input" rows={2} value={o.note} placeholder="Napríklad prečo ho odporúčate" onChange={(e) => setO("note", e.target.value)} /></div>
    </>
  );

  return (
    <div className="reply" role="dialog" aria-modal="true" aria-label="E-mail zákazníkovi">
      <div className="reply__bar">
        <div>
          <b>{lead ? "Odpoveď na dopyt" : "E-mail zákazníkovi"}</b>
          <small>{to.name || lead?.phone || "Bez mena"} · {to.email || "bez adresy"} · {saved === "saving" ? "ukladám…" : saved === "err" ? "uloženie zlyhalo" : "uložené"}</small>
        </div>
        <div className="row-actions">
          <button className="rc-btn rc-btn--ghost rc-btn--sm" onClick={() => { const s = status === "sent" ? "draft" : "sent"; setStatus(s); setSentAt(s === "sent" ? new Date().toISOString() : null); }}>{status === "sent" ? "Vrátiť medzi koncepty" : "Označiť ako odoslaný"}</button>
          <button className="rc-btn rc-btn--ghost rc-btn--sm" onClick={() => copy(false)}>Len skopírovať</button>
          <button className="rc-btn rc-btn--primary rc-btn--sm" onClick={() => copy(true)} disabled={uploading > 0 || !!imp}>Skopírovať a otvoriť Gmail</button>
          <button className="rc-btn rc-btn--ghost rc-btn--sm" onClick={close}>Zavrieť</button>
        </div>
      </div>
      {copied && <div className="reply__hint">E-mail je v schránke. V Gmaili je už vyplnený adresát aj predmet, kliknite do tela správy a vložte ho cez <b>Ctrl+V</b>. Fotky sú odkazy, zákazník si ich kliknutím zväčší.</div>}
      {imp && <div className="reply__hint">Sťahujem fotky z inzerátu: {imp.done} z {imp.total}</div>}
      <div className="reply__body">
        <div className="reply__form">
          {lead?.message && <div className="reply__ask"><small>Dopyt zákazníka</small>{lead.message}</div>}

          <h3>Adresát</h3>
          <div className="reply__g">
            <div className="field"><label>E-mail</label><input className="input" type="email" value={to.email} placeholder="zakaznik@email.sk" onChange={(e) => setTo((x) => ({ ...x, email: e.target.value }))} /></div>
            <div className="field"><label>Meno alebo firma</label><input className="input" value={to.name} placeholder="Ján Novák" onChange={(e) => setTo((x) => ({ ...x, name: e.target.value }))} /></div>
          </div>
          <div className="reply__g">
            <div className="field"><label>Predmet</label><input className="input" value={d.subject} placeholder={mail_.subject} onChange={(e) => set("subject", e.target.value)} /></div>
            <div className="field"><label>Oslovenie</label><input className="input" value={d.greeting} placeholder="Dobrý deň, pán Novák," onChange={(e) => set("greeting", e.target.value)} /></div>
          </div>

          <h3>Obsah e-mailu</h3>
          <p className="note" style={{ marginTop: 0 }}>E-mail si poskladáte z častí. Kliknutím časť otvoríte, šípkami zmeníte poradie. Vzhľad sa doplní sám.</p>
          {d.sections.length === 0 && <div className="empty" style={{ padding: 24 }}>E-mail je zatiaľ prázdny. Pridajte prvú časť nižšie.</div>}
          {d.sections.map((s, i) => {
            const open = i === sel;
            return (
              <div className={`blk${open ? " on" : ""}`} key={i}>
                <div className="blk__head" role="button" tabIndex={0} onClick={() => setSel(open ? -1 : i)} onKeyDown={(e) => { if (e.key === "Enter") setSel(open ? -1 : i); }}>
                  <i>{i + 1}</i>
                  <span className="blk__t"><b>{KIND[s.kind].label}</b><small>{summary(s)}</small></span>
                  <span className="blk__act" onClick={(e) => e.stopPropagation()}>
                    <button type="button" title="Posunúť vyššie" disabled={i === 0} onClick={() => moveSection(i, -1)}>↑</button>
                    <button type="button" title="Posunúť nižšie" disabled={i === d.sections.length - 1} onClick={() => moveSection(i, 1)}>↓</button>
                    <button type="button" title="Duplikovať" onClick={() => duplicate(i)}>⧉</button>
                    <button type="button" title="Odstrániť" onClick={() => removeSection(i)}>✕</button>
                  </span>
                </div>
                {open && (
                  <div className="blk__body">
                    {s.kind === "offer" ? offerForm : s.kind === "quote" ? (
                      <>
                        <div className="field"><label>Nadpis časti</label><input className="input" value={s.heading} placeholder="Rozpis nákladov" onChange={(e) => setS(i, { heading: e.target.value })} /></div>
                        <QuoteEditor body={s.body} onChange={(b) => setS(i, { body: b })} />
                      </>
                    ) : (
                      <>
                        <div className="reply__g">
                          <div className="field"><label>Nadpis časti (nepovinný)</label><input className="input" value={s.heading} placeholder="Podmienky" onChange={(e) => setS(i, { heading: e.target.value })} /></div>
                          <div className="field"><label>Vzhľad</label><select className="input" value={s.kind} onChange={(e) => setS(i, { kind: e.target.value as Section["kind"] })}>{TEXT_KINDS.map((k) => <option key={k} value={k}>{KIND[k].label}</option>)}</select></div>
                        </div>
                        <div className="field" style={{ marginBottom: 0 }}><textarea className="input" rows={Math.min(14, Math.max(4, s.body.split("\n").length + 1))} value={s.body} placeholder={KIND[s.kind].ph} onChange={(e) => setS(i, { body: e.target.value })} /><span className="hint">{KIND[s.kind].hint}</span></div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <div className="reply__auc">
            <small className="blk__lbl">Pridať časť</small>
            <div className="parts">
              {PARTS.map((p) => <button type="button" key={p.id} title={p.hint} onClick={() => addPart(p.id)}>+ {p.label}</button>)}
              <button type="button" className={waiting ? "on" : ""} onClick={waitForImport}>{waiting ? "Čakám na auto z aukcie, zrušiť" : "+ Auto z aukcie"}</button>
            </div>
            {waiting && <p className="note">Otvorte inzerát na stránke aukcie, napíšte do políčka ponuky sumu vydraženia, s ktorou rátate, a kliknite na záložku <b>Import do REM</b>. Auto sa s údajmi, fotkami a cenami pridá do tohto e-mailu. Ak záložku ešte nemáte, potiahnite si ju na lištu záložiek: <a ref={bmRef} className="bm" onClick={(e) => { e.preventDefault(); toast("Tlačidlo neklikajte, potiahnite ho na lištu záložiek.", true); }}>Import do REM</a></p>}
          </div>

          <h3>Koniec e-mailu</h3>
          <p className="note" style={{ marginTop: 0 }}>Podpis a kontakty sa dopĺňajú samy.</p>
          <div className="field"><label>Dopyt zákazníka na konci e-mailu</label><textarea className="input" rows={4} value={d.quote} onChange={(e) => set("quote", e.target.value)} /><span className="hint">Zákazník vidí, na čo odpovedáte. Ak je pole prázdne, časť sa v e-maile nezobrazí.</span></div>
        </div>
        <div className="reply__preview">
          <div className="reply__subj"><small>Predmet</small>{mail_.subject}</div>
          <iframe title="Náhľad e-mailu" sandbox="allow-popups" srcDoc={`<!doctype html><html><head><meta charset="utf-8"><base target="_blank"></head><body style="margin:0;background:#eef0f3">${mail_.html}</body></html>`} />
        </div>
      </div>
    </div>
  );
}
