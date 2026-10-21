import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("renders only the six ordered placeholders with self-hosted fonts", async ({ page }) => {
  const errors: string[] = [];
  const externalFonts: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => { if (/fonts\.(googleapis|gstatic)\.com/.test(request.url())) externalFonts.push(request.url()); });
  await page.goto("/");
  await expect(page.locator("h1, h2")).toHaveText(["Hero", "HelixScroll", "FlavorGrid", "Interlude", "OrderCTA", "Footer"]);
  await expect(page.locator("main img, video, canvas")).toHaveCount(0);
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
  await expect(page.getByRole("heading", { name: "FlavorGrid" })).toBeInViewport();
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
    await expect(page.getByRole("heading", { name: "Hero", exact: true })).toBeVisible();
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

test("navigation and placeholders work without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3100");
  await page.getByRole("link", { name: "Order", exact: true }).click();
  await expect(page).toHaveURL(/#contact$/);
  await expect(page.getByRole("heading", { name: "OrderCTA" })).toBeInViewport();
  await expect(page.locator("h1, h2")).toHaveCount(6);
  await context.close();
});
