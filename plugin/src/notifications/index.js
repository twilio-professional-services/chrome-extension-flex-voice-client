import {
  Notifications,
  NotificationType,
  NotificationBar,
} from "@twilio/flex-ui";

Notifications.registerNotification({
  id: "VoiceClientConnectFailed",
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
  id: "VoiceClientDisconnected",
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
  id: "VoiceClientConfigurationError",
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
  id: "VoiceClientRegistered",
  content: "Twilio Voice Client is Ready.",
  type: NotificationType.success,
  closeButton: true,
  timeout: 5000,
});

Notifications.registerNotification({
  id: "VoiceClientError",
  content: "Twilio Voice Client Connection Error.",
  type: NotificationType.error,
  closeButton: false,
  timeout: 0,
});
