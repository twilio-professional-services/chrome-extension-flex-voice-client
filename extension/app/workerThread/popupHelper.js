let voiceClientState = { status: "initializing", errorMessage: null };
let activeCall = false;
let waitingForFlex = true;
let accountSid = null;
let voiceClientIdentity = null;
let openTabsCount = { flexTabsOpen: 0, flexTabsWithPluginsRunning: 0 };

// Tracks whether the popup is open or not
let popupOpen = false;
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "popup") {
    popupOpen = true;
    port.onDisconnect.addListener(() => {
      popupOpen = false;
    });
  }
});

export const updateUIVoiceClientState = async (state) => {
  console.log("popupHelper: updateVoiceClientState", state);
  voiceClientState = state;
  updateUI();
};

export const updateUIActiveCall = async (state) => {
  console.log("popupHelper: updateUIActiveCall", state);
  activeCall = state;
  updateUI();
};
export const updateUIWaitingForFlex = async (state) => {
  console.log("popupHelper: updateUIWaitingForFlex", state);
  waitingForFlex = state;
  updateUI();
};

export const updateUIAccountSid = async (value) => {
  console.log("popupHelper: updateUIAccountSid", value);
  accountSid = value;
};

export const updateUIVoiceClientIdentity = async (value) => {
  console.log("popupHelper: updateUIVoiceClientIdentity", value);
  voiceClientIdentity = value;
};

export const updateUIOpenTabsCount = async (open, pluginsRunning) => {
  console.log("popupHelper: updateUIOpenTabsCount", open, pluginsRunning);
  openTabsCount = {
    flexTabsOpen: open,
    flexTabsWithPluginsRunning: pluginsRunning,
  };
  updateUI();
};

const getFriendlyStatus = (status) => {
  switch (status) {
    case "waitingForFlexUI":
      return "Open Flex UI to configure and initialize the voice client";
    case "registered":
      return "Voice client is available for calls";
    case "unregistered":
      return "Unregistered - Error has occurred. Restart the voice client and then restart Flex UI";
    case "error":
      return "Error - Voice client has disconnected. Check network";
    default:
      return status;
  }
};

export const getUIStateForPopup = () => {
  let status = "waitingForFlexUI";

  if (!waitingForFlex) {
    status = voiceClientState.status;
  }

  return {
    status,
    friendlyStatus: getFriendlyStatus(status),
    activeCall,
    errorMessage: voiceClientState.errorMessage,
    accountSid,
    voiceClientIdentity,
    openTabsCount,
  };
};

const getIconFromSessionState = (activeCall, status) => {
  if (activeCall) {
    return "active.png";
  }
  if (status === "registered") {
    return "registered.png";
  }
  return "default.png";
};

const updateUI = () => {
  const icon = getIconFromSessionState(activeCall, voiceClientState?.status);
  console.log("popupHelper: updateUI", icon, voiceClientState?.status);

  chrome.action.setIcon({
    path: `/icons/${icon}`,
  });

  popupOpen &&
    chrome.runtime.sendMessage({
      type: "setUIState",
      uiState: getUIStateForPopup(),
    });
};
