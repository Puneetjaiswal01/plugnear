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
    await page.routeWebSocket(
      "wss://yxisoddhwlzetrnfbbno.supabase.co/**",
      (socket) => {
        socket.onMessage((raw) => {
          try {
            const message = JSON.parse(String(raw));
            const array = Array.isArray(message);
            const [joinRef, ref, topic, event, payload] = array
              ? message
              : [
                  null,
                  message.ref,
                  message.topic,
                  message.event,
                  message.payload,
                ];
            if (event === "phx_join" || event === "heartbeat") {
              const changes = (payload?.config?.postgres_changes || []).map(
                (item: Record<string, unknown>, index: number) => ({
                  ...item,
                  id: index + 1,
                }),
              );
              const reply = {
                status: "ok",
                response: { postgres_changes: changes },
              };
              socket.send(
                JSON.stringify(
                  array
                    ? [joinRef, ref, topic, "phx_reply", reply]
                    : { ref, topic, event: "phx_reply", payload: reply },
                ),
              );
            }
          } catch {
            /* No real websocket connection is made by this test fixture. */
          }
        });
      },
    );
    await use(page);
  },
});
export { expect };
