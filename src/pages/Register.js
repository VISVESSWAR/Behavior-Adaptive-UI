import { useState, useEffect } from "react";
import AdaptiveButton from "../components/AdaptiveButton";
import AdaptiveInput from "../components/AdaptiveInput";
import useMouseTracker from "../hooks/useMouseTracker";
import useIdleTimer from "../hooks/useIdleTimer";
import { logEvent } from "../logging/eventLogger";

export default function Register() {
  const flowId = "register";
  const [stepId, setStepId] = useState("enter_email");

  useMouseTracker(flowId, stepId);
  useIdleTimer(flowId, stepId);

  useEffect(() => {
    logEvent({ type: "step_enter", flowId, stepId });
  }, [stepId]);

  return (
    <div className="flex flex-col gap-4 max-w-md mx-auto mt-20">
      {stepId === "enter_email" && (
        <>
          <AdaptiveInput placeholder="Email" />
          <AdaptiveButton onClick={() => setStepId("set_password")}>
            Next
          </AdaptiveButton>
        </>
      )}

      {stepId === "set_password" && (
        <>
          <AdaptiveInput type="password" placeholder="Password" />
          <AdaptiveButton onClick={() => setStepId("confirm")}>
            Register
          </AdaptiveButton>
        </>
      )}

      {stepId === "confirm" && (
        <p className="text-center">Account created</p>
      )}
    </div>
  );
}
