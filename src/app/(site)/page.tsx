import Link from "next/link";
import type { Metadata } from "next";
import { getCardCars, getContent } from "@/lib/data";
import { carPhase } from "@/lib/format";
import { SITE } from "@/lib/site";
import { COUNTRIES } from "@/lib/origins";
import { CarGrid } from "@/components/CarGrid";
import { Steps } from "@/components/Sections";
import { IArrow, SpecIcon, TypeArt } from "@/components/Icons";

export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: "Dovoz áut z USA, Dubaja a Kanady na kľúč | REM Performance" },
  description: SITE.description,
  alternates: { canonical: "/" }
};

const TYPES = [
  { t: "car" as const, l: "Osobné autá" },
  { t: "suv" as const, l: "SUV" },
  { t: "truck" as const, l: "Pickupy" },
  { t: "moto" as const, l: "Motorky" }
];

export default async function Home() {
  const [{ cars }, ct] = await Promise.all([getCardCars(), getContent()]);
  const serverNow = Date.now();
  const live = cars.filter((c) => c.status === "published" && carPhase(c, serverNow) !== "ended");
  const nType = (t: string) => live.filter((c) => c.type === t).length;
  const nCountry = (code: string) => live.filter((c) => (c.country || "US") === code).length;
  const cnt = (n: number) => (n ? `${n} ${n === 1 ? "auto" : n < 5 ? "autá" : "áut"}` : "Na objednávku");

  return (
    <>
      <section className="hero" aria-labelledby="hero-h">
        <div className="hero__img" style={{ backgroundImage: `url('${SITE.heroImage}')` }} />
        <div className="hero__scrim" />
        <div className="wrap">
          <div className="hero__in">
            <span className="live"><i />{live.length ? `${cnt(live.length)} práve v ponuke` : "Nové autá pridávame každý týždeň"}</span>
            <h1 id="hero-h">{ct.hero.title1} <em>{ct.hero.title2}</em> {ct.hero.title3}</h1>
            <p className="lead">{ct.hero.lead}</p>
            <div className="actions">
              <Link href="/ponuka" className="rc-btn rc-btn--primary">Pozrieť autá v ponuke <IArrow /></Link>
              <Link href="/kalkulacka-dovozu" className="rc-btn rc-btn--light">Spočítať cenu dovozu</Link>
            </div>
          </div>
        </div>
      </section>

      <div className="perks">
        <div className="wrap">
          <div className="perk"><span className="ico"><SpecIcon k="ship" /></span><div><b>Dovoz až k Vám</b><small>Kúpa, doprava, clo aj prihlásenie</small></div></div>
          <div className="perk"><span className="ico"><SpecIcon k="tag" /></span><div><b>Konečná cena vopred</b><small>Bez skrytých položiek na konci</small></div></div>
          <div className="perk"><span className="ico"><SpecIcon k="shield" /></span><div><b>Preverené autá</b><small>História, fotky a stav pred kúpou</small></div></div>
          <div className="perk"><span className="ico"><SpecIcon k="gift" /></span><div><b>Kredit na tuning</b><small>Až 700 € do RACEM.sk</small></div></div>
        </div>
      </div>

      <section aria-labelledby="typy-h" style={{ paddingBottom: 0 }}>
        <div className="wrap">
          <div className="sec-head"><div><span className="eyebrow">Čo hľadáte?</span><h2 className="title" id="typy-h">Vyberte si typ auta</h2></div></div>
          <div className="types">
            {TYPES.map((x) => (
              <Link key={x.t} href={`/ponuka?type=${x.t}`} className="type"><TypeArt t={x.t} />{x.l}<small>{cnt(nType(x.t))}</small></Link>
            ))}
            <div className="cta-tile">
              <b>Hľadáte konkrétne auto?</b>
              <span>Nájdeme ho za Vás a dovezieme až pred dom.</span>
              <Link href="/kontakt" className="rc-btn rc-btn--primary rc-btn--sm" style={{ alignSelf: "flex-start" }}>Napíšte nám <IArrow /></Link>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="ponuka-h">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <h2 className="title" id="ponuka-h">Autá v ponuke {live.length ? <span className="cnt-n">({live.length})</span> : null}</h2>
              <p className="sub">Cena pri každom aute je konečná suma na slovenských značkách – vrátane dopravy, cla, DPH a homologizácie.</p>
            </div>
            <Link href="/ponuka" className="rc-btn rc-btn--ghost">Celá ponuka <IArrow /></Link>
          </div>
          <div className="home-cars"><CarGrid cars={cars} serverNow={serverNow} showFilters={false} showEnded={false} limit={6} /></div>
        </div>
      </section>

      <section className="alt" aria-labelledby="odkial-h">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="eyebrow">Odkiaľ dovážame</span>
              <h2 className="title" id="odkial-h">Autá tam, kde sú najvýhodnejšie</h2>
              <p className="sub">Dopravu počítame podľa konkrétneho štátu či emirátu a najbližšieho prístavu.</p>
            </div>
          </div>
          <div className="origins types">
            {COUNTRIES.map((c) => (
              <Link key={c.code} className="type" href={`/ponuka?country=${c.code}`}>
                <span className="fl" aria-hidden="true">{c.flag}</span>{c.name}<small>{cnt(nCountry(c.code))}</small>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="proces-h">
        <div className="wrap">
          <div className="sec-head">
            <div><span className="eyebrow">Postup</span><h2 className="title" id="proces-h">Ako prebieha dovoz</h2></div>
            <Link href="/ako-to-funguje" className="rc-btn rc-btn--ghost">Podrobnosti <IArrow /></Link>
          </div>
          <Steps items={ct.steps} />
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="cta-band">
            <div>
              <h2>Nenašli ste svoje auto?</h2>
              <p>Napíšte nám značku, model a rozpočet – do 24 hodín Vám pošleme ponuku. Alebo rovno na WhatsApp {SITE.phone}.</p>
            </div>
            <div className="actions" style={{ marginTop: 0 }}>
              <Link href="/kontakt" className="rc-btn rc-btn--light">Poslať dopyt <IArrow /></Link>
              <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noopener" className="rc-btn rc-btn--wa">WhatsApp</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
