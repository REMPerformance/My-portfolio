import "server-only";
import { SITE } from "./site";

/** IndexNow – okamžite oznámi Bingu, Seznamu, Yandexu (a tým aj ChatGPT/Copilot vyhľadávaniu), že sa stránky zmenili. */
export const INDEXNOW_KEY = "33bb8433a69bf79d2bd92257a139b409";

export async function pingIndexNow(paths: string[]) {
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") return;
  const host = new URL(SITE.url).host;
  const urlList = [...new Set(paths)].map((p) => (p.startsWith("http") ? p : `${SITE.url}${p}`));
  if (!urlList.length) return;
  await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation: `${SITE.url}/${INDEXNOW_KEY}.txt`, urlList })
  }).catch(() => {});
}
