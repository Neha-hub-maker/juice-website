# Juice Shop Website

A dynamic, visually-driven website for a juice shop. The signature feature is a scroll-driven animation in which an orange juice splash forms a DNA double-helix shape, then settles into a glass. The rest of the site uses a dark, dramatic mood for the hero/transition sections and a light pastel mood for the menu.

> The placeholder shop name is `SITE_NAME` in `src/config/site.ts`. Change it once there; the logo, footer and metadata use that configuration.

## Goals

- Premium, motion-rich landing page that feels fresh and juicy
- Smooth scroll-scrubbed animation (no stutter on mid-range laptops)
- Fast load and good mobile experience
- Easy for the owner to edit menu items and copy

## Tech Stack

- **Next.js** (App Router) + **React** + **TypeScript**
- **Tailwind CSS** for styling
- **GSAP + ScrollTrigger** for scroll animation; **Lenis** for capable desktop devices
- **Three.js**, **@react-three/fiber** and **@react-three/drei** for the real 3D helix
- `next/image` for images; native `<video>` for video

## Getting Started

Requires Node.js 22.19 or newer (Node 24 is validated).

```bash
npm ci
npm run dev      # http://localhost:3000
npm run build
npm run start
```

## Project Structure

```text
src/app/                 # App Router, metadata, fonts, favicon, global design tokens
src/config/site.ts       # shop name, tagline, public URL, order/contact/social details
src/data/flavors.ts      # five menu entries, images, prices
src/data/assets.ts       # generated typed media manifest
src/components/          # Hero, FlavorGrid, Interlude, OrderCTA, Footer, shared motion
src/components/helix/    # pinned wrapper, lazy R3F scene, particle targets, tuning
src/lib/motion-runtime.ts # deferred imports and font/media layout refreshes
assets/                  # committed source media, never served directly
public/images/           # optimized images, posters and blur placeholders
public/video/            # optimized silent MP4s
scripts/                 # asset optimization, favicon, Lighthouse and bundle audits
reports/                 # inventories and reproducible audit results
```

## Assets

Raw originals are committed in `/assets`, including both splash videos moved from the repo root. Run `npm run assets:optimize` to audit and create renamed derivatives in `/public`; originals are never copied there. Import paths, dimensions, blur placeholders and video posters from `src/data/assets.ts`. See `ASSET_AUDIT.md` for the complete inventory, size comparison and findings.

### Images

| Original file (id fragment) | New name | Mood | Use |
|---|---|---|---|
| `Gemini_Generated_Image_n1j0tcn1j0…` | `helix.webp` | Dark | Orange DNA-helix splash on black. Static fallback for the signature 3D section |
| `Gemini_Generated_Image_1bi3f21…` | `splash-teal.webp` | Dark teal | Hero or section background |
| `Gemini_Generated_Image_9vihn49…` | `splash-slices.webp` | Dark teal | Hero or section background |
| `Gemini_Generated_Image_x328w1…` | `splash-dark.webp` | Dark | Order/footer background |
| `Gemini_Generated_Image_68t0ku…` | `flavor-green.webp` | Light pastel | Menu card: green juice |
| `Gemini_Generated_Image_bgnuc5…` | `flavor-lemonade.webp` | Light pastel | Menu card: lemonade |
| `Gemini_Generated_Image_necyyz…` | `flavor-berry.webp` | Light pastel | Menu card: berry |
| `Gemini_Generated_Image_sc78ncs…` | `flavor-watermelon.webp` | Light pastel | Menu card: watermelon |
| `Gemini_Generated_Image_uokuyo…` | `flavor-orange.webp` | Light pastel | Menu card: orange |
| `pexels-roman-odintsov-4958852` | `gallery-1.webp` | Warm, different style | Optional gallery only |
| `pexels-timur-weber-8679377` | `gallery-2.webp` | Warm, different style | Optional gallery only |
| `pexels-umarali07-28053288` | `gallery-3.webp` | Warm, different style | Optional gallery only |

The Pexels photos do not match the Gemini set stylistically. Keep them out of the main flow; use them only in a small gallery/about section, or omit.

### Videos

| Original file | New name | Use |
|---|---|---|
| `62083-502737742_medium` | `hero-pour.mp4` | Hero background loop (juice pouring into glass) |
| `262732_medium` | `interlude-peel.mp4` | Full-bleed interlude between menu and order |
| `Orange_juice_splashing_from_glass_…4114` (vertical) | `splash-vertical.mp4` | Mobile hero / scroll section candidate |
| `Orange_juice_splashing_from_glass_…4123` | `splash-drop.mp4` | Scroll-scrubbed section candidate |
| `Orange_juice_splashing_from_glass_…4159.gif` | `splash-glass.mp4` | Low-resolution animated splash, converted from GIF |

Every video has a `*-poster.webp` and a tiny blur placeholder. `splash-drop.mp4` is the regular playback version; use the separate `splash-drop-scrub.mp4` for scroll scrubbing (960px wide, every frame a keyframe). The GIF is 480 × 270 and is intentionally not upscaled. Image quality starts at 80; backgrounds are at most 1600px wide and cards at most 900px. All regular clips fit below 4 MB.

Credit Pexels contributors if their license/attribution terms require it.

## Page Sections

1. **Hero** — `hero-pour.mp4` looping, muted, with a large headline, short tagline, and a primary "Order now" button. Dark overlay for text contrast.
2. **Helix scroll section** — a real, dynamically loaded R3F scene, pinned for four viewport heights. Instanced droplets splash, assemble into a rotating double helix, then settle into a LatheGeometry glass. One scroll-progress ref drives the scene and three HTML copy beats. Reduced motion, low-power hints and WebGL failures select an unpinned `helix.webp` fallback; reduced motion is fully static.
3. **Flavors** — grid of 5 cards from `src/data/flavors.ts` using the light pastel images. Hover tilt/lift on desktop; swipeable on mobile.
4. **Interlude** — full-bleed `interlude-peel.mp4` with one line of text.
5. **Order / Footer** — dark splash background, contact/order info, social links.

Transition design: dark sections (hero, helix, order) bookend a light section (flavors). Use a smooth color/background transition between them rather than a hard cut.

## Scroll Animation Requirements

- The helix uses GSAP ScrollTrigger with `pin: true` and `scrub: 0.6`; it does not use video footage.
- GSAP/ScrollTrigger and Lenis initialize after first paint. Three/R3F download only when entering the helix. Shared refresh listeners wait for fonts and batch media-load updates.
- The following video-scrubbing guidance applies only to future uses of the supplied scrub clip:
- **Video scrubbing needs all-intra video.** Re-encode any scrubbed video so every frame is a keyframe, otherwise it stutters:
  ```bash
  ffmpeg -i input.mp4 -an -vf "scale=1280:-2" -c:v libx264 -g 1 -crf 23 -pix_fmt yuv420p out.mp4
  ```
  Alternative: export an image sequence (WebP) and draw frames to a `<canvas>` based on scroll progress.
- All videos: `muted`, `playsInline`, `preload="metadata"` (or `auto` for the scrubbed one), with a `poster` image.
- Respect `prefers-reduced-motion`: disable scrubbing/parallax and show static images.
- Clean up ScrollTriggers on unmount (React strict mode safe).

## Performance Budget

- Convert all images to WebP (or AVIF); max ~200 KB each for cards, ~400 KB for hero/backgrounds.
- Videos: H.264 mp4, target under ~4 MB each for loops; scrubbed video can be larger but lazy-load it.
- Lazy-load everything below the fold; only the hero video/poster loads eagerly.
- Lighthouse targets (mobile): Performance 80+, Accessibility 95+, Best Practices 95+. See `reports/SITE_VERIFICATION.md` for measured results and limits.
- No layout shift: set explicit width/height or aspect ratios on all media.

## Design Direction

- Dark sections: near-black background, vivid orange accent, big expressive type.
- Light sections: soft sage/cream background matching the pastel glass photos.
- One display font for headlines, one clean sans for body.
- Generous spacing, large imagery, minimal UI chrome.

## How to edit

- **Shop identity and contact:** edit `SITE_NAME`, `tagline`, `description`, `orderUrl` and `contact` in `src/config/site.ts`. Null order/social URLs display honest placeholders. Supply real prices and business details before launch.
- **Public domain:** copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SITE_URL` to the real HTTPS origin, then rebuild. It supplies absolute Open Graph URLs. Without it, Next.js uses its local metadata fallback; do not publish that configuration.
- **Menu:** edit `src/data/flavors.ts`: `name`, `tagline`, `price`, `image`, `alt` and background `color`. Prices are strings (for example, your actual currency and amount); `null` retains “Price coming soon”. Choose images from the imported `assets` manifest.
- **Section copy:** edit the text in `src/components/Hero.tsx`, `FlavorGrid.tsx`, `Interlude.tsx`, `OrderCTA.tsx` and `Footer.tsx`. Hero's one-line tagline comes from site configuration. The three helix beats are `HELIX_COPY` in `src/components/helix/config.ts`.
- **Helix tuning:** `src/components/helix/config.ts` controls instance counts, stage boundaries, scroll length, scrub smoothing, colors and geometry detail. Material/lighting/camera settings are in `HelixScene.tsx`. See `DEVELOPMENT.md` for defaults and hardware-performance limits.
- **Media:** place originals in `assets/`; keep the unique filename IDs used by `scripts/optimize-assets.mjs`. With Node 22.19+ and ffmpeg/ffprobe installed, run `npm ci` and `npm run assets:optimize`. This regenerates optimized copies, posters, tiny blur placeholders, both manifests, audit reports and the favicon crop derived from `splash-teal.webp`. Do not hand-edit `src/data/assets.ts` or serve originals. If adding/replacing a source ID, update its mapping in the optimizer first.
- **Styles:** edit the Tailwind v4 `@theme` tokens and section styles in `src/app/globals.css`. Fonts are self-hosted through `next/font/local` in `src/app/layout.tsx`.

Verify edits with `npm run lint`, `npm run build` and `npm run test:e2e`. For production audits, start `npm run start -- --port 3200`, then run `npm run audit:mobile` and `npm run bundle:analyze` in another terminal. Override `AUDIT_URL` for another local production server and `CHROME_PATH` for Chromium. Reports are written under `reports/`. A headless mobile audit does not validate physical-phone WebGL FPS or replace a manual keyboard/screen-reader review.

## Tasks for Codex — current state

- [x] Next.js App Router, TypeScript, Tailwind design system and centralized shop configuration.
- [x] Audited originals, optimized images/videos, posters, blur placeholders and typed asset manifest.
- [x] Hero, five-flavor grid/mobile carousel, interlude, order section and footer.
- [x] Real 3D splash → DNA helix → glass scene with responsive quality and static fallbacks.
- [x] Reduced motion, pause control, lazy loading, offscreen playback/rendering pause and resource cleanup.
- [x] Font/media-aware scroll refresh, metadata, Open Graph image, favicon and theme color.
- [x] Lint/build, browser checks, mobile Lighthouse and bundle measurement; see `reports/SITE_VERIFICATION.md` for results and remaining limits.
- [ ] Replace placeholder identity, prices, ordering/contact/social details and configure the production domain.
- [ ] Validate 60fps laptop / 30fps phone targets on physical mid-range devices; cloud software-renderer results do not establish them.

The optional Pexels gallery remains omitted because its warm photography clashes with the pastel flavor images. `ASSET_AUDIT.md` records low-resolution/mismatched-aspect-ratio findings; no corrupt source or incorrect ID was found.

## Acceptance Criteria

- `npm run build` passes with no type or lint errors.
- Helix section scrubs smoothly with scroll and has a working static fallback.
- No horizontal scroll on mobile (375px width).
- All media has alt text or is marked decorative.
- Assets are renamed and optimized; originals are not served from `/public`.

## License / Credits

- Images prefixed `Gemini_Generated_Image_` are AI-generated by the project owner.
- Pexels media: see photographer credits on the original Pexels pages.
