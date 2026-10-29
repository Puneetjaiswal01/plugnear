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
    "Find or share",
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

test("search discovery pages have consistent canonical URLs and usable links", async ({
  page,
}) => {
  await page.goto("http://localhost:4175/");
  const graph = await page
    .locator('script[type="application/ld+json"]')
    .textContent();
  const entities = JSON.parse(graph!)["@graph"];
  expect(
    entities.map((entity: { "@type": string }) => entity["@type"]),
  ).toEqual(["Organization", "WebSite"]);
  expect(entities[0].email).toBe("puneetjaiswal@zohomail.in");
  await page
    .getByRole("link", { name: "Find EV charging near you", exact: true })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Looking for an EV charger near you?",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const links = await page
    .locator("main a[href^='/']")
    .evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("href")!),
    );
  for (const href of new Set(links))
    expect(
      (await page.request.get(`http://localhost:4175${href}`)).status(),
    ).toBe(200);
  const sitemap = await (
    await page.request.get("http://localhost:4175/sitemap.xml")
  ).text();
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(
    (match) => match[1],
  );
  expect(urls.length).toBe(9);
  for (const url of urls) {
    const path = new URL(url).pathname;
    await page.goto(`http://localhost:4175${path}`);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      url,
    );
    expect(
      await page.locator('meta[name="description"]').getAttribute("content"),
    ).toBeTruthy();
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  }
});

test("homepage anchors resolve and pilot enquiry stays local until email is sent", async ({
  page,
}) => {
  await page.goto("http://localhost:4175/");
  const broken = await page
    .locator('a[href^="#"]')
    .evaluateAll((links) =>
      links
        .map((link) => link.getAttribute("href")!)
        .filter(
          (href) => href.length > 1 && !document.getElementById(href.slice(1)),
        ),
    );
  expect(broken).toEqual([]);
  await page
    .getByRole("link", { name: "Explore PlugNear", exact: false })
    .click();
  await expect(page).toHaveURL(/#early-access$/);
  await page.getByRole("link", { name: "Pilot enquiry", exact: true }).click();
  const writes: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET") writes.push(request.url());
  });
  await page
    .getByLabel("City or neighbourhood", { exact: true })
    .fill("Noida & Delhi");
  await page
    .getByLabel("I’m interested as a", { exact: true })
    .selectOption("Host");
  await page.getByLabel("Vehicle type", { exact: true }).selectOption("Car");
  const form = page.locator("#pilot-enquiry-form");
  expect(
    await form.evaluate((element: HTMLFormElement) => element.checkValidity()),
  ).toBe(false);
  await form.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Prepare enquiry email", exact: false })
    .click();
  await expect(page.locator("#enquiry-status")).toContainText(
    "Nothing has been submitted or added to a waitlist",
  );
  const href = await page
    .getByRole("link", { name: "Open your email draft", exact: true })
    .getAttribute("href");
  const mail = new URL(href!);
  expect(mail.protocol).toBe("mailto:");
  expect(mail.pathname).toBe("puneetjaiswal@zohomail.in");
  expect(mail.searchParams.get("body")).toContain("Noida & Delhi");
  expect(mail.searchParams.get("body")).toContain("Role: Host");
  expect(writes).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("host guide calculator is local, exposes assumptions and handles negative contributions", async ({
  page,
}) => {
  const writes: string[] = [];
  page.on("request", (r) => {
    if (r.method() !== "GET") writes.push(r.url());
  });
  await page.goto("http://localhost:4175/hosting/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Share your charger",
  );
  await expect(page.getByRole("status")).toContainText("₹25.00 contribution");
  await page
    .getByLabel("Other assumed session costs (₹)", { exact: true })
    .fill("30");
  await expect(page.getByRole("status")).toContainText("-₹5.00 contribution");
  await page.getByLabel("Energy delivered (kWh)", { exact: true }).fill("");
  await expect(page.getByRole("status")).toContainText("valid energy");
  await expect(page.getByRole("status")).not.toContainText("NaN");
  expect(writes).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("link", { name: "Apply to host →", exact: true }),
  ).toHaveAttribute("href", "/app/?mode=host");
});

test("public contacts omit personal phone numbers and common entry URLs open the intended routes", async ({
  page,
}) => {
  for (const path of ["/", "/support/", "/ev-charger-near-me/"]) {
    await page.goto(`http://localhost:4175${path}`);
    expect(await page.locator('a[href^="tel:"]').count()).toBe(0);
    const html = await page.content();
    expect(html).not.toMatch(/9650238165|8278136027|96502 38165|82781 36027/);
  }
  for (const [alias, target] of [
    ["find", "/app/?mode=find"],
    ["host", "/app/?mode=host"],
    ["fleet", "/fleet-pilot/"],
    ["fleet-planner", "/fleet-pilot/"],
  ]) {
    await page.goto(`http://localhost:4175/${alias}`);
    expect(new URL(page.url()).pathname + new URL(page.url()).search).toBe(
      target,
    );
    if (alias === "find" || alias === "host")
      await expect(
        page.getByRole("button", { name: "Sign in", exact: true }),
      ).toBeVisible();
    else
      await expect(page.getByRole("heading", { level: 1 })).toContainText(
        "Start with your routes",
      );
  }
});

test("app loading failure offers recovery and public guides instead of a blank page", async ({
  page,
}) => {
  await page.clock.install();
  await page.route("**/_expo/static/js/web/*.js", (r) => r.abort());
  await page.goto("http://localhost:4175/app/?mode=host");
  await expect(
    page.getByRole("heading", { name: "Opening PlugNear…", exact: true }),
  ).toBeVisible();
  await page.clock.fastForward(10001);
  await expect(
    page.getByRole("heading", {
      name: "Taking longer than expected?",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Fleet planner", exact: true }),
  ).toHaveAttribute("href", "https://www.plugnear.in/fleet-pilot/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("app with JavaScript disabled explains the requirement and keeps public help reachable", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  try {
    const page = await context.newPage();
    await page.goto("http://localhost:4175/app/");
    await expect(
      page.getByText("JavaScript is disabled.", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Host guide", exact: true }),
    ).toHaveAttribute("href", "https://www.plugnear.in/hosting/");
  } finally {
    await context.close();
  }
});
