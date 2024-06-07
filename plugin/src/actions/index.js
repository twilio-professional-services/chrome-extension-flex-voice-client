import { Actions } from "@twilio/flex-ui";
import { sendHangupCall } from "../utils/extensionMessages";
import { isExtensionVoiceClientEnabled } from "../utils/config";

const replaceActions = () => {
  if (!isExtensionVoiceClientEnabled()) return;

  Actions.replaceAction("StopMonitoringCall", (payload, original) => {
    sendHangupCall();
  });
};

replaceActions();
