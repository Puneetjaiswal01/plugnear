// Startup recovery only: no account, location, analytics or form data is read.
(() => {
  const root = document.getElementById("root");
  const help = document.getElementById("app-startup-help");
  if (!root || !help) return;
  let observer;
  let timer;
  function rendered() {
    if (!root.childElementCount) return false;
    help.remove();
    observer?.disconnect();
    clearTimeout(timer);
    return true;
  }
  if (rendered()) return;
  observer = new MutationObserver(rendered);
  observer.observe(root, { childList: true });
  timer = setTimeout(() => {
    if (rendered()) return;
    document.getElementById("app-startup-title").textContent =
      "Taking longer than expected?";
    document.getElementById("app-startup-message").textContent =
      "Check your connection and try again in Safari or Chrome. If the app is blocked in an in-app browser, open this link in your regular browser. The host guide, fleet planner and support links below are still available.";
  }, 10000);
})();
