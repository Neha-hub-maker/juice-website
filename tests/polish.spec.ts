import { expect, test } from "@playwright/test";
import { assets } from "../src/data/assets";
import { site } from "../src/config/site";

declare global { interface Window { polishCLS: number } }

for (const width of [375, 768, 1440]) {
  test(`${width}px static site reserves media space and all sections remain usable`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() => {
      window.polishCLS = 0;
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
          if (!shift.hadRecentInput) window.polishCLS += shift.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    let releaseImages!: () => void;
    const gate = new Promise<void>(resolve => { releaseImages = resolve; });
    await page.route("**/_next/image?**", async route => { await gate; await route.continue(); });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => document.fonts.ready);
    const boxes = () => page.locator("main > section").evaluateAll(elements => elements.map(element => {
      const rect = element.getBoundingClientRect();
      return { id: element.id, top: rect.top + window.scrollY, height: rect.height, width: rect.width };
    }));
    const before = await boxes();
    releaseImages();
    for (const id of ["hero", "ritual", "flavors", "interlude", "contact"]) {
      await page.locator(`#${id} h1, #${id} h2`).scrollIntoViewIfNeeded();
      await expect(page.locator(`#${id} h1, #${id} h2`)).toBeInViewport();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    }
    for (const image of await page.locator("main img").all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate(e => (e as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    }
    const after = await boxes();
    for (let i = 0; i < before.length; i++) {
      expect(after[i].top).toBeCloseTo(before[i].top, 0);
      expect(after[i].height).toBeCloseTo(before[i].height, 0);
      expect(after[i].width).toBe(width);
    }
    await expect(page.locator("canvas, video[src], .pin-spacer")).toHaveCount(0);
    await expect(page.locator("html")).not.toHaveClass(/lenis/);
    for (const beat of await page.locator(".helix-beat").all()) await expect(beat).toHaveCSS("opacity", "1");
    expect(await page.locator(".helix-poster").evaluate(e => getComputedStyle(e).animationName)).toBe("none");
    const cls = await page.evaluate(() => window.polishCLS);
    expect(cls).toBeLessThan(.01);
    console.log(JSON.stringify({ width, reducedMotion: true, mediaGeometryStable: true, cls }));
  });
}

test("metadata and supplied-image favicon are available", async ({ page, request }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(`${site.name} | ${site.tagline}`);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", site.description);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", new RegExp(`${assets.splashTeal.path}$`));
  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute("content", String(assets.splashTeal.width));
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#10140f");
  const icon = await request.get("/favicon.ico");
  expect(icon.ok()).toBe(true);
  expect(icon.headers()["content-type"]).toContain("image/");
  expect((await icon.body()).length).toBeLessThan(20000);
});

test("768px pin stays contiguous through font/media refresh and releases cleanly", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator("#ritual .pin-spacer")).toHaveCount(1);
  await page.locator(".helix-stage").scrollIntoViewIfNeeded();
  await expect(page.locator("#ritual")).toHaveAttribute("data-scene-ready", "true");
  const geometry = () => page.evaluate(() => {
    const section = document.getElementById("ritual")!.getBoundingClientRect();
    const next = document.getElementById("flavors")!.getBoundingClientRect();
    const stage = document.querySelector(".helix-stage")!.getBoundingClientRect();
    return { gap: next.top - section.bottom, scrollRange: section.height - stage.height, width: document.documentElement.scrollWidth };
  });
  const before = await geometry();
  expect(before.gap).toBeCloseTo(0, 0);
  expect(before.scrollRange).toBeCloseTo(3600, 0);
  await page.evaluate(() => {
    document.fonts.dispatchEvent(new Event("loadingdone"));
    document.querySelector("#hero video")!.dispatchEvent(new Event("loadedmetadata"));
    document.querySelector("#ritual img")!.dispatchEvent(new Event("load"));
  });
  await page.waitForTimeout(700); // batch delay plus ScrollTrigger's safe refresh frame
  expect(await geometry()).toEqual(before);
  expect(before.width).toBe(768);
  await page.getByRole("button", { name: "Pause motion", exact: true }).click();
  await expect(page.locator(".pin-spacer, canvas")).toHaveCount(0);
  const after = await geometry();
  expect(after.gap).toBeCloseTo(0, 0);
  expect(after.width).toBe(768);
});
