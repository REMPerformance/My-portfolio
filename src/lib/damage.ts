import type { Severity } from "./types";

/** Zóny viditeľné na nákrese auta zhora. */
export const DAMAGE_ZONES: { id: string; label: string }[] = [
  { id: "front_bumper", label: "Predný nárazník" },
  { id: "hood", label: "Kapota" },
  { id: "fl_fender", label: "Ľavý predný blatník" },
  { id: "fr_fender", label: "Pravý predný blatník" },
  { id: "windshield", label: "Čelné sklo" },
  { id: "roof", label: "Strecha" },
  { id: "fl_door", label: "Ľavé predné dvere" },
  { id: "fr_door", label: "Pravé predné dvere" },
  { id: "rl_door", label: "Ľavé zadné dvere" },
  { id: "rr_door", label: "Pravé zadné dvere" },
  { id: "rear_window", label: "Zadné sklo" },
  { id: "rl_quarter", label: "Ľavý zadný blatník" },
  { id: "rr_quarter", label: "Pravý zadný blatník" },
  { id: "trunk", label: "Kufor / korba" },
  { id: "rear_bumper", label: "Zadný nárazník" },
  { id: "fl_wheel", label: "Ľavé predné koleso" },
  { id: "fr_wheel", label: "Pravé predné koleso" },
  { id: "rl_wheel", label: "Ľavé zadné koleso" },
  { id: "rr_wheel", label: "Pravé zadné koleso" }
];

/** Poškodenia, ktoré sa nedajú zakresliť na karosériu. */
export const DAMAGE_FLAGS: { id: string; label: string }[] = [
  { id: "interior", label: "Interiér" },
  { id: "engine", label: "Motor" },
  { id: "undercarriage", label: "Podvozok" },
  { id: "electrical", label: "Elektronika" },
  { id: "airbags", label: "Airbagy" },
  { id: "flood", label: "Záplava" },
  { id: "fire", label: "Požiar" },
  { id: "mechanical", label: "Mechanika" }
];

export const ALL_DAMAGE = [...DAMAGE_ZONES, ...DAMAGE_FLAGS];
export const damageLabel = (id: string) => ALL_DAMAGE.find((z) => z.id === id)?.label || id;

export const SEVERITY: Record<Severity, { label: string; color: string }> = {
  light: { label: "Ľahké", color: "#ffb020" },
  medium: { label: "Stredné", color: "#ff6a1a" },
  heavy: { label: "Ťažké", color: "#e0142f" }
};
export const SEVERITY_ORDER: (Severity | null)[] = [null, "light", "medium", "heavy"];
