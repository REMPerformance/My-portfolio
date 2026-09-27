import Link from "next/link";
import { CREDIT_TIERS, FAQ, STEPS } from "@/lib/content";
import { SITE } from "@/lib/site";
import { ICar, IExt, IGift, IList, IShield, IWrench } from "./Icons";

export function Feats() {
  const items = [
    { i: <IList />, t: "Cena do eura vopred", d: "Aukcia, doprava, clo, DPH aj homologizácia." },
    { i: <IShield />, t: "Neprekročíme limit", d: "Prihadzujeme len do sumy, ktorú nastavíte." },
    { i: <ICar />, t: "Na kľúč s EČV", d: "Preclenie, STK aj prihlásenie vybavíme." },
    { i: <IGift />, t: "Kredit do RACEM", d: "Až 700 € na aero, disky a podvozok." }
  ];
  return (
    <div className="feats">
      {items.map((x) => (
        <div className="feat" key={x.t}>
          <div className="ic">{x.i}</div>
          <div><h3>{x.t}</h3><p>{x.d}</p></div>
        </div>
      ))}
    </div>
  );
}

export function Steps() {
  return (
    <ol className="steps">
      {STEPS.map((s) => (
        <li className="step" key={s.t}>
          <h3>{s.t}</h3>
          <p>{s.d}</p>
          <span className="tag"><span>{s.tag}</span></span>
        </li>
      ))}
    </ol>
  );
}

export function Bonus() {
  return (
    <section className="bonus" id="bonus" aria-labelledby="bonus-h">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="bonus__logo" src={SITE.logo} alt="" aria-hidden="true" loading="lazy" />
      <div className="wrap">
        <div>
          <span className="eyebrow">Bonus k autu · Performance is our DNA</span>
          <h2 className="title" id="bonus-h">Dovezieme Vám auto.<br />K nemu dostanete <em>kredit na tuning.</em></h2>
          <p className="sub">Ku každému autu dovezenému cez REM Performance dostanete kredit do e-shopu RACEM.sk na certifikované aero, widebody kity, disky, podvozok a ďalšie.</p>
          <ul className="checks">
            <li>Kredit dostanete ako unikátny kód pri odovzdaní auta</li>
            <li>Platí na celý sortiment RACEM</li>
            <li>Platnosť 12 mesiacov od odovzdania</li>
          </ul>
          <a href={SITE.racemUrl} target="_blank" rel="noopener" className="rc-btn rc-btn--ghost">Pozrieť RACEM.sk <IExt /></a>
        </div>
        <div className="tiers">
          {CREDIT_TIERS.map((t, i) => (
            <div className={`tier${i === CREDIT_TIERS.length - 1 ? " top" : ""}`} key={t.label}><span>{t.label}</span><b>{t.v} €</b></div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Why() {
  return (
    <>
      <div className="why">
        <div className="panel">
          <div className="ic"><IList /></div>
          <h3>Cena rozpísaná do eura</h3>
          <p>Pri každom aute vidíte všetky položky: aukciu, poplatky, dopravu, clo, DPH, homologizáciu aj našu odmenu. Náš poplatok je fixný, nie percentá z ceny auta.</p>
        </div>
        <div className="panel">
          <div className="ic"><IShield /></div>
          <h3>Zmluva a doklady</h3>
          <p>Na základe zmluvy o sprostredkovaní Vás zastupujeme na aukcii. Nad Váš limit neprihodíme a každú platbu máte zdokladovanú faktúrou.</p>
        </div>
        <div className="panel">
          <div className="ic"><IWrench /></div>
          <h3>Tuning v jednej ruke</h3>
          <p>Za nami stojí RACEM, slovenský e-shop s certifikovanými performance dielmi. Auto Vám pomôžeme dotiahnuť od opravy až po finálny vzhľad.</p>
        </div>
      </div>
      <div className="risk">
        <b>Úprimne o riziku</b>
        <p>Väčšina áut na Coparte a IAAI sú poškodené autá (salvage). Kupujú sa tak, ako stoja a ležia, podľa fotiek a popisu aukcie, bez testovacej jazdy. Skryté poškodenia sa môžu ukázať až pri oprave. Preto ku každému autu uvádzame vlastný odhad opravy a odporúčame rezervu 10 až 15 %.</p>
      </div>
    </>
  );
}

export function Faq({ items = FAQ }: { items?: { q: string; a: string }[] }) {
  return (
    <div className="faq">
      {items.map((f) => (
        <details key={f.q}>
          <summary>{f.q}</summary>
          <div><p>{f.a}</p></div>
        </details>
      ))}
    </div>
  );
}

export function faqLd(items = FAQ) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } }))
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: SITE.url + it.path }))
  };
}

export function Crumbs({ items }: { items: { name: string; path: string }[] }) {
  return (
    <nav aria-label="Omrvinková navigácia">
      <ol className="crumbs">
        {items.map((it, i) => (
          <li key={it.path}>{i < items.length - 1 ? <Link href={it.path}>{it.name}</Link> : <span aria-current="page">{it.name}</span>}</li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHead({ crumbs, title, sub }: { crumbs: { name: string; path: string }[]; title: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="phead">
      <div className="wrap">
        <Crumbs items={crumbs} />
        <h1>{title}</h1>
        {sub && <p className="sub">{sub}</p>}
      </div>
    </div>
  );
}
