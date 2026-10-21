import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function scrollToSection(page: Page, id: string, offset = 0) {
  await page.evaluate(({ id, offset }) => {
    const element = document.getElementById(id)!;
    window.scrollTo(0, window.scrollY + element.getBoundingClientRect().top + offset);
  }, { id, offset });
}

test("page is accessible and all supplied menu images render", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Good things.");
  await expect(page.locator(".flavor-card")).toHaveCount(5);
  for (const image of await page.locator(".flavor-card img").all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  }
  await scrollToSection(page, "home");
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(result.violations).toEqual([]);
  await expect(page.getByText("Ordering details coming soon")).toBeVisible();
});

test("375px mobile has no page overflow and supports menu swiping", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  for (const id of ["home", "ritual", "flavors", "contact"]) {
    await scrollToSection(page, id);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
  }
  const list = page.getByRole("list", { name: /Five juice flavors/ });
  await list.scrollIntoViewIfNeeded();
  await list.evaluate((element) => { element.scrollLeft = element.clientWidth; });
  await expect.poll(() => list.evaluate((element) => element.scrollLeft)).toBeGreaterThan(100);
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
});

test("reduced motion prevents video, WebGL, smooth scrolling and pinning", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const videoRequests: string[] = [];
  page.on("request", (request) => { if (request.url().includes("/video/")) videoRequests.push(request.url()); });
  await page.goto("/");
  await scrollToSection(page, "ritual");
  await scrollToSection(page, "contact");
  await expect(page.locator("[data-motion]")).toHaveAttribute("data-motion", "static");
  await expect(page.locator("video[src]")).toHaveCount(0);
  await expect(page.locator("canvas, .pin-spacer")).toHaveCount(0);
  await expect(page.locator("html")).not.toHaveClass(/lenis/);
  expect(videoRequests).toEqual([]);
  await expect(page.getByRole("button", { name: "Motion disabled by your device preference" })).toBeDisabled();
});

test("desktop loads real WebGL, scrubs supplied video, and cleans up on pause", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator(".pin-spacer")).toHaveCount(1);
  await expect.poll(() => page.locator(".hero video").evaluate((element) => !(element as HTMLVideoElement).paused)).toBe(true);
  await expect(page.locator(".interlude video")).not.toHaveAttribute("src");
  await scrollToSection(page, "ritual", 220);
  await expect(page.locator(".helix-webgl[data-ready='true'] canvas")).toHaveCount(1);
  await scrollToSection(page, "ritual", 1450);
  await expect.poll(() => page.locator(".helix-splash").evaluate((element) => (element as HTMLVideoElement).currentTime)).toBeGreaterThan(3);
  for (let i = 0; i < 2; i++) {
    await page.getByRole("button", { name: "Pause motion" }).click();
    await expect(page.locator("canvas, .pin-spacer, video[src]")).toHaveCount(0);
    await expect(page.locator("html")).not.toHaveClass(/lenis/);
    await page.getByRole("button", { name: "Resume motion" }).click();
    await expect(page.locator(".pin-spacer")).toHaveCount(1);
  }
  expect(errors).toEqual([]);
});

test("changing reduced-motion preference tears down active animations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator(".pin-spacer")).toHaveCount(1);
  await scrollToSection(page, "ritual", 100);
  await expect(page.locator("canvas")).toHaveCount(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("canvas, .pin-spacer, video[src]")).toHaveCount(0);
  await expect(page.locator("html")).not.toHaveClass(/lenis/);
});

test("weak devices keep static artwork without loading videos or 3D", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 2 });
    Object.defineProperty(navigator, "deviceMemory", { get: () => 2 });
  });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await scrollToSection(page, "ritual");
  await expect(page.locator(".helix-artwork img")).toBeVisible();
  await expect(page.locator("canvas, .pin-spacer, video[src]")).toHaveCount(0);
  await expect(page.locator("html")).not.toHaveClass(/lenis/);
});

test("missing WebGL leaves the supplied static helix visible", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { value: function (type: string, ...args: unknown[]) {
      if (type.includes("webgl")) return null;
      return Reflect.apply(original, this, [type, ...args]);
    } });
  });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await scrollToSection(page, "ritual", 100);
  await expect(page.getByTestId("helix-renderer-fallback")).toBeAttached();
  await expect(page.locator(".helix-artwork img")).toBeVisible();
  await expect(page.locator(".helix-webgl[data-ready='true']")).toHaveCount(0);
});

test("WebGL context loss restores the static artwork", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await scrollToSection(page, "ritual", 100);
  const canvas = page.locator(".helix-webgl[data-ready='true'] canvas");
  await expect(canvas).toHaveCount(1);
  await canvas.evaluate((element) => {
    const gl = (element as HTMLCanvasElement).getContext("webgl2")!;
    gl.getExtension("WEBGL_lose_context")!.loseContext();
  });
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.locator(".helix-artwork img")).toBeVisible();
});

test("the complete static page works without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3100");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("link", { name: "Find your flavor" }).click();
  await expect(page).toHaveURL(/#flavors$/);
  await expect(page.locator(".flavor-card")).toHaveCount(5);
  await expect(page.locator(".helix-artwork img")).toHaveAttribute("alt", /DNA double helix/);
  await expect(page.locator("video[src], canvas")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
  await context.close();
});

test("keyboard skip link reaches the main content", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Find your flavor" })).toBeFocused();
});
