import { site } from "@/config/site";
import { Arrow } from "./Arrow";

export function Header() {
  return <header className="header wrap">
    <a href="#home" className="wordmark" aria-label={`${site.name} home`}><span className="brand-mark" aria-hidden="true">✳︎</span>{site.name}<span className="brand-dot">.</span></a>
    <nav aria-label="Main navigation" className="main-nav">
      <a href="#ritual">The ritual</a><a href="#flavors">Our flavors</a><a href="#contact">Visit us</a>
    </nav>
    <a href="#flavors" className="header-cta">Explore the menu <Arrow diagonal /></a>
  </header>;
}
