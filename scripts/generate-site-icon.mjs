import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// The favicon is a small crop of supplied media, never a raw original.
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { assets } = JSON.parse(await readFile(join(root, "public/asset-manifest.json"), "utf8"));
const png = await sharp(join(root, "public", assets.splashTeal.path.slice(1)))
  .resize(64, 64, { fit: "cover", position: "centre" }).ensureAlpha().png({ compressionLevel: 9 }).toBuffer();
// ICO supports a PNG-compressed image; keep a standard 64px/32-bit directory entry.
const header = Buffer.alloc(22);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header[6] = 64;
header[7] = 64;
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(png.length, 14);
header.writeUInt32LE(header.length, 18);
await writeFile(join(root, "src/app/favicon.ico"), Buffer.concat([header, png]));
