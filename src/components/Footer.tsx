import Link from "next/link";
import { SITE } from "@/lib/site";
import { Brand } from "./Header";

export function Footer({ phone }: { phone?: string }) {
  const c = SITE.company;
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot__top">
          <div>
            <Brand />
            <p>Sprostredkovanie dovozu áut z USA, SAE, Kanady, Kórey a Japonska na Slovensko na kľúč. K autu kredit na tuning v RACEM.sk.</p>
          </div>
          <nav aria-label="Ponuka">
            <h2>Ponuka</h2>
            <ul>
              <li><Link href="/ponuka">Ponuka áut</Link></li>
              <li><Link href="/archiv">Archív áut</Link></li>
              <li><Link href="/kalkulacka-dovozu">Kalkulačka dovozu</Link></li>
              <li><Link href="/ako-to-funguje">Ako to funguje</Link></li>
              <li><Link href="/caste-otazky">Časté otázky</Link></li>
            </ul>
          </nav>
          <nav aria-label="Informácie">
            <h2>Informácie</h2>
            <ul>
              <li><Link href="/vop">Obchodné podmienky</Link></li>
              <li><Link href="/ochrana-osobnych-udajov">Ochrana osobných údajov</Link></li>
              <li><Link href="/kontakt">Kontakt</Link></li>
              <li><a href={SITE.racemUrl} target="_blank" rel="noopener">RACEM.sk – tuning</a></li>
            </ul>
          </nav>
          <div>
            <h2>Prevádzkovateľ</h2>
            <ul>
              <li>{c.name}</li>
              <li>{c.street}, {c.zip} {c.city}</li>
              <li>IČO: {c.ico} · IČ DPH: {c.icDph}</li>
              <li><a href={`mailto:${SITE.email}`}>{SITE.email}</a></li>
              {phone ? <li><a href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a></li> : null}
            </ul>
          </div>
        </div>
        <div className="foot__legal">
          <span>© {new Date().getFullYear()} REM Performance · RACEM. Všetky práva vyhradené.</span>
          <span style={{ maxWidth: 720 }}>Nie sme prevádzkovateľom aukcií ani predávajúcim vozidiel. Uvedené ceny sú orientačné odhady a nie sú návrhom na uzavretie zmluvy.</span>
        </div>
      </div>
    </footer>
  );
}
