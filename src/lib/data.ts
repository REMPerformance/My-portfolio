import "server-only";
import { cache } from "react";
import { serverClient } from "./supabase";
import { mergeCalc } from "./calc";
import type { Car, CalcConfig } from "./types";
import { fetchLiveFx, withLiveFx } from "./fx";

export const getCalcConfig = cache(async (): Promise<CalcConfig> => {
  const [{ data }, live] = await Promise.all([serverClient().from("settings").select("value").eq("key", "calc").maybeSingle(), fetchLiveFx()]);
  return withLiveFx(mergeCalc(data?.value), live);
});

export const getPublicCars = cache(async (): Promise<Car[]> => {
  const { data, error } = await serverClient()
    .from("cars")
    .select("*")
    .in("status", ["published", "sold"])
    .order("auction_end_at", { ascending: true, nullsFirst: false });
  if (error) console.error("getPublicCars", error.message);
  return (data as Car[]) || [];
});

export const getCarBySlug = cache(async (slug: string): Promise<Car | null> => {
  const { data } = await serverClient().from("cars").select("*").eq("slug", slug).in("status", ["published", "sold"]).maybeSingle();
  return (data as Car) || null;
});

import { carEstimate } from "./calc";
/** Odstráni interné údaje pred odoslaním auta do prehliadača. */
export function publicCar<T extends Car>(c: T): T {
  return { ...c, auction_url: null, calc_override: {}, seller_fee_usd: null };
}

export async function getCardCars() {
  const [cars, cfg] = await Promise.all([getPublicCars(), getCalcConfig()]);
  // do prehliadača posielame len to, čo zákazník môže vidieť: bez odkazu na aukciu, bez vlastnej kalkulácie a bez rozpisu poplatkov
  return { cfg, cars: cars.map((c) => { const e = carEstimate(cfg, c); return { ...publicCar(c), est: { total: e.total, gross: e.gross, net: e.net, priceMode: e.priceMode } }; }) };
}

import { mergeContent, type SiteContent } from "./content";
export const getContent = cache(async (): Promise<SiteContent> => {
  const { data } = await serverClient().from("settings").select("value").eq("key", "content").maybeSingle();
  return mergeContent(data?.value);
});
