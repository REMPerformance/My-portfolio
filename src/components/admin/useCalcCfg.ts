"use client";
import { useEffect, useState } from "react";
import { browserClient } from "@/lib/supabase";
import { mergeCalc } from "@/lib/calc";
import { withLiveFx, type LiveFx } from "@/lib/fx";
import type { CalcConfig } from "@/lib/types";

/** Nastavenia kalkulácie + živé kurzy ECB (ak je zapnutý automatický kurz). */
export function useCalcCfg() {
  const [raw, setRaw] = useState<CalcConfig | null>(null);
  const [live, setLive] = useState<LiveFx | null | undefined>(undefined);
  useEffect(() => {
    browserClient().from("settings").select("value").eq("key", "calc").maybeSingle().then(({ data }) => setRaw(mergeCalc(data?.value)));
    fetch("/api/fx").then((r) => (r.ok ? r.json() : null)).then((j) => setLive(j && j.rates ? j : null)).catch(() => setLive(null));
  }, []);
  return { cfg: raw ? withLiveFx(raw, live ?? null) : null, raw, setRaw, live };
}
