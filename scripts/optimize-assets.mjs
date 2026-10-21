import { readdir, mkdir, stat, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import sharp from "sharp";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = join(root, "assets");
const images = join(root, "public/images");
const videos = join(root, "public/video");
await mkdir(images, { recursive: true });
await mkdir(videos, { recursive: true });
const files = await readdir(source);
const find = (fragment) => {
  const matches = files.filter((name) => name.includes(fragment));
  if (matches.length !== 1) throw new Error(`Expected one source for ${fragment}, found ${matches.length}`);
  return join(source, matches[0]);
};
const mapping = [
  ["n1j0tc", "helix", 1440, 400000],
  ["1bi3f21", "splash-glass-blue", 1600, 400000],
  ["9vihn49", "splash-orange-slices", 1600, 400000],
  ["x328w1", "splash-dark", 1600, 400000],
  ["68t0ku", "flavor-green", 800, 200000],
  ["bgnuc5", "flavor-lemonade", 1000, 200000],
  ["necyyz", "flavor-berry", 800, 200000],
  ["sc78nc", "flavor-watermelon", 800, 200000],
  ["uokuyo", "flavor-orange", 800, 200000],
  ["4958852", "gallery-1", 1000, 200000],
  ["8679377", "gallery-2", 1000, 200000],
  ["28053288", "gallery-3", 1000, 200000],
  ["024159", "splash-glass", 480, 400000],
];
const report = [];
for (const [fragment, name, width, limit] of mapping) {
  const path = join(images, `${name}.webp`);
  // GIF inputs intentionally extract the first frame for the static poster.
  let buffer;
  for (const quality of [82, 74, 66, 58]) {
    buffer = await sharp(find(fragment), { animated: false }).rotate().resize({ width, withoutEnlargement: true }).webp({ quality }).toBuffer();
    if (buffer.length < limit) break;
  }
  if (buffer.length >= limit) throw new Error(`${name} exceeds ${limit} bytes`);
  await writeFile(path, buffer);
  report.push({ file: `images/${name}.webp`, bytes: buffer.length });
}

const encode = (fragment, name, width, scrub = false) => {
  const path = join(videos, `${name}.mp4`);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", find(fragment), "-an", "-vf", `scale=${width}:-2`, "-c:v", "libx264", "-threads", "2", "-preset", "slow", "-crf", scrub ? "25" : "26", ...(scrub ? ["-g", "1"] : ["-maxrate", "2200k", "-bufsize", "2200k"]), "-pix_fmt", "yuv420p", "-movflags", "+faststart", path], { stdio: "inherit" });
  return path;
};
for (const [fragment, name, width, scrub] of [
  ["62083-", "hero-pour", 1280, false],
  ["262732_", "interlude-peel", 1280, false],
  ["024114", "splash-vertical", 540, true],
  ["024123", "splash-drop", 960, true],
]) {
  const path = encode(fragment, name, width, scrub);
  const bytes = (await stat(path)).size;
  if (!scrub && bytes >= 4000000) throw new Error(`${name} exceeds loop budget`);
  report.push({ file: `video/${name}.mp4`, bytes, allIntra: scrub });
}
for (const [fragment, name, second] of [
  ["62083-", "hero-poster", 5], ["262732_", "interlude-poster", 2],
]) {
  const path = join(images, `${name}.webp`);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", String(second), "-i", find(fragment), "-frames:v", "1", "-vf", "scale=1280:-2", "-quality", "80", path], { stdio: "inherit" });
  const bytes = (await stat(path)).size;
  if (bytes >= 400000) throw new Error(`${name} exceeds background budget`);
  report.push({ file: `images/${name}.webp`, bytes });
}
await writeFile(resolve(root, "public/asset-manifest.json"), JSON.stringify(report, null, 2) + "\n");
console.table(report);
