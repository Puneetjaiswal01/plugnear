import { test, expect } from "./fixtures";
test("public website renders its approved brand and both journeys without broken assets", async ({
  page,
}, info) => {
  const errors: string[] = [];
  const broken: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.url().startsWith("http://localhost:4175") && r.status() >= 400)
      broken.push(r.url());
  });
  await page.goto("http://localhost:4175");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Every EV.",
  );
  await expect(
    page.getByRole("link", { name: "Find a charger", exact: true }),
  ).toHaveAttribute("href", "/app/?mode=find");
  await expect(
    page.getByRole("link", { name: "List your charger" }),
  ).toHaveAttribute("href", "/app/?mode=host");
  await expect(page.getByAltText("PlugNear").first()).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  expect(broken).toEqual([]);
  await page.screenshot({
    path: `/tmp/plugnear-website-${info.project.name}.png`,
    fullPage: true,
  });
});
test("FAQs and privacy notice are usable", async ({ page }) => {
  await page.goto("http://localhost:4175");
  await page
    .getByText("Can I book and pay for a charge today?", { exact: false })
    .click();
  await expect(
    page.getByText("The pilot supports requests to verified hosts", {
      exact: false,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Privacy", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Your privacy, at a glance." }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
test("early-access app remains reachable under its own route", async ({
  page,
}) => {
  await page.goto("http://localhost:4175");
  await page.getByRole("link", { name: "List your charger" }).click();
  await expect(page).toHaveURL(/\/app\/\?mode=host/);
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Pilot · Direct UPI receipt is confirmed by hosts, not by a bank integration.",
    ),
  ).toBeVisible();
});
test("navigation works at the selected viewport", async ({ page }, info) => {
  await page.goto("http://localhost:4175");
  if (info.project.name === "mobile") {
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.getByRole("navigation")).toBeVisible();
  }
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "FAQs" })
    .click();
  await expect(page).toHaveURL(/#questions$/);
  if (info.project.name === "mobile")
    await expect(
      page.getByRole("button", { name: "Open menu" }),
    ).toHaveAttribute("aria-expanded", "false");
});
