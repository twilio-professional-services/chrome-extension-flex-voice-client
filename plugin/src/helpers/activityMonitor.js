import { Manager, Actions, Notifications } from "@twilio/flex-ui";
import {
  MANUAL_CHANGE_TO_VOICE_CLIENT_OFFLINE_ACTIVITY_NOTIFICATION,
  ACTIVITY_CHANGE_NOT_ALLOWED_NOTIFICATION,
  VOICE_CLIENT_OFFLINE_NOTIFICATION,
} from "../notifications";

const manager = Manager.getInstance();

const getVoiceClientOfflineActitivityName = () => {
  return process.env.FLEX_APP_OFFLINE_VOICE_CLIENT_ACTIVITY_NAME || "Offline";
};

const getActivity = () => {
  return manager.store.getState().flex.worker.activity;
};

const isInAvailableActivity = () => {
  return getActivity().available;
};

const activityName = () => {
  return getActivity().name;
};

// At start up set to voice client offline if it is in an available activity
// If we push it to voice client offline remember the previous activity and restore it when voice client is available
// If we start up in voice client offline and voice client comes available move it to offline so agents knows they can manually change it

class ActivityMonitor {
  #voiceClientAvailableFlag = false;
  #previousActivityName = null;
  constructor() {}

  async checkCurrentActivity() {
    if (!this.#voiceClientAvailableFlag) {
      const available = isInAvailableActivity();
      if (available) {
        this.#previousActivityName = activityName();
        await Actions.invokeAction("SetActivity", {
          activityName: getVoiceClientOfflineActitivityName(),
          activityMonitorOverride: true,
        });
      }
    } else {
      if (this.#previousActivityName) {
        Actions.invokeAction("SetActivity", {
          activityName: this.#previousActivityName,
        });
      } else {
        if (activityName() === getVoiceClientOfflineActitivityName()) {
          Actions.invokeAction("SetActivity", {
            activityName: "Offline",
          });
        }
      }
    }
  }

  isActivityChangeAllowed(newActivityName) {
    if (newActivityName === getVoiceClientOfflineActitivityName()) {
      Notifications.showNotification(
        MANUAL_CHANGE_TO_VOICE_CLIENT_OFFLINE_ACTIVITY_NOTIFICATION
      );
      return false;
    }

    if (!this.#voiceClientAvailableFlag) {
      Notifications.showNotification(ACTIVITY_CHANGE_NOT_ALLOWED_NOTIFICATION);
      return false;
    }
    return true;
  }

  isVoiceClientOffline() {
    if (!this.#voiceClientAvailableFlag) {
      Notifications.showNotification(VOICE_CLIENT_OFFLINE_NOTIFICATION);
      return true;
    } else {
      return false;
    }
  }

  setVoiceClientAvailableFlag(flag) {
    this.#voiceClientAvailableFlag = flag;
    this.checkCurrentActivity();
  }
}

export const activityMonitor = new ActivityMonitor();
