"use client";

import { useEffect, useRef } from "react";
import { useMotion } from "./MotionProvider";
import { afterPaint, loadGsap, loadScrollMotion, watchScrollLayout } from "@/lib/motion-runtime";

export function RevealGroup({ children, mode, className = "" }: {
  children: React.ReactNode;
  mode: "entrance" | "scroll";
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const { animated, isLowPower } = useMotion();
  useEffect(() => {
    if (!animated || isLowPower || !root.current) return;
    return afterPaint(async cancelled => {
      const runtime = mode === "scroll" ? await loadScrollMotion() : { gsap: await loadGsap(), ScrollTrigger: null };
      if (cancelled() || !root.current) return;
      const { gsap, ScrollTrigger } = runtime;
      const context = gsap.context(() => {
        const targets = root.current!.querySelectorAll(mode === "entrance" ? "[data-hero-reveal]" : "[data-flavor-card]");
        // Keep the hero text painted; opacity entrances would delay its LCP.
        gsap.fromTo(targets, { y: mode === "entrance" ? 12 : 22, ...(mode === "scroll" ? { opacity: 0 } : {}) }, {
          y: 0, opacity: 1, duration: mode === "entrance" ? .85 : .65,
          stagger: mode === "entrance" ? .13 : .09, ease: "power2.out",
          ...(mode === "scroll" ? { scrollTrigger: { trigger: root.current, start: "top 90%", once: true } } : {}),
        });
      }, root);
      const stopWatching = ScrollTrigger ? watchScrollLayout(ScrollTrigger) : undefined;
      return () => { context.revert(); stopWatching?.(); };
    });
  }, [animated, isLowPower, mode]);
  return <div ref={root} className={className}>{children}</div>;
}
