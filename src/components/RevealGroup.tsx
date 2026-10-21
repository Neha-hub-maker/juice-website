"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMotion } from "./MotionProvider";

gsap.registerPlugin(ScrollTrigger);

export function RevealGroup({ children, mode, className = "" }: {
  children: React.ReactNode;
  mode: "entrance" | "scroll";
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const { animated, isLowPower } = useMotion();
  useEffect(() => {
    if (!animated || isLowPower || !root.current) return;
    const context = gsap.context(() => {
      const targets = root.current!.querySelectorAll(mode === "entrance" ? "[data-hero-reveal]" : "[data-flavor-card]");
      gsap.fromTo(targets, { y: mode === "entrance" ? 28 : 22, opacity: 0 }, {
        y: 0, opacity: 1, duration: mode === "entrance" ? .85 : .65,
        stagger: mode === "entrance" ? .13 : .09, ease: "power2.out",
        ...(mode === "scroll" ? { scrollTrigger: { trigger: root.current, start: "top 90%", once: true } } : {}),
      });
    }, root);
    return () => context.revert();
  }, [animated, isLowPower, mode]);
  return <div ref={root} className={className}>{children}</div>;
}
