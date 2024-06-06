const offscreenPath = "offscreen/offscreen.html";

export const launchOffscreen = async (token, connectToken) => {
  await closeOffscreenDocuments();
  await chrome.offscreen.createDocument({
    url: offscreenPath,
    reasons: ["AUDIO_PLAYBACK", "USER_MEDIA", "WEB_RTC"],
    justification: "Make WebRTC Calls",
  });
  chrome.runtime.sendMessage({
    type: "init-offscreen",
    token,
    connectToken,
  });
};

// Only one offscreen document is allowed.
// Close any open ones before creating a new one.
export const closeOffscreenDocuments = () => {
  return new Promise(async (resolve) => {
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ["OFFSCREEN_DOCUMENT"],
    });
    if (existingContexts.length > 0) {
      chrome.offscreen.closeDocument(resolve);
    } else {
      resolve();
    }
  });
};
