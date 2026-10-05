import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SITE } from "@/lib/site";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Dovoz áut z USA, Dubaja a Kanady na kľúč | REM Performance",
    template: "%s | REM Performance"
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.company.name }],
  keywords: ["dovoz auta z USA", "dovoz áut z Ameriky", "Copart Slovensko", "IAAI", "auto z aukcie", "auto z USA cena", "clo na auto z USA", "dovoz auta na kľúč", "dovoz auta z Dubaja", "auto zo SAE", "dovoz auta z Kanady", "dovoz auta z Kórey", "dovoz auta z Japonska", "dovoz auta z Nemecka", "dovoz auta z EÚ", "nehavarované auto z USA", "auto na mieru zo zahraničia", "kalkulačka dovozu auta"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "sk_SK",
    siteName: SITE.fullName,
    url: SITE.url,
    title: "Dovoz áut zo zahraničia na kľúč | REM Performance",
    description: SITE.description,
    images: [{ url: SITE.ogImage, width: 1200, height: 630, alt: "Dovoz áut na kľúč – REM Performance" }]
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { themeColor: "#111317", width: "device-width", initialScale: 1 };

const orgLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["AutoDealer", "LocalBusiness"],
      "@id": `${SITE.url}/#org`,
      name: SITE.fullName,
      legalName: SITE.company.name,
      url: SITE.url,
      logo: `${SITE.url}${SITE.logo}`,
      image: SITE.ogImage,
      email: SITE.email,
      telephone: SITE.phone,
      description: SITE.description,
      vatID: SITE.company.icDph,
      taxID: SITE.company.ico,
      address: {
        "@type": "PostalAddress",
        streetAddress: SITE.company.street,
        postalCode: SITE.company.zip,
        addressLocality: SITE.company.city,
        addressCountry: "SK"
      },
      areaServed: [{ "@type": "Country", name: "Slovensko" }, { "@type": "Country", name: "Česko" }],
      priceRange: "€€",
      sameAs: [SITE.racemUrl],
      knowsAbout: ["dovoz áut z USA", "aukcie Copart a IAAI", "dovoz áut z Dubaja", "dovoz áut z Nemecka a EÚ", "dovoz áut z Kanady, Kórey a Japonska", "clo a DPH pri dovoze auta", "homologizácia a prihlásenie auta na Slovensku", "kontrola histórie auta podľa VIN"],
      makesOffer: [
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Dovoz auta zo zahraničia na kľúč", url: `${SITE.url}/ako-to-funguje` } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Vyhľadanie auta na mieru", url: `${SITE.url}/auto-na-mieru` } }
      ],
      parentOrganization: { "@type": "Organization", name: "RACEM", url: SITE.racemUrl }
    },
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#web`,
      url: SITE.url,
      name: SITE.fullName,
      inLanguage: "sk-SK",
      publisher: { "@id": `${SITE.url}/#org` },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${SITE.url}/ponuka?q={search_term_string}` },
        "query-input": "required name=search_term_string"
      }
    }
  ]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sk">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://racem.sk" />
        <link rel="preload" href="/fonts/rem-display-bold-latin.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <JsonLd data={orgLd} />
      </head>
      <body>{children}</body>
    </html>
  );
}
