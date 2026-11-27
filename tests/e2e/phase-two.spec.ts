import { expect, test } from "@playwright/test";
import { calculatorPaths, calculators } from "../../src/config/calculators";
import { readFile } from "node:fs/promises";

const [loan, affordability, ownership, payoff] = calculatorPaths;

test("loan models advanced charges and exports monthly amortization", async ({
  page,
}) => {
  await page.goto(loan);
  await expect(page.locator(".tool-status")).toHaveText("$417.99");
  await page.getByText("Trade-in, sales tax and fees", { exact: true }).click();
  await page.getByLabel("Trade-in value").fill("12000");
  await page.getByLabel("Outstanding trade-in loan balance").fill("14000");
  await page.getByLabel("Sales tax rate").fill("6");
  await page.getByLabel("Sales tax basis").selectOption("custom");
  await page.getByLabel("Taxable purchase amount").fill("33000");
  await page.getByLabel("Dealer and documentation fees").fill("320");
  await page
    .getByRole("combobox", { name: "Taxes and fees", exact: true })
    .selectOption("finance");
  await expect(
    page.locator(".result-details").getByText("$40,300.00", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Negative trade-in equity")).toBeVisible();
  await page.getByText("Loan amortization schedule", { exact: true }).click();
  await page.getByLabel("Schedule view").selectOption("monthly");
  await expect(
    page
      .getByRole("table", { name: /year 1 monthly detail/ })
      .locator("tbody tr"),
  ).toHaveCount(12);
  await page.getByRole("button", { name: "Next year" }).click();
  await expect(
    page.getByRole("table", { name: /year 2 monthly detail/ }),
  ).toBeVisible();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download CSV" }).click(),
  ]);
  const contents = await readFile((await download.path())!, "utf8");
  expect(contents.split("\r\n")).toHaveLength(121);
  expect(contents).toContain(
    "Payment number,Payment,Principal paid,Interest paid,Remaining balance,Cumulative interest",
  );
  expect(contents.split("\r\n").at(-1)).toMatch(/^120,.+,0\.00,/);
  await page.getByRole("button", { name: "Reset calculator" }).click();
  await expect(page.locator(".tool-status")).toHaveText("$417.99");
});

test("affordability explains the cash constraint and the absence of financing", async ({
  page,
}) => {
  await page.goto(affordability);
  await page.getByLabel("Down payment", { exact: true }).fill("100");
  await expect(page.locator(".tool-status")).toContainText(
    "Enter a maximum upfront cash budget",
  );
  await page.getByLabel("Maximum upfront cash budget (optional)").fill("25000");
  await expect(page.locator(".tool-status")).toHaveText("$25,000.00");
  await page.getByLabel("Monthly operating expenses").fill("800");
  await expect(
    page.getByText("Your operating expenses leave no room"),
  ).toBeVisible();
  await page.getByLabel("Monthly operating expenses").fill("801");
  await expect(page.locator(".tool-status")).toContainText(
    "exceed your monthly budget",
  );
  await page.getByRole("button", { name: "Reset calculator" }).click();
  await expect(page.getByLabel("Monthly operating expenses")).toHaveValue(
    "350",
  );
});

test("ownership combines cash purchase, fuel inputs, storage and resale", async ({
  page,
}) => {
  await page.goto(ownership);
  await page.getByLabel("Purchase method").selectOption("cash");
  await page.getByLabel("Boat type").selectOption("sail");
  await expect(page.getByText(/rigging inspection/)).toBeVisible();
  await page
    .getByLabel("Estimated future resale value (optional)")
    .fill("30000");
  await page.getByLabel("Ownership period").selectOption("1");
  await page.getByText("Fuel and operating expenses").click();
  await page.getByLabel("Fuel estimation method").selectOption("usage");
  await page.getByLabel("Annual engine hours").fill("100");
  await page.getByLabel("Estimated fuel consumption").fill("4");
  await page.getByLabel("Fuel price per gallon").fill("5");
  await page.getByLabel("Primary storage arrangement").selectOption("marina");
  await page.getByLabel("Marina or dock fees", { exact: true }).fill("1200");
  await expect(page.getByLabel("Dry storage", { exact: true })).toHaveCount(0);
  await expect(page.locator(".tool-status")).toHaveText("$391.67");
  await expect(page.getByText("$19,700.00")).toBeVisible();
  await page.getByRole("button", { name: "Reset calculator" }).click();
  await expect(page.getByLabel("Purchase method")).toHaveValue("financed");
});

test("payoff validates payment mode, shows both schedules and caps a lump sum", async ({
  page,
}) => {
  await page.goto(payoff);
  await page
    .getByText("Original amortization schedule", { exact: true })
    .click();
  await page
    .getByText("Accelerated amortization schedule", { exact: true })
    .click();
  await expect(
    page.getByRole("table", { name: /Original amortization schedule/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("table", { name: /Accelerated amortization schedule/ }),
  ).toBeVisible();
  await page.getByLabel("How to describe your loan").selectOption("payment");
  await page.getByLabel("Scheduled monthly principal and interest").fill("10");
  await expect(page.locator(".tool-status")).toContainText("must exceed");
  await page.getByLabel("Scheduled monthly principal and interest").fill("500");
  await page.getByLabel("One-time principal payment").fill("40000");
  await expect(
    page.getByText(/Only the outstanding balance can be applied/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset calculator" }).click();
  await expect(page.getByLabel("One-time principal payment")).toHaveValue("0");
});

test("transfers an explicit scenario through calculator navigation without URL parameters", async ({
  page,
}) => {
  await page.goto(loan);
  await page.getByLabel("Boat purchase price").fill("60000");
  await page
    .getByRole("button", {
      name: "Send purchase assumptions to ownership calculator",
    })
    .click();
  await expect(page).toHaveURL(new RegExp(`${ownership}$`));
  await page.getByRole("button", { name: "Load transferred scenario" }).click();
  await expect(page.getByLabel("Boat purchase price")).toHaveValue("60000");
  await expect(page.getByLabel("Down payment", { exact: true })).toHaveValue(
    "12000",
  );
  await page
    .getByRole("button", {
      name: "Send operating budget to affordability calculator",
    })
    .click();
  await expect(page).toHaveURL(new RegExp(`${affordability}$`));
  await page.getByRole("button", { name: "Load transferred scenario" }).click();
  await expect(
    page.getByText("Scenario loaded.", { exact: false }),
  ).toBeVisible();
  await expect(page.getByLabel("Monthly operating expenses")).toHaveValue(
    "350",
  );
  await page.reload();
  await page.getByRole("button", { name: "Load transferred scenario" }).click();
  await expect(page.getByText(/No scenario was sent/)).toBeVisible();
});

test("calculator navigation and screenshots", async ({ page }, testInfo) => {
  await page.goto("/");
  if (testInfo.project.name === "mobile") {
    await page.getByText("Menu", { exact: true }).click();
    await page
      .getByRole("navigation", { name: "Mobile" })
      .getByRole("link", { name: calculators[loan].name })
      .click();
  } else {
    await page.getByText("Calculators", { exact: true }).click();
    await page
      .getByRole("navigation", { name: "Calculators" })
      .getByRole("link", { name: calculators[loan].name })
      .click();
  }
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    calculators[loan].name,
  );
  for (const path of calculatorPaths) {
    await page.goto(path);
    await expect(page.locator(".tool-status")).not.toHaveText("—");
    const breadcrumb = JSON.parse(
      (await page.locator("script[type='application/ld+json']").textContent())!,
    );
    expect(breadcrumb["@type"]).toBe("BreadcrumbList");
    expect(breadcrumb.itemListElement[1].item).toBe(
      `https://boatcostguide.com${path}`,
    );
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(page.viewportSize()!.width);
    await page.screenshot({
      path: testInfo.outputPath(`${path.slice(1)}.png`),
      fullPage: true,
    });
  }
});
