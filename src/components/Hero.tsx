import { assets } from "@/data/assets";
import { site } from "@/config/site";
import { BackgroundVideo } from "./BackgroundVideo";
import { Arrow } from "./Arrow";

export function Hero() {
  return <section id="hero" className="hero" aria-labelledby="hero-heading" tabIndex={-1}>
    <BackgroundVideo asset={assets.heroPour} eager />
    <div className="hero-shade" aria-hidden="true" />
    <div className="hero-content container-page">
      <p className="eyebrow" data-hero-reveal>THE EVERYDAY, WITH A TWIST</p>
      <h1 id="hero-heading" data-hero-reveal>A brighter<br />kind of <span>fresh.</span></h1>
      <p className="hero-tagline" data-hero-reveal>{site.tagline}</p>
      <div data-hero-reveal><a className="button button-primary" href={site.orderUrl ?? "#contact"}>Order now <Arrow /></a></div>
    </div>
    <a className="scroll-cue container-page" href="#ritual" aria-label="Scroll to the ritual"><span>Scroll to explore</span><Arrow down /></a>
  </section>;
}
