import { test, expect } from "./fixtures";
test("admin dashboard is gated and responsive", async ({ page }) => {
  await page.goto("http://localhost:4173");
  await expect(
    page.getByRole("heading", { name: "Welcome to your control centre." }),
  ).toBeVisible();
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sign in to operations" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Approve" })).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("failed authentication never exposes admin controls", async ({ page }) => {
  await page.route("**/auth/v1/token**", (route) =>
    route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({
        error: "invalid_grant",
        error_description: "Invalid login credentials",
        msg: "Invalid login credentials",
      }),
    }),
  );
  await page.goto("http://localhost:4173");
  await page.getByLabel("Email address").fill("unauthorized@example.test");
  await page
    .getByLabel("Password", { exact: true })
    .fill("not-a-valid-password");
  await page.getByRole("button", { name: "Sign in to operations" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Confirm decision" }),
  ).toHaveCount(0);
});
test("marketplace starts at authentication with two primary options", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://localhost:4174");
  await expect(page.getByText("Find", { exact: false }).first()).toBeVisible();
  await expect(
    page.getByText("List a charger", { exact: false }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
async function fixtureLogin(
  page: import("@playwright/test").Page,
  admin: boolean,
) {
  const uid = "00000000-0000-4000-8000-000000000004";
  await page.route("**/auth/v1/token**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: "test-access-token",
        refresh_token: "test-refresh-token",
        token_type: "bearer",
        expires_in: 3600,
        user: {
          id: uid,
          email: "admin@example.test",
          aud: "authenticated",
          role: "authenticated",
        },
      }),
    }),
  );
  await page.route("**/rest/v1/rpc/my_access", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ active: true, admin }),
    }),
  );
  await page.route("**/rest/v1/chargers?*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "10000000-0000-4000-8000-000000000001",
          owner_id: uid,
          title: "Fixture charger",
          address: "Powai, Mumbai, India",
          connector: "Type 2",
          power_kw: 7.4,
          price_per_kwh: 15,
          status: "pending",
        },
      ]),
    }),
  );
  for (const table of [
    "profiles",
    "bookings",
    "host_verifications",
    "disputes",
    "admin_audit",
  ])
    await page.route(`**/rest/v1/${table}?*`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      }),
    );
  await page.goto("http://localhost:4173");
  await page.getByLabel("Email address").fill("admin@example.test");
  await page.getByLabel("Password", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Sign in to operations" }).click();
}
test("signed-in member cannot open admin workspace", async ({ page }) => {
  await fixtureLogin(page, false);
  await expect(
    page.getByText("Administrator access is required.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Chargers", exact: true }),
  ).toHaveCount(0);
});
test("admin review sends a reason to guarded RPC and shows server errors", async ({
  page,
}) => {
  await page.route("**/rest/v1/rpc/admin_action", async (route) => {
    const body = route.request().postDataJSON();
    expect(body.p_action).toBe("charger");
    expect(body.p_value).toBe("approved");
    expect(body.p_note).toBe("Installation checked in test fixture");
    await route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({
        message: "Target unavailable or prerequisite unmet",
        code: "P0001",
      }),
    });
  });
  await fixtureLogin(page, true);
  await expect(
    page.getByRole("heading", { name: "Let’s keep India moving." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Review", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByLabel("Review note")
    .fill("Installation checked in test fixture");
  await page.getByRole("button", { name: "Confirm decision" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "prerequisite unmet",
  );
});
