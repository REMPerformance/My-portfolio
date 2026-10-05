import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { serverClient } from "@/lib/supabase";

/** Boti, crawlery, monitoring, náhľady odkazov a automatizované prehliadače. */
const BOT_RE =
  /bot|crawl|spider|slurp|bingpreview|mediapartners|adsbot|googleother|google-inspectiontool|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|statuscake|headless|phantom|puppeteer|playwright|selenium|webdriver|python|curl|wget|httpclient|axios|node-fetch|go-http|java\/|okhttp|scrapy|facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|telegrambot|discordbot|slackbot|skypeuripreview|embedly|quora link|pinterest|applebot|yandex|baidu|duckduck|semrush|ahrefs|mj12|dotbot|petalbot|bytespider|gptbot|chatgpt|oai-searchbot|claudebot|anthropic|perplexity|ccbot|amazonbot|dataforseo|seznambot|vercel|preview/i;

const str = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : "");
const none = () => new NextResponse(null, { status: 204 });

function browserOf(ua: string) {
  if (/edg(e|a|ios)?\//i.test(ua)) return "Edge";
  if (/opr\/|opera/i.test(ua)) return "Opera";
  if (/samsungbrowser/i.test(ua)) return "Samsung Internet";
  if (/fban|fbav|fb_iab/i.test(ua)) return "Facebook (v aplikácii)";
  if (/instagram/i.test(ua)) return "Instagram (v aplikácii)";
  if (/tiktok|musical_ly|bytedance/i.test(ua)) return "TikTok (v aplikácii)";
  if (/firefox|fxios/i.test(ua)) return "Firefox";
  if (/chrome|crios/i.test(ua)) return "Chrome";
  if (/safari/i.test(ua)) return "Safari";
  return "";
}
function osOf(ua: string) {
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/android/i.test(ua)) return "Android";
  if (/windows/i.test(ua)) return "Windows";
  if (/mac os x|macintosh/i.test(ua)) return "macOS";
  if (/cros/i.test(ua)) return "ChromeOS";
  if (/linux/i.test(ua)) return "Linux";
  return "";
}
function decode(v: string | null) {
  if (!v) return "";
  try { return decodeURIComponent(v); } catch { return v; }
}

export async function POST(req: Request) {
  const key = process.env.HIT_SECRET;
  if (!key) return none();

  // prijímame len požiadavky z vlastného webu
  const h = req.headers;
  const origin = h.get("origin");
  if (origin) {
    try { if (new URL(origin).host !== h.get("host")) return none(); } catch { return none(); }
  }
  if (h.get("sec-fetch-site") && !["same-origin", "same-site"].includes(h.get("sec-fetch-site")!)) return none();

  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const path = str(b?.p, 300);
  if (!path.startsWith("/") || path.startsWith("/admin") || path.startsWith("/api")) return none();

  const ua = h.get("user-agent") || "";
  const ip = (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || "";

  // anonymný identifikátor návštevníka, mení sa každý deň, IP adresa sa neukladá
  const day = new Date().toISOString().slice(0, 10);
  const salt = process.env.HIT_SALT || "rem-perf-salt-2026";
  const visitor = createHash("sha256").update(`${ip}|${ua}|${day}|${salt}`).digest("hex").slice(0, 32);
  const sb = serverClient();

  // odchod zo stránky: doplní čas strávený na stránke
  if (b?.t === "l") {
    const secs = Math.round(Number(b?.d) || 0);
    if (secs >= 1) await sb.rpc("track_leave", { p_key: key, p_visitor: visitor, p_path: path, p_secs: secs });
    return none();
  }

  const isBot =
    !ua || BOT_RE.test(ua) || b?.wd === true || !h.get("accept-language") ||
    h.get("purpose") === "prefetch" || h.get("sec-purpose")?.includes("prefetch") === true;

  let ref = str(b?.r, 300);
  try {
    if (ref) { const u = new URL(ref); ref = u.hostname.replace(/^www\./, ""); if (ref === "remperformance.sk") ref = ""; }
  } catch { ref = ""; }
  const w = Number(b?.w) || 0;
  const device = /ipad|tablet/i.test(ua) ? "tablet" : /mobi|android|iphone/i.test(ua) || (w && w < 700) ? "mobil" : "počítač";

  await sb.rpc("track_hit_v2", {
    p_key: key,
    p: {
      path, referrer: ref, visitor,
      country: h.get("x-vercel-ip-country") || "",
      region: h.get("x-vercel-ip-country-region") || "",
      city: decode(h.get("x-vercel-ip-city")).slice(0, 80),
      device, browser: browserOf(ua), os: osOf(ua),
      lang: (h.get("accept-language") || "").split(",")[0].trim().slice(0, 8),
      is_bot: isBot,
      utm_source: str(b?.u, 60), utm_medium: str(b?.um, 60), utm_campaign: str(b?.uc, 80)
    }
  });
  return none();
}
