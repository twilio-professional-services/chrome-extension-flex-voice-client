let hangupBtn;
let restartBtn;
let statusEl;

function start() {
  statusEl = document.querySelector("#status");
  hangupBtn = document.querySelector("#hangup");
  restartBtn = document.querySelector("#restart");
  flexStatusEl = document.querySelector("#flexUIStatus");

  setupButtonHandlers();
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "setUIState") {
      log(`dynamic state: ${JSON.stringify(request)}`);
      setUIState(request.uiState);
    }
  });

  chrome.runtime.sendMessage({ type: "getUIState" }, (response) => {
    log(`initial state: ${JSON.stringify(response)}`);
    setUIState(response.uiState);
  });

  // Connect to the service worker. This allows the service worker
  // to detect whether the popup is open or not.
  chrome.runtime.connect({ name: "popup" });
}

function setUIState(uiState) {
  const { status, activeCall } = uiState || {};
  log(`setUIState: ${status} activeCall: ${activeCall}`);
  if (activeCall) {
    showButtons("hangup", "restart");
  } else {
    showButtons("restart");
  }
  statusEl.innerHTML = `Status: ${status}`;
}

function setupButtonHandlers() {
  hangupBtn.onclick = () => chrome.runtime.sendMessage({ type: "hangup" });
  restartBtn.onclick = () => chrome.runtime.sendMessage({ type: "restart" });
}

function showButtons(...buttonsToShow) {
  document.querySelectorAll("button").forEach((el) => {
    if (buttonsToShow.includes(el.id)) {
      el.style.display = "inline-block";
    } else {
      el.style.display = "none";
    }
  });
}

function log(msg) {
  document.querySelector("#log").innerHTML += msg + "\n";
}

start();
