async function start() {
  chrome.runtime.onMessage.addListener(
    async (request, sender, sendResponse) => {
      if (request.type === "init-offscreen") {
        await initDeviceAndAcceptCall(request.token, request.connectToken);
      } else if (request.type === "hangup" && sender.url.includes("popup")) {
        device.disconnectAll(); // from popup
      } else if (request.type === "restart" && sender.url.includes("popup")) {
        device.disconnectAll(); // from popup
      } else if (request.type === "HANGUP_CALL") {
        device.disconnectAll(); // from plugin via worker thread
      }
    }
  );
}

async function initDeviceAndAcceptCall(deviceToken, connectToken) {
  try {
    device = await new Twilio.Device(deviceToken, { logLevel: 1 });
    call = await device.connect({ connectToken }); // connectToken identifies the incoming call event from the voice client in the worker thread

    // sets the call status to in progress
    call.on("accept", () => chrome.runtime.sendMessage({ type: "accept" }));

    // these terminal call events trigger the worker thread to close this offscreen
    call.on("disconnect", () =>
      chrome.runtime.sendMessage({ type: "disconnect" })
    );
    call.on("cancel", () => chrome.runtime.sendMessage({ type: "cancel" }));
    call.on("reject", () => chrome.runtime.sendMessage({ type: "reject" }));
    call.on("error", (e) => {
      log(`Call error event ${e}`);
      chrome.runtime.sendMessage({ type: "error" });
    });
  } catch (error) {
    log(`Error connecting call ${error}`);
    chrome.runtime.sendMessage({ type: "error" });
  }
}

addEventListener("load", start);

// offscreen logs can be hard to capture if the page is reset quickly, so send logs back to worker
const log = async (...args) =>
  chrome.runtime.sendMessage({
    target: "workerThreadLogging",
    type: "log",
    data: args,
  });
