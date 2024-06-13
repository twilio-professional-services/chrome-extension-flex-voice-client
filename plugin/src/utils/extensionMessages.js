import { extensionVoiceClientPrefix } from "./contactUriUtils";

const voiceClientTokenGeneratorUrl =
  process.env.FLEX_APP_VOICE_CLIENT_TOKEN_GENERATOR_URL;

export const sendConfigureVoiceClientExtensionMessage = (manager) => {
  const accountSid = manager.store.getState().flex.config.sso?.accountSid;
  console.log(
    "VoiceClientInExtensionPlugin: accountSid=",
    accountSid,
    voiceClientTokenGeneratorUrl,
    extensionVoiceClientPrefix
  );

  window.postMessage({
    type: "VOICE_CLIENT_EXTENSION_CONFIGURE",
    payload: {
      voiceClientTokenGeneratorUrl,
      accountSid,
      extensionVoiceClientPrefix,
    },
  });
};

export const sendFlexTokenToVoiceClientExtension = (manager) => {
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

export const sendHangupCall = () => {
  window.postMessage({
    type: "VOICE_CLIENT_EXTENSION_HANGUP_CALL",
  });
};

export const sendDTMFDigits = (digits) => {
  window.postMessage({
    type: "VOICE_CLIENT_EXTENSION_SEND_DTMF_DIGITS",
    payload: {
      digits,
    },
  });
};
