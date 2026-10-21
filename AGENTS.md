# Project rules

- Read README.md for the section plan and asset mapping; these rules take precedence.
- Use Next.js App Router, TypeScript, Tailwind, GSAP ScrollTrigger, Lenis, Three.js, @react-three/fiber and @react-three/drei.
- Work in small steps. After each step, run `npm run lint` and `npm run build`, fix failures, then commit with a clear message.
- Use supplied assets only. Keep originals in `assets/`, and serve only optimized, renamed derivatives from `public/`.
- Keep the shop name (`SITE_NAME`), tagline and contact placeholders in `src/config/site.ts`.
- Respect prefers-reduced-motion for every animation and provide static fallbacks.
- Mobile first: no horizontal document overflow at 375px, touch-friendly controls, and graceful 3D fallback on weak devices.
- Clean up ScrollTriggers, Lenis instances and WebGL resources on unmount, including React strict mode.
- Provide alt text for meaningful media, hide decorative media from assistive technology, visible keyboard focus, and sufficient text contrast.
- Keep card images under 200 KB, backgrounds under 400 KB, and loop videos under 4 MB. Lazy-load below the fold and reserve media dimensions.
- Use dark hero/helix/order sections, pastel sage/cream flavors, vivid orange accents, expressive type, generous spacing and smooth background transitions.
- End tasks with a short report of changes, incomplete work and risks.
- Each cloud task already has an isolated checkout. Do not create a Git worktree unless explicitly requested.
