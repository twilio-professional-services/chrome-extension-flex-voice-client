import CustomEndCallButton from "./CustomEndCallButton";
import CustomHangupTaskHeader from "./CustomHangupTaskHeader";
import {
  TaskListButtons,
  ConnectingOutboundCallCanvas,
  TaskCanvasHeader,
  TaskHelper,
} from "@twilio/flex-ui";

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
  <CustomEndCallButton key="custom-endcall-button" size="large" isCallCanvas />
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
