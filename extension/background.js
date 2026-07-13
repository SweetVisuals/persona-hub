chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getCookies") {
    let domain = "";
    if (request.platform === "youtube") domain = ".youtube.com";
    if (request.platform === "instagram") domain = ".instagram.com";
    if (request.platform === "pinterest") domain = ".pinterest.com";
    if (request.platform === "tiktok") domain = ".tiktok.com";

    if (!domain) {
      sendResponse({ success: false, error: "Invalid platform" });
      return true;
    }

    chrome.cookies.getAll({ domain: domain }, (cookies) => {
      if (cookies && cookies.length > 0) {
        // Format cookies into a raw string
        const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
        sendResponse({ success: true, cookieString: cookieString });
      } else {
        sendResponse({ success: false, error: "No cookies found. Are you logged in?" });
      }
    });
    
    return true; // Keep the message channel open for async response
  }
});
