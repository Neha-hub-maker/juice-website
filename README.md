# Juice Shop Website

A dynamic, visually-driven website for a juice shop. The signature feature is a scroll-driven animation in which an orange juice splash forms a DNA double-helix shape, then settles into a glass. The rest of the site uses a dark, dramatic mood for the hero/transition sections and a light pastel mood for the menu.

> Shop name: `TODO` — replace everywhere marked `{{SHOP_NAME}}`.

## Goals

- Premium, motion-rich landing page that feels fresh and juicy
- Smooth scroll-scrubbed animation (no stutter on mid-range laptops)
- Fast load and good mobile experience
- Easy for the owner to edit menu items and copy

## Tech Stack

- **Next.js** (App Router) + **React** + **TypeScript**
- **Tailwind CSS** for styling
- **GSAP + ScrollTrigger** for scroll animation (optional: **Lenis** for smooth scrolling)
- `next/image` for images; native `<video>` for video

## Getting Started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run start
```

## Project Structure (target)

```
/app
  layout.tsx
  page.tsx
/components
  Hero.tsx
  HelixScroll.tsx      # scroll-scrubbed signature section
  FlavorGrid.tsx
  Interlude.tsx
  OrderCTA.tsx
  Footer.tsx
/data
  flavors.ts           # menu items (name, tagline, price, image)
/public
  /images              # optimized WebP images (renamed, see below)
  /video               # optimized mp4 videos (renamed, see below)
README.md
```

## Assets

Raw assets are in the repo root or `/assets-raw` with their original long names. **Rename and optimize them into `/public`** using the mapping below (match by the unique id fragment in the original file name; names may be slightly truncated).

### Images

| Original file (id fragment) | New name | Mood | Use |
|---|---|---|---|
| `Gemini_Generated_Image_n1j0tcn1j0…` | `helix.webp` | Dark | Orange DNA-helix splash on black. Signature section, poster for helix video |
| `Gemini_Generated_Image_1bi3f21…` | `splash-glass-blue.webp` | Dark teal | Hero or section background |
| `Gemini_Generated_Image_9vihn49…` | `splash-orange-slices.webp` | Dark teal | Hero or section background |
| `Gemini_Generated_Image_x328w1…` | `splash-dark.webp` | Dark | Order/footer background |
| `Orange_juice_splashing_from_glass_…4159` (image) | `splash-glass.webp` | Dark | Background / OG image |
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

Credit Pexels contributors if their license/attribution terms require it.

## Page Sections

1. **Hero** — `hero-pour.mp4` looping, muted, with a large headline, short tagline, and a primary "Order now" button. Dark overlay for text contrast.
2. **Helix scroll section** — pinned section. As the user scrolls, the splash/helix animation plays (scrubbed to scroll progress), then resolves into a glass with a short line of copy. Falls back to the static `helix.webp` with a subtle parallax/rotate if video scrubbing is unavailable (reduced motion, low-power devices).
3. **Flavors** — grid of 5 cards from `/data/flavors.ts` using the light pastel images. Hover tilt/lift on desktop; swipeable on mobile.
4. **Interlude** — full-bleed `interlude-peel.mp4` with one line of text.
5. **Order / Footer** — dark splash background, contact/order info, social links.

Transition design: dark sections (hero, helix, order) bookend a light section (flavors). Use a smooth color/background transition between them rather than a hard cut.

## Scroll Animation Requirements

- Use GSAP ScrollTrigger with `pin: true` and `scrub` (smoothing ~0.5).
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
- Lighthouse targets (mobile): Performance 80+, Accessibility 95+.
- No layout shift: set explicit width/height or aspect ratios on all media.

## Design Direction

- Dark sections: near-black background, vivid orange accent, big expressive type.
- Light sections: soft sage/cream background matching the pastel glass photos.
- One display font for headlines, one clean sans for body.
- Generous spacing, large imagery, minimal UI chrome.

## Tasks for Codex

Please inspect the repo and:

1. Scaffold the Next.js + Tailwind + GSAP project if it does not exist yet.
2. Write a script (`scripts/optimize-assets.sh` or Node) that renames, converts, and compresses the raw assets into `/public/images` and `/public/video` per the tables above.
3. Build the sections listed above, starting with Hero and the Helix scroll section.
4. Implement `/data/flavors.ts` with the 5 flavors and wire up `FlavorGrid`.
5. Add the reduced-motion and mobile fallbacks.
6. Run `npm run build` and `npm run lint` and fix issues.
7. Report anything in the assets that looks wrong (corrupt files, missing files, mismatched ids).

## Acceptance Criteria

- `npm run build` passes with no type or lint errors.
- Helix section scrubs smoothly with scroll and has a working static fallback.
- No horizontal scroll on mobile (375px width).
- All media has alt text or is marked decorative.
- Assets are renamed and optimized; originals are not served from `/public`.

## License / Credits

- Images prefixed `Gemini_Generated_Image_` are AI-generated by the project owner.
- Pexels media: see photographer credits on the original Pexels pages.
