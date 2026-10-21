import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { assets } from "../src/data/assets";

test("renders the sections and ordered menu with local fonts", async ({ page }) => {
  const errors: string[] = [];
  const externalFonts: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => { if (/fonts\.(googleapis|gstatic)\.com/.test(request.url())) externalFonts.push(request.url()); });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(await page.locator("main > section").evaluateAll(elements => elements.map(element => element.id))).toEqual(["hero", "ritual", "flavors", "interlude", "contact"]);
  await expect(page.locator(".flavor-card h3")).toHaveText(["Green juice", "Lemonade", "Berry", "Watermelon", "Orange"]);
  await expect(page.locator(".flavor-price")).toHaveText(Array(5).fill("Price coming soon"));
  await expect(page.getByRole("heading", { name: /Naturally.*extraordinary/ })).toBeAttached();
  await expect(page.locator("footer")).toContainText("All rights reserved.");
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.size)).toBeGreaterThanOrEqual(2);
  const faces = await page.evaluate(() => ({ body: getComputedStyle(document.body).fontFamily, heading: getComputedStyle(document.querySelector('h1')!).fontFamily }));
  expect(faces.body).not.toEqual(faces.heading);
  expect(faces.body).not.toEqual("Arial");
  expect(await page.locator("#flavors").evaluate(e => getComputedStyle(e).backgroundImage)).toContain("linear-gradient");
  expect(externalFonts).toEqual([]);
  expect(errors).toEqual([]);
});

test("375px navigation is sticky, touch-sized, and reaches visible headings", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await expect(page.locator("[data-mobile]")).toHaveAttribute("data-mobile", "true");
  for (const name of ["Ritual", "Flavors", "Visit", "Order"]) {
    const link = page.getByRole("link", { name, exact: true });
    expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await link.click();
    const target = (await link.getAttribute("href"))!;
    const heading = page.locator(`${target} h2`);
    await expect(heading).toBeInViewport();
    const headerBounds = (await page.locator("header").boundingBox())!;
    const headingBounds = (await heading.boundingBox())!;
    expect(headerBounds.y).toBeCloseTo(0, 0);
    expect(headingBounds.y).toBeGreaterThan(headerBounds.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
  }
  await expect(page.locator("html")).not.toHaveClass(/lenis/);
});

test("reduced motion and pause toggles clean up smooth scrolling", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/lenis/);
  for (let i = 0; i < 2; i++) {
    await page.getByRole("button", { name: "Pause motion", exact: true }).click();
    await expect(page.locator("html")).not.toHaveClass(/lenis/);
    await page.getByRole("button", { name: "Resume motion", exact: true }).click();
    await expect(page.locator("html")).toHaveClass(/lenis/);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("html")).not.toHaveClass(/lenis/);
  await expect(page.getByRole("button", { name: "Motion disabled by device preference" })).toBeDisabled();
  await page.getByRole("link", { name: "Flavors", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Find your.*bright side/ })).toBeInViewport();
});

test("viewport hook updates at runtime and restores desktop scrolling", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/lenis/);
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.locator("[data-mobile]")).toHaveAttribute("data-mobile", "true");
  await expect(page.locator("html")).not.toHaveClass(/lenis/);
  await page.setViewportSize({ width: 1440, height: 960 });
  await expect(page.locator("[data-mobile]")).toHaveAttribute("data-mobile", "false");
  await expect(page.locator("html")).toHaveClass(/lenis/);
});

for (const hint of ["cores", "memory", "saveData"] as const) {
  test(`low-power detection honors ${hint}`, async ({ page }) => {
    await page.addInitScript(hint => {
      Object.defineProperty(navigator, "hardwareConcurrency", { get: () => hint === "cores" ? 2 : 8 });
      Object.defineProperty(navigator, "deviceMemory", { get: () => hint === "memory" ? 2 : 8 });
      if (hint === "saveData") Object.defineProperty(navigator, "connection", { value: Object.assign(new EventTarget(), { saveData: true }) });
    }, hint);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await expect(page.locator("[data-low-power]")).toHaveAttribute("data-low-power", "true");
    await expect(page.locator("html")).not.toHaveClass(/lenis/);
    await expect(page.locator("#ritual")).toHaveAttribute("data-enhanced", "false");
    await expect(page.locator("#ritual canvas, #ritual .pin-spacer")).toHaveCount(0);
    await expect(page.locator(".helix-beat")).toHaveCount(3);
    await expect(page.getByRole("heading", { name: /A brighter.*kind of fresh/ })).toBeVisible();
  });
}

test("keyboard skip link and WCAG checks pass", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(result.violations).toEqual([]);
});

test("navigation, static posters and menu work without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3100");
  await page.getByRole("link", { name: "Order", exact: true }).click();
  await expect(page).toHaveURL(/#contact$/);
  await expect(page.getByRole("heading", { name: /See you on.*the fresh side/ })).toBeInViewport();
  await expect(page.locator(".flavor-card")).toHaveCount(5);
  await expect(page.locator("video[src], canvas")).toHaveCount(0);
  await context.close();
});


test("hero video is muted, looping and configured from the manifest", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const video = page.locator("#hero video");
  await expect(video).toHaveAttribute("src", assets.heroPour.path);
  await expect(video).toHaveAttribute("poster", assets.heroPour.poster);
  await expect(video).toHaveAttribute("preload", "metadata");
  expect(await video.evaluate(element => { const v = element as HTMLVideoElement; return v.muted && v.loop && v.playsInline; })).toBe(true);
  await expect.poll(() => video.evaluate(element => (element as HTMLVideoElement).currentTime)).toBeGreaterThan(0);
  await expect(page.getByRole("link", { name: "Order now", exact: true })).toHaveAttribute("href", "#contact");
});

test("interlude loads near the viewport and pauses after leaving it", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const requests: string[] = [];
  page.on("request", request => { if (request.url().includes(assets.interludePeel.path)) requests.push(request.url()); });
  await page.goto("/");
  const video = page.locator("#interlude video");
  await expect(video).not.toHaveAttribute("src");
  expect(requests).toEqual([]);
  await page.locator("#interlude").scrollIntoViewIfNeeded();
  await expect(video).toHaveAttribute("src", assets.interludePeel.path);
  await expect.poll(() => video.evaluate(element => (element as HTMLVideoElement).currentTime)).toBeGreaterThan(0);
  await expect(page.locator(".interlude-media")).toHaveCSS("transform", /matrix/);
  await page.getByRole("link", { name: "Juice Shop home", exact: true }).click();
  await expect.poll(() => video.evaluate(element => (element as HTMLVideoElement).paused)).toBe(true);
});

test("375px menu snaps horizontally without widening the page", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const list = page.getByRole("list", { name: "Juice flavors", exact: true });
  await list.scrollIntoViewIfNeeded();
  await list.focus();
  await expect(list).toBeFocused();
  await list.evaluate(element => element.scrollBy({ left: element.clientWidth, behavior: "instant" }));
  await expect.poll(() => list.evaluate(element => element.scrollLeft)).toBeGreaterThan(150);
  expect(await list.evaluate(element => getComputedStyle(element).scrollSnapType)).toBe("x mandatory");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
  for (const image of await page.locator(".flavor-card img").all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  }
});

test("pausing and reduced motion release videos and restore static transforms", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.locator("#interlude").scrollIntoViewIfNeeded();
  await expect(page.locator("#interlude video")).toHaveAttribute("src", assets.interludePeel.path);
  await page.getByRole("button", { name: "Pause motion", exact: true }).click();
  await expect(page.locator("video[src]")).toHaveCount(0);
  await expect(page.locator(".interlude-media")).toHaveCSS("transform", "none");
  for (const card of await page.locator(".flavor-card").all()) await expect(card).toHaveCSS("opacity", "1");
  await page.getByRole("button", { name: "Resume motion", exact: true }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("video[src]")).toHaveCount(0);
  await expect(page.locator(".interlude-media")).toHaveCSS("transform", "none");
});

test("unavailable video retains a usable poster without an application error", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route(`**${assets.heroPour.path}`, route => route.abort());
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const poster = page.locator("#hero img");
  await expect.poll(() => poster.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator("#hero video")).not.toHaveAttribute("src");
  await expect(page.locator("#hero video")).toHaveCSS("opacity", "0");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(errors).toEqual([]);
});
