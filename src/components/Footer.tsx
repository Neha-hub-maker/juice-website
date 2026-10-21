import { site } from "@/config/site";
import { Arrow } from "./Arrow";
import { BrandMark } from "./BrandMark";

export function Footer() {
  return <footer className="footer wrap"><a className="wordmark" href="#home"><BrandMark />{site.name}<span className="brand-dot">.</span></a>
    <p>{site.tagline}</p><nav aria-label="Footer navigation">{site.contact.instagramUrl && <a href={site.contact.instagramUrl}>Instagram <Arrow diagonal /></a>}<a href="#home">Back to the top <span aria-hidden="true">↑</span></a></nav>
  </footer>;
}
