# Development

Requires Node.js 22.19 or newer (validated with Node 24), npm, and ffmpeg when regenerating media.

```sh
npm ci
npm run assets:optimize # only after changing assets; outputs are committed
npm run dev
```

Check each implementation step with `npm run lint` and `npm run build` before committing.
Use `npm run start` to serve the production build.

`npm run test:e2e` checks the foundation in Chromium against a production server on port 3100. Build first. The suite covers section order, menu data, local fonts, sticky mobile anchors, keyboard navigation, accessibility, reduced motion, playback fallback, lazy video loading, offscreen pause, animation cleanup, viewport updates, low-power hints, mobile carousel behavior and JavaScript-disabled rendering. It uses system Chromium when available; otherwise run `npx playwright install chromium`. Override the executable with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

The original media lives in `assets/`. The optimization script fully decodes and audits every source, matches unique filename IDs, and creates renamed WebP images, silent H.264 loops, video posters, and tiny blur placeholders. It converts the animated GIF to `splash-glass.mp4`, plus a representative poster. `splash-drop-scrub.mp4` is a separate 960px all-intra clip; ordinary splash videos use regular compression. The script verifies codec, pixel format, no-audio, faststart, size and keyframe requirements. Nothing serves original files from `assets/`.

`src/data/assets.ts` is the generated typed manifest; consume its paths, dimensions, `blurDataURL` and `poster` fields instead of hardcoding paths. `ASSET_AUDIT.md` lists every original and compares optimized sizes; `reports/assets-audit.json` includes source hashes. Running the optimizer again produces the same bytes with the same installed sharp/ffmpeg versions. It stages and validates new derivatives outside the checkout, then updates only its managed outputs; unrelated public files are preserved. Keep originals committed while every file is under 50 MB.

Edit `SITE_NAME`, tagline, contact placeholders and `orderUrl` in `src/config/site.ts`. Until an order URL is supplied, the navbar Order link goes to the OrderCTA placeholder.

The page now renders the full non-3D sections: Hero, FlavorGrid, Interlude, OrderCTA and Footer. HelixScroll now renders a lazy, scroll-driven R3F liquid scene between Hero and FlavorGrid.

Hero uses the same pouring clip on desktop and mobile, with a full-screen crop, dark overlay and a static blur-backed poster. This footage preserves a clear pouring-glass composition; the optional vertical synthetic splash clip is not used. Background videos request metadata, play only while onscreen, pause in hidden tabs, release their sources when motion is disabled and retain the poster if playback fails. The interlude source is attached only within 300px of the viewport. Its parallax is restricted to capable desktop devices.

Hero text and flavor cards use scoped GSAP reveal animations; all ScrollTriggers and transforms revert on cleanup or preference changes. Desktop cards use CSS lift/tilt and image zoom; mobile cards are a focusable horizontal snap carousel. Prices remain null in src/data/flavors.ts, and order/contact/social values remain placeholders in src/config/site.ts. Add real URLs there to activate ordering and social links.

The optional Pexels gallery is omitted because its warm photographic style clashes with the pastel menu set. Original media, generated derivatives and the typed asset manifest are unchanged by section implementation.

The Tailwind v4 design system is defined in `src/app/globals.css`, using CSS-first `@theme` tokens. It includes ink/orange/sage/cream colors, display/title/body/label typography, gutter/section spacing, container width and `transition-to-light` / `transition-to-dark` utilities. Fraunces and DM Sans are self-hosted variable fonts loaded through `next/font/local`; pinned Fontsource packages and bundled SIL licenses record their provenance. No font network access is required to build.

Hooks in `src/hooks/` expose reduced motion, viewport/mobile state, low-power hints and combined capabilities with SSR-safe defaults. Low-power detection uses hardwareConcurrency, deviceMemory when present, saveData and slow connection hints. It is a conservative heuristic, not a battery/GPU measurement.

`MotionProvider` combines preferences with the navbar pause control. `SmoothScroll` uses one GSAP ticker callback to drive Lenis (`autoRaf: false`) and forwards Lenis scroll events to ScrollTrigger. It removes that callback and listener and destroys Lenis on cleanup, including Strict Mode effect replay. Reduced-motion, mobile and low-power devices use native anchor scrolling. Future animations should consume `useMotion()` and respect its `animated` and `canEnhance` values, while retaining static fallbacks.


The signature helix lives in `src/components/helix/`. `HelixScroll.tsx` dynamically imports `HelixScene.tsx` with SSR disabled. GSAP pins the inner stage beneath the sticky navbar for four viewport heights and scrubs a single progress ref; React does not rerender per scroll frame. The Canvas requests frames only when progress changes while the section is visible, and pauses requests in hidden tabs. No continuous R3F loop or postprocessing is used.

`particles.ts` precomputes seeded Float32Array start, splash, helix and glass targets. The particles burst in gravity-like arcs, assemble into two strands with rungs, rotate with a scroll-dependent breath, then merge into the rising liquid inside a LatheGeometry glass. Reverse scrolling follows the same deterministic positions. Three HTML copy beats remain accessible as ordinary text, and an always-available link skips to the flavors.

Reduced motion, the site pause control, low-power hints, WebGL initialization errors and context loss select the unpinned manifest-backed helix poster with all three copy beats. CSS view-timeline parallax enhances that poster only where supported and motion is permitted; reduced motion is completely static. Pin setup/teardown preserves downstream content position. Disabling motion while inside the pin returns to the static section. No-JavaScript rendering also includes the poster and all copy.

R3F owns every declarative geometry/material and its renderer, disposing them and releasing the WebGL context on Canvas unmount. Drei disposes its environment render target. Effect cleanup removes the context-loss/visibility listeners, render request callback and GSAP context, including the pin spacer. Browser tests exercise repeated pause/resume, reduced-motion changes, failed WebGL creation and a real lost context.

The environment uses two procedural Lightformers in a one-frame, 64px drei Environment. Drei's named presets fetch external HDR files; procedural lighting respects the supplied-assets-only rule. Bloom is omitted to avoid an additional full-screen rendering pass.

Tuning controls in `src/components/helix/config.ts`:

| Control | Default |
| --- | --- |
| `instances.desktop` / `instances.mobile` | 1,200 / 400 |
| `dpr.desktop` / `dpr.mobile` | 2 / 1.5 maximum |
| `scrollScreens` / `scrubSeconds` | 4 viewport heights / 0.6 seconds |
| `stages.splashEnd` / `assembleEnd` / `rotateEnd` | 0.25 / 0.60 / 0.85; settle ends at 1 |
| `shape.radius` / `height` / `turns` | 1.05 / 4.8 / 2.15 scene units/turns |
| `shape.rungs.desktop` / `shape.rungs.mobile` | 17 / 10 |
| `sphereSegments.desktop` / `sphereSegments.mobile` | 10 / 8 |
| `environmentResolution` | 64 |
| `colors.background` / `juice` / `glow` / `rim` / `glass` | #10140f / #ff8a16 / #ee5807 / #ff6a16 / #f5fff4 |
| `HELIX_COPY` | Three stage labels and sentences |

Material roughness, clearcoat, light intensity, camera distance/orbit and glass profile are in `HelixScene.tsx`. Stage widths control how much scrolling each phase receives; they are not playback durations. The CSS pin height leaves room for the persistent navbar.

To sample actual instanced WebGL frame submissions, start a production build on port 3100 and run `node scripts/measure-helix.mjs`. Set `HELIX_BENCH_URL` for another local test server, `HELIX_HEADED=1` for a visible browser, or `HELIX_SOFTWARE_RENDERING=1` to force SwiftShader. The script drives continuous scrolling for eight seconds at desktop and mobile viewports and writes `reports/helix-performance.json`. It overrides device capability hints to exercise both tiers; it does not bypass reduced motion in the application. Cloud/software results do not validate the 60fps laptop or 30fps phone hardware targets.

Observed cloud sample (Chromium 154, ANGLE/SwiftShader software renderer):

| Viewport | Instances | Effective DPR | Draw submissions / second | Sample duration |
| --- | --- | --- | --- | --- |
| 1440 × 960 | 1,200 | 1 | 1.06 | 8.53 s |
| 375 × 812 | 400 | 1.50 (device DPR 3 capped) | 6.86 | 8.02 s |

These software-rendered rates are below the requested targets. No physical mid-range laptop or phone GPU was available, so actual-device 60/30fps performance remains unverified. `reports/helix-performance.json` retains the renderer identity, timing method and raw sample summary. Re-run the script on target hardware before treating those targets as met.

Site polish and audits:

- Motion libraries use async imports from `src/lib/motion-runtime.ts`. Two animation frames and an idle callback let the server-rendered hero paint before setup. Hero text remains opaque during its staggered movement so the entrance does not postpone its first readable paint. Lenis is requested only for capable desktop devices. The R3F chunk is imported only after the helix enters the viewport; the manifest poster remains its loading fallback.
- The shared, reference-counted layout watcher batches font completion and image/video load events before a safe ScrollTrigger refresh. Its listeners and timers disappear when the final motion consumer unmounts. ScrollTrigger also retains its normal resize refresh handling.
- `src/app/layout.tsx` supplies title, description, Open Graph/Twitter image metadata and a near-black theme color. Set `NEXT_PUBLIC_SITE_URL` to the production HTTPS origin before rebuilding for launch. Until then, Next.js warns and resolves social images against localhost; the repository does not invent a shop domain.
- `src/app/favicon.ico` is a 64px RGBA crop of the supplied splash-teal derivative, encoded as a PNG-backed ICO. `npm run assets:optimize` now also runs `scripts/generate-site-icon.mjs`; the existing optimized WebP/MP4 derivatives are otherwise unchanged.
- After `npm run build`, start a production server with `npm run start -- --port 3200`. Run `npm run audit:mobile` for Lighthouse's default mobile simulation and `npm run bundle:analyze` for entry/deferred chunk sizes and an actual request-boundary check. `AUDIT_URL`, `CHROME_PATH`, `AUDIT_CHROME_FLAGS` and `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` allow another local server/browser. Audits write JSON to `reports/`; `reports/SITE_VERIFICATION.md` explains results and limits.
- Browser checks now include delayed media loading, static/reduced-motion usability and document overflow at 375/768/1440, metadata/favicon responses, and 768px pin continuity through font/media refresh. The pin's deliberate scroll distance must not be confused with an empty gap after teardown.
