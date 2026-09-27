"use client";
import { useEffect } from "react";
import { browserClient } from "@/lib/supabase";

/** Zaráta zobrazenie auta (1× za reláciu prehliadača). */
export function ViewPing({ slug }: { slug: string }) {
  useEffect(() => {
    const k = "rem-view-" + slug;
    try { if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, "1"); } catch { /* ignore */ }
    browserClient().rpc("increment_car_view", { p_slug: slug }).then(() => {});
  }, [slug]);
  return null;
}
