# Development

Requires Node.js 22 or newer (validated with Node 24), npm, and ffmpeg when regenerating media.

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

The page now renders the full non-3D sections: Hero, FlavorGrid, Interlude, OrderCTA and Footer. HelixScroll remains a placeholder for a separate task; no WebGL is mounted.

Hero uses the same pouring clip on desktop and mobile, with a full-screen crop, dark overlay and a static blur-backed poster. This footage preserves a clear pouring-glass composition; the optional vertical synthetic splash clip is not used. Background videos request metadata, play only while onscreen, pause in hidden tabs, release their sources when motion is disabled and retain the poster if playback fails. The interlude source is attached only within 300px of the viewport. Its parallax is restricted to capable desktop devices.

Hero text and flavor cards use scoped GSAP reveal animations; all ScrollTriggers and transforms revert on cleanup or preference changes. Desktop cards use CSS lift/tilt and image zoom; mobile cards are a focusable horizontal snap carousel. Prices remain null in src/data/flavors.ts, and order/contact/social values remain placeholders in src/config/site.ts. Add real URLs there to activate ordering and social links.

The optional Pexels gallery is omitted because its warm photographic style clashes with the pastel menu set. Original media, generated derivatives and the typed asset manifest are unchanged by section implementation.

The Tailwind v4 design system is defined in `src/app/globals.css`, using CSS-first `@theme` tokens. It includes ink/orange/sage/cream colors, display/title/body/label typography, gutter/section spacing, container width and `transition-to-light` / `transition-to-dark` utilities. Fraunces and DM Sans are self-hosted variable fonts loaded through `next/font/local`; pinned Fontsource packages and bundled SIL licenses record their provenance. No font network access is required to build.

Hooks in `src/hooks/` expose reduced motion, viewport/mobile state, low-power hints and combined capabilities with SSR-safe defaults. Low-power detection uses hardwareConcurrency, deviceMemory when present, saveData and slow connection hints. It is a conservative heuristic, not a battery/GPU measurement.

`MotionProvider` combines preferences with the navbar pause control. `SmoothScroll` uses one GSAP ticker callback to drive Lenis (`autoRaf: false`) and forwards Lenis scroll events to ScrollTrigger. It removes that callback and listener and destroys Lenis on cleanup, including Strict Mode effect replay. Reduced-motion, mobile and low-power devices use native anchor scrolling. Future animations should consume `useMotion()` and respect its `animated` and `canEnhance` values, while retaining static fallbacks.
