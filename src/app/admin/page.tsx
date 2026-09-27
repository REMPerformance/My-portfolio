"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { browserClient } from "@/lib/supabase";
import type { Car } from "@/lib/types";
import { carPhase, fmtDateTime, num } from "@/lib/format";
import { useAdmin } from "@/components/admin/AdminApp";
import { fmtLeft, useNow } from "@/components/Countdown";

const STATUS_LABEL: Record<string, string> = { draft: "Koncept", published: "Zverejnené", sold: "Predané", archived: "Archív" };
const PHASE_LABEL = { open: "Objednávky otvorené", closed: "Objednávky uzavreté", ended: "Aukcia skončila" };

export default function AdminCars() {
  const sb = browserClient();
  const { toast, revalidate } = useAdmin();
  const [cars, setCars] = useState<Car[] | null>(null);
  const [q, setQ] = useState("");
  const [st, setSt] = useState("all");
  const [mk, setMk] = useState("");
  const [ph, setPh] = useState("");
  const [sort, setSort] = useState("new");
  const now = useNow(30000) ?? 0;

  const load = useCallback(async () => {
    const { data, error } = await sb.from("cars").select("*").order("created_at", { ascending: false });
    if (error) toast(error.message, true);
    setCars((data as Car[]) || []);
  }, [sb, toast]);
  useEffect(() => { load(); }, [load]);

  const list = useMemo(
    () => {
      const t = now || Date.now();
      const r = (cars || []).filter((c) => (st === "all" || c.status === st) && (!mk || c.make === mk) && (!ph || carPhase(c, t) === ph) && `${c.year} ${c.make} ${c.model} ${c.trim} ${c.lot} ${c.vin}`.toLowerCase().includes(q.toLowerCase()));
      const close = (c: Car) => Date.parse(c.order_close_at || c.auction_end_at || "") || Infinity;
      const cmp: Record<string, (a: Car, b: Car) => number> = {
        new: (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at),
        close: (a, b) => close(a) - close(b),
        leads: (a, b) => b.leads_count - a.leads_count,
        views: (a, b) => b.views - a.views
      };
      return r.sort(cmp[sort]);
    },
    [cars, q, st, mk, ph, sort, now]
  );
  const stats = useMemo(() => {
    const c = cars || [];
    return {
      live: c.filter((x) => x.status === "published" && carPhase(x, now || Date.now()) === "open").length,
      leads: c.reduce((a, x) => a + x.leads_count, 0),
      views: c.reduce((a, x) => a + x.views, 0),
      drafts: c.filter((x) => x.status === "draft").length
    };
  }, [cars, now]);

  async function setStatus(c: Car, status: Car["status"]) {
    const { error } = await sb.from("cars").update({ status }).eq("id", c.id);
    if (error) return toast(error.message, true);
    toast(`Stav zmenený: ${STATUS_LABEL[status]}`);
    await revalidate([c.slug]); load();
  }
  async function duplicate(c: Car) {
    const { id: _id, created_at: _c, updated_at: _u, views: _v, leads_count: _l, ...rest } = c;
    const copy = { ...rest, slug: `${c.slug}-kopia-${Date.now().toString(36)}`, status: "draft" as const, images: [] as string[] };
    const { data, error } = await sb.from("cars").insert(copy).select("id").single();
    if (error) return toast(error.message, true);
    toast("Kópia vytvorená (bez fotiek)");
    window.location.href = `/admin/auta/${data.id}`;
  }
  async function remove(c: Car) {
    if (!confirm(`Naozaj vymazať ${c.year} ${c.make} ${c.model}? Fotky sa zmažú tiež. Dopyty zostanú.`)) return;
    const paths = (c.images || []).map((u) => u.split("/car-images/")[1]).filter(Boolean);
    if (paths.length) await sb.storage.from("car-images").remove(paths);
    const { error } = await sb.from("cars").delete().eq("id", c.id);
    if (error) return toast(error.message, true);
    toast("Auto vymazané");
    await revalidate(); load();
  }

  return (
    <>
      <div className="adm__head">
        <h1>Autá</h1>
        <Link href="/admin/auta/nove" className="rc-btn rc-btn--primary">+ Pridať auto</Link>
      </div>
      <div className="stats">
        <div className="stat"><small>Otvorené objednávky</small><b>{stats.live}</b></div>
        <div className="stat"><small>Záujemcovia spolu</small><b>{stats.leads}</b></div>
        <div className="stat"><small>Zobrazenia áut</small><b>{num(stats.views)}</b></div>
        <div className="stat"><small>Koncepty</small><b>{stats.drafts}</b></div>
      </div>
      <div className="toolbar">
        <input className="input" placeholder="Hľadať značku, model, lot…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input" value={st} onChange={(e) => setSt(e.target.value)}>
          <option value="all">Všetky stavy</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="input" value={mk} onChange={(e) => setMk(e.target.value)}>
          <option value="">Všetky značky</option>
          {[...new Set((cars || []).map((c) => c.make))].sort().map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select className="input" value={ph} onChange={(e) => setPh(e.target.value)}>
          <option value="">Všetky fázy</option>
          <option value="open">Objednávky otvorené</option>
          <option value="closed">Objednávky uzavreté</option>
          <option value="ended">Aukcia skončila</option>
        </select>
        <select className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="new">Najnovšie pridané</option>
          <option value="close">Uzávierka najskôr</option>
          <option value="leads">Najviac záujemcov</option>
          <option value="views">Najviac zobrazení</option>
        </select>
      </div>
      {cars === null ? <p className="note">Načítavam…</p> : list.length === 0 ? (
        <div className="empty">Zatiaľ tu nie je žiadne auto. <Link href="/admin/auta/nove">Pridajte prvé.</Link></div>
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th></th><th>Auto</th><th>Stav</th><th>Objednávky do</th><th>Koniec aukcie</th><th>Zobrazenia</th><th>Záujemcovia</th><th></th></tr></thead>
            <tbody>
              {list.map((c) => {
                const ph = carPhase(c, now || Date.now());
                const closeAt = c.order_close_at || c.auction_end_at;
                return (
                  <tr key={c.id}>
                    <td>{c.images?.[0] ? <img className="thumb" src={c.images[0]} alt="" /> : <div className="thumb" />}</td>
                    <td className="name">
                      <Link href={`/admin/auta/${c.id}`}>{c.year} {c.make} {c.model} {c.is_demo && <span className="pill" style={{ color: "var(--warn)" }}>ukážka</span>}</Link>
                      <small>{[c.trim, c.auction && `${c.auction} ${c.lot ?? ""}`, c.location].filter(Boolean).join(" · ")}</small>
                    </td>
                    <td><span className={`pill ${c.status}`}>{STATUS_LABEL[c.status]}</span><br /><span className={`pill ${ph}`} style={{ marginTop: 4 }}>{PHASE_LABEL[ph]}</span></td>
                    <td>{fmtDateTime(closeAt)}<br /><small className="num" style={{ color: "var(--rc-red-hi)" }}>{now && closeAt ? fmtLeft(Date.parse(closeAt) - now) ?? "" : ""}</small></td>
                    <td>{fmtDateTime(c.auction_end_at)}</td>
                    <td className="num" style={{ fontSize: 20 }}>{num(c.views)}</td>
                    <td>
                      <Link href={`/admin/dopyty?auto=${c.id}`} className="num" style={{ fontSize: 20, color: c.leads_count ? "var(--rc-red-hi)" : undefined }}>{c.leads_count}</Link>
                    </td>
                    <td>
                      <div className="row-actions">
                        <Link className="rc-btn rc-btn--ghost rc-btn--sm" href={`/admin/auta/${c.id}`}>Upraviť</Link>
                        {c.status !== "published" ? (
                          <button className="rc-btn rc-btn--ghost rc-btn--sm" onClick={() => setStatus(c, "published")}>Zverejniť</button>
                        ) : (
                          <button className="rc-btn rc-btn--ghost rc-btn--sm" onClick={() => setStatus(c, "sold")}>Predané</button>
                        )}
                        {(c.status === "published" || c.status === "sold") && <a className="rc-btn rc-btn--ghost rc-btn--sm" href={`/auta/${c.slug}`} target="_blank" rel="noopener">Web ↗</a>}
                        <button className="rc-btn rc-btn--ghost rc-btn--sm" onClick={() => duplicate(c)}>Kopírovať</button>
                        <button className="rc-btn rc-btn--ghost rc-btn--sm" onClick={() => remove(c)}>Zmazať</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
