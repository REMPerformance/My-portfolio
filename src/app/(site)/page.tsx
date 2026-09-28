import Link from "next/link";
import type { Metadata } from "next";
import { getCardCars, getContent } from "@/lib/data";
import { carPhase, eur } from "@/lib/format";
import { SITE } from "@/lib/site";
import { COUNTRIES } from "@/lib/origins";
import { CarGrid } from "@/components/CarGrid";
import { Steps } from "@/components/Sections";
import { IArrow } from "@/components/Icons";

export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: "Dovoz áut z USA, Dubaja a Kanady na kľúč | REM Performance" },
  description: SITE.description,
  alternates: { canonical: "/" }
};

export default async function Home() {
  const [{ cfg, cars }, ct] = await Promise.all([getCardCars(), getContent()]);
  const serverNow = Date.now();
  const live = cars.filter((c) => c.status === "published" && carPhase(c, serverNow) !== "ended");
  const countryCount = (code: string) => live.filter((c) => (c.country || "US") === code).length;

  return (
    <>
      <section className="hero" aria-labelledby="hero-h">
        <div className="hero__img" style={{ backgroundImage: `url('${SITE.heroImage}')` }} />
        <div className="hero__scrim" />
        <div className="wrap">
          <div className="hero__in">
            <span className="live"><i />{live.length ? `${live.length} ${live.length === 1 ? "auto" : live.length < 5 ? "autá" : "áut"} práve v ponuke` : "Nové autá pridávame každý týždeň"}</span>
            <h1 id="hero-h">{ct.hero.title1} <em>{ct.hero.title2}</em> {ct.hero.title3}</h1>
            <p className="lead">{ct.hero.lead}</p>
            <div className="actions">
              <Link href="/ponuka" className="rc-btn rc-btn--primary">Pozrieť ponuku áut <IArrow /></Link>
              <Link href="/kalkulacka-dovozu" className="rc-btn rc-btn--ghost">Spočítať cenu dovozu</Link>
            </div>
            <div className="hero-stats">
              {ct.hero.pills.map((p) => <div key={p.b + p.t}><b>{p.b}</b><small>{p.t}</small></div>)}
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="ponuka-h">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="eyebrow">Aktuálna ponuka</span>
              <h2 className="title" id="ponuka-h">Vybrané autá</h2>
              <p className="sub">Cena pri každom aute je celková suma na slovenských značkách – vrátane dopravy, cla, DPH a homologizácie.</p>
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
          <div className="origins">
            {COUNTRIES.map((c) => {
              const n = countryCount(c.code);
              return (
                <Link key={c.code} className="origin" href={`/ponuka?country=${c.code}`}>
                  <span className="fl" aria-hidden="true">{c.flag}</span>
                  <b>{c.name}</b>
                  <small>{n ? `${n} ${n === 1 ? "auto" : n < 5 ? "autá" : "áut"} v ponuke` : "Na objednávku"}</small>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section aria-labelledby="proces-h">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="eyebrow">Postup</span>
              <h2 className="title" id="proces-h">Ako prebieha dovoz</h2>
            </div>
            <Link href="/ako-to-funguje" className="rc-btn rc-btn--ghost">Podrobnosti <IArrow /></Link>
          </div>
          <Steps items={ct.steps} />
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="cta-band">
            <div>
              <h2>Hľadáte konkrétne auto?</h2>
              <p>Napíšte nám značku, model a rozpočet. Do 24 hodín Vám pošleme celkovú cenu. Náš poplatok je fixný – {eur(cfg.serviceFeeEur)}.</p>
            </div>
            <Link href="/kontakt" className="rc-btn rc-btn--light">Poslať nezáväzný dopyt <IArrow /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
