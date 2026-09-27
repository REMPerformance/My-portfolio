# REM Performance – autá z amerických aukcií

Statický web pre **remperformance.sk** (GitHub Pages). Sprostredkovanie dovozu áut z Copartu a IAAI na Slovensko + bonus kredit do RACEM.sk.

## Štruktúra
| Súbor | Čo to je |
|---|---|
| `index.html` | celý web (dizajn, kalkulačka, ponuka, formulár) |
| `data/cars.js` | **ponuka áut – tu pridávaš autá** |
| `lp-webdesign/` | pôvodný web LP Webdesign (dostupný na `/lp-webdesign/`) |
| `CNAME` | doména remperformance.sk |

## Ako pridať auto
1. Otvor `data/cars.js`, skopíruj jeden blok `{ ... }` a vyplň údaje (popis polí je hore v súbore).
2. `end` zadaj v tvare `"2026-10-03T18:00:00+02:00"` (čas konca aukcie).
3. Fotky: do `images` daj URL fotiek (alebo ich nahraj do priečinka `img/` a daj `"img/mustang-1.jpg"`).
4. Commit + push. Po skončení aukcie sa auto samo presunie medzi „Skončené aukcie“.

**Pred spustením vymaž ukážkové autá (`demo: true`).**

## Kalkulačka – kde meniť čísla
V `index.html` je na začiatku skriptu objekt `CONFIG`: kurz, aukčné poplatky, doprava podľa regiónu, clo, DPH, prístav, kamión, homologácia, tvoj poplatok (`serviceFeeEur`) a úrovne kreditu RACEM. Všetky čísla sú **odhady** – nahraď ich cenami od svojho brokera a špeditéra.

## Formulár
Dopyty idú cez Formspree (`CONFIG.formEndpoint`). Teraz je tam ten istý formulár ako na LP Webdesign – odporúčam si vytvoriť nový, aby sa dopyty nemiešali.
