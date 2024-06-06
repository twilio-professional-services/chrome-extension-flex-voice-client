import { styled } from "@twilio/flex-ui";

export const CallCanvasButtonContainer = styled("div")`
  width: 100%;
  display: flex;
  /* margin: "24px auto" */
  margin: ${(props) => (props.compact ? "4px auto 12px" : "24px auto")};
  justify-content: center;

  button {
    width: 44px;
    height: 44px;
    margin-left: 6px;
    margin-right: 6px;
  }
`;
