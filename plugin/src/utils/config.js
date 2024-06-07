import { Manager } from "@twilio/flex-ui";

const manager = Manager.getInstance();

export const isExtensionVoiceClientEnabled = () =>
  manager.workerClient.attributes?.extensionVoiceClientEnabled;
