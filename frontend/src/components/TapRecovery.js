import { logEvent } from "../logging/eventLogger";
import AdaptiveButton from "./AdaptiveButton";
import { AdaptiveParagraph } from "./AdaptiveText";

export default function TapRecovery() {
  async function initiate() {
    try {
      logEvent({
        type: "tap_recovery_initiated",
        flowId: "recovery",
        stepId: "tap_initiate",
        timestamp: new Date().toISOString(),
      });

      const response = await fetch("http://localhost:5000/recovery/initiate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to initiate recovery");
      }

      logEvent({
        type: "tap_recovery_success",
        flowId: "recovery",
        stepId: "tap_initiate",
        timestamp: new Date().toISOString(),
      });

      alert("Recovery request sent to peers");
    } catch (err) {
      logEvent({
        type: "tap_recovery_error",
        flowId: "recovery",
        stepId: "tap_initiate",
        error: err.message,
      });
      alert("Error: " + err.message);
    }
  }

  return (
    <div>
      <AdaptiveParagraph>
        Send a recovery request to your trusted peers for approval.
      </AdaptiveParagraph>
      <AdaptiveButton onClick={initiate}>
        Send Recovery Request
      </AdaptiveButton>
    </div>
  );
}
