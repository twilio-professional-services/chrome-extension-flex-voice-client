chrome.runtime.onMessage.addListener((message) => {
  if (message.target !== "workerThreadLogging") {
    return;
  }
  // could surface these logs in the popup
  if (message.type === "log") {
    console.log("offscreen log", message.data);
  }
});
