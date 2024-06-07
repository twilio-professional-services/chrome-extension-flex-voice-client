const instance = Math.random().toString(36).substring(2, 15); //instance for debugging purposes
let port = chrome.runtime.connect({ name: "flexUI" });
console.log("Content: starting instance", instance);

port.onDisconnect.addListener(() => {
  console.log("Disconnected from worker thread", instance);
  window.postMessage({ type: "VOICE_CLIENT_EXTENSION_DISCONNECTED" });
  window.removeEventListener("message", proxyMessageToWorkerThread);
});

port.onC;

port.onMessage.addListener((message) => {
  switch (message.type) {
    case "HEARTBEAT_TO_FLEX_UI":
      window.postMessage({
        type: "VOICE_CLIENT_EXTENSION_HEARTBEAT",
        payload: message.payload,
      });
      break;
    case "CONFIGURED_TO_FLEX_UI":
      console.log(
        "Content: CONFIGURED_TO_FLEX_UI workerThread -> plugin",
        instance,
        message
      );
      window.postMessage({
        type: "VOICE_CLIENT_EXTENSION_CONFIGURED",
      });
      break;

    case "CONFIG_REJECTED_TO_FLEX_UI":
      console.log(
        "Content: CONFIG_REJECTED_TO_FLEX_UI workerThread -> plugin",
        instance,
        message
      );
      window.postMessage({
        type: "VOICE_CLIENT_EXTENSION_CONFIG_REJECTED",
      });
      break;

    default:
      break;
  }
});

function proxyMessageToWorkerThread(event) {
  if (!event.data.type) return;

  try {
    const { type, payload } = event.data;

    switch (type) {
      case "VOICE_CLIENT_EXTENSION_CONFIGURE":
        console.log(
          "Content: VOICE_CLIENT_EXTENSION_CONFIGURE plugin -> workerThread",
          instance
        );
        payload.instance = instance;
        port.postMessage({ type: "CONFIGURE", payload });
        break;

      case "VOICE_CLIENT_EXTENSION_FLEX_TOKEN":
        port.postMessage({ type: "FLEX_TOKEN", payload });
        break;

      case "VOICE_CLIENT_EXTENSION_HANGUP_CALL":
        port.postMessage({ type: "HANGUP_CALL" });
        break;
      
      case "VOICE_CLIENT_EXTENSION_SEND_DTMF_DIGITS":
        port.postMessage({ type: "SEND_DTMF_DIGITS", payload });
        break;

      case "VOICE_CLIENT_EXTENSION_HEARTBEAT":
      case "VOICE_CLIENT_EXTENSION_CONFIGURED":
        // these are handled in the plugin
        break;

      default:
        break;
    }
  } catch (e) {
    console.error(
      "Error sending PLUGIN_HEARTBEAT to worker thread: stopping listening. Assumed we are orphaned from worker thread because extension stopped" +
        e
    );
    event.target.removeEventListener(event.type, proxyHeartbeatToWorkerThread);
  }
}

window.addEventListener("message", proxyMessageToWorkerThread);
