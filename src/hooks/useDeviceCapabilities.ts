"use client";

import { useIsMobile } from "./useIsMobile";
import { useLowPower } from "./useLowPower";

export function useDeviceCapabilities() {
  const isMobile = useIsMobile();
  const isLowPower = useLowPower();
  return { isMobile, isLowPower, canEnhance: !isMobile && !isLowPower };
}
