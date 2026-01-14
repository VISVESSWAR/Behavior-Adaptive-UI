import { useState, useEffect } from "react";
import AdaptiveButton from "../components/AdaptiveButton";
import AdaptiveInput from "../components/AdaptiveInput";
import useMouseTracker from "../hooks/useMouseTracker";
import useIdleTimer from "../hooks/useIdleTimer";
import { logEvent } from "../logging/eventLogger";

export default function Transaction() {
  const flowId = "transaction";
  const [stepId, setStepId] = useState("select_item");

  useMouseTracker(flowId, stepId);
  useIdleTimer(flowId, stepId);

  useEffect(() => {
    logEvent({ type: "step_enter", flowId, stepId });
  }, [stepId]);

  return (
    <div className="flex flex-col gap-4 max-w-md mx-auto mt-20">
      {stepId === "select_item" && (
        <>
          <AdaptiveInput placeholder="Item / Service" />
          <AdaptiveButton onClick={() => setStepId("confirm_payment")}>
            Continue
          </AdaptiveButton>
        </>
      )}

      {stepId === "confirm_payment" && (
        <>
          <p className="text-center">Confirm transaction</p>
          <AdaptiveButton onClick={() => setStepId("success")}>
            Pay
          </AdaptiveButton>
        </>
      )}

      {stepId === "success" && (
        <p className="text-center">Transaction Successful</p>
      )}
    </div>
  );
}
