"use client";

import { useEffect, useState, type RefObject } from "react";

export function useNearViewport(ref: RefObject<Element | null>, margin = "250px") {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), { rootMargin: margin });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, margin]);
  return near;
}
