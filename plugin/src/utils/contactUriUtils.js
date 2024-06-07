import { Manager } from "@twilio/flex-ui";

export const extensionVoiceClientPrefix = "ext_";

export const checkAndSetContactUri = (identity) => {
  const manager = Manager.getInstance();

  const contact_uri = manager.workerClient.attributes?.contact_uri;

  if (contact_uri !== `client:${identity}`) {
    const workerAttributes = manager.workerClient.attributes;
    workerAttributes.contact_uri = `client:${identity}`;
    manager.workerClient.setAttributes(workerAttributes);
  }
};

export const checkAndRemoveContactUriPrefix = (manager) => {
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
