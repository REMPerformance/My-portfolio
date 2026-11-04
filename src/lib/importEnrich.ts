/**
 * Doplnenie údajov importu v administrácii, keď ich záložka nepriniesla (napríklad stará záložka bez podpory Encaru a che168).
 * Encar: rozhranie api.encar.com je dostupné priamo z prehliadača. che168: stránku stiahne náš server (/api/import-listing).
 */
import type { ImportPayload } from "./importListing";
import { isEncar } from "./importKorea";
import { isChe168 } from "./importChina";

type Obj = Record<string, unknown>;
const get = (u: string) => fetch(u, { credentials: "omit" }).then((r) => (r.ok ? (r.json() as Promise<Obj>) : null)).catch(() => null);

async function encar(p: ImportPayload): Promise<Obj | null> {
  const m = p.u.match(/(?:detail\/|carid=)(\d+)/);
  if (!m) return null;
  const A = "https://api.encar.com/v1/readside/";
  const v = await get(`${A}vehicle/${m[1]}`);
  if (!v) return null;
  const id = String(v.vehicleId || m[1]);
  const [r, i] = await Promise.all([get(`${A}record/vehicle/${id}/open?vehicleNo=${encodeURIComponent(String(v.vehicleNo || ""))}`), get(`${A}inspection/vehicle/${id}`)]);
  for (const k of ["options", "contents", "partnership", "view", "manage", "vehicleNo"]) delete v[k];
  if (v.contact && typeof v.contact === "object") v.contact = { address: (v.contact as Obj).address };
  if (r) { delete r.carInfoChanges; delete r.carNo; delete r.accidents; }
  return { v, r, i: i ? { master: i.master, outers: i.outers } : null };
}

async function che168(p: ImportPayload, token: string): Promise<Obj | null> {
  const r = await fetch(`/api/import-listing?url=${encodeURIComponent(p.u)}`, { headers: { authorization: `Bearer ${token}` } }).catch(() => null);
  if (!r || !r.ok) return null;
  const j = (await r.json().catch(() => null)) as { c?: Obj } | null;
  return j?.c ? { c: j.c } : null;
}

/** Vráti payload doplnený o štruktúrované údaje inzerátu, ak chýbajú. Pri chybe vráti pôvodný payload. */
export async function enrichImport(p: ImportPayload, token: string): Promise<ImportPayload> {
  if (p.e) return p;
  try {
    const e = isEncar(p.u) ? await encar(p) : isChe168(p.u) ? await che168(p, token) : null;
    return e ? { ...p, e } : p;
  } catch {
    return p;
  }
}
