import Link from "next/link";
import { DEFAULT_CONTENT, FAQ, type SiteContent } from "@/lib/content";
import { SITE } from "@/lib/site";
import { ICar, IExt, IGift, IList, IShield, IWrench } from "./Icons";

export function Feats({ items = DEFAULT_CONTENT.feats }: { items?: SiteContent["feats"] }) {
  const icons = [<IList key="a" />, <IShield key="b" />, <ICar key="c" />, <IGift key="d" />];
  return (
    <div className="feats">
      {items.slice(0, 4).map((x, i) => (
        <div className="feat" key={x.t + i}>
          <div className="ic">{icons[i % 4]}</div>
          <div><h3>{x.t}</h3><p>{x.d}</p></div>
        </div>
      ))}
    </div>
  );
}

export function Steps({ items = DEFAULT_CONTENT.steps }: { items?: SiteContent["steps"] }) {
  return (
    <ol className="steps">
      {items.map((s) => (
        <li className="step" key={s.t}>
          <h3>{s.t}</h3>
          <p>{s.d}</p>
          <span className="tag"><span>{s.tag}</span></span>
        </li>
      ))}
    </ol>
  );
}

export function Bonus({ b = DEFAULT_CONTENT.bonus }: { b?: SiteContent["bonus"] }) {
  return (
    <section className="alt" id="bonus" aria-labelledby="bonus-h">
      <div className="wrap split">
        <div>
          <span className="eyebrow">Bonus k autu</span>
          <h2 className="title" id="bonus-h">{b.title}</h2>
          <p className="sub">{b.text}</p>
          <ul className="checks">{b.points.map((p) => <li key={p}>{p}</li>)}</ul>
          <a href={SITE.racemUrl} target="_blank" rel="noopener" className="rc-btn rc-btn--ghost">RACEM.sk <IExt /></a>
        </div>
        <div className="tiers">
          {b.tiers.map((t, i) => (
            <div className={`tier${i === b.tiers.length - 1 ? " top" : ""}`} key={t.label + i}><span>{t.label}</span><b>{t.v} €</b></div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Why({ items = DEFAULT_CONTENT.why, risk = DEFAULT_CONTENT.risk }: { items?: SiteContent["why"]; risk?: string }) {
  const icons = [<IList key="a" />, <IShield key="b" />, <IWrench key="c" />];
  return (
    <>
      <div className="why">
        {items.map((w, i) => (
          <div className="panel" key={w.t + i}>
            <div className="ic">{icons[i % 3]}</div>
            <h3>{w.t}</h3>
            <p>{w.d}</p>
          </div>
        ))}
      </div>
      {risk && (
        <div className="risk">
          <b>Úprimne o riziku</b>
          <p>{risk}</p>
        </div>
      )}
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
