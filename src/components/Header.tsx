import { site } from "@/config/site";
import { Arrow } from "./Arrow";
import { MotionToggle } from "./MotionProvider";
import { BrandMark } from "./BrandMark";

export function Header() {
  return <header className="header wrap">
    <a href="#home" className="wordmark" aria-label={`${site.name} home`}><BrandMark />{site.name}<span className="brand-dot">.</span></a>
    <nav aria-label="Main navigation" className="main-nav">
      <a href="#ritual">The ritual</a><a href="#flavors">Our flavors</a><a href="#contact">Visit us</a>
    </nav>
    <div className="header-actions"><MotionToggle /><a href="#flavors" className="header-cta">Explore the menu <Arrow diagonal /></a></div>
  </header>;
}
