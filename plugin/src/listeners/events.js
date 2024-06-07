import { Manager } from "@twilio/flex-ui";
import { sendFlexTokenToVoiceClientExtension } from "../utils/extensionMessages";
import { isExtensionVoiceClientEnabled } from "../utils/config";

const manager = Manager.getInstance();

manager.events.addListener("afterTokenUpdated", () => {
  if (!isExtensionVoiceClientEnabled()) return;

  sendFlexTokenToVoiceClientExtension(manager);
});
