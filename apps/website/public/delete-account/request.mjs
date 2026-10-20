document.querySelector("#deletion-form").addEventListener("submit", event => {
  event.preventDefault();
  const identifier = document.querySelector("#deletion-identifier").value.trim();
  if (identifier.length < 3) return;
  const body = `I request permanent deletion of my PlugNear account and associated data.\n\nRegistered email or phone: ${identifier}\n\nPlease verify ownership securely and confirm the deletion scope, any required retention and the outcome. I have not included passwords or verification codes.`;
  const url = `mailto:puneetjaiswal@zohomail.in?subject=${encodeURIComponent("PlugNear account deletion request")}&body=${encodeURIComponent(body)}`;
  document.querySelector("#deletion-status").textContent = "Email prepared. Send it from your mail app to submit the request. If no mail app opens, email puneetjaiswal@zohomail.in directly. This website has not submitted a request.";
  window.location.href = url;
});
