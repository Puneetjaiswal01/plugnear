import { test } from "node:test";
import assert from "node:assert/strict";
import {
  planFleet,
  VEHICLE_PRESETS,
  pilotBrief,
} from "../apps/website/public/fleet-pilot/model.mjs";
const input = {
  vehicles: 20,
  kmPerDay: 40,
  whPerKm: 35,
  powerKw: 0.6,
  hours: 6,
};
test("fleet model accounts for energy, charging losses and parallel-point rounding", () => {
  const p = planFleet(input);
  assert.equal(p.vehicleEnergyKwh, 28);
  assert.ok(Math.abs(p.inputEnergyKwh - 28 / 0.85) < 0.00001);
  assert.equal(p.modelledPoints, 10);
  assert.equal(p.efficiency, 0.85);
});
test("a longer charging window reduces modelled parallel points without changing daily energy", () => {
  const a = planFleet(input),
    b = planFleet({ ...input, hours: 12 });
  assert.equal(b.vehicleEnergyKwh, a.vehicleEnergyKwh);
  assert.equal(b.modelledPoints, 5);
});
test("fleet inputs reject non-finite, fractional counts and unsupported bounds", () => {
  for (const patch of [
    { vehicles: 0 },
    { vehicles: 1.5 },
    { vehicles: 501 },
    { kmPerDay: 0 },
    { kmPerDay: Infinity },
    { whPerKm: NaN },
    { whPerKm: 2001 },
    { powerKw: 0 },
    { powerKw: 351 },
    { hours: 0 },
    { hours: 25 },
    { vehicles: "20" },
  ])
    assert.throws(() => planFleet({ ...input, ...patch }));
});
test("pilot export includes assumptions and distinguishes a local plan from a submitted booking", () => {
  const p = planFleet(input),
    text = pilotBrief(input, p);
  assert.match(text, /20/);
  assert.match(text, /85%/);
  assert.match(text, /not submitted to PlugNear/);
  assert.match(text, /Not a quote, booking, submission or site design/);
  assert.match(text, /not live PlugNear services/);
});

test("car, taxi, bike, three-wheeler, van and bus presets are valid editable scenarios", () => {
  assert.deepEqual(Object.keys(VEHICLE_PRESETS), [
    "2w",
    "3w",
    "car",
    "taxi",
    "van",
    "bus",
  ]);
  for (const [name, preset] of Object.entries(VEHICLE_PRESETS)) {
    const p = planFleet({ ...input, ...preset });
    assert.ok(Number.isFinite(p.inputEnergyKwh), name);
    assert.ok(p.modelledPoints > 0, name);
  }
  assert.equal(
    planFleet({ ...input, ...VEHICLE_PRESETS.car }).vehicleEnergyKwh,
    128,
  );
  assert.equal(
    planFleet({ ...input, ...VEHICLE_PRESETS.bus }).vehicleEnergyKwh,
    880,
  );
});
test("export names the vehicle group and explains mixed-fleet limits", () => {
  const i = { ...input, vehicleGroup: "Electric taxis" };
  const text = pilotBrief(i, planFleet(i));
  assert.match(text, /Vehicle group: Electric taxis/);
  assert.match(text, /separate brief per vehicle group/);
});
