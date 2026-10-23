/** Planning assumptions only; not a tariff, payout, tax calculation or metered bill. */
export function hostCost({ energy, rate, tariff, loss, other }) {
  const values = { energy, rate, tariff, loss, other };
  for (const [key, value] of Object.entries(values))
    if (typeof value !== "number" || !Number.isFinite(value))
      throw Error(`Enter a valid ${key} value.`);
  if (
    energy <= 0 ||
    energy > 500 ||
    rate < 0 ||
    rate > 100 ||
    tariff < 0 ||
    tariff > 100 ||
    loss < 0 ||
    loss > 40 ||
    other < 0 ||
    other > 100000
  )
    throw Error(
      "Check energy (above 0–500 kWh), rates (₹0–100/kWh), loss (0–40%) and other costs (₹0–100,000).",
    );
  const gross = energy * rate,
    inputEnergy = energy / (1 - loss / 100),
    electricity = inputEnergy * tariff;
  return {
    gross,
    inputEnergy,
    electricity,
    other,
    contribution: gross - electricity - other,
  };
}
