"use client";

import { useMediaQuery } from "./useMediaQuery";

/** Stay static during SSR and hydration until the actual preference is known. */
export function useReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)", true);
}
