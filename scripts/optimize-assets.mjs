import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdir, mkdir, stat, readFile, writeFile, copyFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = fileURLToPath(new URL("../", import.meta.url));
const originals = join(root, "assets");
const publicRoot = join(root, "public");
const imageJobs = [
  ["helix", "n1j0tcn1j0", "helix", "background"],
  ["splashTeal", "1bi3f21", "splash-teal", "background"],
  ["splashSlices", "9vihn49", "splash-slices", "background"],
  ["splashDark", "x328w1", "splash-dark", "background"],
  ["flavorGreen", "68t0ku", "flavor-green", "card"],
  ["flavorLemonade", "bgnuc5", "flavor-lemonade", "card"],
  ["flavorBerry", "necyyz", "flavor-berry", "card"],
  ["flavorWatermelon", "sc78ncs", "flavor-watermelon", "card"],
  ["flavorOrange", "uokuyo", "flavor-orange", "card"],
  ["gallery1", "pexels-roman-odintsov-4958852", "gallery-1", "card"],
  ["gallery2", "pexels-timur-weber-8679377", "gallery-2", "card"],
  ["gallery3", "pexels-umarali07-28053288", "gallery-3", "card"],
];
const videoJobs = [
  ["heroPour", "62083-502737742_medium", "hero-pour", false, 5],
  ["interludePeel", "262732_medium", "interlude-peel", false, 2],
  ["splashVertical", "20261013024114", "splash-vertical", false, 2],
  ["splashDrop", "20261013024123", "splash-drop", false, 2],
  ["splashGlass", "20261013024159", "splash-glass", false, 2],
  ["splashDropScrub", "20261013024123", "splash-drop-scrub", true, 2],
];
const command = (program, args) => execFileSync(program, args, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
const probe = (path) => JSON.parse(command("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", path]));
const decodeVideo = (path) => command("ffmpeg", ["-v", "error", "-xerror", "-err_detect", "explode", "-i", path, "-map", "0:v:0", "-an", "-f", "null", "-"]);
const mb = (bytes) => `${(bytes / 1_000_000).toFixed(3)} MB`;
const dimension = (item) => item.width ? `${item.width} × ${item.height}` : "—";

for (const program of ["ffmpeg", "ffprobe"]) command(program, ["-version"]);
const files = await readdir(originals, { withFileTypes: true });
const inventory = [];
for (const file of files.sort((a, b) => a.name.localeCompare(b.name, "en"))) {
  if (!file.isFile()) throw new Error(`Unexpected directory or symlink in assets: ${file.name}`);
  const path = join(originals, file.name);
  const bytes = await readFile(path);
  const item = { file: file.name, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex"), type: "other", width: null, height: null, duration: null, flags: [] };
  if (/\.(jpe?g|png|webp|avif)$/i.test(file.name)) {
    const metadata = await sharp(path).metadata();
    await sharp(path).stats(); // Fully decode, rather than trusting only the header or extension.
    Object.assign(item, { type: metadata.format, width: metadata.width, height: metadata.height });
  } else if (/\.(mp4|gif)$/i.test(file.name)) {
    const info = probe(path);
    const stream = info.streams.find((entry) => entry.codec_type === "video");
    if (!stream) throw new Error(`No video stream: ${file.name}`);
    decodeVideo(path);
    Object.assign(item, { type: stream.codec_name === "gif" ? "gif (animated)" : `mp4 (${stream.codec_name})`, width: stream.width, height: stream.height, duration: Number(info.format.duration ?? stream.duration) });
    if (!Number.isFinite(item.duration) || item.duration <= 0) throw new Error(`Invalid duration: ${file.name}`);
    if (Math.min(item.width, item.height) < 480) item.flags.push("Low resolution; keep native dimensions and do not upscale.");
    if (stream.codec_name === "gif") item.flags.push("Animated GIF, not a still image as described in README; converted to MP4 and poster.");
  } else {
    item.flags.push(file.name === ".keep" ? "Repository marker; not media." : "Unknown file type; inspect manually.");
  }
  inventory.push(item);
}
const find = (fragment) => {
  const found = inventory.filter((item) => item.file.includes(fragment));
  if (found.length !== 1) throw new Error(`Expected one source matching ${fragment}, found ${found.length}`);
  return found[0];
};
const matched = new Set();
for (const [, fragment, , kind] of imageJobs) {
  const item = find(fragment);
  if (item.type !== "jpeg") throw new Error(`ID/type mismatch for image ${fragment}: ${item.type}`);
  if (kind === "card" && item.file.includes("bgnuc5")) item.flags.push("Landscape lemonade image; the other flavor images are square. Choose card crops deliberately.");
  matched.add(item.file);
}
for (const [, fragment] of videoJobs) {
  const item = find(fragment);
  const expected = fragment.endsWith("4159") ? "gif (animated)" : "mp4 (h264)";
  if (item.type !== expected) throw new Error(`ID/type mismatch for ${fragment}: expected ${expected}, found ${item.type}`);
  matched.add(item.file);
}
for (const item of inventory) if (!matched.has(item.file) && item.file !== ".keep") item.flags.push("Not mapped to a requested output.");

const staging = await mkdtemp(join(tmpdir(), "juice-media-"));
const outputs = new Set();
const manifest = {};
const outputPath = async (relative) => {
  const path = join(staging, relative);
  await mkdir(join(path, ".."), { recursive: true });
  outputs.add(relative);
  return path;
};

async function encodeImage(input, name, width, budget) {
  let result;
  let quality;
  for (quality of [80, 76, 72, 68]) {
    result = await sharp(input).rotate().resize({ width, withoutEnlargement: true }).webp({ quality, effort: 5 }).toBuffer({ resolveWithObject: true });
    if (result.data.length < budget) break;
  }
  if (result.data.length >= budget) throw new Error(`${name} exceeds ${budget} bytes after optimization`);
  const relative = `images/${name}.webp`;
  await writeFile(await outputPath(relative), result.data);
  const tiny = await sharp(result.data).resize({ width: 20, withoutEnlargement: true }).blur(1).webp({ quality: 35 }).toBuffer();
  const blurPath = `images/placeholders/${name}.webp`;
  await writeFile(await outputPath(blurPath), tiny);
  return { path: `/${relative}`, width: result.info.width, height: result.info.height, bytes: result.data.length, blurDataURL: `data:image/webp;base64,${tiny.toString("base64")}`, blurPath: `/${blurPath}`, quality };
}

function isFastStart(buffer) {
  let moov = -1;
  let mdat = -1;
  for (let offset = 0; offset + 8 <= buffer.length;) {
    let size = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    if (size === 1) size = Number(buffer.readBigUInt64BE(offset + 8));
    if (type === "moov") moov = offset;
    if (type === "mdat") mdat = offset;
    if (size < 8) break;
    offset += size;
  }
  return moov >= 0 && mdat >= 0 && moov < mdat;
}

try {
  for (const [key, fragment, name, kind] of imageJobs) {
    const item = find(fragment);
    const optimized = await encodeImage(join(originals, item.file), name, kind === "card" ? 900 : 1600, kind === "card" ? 200_000 : 400_000);
    manifest[key] = { kind: "image", ...optimized, poster: null, source: item.file };
  }
  for (const [key, fragment, name, scrub, posterTime] of videoJobs) {
    const item = find(fragment);
    const relative = `video/${name}.mp4`;
    const destination = await outputPath(relative);
    const maxWidth = scrub ? 960 : Math.min(1280, item.width);
    if (scrub && item.width < 960) throw new Error(`${name}: cannot create 960px output without upscaling`);
    const candidates = scrub ? [[960, 25]] : [[maxWidth, 26], [maxWidth, 29], [Math.min(maxWidth, 960), 29], [Math.min(maxWidth, 720), 31], [Math.min(maxWidth, 640), 33]];
    let bytes;
    let settings;
    // A single encoder thread avoids VBV scheduling differences between repeated runs.
    const maxRate = Math.min(2200, Math.floor(4_000_000 * 8 * .85 / item.duration / 1000));
    for (const [width, crf] of candidates) {
      command("ffmpeg", ["-v", "error", "-y", "-i", join(originals, item.file), "-map", "0:v:0", "-map_metadata", "-1", "-an", "-vf", `scale=${Math.floor(width / 2) * 2}:-2`, "-c:v", "libx264", "-threads", "1", "-preset", "slow", "-crf", String(crf), ...(scrub ? ["-g", "1", "-keyint_min", "1", "-sc_threshold", "0"] : ["-maxrate", `${maxRate}k`, "-bufsize", `${maxRate}k`]), "-pix_fmt", "yuv420p", "-movflags", "+faststart", destination]);
      bytes = (await stat(destination)).size;
      settings = { crf };
      if (scrub || bytes < 4_000_000) break;
    }
    if (!scrub && bytes >= 4_000_000) throw new Error(`${name} still exceeds the loop budget`);
    const info = probe(destination);
    const stream = info.streams.find((entry) => entry.codec_type === "video");
    if (stream.codec_name !== "h264" || stream.pix_fmt !== "yuv420p" || info.streams.some((entry) => entry.codec_type === "audio")) throw new Error(`Invalid output format: ${name}`);
    if (stream.width > (scrub ? 960 : 1280) || !isFastStart(await readFile(destination))) throw new Error(`Invalid width or missing faststart: ${name}`);
    decodeVideo(destination);
    if (scrub) {
      const { frames } = JSON.parse(command("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_frames", "-show_entries", "frame=key_frame", "-of", "json", destination]));
      if (!frames.length || frames.some((frame) => frame.key_frame !== 1)) throw new Error(`${name}: not every frame is a keyframe`);
    }
    const frame = join(staging, `${name}-frame.png`);
    command("ffmpeg", ["-v", "error", "-y", "-ss", String(Math.min(posterTime, item.duration / 2)), "-i", destination, "-frames:v", "1", frame]);
    const poster = await encodeImage(frame, `${name}-poster`, stream.width, 400_000);
    manifest[key] = { kind: "video", path: `/${relative}`, width: stream.width, height: stream.height, bytes, duration: Number(info.format.duration), allIntra: scrub, blurDataURL: poster.blurDataURL, blurPath: poster.blurPath, poster: poster.path, posterBytes: poster.bytes, crf: settings.crf, source: item.file };
  }
  let previous = [];
  try {
    const old = JSON.parse(await readFile(join(publicRoot, "asset-manifest.json"), "utf8"));
    previous = Array.isArray(old) ? old.map((entry) => entry.file) : old.generatedFiles ?? [];
  } catch (error) { if (error.code !== "ENOENT") throw error; }
  for (const relative of previous) if (!/^(images|video)\/(?:placeholders\/)?[a-z0-9-]+\.(webp|mp4)$/.test(relative)) throw new Error(`Unsafe old manifest path: ${relative}`);
  for (const relative of outputs) {
    const target = join(publicRoot, relative);
    await mkdir(join(target, ".."), { recursive: true });
    await copyFile(join(staging, relative), target);
  }
  // Remove only stale generated files, never unrelated files or originals.
  for (const relative of previous) if (!outputs.has(relative)) await rm(join(publicRoot, relative), { force: true });
  const types = `// Generated by npm run assets:optimize. Do not edit paths or blur data manually.\nexport type ImagePath = \`/images/\${string}.webp\`;\nexport type VideoPath = \`/video/\${string}.mp4\`;\nexport type BlurDataURL = \`data:image/webp;base64,\${string}\`;\n\ninterface AssetBase {\n  width: number;\n  height: number;\n  bytes: number;\n  source: string;\n  blurDataURL: BlurDataURL;\n  blurPath: ImagePath;\n}\nexport interface ImageAsset extends AssetBase {\n  kind: "image";\n  path: ImagePath;\n  poster: null;\n  quality: number;\n}\nexport interface VideoAsset extends AssetBase {\n  kind: "video";\n  path: VideoPath;\n  poster: ImagePath;\n  posterBytes: number;\n  duration: number;\n  allIntra: boolean;\n  crf: number;\n}\nexport type MediaAsset = ImageAsset | VideoAsset;\n\nexport const assets = ${JSON.stringify(manifest, null, 2)} as const satisfies Record<string, MediaAsset>;\n\nexport type AssetName = keyof typeof assets;\n`;
  await mkdir(join(root, "src/data"), { recursive: true });
  await writeFile(join(root, "src/data/assets.ts"), types);
  await writeFile(join(publicRoot, "asset-manifest.json"), JSON.stringify({ schemaVersion: 2, assets: manifest, generatedFiles: [...outputs].sort() }, null, 2) + "\n");
  const audit = [
    "# Asset audit", "", "Generated by `npm run assets:optimize`. Sizes use decimal MB. Every original was fully decoded; SHA-256 source hashes are recorded in `reports/assets-audit.json`.", "", "## Original inventory", "", "| Original file | Type | Dimensions | Duration | Size |", "|---|---|---|---|---|",
    ...inventory.map((item) => `| ${item.file} | ${item.type} | ${dimension(item)} | ${item.duration ? `${item.duration.toFixed(3)} s` : "—"} | ${item.bytes === 1 ? "1 byte" : mb(item.bytes)} |`),
    "", "## Original versus optimized", "", "Every image and video poster has a 20px WebP placeholder in `public/images/placeholders/` and an embedded blurDataURL in the typed manifest. Posters and placeholders are additional to the main optimized sizes below.", "", "| Output | Original | Optimized | Reduction | Dimensions | Poster |", "|---|---|---|---|---|---|",
    ...Object.values(manifest).map((asset) => {
      const original = inventory.find((item) => item.file === asset.source);
      return `| ${asset.path} | ${mb(original.bytes)} | ${mb(asset.bytes)} | ${(100 * (1 - asset.bytes / original.bytes)).toFixed(1)}% | ${dimension(asset)} | ${asset.kind === "video" ? `${asset.poster} (${mb(asset.posterBytes)})` : "—"} |`;
    }),
    "", "## Findings", "", "- No corrupt files, duplicate ID matches or ID/type mismatches were found. All output videos passed full decoding, H.264/yuv420p/no-audio checks and moov-before-mdat faststart validation. The scrub clip was checked frame by frame: every frame is a keyframe.",
    ...inventory.flatMap((item) => item.flags.map((flag) => `- **${item.file}:** ${flag}`)),
    "- No supplied video contains the complete DNA helix formation and continuous resolution into a glass. The helix still is present; the splash clips are separate footage.",
    "- Pexels gallery images are optional and stylistically different. Retain source credits and confirm applicable license terms before publication.",
    `- ${inventory.some((item) => item.bytes > 50_000_000) ? "An original exceeds 50 MB; /assets should be ignored and original-asset storage arranged." : "No original exceeds 50 MB. Keep assets committed; /assets was not added to .gitignore."}`,
    "- WebP quality starts at 80 and decreases only if a size budget requires it. Backgrounds are at most 1600px wide; cards and optional gallery images at most 900px. Sources are never upscaled.",
    "- Regular videos are at most 1280px wide and under 4 MB. Encoding starts at CRF 26 and increases CRF (reduces quality) or decreases resolution if needed. The separate scrub clip is exactly 960px wide with -g 1.", "",
  ].join("\n");
  await mkdir(join(root, "reports"), { recursive: true });
  await writeFile(join(root, "reports/assets-audit.json"), JSON.stringify({ inventory, assets: manifest }, null, 2) + "\n");
  await writeFile(join(root, "ASSET_AUDIT.md"), audit);
  console.table(inventory.map((item) => ({ original: item.file, type: item.type, dimensions: dimension(item), duration: item.duration, size: mb(item.bytes) })));
  console.table(Object.values(manifest).map((asset) => ({ output: asset.path, size: mb(asset.bytes), dimensions: dimension(asset), allIntra: asset.kind === "video" ? asset.allIntra : "—" })));
  console.log("Media, typed manifest and ASSET_AUDIT.md validated and generated.");
} finally {
  await rm(staging, { recursive: true, force: true });
}
