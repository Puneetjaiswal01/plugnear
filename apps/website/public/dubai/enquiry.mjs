const form = document.querySelector("#dubai-enquiry-form");
form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const values = new FormData(form);
  const body = [
    "PlugNear Dubai partnership enquiry",
    "Market: United Arab Emirates · Dubai",
    "Currency context: AED · Time zone: Asia/Dubai",
    "",
    `Role: ${values.get("role")}`,
    `Dubai area: ${String(values.get("area") || "").trim()}`,
    `Organisation or name: ${String(values.get("name") || "").trim() || "Not provided"}`,
    `Vehicle group: ${values.get("vehicle")}`,
    "",
    "I am enquiring about a possible pilot partnership. I understand that Dubai listings, bookings and payments are not open.",
  ].join("\n");
  const link = document.querySelector("#dubai-enquiry-mail");
  link.href = `mailto:puneetjaiswal@zohomail.in?subject=${encodeURIComponent("PlugNear Dubai partnership enquiry")}&body=${encodeURIComponent(body)}`;
  link.hidden = false;
  document.querySelector("#dubai-enquiry-status").textContent =
    "Your Dubai draft is ready. Open it and send it through your mail app. Nothing has been submitted or added to a waitlist.";
});
