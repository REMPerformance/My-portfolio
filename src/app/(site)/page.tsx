import { carPhase } from "@/lib/format";
import Link from "next/link";
import type { Metadata } from "next";
import { getCardCars, getContent } from "@/lib/data";
import { calc } from "@/lib/calc";
import { eur } from "@/lib/format";
import { SITE } from "@/lib/site";
import { CarGrid } from "@/components/CarGrid";
import { Bonus, Faq, Feats, Steps, Why, faqLd } from "@/components/Sections";
import { IArrow } from "@/components/Icons";
import { JsonLd } from "@/components/JsonLd";
import { LeadForm } from "@/components/LeadForm";

export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: "Dovoz áut z USA na kľúč – Copart a IAAI | REM Performance" },
  description: SITE.description,
  alternates: { canonical: "/" }
};

export default async function Home() {
  const [{ cfg, cars }, ct] = await Promise.all([getCardCars(), getContent()]);
  const serverNow = Date.now();
  const ex = calc(cfg, { bidUsd: ct.quick.bidUsd, type: "car", region: "central", repairEur: ct.quick.repairEur });
  const liveCount = cars.filter((c) => c.status === "published" && carPhase(c, serverNow) !== "ended").length;

  return (
    <>
      <JsonLd data={faqLd(ct.faq.slice(0, 6))} />
      <section className="hero" aria-labelledby="hero-h">
        <div className="hero__img" style={{ backgroundImage: `url('${SITE.heroImage}')` }} />
        <div className="hero__scrim" />
        <div className="hero__grid" />
        <div className="wrap">
          <div>
            <span className="live"><i />{liveCount ? `${liveCount} ${liveCount === 1 ? "auto" : liveCount < 5 ? "autá" : "áut"} práve v ponuke` : "Nové autá pridávame každý týždeň"}</span>
            <h1 id="hero-h">{ct.hero.title1}<br /><em>{ct.hero.title2}</em><br />{ct.hero.title3}</h1>
            <p className="lead">{ct.hero.lead}</p>
            <div className="actions">
              <Link href="/ponuka" className="rc-btn rc-btn--primary">Pozrieť ponuku áut <IArrow /></Link>
              <Link href="/kalkulacka-dovozu" className="rc-btn rc-btn--ghost">Spočítať dovoz</Link>
            </div>
            <div className="pills">
              {ct.hero.pills.map((p) => <span key={p.b + p.t}><b>{p.b}</b> {p.t}</span>)}
            </div>
          </div>
          <aside className="quick reveal" aria-label="Príklad výpočtu">
            <span className="eyebrow">Príklad výpočtu</span>
            <h2>{ct.quick.title}</h2>
            <p className="s">Odhad pri vydražení za ${ct.quick.bidUsd.toLocaleString("en-US")} a oprave za {eur(ct.quick.repairEur)}</p>
            <div className="qrow"><span>Auto, poplatky, doprava do EÚ</span><span className="num">{eur(ex.cif)}</span></div>
            <div className="qrow"><span>Clo + DPH</span><span className="num">{eur(ex.duty + ex.vat)}</span></div>
            <div className="qrow"><span>Doprava do SR, homologizácia, služba</span><span className="num">{eur(ex.euPortEur + ex.truckEur + ex.homologEur + ex.serviceFeeEur)}</span></div>
            <div className="qrow"><span>Odhad opravy</span><span className="num">{eur(ex.repairEur)}</span></div>
            <div className="qtotal"><small>Spolu na SK značkách</small><b>{eur(ex.total)}</b></div>
            <div className="qsave"><span>Podobné auto na SK trhu</span><b>od {eur(ct.quick.skPrice)}</b></div>
          </aside>
        </div>
      </section>

      <Feats items={ct.feats} />

      <section aria-labelledby="ponuka-h">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="eyebrow">Aktuálne aukcie</span>
              <h2 className="title" id="ponuka-h">Autá z USA <em>v ponuke</em></h2>
              <p className="sub">Ručne vybrané autá z aukcií Copart a IAAI. Pri každom vidíte odhad celkovej ceny na slovenských značkách a termín, dokedy ho môžete objednať.</p>
            </div>
            <Link href="/ponuka" className="rc-btn rc-btn--ghost">Celá ponuka <IArrow /></Link>
          </div>
          <CarGrid cars={cars} serverNow={serverNow} showFilters={false} showEnded={false} limit={6} />
          <p className="more">Nevidíte svoje auto? <Link href="/kontakt">Napíšte nám, čo hľadáte</Link> a nájdeme ho na aukcii za Vás.</p>
        </div>
      </section>

      <section className="alt" aria-labelledby="proces-h">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="eyebrow">Proces</span>
              <h2 className="title" id="proces-h">Ako funguje <em>dovoz auta</em></h2>
              <p className="sub">Vy si vyberiete auto a nastavíte maximálnu sumu. Zvyšok vybavíme my a o každom kroku budete informovaný.</p>
            </div>
            <Link href="/ako-to-funguje" className="rc-btn rc-btn--ghost">Celý postup <IArrow /></Link>
          </div>
          <Steps items={ct.steps} />
        </div>
      </section>

      <Bonus b={ct.bonus} />

      <section aria-labelledby="why-h">
        <div className="wrap">
          <div className="sec-head"><div><span className="eyebrow">Prečo cez nás</span><h2 className="title" id="why-h">Férovo a <em>otvorene</em></h2></div></div>
          <Why items={ct.why} risk={ct.risk} />
        </div>
      </section>

      <section className="alt" aria-labelledby="faq-h">
        <div className="wrap">
          <div className="sec-head">
            <div><span className="eyebrow">FAQ</span><h2 className="title" id="faq-h">Časté <em>otázky</em></h2></div>
            <Link href="/caste-otazky" className="rc-btn rc-btn--ghost">Všetky otázky <IArrow /></Link>
          </div>
          <Faq items={ct.faq.slice(0, 6)} />
        </div>
      </section>

      <section aria-labelledby="dopyt-h">
        <div className="wrap contact">
          <div>
            <span className="eyebrow">Auto na objednávku</span>
            <h2 className="title" id="dopyt-h">Hľadáte <em>konkrétne auto?</em></h2>
            <p className="sub">Napíšte nám značku, model a rozpočet, alebo pošlite odkaz na auto z Copartu či IAAI. Do 24 hodín Vám pošleme odhad celkovej ceny a naše odporúčanie.</p>
            <p className="human">{ct.contact.human}</p>
          </div>
          <LeadForm />
        </div>
      </section>
    </>
  );
}
