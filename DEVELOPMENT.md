# Development

Requires Node.js 22 or newer (validated with Node 24), npm, and ffmpeg when regenerating media.

```sh
npm ci
npm run assets:optimize # only after changing assets; outputs are committed
npm run dev
```

Check each implementation step with `npm run lint` and `npm run build` before committing.
Use `npm run start` to serve the production build.

The original media lives in `assets/`. The optimization script creates renamed WebP images, silent H.264 loops, all-intra splash clips, and video posters. It checks the image and loop size budgets. It extracts the GIF's first frame as a still poster. Nothing serves original files from `assets/`.

Edit the shop name, tagline and contact information in `src/config/site.ts`. Contact and ordering links stay unavailable until real details are supplied. Menu copy is editable in `src/data/flavors.ts`; prices need owner confirmation.

No provided clip shows the complete DNA helix forming and resolving into a glass. The supplied helix image is the source for the 3D presentation and static fallback; the supplied splash footage can be shown as a separate transition, without claiming it is a fluid simulation.

The Pexels gallery images are optimized but intentionally omitted from the main page because their visual style differs. System serif and sans fonts avoid loading additional font assets.
