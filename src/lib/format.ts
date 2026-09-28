import type { Car } from "./types";

export const eur = (n: number) =>
  new Intl.NumberFormat("sk-SK", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(Math.round(n));
export const usd = (n: number) => "$" + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(n));
export const num = (n: number) => new Intl.NumberFormat("sk-SK").format(Math.round(n));
export const km = (mi: number | null | undefined) => (mi ? num(mi * 1.609344) + " km" : "—");

export const TYPE_LABEL: Record<string, string> = { car: "Osobné auto", suv: "SUV", truck: "Pickup", moto: "Motocykel" };
export const TYPE_SHORT: Record<string, string> = { car: "Osobné", suv: "SUV", truck: "Pickup", moto: "Motorka" };
export const RUN_LABEL: Record<string, string> = {
  run_drive: "Štartuje a jazdí",
  starts: "Štartuje",
  no_start: "Neštartuje",
  unknown: "Neoverené"
};

export function carName(c: Pick<Car, "year" | "make" | "model">) {
  return [c.year, c.make, c.model].filter(Boolean).join(" ");
}
export function carFullName(c: Pick<Car, "year" | "make" | "model" | "trim">) {
  return [c.year, c.make, c.model, c.trim].filter(Boolean).join(" ");
}

export function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

const dtf = new Intl.DateTimeFormat("sk-SK", {
  day: "numeric", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Bratislava"
});
export const fmtDateTime = (iso: string | null | undefined) => (iso ? dtf.format(new Date(iso)) : "—");

export type Phase = "open" | "closed" | "ended";
/** open = objednávky otvorené; closed = objednávky uzavreté, aukcia beží; ended = aukcia skončila / predané */
export function carPhase(c: Pick<Car, "order_close_at" | "auction_end_at" | "status"> & { sale_type?: string | null }, now = Date.now()): Phase {
  if (c.status === "sold") return "ended";
  if (c.sale_type === "fixed") {
    // pevná cena: platí do „ponuka platí do“ (ak nie je, platí do predaja)
    const until = c.order_close_at ? Date.parse(c.order_close_at) : Infinity;
    return now >= until ? "ended" : "open";
  }
  const end = c.auction_end_at ? Date.parse(c.auction_end_at) : Infinity;
  const close = c.order_close_at ? Date.parse(c.order_close_at) : end;
  if (now >= end) return "ended";
  if (now >= close) return "closed";
  return "open";
}

export const regionFromLocation = (loc: string): "east" | "central" | "west" =>
  /,\s*(CA|WA|OR|AZ|NV|UT|ID)\b/i.test(loc) ? "west" : /,\s*(NY|NJ|PA|MA|CT|MD|VA|NC|SC|GA|FL|DE|RI|NH|ME|VT)\b/i.test(loc) ? "east" : "central";

export const SALE_LABEL: Record<string, string> = { auction: "Aukcia", fixed: "Pevná cena" };
