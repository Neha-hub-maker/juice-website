"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { useMotion } from "./MotionProvider";
import { useNearViewport } from "./useNearViewport";

export function MotionVideo({ src, poster, alt = "", sizes = "100vw", eager = false }: {
  src: string; poster: string; alt?: string; sizes?: string; eager?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const near = useNearViewport(container, "100px");
  const { animated, capableDevice } = useMotion();
  const shouldPlay = near && animated && capableDevice;

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    if (!shouldPlay) element.load();
    const playIfVisible = () => {
      if (shouldPlay && !document.hidden) void element.play().catch(() => { /* Poster remains if autoplay is blocked. */ });
      else element.pause();
    };
    playIfVisible();
    element.addEventListener("canplay", playIfVisible);
    document.addEventListener("visibilitychange", playIfVisible);
    return () => {
      element.pause();
      element.removeEventListener("canplay", playIfVisible);
      document.removeEventListener("visibilitychange", playIfVisible);
    };
  }, [shouldPlay]);

  return <div ref={container} className="motion-video">
    <Image src={poster} alt={alt} aria-hidden={alt ? undefined : true} fill sizes={sizes} preload={eager} className="media-cover" />
    <video ref={video} src={shouldPlay ? src : undefined} poster={poster} muted loop playsInline preload={shouldPlay ? "auto" : "none"} aria-hidden="true" className="media-cover" />
  </div>;
}
