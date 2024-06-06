let voiceClientState = { status: "initializing", errorMessage: null };
let activeCall = false;
let waitingForFlex = true;

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

export const getUIStateForPopup = () => {
  let status = "waitingForFlexUI";

  if (!waitingForFlex) {
    status = voiceClientState.status;
  }

  return {
    status,
    activeCall,
    errorMessage: voiceClientState.errorMessage,
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
