# Development

Requires Node.js 22 or newer (validated with Node 24), npm, and ffmpeg when regenerating media.

```sh
npm ci
npm run assets:optimize # only after changing assets; outputs are committed
npm run dev
```

Check each implementation step with `npm run lint` and `npm run build` before committing.
Use `npm run start` to serve the production build.

`npm run test:e2e` runs ten Chromium browser checks against a production server it starts on port 3100. Build first. The suite covers mobile overflow and swiping, keyboard navigation, WCAG automated checks, reduced-motion preferences, pause/resume cleanup, video scrubbing, real WebGL, context loss, weak devices, missing WebGL and JavaScript-disabled rendering. It uses system Chromium when available; otherwise run `npx playwright install chromium`. You can override the executable with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

The original media lives in `assets/`. The optimization script fully decodes and audits every source, matches unique filename IDs, and creates renamed WebP images, silent H.264 loops, video posters, and tiny blur placeholders. It converts the animated GIF to `splash-glass.mp4`, plus a representative poster. `splash-drop-scrub.mp4` is a separate 960px all-intra clip; ordinary splash videos use regular compression. The script verifies codec, pixel format, no-audio, faststart, size and keyframe requirements. Nothing serves original files from `assets/`.

`src/data/assets.ts` is the generated typed manifest; consume its paths, dimensions, `blurDataURL` and `poster` fields instead of hardcoding paths. `ASSET_AUDIT.md` lists every original and compares optimized sizes; `reports/assets-audit.json` includes source hashes. Running the optimizer again produces the same bytes with the same installed sharp/ffmpeg versions. It stages and validates new derivatives outside the checkout, then updates only its managed outputs; unrelated public files are preserved. Keep originals committed while every file is under 50 MB.

Edit the shop name, tagline and contact information in `src/config/site.ts`. Contact and ordering links stay unavailable until real details are supplied. Menu copy is editable in `src/data/flavors.ts`; prices need owner confirmation.

No provided clip shows the complete DNA helix forming and resolving into a glass. The supplied helix image is the source for the 3D presentation and static fallback; the supplied splash footage can be shown as a separate transition, without claiming it is a fluid simulation.

The 3D treatment maps the original artwork onto a gently curved Three.js surface, moving with scroll progress and pointer position. The desktop scroll sequence crossfades to the supplied splash video; it is not a volumetric liquid simulation or a continuous helix-to-glass morph. Three.js is dynamically loaded only near the section on capable desktop devices. Mobile, reduced-motion, low-memory/CPU and data-saving devices receive static artwork. A header control pauses all motion; videos stop offscreen and in background tabs. GSAP contexts, Lenis tickers, observers, event listeners, textures, renderer resources and meshes are cleaned up on unmount.

The shape and color of the small brand icon are inline SVG UI decoration, not an additional media asset. All photographic and video media comes from the provided originals. Public posters are extracted from the supplied clips.

The Pexels gallery images are optimized but intentionally omitted from the main page because their visual style differs. System serif and sans fonts avoid loading additional font assets.
