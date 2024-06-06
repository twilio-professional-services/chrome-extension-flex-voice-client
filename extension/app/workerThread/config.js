export const setConfig = (updatedConfig) => {
  console.log("config: set", updatedConfig);
  config = { ...config, ...updatedConfig };
};

export const resetConfig = () => {
  console.log("config: reset");
  config = {
    accountSid: null,
    voiceClientTokenGeneratorUrl: null,
    extensionVoiceClientPrefix: null,
  };
};

export const getConfigValue = (key) => {
  const value = config[key];
  if (!value) {
    console.error(`config: key ${key} not found in config`);
    return null;
  }

  //console.log("config: get", key, "value=", value);
  return value;
};

let config = {
  accountSid: null,
  voiceClientTokenGeneratorUrl: null,
  extensionVoiceClientPrefix: null,
};
