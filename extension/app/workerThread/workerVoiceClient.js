import { getConfigValue } from "./config.js";

class IncomingCallEvent extends Event {
  constructor(token, callToken) {
    super("incomingCall");
    this.token = token;
    this.callToken = callToken;
  }
}

class WorkerThreadVoiceClientStatusEvent extends Event {
  constructor(status, errorMessage = null) {
    super("voiceClientStatus");
    this.status = status;
    this.errorMessage = errorMessage;
  }
}

class voiceClientIdentityUpdatedEvent extends Event {
  constructor(identity) {
    super("voiceClientIdentityUpdated");
    this.identity = identity;
  }
}

class voiceClientInitError extends Event {
  constructor() {
    super("voiceClientInitError");
  }
}

export class WorkerThreadVoiceClient extends EventTarget {
  #shuttingDown = false;
  #device = null;
  #flexToken = null;
  set updateFlexToken(value) {
    this.#flexToken = value;
  }

  constructor(initialFlexToken) {
    super();
    this.#flexToken = initialFlexToken;
  }

  shutdown() {
    console.log("voiceClient: shutdown");
    this.#shuttingDown = true;
    if (this.#device) {
      try {
        this.#device.destroy();
      } catch (e) {
        console.log("voiceClient: catching shutodwn exception", e);
      }
    }
  }

  async init() {
    this.dispatchEvent(new WorkerThreadVoiceClientStatusEvent("fetchingToken"));

    try {
      const response = await getVoiceClientToken(this.#flexToken);

      const data = await response.json();
      const { token, identity } = data;
      this.dispatchEvent(
        new WorkerThreadVoiceClientStatusEvent("tokenFetched")
      );
      this.dispatchEvent(new voiceClientIdentityUpdatedEvent(identity));

      if (this.#shuttingDown) {
        return;
      }

      this.#device = new Twilio.Device(token, { logLevel: 1 });

      this.#device.on("incoming", (call) => {
        // handle early terminated call
        call.on("disconnect", () => this.dispatchEvent(new Event("callEnded")));
        //call.on("cancel", reset); // there will be a cancel for this call because we accept it from the offscreen. Don't reset on cancel.
        call.on("reject", () => this.dispatchEvent(new Event("callEnded")));

        console.log("voiceClient: incoming call", token, call.connectToken);
        // dispatch call to the worker thread
        this.dispatchEvent(new IncomingCallEvent(token, call.connectToken));
      });

      this.#device.on("registered", () => {
        this.dispatchEvent(
          new WorkerThreadVoiceClientStatusEvent("registered")
        );
      });

      this.#device.on("unregistered", () => {
        console.log("voiceClient: unregistered", this.#shuttingDown);
        this.dispatchEvent(
          new WorkerThreadVoiceClientStatusEvent("unregistered")
        );
      });

      this.#device.on("error", (error) => {
        console.error("voiceClient: error", error);
        this.dispatchEvent(
          new WorkerThreadVoiceClientStatusEvent("error", error.message)
        );
      });

      await this.#device.register();

      return identity;
    } catch (error) {
      this.dispatchEvent(
        new WorkerThreadVoiceClientStatusEvent(
          "errorFetchingToken",
          error.message
        )
      );
      this.dispatchEvent(new voiceClientInitError());
      return;
    }
  }
}

// TODO - Retries
const maxretryCount = 3;
const initialRetryTime = 2000;
const getVoiceClientToken = async (flexToken, retryCount = 0) => {
  const voiceClientTokenGeneratorUrl = getConfigValue(
    "voiceClientTokenGeneratorUrl"
  );
  const extensionVoiceClientPrefix = getConfigValue(
    "extensionVoiceClientPrefix"
  );

  const tokenUrl = `${voiceClientTokenGeneratorUrl}?Token=${flexToken}&VoiceClientPrefix=${extensionVoiceClientPrefix}`;
  console.log("voiceClient: getVoiceClientToken", tokenUrl);

  try {
    const response = await fetch(tokenUrl);
    return response;
  } catch (error) {
    console.error("voiceClient: getVoiceClientToken error", error);
    if (retryCount < maxretryCount) {
      console.log("voiceClient: retrying getVoiceClientToken", retryCount);
      await new Promise((resolve) =>
        setTimeout(resolve, initialRetryTime * 2 ** retryCount)
      );
      return getVoiceClientToken(flexToken, retryCount + 1);
    }
    throw error;
  }
};
