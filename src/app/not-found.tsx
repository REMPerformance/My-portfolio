import Link from "next/link";
import { SiteShell } from "@/components/Site";

export const metadata = { title: "Stránka sa nenašla", robots: { index: false } };

export default function NotFound() {
  return (
    <SiteShell>
      <section>
        <div className="wrap" style={{ textAlign: "center", padding: "60px 0" }}>
          <span className="eyebrow">Chyba 404</span>
          <h1 className="title">Táto stránka <em>neexistuje</em></h1>
          <p className="sub" style={{ margin: "0 auto" }}>Auto mohlo byť stiahnuté z ponuky. Pozrite si aktuálne autá v aukcii.</p>
          <div className="actions" style={{ justifyContent: "center" }}>
            <Link href="/ponuka" className="rc-btn rc-btn--primary">Ponuka áut</Link>
            <Link href="/" className="rc-btn rc-btn--ghost">Domov</Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
