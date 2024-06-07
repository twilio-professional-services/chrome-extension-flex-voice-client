import { Actions } from "@twilio/flex-ui";
import { activityMonitor } from "../helpers/activityMonitor";
import { sendHangupCall, sendDTMFDigits } from "../utils//extensionMessages";
import { isExtensionVoiceClientEnabled } from "../utils/config";

const addListeners = () => {
  if (!isExtensionVoiceClientEnabled()) return;

  Actions.addListener("beforeSetActivity", (payload, abortFunction) => {
    if (payload.activityMonitorOverride) return payload; // set activity action was from the activity monitor - let it update

    if (!activityMonitor.isActivityChangeAllowed(payload.activityName)) {
      abortFunction();
    }
  });

  Actions.addListener("beforeWrapupTask", (payload, abortFunction) => {
    if (payload.task.taskChannelUniqueName !== "voice") {
      return payload;
    }
    sendHangupCall();
    abortFunction();
  });

  Actions.addListener("beforeStartOutboundCall", (payload, abortFunction) => {
    if (activityMonitor.isVoiceClientOffline()) {
      abortFunction();
    }
    return payload;
  });

  Actions.addListener("beforeSendDTMFDigits", (payload, abortFunction) => {
    abortFunction();
    sendDTMFDigits(payload.digits);
  });
};

addListeners();
