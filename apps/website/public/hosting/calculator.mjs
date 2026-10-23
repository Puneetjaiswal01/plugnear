import { hostCost } from "./cost-model.mjs";
const form = document.querySelector("#host-cost");
const result = document.querySelector("#cost-result");
const money = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    n,
  );
function update() {
  try {
    const values = Object.fromEntries(
      [...new FormData(form)].map(([key, value]) => [
        key,
        String(value).trim() === "" ? NaN : Number(value),
      ]),
    );
    const model = hostCost(values);
    result.textContent = `Illustrative session: ${money(model.gross)} gross − ${money(model.electricity)} electricity − ${money(model.other)} other costs = ${money(model.contribution)} contribution before remaining costs and taxes. Estimated electricity input: ${model.inputEnergy.toFixed(2)} kWh.`;
  } catch (error) {
    result.textContent = error.message;
  }
}
form.addEventListener("submit", (e) => {
  e.preventDefault();
  update();
});
form.addEventListener("input", update);
update();
