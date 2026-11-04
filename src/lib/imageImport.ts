import { browserClient } from "./supabase";

/** Zmenší fotku v prehliadači (max 2000 px, WebP), aby web bol rýchly. */
export async function compressImage(file: Blob, max = 2000, quality = 0.84, type: "image/webp" | "image/jpeg" = "image/webp"): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale), h = Math.round(img.naturalHeight * scale);
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d")!;
    if (type === "image/jpeg") { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h); }
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((res) => c.toBlob(res, type, quality));
    return blob || file;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* ───────── stiahnutie cez stránku inzerátu ─────────
 * Niektoré weby (Autowini, Encar) nepustia fotky na iný web ani na server. Záložka „Import do REM“ preto na stránke inzerátu
 * čaká na žiadosti z administrácie, fotku stiahne tam (kde ju web pustí) a pošle ju späť. Funguje, kým je karta s inzerátom otvorená.
 */
/** Niektoré úložiská (Autowini) posielajú typ len „image“ bez formátu. Doplníme ho podľa prípony. */
function asImage(b: Blob, url: string): Blob | null {
  if (/^image\/[a-z+.-]+/i.test(b.type)) return b;
  if (b.type && !/^image\b/i.test(b.type) && !/octet-stream/i.test(b.type)) return null;
  const ext = (url.split("?")[0].match(/\.(jpe?g|png|webp|avif|gif)$/i) || [])[1]?.toLowerCase();
  return new Blob([b], { type: ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : ext === "avif" ? "image/avif" : ext === "gif" ? "image/gif" : "image/jpeg" });
}

let seq = 0;
let bridge: Promise<boolean> | null = null;
function ask<T>(msg: Record<string, unknown>, reply: string, ms: number): Promise<T> {
  const op = typeof window !== "undefined" ? (window.opener as Window | null) : null;
  if (!op) return Promise.reject(new Error("bez okna inzerátu"));
  const id = `${Date.now().toString(36)}-${++seq}`;
  return new Promise<T>((res, rej) => {
    const done = (fn: () => void) => { clearTimeout(timer); window.removeEventListener("message", on); fn(); };
    const timer = setTimeout(() => done(() => rej(new Error("bez odpovede"))), ms);
    function on(ev: MessageEvent) {
      const d = ev.data as { t?: string; id?: string } | null;
      if (ev.source !== op || !d || d.t !== reply || d.id !== id) return;
      done(() => res(d as T));
    }
    window.addEventListener("message", on);
    try { op.postMessage({ ...msg, id }, "*"); } catch { done(() => rej(new Error("okno inzerátu nie je dostupné"))); }
  });
}
/** Či je otvorená karta s inzerátom, z ktorej import prišiel, a vie sťahovať fotky. */
function hasBridge() {
  if (!bridge) bridge = ask({ t: "rem-ping" }, "rem-pong", 1500).then(() => true, () => false);
  return bridge;
}
async function viaListing(url: string): Promise<Blob> {
  if (!(await hasBridge())) throw new Error("bez okna inzerátu");
  const r = await ask<{ b?: Blob; e?: number }>({ t: "rem-img", u: url }, "rem-img", 25000);
  const b = r.b instanceof Blob ? asImage(r.b, url) : null;
  if (b) return b;
  throw new Error("fotku sa nepodarilo stiahnuť");
}

async function download(url: string, token: string): Promise<Blob> {
  // väčšina úložísk fotiek (napr. Copart) dovolí stiahnutie priamo z prehliadača
  try {
    const r = await fetch(url, { mode: "cors", credentials: "omit", referrerPolicy: "no-referrer" });
    if (r.ok) { const b = asImage(await r.blob(), url); if (b) return b; }
  } catch { /* skúsime cez stránku inzerátu */ }
  // potom cez kartu s inzerátom (záložka tam stiahne fotku a pošle ju sem)
  try { return await viaListing(url); } catch { /* skúsime cez server */ }
  const r = await fetch(`/api/import-image?url=${encodeURIComponent(url)}`, { headers: { authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error((await r.json().catch(() => ({})) as { error?: string }).error || `chyba ${r.status}`);
  return r.blob();
}

/** Stiahne fotky z cudzích adries, zmenší ich a nahrá k autu. Vráti verejné adresy v pôvodnom poradí. S voľbou jpeg ich uloží vo formáte, ktorý zobrazí každý e-mailový klient. */
export async function importImages(urls: string[], o: { carId: string; slugHint: string; token: string; jpeg?: boolean; onProgress?: (done: number, total: number) => void }) {
  const sb = browserClient();
  const out: (string | null)[] = new Array(urls.length).fill(null);
  let done = 0, failed = 0;
  for (let i = 0; i < urls.length; i += 3) {
    await Promise.all(urls.slice(i, i + 3).map(async (u, k) => {
      try {
        const blob = o.jpeg ? await compressImage(await download(u, o.token), 1400, 0.82, "image/jpeg") : await compressImage(await download(u, o.token));
        const ext = blob.type === "image/webp" ? "webp" : blob.type === "image/png" ? "png" : "jpg";
        const path = `${o.carId}/${(o.slugHint || "auto").slice(0, 50)}-${Date.now().toString(36)}-${i + k}.${ext}`;
        const { error } = await sb.storage.from("car-images").upload(path, blob, { contentType: blob.type || "image/jpeg", cacheControl: "31536000", upsert: false });
        if (error) throw error;
        out[i + k] = sb.storage.from("car-images").getPublicUrl(path).data.publicUrl;
      } catch { failed++; }
      o.onProgress?.(++done, urls.length);
    }));
  }
  return { urls: out.filter(Boolean) as string[], failed };
}
