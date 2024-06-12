# Flex Voice Client in a Chrome Extension

## Disclaimer

**This software is to be considered "sample code", a Type B Deliverable, and is delivered "as-is" to the user. Twilio bears no responsibility to support the use or implementation of this software.**

**The software is still in a developmental or beta stage and may contain bugs, defects, or other issues that could cause it to malfunction or fail.**

## Testing Requirements

**Before deploying this plugin in a production environment, it is crucial that you perform thorough testing in a controlled, non-production setting. Testing should include resilience to network interruption and token expiry.**

# Solution Overview

# Installation

## Chrome Extension Install For Development

## Serverless Install

> Serverless installs a Twilio Functions serverless environment that the Chrome Extensions leverages to generate a voice client token for use by the voice client sdk.

> The accounts main auth token and account sid is used to validate that the request included a Flex Token. A standard API key is used to generate the voice client access token.

Copy the .env-template in the serverless directory to .env and update the following variables:

```
ACCOUNT_SID=ACxx
AUTH_TOKEN=
API_KEY=SKxx
API_SECRET=
```

Account sid and auth token are available from the Twilio Console -> Account info : https://console.twilio.com/

API key and secret can be created via Console -> Account -> API Keys and Tokens: https://console.twilio.com/us1/account/keys-credentials/api-keys

https://www.twilio.com/docs/iam/api-keys

After updating the .env file deploy using the twilio cli:

```
twilio serverless:deploy
```

Note the Domain from the Deployment Details as this will be required for the plugin install. The domain will be custom to your account and of the form:

_serverless-chrome-extension-flex-voice-client-xxxx-dev.twil.io_

## Flex UI Plugin Install

Blah

# Architecture

![Flex Voice Client in Chrome Extension](screenshots/FlexVoiceClientInChromeExtension.png)
