function selectTab(evt, tabId) {
  var i, tabcontent, tablinks;

  // hide all tab content
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  // set selected tab header active
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // set selected tab content visible
  document.getElementById(tabId + "Content").style.display = "block";
  evt.currentTarget.className += " active";
}

const addTabClickHandlers = () => {
  const tablinks = document.getElementsByClassName("tablinks");
  for (let i = 0; i < tablinks.length; i++) {
    tablinks[i].addEventListener("click", (event) => {
      selectTab(event, tablinks[i].id);
    });
  }
};

const selectDefaultTab = (tabId) => {
  document.getElementById(tabId).click();
};

const addRestartButtonHandler = () => {
  document.getElementById("RestartBtn").addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "restart" });
  });
};

const setStatusContent = (status, friendlyStatus) => {
  let statusMessage = status.charAt(0).toUpperCase() + status.slice(1);

  function camelCaseToSpacedWord(camelCase) {
    // Use regex to split the string at each uppercase letter
    // and join the resulting array with spaces
    return camelCase.replace(/([a-z])([A-Z])/g, "$1 $2").trim();
  }

  statusMessage = camelCaseToSpacedWord(statusMessage);

  document.getElementById("StatusContentStatus").innerHTML = statusMessage;
  document.getElementById("StatusContentFriendlyStatus").innerHTML =
    friendlyStatus;
};

const setInfoContent = (accountSid, voiceClientIdentity, openTabsCount) => {
  const accountSidMessage = `<b>Account SID:</b> ${accountSid}`;
  const voiceClientIdentityMessage = `<b>Voice Client Identity:</b> ${voiceClientIdentity}`;
  document.getElementById("InfoContentAccountSid").innerHTML =
    accountSidMessage;
  document.getElementById("InfoContentVoiceClientIdentity").innerHTML =
    voiceClientIdentityMessage;

  const openTabsCountMessage = `<b>Flex Tabs:</b> ${openTabsCount.flexTabsOpen}`;
  const openTabsWithPluginsRunningMessage = `<b>Flex Tabs with Plugins Running:</b> ${openTabsCount.flexTabsWithPluginsRunning}`;
  document.getElementById("InfoContentOpenTabs").innerHTML =
    openTabsCountMessage;
  document.getElementById("InfoContentOpenTabsWithPluginsRunning").innerHTML =
    openTabsWithPluginsRunningMessage;
};

const setUIState = (uiState) => {
  setStatusContent(uiState.status, uiState.friendlyStatus);
  setHangupButton(uiState.activeCall);
  setInfoContent(
    uiState.accountSid,
    uiState.voiceClientIdentity,
    uiState.openTabsCount
  );
  // const { status, activeCall } = uiState || {};
  // log(`setUIState: ${status} activeCall: ${activeCall}`);
  // if (activeCall) {
  //   showButtons("hangup", "restart");
  // } else {
  //   showButtons("restart");
  // }
  // statusEl.innerHTML = `Status: ${status}`;
};

const connectToServiceWorker = () => {
  chrome.runtime.connect({ name: "popup" });
};
const listenForUIStateUpdates = () => {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "setUIState") {
      //log(`dynamic state: ${JSON.stringify(request)}`);
      setUIState(request.uiState);
    }
  });
};

const fetchStartingUIState = () => {
  chrome.runtime.sendMessage({ type: "getUIState" }, (response) => {
    setUIState(response.uiState);
  });
};

const setHangupButton = (enabled) => {
  const button = document.getElementById("HangupBtn");
  button.disabled = !enabled;
  button.innerHTML = enabled ? "Hangup" : "Hangup (no active call)";

  button.onclick = () => {
    chrome.runtime.sendMessage({ type: "hangup" });
  };
};

// MAIN
setHangupButton(false);
addTabClickHandlers();
addRestartButtonHandler();
selectDefaultTab("Status");
connectToServiceWorker();
listenForUIStateUpdates();
fetchStartingUIState();
