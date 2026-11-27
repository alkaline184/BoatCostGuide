import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { pages, site, type PagePath } from "../../src/config/site";

test("calculator updates, converts, validates and resets", async ({ page }) => {
  await page.goto("/");
  const total = page.getByTestId("monthly-total");
  await expect(total).toHaveText("$767.99");
  await page
    .getByRole("button", { name: "Enter down payment in dollars" })
    .click();
  await expect(page.getByLabel("Down payment", { exact: true })).toHaveValue(
    "9000",
  );
  await expect(total).toHaveText("$767.99");
  await page.getByLabel("Annual interest rate").fill("0");
  await expect(total).toHaveText("$650.00");
  await page.getByLabel("Monthly operating expenses").fill("400.25");
  await expect(total).toHaveText("$700.25");
  await page.getByLabel("Down payment", { exact: true }).fill("45001");
  await expect(
    page.getByText("The down payment cannot exceed the purchase price."),
  ).toBeVisible();
  await expect(total).toHaveText("—");
  await page.getByLabel("Down payment", { exact: true }).fill("45000");
  await expect(total).toHaveText("$400.25");
  await page.getByRole("button", { name: "Reset calculator" }).click();
  await expect(total).toHaveText("$767.99");
  await expect(
    page.getByRole("button", { name: "Enter down payment as a percentage" }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("responsive navigation, skip link and keyboard input work", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Boat purchase price")).toBeFocused();

  if (testInfo.project.name === "mobile") {
    const menu = page.getByText("Menu", { exact: true });
    await menu.focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("navigation", { name: "Mobile" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("navigation", { name: "Mobile" })).toBeHidden();
    await menu.click();
    await page
      .getByRole("navigation", { name: "Mobile" })
      .getByRole("link", { name: "Calculator", exact: true })
      .click();
    await expect(page.getByRole("navigation", { name: "Mobile" })).toBeHidden();
    await expect(page).toHaveURL(/#calculator$/);
  } else {
    await page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "About" })
      .click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "About BoatCostGuide",
    );
  }
});

for (const path of Object.keys(pages) as PagePath[]) {
  test(`renders ${path} with complete metadata and no automated WCAG violations`, async ({
    page,
  }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page).toHaveTitle(
      path === "/" ? pages[path].title : `${pages[path].title} | ${site.name}`,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveJSProperty(
      "href",
      new URL(path, site.url).href,
    );
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      pages[path].description,
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      `${site.url}${site.socialImage}`,
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

test("robots and sitemap advertise exactly the canonical public routes", async ({
  request,
}) => {
  expect((await request.get("/favicon.ico")).status()).toBe(200);
  expect((await request.get(site.socialImage)).status()).toBe(200);
  const robotsResponse = await request.get("/robots.txt");
  expect(robotsResponse.ok()).toBe(true);
  expect(await robotsResponse.text()).toContain(
    `Sitemap: ${site.url}/sitemap.xml`,
  );
  const sitemapResponse = await request.get("/sitemap.xml");
  expect(sitemapResponse.ok()).toBe(true);
  const xml = await sitemapResponse.text();
  expect(
    Array.from(xml.matchAll(/<loc>(.*?)<\/loc>/g), (match) => match[1]),
  ).toEqual(Object.keys(pages).map((path) => new URL(path, site.url).href));
  expect((await request.get("/boat-refinance-calculator")).status()).toBe(404);
});

test("homepage fits the viewport and captures a production screenshot", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    /Your dream boat.*Know the real cost/,
  );
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.screenshot({
    path: testInfo.outputPath("homepage.png"),
    fullPage: true,
  });
});
