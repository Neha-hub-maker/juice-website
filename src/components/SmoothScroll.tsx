"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMotion } from "./MotionProvider";

gsap.registerPlugin(ScrollTrigger);

export function SmoothScroll() {
  const { animated, capableDevice } = useMotion();
  useEffect(() => {
    if (!animated || !capableDevice) return;
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true, syncTouch: false, anchors: { offset: -24 } });
    const update = () => ScrollTrigger.update();
    const frame = (time: number) => lenis.raf(time * 1000);
    lenis.on("scroll", update);
    gsap.ticker.add(frame);
    return () => {
      gsap.ticker.remove(frame);
      lenis.off("scroll", update);
      lenis.destroy();
    };
  }, [animated, capableDevice]);
  return null;
}
