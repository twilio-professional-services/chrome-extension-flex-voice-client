import { FlexPlugin } from "@twilio/flex-plugin";
import { activityMonitor } from "./helpers/activityMonitor";
import { VoiceClientExtensionMonitor } from "./helpers/voiceClientExtensionMonitor";
import { checkAndRemoveContactUriPrefix } from "./utils/contactUriUtils";
import { sendConfigureVoiceClientExtensionMessage } from "./utils/extensionMessages";
import { listenForExtensionMessages } from "./helpers/extensionEventListener";
import "./notifications";
import "./actions";
import "./components";
import "./listeners";

const PLUGIN_NAME = "VoiceClientInExtensionPlugin";

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
      checkAndRemoveContactUriPrefix(manager);
      return;
    }

    await activityMonitor.checkCurrentActivity();
    const voiceClientMonitor = new VoiceClientExtensionMonitor();

    voiceClientMonitor.on("voiceClientAvailableEvent", (availableFlag) =>
      activityMonitor.setVoiceClientAvailableFlag(availableFlag)
    );

    listenForExtensionMessages(manager, voiceClientMonitor);
    sendConfigureVoiceClientExtensionMessage(manager);
  }
}
