import Image from "next/image";

export function HelixScroll() {
  return <section id="ritual" className="helix-section" aria-labelledby="helix-title">
    <div className="helix-stage wrap">
      <div className="helix-copy">
        <p className="eyebrow">01 / A different kind of energy</p>
        <h2 id="helix-title">A fresh<br /><em>twist.</em></h2>
        <p>A little unexpected.<br />A lot to look forward to.<br />Let your everyday take a new shape.</p>
      </div>
      <div className="helix-art">
        <Image src="/images/helix.webp" alt="Orange juice splash twisting into a DNA double helix on black" fill sizes="(max-width: 700px) 100vw, 55vw" className="media-contain" />
      </div>
      <p className="helix-footnote">Rooted in nature.<br /><span>Made for your everyday.</span></p>
    </div>
  </section>;
}
