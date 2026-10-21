import { assets } from "@/data/assets";
import { BackgroundVideo } from "./BackgroundVideo";

export function Interlude() {
  return <section id="interlude" className="interlude" aria-labelledby="interlude-heading">
    <div className="interlude-media"><BackgroundVideo asset={assets.interludePeel} /></div>
    <div className="interlude-shade" aria-hidden="true" />
    <div className="container-page interlude-copy"><h2 id="interlude-heading">Less rush. More refresh.</h2></div>
  </section>;
}
