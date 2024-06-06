const TokenValidator = require("twilio-flex-token-validator").functionValidator;

exports.handler = TokenValidator(function (context, event, callback) {
  const response = new Twilio.Response();
  try {
    response.appendHeader("Access-Control-Allow-Origin", "*");
    response.appendHeader("Access-Control-Allow-Methods", "OPTIONS POST GET");
    response.appendHeader("Access-Control-Allow-Headers", "Content-Type");

    const identity =
      (event.VoiceClientPrefix || "ext_") + event.TokenResult.identity;

    const twilioAccountSid = process.env.ACCOUNT_SID;
    const twilioApiKey = process.env.API_KEY;
    const twilioApiSecret = process.env.API_SECRET;

    const voiceGrant = new Twilio.jwt.AccessToken.VoiceGrant({
      incomingAllow: true,
    });

    const ttl = 24 * 60 * 60; // 24 hour token. Some enterprise customers may require a shorter token expiration time

    const token = new Twilio.jwt.AccessToken(
      twilioAccountSid,
      twilioApiKey,
      twilioApiSecret,
      {
        identity,
        ttl,
      }
    );

    token.addGrant(voiceGrant);

    console.log(token.toJwt(), token);

    response.appendHeader("Content-Type", "application/json");
    response.setBody({ identity: identity, token: token.toJwt() });

    return callback(null, response);
  } catch (error) {
    response.appendHeader("Content-Type", "plain/text");
    response.setBody(error.message);
    response.setStatusCode(500);
    return callback(null, response);
  }
});
