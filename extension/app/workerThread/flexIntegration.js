import { setConfig, getConfigValue } from "./config.js";
import {
  updateUIWaitingForFlex,
  updateUIAccountSid,
  updateUIOpenTabsCount,
} from "./popupHelper.js";

class UpdatedFlexTokenEvent extends Event {
  constructor(token) {
    super("updatedFlexToken");
    this.token = token;
  }
}

class FlexTokenExpiredEvent extends Event {
  constructor() {
    super("flexTokenExpired");
  }
}

export class FlexIntegration extends EventTarget {
  #shuttingDown = false;
  #heartBeatIntervalId = null;
  #flexToken = { token: null, expirationDateTime: null };
  #flexUIPortConnections = new Map();
  #voiceClientIdentity = null;
  #configured = false;
  #voiceClientError = null;
  #instance = Math.random().toString(36).substring(2, 15);
  constructor() {
    super();
  }

  set voiceClientIdentity(value) {
    this.#voiceClientIdentity = value;
  }

  set flexToken(value) {
    const { token, expiration } = value;
    const expirationDateTime = new Date(expiration);

    if (expirationDateTime > this.#flexToken?.expirationDateTime) {
      this.#flexToken = { token, expirationDateTime };
      this.dispatchEvent(new UpdatedFlexTokenEvent(this.#flexToken.token));
    } else {
      console.log(
        "flexIntegration: ignoring token with same or earlier expiration than current token",
        value
      );
    }
  }

  set configured(value) {
    this.#configured = value;
    updateUIWaitingForFlex(!value);
  }

  get configured() {
    return this.#configured;
  }

  set voiceClientError(value) {
    this.#voiceClientError = value;
  }

  get voiceClientError() {
    return this.#voiceClientError;
  }

  shutdown() {
    this.#shuttingDown = true;
    console.log("flexIntegration: shutdown instance", this.#instance);
    this.#heartBeatIntervalId && clearInterval(this.#heartBeatIntervalId);
    chrome.runtime.onConnect.removeListener(this.onFlexUIConnectEventHander);

    for (const port of this.#flexUIPortConnections.keys()) {
      console.log("flexIntegration: disconnecting port", this.#instance, port);
      port.disconnect();
    }
  }

  heartBeatToAllFlexUIs = () => {
    if (!this.#voiceClientIdentity || this.#shuttingDown) return;

    if (
      this.#flexToken?.expirationDateTime &&
      this.#flexToken?.expirationDateTime < new Date()
    ) {
      console.error("flexIntegration: flex token expired - restarting");
      this.dispatchEvent(new FlexTokenExpiredEvent());
    }

    this.#flexUIPortConnections.forEach((flexUIPortConnection, port) => {
      if (!flexUIPortConnection.pluginStarted) {
        return;
      }
      if (flexUIPortConnection.accountSid != getConfigValue("accountSid")) {
        return;
      }

      port.postMessage({
        type: "HEARTBEAT_TO_FLEX_UI",
        payload: {
          voiceClientIdentity: this.#voiceClientIdentity,
          error: this.#voiceClientError,
        },
      });
    });
  };

  onFlexUIConnectEventHander = (port) => {
    if (this.#shuttingDown) {
      // listener should have been removed
      console.log(
        "flexIntegration: shutting down, ignoring new connection",
        this.#instance,
        port
      );
      return;
    }
    if (port.name === "flexUI") {
      this.handleNewFlexUIPortConnection(port);
    }
  };

  init() {
    // instance in flex integration and content script is for debugging purposes only to track shutdown issues
    console.log("flexIntegration: Constructed instance", this.#instance);
    chrome.runtime.onConnect.addListener(this.onFlexUIConnectEventHander);

    this.#heartBeatIntervalId = setInterval(
      () => this.heartBeatToAllFlexUIs(),
      1000
    );
  }

  setFlexUIConnectionCounts = () => {
    const flexTabsOpen = this.#flexUIPortConnections.size;
    let flexUITabsWithPluginsRunning = 0;

    this.#flexUIPortConnections.forEach((flexUIPortConnection) => {
      if (flexUIPortConnection.pluginStarted) {
        flexUITabsWithPluginsRunning++;
      }
    });

    console.log(
      `flexIntegration: ${
        this.#instance
      } setFlexUIConnectionCounts flexUITabs=${flexTabsOpen} flexUITabsWithPluginsRunning=${flexUITabsWithPluginsRunning}`
    );

    updateUIOpenTabsCount(flexTabsOpen, flexUITabsWithPluginsRunning);
  };

  handlePluginStartedMessage = (port, accountSid) => {
    // update the account sid for this flexUI port connection
    const flexUIPortConnection = this.#flexUIPortConnections.get(port);
    this.#flexUIPortConnections.set(port, {
      ...flexUIPortConnection,
      pluginStarted: true,
      accountSid,
    });
  };

  handleNewFlexUIPortConnection = async (port) => {
    console.log(
      "flexIntegration: New flexUI port connection",
      this.#instance,
      port
    );
    this.#flexUIPortConnections.set(port, { pluginStarted: false });
    this.setFlexUIConnectionCounts();

    port.onMessage.addListener(async (message) => {
      if (this.#shuttingDown) {
        return;
      }
      const { type, payload } = message;
      switch (type) {
        case "CONFIGURE": {
          const {
            accountSid,
            voiceClientTokenGeneratorUrl,
            extensionVoiceClientPrefix,
          } = payload;

          // only set the config from the first flex UI to connect
          if (!this.configured) {
            this.configured = true;
            const config = {
              accountSid,
              voiceClientTokenGeneratorUrl,
              extensionVoiceClientPrefix,
            };

            setConfig(config);
            updateUIAccountSid(accountSid);
          }
          this.handlePluginStartedMessage(port, accountSid);
          this.setFlexUIConnectionCounts();
          // We send configured so that plugin knows we are ready to receive flex token
          if (accountSid === getConfigValue("accountSid")) {
            console.log(
              "flexIntegration: CONFIGURE message accepted",
              this.#instance,
              payload
            );
            port.postMessage({ type: "CONFIGURED_TO_FLEX_UI" });
          } else {
            console.error(
              "flexIntegration: CONFIGURE message rejected",
              this.#instance,
              payload
            );
            port.postMessage({ type: "CONFIG_REJECTED_TO_FLEX_UI" });
          }
          break;
        }
        case "FLEX_TOKEN": {
          console.log("flexIntegration: FLEX_TOKEN message received", payload);
          const accountSid = this.#flexUIPortConnections.get(port).accountSid;

          const configuredAccountSid = getConfigValue("accountSid");

          // ignore flex token from different accounts compared to the initial account for the first flex ui to connect
          if (accountSid !== configuredAccountSid) {
            return;
          }

          // first time token received
          if (!this.flexToken?.token) {
            updateUIWaitingForFlex(false);
            this.flexToken = {
              token: payload.token,
              expiration: payload.expiration,
            };
          }
          break;
        }

        case "HANGUP_CALL": // forward on to offscreen
          chrome.runtime.sendMessage({
            type: "HANGUP_CALL",
          });
          break;

        case "SEND_DTMF_DIGITS": // forward on to offscreen
          chrome.runtime.sendMessage({
            type: "SEND_DTMF_DIGITS",
            payload: {
              digits: payload.digits,
            },
          });
          break;

        default: {
          console.error(
            "flexIntegration: flexUI message type not recognized",
            type
          );
        }
      }
    });
    port.onDisconnect.addListener((port) => {
      console.log(
        "flexIntegration: flexUI port disconnected",
        this.#instance,
        port
      );
      this.#flexUIPortConnections.delete(port);
      this.setFlexUIConnectionCounts();
    });
  };
}
