# Site verification

Audit captured 2026-10-22T06:04:49.101Z. Production build served locally; Lighthouse 13.5.0, Chromium 154.0.8037.57. Default mobile simulation: 412 × 823, device scale 1.75, simulated throttling, CPU slowdown 4×. No Lighthouse runtime warnings. These are local lab results, not production field data or physical-device GPU measurements.

## Lighthouse mobile

| Category | Target | Before | After | Result |
| --- | --- | --- | --- | --- |
| Performance | 80+ | 53 | 88 | Pass |
| Accessibility | 95+ | 100 | 100 | Pass |
| Best Practices | 95+ | 96 | 100 | Pass |

| Metric | Before | After |
| --- | --- | --- |
| First Contentful Paint | 0.8 s | 0.8 s |
| Largest Contentful Paint | 5.9 s | 3.4 s |
| Total Blocking Time | 1,400 ms | 230 ms |
| Cumulative Layout Shift | 0 | 0 |
| Speed Index | 2.6 s | 2.0 s |

Lighthouse navigation script transfer: 458.5 KiB before → 191.2 KiB after. Transfers are observed compressed responses; the bundle table below uses offline compression estimates and is a different measurement. Full audit: [lighthouse-mobile.json](lighthouse-mobile.json).

The improvements keep Three/R3F off the hero's loading path, defer motion library setup until after first paint, retain readable hero text during its entrance, give the hero poster high fetch priority, and replace a missing favicon response with a supplied-image derivative. The native hero/interlude video behavior and static fallbacks remain intact.

## Bundle loading

| Phase | Raw KiB | gzip KiB | Brotli KiB |
| --- | --- | --- | --- |
| Modern initial scripts | 477.2 | 143.8 | 123.2 |
| Hero after deferred motion | 588.1 | 187.4 | 162.7 |
| Additional on helix entry | 971.0 | 263.3 | 215.6 |

The initial row uses script tags from the server response, excluding the nomodule legacy fallback. The second row includes requests observed while the hero is visible after deferred setup. Three/R3F are absent from those hero requests and appear on entering the helix. Lenis is requested only for capable desktop devices; mobile uses native scrolling. Low-power and reduced-motion modes retain static content. The 3D chunk remains substantial, but is isolated to its section. Full per-chunk inventory and request checks: [bundle-analysis.json](bundle-analysis.json).

## Browser and layout verification

- All 24 Playwright Chromium tests passed against a production build.
- No document horizontal overflow at 375, 768 and 1440 pixels. The flavor carousel's internal horizontal scroll is intentional.
- With reduced motion enabled at each width, all section headings/copy/menu entries remain available, videos release their sources, WebGL and pin spacers are absent, and the helix poster has no animation.
- Delayed optimized-image requests were held until after font loading. After releasing them and visiting every image, all section top positions, widths and heights remained identical at all three widths. Observed CLS was 0 at each width. Lighthouse also reports CLS 0.
- The 768px animated pin retained exactly four viewport heights of scroll range and a zero gap to the next section through batched font/image/video events; disabling motion removed the spacer and kept sections contiguous. Existing tests cover desktop/mobile scrubbing, repeated pause/resume, offscreen rendering pause and WebGL initialization/context-loss fallbacks.
- Metadata title/description, Open Graph source dimensions, theme color and the optimized favicon response passed checks. Keyboard navigation, automated WCAG checks, mobile touch sizing, media failure and JavaScript-disabled content also passed.

Refreshes are shared and batched after `document.fonts.ready`, subsequent font completion, image loads and video metadata. ScrollTrigger retains normal resize handling; contexts/listeners/timers/tickers are removed on cleanup.

## Remaining limits and launch work

No requested Lighthouse score target failed. Remaining diagnostics include LCP at 3.4 seconds (above the 2.5-second “good” threshold), approximately 51 KiB of estimated unused JavaScript, 14 KiB of legacy compatibility code, and 61 KiB of possible image-delivery savings. Those diagnostics do not mean the images exceed the project's media size budgets. Framework compatibility code and image quality tradeoffs were retained.

The production domain has not been supplied. Set `NEXT_PUBLIC_SITE_URL` to the real HTTPS origin and rebuild; until then Next.js explicitly warns that Open Graph/Twitter images resolve against localhost. Title, description, image selection and favicon are implemented, but production social sharing is not ready until that origin is configured.

The 60fps laptop / 30fps phone WebGL targets remain unverified on physical mid-range hardware. The earlier software-renderer sample in [helix-performance.json](helix-performance.json) was below those targets; this navigation audit does not render the below-fold scene and must not be used to claim the GPU target passed. Low-power hints cannot identify every slow GPU; verify transitions and rendering quality on actual devices.

Before launch, replace identity/price/order/contact/social placeholders in site/menu configuration, configure the domain, run the audits against the real HTTPS deployment, and manually review keyboard/screen-reader behavior and the helix on representative phones/laptops. The optional gallery remains omitted because its photography does not match the flavor set.

## Reproduce

```sh
npm ci
npm run lint
npm run build
npm run test:e2e
npm run start -- --port 3200
# In another terminal, while the production server is running:
npm run audit:mobile
npm run bundle:analyze
```

Use `AUDIT_URL` for a different local production server. Lighthouse reads `CHROME_PATH` and optional `AUDIT_CHROME_FLAGS`; the bundle script reads `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. This machine used system Chromium and SwiftShader flags. Scores can vary between lab runs; browser tests do not establish manual accessibility or real-device performance.
