import type { Severity } from "./types";

/** Všetky zóny na karosérii (zobrazujú sa v nákresoch). */
export const DAMAGE_ZONES: { id: string; label: string; group: string }[] = [
  { id: "front_bumper", label: "Predný nárazník", group: "Predok" },
  { id: "grille", label: "Maska chladiča", group: "Predok" },
  { id: "fl_light", label: "Ľavý svetlomet", group: "Predok" },
  { id: "fr_light", label: "Pravý svetlomet", group: "Predok" },
  { id: "hood", label: "Kapota", group: "Predok" },
  { id: "windshield", label: "Čelné sklo", group: "Sklá" },
  { id: "fl_fender", label: "Ľavý predný blatník", group: "Ľavý bok" },
  { id: "fl_door", label: "Ľavé predné dvere", group: "Ľavý bok" },
  { id: "fl_window", label: "Ľavé predné okno", group: "Sklá" },
  { id: "rl_door", label: "Ľavé zadné dvere", group: "Ľavý bok" },
  { id: "rl_window", label: "Ľavé zadné okno", group: "Sklá" },
  { id: "l_sill", label: "Ľavý prah", group: "Ľavý bok" },
  { id: "l_mirror", label: "Ľavé zrkadlo", group: "Ľavý bok" },
  { id: "rl_quarter", label: "Ľavý zadný blatník", group: "Ľavý bok" },
  { id: "fr_fender", label: "Pravý predný blatník", group: "Pravý bok" },
  { id: "fr_door", label: "Pravé predné dvere", group: "Pravý bok" },
  { id: "fr_window", label: "Pravé predné okno", group: "Sklá" },
  { id: "rr_door", label: "Pravé zadné dvere", group: "Pravý bok" },
  { id: "rr_window", label: "Pravé zadné okno", group: "Sklá" },
  { id: "r_sill", label: "Pravý prah", group: "Pravý bok" },
  { id: "r_mirror", label: "Pravé zrkadlo", group: "Pravý bok" },
  { id: "rr_quarter", label: "Pravý zadný blatník", group: "Pravý bok" },
  { id: "roof", label: "Strecha", group: "Stred" },
  { id: "rear_window", label: "Zadné sklo", group: "Sklá" },
  { id: "trunk", label: "Kufor / korba", group: "Zadok" },
  { id: "rl_light", label: "Ľavé zadné svetlo", group: "Zadok" },
  { id: "rr_light", label: "Pravé zadné svetlo", group: "Zadok" },
  { id: "rear_bumper", label: "Zadný nárazník", group: "Zadok" },
  { id: "fl_wheel", label: "Ľavé predné koleso", group: "Kolesá" },
  { id: "fr_wheel", label: "Pravé predné koleso", group: "Kolesá" },
  { id: "rl_wheel", label: "Ľavé zadné koleso", group: "Kolesá" },
  { id: "rr_wheel", label: "Pravé zadné koleso", group: "Kolesá" }
];

/** Poškodenia, ktoré sa nedajú zakresliť na karosériu. */
export const DAMAGE_FLAGS: { id: string; label: string }[] = [
  { id: "interior", label: "Interiér" },
  { id: "engine", label: "Motor" },
  { id: "transmission", label: "Prevodovka" },
  { id: "undercarriage", label: "Podvozok" },
  { id: "suspension", label: "Náprava / zavesenie" },
  { id: "electrical", label: "Elektronika" },
  { id: "airbags", label: "Airbagy" },
  { id: "frame", label: "Rám / nosná časť" },
  { id: "flood", label: "Záplava" },
  { id: "fire", label: "Požiar" },
  { id: "hail", label: "Krupobitie" },
  { id: "mechanical", label: "Mechanika" }
];

export const ALL_DAMAGE = [...DAMAGE_ZONES, ...DAMAGE_FLAGS];
export const damageLabel = (id: string) => ALL_DAMAGE.find((z) => z.id === id)?.label || id;
export const isBodyZone = (id: string) => DAMAGE_ZONES.some((z) => z.id === id);

export const SEVERITY: Record<Severity, { label: string; color: string }> = {
  light: { label: "Ľahké", color: "#ffb020" },
  medium: { label: "Stredné", color: "#ff6a1a" },
  heavy: { label: "Ťažké", color: "#e0142f" }
};
export const SEVERITY_ORDER: (Severity | null)[] = [null, "light", "medium", "heavy"];
export const sevRank = (s: Severity) => SEVERITY_ORDER.indexOf(s);
