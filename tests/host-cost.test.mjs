import { test } from "node:test";
import assert from "node:assert/strict";
import { hostCost } from "../apps/website/public/hosting/cost-model.mjs";
const example = { energy: 5, rate: 15, tariff: 9, loss: 10, other: 0 };
test("host estimate accounts for input energy lost and permits a negative contribution", () => {
  const x = hostCost(example);
  assert.equal(x.gross, 75);
  assert.ok(Math.abs(x.inputEnergy - 5 / 0.9) < 0.00001);
  assert.equal(x.electricity, 50);
  assert.equal(x.contribution, 25);
  assert.equal(hostCost({ ...example, other: 30 }).contribution, -5);
  assert.equal(hostCost({ ...example, loss: 0 }).electricity, 45);
});
test("host model rejects blank, infinite and out of range assumptions", () => {
  for (const change of [
    { energy: NaN },
    { energy: 0 },
    { rate: Infinity },
    { tariff: -1 },
    { loss: 100 },
    { loss: 41 },
    { other: -1 },
    { rate: "15" },
  ])
    assert.throws(() => hostCost({ ...example, ...change }));
});
