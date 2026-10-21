"use client";

import { useEffect, useState, type RefObject } from "react";

export function useVideoVisibility(ref: RefObject<HTMLElement | null>) {
  const [seen, setSeen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || !("IntersectionObserver" in window)) return;
    const nearby = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setSeen(true);
        nearby.disconnect();
      }
    }, { rootMargin: "300px" });
    const onscreen = new IntersectionObserver(([entry]) => {
      const onScreen = entry.isIntersecting && entry.intersectionRatio > 0;
      setVisible(onScreen);
      if (onScreen) setEntered(true);
    }, { threshold: .01 });
    nearby.observe(element);
    onscreen.observe(element);
    return () => { nearby.disconnect(); onscreen.disconnect(); };
  }, [ref]);
  return { seen, visible, entered };
}
