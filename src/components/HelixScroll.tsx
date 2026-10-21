"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMediaQuery, useMotion } from "./MotionProvider";
import { useNearViewport } from "./useNearViewport";

const HelixScene = dynamic(() => import("./HelixScene"), { ssr: false });
gsap.registerPlugin(ScrollTrigger);

export function HelixScroll() {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const progress = useRef({ value: 0 });
  const near = useNearViewport(section, "200px");
  const desktop = useMediaQuery("(min-width: 900px) and (pointer: fine)");
  const { animated, capableDevice } = useMotion();
  const enhanced = animated && capableDevice && desktop;

  useEffect(() => {
    if (!enhanced || !stage.current) return;
    const currentProgress = progress.current;
    const context = gsap.context(() => {
      const timeline = gsap.timeline({
        scrollTrigger: { trigger: section.current, pin: stage.current, start: "top top", end: () => `+=${window.innerHeight * 1.6}`, scrub: .5, invalidateOnRefresh: true },
        onUpdate: () => {
          const element = video.current;
          if (element && element.readyState >= 2 && Number.isFinite(element.duration)) {
            const time = Math.max(0, (progress.current.value - .62) / .38) * Math.max(0, element.duration - .05);
            if (Math.abs(element.currentTime - time) > .045) element.currentTime = time;
          }
        },
      });
      timeline.to(currentProgress, { value: 1, duration: 1, ease: "none" }, 0)
        .to(".helix-art", { scale: .95, duration: 1, ease: "none" }, 0)
        .to(".helix-artwork", { opacity: 0, duration: .18 }, .65)
        .to(".helix-splash", { opacity: 1, duration: .18 }, .65)
        .to(".helix-copy", { y: -30, duration: 1, ease: "none" }, 0);
    }, section);
    return () => { context.revert(); currentProgress.value = 0; };
  }, [enhanced]);

  return <section ref={section} id="ritual" className="helix-section" aria-labelledby="helix-title">
    <div ref={stage} className="helix-stage wrap">
      <div className="helix-copy">
        <p className="eyebrow">01 / A different kind of energy</p>
        <h2 id="helix-title">A fresh<br /><em>twist.</em></h2>
        <p>A little unexpected.<br />A lot to look forward to.<br />Let your everyday take a new shape.</p>
      </div>
      <div className="helix-art">
        <div className="helix-artwork">
          <Image src="/images/helix.webp" alt="Orange juice splash twisting into a DNA double helix on black" fill sizes="(max-width: 700px) 100vw, 55vw" className="media-contain" />
          {enhanced && near && <HelixScene progress={progress} />}
        </div>
        <video ref={video} src={enhanced && near ? "/video/splash-drop.mp4" : undefined} className="helix-splash" poster="/images/splash-glass.webp" muted playsInline preload={enhanced && near ? "auto" : "none"} aria-hidden="true" />
      </div>
      <p className="helix-footnote">Rooted in nature.<br /><span>Made for your everyday.</span></p>
    </div>
  </section>;
}
