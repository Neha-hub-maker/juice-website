import { MotionVideo } from "./MotionVideo";
import { assets } from "@/data/assets";

export function Interlude() {
  return <section className="interlude" aria-labelledby="interlude-title">
    <div className="interlude-media"><MotionVideo asset={assets.interludePeel} /></div>
    <div className="interlude-shade" aria-hidden="true" />
    <div className="interlude-copy"><p className="eyebrow">A moment to savor</p><h2 id="interlude-title">Less rush.<br /><em>More refresh.</em></h2></div>
  </section>;
}
