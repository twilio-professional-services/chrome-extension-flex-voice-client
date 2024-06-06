import React from "react";
import {
  ActionStateListener,
  IconButton,
  withTheme,
  templates,
  ContentFragment,
} from "@twilio/flex-ui";

import { CallCanvasButtonContainer } from "./CustomEndCallButton.Components";

class CustomEndCallButton extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = { disabled: false };
  }

  handleClick = () => {
    window.postMessage({
      type: "VOICE_CLIENT_EXTENSION_HANGUP_CALL",
    });
  };

  renderHangupButton = () => {
    const { isCallCanvas, size, task, theme } = this.props;
    const icon =
      !!task.conference && task.conference.liveParticipantCount > 2
        ? "LeaveCall"
        : size === "large"
        ? "HangupLarge"
        : "Hangup";

    return isCallCanvas ? (
      <ActionStateListener key="Cancel" action="HangupCall">
        {(actionState) => (
          <IconButton
            className="Twilio-OutboundCall-Cancel"
            icon={icon}
            themeOverride={theme.ConnectingOutboundCallCanvas.CancelCallButton}
            onClick={this.handleClick}
            disabled={actionState.disabled}
            title={templates.HangupCallTooltip()}
            aria-label={templates.HangupCallTooltip()}
            variant="destructive"
          />
        )}
      </ActionStateListener>
    ) : (
      <ActionStateListener action="HangupCall">
        {(actionState) => (
          <IconButton
            className="Twilio-TaskButton-Hangup"
            icon={icon}
            themeOverride={theme.TaskList.Item.Buttons.RejectButton}
            onClick={this.handleClick}
            disabled={actionState.disabled}
            title={templates.HangupCallTooltip()}
            aria-label={templates.HangupCallTooltip()}
            size="small"
            variant="destructive"
          />
        )}
      </ActionStateListener>
    );
  };

  render() {
    const { isCallCanvas } = this.props;

    return (
      <ContentFragment>
        {isCallCanvas ? (
          <CallCanvasButtonContainer>
            {this.renderHangupButton()}
          </CallCanvasButtonContainer>
        ) : (
          this.renderHangupButton()
        )}
      </ContentFragment>
    );
  }
}

export default withTheme(CustomEndCallButton);
