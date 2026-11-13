"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase";
import { eur, num } from "@/lib/format";
import { useAdmin } from "@/components/admin/AdminApp";
import { useCalcCfg } from "@/components/admin/useCalcCfg";
import { SS_HOUSE, parseSsRef, ssAvailable, ssItems, ssPhoto, ssRef, type SsLot, type SsMe, type SsPage, type SsPrice, type SsSchedule, type SsStock } from "@/lib/ssancar";
import { ssImportHash } from "@/lib/importSsancar";

type Tab = "stock" | "lots" | "check";
type Watched = { id: string; slug: string; make: string; model: string; year: number | null; status: string; auction_url: string; st?: { status: string | null; gone: boolean } };

const today = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); // dnešok v Kórei

export default function KoreaPage() {
  const sb = browserClient();
  const router = useRouter();
  const { session, toast, revalidate } = useAdmin();
  const { cfg } = useCalcCfg();
  const [tab, setTab] = useState<Tab>("stock");
  const [me, setMe] = useState<SsMe | null | undefined>(undefined);
  const [keyErr, setKeyErr] = useState("");
  const [busy, setBusy] = useState(false);

  // sklad
  const [flt, setFlt] = useState({ make: "", model: "", year_min: "", year_max: "", eur_max: "" });
  const [stock, setStock] = useState<SsStock[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  // aukcie
  const [sched, setSched] = useState<SsSchedule[] | null>(null);
  const [day, setDay] = useState<{ date: string; house: string } | null>(null);
  const [lots, setLots] = useState<SsLot[] | null>(null);
  const [lotCursor, setLotCursor] = useState<string | null>(null);
  // kontrola importovaných áut
  const [watched, setWatched] = useState<Watched[] | null>(null);

  const api = useCallback(async <T,>(q: Record<string, string>, init?: RequestInit): Promise<T | null> => {
    const r = await fetch(`/api/ssancar?${new URLSearchParams(q)}`, { ...init, headers: { authorization: `Bearer ${session.access_token}`, ...(init?.body ? { "content-type": "application/json" } : {}) } });
    const j = await r.json().catch(() => ({}));
    if (r.status === 503) { setKeyErr((j as { error?: string }).error || "Chýba kľúč."); return null; }
    if (!r.ok) { toast((j as { error?: string }).error || "Chyba SSANCAR.", true); return null; }
    return j as T;
  }, [session.access_token, toast]);

  useEffect(() => { api<SsMe>({ op: "me" }).then((m) => setMe(m)); }, [api]);

  const toEur = (p?: SsPrice | null) => {
    if (!cfg || !p) return 0;
    if (p.usd) return p.usd * (cfg.fx.USD || cfg.usdToEur);
    if (p.krw && cfg.fx.KRW) return p.krw * cfg.fx.KRW;
    return 0;
  };
  const priceTxt = (p?: SsPrice | null) => !p ? "—" : [p.usd ? `${num(p.usd)} USD` : "", p.krw ? `${num(p.krw)} KRW` : ""].filter(Boolean).join(" · ") || "—";

  async function loadStock(more = false) {
    setBusy(true);
    const q: Record<string, string> = { op: "stock", limit: "60" };
    for (const k of ["make", "model", "year_min", "year_max"] as const) if (flt[k].trim()) q[k] = flt[k].trim();
    const maxEur = Number(flt.eur_max) || 0;
    if (maxEur && cfg?.fx.KRW) q.price_max_krw = String(Math.round(maxEur / cfg.fx.KRW));
    if (more && cursor) q.cursor = cursor;
    const p = await api<SsPage<SsStock>>(q);
    setBusy(false);
    if (!p) return;
    setStock((o) => [...(more ? o || [] : []), ...ssItems(p)]);
    setCursor(p.has_more ? p.next_cursor || null : null);
  }

  async function loadSched() {
    setBusy(true);
    const p = await api<SsPage<SsSchedule>>({ op: "schedule", from: today(), limit: "100" });
    setBusy(false);
    if (p) setSched(ssItems(p));
  }

  async function loadLots(d: { date: string; house: string }, more = false) {
    setDay(d); setBusy(true);
    const q: Record<string, string> = { op: "lots", date: d.date, limit: "100" };
    if (d.house) q.house = d.house;
    if (more && lotCursor) q.cursor = lotCursor;
    const p = await api<SsPage<SsLot>>(q);
    setBusy(false);
    if (!p) return;
    setLots((o) => [...(more ? o || [] : []), ...ssItems(p)]);
    setLotCursor(p.has_more ? p.next_cursor || null : null);
  }

  async function loadWatched() {
    setBusy(true);
    const { data, error } = await sb.from("cars").select("id,slug,make,model,year,status,auction_url").like("auction_url", "ssancar://%").in("status", ["published", "draft"]).order("created_at", { ascending: false });
    if (error) { setBusy(false); return toast(error.message, true); }
    const rows = (data || []) as Watched[];
    const refs = rows.map((r) => parseSsRef(r.auction_url)).filter(Boolean).map((x) => `${x!.kind}:${x!.id}`);
    const res = refs.length ? await api<{ out: Record<string, { status: string | null; gone: boolean }> }>({ op: "check", refs: refs.slice(0, 40).join(",") }) : { out: {} };
    setBusy(false);
    setWatched(rows.map((r) => { const x = parseSsRef(r.auction_url); return { ...r, st: x ? res?.out[`${x.kind}:${x.id}`] : undefined }; }));
  }

  useEffect(() => {
    if (!me) return;
    if (tab === "stock" && stock === null) loadStock();
    if (tab === "lots" && sched === null) loadSched();
    if (tab === "check" && watched === null) loadWatched();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, me]);

  function importCar(kind: "stock" | "lot", item: SsStock | SsLot) {
    const hash = kind === "lot" ? ssImportHash(ssRef("lot", item.id), { kind: "lot", item: item as SsLot }) : ssImportHash(ssRef("stock", item.id), { kind: "stock", item: item as SsStock });
    router.push(`/admin/auta/nove#${hash}`);
  }

  async function ask(kind: "stock" | "lot", item: SsStock | SsLot) {
    const def = kind === "lot"
      ? `Hello, we are interested in lot ${(item as SsLot).lot_no || item.id}. Please confirm the lot and send the condition report. Our maximum bid will follow.`
      : `Hello, we are interested in this car (ID ${item.id}). Please confirm availability, final FOB price to Busan and VIN.`;
    const msg = window.prompt("Správa pre SSANCAR (po anglicky). Odošle sa hneď cez ich API.", def);
    if (!msg?.trim()) return;
    const r = await api<{ id: string }>({}, { method: "POST", body: JSON.stringify({ vehicle_type: kind, vehicle_id: item.id, message: msg.trim(), partner_ref: `REM-${new Date().toISOString().slice(0, 10)}` }) });
    if (r) toast(`Dopyt odoslaný do SSANCAR (č. ${r.id}).`);
  }

  async function markSold(w: Watched) {
    const { error } = await sb.from("cars").update({ status: "sold" }).eq("id", w.id);
    if (error) return toast(error.message, true);
    await revalidate([w.slug]);
    setWatched((o) => (o || []).map((x) => (x.id === w.id ? { ...x, status: "sold" } : x)));
    toast("Auto je označené ako predané.");
  }

  const Card = ({ kind, item }: { kind: "stock" | "lot"; item: SsStock | SsLot }) => {
    const lot = kind === "lot" ? (item as SsLot) : null, st = kind === "stock" ? (item as SsStock) : null;
    const photo = (item.photos || []).map(ssPhoto).find(Boolean);
    const p = lot ? lot.start_price : st!.price;
    const e = toEur(p);
    const ok = ssAvailable(item.status);
    return (
      <div className="ss-card">
        <div className="ss-card__img">{photo ? <img src={photo} alt="" loading="lazy" /> : <span>bez fotky</span>}{item.photo_count ? <small>{item.photo_count} fotiek</small> : null}</div>
        <div className="ss-card__body">
          <b>{[item.year, item.make, item.model].filter(Boolean).join(" ") || "Auto"}</b>
          <small>{[item.trim, item.mileage_km ? `${num(item.mileage_km)} km` : "", item.fuel, item.transmission].filter(Boolean).join(" · ")}</small>
          {lot && <small>{SS_HOUSE[lot.house] || lot.house} · lot {lot.lot_no || "?"} · {lot.auction_date || "?"}{lot.auction_date_estimated ? " (odhad)" : ""}{lot.grade ? ` · hodnotenie ${lot.grade}` : ""}</small>}
          {st?.location && <small>{st.location}</small>}
          <div className="ss-card__price">
            <span>{lot ? "Vyvolávacia " : st?.price_on_request ? "Cena na vyžiadanie" : "FOB "}{st?.price_on_request ? "" : priceTxt(p)}</span>
            {e > 0 && <small>≈ {eur(e)} (len auto)</small>}
          </div>
          {!ok && <span className="pill sold">{item.status}</span>}
          <div className="row-actions">
            <button className="rc-btn rc-btn--sm" onClick={() => importCar(kind, item)} disabled={!ok}>Importovať do REM</button>
            <button className="rc-btn rc-btn--ghost rc-btn--sm" onClick={() => ask(kind, item)} disabled={!ok}>Dopyt</button>
            {st?.detail_url && <a className="rc-btn rc-btn--ghost rc-btn--sm" href={st.detail_url} target="_blank" rel="noopener noreferrer">Detail ↗</a>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="adm__head"><h1>Kórea SSANCAR</h1></div>
      <p className="note" style={{ marginTop: 0 }}>Sklad kórejských predajcov a denné kórejské aukcie cez partnerské API SSANCAR. Auto sa importom otvorí ako nové auto s vyplnenými údajmi, fotkami a kalkuláciou, uloží sa až po Vašej kontrole. Názov aukčného domu ide len do internej poznámky.</p>

      {keyErr ? (
        <div className="empty" style={{ textAlign: "left" }}>
          <b>API ešte nie je pripojené.</b> {keyErr}
          <p className="note">Kľúč (sscp_…) vydá SSANCAR po dohode o spolupráci: James Cho, WhatsApp +82 10 9009 9977. Vo Verceli pridajte premennú <code>SSANCAR_API_KEY</code> pre Production aj Preview a nasaďte web znova.</p>
        </div>
      ) : me === undefined ? <p className="note">Pripájam SSANCAR…</p> : !me ? <p className="note">SSANCAR neodpovedá.</p> : (
        <>
          <p className="note">
            Partner <b>{me.partner?.name || me.partner?.code}</b> · stav {me.partner?.status || "?"} · sklad {me.scope?.dealer_stock === false ? "nie" : "áno"} · aukcie {(me.scope?.houses || []).map((h) => SS_HOUSE[h] || h).join(", ") || "nepovolené"}
            {me.usage?.remaining_today != null && <> · dnes zostáva {num(me.usage.remaining_today)} dopytov</>}
            {me.key?.expires_at && <> · kľúč platí do {me.key.expires_at.slice(0, 10)}</>}
          </p>
          <div className="toolbar">
            {([["stock", "Sklad predajcov"], ["lots", "Aukcie"], ["check", "Kontrola dostupnosti"]] as [Tab, string][]).map(([k, l]) => (
              <button key={k} className={`chip${tab === k ? " active" : ""}`} onClick={() => setTab(k)}>{l}</button>
            ))}
          </div>

          {tab === "stock" && (
            <>
              <form className="toolbar" onSubmit={(e) => { e.preventDefault(); loadStock(); }}>
                <input className="input" style={{ maxWidth: 150 }} placeholder="Značka" value={flt.make} onChange={(e) => setFlt({ ...flt, make: e.target.value })} />
                <input className="input" style={{ maxWidth: 150 }} placeholder="Model" value={flt.model} onChange={(e) => setFlt({ ...flt, model: e.target.value })} />
                <input className="input" style={{ maxWidth: 100 }} placeholder="Rok od" inputMode="numeric" value={flt.year_min} onChange={(e) => setFlt({ ...flt, year_min: e.target.value.replace(/\D/g, "") })} />
                <input className="input" style={{ maxWidth: 100 }} placeholder="Rok do" inputMode="numeric" value={flt.year_max} onChange={(e) => setFlt({ ...flt, year_max: e.target.value.replace(/\D/g, "") })} />
                <input className="input" style={{ maxWidth: 160 }} placeholder="Auto max. €" inputMode="numeric" value={flt.eur_max} onChange={(e) => setFlt({ ...flt, eur_max: e.target.value.replace(/\D/g, "") })} />
                <button className="rc-btn rc-btn--sm" disabled={busy}>Hľadať</button>
              </form>
              {stock === null ? <p className="note">Načítavam…</p> : !stock.length ? <div className="empty">Nič sa nenašlo.</div> : (
                <div className="ss-grid">{stock.map((s) => <Card key={s.id} kind="stock" item={s} />)}</div>
              )}
              {cursor && <p style={{ textAlign: "center" }}><button className="rc-btn rc-btn--ghost" disabled={busy} onClick={() => loadStock(true)}>Načítať ďalšie</button></p>}
            </>
          )}

          {tab === "lots" && (
            <>
              {sched === null ? <p className="note">Načítavam termíny…</p> : !sched.length ? <div className="empty">Na najbližších 14 dní nie sú žiadne aukcie.</div> : (
                <div className="toolbar" style={{ flexWrap: "wrap" }}>
                  {sched.map((s) => {
                    const d = { date: (s.auction_date || "").slice(0, 10), house: s.house };
                    const on = day?.date === d.date && day?.house === d.house;
                    return <button key={`${d.date}-${s.house}`} className={`chip${on ? " active" : ""}`} onClick={() => loadLots(d)}>{d.date} · {SS_HOUSE[s.house] || s.house}{s.lot_count ? ` · ${num(s.lot_count)} áut` : ""}</button>;
                  })}
                </div>
              )}
              {day && (lots === null || busy && !lots.length ? <p className="note">Načítavam autá…</p> : !lots.length ? <div className="empty">V tejto aukcii nie sú žiadne autá.</div> : (
                <div className="ss-grid">{lots.map((l) => <Card key={l.id} kind="lot" item={l} />)}</div>
              ))}
              {day && lotCursor && <p style={{ textAlign: "center" }}><button className="rc-btn rc-btn--ghost" disabled={busy} onClick={() => loadLots(day, true)}>Načítať ďalšie</button></p>}
            </>
          )}

          {tab === "check" && (
            <>
              <div className="toolbar">
                <span className="note" style={{ margin: 0 }}>Autá importované zo SSANCAR, ktoré sú na webe alebo rozpísané. Predané alebo stiahnuté autá označte ako predané.</span>
                <button className="rc-btn rc-btn--ghost rc-btn--sm" disabled={busy} onClick={loadWatched}>Skontrolovať znova</button>
              </div>
              {watched === null ? <p className="note">Kontrolujem…</p> : !watched.length ? <div className="empty">Zatiaľ žiadne importované autá zo SSANCAR.</div> : (
                <div className="tbl-wrap"><table className="tbl">
                  <thead><tr><th>Auto</th><th>Na webe</th><th>SSANCAR</th><th /></tr></thead>
                  <tbody>{watched.map((w) => {
                    const gone = w.st?.gone || (w.st?.status ? !ssAvailable(w.st.status) : false);
                    return (
                      <tr key={w.id}>
                        <td className="name">{[w.year, w.make, w.model].filter(Boolean).join(" ")}<small>{parseSsRef(w.auction_url)?.kind === "lot" ? "aukcia" : "sklad"}</small></td>
                        <td><span className={`pill ${w.status}`}>{w.status === "published" ? "Zverejnené" : w.status === "sold" ? "Predané" : "Koncept"}</span></td>
                        <td>{!w.st ? "—" : gone ? <span className="pill sold">{w.st.status === "not_found" ? "už nie je v ponuke" : w.st.status}</span> : <span className="pill published">{w.st.status || "dostupné"}</span>}</td>
                        <td><div className="row-actions" style={{ justifyContent: "flex-end" }}>
                          <a className="rc-btn rc-btn--ghost rc-btn--sm" href={`/admin/auta/${w.id}`}>Upraviť</a>
                          {gone && w.status !== "sold" && <button className="rc-btn rc-btn--sm" onClick={() => markSold(w)}>Označiť ako predané</button>}
                        </div></td>
                      </tr>
                    );
                  })}</tbody>
                </table></div>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}
