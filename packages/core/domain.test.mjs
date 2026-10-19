import { test } from "node:test";
import assert from "node:assert/strict";
import { bookingWindow, requirePlugNear, inr } from "./domain.ts";
test("only the dedicated PlugNear backend is accepted", () => {
  assert.doesNotThrow(() =>
    requirePlugNear(
      "https://yxisoddhwlzetrnfbbno.supabase.co",
      "sb_publishable_test",
    ),
  );
  assert.throws(
    () => requirePlugNear("https://other.supabase.co", "sb_publishable_test"),
    /dedicated/,
  );
  assert.throws(
    () =>
      requirePlugNear(
        "https://yxisoddhwlzetrnfbbno.supabase.co",
        "sb_secret_test",
      ),
    /publishable/,
  );
});
test("booking windows reject invalid, past, short and overlong durations", () => {
  const future = new Date(Date.now() + 86400000).toISOString();
  for (const hours of [NaN, 0, -1, 0.1, 13])
    assert.throws(() => bookingWindow(future, hours));
  assert.throws(() => bookingWindow("invalid", 1));
  assert.throws(() => bookingWindow("2020-01-01", 1));
  const b = bookingWindow(future, 1.5);
  assert.equal(Date.parse(b.ends_at) - Date.parse(b.starts_at), 5400000);
});
test("prices render as Indian rupees from integer paise", () => {
  assert.match(inr(7500), /75/);
  assert.match(inr(10000000), /1,00,000/);
});
