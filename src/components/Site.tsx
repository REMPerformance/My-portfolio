import { Header } from "./Header";
import { Footer } from "./Footer";
import { getContent } from "@/lib/data";

export async function SiteShell({ children }: { children: React.ReactNode }) {
  const c = await getContent();
  return (
    <>
      <a className="skip" href="#obsah">Preskočiť na obsah</a>
      <Header topbar={c.topbar} />
      <main id="obsah">{children}</main>
      <Footer phone={c.contact.phone} />
    </>
  );
}
