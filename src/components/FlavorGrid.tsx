import Image from "next/image";
import { flavors } from "@/data/flavors";
import { Arrow } from "./Arrow";
import { BrandMark } from "./BrandMark";

export function FlavorGrid() {
  return <section id="flavors" className="flavors-section" aria-labelledby="flavors-title">
    <div className="wrap">
      <div className="section-heading">
        <div><p className="eyebrow">02 / Find your feel-good</p><h2 id="flavors-title">Pick your<br /><em>bright side.</em></h2></div>
        <p>Five flavors. Plenty of personality.<br />Which one feels like you?<span className="swipe-hint">Swipe to explore <span aria-hidden="true">→</span></span></p>
      </div>
      <ul className="flavor-grid" tabIndex={0} aria-label="Five juice flavors. Scroll horizontally on small screens.">
        {flavors.map((flavor, index) => <li className="flavor-card" key={flavor.id}>
          <div className="flavor-image" style={{ backgroundColor: flavor.color }}>
            <span className="flavor-number" aria-hidden="true">0{index + 1}</span>
            <Image src={flavor.image.path} alt={flavor.alt} fill sizes="(max-width: 640px) 80vw, (max-width: 1000px) 44vw, 29vw" placeholder="blur" blurDataURL={flavor.image.blurDataURL} className="media-cover" />
            <span className="flavor-tag">{flavor.flavor}</span>
          </div>
          <div className="flavor-caption"><h3>{flavor.name}</h3><p>{flavor.note}</p></div>
        </li>)}
        <li className="menu-note"><BrandMark /><h3>Your kind<br />of <em>fresh.</em></h3><a href="#contact">Meet us at the juice bar <Arrow diagonal /></a></li>
      </ul>
    </div>
  </section>;
}
