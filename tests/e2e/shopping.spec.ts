import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const review = "http://127.0.0.1:3101";
const spark = "sea-doo-spark-2027-for-2-60-hp";
const gti = "sea-doo-gti-2027-130";
const jet = "yamaha-boats-sx180-2027-us-standard-configuration";

test("real explorer filters, budgets and opens a comparison", async ({
  page,
}, info) => {
  await page.goto(review + "/boats");
  await expect(
    page.getByRole("heading", { name: "Boat Explorer" }),
  ).toBeVisible();
  await expect(page.getByText("21 variants found")).toBeVisible();
  if (info.project.name !== "tablet")
    await page.screenshot({ path: info.outputPath("explorer.png") });
  await page.getByLabel("Search manufacturer or model").fill("Spark");
  await expect(page.getByText("3 variants found")).toBeVisible();
  await page.getByText("Filter boats", { exact: true }).click();
  await page.getByLabel("Model year").selectOption("2026");
  await expect(page.getByText("1 variant found")).toBeVisible();
  await page.getByLabel("Maximum price ($)").fill("10000");
  await expect(page.getByText("0 variants found")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await page.getByText("Shop by budget", { exact: true }).click();
  await page.getByLabel("Total monthly boating budget").fill("400");
  await page.getByLabel("Monthly operating expenses").fill("100");
  await page.getByLabel("Match boats to my budget").check();
  await expect(
    page.getByText(/Estimated purchase-price ceiling/),
  ).toBeVisible();
  await expect(page.getByLabel(/Compare 2027 Sea-Doo GTI 130/)).toBeVisible();
  await page.getByLabel(/Compare 2027 Sea-Doo GTI 130/).check();
  await page.getByLabel(/Compare 2027 Sea-Doo Spark X/).check();
  await page.getByRole("link", { name: "Compare 2 boats" }).click();
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page).toHaveURL(/compare\?models=/);
});

test("real research, comparison, privacy and responsive accessibility", async ({
  page,
}, info) => {
  await page.goto(review + "/");
  if (info.project.name !== "tablet")
    await page.screenshot({ path: info.outputPath("home.png") });
  await page.getByLabel("Manufacturer or model").fill("Spark");
  await page.getByRole("button", { name: "Search boats" }).click();
  await expect(page.getByText("3 variants found")).toBeVisible();
  await page.goto(review + "/boats/sea-doo/spark");
  await expect(
    page.getByRole("heading", { name: "Sea-Doo Spark", exact: true }),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
  await page.getByRole("link", { name: /2026.*For 2/ }).click();
  await expect(page).toHaveURL(/variant=sea-doo-spark-2026/);
  await page.getByLabel("Purchase price").fill("12000");
  await expect(
    page.getByRole("heading", { name: "Model your ownership costs" }),
  ).toBeVisible();
  if (info.project.name !== "tablet")
    await page.screenshot({
      path: info.outputPath("model.png"),
      fullPage: true,
    });
  await page.goto(
    review + "/compare?models=" + [spark, gti, jet, "unknown"].join(","),
  );
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByLabel("Boat 3")).toHaveValue(jet);
  if (info.project.name !== "tablet")
    await page.screenshot({
      path: info.outputPath("compare.png"),
      fullPage: true,
    });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(await page.evaluate(() => window.innerWidth));
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
});

test("public sitemap excludes rights-pending combinations", async ({
  page,
  request,
}) => {
  await page.goto("/boats?q=Spark");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
  await expect(page.getByText(/awaiting publication review/)).toBeVisible();
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).not.toMatch(
    /\/boats|\/boat-types|\/compare|research-preview/,
  );
});
