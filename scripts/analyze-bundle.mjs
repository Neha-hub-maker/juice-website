import { chromium, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { gzipSync, brotliCompressSync } from "node:zlib";

const chunks = await Promise.all((await readdir(".next/static/chunks")).filter(file => file.endsWith(".js")).map(async file => {
  const data = await readFile(`.next/static/chunks/${file}`);
  return { path: `/_next/static/chunks/${file}`, rawBytes: data.length,
    gzipBytes: gzipSync(data).length, brotliBytes: brotliCompressSync(data).length,
    contains3D: /THREE\.WebGLRenderer|R3F:/.test(data.toString()),
    containsScrollTrigger: data.includes(Buffer.from("ScrollTrigger")),
    containsLenis: data.includes(Buffer.from("lenisVersion")),
  };
}));
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
  args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const baseURL = process.env.AUDIT_URL || "http://127.0.0.1:3200";
try {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 8 });
    Object.defineProperty(navigator, "deviceMemory", { get: () => 8 });
  });
  const requested = new Set();
  page.on("request", request => { const path = new URL(request.url()).pathname; if (path.endsWith(".js")) requested.add(path); });
  const response = await page.goto(baseURL);
  const html = await response.text();
  const entryPaths = [...html.matchAll(/<script\b([^>]*)>/gi)].flatMap(([, attributes]) => {
    if (/\bnomodule\b/i.test(attributes)) return [];
    const src = attributes.match(/\bsrc="([^"]+)"/i)?.[1];
    return src ? [new URL(src, baseURL).pathname] : [];
  });
  await expect(page.locator("#ritual .pin-spacer")).toHaveCount(1);
  await page.waitForLoadState("networkidle");
  const heroPaths = [...requested];
  await expect(page.locator("#ritual canvas")).toHaveCount(0);
  await page.locator(".helix-stage").scrollIntoViewIfNeeded();
  await expect(page.locator("#ritual")).toHaveAttribute("data-scene-ready", "true");
  await page.waitForLoadState("networkidle");
  const helixPaths = [...requested].filter(path => !heroPaths.includes(path));
  const summarize = paths => {
    const selected = chunks.filter(chunk => paths.includes(chunk.path));
    return { rawBytes: selected.reduce((sum, chunk) => sum + chunk.rawBytes, 0),
      gzipBytes: selected.reduce((sum, chunk) => sum + chunk.gzipBytes, 0),
      brotliBytes: selected.reduce((sum, chunk) => sum + chunk.brotliBytes, 0), chunks: selected.map(chunk => chunk.path) };
  };
  const threeChunks = chunks.filter(chunk => chunk.contains3D);
  const threeAbsentFromHero = threeChunks.every(chunk => !heroPaths.includes(chunk.path));
  const threeLoadedAtHelix = threeChunks.every(chunk => helixPaths.includes(chunk.path));
  if (!threeChunks.length || !threeAbsentFromHero || !threeLoadedAtHelix) throw new Error("3D loading boundary verification failed");
  const report = { measuredAt: new Date().toISOString(), browser: browser.version(),
    method: "Production chunk sizes; gzip/brotli estimates at default Node compression levels. Observe mobile requests before/after entering helix; high-capability hints force the 3D tier. These are compressed-size estimates, not network transfer timings.",
    entry: summarize(entryPaths), heroAfterDeferredMotion: summarize(heroPaths), helixAdditional: summarize(helixPaths),
    threeAbsentFromHero, threeLoadedAtHelix, chunks,
  };
  await mkdir("reports", { recursive: true });
  await writeFile("reports/bundle-analysis.json", JSON.stringify(report, null, 2) + "\n");
  console.table(["entry", "heroAfterDeferredMotion", "helixAdditional"].map(key => ({ phase: key,
    rawKiB: (report[key].rawBytes / 1024).toFixed(1), gzipKiB: (report[key].gzipBytes / 1024).toFixed(1), brotliKiB: (report[key].brotliBytes / 1024).toFixed(1) })));
  console.log("Three/R3F are absent from hero requests and load when entering the helix.");
} finally { await browser.close(); }
