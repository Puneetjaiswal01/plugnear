import { test as base, expect } from "@playwright/test";
export const test = base.extend({
  page: async ({ page }, use) => {
    // Test-specific routes registered later override this deny-by-default route.
    // Browser tests must never depend on or mutate the live PlugNear backend.
    await page.route("https://yxisoddhwlzetrnfbbno.supabase.co/**", (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Unmocked backend request blocked by test fixture",
        }),
      }),
    );
    await use(page);
  },
});
export { expect };
