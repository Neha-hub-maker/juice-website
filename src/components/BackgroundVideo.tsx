"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { VideoAsset } from "@/data/assets";
import { useVideoVisibility } from "@/hooks/useVideoVisibility";
import { useMotion } from "./MotionProvider";

/** The poster is always available, including without JavaScript or autoplay permission. */
export function BackgroundVideo({ asset, eager = false }: { asset: VideoAsset; eager?: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const { seen, visible } = useVideoVisibility(container);
  const { animated, isLowPower } = useMotion();
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const load = animated && !isLowPower && !failed && (eager || seen);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const syncPlayback = () => {
      if (load && visible && !document.hidden) void element.play().catch(() => { /* Keep the static poster if autoplay is blocked. */ });
      else element.pause();
    };
    if (!load) element.load(); // Release the old media request after its src has been removed.
    syncPlayback();
    element.addEventListener("canplay", syncPlayback);
    document.addEventListener("visibilitychange", syncPlayback);
    return () => {
      element.removeEventListener("canplay", syncPlayback);
      document.removeEventListener("visibilitychange", syncPlayback);
      element.pause();
    };
  }, [load, visible]);

  return <div ref={container} className="background-video" aria-hidden="true">
    <Image src={asset.poster} alt="" fill sizes="100vw" preload={eager} fetchPriority={eager ? "high" : undefined} placeholder="blur" blurDataURL={asset.blurDataURL} className="media-cover" />
    <video ref={video} src={load ? asset.path : undefined} poster={eager || seen ? asset.poster : undefined}
      autoPlay={load && visible} muted playsInline loop preload="metadata" tabIndex={-1}
      data-playing={playing && load} className="media-cover"
      onPlaying={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => setFailed(true)} />
  </div>;
}
