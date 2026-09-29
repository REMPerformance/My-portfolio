export const SITE = {
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://remperformance.sk").replace(/\/$/, ""),
  name: "REM Performance",
  fullName: "REM Performance by RACEM",
  tagline: "Dovoz áut zo zahraničia na kľúč",
  description:
    "Dovoz áut z USA, Dubaja (SAE), Kanady, Kórey a Japonska na Slovensko na kľúč – z aukcií Copart a IAAI aj za pevnú cenu. Vopred vidíte celkovú cenu vrátane dopravy, cla a DPH. Kúpime, dovezieme, preclíme, homologizujeme a prihlásime.",
  email: "info@remperformance.sk",
  phone: "+421 949 253 872",
  whatsapp: "421949253872",
  logo: "/brand/icon-512.png",
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
  { href: "/archiv", label: "Archív" },
  { href: "/ako-to-funguje", label: "Ako to funguje" },
  { href: "/kalkulacka-dovozu", label: "Kalkulačka" },
  { href: "/poradna", label: "Poradňa" },
  { href: "/kontakt", label: "Kontakt" }
];
