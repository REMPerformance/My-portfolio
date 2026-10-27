"use client";
import { useEffect, useState } from "react";
import type { Signer } from "@/lib/replyMail";
import { useAdmin } from "@/components/admin/AdminApp";
import { useSigners } from "@/components/admin/useSigners";

/** Zmenší podpis na rozumnú veľkosť a uloží ako PNG s priehľadným pozadím. */
async function toPng(file: Blob, maxW = 600): Promise<string> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, maxW / bmp.width);
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL("image/png");
}

/** Správa ľudí, ktorí vyhotovujú ponuky v PDF (meno, funkcia, podpis). */
export function SignersPanel() {
  const { toast } = useAdmin();
  const { list, loaded, save } = useSigners();
  const [rows, setRows] = useState<Signer[]>([]);
  useEffect(() => { if (loaded) setRows(list); }, [loaded, list]);
  const set = (i: number, patch: Partial<Signer>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  async function upload(i: number, f: File | undefined) {
    if (!f) return;
    try { set(i, { img: await toPng(f) }); } catch { toast("Obrázok podpisu sa nepodarilo načítať.", true); }
  }
  async function store() {
    const clean = rows.filter((r) => r.name.trim()).map((r) => ({ ...r, name: r.name.trim(), role: r.role.trim() }));
    const err = await save(clean);
    if (err) return toast(err.message, true);
    toast("Podpisy uložené");
  }
  return (
    <div className="panel">
      <h2>Podpisy na ponukách (PDF)</h2>
      <p className="note" style={{ marginTop: 0 }}>Pri generovaní ponuky v e-maile si vyberiete, kto ju vyhotovil. Podpis nahrajte ako PNG s priehľadným pozadím. Podpisy vidí len admin.</p>
      {rows.map((r, i) => (
        <div className="three" key={r.id} style={{ alignItems: "end" }}>
          <div className="field"><label>Meno</label><input className="input" value={r.name} onChange={(e) => set(i, { name: e.target.value })} /></div>
          <div className="field"><label>Funkcia</label><input className="input" value={r.role} placeholder="Managing Director" onChange={(e) => set(i, { role: e.target.value })} /></div>
          <div className="field"><label>Na ponuke</label>
            <select className="input" value={r.made} onChange={(e) => set(i, { made: e.target.value as Signer["made"] })}><option>Vyhotovil</option><option>Vyhotovila</option></select>
          </div>
          <div className="field"><label>Podpis</label>
            {r.img && <img src={r.img} alt="Podpis" style={{ height: 48, width: "auto", display: "block", background: "#fff", marginBottom: 6 }} />}
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => upload(i, e.target.files?.[0])} />
          </div>
          <div className="field"><button type="button" className="rc-btn rc-btn--ghost rc-btn--sm" onClick={() => setRows(rows.filter((_, j) => j !== i))}>Odstrániť</button></div>
        </div>
      ))}
      <div className="row-actions" style={{ marginTop: 10 }}>
        <button type="button" className="rc-btn rc-btn--ghost rc-btn--sm" onClick={() => setRows([...rows, { id: Math.random().toString(36).slice(2, 10), name: "", role: "", made: "Vyhotovila", img: "" }])}>+ Pridať osobu</button>
        <button type="button" className="rc-btn rc-btn--primary rc-btn--sm" onClick={store}>Uložiť podpisy</button>
      </div>
    </div>
  );
}
