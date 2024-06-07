import { Manager, Button } from "@twilio/flex-ui";
import { sendHangupCall } from "../utils/extensionMessages";

const CustomHangupTaskHeader = (props) => {
  const { task, theme } = props;
  const [buttonDisabled, setButtonDisabled] = React.useState(false);

  const hangupClickedHandler = () => {
    setButtonDisabled(true);
    sendHangupCall();
  };

  return (
    <Button
      variant="destructive"
      className="Twilio-TaskCanvasHeader-EndButton"
      onClick={hangupClickedHandler}
      disabled={buttonDisabled}
      themeOverride={theme.TaskCanvasHeader.HangupButton}
      size="small"
    >
      {Manager.getInstance().strings.TaskHeaderEndCall}
    </Button>
  );
};

export default CustomHangupTaskHeader;
