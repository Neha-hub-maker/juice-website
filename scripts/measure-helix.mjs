import { chromium, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";

// Start a production server first. This records actual instanced draw submissions,
// rather than treating an idle requestAnimationFrame loop as rendered scene FPS.
const baseURL = process.env.HELIX_BENCH_URL || "http://127.0.0.1:3100";
const software = process.env.HELIX_SOFTWARE_RENDERING === "1";
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
  headless: process.env.HELIX_HEADED !== "1",
  args: ["--no-sandbox", ...(software ? ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] : [])],
});
const results = [];
try {
  for (const [width, height, deviceScaleFactor] of [[1440, 960, 1], [375, 812, 3]]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor, reducedMotion: "no-preference" });
    await page.addInitScript(() => {
      // Exercise both rendering tiers even on the cloud machine's weak-device hints.
      Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 8 });
      Object.defineProperty(navigator, "deviceMemory", { get: () => 8 });
      window.helixSample = { recording: false, times: [], instances: 0 };
      const original = WebGL2RenderingContext.prototype.drawElementsInstanced;
      WebGL2RenderingContext.prototype.drawElementsInstanced = function (...args) {
        if (window.helixSample.recording && this.canvas.closest(".helix-visual")) {
          window.helixSample.times.push(performance.now());
          window.helixSample.instances = args[4];
        }
        return original.apply(this, args);
      };
    });
    await page.goto(baseURL);
    await expect(page.locator("#ritual")).toHaveAttribute("data-enhanced", "true");
    await expect(page.locator("#ritual .pin-spacer")).toHaveCount(1);
    await expect(page.locator("#ritual")).toHaveAttribute("data-scene-ready", "true");
    await page.evaluate(() => {
      const start = document.getElementById("ritual").getBoundingClientRect().top + scrollY - document.querySelector("header").offsetHeight;
      const range = document.getElementById("ritual").offsetHeight - document.querySelector(".helix-stage").offsetHeight;
      window.scrollTo({ top: start + range * .3, behavior: "instant" });
    });
    await expect.poll(() => page.locator(".helix-progress-fill").evaluate(e => Number(e.style.transform.slice(7, -1))), { timeout: 20000 }).toBeCloseTo(.3, 2);
    const sample = await page.evaluate(async () => {
      const canvas = document.querySelector("#ritual canvas");
      const gl = canvas.getContext("webgl2");
      const debug = gl.getExtension("WEBGL_debug_renderer_info");
      const renderer = gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER);
      const sectionStart = document.getElementById("ritual").getBoundingClientRect().top + scrollY - document.querySelector("header").offsetHeight;
      const range = document.getElementById("ritual").offsetHeight - document.querySelector(".helix-stage").offsetHeight;
      const started = performance.now();
      window.helixSample.recording = true;
      await new Promise(resolve => {
        const tick = () => {
          const elapsed = performance.now() - started;
          window.scrollTo({ top: sectionStart + range * (.3 + .52 * Math.min(1, elapsed / 8000)), behavior: "instant" });
          if (elapsed < 8000) requestAnimationFrame(tick);
          else resolve();
        };
        requestAnimationFrame(tick);
      });
      window.helixSample.recording = false;
      const elapsed = performance.now() - started;
      const { times, instances } = window.helixSample;
      const intervals = times.slice(1).map((time, i) => time - times[i]).sort((a, b) => a - b);
      return { renderer, instances, renderedDpr: canvas.width / canvas.clientWidth,
        sampleSeconds: elapsed / 1000, drawFrames: times.length, observedFps: times.length * 1000 / elapsed,
        p95FrameIntervalMs: intervals[Math.floor(intervals.length * .95)] ?? null };
    });
    results.push({ viewport: { width, height }, deviceScaleFactor, ...sample });
    console.log(JSON.stringify(results.at(-1), null, 2));
    await page.close();
  }
  await mkdir("reports", { recursive: true });
  await writeFile("reports/helix-performance.json", JSON.stringify({
    measuredAt: new Date().toISOString(), browser: browser.version(), softwareRenderingRequested: software,
    methodology: "Production build; continuous scroll from 30% to 82% over eight seconds. Count actual instanced WebGL draw submissions. Device hints overridden to exercise both quality tiers. This is a cloud browser measurement, not a hardware phone/laptop benchmark.",
    results,
  }, null, 2) + "\n");
} finally {
  await browser.close();
}
