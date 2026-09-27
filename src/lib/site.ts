export const SITE = {
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://remperformance.sk").replace(/\/$/, ""),
  name: "REM Performance",
  fullName: "REM Performance by RACEM",
  tagline: "Dovoz áut z USA aukcií na kľúč",
  description:
    "Dovoz áut z amerických aukcií Copart a IAAI na Slovensko na kľúč. Vopred vidíte odhad celkovej ceny vrátane cla a DPH. Vydražíme, dovezieme, preclíme, homologizujeme a prihlásime. K autu kredit na tuning v RACEM.",
  email: "info@remperformance.sk",
  logo: "https://racem.sk/cdn/shop/files/RACEM-logo.png?width=600",
  heroImage: "https://racem.sk/cdn/shop/files/190320100347lc2327ae8-hd.jpg?width=2000",
  ogImage: "https://racem.sk/cdn/shop/files/190320100347lc2327ae8-hd.jpg?width=1200",
  racemUrl: "https://racem.sk",
  company: {
    name: "Lukáš Tonkovič - REM Performance",
    street: "Karpatské námestie 10A",
    zip: "831 06",
    city: "Bratislava",
    country: "Slovensko",
    ico: "57321205",
    dic: "",
    icDph: "SK1128793787",
    register: "Okresný úrad Piešťany, číslo živnostenského registra 230-24974"
  }
};

export const NAV = [
  { href: "/ponuka", label: "Ponuka áut" },
  { href: "/kalkulacka-dovozu", label: "Kalkulačka" },
  { href: "/ako-to-funguje", label: "Ako to funguje" },
  { href: "/caste-otazky", label: "Otázky" },
  { href: "/kontakt", label: "Kontakt" }
];
