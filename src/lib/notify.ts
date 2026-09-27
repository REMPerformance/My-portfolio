export interface NotifySettings {
  adminEmails: string[];
  notifyAdmin: boolean;
  autoReply: boolean;
  fromName: string;
  replySubject: string;
  replyBody: string;
}

export const DEFAULT_NOTIFY: NotifySettings = {
  adminEmails: ["info@remperformance.sk"],
  notifyAdmin: true,
  autoReply: true,
  fromName: "REM Performance",
  replySubject: "Prijali sme Váš dopyt – {auto}",
  replyBody:
    "Dobrý deň {meno},\n\nďakujeme za Váš dopyt{auto_veta}. Do 24 hodín Vás budeme kontaktovať s presnou kalkuláciou a ďalším postupom.\n\nS pozdravom\nREM Performance by RACEM\ninfo@remperformance.sk"
};

export function mergeNotify(v: unknown): NotifySettings {
  const o = (v && typeof v === "object" ? v : {}) as Partial<NotifySettings>;
  return { ...DEFAULT_NOTIFY, ...o, adminEmails: Array.isArray(o.adminEmails) && o.adminEmails.length ? o.adminEmails : DEFAULT_NOTIFY.adminEmails };
}

export function fillTemplate(t: string, vars: Record<string, string>) {
  return t.replace(/\{(\w+)\}/g, (_m, k) => vars[k] ?? "");
}
