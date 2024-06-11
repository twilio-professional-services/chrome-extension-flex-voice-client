import "../twilio.js";
import "./offscreenUtils.js";
import "./offscreenLogging.js";
import { launchOffscreen, closeOffscreenDocuments } from "./offscreenUtils.js";
import { WorkerThreadVoiceClient } from "./workerVoiceClient.js";
import {
  getUIStateForPopup,
  updateUIActiveCall,
  updateUIMutedFlag,
  updateUIVoiceClientState,
  updateUIWaitingForFlex,
  updateUIAccountSid,
  updateUIVoiceClientIdentity,
} from "./popupHelper.js";
import { FlexIntegration } from "./flexIntegration.js";
import { resetConfig } from "./config.js";

const configureMessageHandlers = (restartCallback) => {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("worker *** request", request, sender);

    const senderUrl = sender.url;
    let senderPage = undefined;
    if (senderUrl.includes("popup")) {
      senderPage = "popup";
    } else if (senderUrl.includes("offscreen")) {
      senderPage = "offscreen";
    }

    // restart can come from the popup or from this worker thread
    if (request.type === "restart") {
      restartCallback();
      return;
    }

    switch (senderPage) {
      case "popup":
        switch (request.type) {
          case "getUIState":
            sendResponse({ uiState: getUIStateForPopup() });
            break;
          case "restart":
            restartCallback();
            break;
          default:
            break;
        }
        break;

      case "offscreen":
        switch (request.type) {
          case "accept":
            console.log("worker *** call accepted");
            break;
          case "disconnect":
          case "cancel":
          case "reject":
          case "error":
            callEndedHandler();
            break;
          case "muted":
            updateUIMutedFlag(request.muted);
            break;
          default:
            break;
        }
        break;

      default:
        break;
    }
  });
};

const addVoiceClientListeners = (voiceClient, flexIntegration) => {
  voiceClient.addEventListener("incomingCall", incomingCallHander);
  voiceClient.addEventListener("callEnded", callEndedHandler);

  voiceClient.addEventListener("voiceClientStatus", (event) =>
    voiceClientStatusHandler(event, flexIntegration)
  );

  voiceClient.addEventListener("voiceClientIdentityUpdated", (event) =>
    voiceClientIdentityUpdatedHandler(event, flexIntegration)
  );
  voiceClient.addEventListener("voiceClientError", voiceClientInitErrorHandler);
};

const removeVoiceClientListeners = (voiceClient) => {
  voiceClient.removeEventListener("incomingCall", incomingCallHander);
  voiceClient.removeEventListener("callEnded", callEndedHandler);
  voiceClient.removeEventListener(
    "voiceClientStatus",
    voiceClientStatusHandler
  );
  voiceClient.removeEventListener(
    "voiceClientIdentityUpdated",
    voiceClientIdentityUpdatedHandler
  );
  voiceClient.removeEventListener(
    "voiceClientError",
    voiceClientInitErrorHandler
  );
};

const incomingCallHander = (event) => {
  const { token, connectToken } = event;
  updateUIActiveCall(true);
  updateUIMutedFlag(false);
  launchOffscreen(token, connectToken);
};

const callEndedHandler = () => {
  updateUIActiveCall(false);
  updateUIMutedFlag(false);
  closeOffscreenDocuments();
};

function voiceClientStatusHandler(event, flexIntegration) {
  const { status, errorMessage } = event;

  if (status === "error" && !flexIntegration.voiceClientError)
    flexIntegration.voiceClientError = true;
  else if (status !== "error" && flexIntegration.voiceClientError)
    flexIntegration.voiceClientError = false;

  updateUIVoiceClientState({ status, errorMessage });
}

const voiceClientIdentityUpdatedHandler = (event, flexIntegration) => {
  flexIntegration.voiceClientIdentity = event.identity;
  updateUIVoiceClientIdentity(event.identity);
};

const voiceClientInitErrorHandler = () => {
  chrome.runtime.sendMessage({
    type: "restart",
  });
};

const initVoiceClient = (flexIntegration, initialFlexToken) => {
  const voiceClient = new WorkerThreadVoiceClient(initialFlexToken);

  addVoiceClientListeners(voiceClient, flexIntegration);

  voiceClient.init();
  return voiceClient;
};

// Open welcome page and ask for user media permissions after installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason.search(/install/g) === -1) {
    return;
  }
  chrome.tabs.create({
    url: "welcome/welcome.html",
    active: true,
  });
});

const workerThread = () => {
  let flexIntegration = null;
  let voiceClient = null;

  const restart = () => {
    if (voiceClient) {
      removeVoiceClientListeners(voiceClient);
      voiceClient.shutdown();
      voiceClient = null;
    }

    if (flexIntegration) {
      flexIntegration.shutdown();
      flexIntegration = null;
    }

    resetConfig();
    updateUIWaitingForFlex(true);
    updateUIAccountSid(null);
    updateUIActiveCall(false);
    updateUIMutedFlag(false);

    updateUIVoiceClientIdentity(null);

    start();
  };

  configureMessageHandlers(restart);

  const start = () => {
    flexIntegration = new FlexIntegration();
    flexIntegration.addEventListener("updatedFlexToken", (event) => {
      console.log("workerThread: updatedFlexToken event", event);
      if (!voiceClient) {
        voiceClient = initVoiceClient(flexIntegration, event.token);
      } else {
        voiceClient.updateFlexToken = event.token;
      }
    });

    flexIntegration.init();
  };

  start();
};
/// MAIN!
workerThread();
