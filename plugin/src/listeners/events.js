import { Manager } from "@twilio/flex-ui";
import { sendFlexTokenToVoiceClientExtension } from "../utils/extensionMessages";

const manager = Manager.getInstance();

manager.events.addListener("afterTokenUpdated", () => {
  sendFlexTokenToVoiceClientExtension(manager);
});
