import Image from "next/image";
import { flavors, PRICE_PLACEHOLDER } from "@/data/flavors";

export function FlavorGrid() {
  return <section id="flavors" className="flavors-section section-light transition-to-light" aria-labelledby="flavors-heading" tabIndex={-1}>
    <div className="container-page">
      <div className="flavors-heading-row">
        <div><p className="eyebrow">FIVE FLAVORS. ALL PERSONALITY.</p><h2 id="flavors-heading">Find your<br /><span>bright side.</span></h2></div>
        <p className="flavors-intro">A little green. A little golden.<br />Something that feels like you.</p>
      </div>
      <p id="flavor-help" className="carousel-hint">Swipe or use the arrow keys to explore <span aria-hidden="true">→</span></p>
      <ul className="flavor-grid" tabIndex={0} aria-label="Juice flavors" aria-describedby="flavor-help">
        {flavors.map((flavor, index) => <li className="flavor-card" key={flavor.id} data-flavor-card>
          <div className="flavor-card-lift">
            <div className="flavor-media" style={{ backgroundColor: flavor.color }}>
              <Image src={flavor.image.path} alt={flavor.alt} fill sizes="(max-width: 767px) 82vw, (max-width: 1199px) 30vw, 19vw" placeholder="blur" blurDataURL={flavor.image.blurDataURL} className="media-cover" />
              <span className="flavor-index" aria-hidden="true">0{index + 1}</span>
            </div>
            <div className="flavor-copy"><h3>{flavor.name}</h3><p>{flavor.tagline}</p><p className="flavor-price">{flavor.price ?? PRICE_PLACEHOLDER}</p></div>
          </div>
        </li>)}
      </ul>
    </div>
  </section>;
}
