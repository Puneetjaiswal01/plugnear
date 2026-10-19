import { test, expect } from "@playwright/test";
test("fleet journey is available with bounded editable assumptions", async ({
  page,
}) => {
  await page.goto("http://localhost:4175");
  await page.getByRole("link", { name: "Build a fleet pilot brief" }).click();
  await expect(page).toHaveURL(/\/fleet-pilot\//);
  await expect(
    page.getByText("Planning tool", { exact: false }).first(),
  ).toBeVisible();
  await expect(page.locator("#vehicle-energy")).toHaveText("28.0 kWh");
  await expect(page.locator("#charging-points")).toHaveText("10");
  await page.getByLabel("Daily usable window per point (hours)").fill("12");
  await expect(
    page.getByRole("button", { name: "Download your pilot brief" }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Calculate pilot assumptions" })
    .click();
  await expect(page.locator("#charging-points")).toHaveText("5");
  await expect(
    page.getByRole("button", { name: "Download your pilot brief" }),
  ).toBeEnabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("fleet presets require recalculation and pilot download stays local", async ({
  page,
}) => {
  await page.goto("http://localhost:4175/fleet-pilot/");
  await page.getByLabel("Vehicle type").selectOption("3w");
  await expect(page.getByLabel("Energy use (Wh/km)")).toHaveValue("70");
  await expect(
    page.getByRole("button", { name: "Download your pilot brief" }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Calculate pilot assumptions" })
    .click();
  await expect(page.locator("#charging-points")).toHaveText("8");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download your pilot brief" }).click();
  expect((await download).suggestedFilename()).toBe(
    "plugnear-fleet-pilot-brief.txt",
  );
  await expect(
    page.getByText("Downloading does not submit an enquiry or book charging.", {
      exact: false,
    }),
  ).toBeVisible();
});

test("car, taxi and commercial fleet presets calculate without implying universal compatibility", async ({
  page,
}) => {
  await page.goto("http://localhost:4175/fleet-pilot/");
  for (const [type, energy] of [
    ["car", "128.0 kWh"],
    ["taxi", "144.0 kWh"],
    ["van", "176.0 kWh"],
    ["bus", "880.0 kWh"],
  ]) {
    await page.getByLabel("Vehicle type").selectOption(type);
    await expect(
      page.getByRole("button", { name: "Download your pilot brief" }),
    ).toBeDisabled();
    await page
      .getByRole("button", { name: "Calculate pilot assumptions" })
      .click();
    await expect(page.locator("#vehicle-energy")).toHaveText(energy);
    await expect(
      page.getByRole("button", { name: "Download your pilot brief" }),
    ).toBeEnabled();
  }
  await expect(
    page.getByText("Plan one vehicle group at a time", { exact: false }),
  ).toBeVisible();
});
