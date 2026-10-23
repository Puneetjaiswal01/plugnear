import { test } from "node:test";
import assert from "node:assert/strict";
import {
  earliestStart,
  sessionEstimate,
  indiaTime,
} from "../apps/mobile/src/session-plan.ts";
const now = Date.parse("2026-11-01T00:00:00Z");
const slot = {
  starts_at: "2026-11-01T00:00:00Z",
  ends_at: "2026-11-01T04:00:00Z",
};
test("request planning fits a single host window and rounds the estimate to paise", () => {
  const start = earliestStart(slot, now);
  assert.equal(start, "2026-11-01T00:05:00.000Z");
  const plan = sessionEstimate(start, 1, 5, 15, [slot], now);
  assert.equal(plan.amount_paise, 7500);
  assert.equal(plan.ends_at, "2026-11-01T01:05:00.000Z");
  assert.equal(
    sessionEstimate(start, 0.5, 0.123, 1.23, [slot], now).amount_paise,
    15,
  );
});
test("planning rejects expired starts, invalid energy and sessions spanning a gap", () => {
  for (const [start, hours, kwh] of [
    [slot.starts_at, 1, 5],
    ["not-a-date", 1, 5],
    [earliestStart(slot, now), 13, 5],
    [earliestStart(slot, now), 1, 0],
    [earliestStart(slot, now), 1, NaN],
    [earliestStart(slot, now), 1, 501],
  ])
    assert.throws(() => sessionEstimate(start, hours, kwh, 15, [slot], now));
  const slots = [
    { starts_at: "2026-11-01T01:00:00Z", ends_at: "2026-11-01T02:00:00Z" },
    { starts_at: "2026-11-01T03:00:00Z", ends_at: "2026-11-01T04:00:00Z" },
  ];
  assert.throws(
    () => sessionEstimate(slots[0].starts_at, 3, 5, 15, slots, now),
    /one host/,
  );
  assert.throws(
    () =>
      earliestStart(
        { starts_at: slot.starts_at, ends_at: "2026-11-01T00:20:00Z" },
        now,
      ),
    /30 minutes/,
  );
});
test("future host windows preserve their start and display India time independent of the device zone", () => {
  const future = { starts_at: "2026-11-01T02:00:00Z", ends_at: slot.ends_at };
  assert.equal(earliestStart(future, now), "2026-11-01T02:00:00.000Z");
  assert.match(indiaTime(future.starts_at), /7:30/);
});
