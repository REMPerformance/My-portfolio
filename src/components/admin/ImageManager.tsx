"use client";
import { useRef, useState } from "react";
import { browserClient } from "@/lib/supabase";

import { compressImage as compress } from "@/lib/imageImport";

export function ImageManager({
  carId,
  slugHint,
  images,
  onChange,
  onError
}: {
  carId: string;
  slugHint: string;
  images: string[];
  onChange: (imgs: string[]) => void;
  onError: (m: string) => void;
}) {
  const sb = browserClient();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [drag, setDrag] = useState<number | null>(null);
  const [target, setTarget] = useState<number | null>(null);

  async function upload(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    setUploading(list.length);
    const out: string[] = [];
    // paralelne po 3 kusoch, poradie zachované
    for (let i = 0; i < list.length; i += 3) {
      const chunk = list.slice(i, i + 3);
      const urls = await Promise.all(
        chunk.map(async (f, k) => {
          try {
            const blob = await compress(f);
            const ext = blob.type === "image/webp" ? "webp" : (f.name.split(".").pop() || "jpg").toLowerCase();
            const path = `${carId}/${(slugHint || "auto").slice(0, 50)}-${Date.now().toString(36)}-${i + k}.${ext}`;
            const { error } = await sb.storage.from("car-images").upload(path, blob, { contentType: blob.type || f.type, cacheControl: "31536000", upsert: false });
            if (error) throw error;
            return sb.storage.from("car-images").getPublicUrl(path).data.publicUrl;
          } catch (e) {
            onError(`Nahrávanie ${f.name} zlyhalo: ${(e as Error).message}`);
            return null;
          } finally {
            setUploading((n) => Math.max(0, n - 1));
          }
        })
      );
      out.push(...(urls.filter(Boolean) as string[]));
    }
    onChange([...images, ...out]);
  }

  async function remove(i: number) {
    const url = images[i];
    const path = url.split("/car-images/")[1];
    if (path) await sb.storage.from("car-images").remove([path]);
    onChange(images.filter((_, k) => k !== i));
  }

  function move(from: number, to: number) {
    if (from === to) return;
    const arr = [...images];
    const [x] = arr.splice(from, 1);
    arr.splice(to, 0, x);
    onChange(arr);
  }

  return (
    <div>
      <div
        className={`drop${over ? " over" : ""}`}
        onClick={() => input.current?.click()}
        onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setOver(true); } }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { if (e.dataTransfer.files.length) { e.preventDefault(); setOver(false); upload(e.dataTransfer.files); } }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") input.current?.click(); }}
      >
        <b>Pretiahnite fotky sem</b> alebo kliknite a vyberte zo zariadenia.
        <div className="note" style={{ marginTop: 6 }}>Fotky sa automaticky zmenšia a skonvertujú na WebP. Prvá fotka je titulná. Poradie zmeníte pretiahnutím.</div>
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { if (e.target.files) upload(e.target.files); e.target.value = ""; }} />
      </div>
      {(images.length > 0 || uploading > 0) && (
        <div className="imgs">
          {images.map((src, i) => (
            <div
              key={src}
              className={`it${i === 0 ? " cover" : ""}${drag === i ? " dragging" : ""}${target === i && drag !== i ? " target" : ""}`}
              draggable
              onDragStart={(e) => { setDrag(i); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(i)); }}
              onDragOver={(e) => { if (drag !== null) { e.preventDefault(); setTarget(i); } }}
              onDragLeave={() => setTarget((t) => (t === i ? null : t))}
              onDrop={(e) => { e.preventDefault(); if (drag !== null) move(drag, i); setDrag(null); setTarget(null); }}
              onDragEnd={() => { setDrag(null); setTarget(null); }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Fotka ${i + 1}`} />
              <div className="bar">
                <span>{i === 0 ? "Titulná" : `#${i + 1}`}</span>
                <span style={{ display: "flex", gap: 4 }}>
                  {i > 0 && <button type="button" title="Nastaviť ako titulnú" onClick={() => move(i, 0)}>★</button>}
                  {i > 0 && <button type="button" title="Posunúť doľava" onClick={() => move(i, i - 1)}>←</button>}
                  {i < images.length - 1 && <button type="button" title="Posunúť doprava" onClick={() => move(i, i + 1)}>→</button>}
                  <button type="button" title="Zmazať" onClick={() => remove(i)}>✕</button>
                </span>
              </div>
            </div>
          ))}
          {Array.from({ length: uploading }, (_, k) => <div key={"u" + k} className="it up">Nahrávam…</div>)}
        </div>
      )}
    </div>
  );
}
