import { sendFlexTokenToVoiceClientExtension } from "../utils/extensionMessages";
import { VOICE_CLIENT_CONFIGURATION_ERROR_NOTIFICATION } from "../notifications";
import { Notifications } from "@twilio/flex-ui";

export const listenForExtensionMessages = (manager, voiceClientMonitor) => {
  window.addEventListener("message", (event) => {
    const { type, payload } = event.data;
    switch (type) {
      case "VOICE_CLIENT_EXTENSION_HEARTBEAT":
        voiceClientMonitor.heartbeat(
          payload.voiceClientIdentity,
          payload.error
        );
        break;

      // wait until it confirms configured before we send the token.
      case "VOICE_CLIENT_EXTENSION_CONFIGURED":
        sendFlexTokenToVoiceClientExtension(manager);
        break;

      case "VOICE_CLIENT_EXTENSION_DISCONNECTED":
        voiceClientMonitor.disconnected();
        break;

      case "VOICE_CLIENT_EXTENSION_CONFIG_REJECTED":
        Notifications.showNotification(
          VOICE_CLIENT_CONFIGURATION_ERROR_NOTIFICATION
        );
        console.error(
          "VoiceClientInExtensionPlugin: Voice Client Extension configured for different account."
        );
        break;

      default:
        break;
    }
  });
};
