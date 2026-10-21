"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMotion } from "./MotionProvider";

gsap.registerPlugin(ScrollTrigger);

export function ParallaxMedia({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const { animated, canEnhance } = useMotion();
  useEffect(() => {
    if (!animated || !canEnhance || !root.current) return;
    const context = gsap.context(() => {
      gsap.fromTo(root.current, { yPercent: -7 }, {
        yPercent: 7, ease: "none",
        scrollTrigger: { trigger: root.current!.parentElement, start: "top bottom", end: "bottom top", scrub: .8 },
      });
    }, root);
    return () => context.revert();
  }, [animated, canEnhance]);
  return <div ref={root} className="interlude-media">{children}</div>;
}
