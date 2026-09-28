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
  keywords: ["dovoz auta z USA", "dovoz áut z Ameriky", "Copart Slovensko", "IAAI", "auto z aukcie", "auto z USA cena", "clo na auto z USA", "dovoz auta na kľúč", "dovoz auta z Dubaja", "auto zo SAE", "dovoz auta z Kanady", "dovoz auta z Kórey", "dovoz auta z Japonska"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "sk_SK",
    siteName: SITE.fullName,
    url: SITE.url,
    title: "Dovoz áut zo zahraničia na kľúč | REM Performance",
    description: SITE.description,
    images: [{ url: SITE.ogImage, width: 1200, height: 800, alt: "Auto z USA – REM Performance" }]
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  formatDetection: { telephone: false },
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='8' fill='%23050505'/%3E%3Cpath d='M14 18h36l-6 12H8z' fill='%23c8102e'/%3E%3Cpath d='M20 36h36l-6 12H14z' fill='%23fff'/%3E%3C/svg%3E"
  }
};

export const viewport: Viewport = { themeColor: "#0b0c0e", width: "device-width", initialScale: 1 };

const orgLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["AutoDealer", "LocalBusiness"],
      "@id": `${SITE.url}/#org`,
      name: SITE.fullName,
      legalName: SITE.company.name,
      url: SITE.url,
      logo: SITE.logo,
      image: SITE.ogImage,
      email: SITE.email,
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
      parentOrganization: { "@type": "Organization", name: "RACEM", url: SITE.racemUrl }
    },
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#web`,
      url: SITE.url,
      name: SITE.fullName,
      inLanguage: "sk-SK",
      publisher: { "@id": `${SITE.url}/#org` }
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
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <JsonLd data={orgLd} />
      </head>
      <body>{children}</body>
    </html>
  );
}
