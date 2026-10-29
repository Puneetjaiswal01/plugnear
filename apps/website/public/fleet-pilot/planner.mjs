import { getMarket } from "../markets.mjs";
import { planFleet, pilotBrief, VEHICLE_PRESETS } from "./model.mjs";
const form = document.querySelector("#fleet-form"),
  error = document.querySelector("#planner-error"),
  download = document.querySelector("#download-brief");
let latest = null;
const marketSelect = document.querySelector("#planning-market");
const requestedMarket = new URLSearchParams(location.search).get("market");
if (requestedMarket !== null)
  marketSelect.value = ["IN", "AE"].includes(requestedMarket)
    ? requestedMarket
    : "";
function updateMarket() {
  let m;
  try {
    m = getMarket(marketSelect.value);
  } catch {
    document.querySelector("#market-status").textContent =
      "Choose a supported planning region before calculating.";
    return;
  }
  document.querySelector("#market-status").textContent =
    m.code === "AE"
      ? `Dubai partnership planning · ${m.currency} · ${m.timeZone}. No UAE bookings or payments are available.`
      : `India pilot planning · ${m.currency} · ${m.timeZone}. Estimates do not reserve capacity.`;
}
marketSelect.addEventListener("change", () => {
  updateMarket();
  latest = null;
  download.disabled = true;
  document.querySelector("#planner-state").textContent =
    "Region changed. Recalculate before using these results.";
});
updateMarket();
function calculate() {
  try {
    getMarket(marketSelect.value);
    const data = new FormData(form);
    const input = Object.fromEntries(
      ["vehicles", "kmPerDay", "whPerKm", "powerKw", "hours"].map((k) => [
        k,
        Number(data.get(k)),
      ]),
    );
    input.market = marketSelect.value;
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
