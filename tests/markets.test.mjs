import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getMarket,
  marketMoney,
  marketTime,
  assertBookingMarket,
} from "../packages/core/markets.mjs";
import { upiUri } from "../apps/mobile/src/upi.ts";
import {
  pilotBrief,
  planFleet,
} from "../apps/website/public/fleet-pilot/model.mjs";
test("country settings distinguish Dubai partnership planning from the India pilot", () => {
  assert.equal(getMarket("IN").currency, "INR");
  assert.equal(assertBookingMarket("IN").area, "Delhi NCR");
  assert.equal(getMarket("AE").currency, "AED");
  assert.equal(getMarket("AE").bookingMode, "partnership-only");
  assert.throws(() => assertBookingMarket("AE"), /not available/);
  for (const code of ["US", "", "ae", "__proto__", null])
    assert.throws(() => getMarket(code));
});
test("country times are explicit and currencies never silently convert", () => {
  const value = "2026-11-01T00:00:00Z";
  assert.match(marketTime("IN", value), /5:30/);
  assert.match(marketTime("AE", value), /4:00/);
  assert.match(marketMoney("IN", 7500), /75.00/);
  assert.match(marketMoney("AE", 7500), /75.00/);
  assert.notEqual(marketMoney("AE", 7500), marketMoney("IN", 7500));
  assert.throws(() => marketMoney("AE", NaN));
  assert.throws(() => marketTime("AE", "invalid"));
});
test("Dubai context cannot produce an India UPI payment and is explicit in fleet briefs", () => {
  assert.throws(
    () =>
      upiUri({
        booking_id: "10000000-0000-4000-8000-000000000001",
        upi_vpa: "host@testbank",
        payee_name: "Fixture",
        amount_paise: 7500,
        currency: "AED",
      }),
    /Invalid checkout/,
  );
  const input = {
    market: "AE",
    vehicles: 20,
    kmPerDay: 40,
    whPerKm: 35,
    powerKw: 0.6,
    hours: 6,
  };
  const brief = pilotBrief(input, planFleet(input));
  assert.match(brief, /Dubai/);
  assert.match(brief, /AED/);
  assert.match(brief, /Asia\/Dubai/);
  assert.match(brief, /no booking, listing or payment/);
  assert.throws(() => pilotBrief({ ...input, market: "US" }, planFleet(input)));
});

test("the browser settings copy matches the shared market source", async () => {
  const { readFile } = await import("node:fs/promises");
  assert.equal(
    await readFile(
      new URL("../apps/website/public/markets.mjs", import.meta.url),
      "utf8",
    ),
    await readFile(
      new URL("../packages/core/markets.mjs", import.meta.url),
      "utf8",
    ),
  );
});
