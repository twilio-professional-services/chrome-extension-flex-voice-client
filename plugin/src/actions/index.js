import { Actions } from "@twilio/flex-ui";
import { sendHangupCall } from "../utils/extensionMessages";

Actions.replaceAction("StopMonitoringCall", (payload, original) => {
  sendHangupCall();
});
