import { useState, useEffect } from "react";
import { post } from "../api";
import useMouseTracker from "../hooks/useMouseTracker";
import useIdleTimer from "../hooks/useIdleTimer";
import { logEvent } from "../logging/eventLogger";
import AdaptiveInput from "../components/AdaptiveInput";
import AdaptiveButton from "../components/AdaptiveButton";
import { AdaptiveHeading, AdaptiveParagraph } from "../components/AdaptiveText";
import "../styles.css";

const FLOW_ID = "authentication";
const STEP_ID = "signup";

export default function SignupPage() {
  const [mode, setMode] = useState("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [numPeers, setNumPeers] = useState(3);
  const [threshold, setThreshold] = useState(2);
  const [peers, setPeers] = useState(["", "", ""]);

  // Metrics collection for this page
  useMouseTracker(FLOW_ID, STEP_ID);
  useIdleTimer(FLOW_ID, STEP_ID);

  useEffect(() => {
    logEvent({
      type: "page_view",
      flowId: FLOW_ID,
      stepId: STEP_ID,
      mode,
      timestamp: new Date().toISOString(),
    });
  }, [mode]);

  async function signup() {
    try {
      const payload =
        mode === "password"
          ? { email, password, mode }
          : { email, password, mode, numPeers, threshold, peers };

      logEvent({
        type: "signup_attempt",
        flowId: FLOW_ID,
        stepId: STEP_ID,
        mode,
      });

      await post("/signup", payload);

      logEvent({
        type: "signup_success",
        flowId: FLOW_ID,
        stepId: STEP_ID,
        mode,
      });

      alert("Signup successful. You can login now.");
    } catch (err) {
      logEvent({
        type: "signup_error",
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
        <AdaptiveHeading level={2}>Signup</AdaptiveHeading>

        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="password">Normal Signup</option>
          <option value="peer">Peer-based Recovery</option>
        </select>

        <AdaptiveInput
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <AdaptiveInput
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {mode === "peer" && (
          <>
            <AdaptiveInput
              type="number"
              placeholder="Number of Peers (n)"
              value={numPeers}
              onChange={(e) => {
                const n = Number(e.target.value);
                setNumPeers(n);
                setPeers(Array(n).fill(""));
              }}
            />
            <AdaptiveInput
              type="number"
              placeholder="Threshold (k)"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
            />

            {peers.map((p, i) => (
              <AdaptiveInput
                key={i}
                type="email"
                placeholder={`Peer ${i + 1} Email`}
                value={p}
                onChange={(e) => {
                  const copy = [...peers];
                  copy[i] = e.target.value;
                  setPeers(copy);
                }}
              />
            ))}
          </>
        )}

        <AdaptiveButton onClick={signup}>Signup</AdaptiveButton>
      </div>
    </div>
  );
}
