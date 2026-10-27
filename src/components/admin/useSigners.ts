"use client";
import { useCallback, useEffect, useState } from "react";
import { browserClient } from "@/lib/supabase";
import type { Signer } from "@/lib/replyMail";

/** Ľudia, ktorí môžu vyhotoviť ponuku. Uložené v nastaveniach (kľúč "signers"), čítať ich môže len admin. */
export function useSigners() {
  const [list, setList] = useState<Signer[]>([]);
  const [loaded, setLoaded] = useState(false);
  const load = useCallback(() => {
    browserClient().from("settings").select("value").eq("key", "signers").maybeSingle().then(({ data }) => {
      const v = (data?.value as { list?: Signer[] } | null)?.list;
      setList(Array.isArray(v) ? v : []);
      setLoaded(true);
    });
  }, []);
  useEffect(load, [load]);
  const save = useCallback(async (next: Signer[]) => {
    const { error } = await browserClient().from("settings").upsert({ key: "signers", value: { list: next }, updated_at: new Date().toISOString() });
    if (!error) setList(next);
    return error;
  }, []);
  return { list, loaded, save, reload: load };
}
