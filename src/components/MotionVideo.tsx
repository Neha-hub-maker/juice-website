"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { useMotion } from "./MotionProvider";
import { useNearViewport } from "./useNearViewport";
import type { VideoAsset } from "@/data/assets";

export function MotionVideo({ asset, alt = "", sizes = "100vw", eager = false }: {
  asset: VideoAsset; alt?: string; sizes?: string; eager?: boolean;
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
    <Image src={asset.poster} alt={alt} aria-hidden={alt ? undefined : true} fill sizes={sizes} preload={eager} placeholder="blur" blurDataURL={asset.blurDataURL} className="media-cover" />
    <video ref={video} src={shouldPlay ? asset.path : undefined} poster={asset.poster} muted loop playsInline preload={shouldPlay ? "auto" : "none"} aria-hidden="true" className="media-cover" />
  </div>;
}
