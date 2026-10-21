"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { assets } from "@/data/assets";
import { useMotion } from "@/components/MotionProvider";
import { Arrow } from "@/components/Arrow";
import { useVideoVisibility } from "@/hooks/useVideoVisibility";
import { HELIX, HELIX_COPY, ease } from "./config";

const HelixScene = dynamic(() => import("./HelixScene"), { ssr: false });
gsap.registerPlugin(ScrollTrigger);

class SceneBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export function HelixScroll() {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const renderRequestRef = useRef<(() => void) | null>(null);
  const { animated, isLowPower, isMobile } = useMotion();
  const { seen, visible } = useVideoVisibility(section);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const eligible = animated && !isLowPower && !failed;
  // Reserve the scroll experience as soon as it is nearby, before the lazy WebGL
  // chunk finishes. The poster stays visible until the scene is ready.
  const enhanced = eligible && seen;
  const onReady = useCallback(() => setReady(true), []);
  const onFailure = useCallback(() => { setFailed(true); setReady(false); }, []);

  useEffect(() => {
    if (!enhanced || !section.current || !stage.current) return;
    const element = section.current;
    const preservePosition = (removing: boolean) => {
      const next = element.nextElementSibling;
      const header = document.querySelector("header")?.getBoundingClientRect().height ?? 80;
      const bounds = element.getBoundingClientRect();
      const below = bounds.bottom <= header;
      const inside = bounds.top <= header && bounds.bottom > header;
      const nextTop = next?.getBoundingClientRect().top ?? 0;
      return () => {
        if (!element.isConnected) return;
        // Late loading, context loss and pause must not move the menu away from
        // someone who has already followed an anchor past this section.
        if (below && next) window.scrollBy({ top: next.getBoundingClientRect().top - nextTop, behavior: "instant" });
        else if (removing && inside) window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - header, behavior: "instant" });
      };
    };
    const restoreAfterPin = preservePosition(false);
    const beats = gsap.utils.toArray<HTMLElement>(".helix-beat", element);
    const meter = element.querySelector<HTMLElement>(".helix-progress-fill");
    const update = () => {
      const p = progress.current;
      const middle = ease((p - .42) / .18);
      const final = ease((p - HELIX.stages.rotateEnd) / .08);
      const opacities = [1 - middle, middle * (1 - final), final];
      beats.forEach((beat, index) => { beat.style.opacity = String(opacities[index]); beat.style.transform = `translateY(${(1 - opacities[index]) * 12}px)`; });
      if (meter) meter.style.transform = `scaleX(${p})`;
      renderRequestRef.current?.();
    };
    const context = gsap.context(() => {
      gsap.to(progress, { current: 1, ease: "none", onUpdate: update,
        scrollTrigger: { id: "juice-helix", trigger: element, pin: stage.current,
          start: () => `top ${document.querySelector("header")?.getBoundingClientRect().height ?? 80}`,
          end: () => `+=${window.innerHeight * HELIX.scrollScreens}`,
          scrub: HELIX.scrubSeconds, anticipatePin: 1, invalidateOnRefresh: true,
        },
      });
      update();
    }, element);
    // Pin spacing changes the positions of the following menu/interlude triggers.
    ScrollTrigger.refresh();
    restoreAfterPin();
    return () => {
      const restoreAfterUnpin = preservePosition(true);
      context.revert();
      progress.current = 0;
      beats.forEach(beat => { beat.style.removeProperty("opacity"); beat.style.removeProperty("transform"); });
      meter?.style.removeProperty("transform");
      ScrollTrigger.refresh();
      restoreAfterUnpin();
    };
  }, [enhanced]);

  return <section id="ritual" ref={section} className="helix-section section-dark" aria-labelledby="helix-title"
    data-enhanced={enhanced} data-scene-ready={eligible && ready} data-helix-failed={failed}>
    <div className="helix-stage" ref={stage}>
      <div className="helix-visual" aria-hidden="true">
        <div className="helix-poster">
          <Image src={assets.helix.path} alt="" fill sizes="(max-width: 767px) 100vw, 70vw"
            placeholder="blur" blurDataURL={assets.helix.blurDataURL} className="media-cover" />
        </div>
        {eligible && seen && <SceneBoundary onFailure={onFailure}>
          <HelixScene progress={progress} mobile={isMobile} active={visible}
            renderRequestRef={renderRequestRef} onReady={onReady} onFailure={onFailure} />
        </SceneBoundary>}
      </div>
      <div className="helix-content container-page">
        <div className="helix-intro">
          <p className="eyebrow">THE RITUAL / FROM SPARK TO SIP</p>
          <h2 id="helix-title">Naturally<br /><span>extraordinary.</span></h2>
        </div>
        <div className="helix-beats">
          {HELIX_COPY.map(beat => <div className="helix-beat" key={beat.label} aria-hidden={enhanced ? true : undefined}>
            <p className="eyebrow">{beat.label}</p><p className="helix-beat-text">{beat.text}</p>
          </div>)}
        </div>
        {enhanced && <p className="sr-only">{HELIX_COPY.map(beat => beat.text).join(" ")}</p>}
        <div className="helix-scroll-note" aria-hidden="true"><span>SCROLL TO SHAPE THE FRESH</span>
          <div className="helix-progress"><div className="helix-progress-fill" /></div>
        </div>
        <a className="helix-skip" href="#flavors">Explore the flavors <Arrow /></a>
      </div>
    </div>
  </section>;
}
