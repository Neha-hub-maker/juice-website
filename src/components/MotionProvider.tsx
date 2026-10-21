"use client";

import { createContext, useCallback, useContext, useState, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};
const getClient = () => true;
const getServer = () => false;

export function useMediaQuery(query: string, serverValue = false) {
  const subscribe = useCallback((callback: () => void) => {
    const media = window.matchMedia(query);
    media.addEventListener("change", callback);
    return () => media.removeEventListener("change", callback);
  }, [query]);
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  const getServerSnapshot = useCallback(() => serverValue, [serverValue]);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

type DeviceNavigator = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};
const getCapableDevice = () => {
  const device = navigator as DeviceNavigator;
  return (device.hardwareConcurrency || 2) >= 4 && (device.deviceMemory ?? 4) >= 4
    && !device.connection?.saveData && !["slow-2g", "2g"].includes(device.connection?.effectiveType ?? "");
};

const MotionContext = createContext({ animated: false, capableDevice: false, reducedMotion: true, paused: false, toggle: () => {} });

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const hydrated = useSyncExternalStore(noopSubscribe, getClient, getServer);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)", true);
  const capableDevice = useSyncExternalStore(noopSubscribe, getCapableDevice, getServer);
  const [paused, setPaused] = useState(false);
  const animated = hydrated && !reducedMotion && !paused;
  return <MotionContext.Provider value={{ animated, capableDevice, reducedMotion, paused, toggle: () => setPaused((value) => !value) }}>
    <div data-motion={animated ? "enabled" : "static"}>{children}</div>
  </MotionContext.Provider>;
}

export const useMotion = () => useContext(MotionContext);

export function MotionToggle() {
  const { animated, reducedMotion, paused, toggle } = useMotion();
  return <button type="button" className="motion-toggle" onClick={toggle} aria-pressed={paused} disabled={reducedMotion}
    aria-label={reducedMotion ? "Motion disabled by your device preference" : animated ? "Pause motion" : "Resume motion"}>
    <span aria-hidden="true">{animated ? "Ⅱ" : "▷"}</span><span>{animated ? "Pause motion" : "Motion off"}</span>
  </button>;
}
