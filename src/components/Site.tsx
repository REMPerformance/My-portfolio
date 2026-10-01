import { Header } from "./Header";
import { Footer } from "./Footer";
import { getContent } from "@/lib/data";
import { SITE } from "@/lib/site";
import { Tracker } from "./Tracker";

export async function SiteShell({ children }: { children: React.ReactNode }) {
  const c = await getContent();
  return (
    <>
      <a className="skip" href="#obsah">Preskočiť na obsah</a>
      <Tracker />
      <Header />
      <main id="obsah">{children}</main>
      <Footer phone={c.contact.phone || SITE.phone} />
      <a className="wa-float" href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noopener" aria-label={`Napíšte nám na WhatsApp ${SITE.phone}`}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.8 11.8 0 004.5 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.7-1.2s.2-1.1.2-1.2-.3-.2-.5-.3z" /></svg>
      </a>
    </>
  );
}
