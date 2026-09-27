# REM Performance by RACEM – dovoz áut z USA

Web **remperformance.sk**: ponuka áut z aukcií Copart/IAAI, podstránka pre každé auto, kalkulačka dovozu, VOP, GDPR a admin panel.

- **Frontend:** Next.js 16 (App Router), server-rendering + ISR (obnova každú minútu, po uložení v admine okamžite)
- **Dáta, fotky, prihlásenie:** Supabase projekt `rem-performance` (Frankfurt)
- **Hosting:** Vercel (tím REMACI)
- **Dizajn:** RACEM (#050505 / #c8102e, Barlow + Barlow Condensed)

## Admin
`/admin` – prihlásenie e-mailom a heslom (`info@remperformance.sk`).

- **Autá** – prehľad s počtom zobrazení a záujemcov, zverejnenie, predané, kópia, zmazanie
- **Pridať / upraviť auto** – všetky údaje, drag & drop fotky (automatické zmenšenie na WebP, poradie ťahaním), nákres poškodenia zhora (klikanie na časti auta), cena na SK, uzávierka objednávok, koniec aukcie, SEO titulok a popis s náhľadom Google, živý výpočet ceny
- **Dopyty** – všetci záujemcovia, filter podľa auta a stavu, poznámky, export CSV
- **Kalkulačka** – všetky sadzby (kurz, poplatky, doprava, clo, DPH, záloha, kredit RACEM)
- **Účet** – zmena hesla

## SEO
- Každé auto má vlastnú URL `/auta/{slug}` generovanú na serveri, s meta tagmi, Open Graph a štruktúrovanými dátami `Car` + `Offer`
- `AutoDealer`, `WebSite`, `BreadcrumbList`, `FAQPage`, `ItemList` JSON-LD
- `sitemap.xml` (vrátane fotiek áut) a `robots.txt` generované automaticky, admin je `noindex`
- Obsahové stránky na kľúčové slová: kalkulačka dovozu, ako to funguje, časté otázky

## Lokálny vývoj
```bash
npm install
npm run dev
```
Premenné sú v `.env.local` (Supabase URL + publishable key – verejné, chránené RLS).

## Databáza (Supabase)
- `cars` – autá (verejne čitateľné len `published` a `sold`)
- `leads` – dopyty (vkladať môže ktokoľvek, čítať len admin; po uzávierke objednávok databáza dopyt na dané auto odmietne)
- `settings` – nastavenia kalkulačky
- `admins` – zoznam administrátorov
- storage bucket `car-images`
