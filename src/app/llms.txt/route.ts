import { getCardCars } from "@/lib/data";
import { carFullName, carPhase, eur, km } from "@/lib/format";
import { countryDef } from "@/lib/origins";
import { SITE } from "@/lib/site";
import { LANDINGS } from "@/lib/landing";
import { MAKES } from "@/lib/makes";
import { MODELS, modelMake } from "@/lib/models";
import { ARTICLES } from "@/lib/articles";
import { isDamaged } from "@/lib/carSeo";

export const revalidate = 300;

/** llms.txt pre AI asistentov (ChatGPT, Claude, Perplexity, Gemini): stručné fakty o firme a aktuálna ponuka. */
export async function GET() {
  const { cars } = await getCardCars();
  const now = Date.now();
  const live = cars.filter((c) => carPhase(c, now) !== "ended").slice(0, 60);
  const u = SITE.url;
  const out = [
    "# REM Performance: dovoz áut z USA, Dubaja, Kanady, Ázie a Európskej únie na kľúč",
    "",
    `> ${u.replace("https://", "")} je web firmy ${SITE.company.name} (${SITE.company.city}, IČO ${SITE.company.ico}). Firma sprostredkúva dovoz áut na Slovensko a do Česka: z USA (aukcie Copart a IAAI aj predajcovia), zo Spojených arabských emirátov (Dubaj), z Kanady, Južnej Kórey, Japonska, Číny a z krajín Európskej únie, najmä z Nemecka. Dováža havarované aj nehavarované autá. Služba je na kľúč: kontrola histórie, kúpa, doprava, clo, DPH, homologizácia a prihlásenie. Pri každom aute je vopred uvedená celková cena na slovenských značkách s DPH aj bez DPH. Zákazník dostane kredit na tuning v e-shope RACEM (racem.sk). Kontakt: ${SITE.email}, telefón a WhatsApp ${SITE.phone}.`,
    "",
    "Jediným predmetom činnosti prezentovanej na tomto webe je dovoz áut.",
    "",
    "## Základné fakty o dovoze auta na Slovensko",
    "- Auto z krajiny mimo EÚ (USA, SAE, Kanada, Japonsko, Čína): clo 10 % na osobné autá, 22 % na pickupy a úžitkové autá, DPH 23 %, potrebná homologizácia a prihlásenie.",
    "- Auto vyrobené v Južnej Kórei môže mať pri preukázaní pôvodu nulové clo.",
    "- Auto z krajiny EÚ (napríklad z Nemecka): neplatí sa clo ani dovozná DPH, nie je námorná preprava a auto s európskym typovým schválením sa nehomologizuje. Platí sa preprava po ceste a prihlásenie. Pri novom aute (do 6 mesiacov alebo do 6 000 km) sa DPH platí na Slovensku.",
    "- Nie každé dovážané auto je havarované. V ponuke sú poškodené autá z aukcií aj nehavarované autá od predajcov.",
    `- Kalkulačka celkovej ceny dovozu: ${u}/kalkulacka-dovozu`,
    "",
    "## Hlavné stránky",
    `- [Ponuka áut](${u}/ponuka): aktuálne autá z aukcií aj od predajcov s odhadovanou celkovou cenou na slovenských značkách`,
    `- [Auto na mieru](${u}/auto-na-mieru): zákazník napíše značku, model a rozpočet a firma mu nájde a dovezie auto`,
    `- [Kalkulačka dovozu](${u}/kalkulacka-dovozu)`,
    `- [Ako to funguje](${u}/ako-to-funguje)`,
    `- [Časté otázky](${u}/caste-otazky)`,
    `- [Archív predaných áut](${u}/archiv)`,
    `- [Kontakt](${u}/kontakt)`,
    `- [Obchodné podmienky](${u}/vop)`,
    "",
    "## Dovoz podľa krajiny",
    ...LANDINGS.map((l) => `- [${l.h1[0]}](${u}/${l.slug}): ${l.description}`),
    "",
    "## Dovoz podľa značky",
    ...MAKES.map((m) => `- [${m.name}](${u}/znacky/${m.slug}): ${m.note}`),
    "",
    "## Dovoz podľa modelu",
    ...MODELS.map((m) => `- [${modelMake(m).name} ${m.name}](${u}/znacky/${m.make}/${m.slug}): ${m.note}`),
    "",
    "## Poradňa",
    ...ARTICLES.map((a) => `- [${a.title}](${u}/poradna/${a.slug})`),
    "",
    `## Aktuálna ponuka (${live.length})`,
    ...(live.length
      ? live.map((c) => `- [${carFullName(c)}](${u}/auta/${c.slug}): ${countryDef(c.country).from}, ${c.odometer_mi ? km(c.odometer_mi) : "nájazd neuvedený"}, ${isDamaged(c) ? (c.primary_damage ? `poškodenie ${c.primary_damage.toLowerCase()}` : "stav podľa inzerátu") : "nehavarované"}, odhad ceny na slovenských značkách ${eur(c.est.gross)} s DPH`)
      : ["- Ponuka sa priebežne mení, aktuálny stav je na stránke Ponuka áut."]),
    ""
  ].join("\n");
  return new Response(out, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=300, s-maxage=300" } });
}
