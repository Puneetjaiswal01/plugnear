import { planFleet, pilotBrief, VEHICLE_PRESETS } from "./model.mjs";
const form = document.querySelector("#fleet-form"),
  error = document.querySelector("#planner-error"),
  download = document.querySelector("#download-brief");
let latest = null;
function calculate() {
  try {
    const data = new FormData(form);
    const input = Object.fromEntries(
      ["vehicles", "kmPerDay", "whPerKm", "powerKw", "hours"].map((k) => [
        k,
        Number(data.get(k)),
      ]),
    );
    input.vehicleGroup =
      document.querySelector("#vehicle-type").selectedOptions[0].textContent;
    const plan = planFleet(input);
    latest = { input, plan };
    error.textContent = "";
    document.querySelector("#vehicle-energy").textContent =
      `${plan.vehicleEnergyKwh.toFixed(1)} kWh`;
    document.querySelector("#input-energy").textContent =
      `${plan.inputEnergyKwh.toFixed(1)} kWh`;
    document.querySelector("#charging-points").textContent = String(
      plan.modelledPoints,
    );
    download.disabled = false;
    document.querySelector("#planner-state").textContent =
      "Calculated from the assumptions shown.";
  } catch (e) {
    latest = null;
    download.disabled = true;
    document.querySelector("#planner-state").textContent =
      "Inputs changed or invalid. Recalculate before using these results.";
    error.textContent = e.message;
  }
}
form.addEventListener("submit", (e) => {
  e.preventDefault();
  calculate();
});
form.addEventListener("input", () => {
  latest = null;
  download.disabled = true;
  document.querySelector("#planner-state").textContent =
    "Inputs changed or invalid. Recalculate before using these results.";
});
document.querySelector("#vehicle-type").addEventListener("change", (e) => {
  const preset = VEHICLE_PRESETS[e.target.value];
  if (preset) {
    for (const [k, v] of Object.entries(preset))
      form.elements.namedItem(k).value = String(v);
  }
  latest = null;
  download.disabled = true;
  document.querySelector("#planner-state").textContent =
    "Inputs changed or invalid. Recalculate before using these results.";
});
download.addEventListener("click", () => {
  if (!latest) return;
  const url = URL.createObjectURL(
    new Blob([pilotBrief(latest.input, latest.plan)], {
      type: "text/plain;charset=utf-8",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "plugnear-fleet-pilot-brief.txt";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
calculate();
