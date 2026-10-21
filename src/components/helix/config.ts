/** Art direction and performance controls. Stage values are normalized scroll progress. */
export const HELIX = {
  instances: { desktop: 1200, mobile: 400 },
  dpr: { desktop: 2, mobile: 1.5 },
  scrollScreens: 4,
  scrubSeconds: 0.6,
  stages: { splashEnd: 0.25, assembleEnd: 0.6, rotateEnd: 0.85 },
  shape: { radius: 1.05, height: 4.8, turns: 2.15, rungs: { desktop: 17, mobile: 10 } },
  colors: { background: "#10140f", juice: "#ff8a16", glow: "#ee5807", rim: "#ff6a16", glass: "#f5fff4" },
  environmentResolution: 64,
  sphereSegments: { desktop: 10, mobile: 8 },
} as const;

export const HELIX_COPY = [
  { label: "01 / A spark", text: "A little wild. A lot of life." },
  { label: "02 / In our nature", text: "Freshness is in our DNA." },
  { label: "03 / Your daily ritual", text: "All that energy. In your glass." },
] as const;

export type HelixProgress = { current: number };
export const clamp = (value: number) => Math.max(0, Math.min(1, value));
export const ease = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };
