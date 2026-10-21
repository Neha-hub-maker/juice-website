import { assets } from "@/data/assets";
import { BackgroundVideo } from "./BackgroundVideo";
import { ParallaxMedia } from "./ParallaxMedia";

export function Interlude() {
  return <section id="interlude" className="interlude" aria-labelledby="interlude-heading">
    <ParallaxMedia><BackgroundVideo asset={assets.interludePeel} /></ParallaxMedia>
    <div className="interlude-shade" aria-hidden="true" />
    <div className="container-page interlude-copy"><h2 id="interlude-heading">Less rush. More refresh.</h2></div>
  </section>;
}
