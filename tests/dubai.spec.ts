import { test, expect } from "./fixtures";
import { readFile } from "node:fs/promises";
test("Dubai partnership page has clear limits and prepares an enquiry locally", async ({
  page,
}, info) => {
  const writes: string[] = [];
  page.on("request", (r) => {
    if (r.method() !== "GET") writes.push(r.url());
  });
  await page.goto("http://localhost:4175/");
  await page
    .getByRole("link", { name: "Dubai partnerships", exact: true })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Next stop: Dubai",
  );
  await expect(page.locator(".dubai-status")).toContainText(
    "booking and payment are not open",
  );
  await page
    .getByLabel("Your role", { exact: true })
    .selectOption("Property or community manager");
  await page
    .getByLabel("Dubai area", { exact: true })
    .fill("JVC & Dubai Marina");
  await page
    .getByLabel("Organisation or name (optional)", { exact: true })
    .fill("Fixture property");
  await page
    .getByLabel("Vehicle group", { exact: true })
    .selectOption("Cars or taxis");
  expect(
    await page
      .locator("form")
      .evaluate((form: HTMLFormElement) => form.checkValidity()),
  ).toBe(false);
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Prepare Dubai enquiry email", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Nothing has been submitted",
  );
  const url = new URL(
    (await page
      .getByRole("link", { name: "Open Dubai email draft", exact: true })
      .getAttribute("href"))!,
  );
  expect(url.protocol).toBe("mailto:");
  expect(url.searchParams.get("body")).toContain("JVC & Dubai Marina");
  expect(url.searchParams.get("body")).toContain("AED");
  expect(url.searchParams.get("body")).toContain("not open");
  expect(writes).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `/tmp/plugnear-dubai-${info.project.name}.png`,
    fullPage: true,
  });
});
test("Dubai app entry and unknown regions do not expose India booking, listing or UPI", async ({
  page,
}) => {
  const dataCalls: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/rest/v1/")) dataCalls.push(r.url());
  });
  await page.goto("http://localhost:4175/app/?market=AE&mode=host");
  await expect(
    page.getByText("Dubai is open for partnership enquiries only.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Dubai planning: AED", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Request this charger", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("tab")).toHaveCount(0);
  await page.goto("http://localhost:4175/app/?market=US");
  await expect(
    page.getByText("Choose your region.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toHaveCount(0);
  expect(dataCalls).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("Dubai fleet planning marks the region, invalidates stale exports and rejects an unknown region", async ({
  page,
}) => {
  await page.goto("http://localhost:4175/fleet-pilot/?market=AE");
  await expect(page.getByLabel("Planning region", { exact: true })).toHaveValue(
    "AE",
  );
  await expect(page.locator("#market-status")).toContainText("Asia/Dubai");
  const downloadEvent = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download your pilot brief", exact: false })
    .click();
  const download = await downloadEvent;
  const text = await readFile((await download.path())!, "utf8");
  expect(text).toContain("Dubai");
  expect(text).toContain("AED");
  expect(text).toContain("no booking, listing or payment");
  await page.getByLabel("Planning region", { exact: true }).selectOption("IN");
  await expect(
    page.getByRole("button", {
      name: "Download your pilot brief",
      exact: false,
    }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Calculate pilot assumptions", exact: false })
    .click();
  await expect(page.locator("#market-status")).toContainText("Asia/Kolkata");
  await page.goto("http://localhost:4175/fleet-pilot/?market=US");
  await expect(
    page.getByRole("button", {
      name: "Download your pilot brief",
      exact: false,
    }),
  ).toBeDisabled();
  await expect(page.locator("#market-status")).toContainText(
    "Choose a supported planning region",
  );
});
