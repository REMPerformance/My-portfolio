# Instagram carousely (REM Performance, RACEM SK, RACEM USA)

- `gen_rem.py`: carousel auta pre @rem_performance, 7 obrázkov 1080 × 1350. Obsah je v zozname `slides` (texty, čísla fotiek `src/c63-NN.jpg`, cena). Pre nové auto skopíruj skript, zmeň texty a názvy fotiek.
- `gen_racem.py`: carousely pre racem.sk (tykanie, EUR) a racem.usa (angličtina, USD), 5 obrázkov. Volania `build('sk', ...)` a `build('us', ...)`.
- `render.py [prefix]`: vykreslí `prefix*-sN.html` z aktuálneho priečinka do `out/*.jpg`.

Postup: `npm i` v tomto priečinku (font Manrope), potom v pracovnom priečinku s podpriečinkom `src/` (fotky) spusti generátor a `python3 /cesta/render.py rem`.
Fotky áut sú v Supabase úložisku, ktoré z cloudu nie je dostupné; sťahujú sa cez Lukášov počítač. Produktové fotky: `https://racem.sk/cdn/shop/files/<súbor>?width=1600`, `https://racemusa.com/cdn/shop/files/<súbor>?width=1600`.

Pravidlá obsahu: cena vždy ako odhad, žiadne „s DPH/bez DPH“, na REM poslednom slide „+ kredit do racem.sk“ bez sumy a nikdy cena bez homologizácie, na fotkách žiadny názov aukcie, vo vetách žiadne pomlčky, RACEM USA bez značky LION'S KIT.
