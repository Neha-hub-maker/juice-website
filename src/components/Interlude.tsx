import { MotionVideo } from "./MotionVideo";

export function Interlude() {
  return <section className="interlude" aria-labelledby="interlude-title">
    <div className="interlude-media"><MotionVideo src="/video/interlude-peel.mp4" poster="/images/interlude-poster.webp" /></div>
    <div className="interlude-shade" aria-hidden="true" />
    <div className="interlude-copy"><p className="eyebrow">A moment to savor</p><h2 id="interlude-title">Less rush.<br /><em>More refresh.</em></h2></div>
  </section>;
}
