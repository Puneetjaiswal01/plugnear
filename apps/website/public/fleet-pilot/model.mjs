export function planFleet({ vehicles, kmPerDay, whPerKm, powerKw, hours }) {
  const fields = [
    ["vehicles", vehicles, 1, 500, true],
    ["kmPerDay", kmPerDay, 1, 300, false],
    ["whPerKm", whPerKm, 10, 500, false],
    ["powerKw", powerKw, 0.1, 22, false],
    ["hours", hours, 0.5, 24, false],
  ];
  for (const [name, value, min, max, whole] of fields)
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < min ||
      value > max ||
      (whole && !Number.isInteger(value))
    )
      throw new Error(
        `Check ${name}: use ${min}–${max}${whole ? " whole vehicles" : ""}.`,
      );
  const efficiency = 0.85;
  const vehicleEnergyKwh = (vehicles * kmPerDay * whPerKm) / 1000;
  const inputEnergyKwh = vehicleEnergyKwh / efficiency;
  const modelledPoints = Math.ceil(inputEnergyKwh / (powerKw * hours));
  return { vehicleEnergyKwh, inputEnergyKwh, modelledPoints, efficiency };
}
export function pilotBrief(input, plan) {
  return `PLUGNEAR — EXPLORATORY FLEET PILOT BRIEF\n\nPlanning only. Not a quote, booking, submission or site design.\n\nVehicles: ${input.vehicles}\nDistance per vehicle per day: ${input.kmPerDay} km\nAssumed energy use: ${input.whPerKm} Wh/km\nCharging power per vehicle: ${input.powerKw} kW\nDaily charging window per point: ${input.hours} hours\nAssumed charging efficiency: ${plan.efficiency * 100}%\n\nModelled vehicle energy: ${plan.vehicleEnergyKwh.toFixed(2)} kWh/day\nModelled input energy: ${plan.inputEnergyKwh.toFixed(2)} kWh/day\nModelled parallel points: ${plan.modelledPoints}\n\nNEXT VALIDATION\n- Operating area, regular stops, rider shifts and vehicle/OEM charger models\n- Actual energy/session measurements, taper and arrival patterns\n- Site permission, parking, electrical protection, sanctioned load and independent inspection\n- Metering, tariff, tax, settlement and refund policy\n- Host availability and fleet authorisation rules\n\nThis simple energy model assumes all points can operate for the full selected window and ignores queueing, taper, downtime and site-load limits. It does not prove compatibility or guarantee capacity.\n\nFleet billing, priority access and CPO roaming are not live PlugNear services.\nThis file was generated locally in your browser and was not submitted to PlugNear.\n`;
}
