import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
      // výslovne povolené vyhľadávače a AI asistenti, aby web mohli čítať, citovať a odporúčať
      { userAgent: ["Googlebot", "Bingbot", "SeznamBot", "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot", "Applebot-Extended", "meta-externalagent", "CCBot", "Amazonbot", "DuckAssistBot", "MistralAI-User"], allow: "/", disallow: ["/admin", "/api/"] }
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url
  };
}
