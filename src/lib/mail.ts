import "server-only";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

export const mailConfigured = () => !!process.env.RESEND_API_KEY;

export async function sendMail({ to, subject, text, replyTo, fromName }: { to: string[]; subject: string; text: string; replyTo?: string; fromName?: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to.length) return { ok: false, error: "not_configured" };
  const fromAddr = process.env.RESEND_FROM || "dopyty@remperformance.sk";
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#111">${esc(text).replace(/\n/g, "<br>")}</div>`;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from: `${fromName || "REM Performance"} <${fromAddr}>`, to, subject, text, html, reply_to: replyTo })
  }).catch((e) => ({ ok: false, status: 0, text: async () => String(e) }) as unknown as Response);
  if (!r.ok) return { ok: false, error: `${r.status} ${(await r.text()).slice(0, 200)}` };
  return { ok: true };
}
