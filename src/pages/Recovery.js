import { useState, useEffect } from "react";
import AdaptiveButton from "../components/AdaptiveButton";
import AdaptiveInput from "../components/AdaptiveInput";
import useMouseTracker from "../hooks/useMouseTracker";
import useIdleTimer from "../hooks/useIdleTimer";
import { logEvent } from "../logging/eventLogger";

export default function Recovery() {
  const flowId = "recovery";
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
          <AdaptiveInput placeholder="Registered Email" />
          <AdaptiveButton onClick={() => setStepId("peer_verification")}>
            Recover
          </AdaptiveButton>
        </>
      )}

      {stepId === "peer_verification" && (
        <>
          <p className="text-center">Waiting for peer approval</p>
          <AdaptiveButton onClick={() => setStepId("reset_success")}>
            Simulate Approval
          </AdaptiveButton>
        </>
      )}

      {stepId === "reset_success" && (
        <p className="text-center">Recovery Successful</p>
      )}
    </div>
  );
}
