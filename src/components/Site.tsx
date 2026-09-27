import { Header } from "./Header";
import { Footer } from "./Footer";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a className="skip" href="#obsah">Preskočiť na obsah</a>
      <Header />
      <main id="obsah">{children}</main>
      <Footer />
    </>
  );
}
