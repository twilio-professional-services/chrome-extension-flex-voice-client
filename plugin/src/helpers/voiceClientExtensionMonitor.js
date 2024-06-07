import { EventEmitter } from "events";
import { Notifications } from "@twilio/flex-ui";
import { checkAndSetContactUri } from "../utils/contactUriUtils";
import {
  VOICE_CLIENT_ERROR_NOTIFICATION,
  VOICE_CLIENT_REGISTERED_NOTIFICATION,
  VOICE_CLIENT_CONNECT_FAILED_NOTIFICATION,
  VOICE_CLIENT_DISCONNECTED_NOTIFICATION,
} from "../notifications";

const INITIAL_HEARTBEAT_TIMEOUT = 5000;
const HEARTBEAT_TIMEOUT = 5000;

export class VoiceClientExtensionMonitor extends EventEmitter {
  #initialHeartbeatTimerId = null;
  #initialHeartbeatError = false;

  #heartbeatTimerId = null;

  #voiceClientError = false;
  #heartbeatActive = false;

  #voiceClientIdentity = null;

  #disconnectedFlag = false;

  #voiceClientAvailableFleg = false;

  set voiceClientAvailableFlag(updatedFlag) {
    if (this.#voiceClientAvailableFleg !== updatedFlag) {
      this.#voiceClientAvailableFleg = updatedFlag;
      this.emit("voiceClientAvailableEvent", updatedFlag);
    }
  }

  updateVoiceClientAvailable = () => {
    if (
      this.#initialHeartbeatError ||
      this.#disconnectedFlag ||
      this.#voiceClientError ||
      !this.#voiceClientIdentity ||
      !this.#heartbeatActive
    )
      this.voiceClientAvailableFlag = false;
    else this.voiceClientAvailableFlag = true;
  };

  set voiceClientError(updatedFlag) {
    if (!this.#voiceClientError && updatedFlag) {
      Notifications.showNotification(VOICE_CLIENT_ERROR_NOTIFICATION);
    } else if (this.#voiceClientError && !updatedFlag) {
      Notifications.dismissNotificationById(VOICE_CLIENT_ERROR_NOTIFICATION);
    }

    this.#voiceClientError = updatedFlag;
    this.updateVoiceClientAvailable();
  }

  set voiceClientIdentity(updatedIdentity) {
    if (!this.#voiceClientIdentity) {
      Notifications.showNotification(VOICE_CLIENT_REGISTERED_NOTIFICATION);
    }

    if (this.#voiceClientIdentity !== updatedIdentity) {
      this.#voiceClientIdentity = updatedIdentity;
      checkAndSetContactUri(updatedIdentity);
    }
    this.updateVoiceClientAvailable();
  }

  set initialHeartbeatError(updatedFlag) {
    if (!this.#initialHeartbeatError && updatedFlag) {
      Notifications.showNotification(VOICE_CLIENT_CONNECT_FAILED_NOTIFICATION);
    } else if (this.#initialHeartbeatError && !updatedFlag) {
      Notifications.dismissNotificationById(
        VOICE_CLIENT_CONNECT_FAILED_NOTIFICATION
      );
    }

    this.#initialHeartbeatError = updatedFlag;
    this.updateVoiceClientAvailable();
  }

  set heartbeatActive(updatedFlag) {
    if (!this.#heartbeatActive && this.#initialHeartbeatError) {
      this.initialHeartbeatError = false;
    }

    if (this.#heartbeatActive && !updatedFlag) {
      Notifications.showNotification(VOICE_CLIENT_DISCONNECTED_NOTIFICATION);
    }

    this.#heartbeatActive = updatedFlag;
    this.updateVoiceClientAvailable();
  }

  set disconnectedFlag(updatedFlag) {
    // if we become disconnected we aren't going to be able to connect back up again
    // so there no need to handle clearing of the notification and we can stop the hearbeat timers as it is game over

    if (!this.#disconnectedFlag && updatedFlag) {
      Notifications.showNotification(VOICE_CLIENT_DISCONNECTED_NOTIFICATION);
      if (this.#heartbeatTimerId) clearInterval(this.#heartbeatTimerId);
      if (this.#initialHeartbeatTimerId)
        clearTimeout(this.#initialHeartbeatTimerId);
    }

    this.#disconnectedFlag = updatedFlag;
    this.updateVoiceClientAvailable();
  }

  constructor() {
    super();
    this.#initialHeartbeatTimerId = setTimeout(() => {
      this.initialHeartbeatError = true;
    }, INITIAL_HEARTBEAT_TIMEOUT);
  }

  heartbeat(voiceClientIdentity, error) {
    if (!voiceClientIdentity) {
      return;
    }
    if (this.#heartbeatTimerId) clearInterval(this.#heartbeatTimerId);

    if (this.#initialHeartbeatTimerId)
      clearTimeout(this.#initialHeartbeatTimerId);

    if (voiceClientIdentity !== this.#voiceClientIdentity)
      this.voiceClientIdentity = voiceClientIdentity;

    this.heartbeatActive = true;

    this.#heartbeatTimerId = setTimeout(() => {
      this.heartbeatActive = false;
    }, HEARTBEAT_TIMEOUT);

    this.voiceClientError = error;
  }

  disconnected() {
    this.disconnectedFlag = true;
  }
}
