"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMotion } from "./MotionProvider";

gsap.registerPlugin(ScrollTrigger);

/** GSAP's ticker is the sole RAF source. Touch devices keep native scrolling. */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const { animated, canEnhance } = useMotion();
  useEffect(() => {
    if (!animated || !canEnhance) return;
    const header = document.querySelector<HTMLElement>(".site-header");
    const lenis = new Lenis({
      autoRaf: false,
      smoothWheel: true,
      syncTouch: false,
      duration: 1,
      anchors: { offset: -(header?.offsetHeight ?? 80) - 16 },
    });
    const update = () => ScrollTrigger.update();
    const frame = (seconds: number) => lenis.raf(seconds * 1000);
    lenis.on("scroll", update);
    gsap.ticker.add(frame);
    ScrollTrigger.refresh();
    return () => {
      gsap.ticker.remove(frame);
      lenis.off("scroll", update);
      lenis.destroy();
    };
  }, [animated, canEnhance]);
  return children;
}
