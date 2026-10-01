import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { serverClient } from "@/lib/supabase";

/** Boti, crawlery, monitoring, náhľady odkazov a automatizované prehliadače. */
const BOT_RE =
  /bot|crawl|spider|slurp|bingpreview|mediapartners|adsbot|googleother|google-inspectiontool|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|statuscake|headless|phantom|puppeteer|playwright|selenium|webdriver|python|curl|wget|httpclient|axios|node-fetch|go-http|java\/|okhttp|scrapy|facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|telegrambot|discordbot|slackbot|skypeuripreview|embedly|quora link|pinterest|applebot|yandex|baidu|duckduck|semrush|ahrefs|mj12|dotbot|petalbot|bytespider|gptbot|chatgpt|oai-searchbot|claudebot|anthropic|perplexity|ccbot|amazonbot|dataforseo|seznambot|vercel|preview/i;

const str = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : "");

export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const path = str(b?.p, 300);
  if (!path.startsWith("/") || path.startsWith("/admin") || path.startsWith("/api")) return new NextResponse(null, { status: 204 });

  const h = req.headers;
  const ua = h.get("user-agent") || "";
  const ip = (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || "";
  const isBot =
    !ua || BOT_RE.test(ua) || b?.wd === true || !h.get("accept-language") ||
    h.get("purpose") === "prefetch" || h.get("sec-purpose")?.includes("prefetch") === true;

  // anonymný identifikátor návštevníka – mení sa každý deň, IP sa neukladá
  const day = new Date().toISOString().slice(0, 10);
  const visitor = createHash("sha256").update(`${ip}|${ua}|${day}|rem-perf-salt-2026`).digest("hex").slice(0, 32);

  let ref = str(b?.r, 300);
  try {
    if (ref) { const u = new URL(ref); ref = u.hostname.replace(/^www\./, ""); if (ref === "remperformance.sk") ref = ""; }
  } catch { ref = ""; }
  const w = Number(b?.w) || 0;
  const device = /ipad|tablet/i.test(ua) ? "tablet" : /mobi|android|iphone/i.test(ua) || (w && w < 700) ? "mobil" : "počítač";

  await serverClient().rpc("track_hit", {
    p_path: path, p_referrer: ref || null, p_visitor: visitor,
    p_country: h.get("x-vercel-ip-country") || null, p_device: device, p_is_bot: isBot, p_utm: str(b?.u, 60) || null
  });
  return new NextResponse(null, { status: 204 });
}
