import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getCardCars } from "@/lib/data";
import { carPhase } from "@/lib/format";
import { CarBrowser } from "@/components/CarBrowser";
import { PageHead, breadcrumbLd } from "@/components/Sections";
import { JsonLd } from "@/components/JsonLd";
import { IArrow } from "@/components/Icons";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Skončené aukcie a predané autá z dovozu",
  description: "Autá, ktoré sme mali v ponuke: skončené aukcie, predané autá a ponuky, ktorým vypršala platnosť. Podobné auto Vám radi nájdeme znova.",
  alternates: { canonical: "/skoncene-aukcie" },
  openGraph: { url: "/skoncene-aukcie", title: "Skončené aukcie a predané autá | REM Performance" }
};

export default async function SkonceneAukcie() {
  const { cars } = await getCardCars();
  const serverNow = Date.now();
  const ended = cars.filter((c) => carPhase(c, serverNow) === "ended");
  const soldN = ended.filter((c) => c.status === "sold").length;
  const crumbs = [{ name: "Domov", path: "/" }, { name: "Ponuka áut", path: "/ponuka" }, { name: "Skončené aukcie", path: "/skoncene-aukcie" }];
  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      <PageHead
        crumbs={crumbs}
        title={<>Skončené aukcie <span style={{ color: "var(--rc-text-dim)", fontSize: ".6em" }}>({ended.length})</span></>}
        sub={<>{soldN > 0 && <b className="sold-count">{soldN === 1 ? "1 auto sme už predali a doviezli klientovi." : `${soldN} ${soldN < 5 ? "autá" : "áut"} sme už predali a doviezli klientom.`} </b>}Autá, ktoré sme mali v ponuke a ich predaj už skončil. Páči sa Vám niektoré? Podobné Vám nájdeme znova, stačí napísať značku, model a rozpočet.</>}
      />
      <section style={{ paddingTop: 28 }}>
        <div className="wrap">
          <div className="arch-note">
            <Link href="/ponuka" className="rc-btn rc-btn--dark rc-btn--sm">Aktuálna ponuka <IArrow /></Link>
            <Link href="/auto-na-mieru" className="rc-btn rc-btn--ghost rc-btn--sm">Chcem podobné auto</Link>
          </div>
          {ended.length ? (
            <Suspense fallback={null}>
              <CarBrowser cars={ended} serverNow={serverNow} mode="archive" />
            </Suspense>
          ) : (
            <div className="empty">Zatiaľ tu nič nie je. Sem sa autá presúvajú automaticky po skončení aukcie alebo po vypršaní ponuky.</div>
          )}
        </div>
      </section>
    </>
  );
}
