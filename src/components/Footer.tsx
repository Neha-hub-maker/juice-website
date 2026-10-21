import { site } from "@/config/site";
import { Arrow } from "./Arrow";

export function Footer() {
  return <footer className="footer wrap"><a className="wordmark" href="#home"><span className="brand-mark" aria-hidden="true">✳︎</span>{site.name}<span className="brand-dot">.</span></a>
    <p>{site.tagline}</p><nav aria-label="Footer navigation">{site.contact.instagramUrl && <a href={site.contact.instagramUrl}>Instagram <Arrow diagonal /></a>}<a href="#home">Back to the top <span aria-hidden="true">↑</span></a></nav>
  </footer>;
}
