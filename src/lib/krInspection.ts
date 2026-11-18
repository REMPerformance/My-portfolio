/**
 * Kórejský štatutárny protokol o technickom stave vozidla (príloha 82, 성능점검) zo SSANCAR API,
 * preložený do slovenčiny. Zákazník nevidí SSANCAR, ŠPZ ani VIN, len obsah protokolu.
 */

type Tone = "good" | "neutral" | "alert";
interface SsRow { label?: string; value?: string; tone?: string; note?: string | null }
interface SsFinding { group?: string; subgroup?: string | null; code?: string; part?: string; detail?: string | null; action?: string }
interface SsMarker { code?: string; part?: string; side?: string; top_pct?: number; left_pct?: number }
interface SsDevice { section?: string; item?: string; state?: string; tone?: string }

export interface SsInspection {
  available?: boolean; record_no?: string; inspected_on?: string;
  structural_assessment?: { seal?: string; summary?: SsRow[] };
  condition?: { note?: string | null; findings?: SsFinding[]; diagram?: { markers?: SsMarker[] }; devices?: SsDevice[] };
  registration?: { first_registration?: string; statutory_inspection_valid?: { from?: string; to?: string } };
  specification?: { type_approval?: string; displacement_cc?: number; engine_form?: string; statutory?: SsRow[]; options?: string[] };
  accident?: { record?: SsRow[] };
  repair_needed?: (string | { item?: string; part?: string; detail?: string })[];
}

export interface KrMark { code: string; label: string; part: string; top: number; left: number }
export interface KrInspection {
  inspectedOn: string | null; recordNo: string | null; stkTo: string | null;
  structureOk: boolean; panelCount: number; structuralCount: number;
  accident: { label: string; value: string; tone: Tone }[];
  statutory: { label: string; value: string; tone: Tone }[];
  findings: { code: string; label: string; part: string; structural: boolean }[];
  marks: KrMark[];
  devices: { section: string; items: { item: string; state: string; tone: Tone }[] }[];
  faults: number;
  repairs: string[];
  typeApproval: string | null; engineCode: string | null; cc: number | null;
  options: string[];
}

const tone = (t?: string): Tone => (t === "good" ? "good" : t === "alert" || t === "bad" ? "alert" : "neutral");

/** Kódy z nákresu v protokole. */
export const KR_CODE: Record<string, { label: string; color: string }> = {
  X: { label: "Vymenený diel", color: "#c0392b" },
  W: { label: "Opravené alebo zvárané", color: "#d97706" },
  C: { label: "Korózia", color: "#6b7280" },
  A: { label: "Škrabanec", color: "#6b7280" },
  U: { label: "Preliačina", color: "#6b7280" },
  T: { label: "Poškodenie", color: "#6b7280" }
};

const PART: [RegExp, string][] = [
  [/^hood/i, "Kapota"], [/front fender|^fender/i, "Predný blatník"], [/door.*front/i, "Predné dvere"], [/door.*rear/i, "Zadné dvere"], [/^door/i, "Dvere"],
  [/trunk|tailgate|back door/i, "Veko kufra"], [/radiator support/i, "Nosník chladiča"], [/quarter panel|rear fender/i, "Zadný blatník"],
  [/roof panel|^roof/i, "Strecha"], [/side sill|rocker/i, "Prah"], [/front panel/i, "Predný panel"], [/cross member/i, "Priečny nosník"],
  [/inside panel|inner panel/i, "Vnútorný panel"], [/side member/i, "Pozdĺžny nosník"], [/wheel ?house/i, "Podbeh kolesa"],
  [/dash ?panel/i, "Čelná stena"], [/floor panel/i, "Podlaha"], [/trunk floor/i, "Podlaha kufra"], [/rear panel/i, "Zadný panel"],
  [/package tray/i, "Zadná polica"], [/pillar.*a|a.?pillar/i, "Stĺpik A"], [/pillar.*b|b.?pillar/i, "Stĺpik B"], [/pillar.*c|c.?pillar/i, "Stĺpik C"],
  [/pillar/i, "Stĺpik"], [/bumper.*front|front bumper/i, "Predný nárazník"], [/bumper.*rear|rear bumper/i, "Zadný nárazník"]
];
const side = (s: string) => (/·\s*right|\bR\b$/i.test(s) ? " vpravo" : /·\s*left|\bL\b$/i.test(s) ? " vľavo" : "");
export const krPart = (p?: string, sd?: string) => {
  const s = p || "";
  const base = PART.find(([r]) => r.test(s))?.[1] || s.replace(/\s*·.*$/, "");
  return base + (sd === "R" ? " vpravo" : sd === "L" ? " vľavo" : side(s));
};

const LABEL: Record<string, string> = {
  "Accident history": "Nehoda v histórii", "Simple repair": "Drobná oprava", Flooding: "Zatopenie",
  "Outer panel (rank 1)": "Vonkajšie diely (1. stupeň)", "Outer panel (rank 2)": "Vonkajšie diely (2. stupeň)", "Main frame": "Hlavný skelet",
  "VIN marking": "Označenie VIN", Tuning: "Úpravy (tuning)", "Special history": "Osobitná história (taxi, požičovňa)", "Usage change": "Zmena účelu použitia",
  "Mileage condition": "Stav počítadla km", "Instrument condition": "Stav nájazdu", "Recall subject": "Zvolávacia akcia",
  Structure: "Skelet", "Outer panels": "Vonkajšie diely", "Tuning legality": "Legálnosť úprav", "Tuning type": "Druh úprav", "Recall completion": "Vykonanie zvolávacej akcie"
};
const VALUE: Record<string, string> = {
  None: "Nie", Yes: "Áno", Good: "V poriadku", Fault: "Porucha", Low: "Nízky", High: "Vysoký", Normal: "Bežný", "N/A": "Netýka sa",
  Adequate: "Primeraná", Leak: "Únik", "Minor leak": "Mierny únik", Seep: "Mierne potenie", Insufficient: "Nedostatočná", Excess: "Nadmerná",
  Present: "Áno", Absent: "Nie", Clean: "Čisté", Done: "Vykonaná", "Not done": "Nevykonaná", Contaminated: "Znečistená", Defective: "Chybná", Poor: "Zlý",
  "Intact · original": "Neporušený, originál", "All original": "Všetky originál", Fair: "Primeraný", Structure: "Konštrukčná", Legal: "Legálne", Illegal: "Nelegálne",
  Applicable: "Týka sa", "Not completed": "Nevykonaná", Completed: "Vykonaná", Device: "Doplnok", Rental: "Požičovňa", Business: "Firemné", Commercial: "Komerčné"
};
const SECTION: Record<string, string> = {
  "Self-Diagnosis": "Autodiagnostika", Engine: "Motor", Transmission: "Prevodovka", Powertrain: "Prenos sily", Steering: "Riadenie",
  Braking: "Brzdy", Electrical: "Elektrika", Fuel: "Palivo", "High-voltage": "Vysoké napätie", "High-Voltage EV": "Vysoké napätie", "Air conditioning": "Klimatizácia"
};
const ITEM: [RegExp, string][] = [
  [/^engine$/i, "Motor"], [/^transmission$/i, "Prevodovka"], [/operation \(idle\)/i, "Chod na voľnobeh"], [/engine oil level/i, "Hladina motorového oleja"],
  [/cv joint/i, "Homokinetické kĺby"], [/propeller shaft/i, "Kardan a ložisko"], [/differential/i, "Diferenciál"],
  [/power-steering oil leak/i, "Únik oleja posilňovača"], [/master-cylinder/i, "Únik oleja hlavného valca bŕzd"], [/^brake oil leak/i, "Únik brzdovej kvapaliny"],
  [/brake booster/i, "Posilňovač bŕzd"], [/alternator/i, "Alternátor"], [/start motor/i, "Štartér"], [/wiper/i, "Motor stieračov"], [/blower/i, "Ventilátor kúrenia"],
  [/radiator fan/i, "Ventilátor chladiča"], [/window motor/i, "Motorčeky okien"], [/fuel leak/i, "Únik paliva"], [/cylinder cover oil/i, "Únik oleja pod vekom ventilov"],
  [/head\/gasket oil/i, "Únik oleja z hlavy valcov"], [/block\/oil pan/i, "Únik oleja z bloku a vane"], [/head\/gasket coolant/i, "Únik chladiva z hlavy valcov"],
  [/water-pump/i, "Únik chladiva z vodnej pumpy"], [/radiator coolant/i, "Únik chladiva z chladiča"], [/coolant level/i, "Hladina chladiva"],
  [/a\/t\) oil leak/i, "Únik oleja automatickej prevodovky"], [/a\/t\) oil level/i, "Olej automatickej prevodovky"], [/a\/t\) operation/i, "Chod automatickej prevodovky"],
  [/m\/t\) oil leak/i, "Únik oleja manuálnej prevodovky"], [/m\/t\) gearshift/i, "Radenie manuálnej prevodovky"], [/m\/t\) oil level/i, "Olej manuálnej prevodovky"],
  [/m\/t\) operation/i, "Chod manuálnej prevodovky"], [/common rail/i, "Vstrekovanie common rail"], [/charging-port insulation/i, "Izolácia nabíjacieho portu"], [/high-voltage wiring/i, "Vysokonapäťová kabeláž"], [/gear shift/i, "Radenie"], [/clutch/i, "Spojka"], [/steering gear/i, "Prevodka riadenia"],
  [/steering pump/i, "Čerpadlo posilňovača"], [/tie-rod/i, "Tyče riadenia a čapy"], [/steering joint/i, "Kĺb riadenia"], [/high-pressure hose/i, "Tlaková hadica posilňovača"],
  [/compressor/i, "Kompresor klimatizácie"], [/charging port/i, "Nabíjací port"], [/battery/i, "Batéria"], [/inverter/i, "Menič"], [/motor/i, "Elektromotor"]
];
const OPT: [RegExp, string][] = [
  [/sunroof|panorama/i, "Strešné okno"], [/full-auto a\/c|automatic a\/c/i, "Automatická klimatizácia"], [/steering-wheel controls/i, "Ovládanie na volante"],
  [/aluminum wheels|alloy/i, "Hliníkové disky"], [/power-folding mirrors/i, "Elektricky sklopné zrkadlá"], [/ecm rearview/i, "Samostmievacie spätné zrkadlo"],
  [/navigation/i, "Navigácia"], [/rear camera|backup camera/i, "Zadná kamera"], [/around view|360/i, "Kamera 360°"], [/heated seats? \(front\)|front.*heated|heated seat/i, "Vyhrievané sedadlá"],
  [/ventilated seat/i, "Vetrané sedadlá"], [/leather/i, "Kožené sedadlá"], [/power seat/i, "Elektricky nastaviteľné sedadlá"], [/memory seat/i, "Pamäť sedadiel"],
  [/smart key/i, "Bezkľúčové štartovanie"], [/cruise/i, "Tempomat"], [/hud|head-up/i, "Head-up displej"], [/heated steering/i, "Vyhrievaný volant"],
  [/parking sensor/i, "Parkovacie senzory"], [/lane/i, "Asistent jazdného pruhu"], [/blind spot/i, "Sledovanie mŕtveho uhla"], [/airbag/i, "Airbagy"],
  [/abs/i, "ABS"], [/esc|esp|vdc/i, "Stabilizačný systém"], [/xenon|hid|led head/i, "LED alebo xenónové svetlomety"], [/power trunk|power tailgate/i, "Elektrické veko kufra"],
  [/bluetooth/i, "Bluetooth"], [/usb|aux/i, "USB"], [/tpms|tire pressure/i, "Snímače tlaku v pneumatikách"], [/rain sensor/i, "Dažďový senzor"],
  [/power windows?/i, "Elektrické okná"], [/central lock/i, "Centrálne zamykanie"], [/sound system|premium audio|bose|harman|meridian|burmester|lexicon/i, "Prémiový zvukový systém"]
];
const tr = (m: Record<string, string>, v?: string) => (v ? m[v] ?? v : "");
const trRe = (m: [RegExp, string][], v?: string) => (v ? m.find(([r]) => r.test(v))?.[1] ?? v : "");
const date = (v?: string | null) => { const x = (v || "").match(/^(\d{4})-(\d{2})-(\d{2})/); return x ? `${+x[3]}. ${+x[2]}. ${x[1]}` : null; };

export function krInspection(ir: SsInspection | null | undefined, car: { fuel?: string | null; gear?: string | null } = {}): KrInspection | null {
  if (!ir || !ir.available) return null;
  const c = ir.condition || {};
  const findings = (c.findings || []).map((f) => ({
    code: f.code || "T", label: KR_CODE[f.code || ""]?.label || f.action || "", part: krPart(f.part), structural: /struct|frame|member/i.test(`${f.group} ${f.subgroup}`)
  }));
  // protokol obsahuje riadky pre všetky pohony; elektrické a manuálne/automatické riadky necháme len tam, kde k autu patria
  const ev = /elektro|hybrid/i.test(car.fuel || ""), auto = /automat/i.test(car.gear || ""), manual = /manu/i.test(car.gear || "");
  const devs = (c.devices || []).filter((d) => d.item
    && !(/high-?voltage|\bev\b/i.test(`${d.section}`) && !ev)
    && !(/\(m\/t\)|manual/i.test(`${d.item}`) && auto)
    && !(/\(a\/t\)|automatic/i.test(`${d.item}`) && manual));
  const sections = new Map<string, { item: string; state: string; tone: Tone }[]>();
  for (const d of devs) {
    const s = tr(SECTION, d.section) || "Ostatné";
    // „Engine“ v autodiagnostike a v motore sú rôzne kontroly
    const item = d.section === "Self-Diagnosis" ? `Diagnostika: ${trRe(ITEM, d.item).toLowerCase()}` : trRe(ITEM, d.item);
    if (!sections.has(s)) sections.set(s, []);
    sections.get(s)!.push({ item, state: tr(VALUE, d.state), tone: tone(d.tone) });
  }
  const rows = (r?: SsRow[]) => (r || []).filter((x) => x.label).map((x) => ({ label: tr(LABEL, x.label), value: tr(VALUE, x.value), tone: tone(x.tone) }));
  const sp = ir.specification || {};
  return {
    inspectedOn: date(ir.inspected_on), recordNo: ir.record_no || null, stkTo: date(ir.registration?.statutory_inspection_valid?.to),
    structureOk: ir.structural_assessment?.seal === "clean" && !findings.some((f) => f.structural),
    panelCount: findings.filter((f) => !f.structural).length, structuralCount: findings.filter((f) => f.structural).length,
    accident: rows(ir.accident?.record), statutory: rows(sp.statutory),
    findings,
    marks: (c.diagram?.markers || []).filter((m) => typeof m.top_pct === "number" && typeof m.left_pct === "number")
      .map((m) => ({ code: m.code || "T", label: KR_CODE[m.code || ""]?.label || "", part: krPart(m.part, m.side), top: m.top_pct!, left: m.left_pct! })),
    devices: [...sections].map(([section, items]) => ({ section, items })),
    faults: devs.filter((d) => tone(d.tone) === "alert").length,
    repairs: (ir.repair_needed || []).map((r) => (typeof r === "string" ? r : [r.item || r.part, r.detail].filter(Boolean).join(": "))).filter(Boolean),
    typeApproval: sp.type_approval || null, engineCode: sp.engine_form || null, cc: sp.displacement_cc || null,
    options: [...new Set((sp.options || []).map((o) => trRe(OPT, o)))]
  };
}
