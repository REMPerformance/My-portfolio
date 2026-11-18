import { KR_CODE, type KrInspection } from "@/lib/krInspection";
import { num } from "@/lib/format";

/** Výpis z kórejského štatutárneho protokolu o technickom stave (príloha 82) na detaile auta z Kórey. */
export function KrInspectionBlock({ ins, km }: { ins: KrInspection | null; km: number | null }) {
  if (!ins) {
    return (
      <div className="block">
        <h2>Stav auta</h2>
        <div className="panel">
          <p className="prose" style={{ margin: 0 }}>Predajca k tomuto autu zatiaľ nezverejnil kórejský protokol o technickom stave. Pred podpisom zmluvy ho vyžiadame spolu s históriou v kórejskom poistnom registri a pošleme Vám ho. Po podpise auto na mieste skontroluje náš agent a pripraví vývozné doklady.</p>
        </div>
      </div>
    );
  }
  const clean = ins.findings.length === 0;
  const alerts = ins.accident.filter((r) => r.tone === "alert").length;
  const summary: { k: string; v: string; tone: "good" | "neutral" | "alert" }[] = [
    { k: "Skelet a nosné diely", v: ins.structureOk ? "Bez opravy" : `${ins.structuralCount || "Zistená"} oprava`, tone: ins.structureOk ? "good" : "alert" },
    { k: "Vonkajšie diely", v: clean ? "Všetky originál" : `${ins.panelCount} ${ins.panelCount === 1 ? "diel" : ins.panelCount < 5 ? "diely" : "dielov"} s nálezom`, tone: clean ? "good" : "neutral" },
    { k: "Nehody a zatopenie", v: alerts ? "Záznam v protokole" : "Bez záznamu", tone: alerts ? "alert" : "good" },
    { k: "Technické skupiny", v: ins.faults ? `${ins.faults} ${ins.faults === 1 ? "nález" : ins.faults < 5 ? "nálezy" : "nálezov"}` : "Bez závad", tone: ins.faults ? "alert" : "good" }
  ];
  return (
    <div className="block kri" id="protokol">
      <h2>Protokol o technickom stave</h2>
      <p className="prose kri__lead">
        Výpis z kórejského zákonného protokolu o výkone a stave vozidla (príloha č. 82), ktorý vystavuje autorizovaná skúšobňa pred predajom jazdeného auta.
        {ins.inspectedOn && <> Kontrola prebehla {ins.inspectedOn}{km ? ` pri ${num(km)} km` : ""}.</>}
      </p>

      <div className="kri__sum">
        {summary.map((s) => (
          <div key={s.k} className={`kri__s kri__s--${s.tone}`}><small>{s.k}</small><b>{s.v}</b></div>
        ))}
      </div>

      <div className="cards2 kri__grid">
        <div className="panel">
          <h3>Karoséria</h3>
          <div className="kri__map" role="img" aria-label={clean ? "Nákres auta bez nálezov" : `Nákres auta: ${ins.marks.map((m) => `${m.part}, ${m.label}`).join("; ")}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/kr-diagram.webp" alt="" width={920} height={920} loading="lazy" />
            {ins.marks.map((m, i) => (
              <span key={i} className="kri__mk" style={{ top: `${m.top}%`, left: `${m.left}%`, background: KR_CODE[m.code]?.color || "#6b7280" }} title={`${m.part}: ${m.label}`}>{m.code}</span>
            ))}
          </div>
          {clean ? (
            <p className="kri__ok">Protokol neuvádza žiadny vymenený, opravovaný ani poškodený diel karosérie.</p>
          ) : (
            <ul className="kri__find">
              {ins.findings.map((f, i) => (
                <li key={i}><span className="kri__code" style={{ background: KR_CODE[f.code]?.color || "#6b7280" }}>{f.code}</span><span><b>{f.part}</b>{f.label}{f.structural ? ", nosný diel" : ""}</span></li>
              ))}
            </ul>
          )}
          <div className="kri__legend">{["X", "W", "A", "U", "C"].map((c) => <span key={c}><i style={{ background: KR_CODE[c].color }}>{c}</i>{KR_CODE[c].label}</span>)}</div>
        </div>

        <div className="panel">
          <h3>História a doklady</h3>
          <ul className="kri__rows">
            {[...ins.accident, ...ins.statutory].map((r) => (
              <li key={r.label}><span>{r.label}</span><b className={`kri__t--${r.tone}`}>{r.value}</b></li>
            ))}
          </ul>
          <dl className="kvlist kri__meta">
            {ins.stkTo && <><dt>Kórejská STK platná do</dt><dd>{ins.stkTo}</dd></>}
            {ins.typeApproval && <><dt>Typové schválenie</dt><dd>{ins.typeApproval}</dd></>}
            {ins.engineCode && <><dt>Kód motora</dt><dd>{ins.engineCode}</dd></>}
            {ins.cc && <><dt>Objem motora</dt><dd>{num(ins.cc)} cm³</dd></>}
            {ins.recordNo && <><dt>Číslo protokolu</dt><dd>{ins.recordNo}</dd></>}
          </dl>
        </div>
      </div>

      {ins.repairs.length > 0 && (
        <div className="panel kri__warn"><h3>Odporúčané opravy podľa protokolu</h3><ul className="ticks">{ins.repairs.map((r) => <li key={r}>{r}</li>)}</ul></div>
      )}

      {ins.devices.length > 0 && (
        <details className="panel kri__dev" open={ins.faults > 0}>
          <summary><h3>Technická kontrola: {ins.devices.reduce((a, s) => a + s.items.length, 0)} bodov{ins.faults ? `, ${ins.faults} s nálezom` : ", všetko v poriadku"}</h3></summary>
          <div className="kri__devgrid">
            {ins.devices.map((s) => (
              <div key={s.section}>
                <h4>{s.section}</h4>
                <ul className="kri__rows">{s.items.map((d, i) => <li key={i}><span>{d.item}</span><b className={`kri__t--${d.tone}`}>{d.state}</b></li>)}</ul>
              </div>
            ))}
          </div>
        </details>
      )}

      <p className="note">Údaje preberáme z protokolu, ktorý vyplnila kórejská skúšobňa a zverejnil predajca. Nie sú našou zárukou stavu. Po podpise zmluvy auto na mieste ešte skontroluje náš agent a pripraví vývozné doklady.</p>
    </div>
  );
}
