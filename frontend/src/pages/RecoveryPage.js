import { useState } from "react";
import { post } from "../api";
import { useNavigate } from "react-router-dom";
import useMouseTracker from "../hooks/useMouseTracker";
import useIdleTimer from "../hooks/useIdleTimer";
import useScrollDepth from "../hooks/useScrollDepth";
import { logEvent } from "../logging/eventLogger";
import AdaptiveButton from "../components/AdaptiveButton";
import AdaptiveInput from "../components/AdaptiveInput";
import { AdaptiveHeading, AdaptiveLabel } from "../components/AdaptiveText";
import "../styles.css";

const FLOW_ID = "recovery";
const STEP_ID = "start";

export default function RecoveryPage() {
  const [email, setEmail] = useState("");
  const [method, setMethod] = useState("qr"); // qr | tap
  const navigate = useNavigate();

  useMouseTracker(FLOW_ID, STEP_ID);
  useIdleTimer(FLOW_ID, STEP_ID);
  useScrollDepth(FLOW_ID, STEP_ID);

  async function startRecovery() {
    try {
      logEvent({
        type: "recovery_started",
        flowId: FLOW_ID,
        stepId: STEP_ID,
        method,
        timestamp: new Date().toISOString(),
      });

      // Step 1: Get threshold & commitment info
      const res = await post("/recover/start", { email });

      localStorage.setItem("email", email);
      localStorage.setItem("threshold", res.threshold);

      // Method 1: QR scan
      if (method === "qr") {
        logEvent({
          type: "recovery_method_selected",
          flowId: FLOW_ID,
          stepId: STEP_ID,
          method: "qr",
        });
        navigate("/scan");
      }

      // Method 2: Tap-Yes approval
      if (method === "tap") {
        logEvent({
          type: "recovery_method_selected",
          flowId: FLOW_ID,
          stepId: STEP_ID,
          method: "tap",
        });
      await post("/recover/tap/initiate", { email });
      navigate("/tap-wait");

      }
    } catch (err) {
      logEvent({
        type: "recovery_error",
        flowId: FLOW_ID,
        stepId: STEP_ID,
        error: err.message,
      });
      alert(err.message);
    }
  }

  return (
    <div className="page">
      <div className="card">
        <AdaptiveHeading level={2}>Account Recovery</AdaptiveHeading>

        <AdaptiveInput
          placeholder="Account Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ marginBottom: "15px" }}
        />

        <div style={{ marginBottom: "15px" }}>
          <AdaptiveLabel style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
            <input
              type="radio"
              checked={method === "qr"}
              onChange={() => setMethod("qr")}
              style={{ marginRight: "8px" }}
            />
            Recover by scanning peer QR codes
          </AdaptiveLabel>

          <AdaptiveLabel style={{ display: "flex", alignItems: "center" }}>
            <input
              type="radio"
              checked={method === "tap"}
              onChange={() => setMethod("tap")}
              style={{ marginRight: "8px" }}
            />
            Recover using Tap-Yes peer approval
          </AdaptiveLabel>
        </div>

        <AdaptiveButton onClick={startRecovery}>Continue</AdaptiveButton>
      </div>
    </div>
  );
}
