import { HELIX } from "./config";

/** Seeded once per quality tier: resizing and reverse scrubbing never reshuffle the liquid. */
export function createParticles(count: number) {
  const start = new Float32Array(count * 3);
  const splash = new Float32Array(count * 3);
  const helix = new Float32Array(count * 3);
  const glass = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  let seed = 1709;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const strandCount = Math.floor(count * .7 / 2) * 2;
  const rungs = count > 500 ? HELIX.shape.rungs.desktop : HELIX.shape.rungs.mobile;
  for (let i = 0; i < count; i++) {
    const j = i * 3;
    const angle = random() * Math.PI * 2;
    const radius = .8 + random() * 2.6;
    start.set([Math.cos(angle) * .18, -1.2 + random() * .35, Math.sin(angle) * .18], j);
    splash.set([Math.cos(angle) * radius, -1.5 + random() * 4, Math.sin(angle) * radius * .7], j);
    const strand = i % 2;
    const isRung = i >= strandCount;
    const rungIndex = (i - strandCount) % rungs;
    const t = isRung ? rungIndex / (rungs - 1) : Math.floor(i / 2) / (strandCount / 2 - 1);
    const theta = t * Math.PI * 2 * HELIX.shape.turns;
    const pointsInRung = Math.floor((count - strandCount - 1 - rungIndex) / rungs) + 1;
    const across = Math.floor((i - strandCount) / rungs) / (pointsInRung - 1);
    const r = isRung ? (across * 2 - 1) * HELIX.shape.radius : HELIX.shape.radius;
    const phase = theta + (isRung ? 0 : strand * Math.PI);
    helix.set([Math.cos(phase) * r + (random() - .5) * .045,
      (t - .5) * HELIX.shape.height, Math.sin(phase) * r + (random() - .5) * .045], j);
    const fillRadius = Math.sqrt(random()) * .51;
    glass.set([Math.cos(angle) * fillRadius, -2.27 + random() * 1.75, Math.sin(angle) * fillRadius], j);
    const base = count > 500 ? .068 : .1;
    sizes[i] = i % 89 === 0 ? base * 2.3 : base * (.8 + random() * .5);
  }
  return { start, splash, helix, glass, sizes };
}
