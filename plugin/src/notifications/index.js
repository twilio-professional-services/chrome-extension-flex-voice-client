import {
  Notifications,
  NotificationType,
  NotificationBar,
} from "@twilio/flex-ui";

export const VOICE_CLIENT_CONNECT_FAILED_NOTIFICATION =
  "VoiceClientConnectFailed";
export const VOICE_CLIENT_DISCONNECTED_NOTIFICATION = "VoiceClientDisconnected";
export const VOICE_CLIENT_CONFIGURATION_ERROR_NOTIFICATION =
  "VoiceClientConfigurationError";
export const VOICE_CLIENT_REGISTERED_NOTIFICATION = "VoiceClientRegistered";
export const VOICE_CLIENT_ERROR_NOTIFICATION = "VoiceClientError";
export const MANUAL_CHANGE_TO_VOICE_CLIENT_OFFLINE_ACTIVITY_NOTIFICATION =
  "ManualChangeToVoiceClientOfflineActivity";
export const ACTIVITY_CHANGE_NOT_ALLOWED_NOTIFICATION =
  "ActivityChangeNotAllowed";
export const VOICE_CLIENT_OFFLINE_NOTIFICATION = "VoiceClientOffline";

Notifications.registerNotification({
  id: VOICE_CLIENT_CONNECT_FAILED_NOTIFICATION,
  content:
    "Twilio Voice Client Error. Unable to connect to Voice Client Extension.",
  actions: [
    <NotificationBar.Action
      onClick={(_, notification) => {
        window.location.reload();
      }}
      label="Restart Flex UI"
      icon="Loading"
    />,
  ],
  type: NotificationType.error,
  closeButton: false,
  timeout: 0,
});

Notifications.registerNotification({
  id: VOICE_CLIENT_DISCONNECTED_NOTIFICATION,
  content:
    "Twilio Voice Client Error. Connection to Voice Client Extension failed.",
  actions: [
    <NotificationBar.Action
      onClick={(_, notification) => {
        window.location.reload();
      }}
      label="Restart Flex UI"
      icon="Loading"
    />,
  ],
  type: NotificationType.error,
  closeButton: false,
  timeout: 0,
});

Notifications.registerNotification({
  id: VOICE_CLIENT_CONFIGURATION_ERROR_NOTIFICATION,
  content:
    "Twilio Voice Client Error. Voice Client Extension configured for different account.",
  actions: [
    <NotificationBar.Action
      onClick={(_, notification) => {
        window.location.reload();
      }}
      label="Restart Flex UI"
      icon="Loading"
    />,
  ],
  type: NotificationType.error,
  closeButton: false,
  timeout: 0,
});

Notifications.registerNotification({
  id: VOICE_CLIENT_REGISTERED_NOTIFICATION,
  content: "Twilio Voice Client is Ready.",
  type: NotificationType.success,
  closeButton: true,
  timeout: 5000,
});

Notifications.registerNotification({
  id: VOICE_CLIENT_ERROR_NOTIFICATION,
  content: "Twilio Voice Client Connection Error.",
  type: NotificationType.error,
  closeButton: false,
  timeout: 0,
});

Notifications.registerNotification({
  id: MANUAL_CHANGE_TO_VOICE_CLIENT_OFFLINE_ACTIVITY_NOTIFICATION,
  content: "Setting to Voice Client Offline Activity is not supported.",
  type: NotificationType.warning,
  closeButton: true,
  timeout: 5000,
});

Notifications.registerNotification({
  id: ACTIVITY_CHANGE_NOT_ALLOWED_NOTIFICATION,
  content: "Activity change not supported while Voice Client is unavailable",
  type: NotificationType.warning,
  closeButton: true,
  timeout: 5000,
});

Notifications.registerNotification({
  id: VOICE_CLIENT_OFFLINE_NOTIFICATION,
  content: "Voice Client is Offline.",
  type: NotificationType.warning,
  closeButton: true,
  timeout: 5000,
});
