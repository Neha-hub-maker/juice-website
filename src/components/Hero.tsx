import { MotionVideo } from "./MotionVideo";
import { site } from "@/config/site";
import { Arrow } from "./Arrow";
import { BrandMark } from "./BrandMark";
import { assets } from "@/data/assets";

export function Hero() {
  return <section className="hero wrap" aria-labelledby="hero-title">
    <div className="hero-copy">
      <p className="eyebrow"><span className="little-dot" />Nature, with a twist</p>
      <h1 id="hero-title">Good things.<br /><em>Freshly</em><br />squeezed.</h1>
      <p className="hero-description">{site.tagline}<br />Five vibrant flavors. One very good daily ritual.</p>
      <a className="button button-orange" href="#flavors">Find your flavor <Arrow diagonal /></a>
    </div>
    <div className="hero-visual">
      <div className="hero-frame">
        <MotionVideo asset={assets.heroPour} alt="Golden orange juice being poured into a glass" sizes="(max-width: 700px) 90vw, 46vw" eager />
        <span className="hero-frame-shade" aria-hidden="true" />
        <p className="visual-caption">A brighter kind<br /><em>of everyday.</em></p>
      </div>
      <div className="round-note" aria-hidden="true"><span>THE GOOD</span><BrandMark /><span>STUFF INSIDE</span></div>
      <span className="visual-index">01 / THE DAILY RITUAL</span>
    </div>
    <div className="hero-bottom"><span>Good taste. A fresh perspective.</span><a href="#ritual">Take a little scroll <span aria-hidden="true">↓</span></a></div>
  </section>;
}
