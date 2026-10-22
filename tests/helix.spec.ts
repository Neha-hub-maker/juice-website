import { expect, test, type Page } from "@playwright/test";
import { HELIX } from "../src/components/helix/config";

declare global {
  interface Window { helixDraws: { time: number; instances: number }[] }
}

async function prepare(page: Page) {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 8 });
    Object.defineProperty(navigator, "deviceMemory", { get: () => 8 });
    window.helixDraws = [];
    const draw = WebGL2RenderingContext.prototype.drawElementsInstanced;
    WebGL2RenderingContext.prototype.drawElementsInstanced = function (...args) {
      if ((this.canvas as HTMLCanvasElement).closest(".helix-visual")) {
        window.helixDraws.push({ time: performance.now(), instances: args[4] });
      }
      return draw.apply(this, args);
    };
  });
  await page.goto("/");
  await expect(page.locator("#ritual")).toHaveAttribute("data-enhanced", "true");
  await expect(page.locator("#ritual .pin-spacer")).toHaveCount(1);
  await page.locator(".helix-stage").scrollIntoViewIfNeeded();
  await expect(page.locator("#ritual")).toHaveAttribute("data-scene-ready", "true");
}

async function scrollToProgress(page: Page, progress: number) {
  await page.evaluate(({ progress, screens }) => {
    const section = document.getElementById("ritual")!;
    const header = document.querySelector("header")!.offsetHeight;
    const start = section.getBoundingClientRect().top + scrollY - header;
    window.scrollTo({ top: start + innerHeight * screens * progress, behavior: "instant" });
  }, { progress, screens: HELIX.scrollScreens });
}

test("desktop liquid scrubs forward and backward with pinned text beats", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await prepare(page);
  for (const [progress, beat] of [[.12, 0], [.7, 1], [.98, 2], [.1, 0]]) {
    await scrollToProgress(page, progress);
    await expect(page.locator(".helix-beat").nth(beat)).toHaveCSS("opacity", "1");
    await expect.poll(() => page.locator(".helix-stage").evaluate(e =>
      e.getBoundingClientRect().top - document.querySelector("header")!.getBoundingClientRect().height
    )).toBeCloseTo(0, 0);
  }
  await expect.poll(() => page.evaluate(() => window.helixDraws.at(-1)?.instances)).toBe(1200);
  await expect(page.locator("#ritual .pin-spacer")).toHaveCount(1);
  await expect(page.locator("#ritual canvas")).toHaveCount(1);
  expect(await page.locator("#ritual canvas").evaluate(e => (e as HTMLCanvasElement).width / e.clientWidth)).toBeLessThanOrEqual(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);
  expect(errors).toEqual([]);
});

test("demand rendering stops offscreen and motion toggles remove pins and WebGL", async ({ page }) => {
  await prepare(page);
  await scrollToProgress(page, .7);
  await expect(page.locator(".helix-beat").nth(1)).toHaveCSS("opacity", "1");
  await page.getByRole("link", { name: "Flavors", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Find your.*bright side/ })).toBeInViewport();
  await expect(page.locator("#ritual")).not.toBeInViewport();
  // Let the last scrub tween and intersection observation finish before sampling.
  await page.waitForTimeout(1200);
  const frames = await page.evaluate(() => window.helixDraws.length);
  await page.waitForTimeout(700);
  expect(await page.evaluate(() => window.helixDraws.length)).toBe(frames);
  for (let i = 0; i < 2; i++) {
    await page.getByRole("button", { name: "Pause motion", exact: true }).click();
    await expect(page.locator("#ritual canvas, #ritual .pin-spacer")).toHaveCount(0);
    await expect(page.locator("#ritual")).toHaveAttribute("data-enhanced", "false");
    for (const beat of await page.locator(".helix-beat").all()) await expect(beat).toHaveCSS("opacity", "1");
    await page.getByRole("button", { name: "Resume motion", exact: true }).click();
    await expect(page.locator("#ritual canvas")).toHaveCount(1);
    await expect(page.locator("#ritual .pin-spacer")).toHaveCount(1);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("#ritual canvas, #ritual .pin-spacer")).toHaveCount(0);
  await expect(page.locator(".helix-poster")).toHaveCSS("animation-name", "none");
});

test("375px uses 400 droplets, capped DPR, native scroll and a usable escape link", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.addInitScript(() => Object.defineProperty(window, "devicePixelRatio", { get: () => 3 }));
  await prepare(page);
  await scrollToProgress(page, .7);
  await expect.poll(() => page.evaluate(() => window.helixDraws.at(-1)?.instances)).toBe(400);
  await expect(page.locator(".helix-beat").nth(1)).toHaveCSS("opacity", "1");
  expect(await page.locator("#ritual canvas").evaluate(e => (e as HTMLCanvasElement).width / e.clientWidth)).toBeLessThanOrEqual(1.5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
  await expect(page.locator("html")).not.toHaveClass(/lenis/);
  const link = page.getByRole("link", { name: "Explore the flavors" });
  await expect(link).toBeInViewport();
  expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await link.click();
  await expect(page.getByRole("heading", { name: /Find your.*bright side/ })).toBeInViewport();
});

test("a lost WebGL context restores the unpinned poster and all copy", async ({ page }) => {
  await prepare(page);
  await scrollToProgress(page, .65);
  await page.locator("#ritual canvas").evaluate(element => {
    const context = (element as HTMLCanvasElement).getContext("webgl2")!;
    context.getExtension("WEBGL_lose_context")!.loseContext();
  });
  await expect(page.locator("#ritual")).toHaveAttribute("data-helix-failed", "true");
  await expect(page.locator("#ritual canvas, #ritual .pin-spacer")).toHaveCount(0);
  await expect(page.locator(".helix-poster")).toHaveCSS("visibility", "visible");
  for (const beat of await page.locator(".helix-beat").all()) await expect(beat).toHaveCSS("opacity", "1");
  await page.getByRole("link", { name: "Flavors", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Find your.*bright side/ })).toBeInViewport();
});

test("unavailable WebGL is caught without breaking the page", async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type.includes("webgl")) return null;
      return Reflect.apply(getContext, this, [type, ...args]);
    } as typeof getContext;
  });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.locator("#ritual").scrollIntoViewIfNeeded();
  await expect(page.locator("#ritual")).toHaveAttribute("data-helix-failed", "true");
  await expect(page.locator("#ritual canvas, #ritual .pin-spacer")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /Naturally.*extraordinary/ })).toBeVisible();
  await expect.poll(() => page.locator(".helix-poster img").evaluate(e => (e as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
});
