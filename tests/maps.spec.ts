import { test, expect } from "./fixtures";
const host = "00000000-0000-4000-8000-000000000001",
  driver = "00000000-0000-4000-8000-000000000002",
  cid = "10000000-0000-4000-8000-000000000001";
async function prepare(
  page: import("@playwright/test").Page,
  state = "available",
) {
  await page.route("**/auth/v1/settings", (r) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        external: { email: true, phone: false, google: false },
      }),
    }),
  );
  await page.route("**/auth/v1/token**", (r) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: "fixture-map-token",
        refresh_token: "fixture-refresh",
        token_type: "bearer",
        expires_in: 3600,
        user: {
          id: driver,
          email: "maps@example.test",
          aud: "authenticated",
          role: "authenticated",
        },
      }),
    }),
  );
  await page.route("**/rest/v1/availability?*", (r) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          starts_at: new Date(Date.now() - 3600000).toISOString(),
          ends_at: new Date(Date.now() + 86400000).toISOString(),
        },
      ]),
    }),
  );
  await page.route("**/*.tile.openstreetmap.org/**", (r) => r.abort());
  const charger = {
    id: cid,
    owner_id: host,
    title: "Fixture Delhi charger",
    address: "Fixture site, Delhi",
    latitude: 28.614,
    longitude: 77.209,
    connector: "Type 2",
    power_kw: 7.4,
    price_per_kwh: 15,
    status: "approved",
    availability_status: state,
    distance_km: 0.1,
  };
  const requests: Record<string, unknown>[] = [];
  await page.route("**/rest/v1/rpc/get_nearby_chargers", async (r) => {
    requests.push(r.request().postDataJSON());
    await r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([charger]),
    });
  });
  await page.goto("http://localhost:4175/app/");
  await page.getByLabel("Email", { exact: true }).fill("maps@example.test");
  await page.getByLabel("Password", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("region", { name: /Nearby charger map/ }),
  ).toBeVisible();
  return requests;
}
test("map area search works when GPS is denied and tile failures preserve the list", async ({
  page,
  context,
}) => {
  await page.addInitScript(() => {
    navigator.geolocation.getCurrentPosition = (_success, error) =>
      error?.({
        code: 1,
        message: "Permission denied",
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      });
  });
  const requests = await prepare(page);
  expect(requests).toHaveLength(0);
  await expect(
    page.getByText("Map starts in Delhi NCR, not your GPS location.", {
      exact: false,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Find chargers near me", exact: true })
    .click();
  await expect(
    page.getByText("Location permission is off.", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Search this map area", exact: true })
    .click();
  await expect(
    page.getByText("1 chargers nearby", { exact: true }),
  ).toBeVisible();
  expect(requests[0].p_lat).toBeCloseTo(28.6139, 3);
  expect(requests[0].p_lon).toBeCloseTo(77.209, 3);
  await expect(
    page.getByText("Map tiles could not load.", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /Fixture Delhi charger.*View charger/ })
    .click();
  await expect(
    page.getByRole("button", { name: "Get directions", exact: false }),
  ).toBeVisible();
  let destination = "";
  await context.route("https://www.google.com/**", (route) => {
    destination =
      new URL(route.request().url()).searchParams.get("destination") || "";
    return route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<p>Navigation fixture</p>",
    });
  });
  await page
    .getByRole("button", { name: "Get directions", exact: false })
    .click();
  await expect.poll(() => destination).toBe("28.614,77.209");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("GPS centers nearby search, markers support keyboard selection and filters reach the spatial RPC", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 28.6139, longitude: 77.209 });
  const requests = await prepare(page);
  await page
    .getByRole("button", { name: "Find chargers near me", exact: true })
    .click();
  await expect(
    page.getByText("1 chargers nearby", { exact: true }),
  ).toBeVisible();
  expect(requests[0].p_lat).toBeCloseTo(28.6139, 3);
  const marker = page.getByRole("button", {
    name: "View Fixture Delhi charger · available",
    exact: true,
  });
  await marker.focus();
  await marker.press("Enter");
  await expect(
    page.getByRole("button", { name: "Request this charger", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", {
      name: "View Fixture Delhi charger · available",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "CCS2", exact: true }).click();
  await expect.poll(() => requests.at(-1)?.p_connector).toBe("CCS2");
  await page.getByLabel("Within (km)", { exact: true }).fill("25");
  await expect.poll(() => requests.at(-1)?.p_radius_km).toBe(25);
});

test("driver chooses a published host window, checks the estimate and cannot request across its boundary", async ({
  page,
}) => {
  const windows = [
    {
      starts_at: new Date(Date.now() - 3600000).toISOString(),
      ends_at: new Date(Date.now() + 86400000).toISOString(),
    },
    {
      starts_at: new Date(Date.now() + 2 * 86400000).toISOString(),
      ends_at: new Date(Date.now() + 2 * 86400000 + 3 * 3600000).toISOString(),
    },
  ];
  await prepare(page);
  await page.route("**/rest/v1/availability?*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(windows),
    }),
  );
  const reservations: Record<string, unknown>[] = [];
  await page.route("**/rest/v1/rpc/reserve_charger", async (route) => {
    reservations.push(route.request().postDataJSON());
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: '{"id":"fixture-reservation"}',
    });
  });
  await page
    .getByRole("button", { name: "Search this map area", exact: true })
    .click();
  await page
    .getByRole("button", { name: /Fixture Delhi charger.*View charger/ })
    .click();
  await page
    .getByRole("button", { name: /Start in window:/ })
    .nth(1)
    .click();
  await page.getByLabel("Session duration (hours)", { exact: true }).fill("4");
  await expect(
    page.getByText(
      "Your session must fit inside one host availability window.",
      { exact: false },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Request this charger", exact: true }),
  ).toBeDisabled();
  expect(reservations).toEqual([]);
  await page.getByLabel("Session duration (hours)", { exact: true }).fill("2");
  await expect(
    page.getByText("Estimate ₹75.00 = 5 kWh", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Request this charger", exact: true })
    .click();
  await expect(page.getByText("Request sent.", { exact: false })).toBeVisible();
  expect(reservations).toHaveLength(1);
  expect(reservations[0].p_start).toBe(
    new Date(windows[1].starts_at).toISOString(),
  );
  expect(
    Date.parse(String(reservations[0].p_end)) -
      Date.parse(String(reservations[0].p_start)),
  ).toBe(2 * 3600000);
});

test("empty supply gives useful actions and a failed search does not claim zero inventory", async ({
  page,
}, info) => {
  const requests = await prepare(page);
  await page.route("**/rest/v1/rpc/get_nearby_chargers", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
  await page
    .getByRole("button", { name: "Search this map area", exact: true })
    .click();
  await expect(
    page.getByText("No approved chargers match this search yet.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Request this charger", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Search a wider area", exact: true })
    .click();
  await expect(page.getByLabel("Within (km)", { exact: true })).toHaveValue(
    "25",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `/tmp/plugnear-empty-${info.project.name}.png`,
    fullPage: true,
  });
  await page.route("**/rest/v1/rpc/get_nearby_chargers", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: '{"message":"Service temporarily unavailable"}',
    }),
  );
  await page
    .getByRole("button", { name: "Search this map area", exact: true })
    .click();
  await expect(
    page.getByText("Charger search unavailable", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("No approved chargers match this search yet.", {
      exact: false,
    }),
  ).toHaveCount(0);
  expect(requests).toEqual([]);
});

test("a missing stored session returns the stale discovery screen to sign-in without sending an anonymous search", async ({
  page,
}) => {
  await prepare(page);
  let searches = 0;
  await page.route("**/rest/v1/rpc/get_nearby_chargers", (route) => {
    searches++;
    return route.fulfill({
      status: 401,
      contentType: "application/json",
      body: '{"code":"42501","message":"permission denied for function get_nearby_chargers"}',
    });
  });
  await page.route("**/auth/v1/logout**", (route) =>
    route.fulfill({ status: 204 }),
  );
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("sb-") && key.endsWith("-auth-token"))
        localStorage.removeItem(key);
    }
  });
  await page
    .getByRole("button", { name: "Search this map area", exact: true })
    .click();
  await expect(
    page.getByText(
      "Your session ended. Sign in again to search chargers or manage bookings.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: /Nearby charger map/ }),
  ).toHaveCount(0);
  expect(searches).toBe(0);
});

test("a server-rejected session stops discovery polling and offers a fresh sign-in", async ({
  page,
}) => {
  await page.clock.install();
  await prepare(page);
  let searches = 0;
  await page.route("**/rest/v1/rpc/get_nearby_chargers", (route) => {
    searches++;
    expect(route.request().headers().authorization).toBe(
      "Bearer fixture-map-token",
    );
    return route.fulfill({
      status: 401,
      contentType: "application/json",
      body: '{"code":"PGRST301","message":"JWT expired"}',
    });
  });
  await page.route("**/auth/v1/logout**", (route) =>
    route.fulfill({ status: 204 }),
  );
  await page
    .getByRole("button", { name: "Search this map area", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Your session ended. Sign in again to search chargers or manage bookings.",
      { exact: true },
    ),
  ).toBeVisible();
  await page.clock.fastForward(31000);
  expect(searches).toBe(1);
});
