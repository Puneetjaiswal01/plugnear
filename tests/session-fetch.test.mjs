import { test } from "node:test";
import assert from "node:assert/strict";
import {
  sessionFetch,
  hasSessionToken,
  SESSION_REQUIRED,
} from "../apps/mobile/src/session-fetch.ts";
const url = "https://yxisoddhwlzetrnfbbno.supabase.co";
const key = "sb_publishable_fixture";
test("protected requests never fall back to the public API key or a missing session", async () => {
  let sends = 0,
    recoveries = 0;
  const guarded = sessionFetch(
    url,
    key,
    () => recoveries++,
    async () => {
      sends++;
      return new Response("{}");
    },
  );
  for (const authorization of [
    undefined,
    `Bearer ${key}`,
    "Bearer sb_secret_misconfigured",
    "",
  ])
    await assert.rejects(
      () =>
        guarded(`${url}/rest/v1/rpc/get_nearby_chargers`, {
          method: "POST",
          headers: authorization ? { authorization } : {},
        }),
      new RegExp(SESSION_REQUIRED.replaceAll(".", "\\.")),
    );
  assert.equal(sends, 0);
  assert.equal(recoveries, 4);
});
test("signed-in transport preserves the session header and recovers a rejected token without retrying writes", async () => {
  let sends = 0,
    recoveries = 0;
  const guarded = sessionFetch(
    url,
    key,
    () => recoveries++,
    async (input, init) => {
      sends++;
      assert.equal(
        new Headers(init.headers).get("Authorization"),
        "Bearer fixture-user-token",
      );
      return new Response('{"code":"PGRST301"}', { status: 401 });
    },
  );
  const response = await guarded(`${url}/rest/v1/rpc/reserve_charger`, {
    method: "POST",
    headers: { Authorization: "Bearer fixture-user-token" },
  });
  assert.equal(response.status, 401);
  assert.equal(sends, 1);
  assert.equal(recoveries, 1);
});
test("Auth and public settings remain accessible, and 403 does not masquerade as an expired session", async () => {
  let recoveries = 0;
  const guarded = sessionFetch(
    url,
    key,
    () => recoveries++,
    async () => new Response("{}", { status: 403 }),
  );
  await guarded(`${url}/auth/v1/settings`, { headers: { apikey: key } });
  await guarded(`${url}/rest/v1/chargers`, {
    headers: { authorization: "Bearer fixture-token" },
  });
  assert.equal(recoveries, 0);
  assert.equal(
    hasSessionToken({ user: { id: "fixture" }, access_token: key }, key),
    false,
  );
  assert.equal(hasSessionToken({ user: { id: "fixture" } }, key), false);
  assert.equal(
    hasSessionToken(
      { user: { id: "fixture" }, access_token: "fixture-user-token" },
      key,
    ),
    true,
  );
});
