import { test, expect } from "./fixtures";
const uid = "00000000-0000-4000-8000-000000000002",
  host = "00000000-0000-4000-8000-000000000001",
  cid = "10000000-0000-4000-8000-000000000001",
  bid = "20000000-0000-4000-8000-000000000001";
test("driver finds a charger, requests and reports direct UPI without claiming bank verification", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 19.07, longitude: 72.87 });
  await page.route("**/auth/v1/settings", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        external: { email: true, phone: false, google: false },
      }),
    }),
  );
  await page.route("**/auth/v1/token**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: "fixture-token",
        refresh_token: "fixture-refresh",
        token_type: "bearer",
        expires_in: 3600,
        user: {
          id: uid,
          email: "driver@example.test",
          aud: "authenticated",
          role: "authenticated",
        },
      }),
    }),
  );
  await page.route("**/*.tile.openstreetmap.org/**", (route) => route.abort());
  const charger = {
    id: cid,
    owner_id: host,
    title: "Pilot test charger",
    address: "Fixture site, Mumbai",
    connector: "Type 2",
    power_kw: 7.4,
    price_per_kwh: 15,
    latitude: 19.07,
    longitude: 72.87,
    distance_km: 0.1,
    status: "approved",
    availability_status: "available",
    availability_revision: 1,
  };
  await page.route("**/rest/v1/rpc/get_nearby_chargers", async (route) => {
    expect(route.request().postDataJSON().p_lat).toBeCloseTo(19.07);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([charger]),
    });
  });
  await page.route("**/rest/v1/availability?*", (route) =>
    route.fulfill({
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
  let status = "requested",
    payment = "unpaid";
  await page.route("**/rest/v1/rpc/reserve_charger", async (route) => {
    const body = route.request().postDataJSON();
    expect(body.p_charger).toBe(cid);
    expect(body.p_kwh).toBe(5);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: bid }),
    });
  });
  await page.route("**/rest/v1/bookings?*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: bid,
          driver_id: uid,
          charger_id: cid,
          status,
          payment_status: payment,
          amount_paise: 7500,
          starts_at: new Date(Date.now() + 300000).toISOString(),
          ends_at: new Date(Date.now() + 3900000).toISOString(),
          chargers: { title: charger.title, owner_id: host },
        },
      ]),
    }),
  );
  await page.route("**/rest/v1/rpc/get_booking_checkout", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        booking_id: bid,
        upi_vpa: "fixture@bank",
        payee_name: "Fixture Host",
        amount_paise: 7500,
        currency: "INR",
        reference: bid,
        payment_status: payment,
        bank_verified: false,
      }),
    }),
  );
  await page.route("**/rest/v1/rpc/report_upi_payment", async (route) => {
    expect(route.request().postDataJSON()).toMatchObject({
      p_booking: bid,
      p_reference: "123456789012",
    });
    payment = "reported";
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "{}",
    });
  });
  await page.goto("http://localhost:4175/app/");
  await page.getByLabel("Email", { exact: true }).fill("driver@example.test");
  await page.getByLabel("Password", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page
    .getByRole("button", { name: "Find chargers near me", exact: true })
    .click();
  await expect(
    page.getByText("1 chargers nearby", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /Pilot test charger.*View charger/ })
    .click();
  await page
    .getByRole("button", { name: "Request this charger", exact: true })
    .click();
  await expect(page.getByText("Request sent.", { exact: false })).toBeVisible();
  status = "confirmed";
  await page.getByRole("tab", { name: /Bookings/ }).click();
  await page.getByRole("button", { name: "UPI checkout", exact: true }).click();
  await expect(
    page.getByText("UPI checkout · direct to host", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Recipient: Fixture Host", { exact: false }),
  ).toContainText("₹75.00");
  await page
    .getByLabel("UPI transaction reference", { exact: true })
    .fill("123456789012");
  await page
    .getByRole("button", {
      name: "I transferred · ask host to confirm",
      exact: true,
    })
    .click();
  await expect(
    page.getByText("Payment reported by driver", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start charging session", exact: true }),
  ).not.toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("PWA manifest, icons and offline navigation work without caching backend data", async ({
  page,
  context,
}) => {
  await page.goto("http://localhost:4175/app/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  const manifest = await (
    await page.request.get("http://localhost:4175/app/manifest.webmanifest")
  ).json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.scope).toBe("/app/");
  expect(manifest.icons.map((i: { sizes: string }) => i.sizes)).toEqual([
    "192x192",
    "512x512",
  ]);
  const cached = await page.evaluate(async () => {
    const keys = await caches.keys();
    return (
      await Promise.all(
        keys.map(async (key) =>
          (await (await caches.open(key)).keys()).map((r) => r.url),
        ),
      )
    ).flat();
  });
  expect(cached.length).toBeGreaterThan(3);
  expect(
    cached.some(
      (url) =>
        url.includes("supabase.co") || url.includes("tile.openstreetmap"),
    ),
  ).toBe(false);
  await context.setOffline(true);
  await page.goto("http://localhost:4175/app/");
  await expect(
    page.getByRole("heading", {
      name: "Reconnect for your next charge.",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("No requests or payments have been queued.", {
      exact: false,
    }),
  ).toBeVisible();
  await context.setOffline(false);
});
test("host must inspect receipt before acknowledging and controls start/finish", async ({
  page,
}) => {
  let status = "confirmed",
    payment = "reported",
    confirmed = 0;
  await page.route("**/auth/v1/settings", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        external: { email: true, phone: false, google: false },
      }),
    }),
  );
  await page.route("**/auth/v1/token**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: "fixture-host-token",
        refresh_token: "fixture-host-refresh",
        token_type: "bearer",
        expires_in: 3600,
        user: {
          id: host,
          email: "host@example.test",
          aud: "authenticated",
          role: "authenticated",
        },
      }),
    }),
  );
  await page.route("**/rest/v1/bookings?*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: bid,
          driver_id: uid,
          charger_id: cid,
          status,
          payment_status: payment,
          amount_paise: 7500,
          starts_at: new Date().toISOString(),
          ends_at: new Date(Date.now() + 3600000).toISOString(),
          chargers: { title: "Fixture charger", owner_id: host },
        },
      ]),
    }),
  );
  await page.route("**/rest/v1/rpc/get_booking_checkout", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        booking_id: bid,
        upi_vpa: "fixture@bank",
        payee_name: "Fixture Host",
        amount_paise: 7500,
        currency: "INR",
        reference: bid,
        payment_status: payment,
        reported_reference: "123456789012",
        bank_verified: false,
      }),
    }),
  );
  await page.route("**/rest/v1/rpc/confirm_upi_receipt", async (route) => {
    confirmed++;
    payment = "host_confirmed";
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "{}",
    });
  });
  await page.route("**/rest/v1/rpc/start_charging", async (route) => {
    status = "charging";
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "{}",
    });
  });
  await page.route("**/rest/v1/rpc/complete_charging", async (route) => {
    status = "completed";
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "{}",
    });
  });
  await page.goto("http://localhost:4175/app/");
  await page.getByLabel("Email", { exact: true }).fill("host@example.test");
  await page.getByLabel("Password", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("tab", { name: /Bookings/ }).click();
  await expect(
    page.getByText("UPI reference: 123456789012", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Confirm money received", exact: true }),
  ).toBeDisabled();
  expect(confirmed).toBe(0);
  await page.getByRole("checkbox").click();
  await page
    .getByRole("button", { name: "Confirm money received", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Start charging session", exact: true })
    .click();
  await expect(
    page.getByText("Charging in progress.", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Finish charging session", exact: true })
    .click();
  await expect(page.getByText("completed", { exact: true })).toBeVisible();
  expect(confirmed).toBe(1);
});

test("TWA association endpoint accepts only configured PlugNear signing certificates", async ({
  page,
}) => {
  const response = await page.request.get(
    "http://localhost:4175/.well-known/assetlinks.json",
  );
  expect(response.status()).toBe(200);
  const associations = await response.json();
  expect(Array.isArray(associations)).toBe(true);
  for (const association of associations) {
    expect(association.relation).toEqual([
      "delegate_permission/common.handle_all_urls",
    ]);
    expect(association.target.namespace).toBe("android_app");
    expect(association.target.package_name).toBe("in.plugnear.mobile");
    expect(association.target.sha256_cert_fingerprints.length).toBeGreaterThan(
      0,
    );
    for (const certificate of association.target.sha256_cert_fingerprints)
      expect(certificate).toMatch(/^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/);
  }
});
