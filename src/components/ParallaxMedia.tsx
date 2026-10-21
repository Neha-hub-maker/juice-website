"use client";

import { useEffect, useRef } from "react";
import { useMotion } from "./MotionProvider";
import { afterPaint, loadScrollMotion, watchScrollLayout } from "@/lib/motion-runtime";

export function ParallaxMedia({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const { animated, canEnhance } = useMotion();
  useEffect(() => {
    if (!animated || !canEnhance || !root.current) return;
    return afterPaint(async cancelled => {
      const { gsap, ScrollTrigger } = await loadScrollMotion();
      if (cancelled() || !root.current) return;
      const context = gsap.context(() => {
        gsap.fromTo(root.current, { yPercent: -7 }, {
          yPercent: 7, ease: "none",
          scrollTrigger: { trigger: root.current!.parentElement, start: "top bottom", end: "bottom top", scrub: .8 },
        });
      }, root);
      const stopWatching = watchScrollLayout(ScrollTrigger);
      return () => { context.revert(); stopWatching(); };
    });
  }, [animated, canEnhance]);
  return <div ref={root} className="interlude-media">{children}</div>;
}
