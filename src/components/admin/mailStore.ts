import type { SupabaseClient } from "@supabase/supabase-js";
import type { Lead, Mail } from "@/lib/types";
import { eur, fmtDate } from "@/lib/format";
import { EMPTY_OFFER, EMPTY_REPLY, TEMPLATES, normalizeReply, offerFilled, replySubject, type ReplyData } from "@/lib/replyMail";

const TARGET = "rem-mail-import";
const TARGET_MS = 60 * 60 * 1000;

/** E-mail, do ktorého má pristáť najbližšie auto poslané záložkou z aukcie. */
export function setImportTarget(id: string | null) {
  try {
    if (id) localStorage.setItem(TARGET, JSON.stringify({ id, t: Date.now() }));
    else localStorage.removeItem(TARGET);
  } catch { /* úložisko nie je dostupné */ }
}
export function getImportTarget(): string | null {
  try {
    const v = JSON.parse(localStorage.getItem(TARGET) || "null") as { id?: string; t?: number } | null;
    return v?.id && Date.now() - (v.t || 0) < TARGET_MS ? v.id : null;
  } catch { return null; }
}
/** Vráti čakajúci e-mail a čakanie zruší, aby ďalší import zo záložky išiel zasa do nového auta. */
export function takeImportTarget(): string | null {
  const id = getImportTarget();
  setImportTarget(null);
  return id;
}

export const mailData = (m: Pick<Mail, "data">): ReplyData => normalizeReply(m.data) || { ...EMPTY_REPLY, offers: [] };

/** Autá, ktoré e-mail obsahuje: názov, interný odkaz na inzerát a odkaz na web. */
export function mailCars(m: Pick<Mail, "data">) {
  return mailData(m).offers.filter(offerFilled).map((o) => ({ title: o.title.trim() || "Auto bez názvu", sourceUrl: /^https?:\/\//i.test(o.sourceUrl.trim()) ? o.sourceUrl.trim() : "", carUrl: /^https?:\/\//i.test(o.carUrl.trim()) ? o.carUrl.trim() : "" }));
}

const quoteOf = (lead: Lead) => ({
  quoteTitle: `Váš dopyt z ${fmtDate(lead.created_at)}`,
  quote: [lead.message?.trim(), lead.max_budget_eur ? `Rozpočet: ${eur(lead.max_budget_eur)}` : ""].filter(Boolean).join("\n")
});

/** Prvá odpoveď na dopyt. Ak v prehliadači ostal koncept zo staršej verzie, prevezme ho. */
function firstReply(lead: Lead): ReplyData {
  try {
    const s = localStorage.getItem(`rem-reply:${lead.id}`);
    const saved = s ? normalizeReply(JSON.parse(s)) : null;
    if (saved) return saved;
  } catch { /* bez uloženého konceptu */ }
  return { ...EMPTY_REPLY, offers: [{ ...EMPTY_OFFER, title: (lead.car_label || "").replace(/^na mieru:\s*/i, "") }], ...quoteOf(lead) };
}

export async function createMail(sb: SupabaseClient, o: { lead?: Lead | null; template?: string; data?: ReplyData; to_email?: string; to_name?: string; more?: boolean }): Promise<Mail> {
  const tpl = TEMPLATES.find((t) => t.id === (o.more ? "more" : o.template))?.make();
  const data: ReplyData = o.data || (o.lead ? (o.more ? { ...tpl!, ...quoteOf(o.lead) } : firstReply(o.lead)) : tpl || TEMPLATES[0].make());
  const { data: row, error } = await sb.from("mails").insert({
    lead_id: o.lead?.id ?? null,
    to_email: o.to_email ?? o.lead?.email ?? "",
    to_name: o.to_name ?? o.lead?.name ?? "",
    subject: replySubject(data),
    data
  }).select("*").single();
  if (error) throw new Error(error.message);
  return row as Mail;
}
