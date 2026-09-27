/* ═══════════════════════════════════════════════════════════════
   PONUKA ÁUT — tu pridávaš / upravuješ autá
   ───────────────────────────────────────────────────────────────
   Každé auto = jeden objekt v poli nižšie. Po uložení a pushnutí
   na GitHub sa web sám aktualizuje. Keď prejde čas `end`, auto sa
   automaticky presunie do sekcie „Skončené aukcie“ a nedá sa
   rezervovať.

   POLIA:
   id              unikátny text bez medzier (napr. "bmw-m4-2021-lot123")
   type            "car" | "suv" | "truck" | "moto"   (určuje clo)
   year, make, model, trim
   odometer_mi     najazdené míle (web ich prepočíta aj na km)
   engine, drive, fuel, color
   title_type      "Salvage" | "Clean" | "Rebuilt" ...
   damage          hlavné poškodenie (po slovensky)
   location        kde auto stojí v USA (napr. "Houston, TX")
   auction         "Copart" | "IAAI"
   lot             číslo lotu
   url             odkaz na aukciu (voliteľné)
   images          pole URL fotiek (prvá = titulná). Prázdne = placeholder
   current_bid_usd aktuálna ponuka na aukcii
   est_bid_usd     TVOJ odhad, za koľko sa auto vydraží (z toho sa
                   počíta odhad celkovej ceny)
   repair_eur      tvoj odhad opravy v EUR (0 ak nejazdí sa nič nerieši)
   sk_price_eur    za koľko sa podobné auto predáva na SK (porovnanie)
   end             koniec aukcie, ISO formát: "2026-10-03T18:00:00+02:00"
   note            tvoj komentár k autu (voliteľné)
   demo            true = ukážkové auto, zobrazí štítok „Ukážka“ a čas
                   konca sa počíta z `end_in_hours`. PRED SPUSTENÍM
                   ukážkové autá vymaž a daj reálne.
═══════════════════════════════════════════════════════════════ */

window.CARS = [
  {
    id: "demo-ford-mustang-gt",
    demo: true, end_in_hours: 30,
    type: "car",
    year: 2020, make: "Ford", model: "Mustang", trim: "GT 5.0 Premium",
    odometer_mi: 38400, engine: "5.0 V8", drive: "RWD", fuel: "Benzín", color: "Čierna",
    title_type: "Salvage", damage: "Predok – nárazník, kapota, svetlo",
    location: "Dallas, TX", auction: "Copart", lot: "UKÁŽKA", url: "",
    images: [],
    current_bid_usd: 7400, est_bid_usd: 11500, repair_eur: 2800, sk_price_eur: 36900,
    note: "Airbagy nevystrelené, motor štartuje. Typický kus, ktorý sa oplatí."
  },
  {
    id: "demo-bmw-m340i",
    demo: true, end_in_hours: 52,
    type: "car",
    year: 2021, make: "BMW", model: "M340i", trim: "xDrive",
    odometer_mi: 29100, engine: "3.0 R6 turbo", drive: "AWD", fuel: "Benzín", color: "Biela",
    title_type: "Salvage", damage: "Bok – dvere vodiča, prah",
    location: "Atlanta, GA", auction: "Copart", lot: "UKÁŽKA", url: "",
    images: [],
    current_bid_usd: 9800, est_bid_usd: 15500, repair_eur: 3500, sk_price_eur: 47900,
    note: ""
  },
  {
    id: "demo-ram-1500-trx",
    demo: true, end_in_hours: 76,
    type: "truck",
    year: 2022, make: "RAM", model: "1500", trim: "TRX",
    odometer_mi: 21500, engine: "6.2 V8 kompresor", drive: "4x4", fuel: "Benzín", color: "Sivá",
    title_type: "Salvage", damage: "Zadok – korba, zadné svetlá",
    location: "Houston, TX", auction: "IAAI", lot: "UKÁŽKA", url: "",
    images: [],
    current_bid_usd: 24000, est_bid_usd: 36000, repair_eur: 4500, sk_price_eur: 99000,
    note: "Pozor: pickupy sa môžu cliť ako úžitkové (22 %). Overíme vopred."
  },
  {
    id: "demo-tesla-model-3",
    demo: true, end_in_hours: 18,
    type: "car",
    year: 2022, make: "Tesla", model: "Model 3", trim: "Long Range AWD",
    odometer_mi: 33800, engine: "Elektro", drive: "AWD", fuel: "Elektro", color: "Modrá",
    title_type: "Salvage", damage: "Predok – ľahký náraz",
    location: "Los Angeles, CA", auction: "Copart", lot: "UKÁŽKA", url: "",
    images: [],
    current_bid_usd: 8200, est_bid_usd: 12500, repair_eur: 3000, sk_price_eur: 31900,
    note: "Pri Tesle over Supercharging a prepis na EÚ softvér."
  },
  {
    id: "demo-porsche-macan",
    demo: true, end_in_hours: 100,
    type: "suv",
    year: 2019, make: "Porsche", model: "Macan", trim: "S",
    odometer_mi: 47200, engine: "3.0 V6 turbo", drive: "AWD", fuel: "Benzín", color: "Červená",
    title_type: "Salvage", damage: "Záplava – interiér (vyžaduje kontrolu elektroniky)",
    location: "Miami, FL", auction: "Copart", lot: "UKÁŽKA", url: "",
    images: [],
    current_bid_usd: 11200, est_bid_usd: 16000, repair_eur: 6000, sk_price_eur: 49900,
    note: "Zaplavené autá berieme len na výslovnú žiadosť – vyššie riziko."
  },
  {
    id: "demo-harley-street-glide",
    demo: true, end_in_hours: -5,
    type: "moto",
    year: 2021, make: "Harley-Davidson", model: "Street Glide", trim: "Special",
    odometer_mi: 8900, engine: "1868 cm³ V2", drive: "—", fuel: "Benzín", color: "Čierna",
    title_type: "Clean", damage: "Škrabance – kapotáž",
    location: "Phoenix, AZ", auction: "IAAI", lot: "UKÁŽKA", url: "",
    images: [],
    current_bid_usd: 13100, est_bid_usd: 13100, repair_eur: 400, sk_price_eur: 32900,
    note: ""
  }
];
