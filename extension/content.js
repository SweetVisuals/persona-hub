// Listen for messages from the React app
window.addEventListener("message", (event) => {
  // We only accept messages from ourselves
  if (event.source !== window) return;

  if (event.data.type === "PERSONA_HUB_PING") {
    window.postMessage({ type: "PERSONA_HUB_PONG" }, "*");
  }

  if (event.data.type === "PERSONA_HUB_EXTRACT") {
    chrome.runtime.sendMessage({ action: "getCookies", platform: event.data.platform }, (response) => {
      window.postMessage({ type: "PERSONA_HUB_COOKIE_RESULT", data: response }, "*");
    });
  }
});

// Announce presence on load
window.postMessage({ type: "PERSONA_HUB_PONG" }, "*");
