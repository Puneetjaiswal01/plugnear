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
    html: "<p>This public website does not include a mailing-list form, payment collection or advertising analytics. It loads fonts from Google Fonts, which receives the information your browser normally sends with that request.</p><p>If you open the early-access app, registration and profile information is handled through the dedicated PlugNear Supabase project hosted in Mumbai. The app requests location permission when you choose to discover or register chargers. Charger listings include the hosting address you submit.</p><p>Do not submit Aadhaar numbers, banking details or payment information through listing descriptions. Full account-management, retention and deletion controls are still being prepared before marketplace launch.</p><p>This notice describes the current early-access experience. A complete product privacy policy will be provided before public marketplace launch.</p>",
  },
  terms: {
    title: "A note on early access.",
    html: "<p>PlugNear is under development. This website introduces the planned service and links to an early-access app; it does not establish the availability of charging services in any particular place.</p><p>Booking and online payments are not yet available. Host listings require review. Do not rely on illustrative imagery as a real charger listing or send money to hosts outside the platform.</p><p>Vehicle compatibility, charger safety, access permission and local requirements must be checked before any charging session. Hosting earnings are not guaranteed. App-store releases, payment methods and launch timing have not been announced.</p><p>Marketplace booking, cancellation, refund and hosting terms will be provided before those services become available.</p>",
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
