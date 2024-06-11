import CustomEndCallButton from "./CustomEndCallButton";
import CustomHangupTaskHeader from "./CustomHangupTaskHeader";
import {
  TaskListButtons,
  ConnectingOutboundCallCanvas,
  TaskCanvasHeader,
  TaskHelper,
  CallCanvasActions,
} from "@twilio/flex-ui";
import { isExtensionVoiceClientEnabled } from "../utils/config";

const updateComponents = () => {
  if (!isExtensionVoiceClientEnabled()) return;

  TaskListButtons.Content.add(
    <CustomEndCallButton key="custom-endcall-task-button" />,
    {
      if: (props) => {
        return (
          TaskHelper.isInitialOutboundAttemptTask(props.task) ||
          TaskHelper.isLiveCall(props.task)
        );
      },
    }
  );

  ConnectingOutboundCallCanvas.Content.add(
    <CustomEndCallButton
      key="custom-endcall-button"
      size="large"
      isCallCanvas
    />
  );

  const useCustomCallEndButton = (task) =>
    !TaskHelper.isInWrapupMode(task) && TaskHelper.isLiveCall(task);

  TaskCanvasHeader.Content.remove("actions", {
    if: ({ task }) => useCustomCallEndButton(task),
  });

  TaskCanvasHeader.Content.add(
    <CustomHangupTaskHeader key="custom-hangup-taskheader" />,
    { if: ({ task }) => useCustomCallEndButton(task) }
  );

  // TODO - remove the mute button from the call canvas for now. Ideally we will track the mute state and update the button accordingly
  // for initial POC we move the mute button to the extension
  // Options could be to send the mute state from the extension back to plugin or change mute from sdk mute to conference mute.
  // If muted at the conference level we would use the conference state to track the mute state.
  CallCanvasActions.Content.remove("toggleMute", {});
};

updateComponents();
