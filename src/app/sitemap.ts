import type { MetadataRoute } from "next";
import { getPublicCars } from "@/lib/data";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cars = await getPublicCars();
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE.url}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE.url}/ponuka`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE.url}/archiv`, lastModified: now, changeFrequency: "daily", priority: 0.5 },
    { url: `${SITE.url}/kalkulacka-dovozu`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE.url}/ako-to-funguje`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE.url}/caste-otazky`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE.url}/kontakt`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE.url}/vop`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE.url}/ochrana-osobnych-udajov`, changeFrequency: "yearly", priority: 0.2 }
  ];
  return [
    ...pages,
    ...cars.map((c) => ({
      url: `${SITE.url}/auta/${c.slug}`,
      lastModified: new Date(c.updated_at),
      changeFrequency: "daily" as const,
      priority: c.status === "published" ? 0.8 : 0.4,
      images: c.images?.slice(0, 5)
    }))
  ];
}
