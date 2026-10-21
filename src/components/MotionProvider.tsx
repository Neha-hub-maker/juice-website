"use client";

import { createContext, useContext, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useDeviceCapabilities } from "@/hooks/useDeviceCapabilities";

type MotionState = {
  animated: boolean;
  reducedMotion: boolean;
  paused: boolean;
  isMobile: boolean;
  isLowPower: boolean;
  canEnhance: boolean;
  toggle: () => void;
};
const MotionContext = createContext<MotionState | null>(null);

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const reducedMotion = useReducedMotion();
  const device = useDeviceCapabilities();
  const [paused, setPaused] = useState(false);
  const animated = !reducedMotion && !paused;
  return <MotionContext.Provider value={{ animated, reducedMotion, paused, ...device, toggle: () => setPaused(value => !value) }}>
    <div data-motion={animated ? "enabled" : "static"} data-mobile={device.isMobile} data-low-power={device.isLowPower}>{children}</div>
  </MotionContext.Provider>;
}

export function useMotion() {
  const context = useContext(MotionContext);
  if (!context) throw new Error("useMotion must be used inside MotionProvider");
  return context;
}

export function MotionToggle() {
  const { animated, reducedMotion, paused, toggle } = useMotion();
  const label = reducedMotion ? "Motion disabled by device preference" : animated ? "Pause motion" : "Resume motion";
  return <button className="motion-toggle" type="button" onClick={toggle} disabled={reducedMotion}
    aria-label={label} title={label} aria-pressed={paused}>
    <span aria-hidden="true">{animated ? "Ⅱ" : "▷"}</span>
  </button>;
}
