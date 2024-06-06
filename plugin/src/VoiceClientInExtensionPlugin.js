import React from "react";
import { FlexPlugin } from "@twilio/flex-plugin";
import CustomEndCallButton from "./components/CustomEndCallButton";
import {
  Notifications,
  Manager,
  TaskHelper,
  Button,
  Actions,
} from "@twilio/flex-ui";
import "./notifications";

const extensionVoiceClientPrefix = "ext_";

class VoiceClientMonitor {
  constructor() {
    const initialHeartbeatTimerId = null;
    let heartbeatTimerId = null;
    let voiceClientIdentity = null;
    let initialHeartbeatNotificationEnabled = false;
    let voiceClientError = false;

    this.initialHeartbeatTimerId = setTimeout(() => {
      Notifications.showNotification("VoiceClientConnectFailed");
      console.error("VoiceClientMonitor: No initial Heartbeat received.");
      this.initialHeartbeatNotificationEnabled = true;
    }, 5000);
  }

  heartbeat(voiceClientIdentity, error) {
    if (!voiceClientIdentity) {
      return;
    }
    if (this.heartbeatTimerId) {
      clearInterval(this.heartbeatTimerId);
    }

    if (this.initialHeartbeatTimerId) {
      clearTimeout(this.initialHeartbeatTimerId);
    }

    if (voiceClientIdentity !== this.voiceClientIdentity) {
      this.voiceClientIdentity = voiceClientIdentity;
      Notifications.showNotification("VoiceClientRegistered");
      checkAndSetContactUri(voiceClientIdentity);
      console.log(
        "VoiceClientMonitor: new voice client identity=",
        voiceClientIdentity
      );
    }

    if (this.initialHeartbeatNotificationEnabled) {
      Notifications.dismissNotificationById("VoiceClientConnectFailed");
      this.initialHeartbeatNotificationEnabled = false;
    }

    this.heartbeatTimerId = setTimeout(() => {
      Notifications.showNotification("VoiceClientDisconnected");
      console.error(
        "VoiceClientMonitor: Heartbeat lost. Voice client identity=",
        this.voiceClientIdentity
      );
    }, 5000);

    if (error && !this.voiceClientError) {
      Notifications.showNotification("VoiceClientError");
      this.voiceClientError = true;
    } else if (!error && this.voiceClientError) {
      Notifications.dismissNotificationById("VoiceClientError");
      this.voiceClientError = false;
    }
  }
  disconnected() {
    if (this.heartbeatTimerId) clearInterval(this.heartbeatTimerId);
    if (this.initialHeartbeatTimerId)
      clearTimeout(this.initialHeartbeatTimerId);

    Notifications.showNotification("VoiceClientDisconnected");
  }
}

const PLUGIN_NAME = "VoiceClientInExtensionPlugin";

const configureVoiceClientExtension = (manager) => {
  const voiceClientTokenGeneratorUrl = "http://127.0.0.1:3001/generateToken";
  const accountSid = manager.store.getState().flex.config.sso?.accountSid;
  console.log("VoiceClientInExtensionPlugin: accountSid=", accountSid);

  window.postMessage({
    type: "VOICE_CLIENT_EXTENSION_CONFIGURE",
    payload: {
      voiceClientTokenGeneratorUrl,
      accountSid,
      extensionVoiceClientPrefix,
    },
  });
};

const sendFlexTokenToVoiceClientExtension = (manager) => {
  const ssoTokenPayload = manager.store.getState().flex.session.ssoTokenPayload;
  const accountSid = manager.store.getState().flex.config.sso?.accountSid;

  if (ssoTokenPayload) {
    const { token, expiration } = ssoTokenPayload;
    window.postMessage({
      type: "VOICE_CLIENT_EXTENSION_FLEX_TOKEN",
      payload: {
        token,
        accountSid,
        expiration,
      },
    });
  } else {
    return null;
  }
};

const sendHangupCall = () => {
  window.postMessage({
    type: "VOICE_CLIENT_EXTENSION_HANGUP_CALL",
  });
};

const checkAndSetContactUri = (identity) => {
  const manager = Manager.getInstance();

  const contact_uri = manager.workerClient.attributes?.contact_uri;

  if (contact_uri !== `client:${identity}`) {
    const workerAttributes = manager.workerClient.attributes;
    workerAttributes.contact_uri = `client:${identity}`;
    manager.workerClient.setAttributes(workerAttributes);
  }
};

const checkAndRemoveContactUriPrefix = (prefix, manager) => {
  const clientPrefix = "client:";
  const removeExtPrefix = (str, internalPrefix) => {
    const fullPrefix = clientPrefix + internalPrefix;
    if (str.startsWith(fullPrefix)) {
      return clientPrefix + str.substring(fullPrefix.length);
    }
    return str;
  };

  const contact_uri = manager.workerClient.attributes?.contact_uri;

  if (
    !contact_uri ||
    !contact_uri.startsWith(clientPrefix + extensionVoiceClientPrefix)
  )
    return;

  const updatedContactUri = removeExtPrefix(
    contact_uri,
    extensionVoiceClientPrefix
  );

  const workerAttributes = manager.workerClient.attributes;
  workerAttributes.contact_uri = updatedContactUri;
  manager.workerClient.setAttributes(workerAttributes);
};

const CustomHangupTaskHeader = (props) => {
  const { task, theme } = props;
  const [buttonDisabled, setButtonDisabled] = React.useState(false);

  const hangupClickedHandler = () => {
    setButtonDisabled(true);
    sendHangupCall();
  };

  return (
    <Button
      variant="destructive"
      className="Twilio-TaskCanvasHeader-EndButton"
      onClick={hangupClickedHandler}
      disabled={buttonDisabled}
      themeOverride={theme.TaskCanvasHeader.HangupButton}
      size="small"
    >
      {Manager.getInstance().strings.TaskHeaderEndCall}
    </Button>
  );
};

export default class VoiceClientInExtensionPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  /**
   * This code is run when your plugin is being started
   * Use this to modify any UI components or attach to the actions framework
   *
   * @param flex { typeof import('@twilio/flex-ui') }
   */
  async init(flex, manager) {
    const extensionVoiceClientEnabled =
      manager.workerClient.attributes?.extensionVoiceClientEnabled;

    if (!extensionVoiceClientEnabled) {
      // if contact_uri is ext_identity then remove ext_ prefix so that local voice client is used
      checkAndRemoveContactUriPrefix(extensionVoiceClientPrefix, manager);
      return;
    }

    configureVoiceClientExtension(manager);

    flex.Actions.addListener("beforeWrapupTask", (payload, abort) => {
      if (payload.task.taskChannelUniqueName !== "voice") {
        return;
      }
      sendHangupCall();
      abort();
    });

    // We need to replace some of the call hangup buttons otherwise Flex UI
    // will not diplay all of the buttons if there is no active voice call within
    // Flex UI.
    flex.TaskListButtons.Content.add(
      <CustomEndCallButton key="custom-endcall-task-button" />,
      {
        if: (props) => {
          return (
            flex.TaskHelper.isInitialOutboundAttemptTask(props.task) ||
            flex.TaskHelper.isLiveCall(props.task)
          );
        },
      }
    );

    flex.ConnectingOutboundCallCanvas.Content.add(
      <CustomEndCallButton
        key="custom-endcall-button"
        size="large"
        isCallCanvas
      />
    );

    const useCustomCallEndButton = (task) =>
      !TaskHelper.isInWrapupMode(task) && TaskHelper.isLiveCall(task);

    flex.TaskCanvasHeader.Content.remove("actions", {
      if: ({ task }) => useCustomCallEndButton(task),
    });

    flex.TaskCanvasHeader.Content.add(
      <CustomHangupTaskHeader key="custom-hangup-taskheader" />,
      { if: ({ task }) => useCustomCallEndButton(task) }
    );

    const voiceClientMonitor = new VoiceClientMonitor();

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
          Notifications.showNotification("VoiceClientConfigurationError");
          console.error(
            "VoiceClientInExtensionPlugin: Voice Client Extension configured for different account."
          );
          break;

        default:
          break;
      }
    });

    Actions.replaceAction("StopMonitoringCall", (payload, original) => {
      sendHangupCall();
    });

    manager.event.addListener("afterTokenUpdated", () => {
      sendFlexTokenToVoiceClientExtension(manager);
    });
  }
}
