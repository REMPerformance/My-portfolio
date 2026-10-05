import { browserClient } from "./supabase";

/** Zmenší fotku v prehliadači (max 2000 px, WebP), aby web bol rýchly. */
export async function compressImage(file: Blob, max = 2000, quality = 0.84): Promise<Blob> {
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
    c.getContext("2d")!.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((res) => c.toBlob(res, "image/webp", quality));
    return blob || file;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function download(url: string, token: string): Promise<Blob> {
  // väčšina úložísk fotiek (napr. Copart) dovolí stiahnutie priamo z prehliadača
  try {
    const r = await fetch(url, { mode: "cors", credentials: "omit", referrerPolicy: "no-referrer" });
    if (r.ok) { const b = await r.blob(); if (b.type.startsWith("image/")) return b; }
  } catch { /* skúsime cez server */ }
  const r = await fetch(`/api/import-image?url=${encodeURIComponent(url)}`, { headers: { authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error((await r.json().catch(() => ({})) as { error?: string }).error || `chyba ${r.status}`);
  return r.blob();
}

/** Stiahne fotky z cudzích adries, zmenší ich a nahrá k autu. Vráti verejné adresy v pôvodnom poradí. */
export async function importImages(urls: string[], o: { carId: string; slugHint: string; token: string; onProgress?: (done: number, total: number) => void }) {
  const sb = browserClient();
  const out: (string | null)[] = new Array(urls.length).fill(null);
  let done = 0, failed = 0;
  for (let i = 0; i < urls.length; i += 3) {
    await Promise.all(urls.slice(i, i + 3).map(async (u, k) => {
      try {
        const blob = await compressImage(await download(u, o.token));
        const ext = blob.type === "image/webp" ? "webp" : "jpg";
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
