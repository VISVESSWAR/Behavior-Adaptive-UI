import { useState, useEffect } from "react";
import AdaptiveButton from "../components/AdaptiveButton";
import AdaptiveInput from "../components/AdaptiveInput";
import useMouseTracker from "../hooks/useMouseTracker";
import useIdleTimer from "../hooks/useIdleTimer";
import { logEvent } from "../logging/eventLogger";

export default function Login() {
  const flowId = "login";
  const [stepId, setStepId] = useState("enter_username");

  useMouseTracker(flowId, stepId);
  useIdleTimer(flowId, stepId);

  useEffect(() => {
    logEvent({
      type: "step_enter",
      flowId,
      stepId
    });
  }, [stepId]);

  return (
    <div className="flex flex-col gap-4 max-w-md mx-auto mt-20">
      {stepId === "enter_username" && (
        <>
          <AdaptiveInput placeholder="Username" />
          <AdaptiveButton onClick={() => setStepId("enter_password")}>
            Next
          </AdaptiveButton>
        </>
      )}

      {stepId === "enter_password" && (
        <>
          <AdaptiveInput type="password" placeholder="Password" />
          <AdaptiveButton onClick={() => setStepId("submit")}>
            Login
          </AdaptiveButton>
        </>
      )}

      {stepId === "submit" && (
        <p className="text-center">Authenticating...</p>
      )}
    </div>
  );
}
