const menu = document.querySelector(".menu-button"),
  nav = document.querySelector("#navigation");
menu.addEventListener("click", () => {
  const open = menu.getAttribute("aria-expanded") !== "true";
  menu.setAttribute("aria-expanded", String(open));
  menu.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  nav.classList.toggle("is-open", open);
});
nav.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    nav.classList.remove("is-open");
    menu.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-label", "Open menu");
  }),
);
document.querySelector("#year").textContent = String(new Date().getFullYear());
const legal = {
  privacy: {
    title: "Your privacy, at a glance.",
    html: "<p>This public website does not collect payments or include advertising analytics. The pilot enquiry form prepares an email locally; no form details are sent to PlugNear until you send that email using your mail service. The fleet pilot planner runs locally: inputs are not sent to PlugNear, and downloading a brief does not submit an enquiry. It loads fonts from Google Fonts, which receives the information your browser normally sends with that request.</p><p>If you open the early-access app, registration and profile information is handled through the dedicated PlugNear Supabase project hosted in Mumbai. The app requests location permission when you choose to discover or register chargers. Charger listings include the hosting address you submit.</p><p>Do not submit Aadhaar numbers, banking details or payment information through listing descriptions. You can request account deletion through our <a href='/delete-account/'>deletion page</a>; it prepares an email that you must send.</p><p>This notice describes the current early-access experience. Read the <a href='/privacy/'>current privacy policy</a> or <a href='/support/'>contact support</a> for details.</p>",
  },
  terms: {
    title: "Pilot terms at a glance.",
    html: "<p>PlugNear is recruiting pilot hosts in Delhi NCR. Requests depend on approved chargers and verified hosts; this website does not promise available charging at a particular location.</p><p>The pilot supports requests and direct-to-host UPI checkout after host acceptance. Hosts confirm receipt manually; PlugNear does not independently verify transfers, hold funds or provide automatic refunds. Illustrative imagery is not a real charger listing.</p><p>Vehicle compatibility, charger safety, access permission and local requirements must be checked before any charging session. Hosting earnings are not guaranteed.</p><p>Read the <a href='/terms/'>pilot terms</a> and <a href='/support/'>support information</a> for cancellation, refund limitations and dispute help.</p>",
  },
};
const dialog = document.querySelector("#legal-dialog");
document.querySelectorAll("[data-legal]").forEach((b) =>
  b.addEventListener("click", () => {
    const v = legal[b.dataset.legal];
    document.querySelector("#legal-title").textContent = v.title;
    document.querySelector("#legal-content").innerHTML = v.html;
    dialog.showModal();
  }),
);
document
  .querySelectorAll(".dialog-close,.dialog-done")
  .forEach((b) => b.addEventListener("click", () => dialog.close()));
dialog.addEventListener("click", (e) => {
  if (e.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      dialog.close();
  }
});

const enquiryForm = document.querySelector("#pilot-enquiry-form");
enquiryForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!enquiryForm.reportValidity()) return;
  const data = new FormData(enquiryForm);
  const body = [
    "PlugNear Delhi NCR pilot enquiry",
    "",
    `City or neighbourhood: ${String(data.get("city") || "").trim()}`,
    `Role: ${data.get("role")}`,
    `Vehicle type: ${data.get("vehicle")}`,
    "",
    "Please contact me about pilot participation. I understand this is an enquiry, not a booking.",
  ].join("\n");
  const link = document.querySelector("#enquiry-mail");
  link.href = `mailto:puneetjaiswal@zohomail.in?subject=${encodeURIComponent("PlugNear pilot enquiry")}&body=${encodeURIComponent(body)}`;
  link.hidden = false;
  document.querySelector("#enquiry-status").textContent =
    "Your draft is ready. Open your email draft and send it from your mail app. Nothing has been submitted or added to a waitlist.";
});
