import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const prototype = "http://127.0.0.1:3101/research-preview";

test("boat types reveal useful guidance and public links stay production-safe", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await page
    .locator(".discovery-actions")
    .getByRole("link", { name: "Explore boat types" })
    .click();
  await expect(page).toHaveURL(/#explore$/);
  const pontoon = page
    .locator(".boat-category")
    .filter({ hasText: "Pontoon boats" });
  await pontoon.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(pontoon).toHaveAttribute("open", "");
  await expect(pontoon.getByText(/Compare deck layouts/)).toBeVisible();
  expect(errors).toEqual([]);
  for (const url of [
    "/research-preview/model",
    "/research-preview/compare",
    "/boats",
    "/compare",
  ]) {
    expect((await request.get(url)).status()).toBe(404);
  }
});

test("model prototype accepts scenario inputs and remains noindex", async ({
  page,
}, info) => {
  await page.goto(prototype + "/model");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow",
  );
  await expect(page.getByText(/Development preview/)).toBeVisible();
  await expect(page.getByText("Pricing unavailable").first()).toBeVisible();
  await page.getByRole("button", { name: /Favorite.*Harbor 24/ }).click();
  await expect(
    page.getByRole("button", { name: /Remove favorite/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Purchase price").fill("45000");
  await page.getByLabel("Monthly operating expenses").fill("350");
  await expect(page.getByText("$55,079.43")).toBeVisible();
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(axe.violations).toEqual([]);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: info.outputPath("model.png"), fullPage: true });
});

test("comparison supports two or three models and per-model costs", async ({
  page,
}, info) => {
  await page.goto(prototype + "/compare");
  const table = page.getByRole("table", { name: /Technical specifications/ });
  await expect(table.getByRole("columnheader")).toHaveCount(4);
  await page.getByRole("checkbox", { name: /Include Marsh 19/ }).uncheck();
  await expect(table.getByRole("columnheader")).toHaveCount(3);
  await page.getByRole("checkbox", { name: /Include Marsh 19/ }).check();
  const scenario = page.getByRole("group", {
    name: "Harbor 24 ownership scenario",
  });
  await scenario.getByLabel("Purchase price").fill("45000");
  await scenario.getByLabel("Monthly operating expenses").fill("350");
  await expect(scenario.getByText("$767.99")).toBeVisible();
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(axe.violations).toEqual([]);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: info.outputPath("compare.png"),
    fullPage: true,
  });
});
