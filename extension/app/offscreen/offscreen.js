let call = null;
let device = null;

let retryDeviceToken = null;
let retryConnectToken = null;

async function start() {
  chrome.runtime.onMessage.addListener(
    async (request, sender, sendResponse) => {
      const senderUrl = sender.url;
      let senderPage = undefined;
      log(senderUrl);
      if (senderUrl.includes("popup/popup.html")) {
        senderPage = "popup";
      } else if (senderUrl.includes("welcome/welcome.html")) {
        senderPage = "welcome";
      }

      switch (senderPage) {
        case "popup":
          switch (request.type) {
            case "hangup":
              device.disconnectAll();
              break;
            case "toggleMute":
              const isMuted = call.isMuted();
              chrome.runtime.sendMessage({
                type: "muted",
                muted: !isMuted,
              });
              call.mute(!isMuted);
              break;
            case "restart":
              device.disconnectAll();
              break;
            default:
              break;
          }
          break;
        case "welcome":
          switch (request.type) {
            case "media-permission-retry":
              log(`Attempting to accept call again after receiving media permissions`);
              if (!retryDeviceToken || !retryConnectToken) {
                log(`Unable to retry accepting call due to missing call token(s)`);
                break;
              }
              await initDeviceAndAcceptCall(
                retryDeviceToken,
                retryConnectToken
              );
              break;
            default:
              break;
          }
          break;
        default:
          switch (request.type) {
            case "init-offscreen": // from worker thread to init the accept of call
              await initDeviceAndAcceptCall(
                request.token,
                request.connectToken
              );
              break;
            case "HANGUP_CALL": // from plugin via worker thread
              device.disconnectAll();
              break;
            case "SEND_DTMF_DIGITS": // from plugin via worker thread
              call.sendDigits(request.payload.digits);
              break;
            default:
              break;
          }
          break;
      }
    }
  );
}

async function initDeviceAndAcceptCall(deviceToken, connectToken) {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    retryDeviceToken = null;
    retryConnectToken = null;
  } catch (e) {
    log(`Requesting permissions due to media permissions error: ${e}`);
    retryDeviceToken = deviceToken;
    retryConnectToken = connectToken;
    chrome.runtime.sendMessage({ type: "permissionsError" });
    return;
  }
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
      if (e.code == 31401) {
        log(`Requesting permissions due to media permissions error`);
        chrome.runtime.sendMessage({ type: "permissionsError" });
        return;
      }
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
