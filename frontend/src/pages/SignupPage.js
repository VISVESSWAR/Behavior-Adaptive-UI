import { useState, useEffect } from "react";
import { post } from "../api";
import { useNavigate } from "react-router-dom";
import useMouseTracker from "../hooks/useMouseTracker";
import useIdleTimer from "../hooks/useIdleTimer";
import { logEvent } from "../logging/eventLogger";
import AdaptiveInput from "../components/AdaptiveInput";
import AdaptiveButton from "../components/AdaptiveButton";
import { AdaptiveHeading } from "../components/AdaptiveText";
import "../styles.css";

const FLOW_ID = "authentication";
const STEP_ID = "signup";

export default function SignupPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("password"); // password | peer
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [numPeers, setNumPeers] = useState(3);
  const [threshold, setThreshold] = useState(2);
  const [peers, setPeers] = useState(["", "", ""]);

  // Metrics collection
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

      alert("Signup successful. Please login.");
      navigate("/"); // redirect to LoginPage
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

        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          style={{ marginBottom: "10px" }}
        >
          <option value="password">Normal Signup (Email OTP Recovery)</option>
          <option value="peer">Peer-based Recovery</option>
        </select>

        <AdaptiveInput
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={() =>
            logEvent({ type: "focus_email", flowId: FLOW_ID, stepId: STEP_ID })
          }
        />

        <AdaptiveInput
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onFocus={() =>
            logEvent({
              type: "focus_password",
              flowId: FLOW_ID,
              stepId: STEP_ID,
            })
          }
        />

        {/* PEER-BASED RECOVERY CONFIG */}
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
              onFocus={() =>
                logEvent({
                  type: "focus_num_peers",
                  flowId: FLOW_ID,
                  stepId: STEP_ID,
                })
              }
            />

            <AdaptiveInput
              type="number"
              placeholder="Threshold (k)"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              onFocus={() =>
                logEvent({
                  type: "focus_threshold",
                  flowId: FLOW_ID,
                  stepId: STEP_ID,
                })
              }
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
                onFocus={() =>
                  logEvent({
                    type: `focus_peer_${i + 1}_email`,
                    flowId: FLOW_ID,
                    stepId: STEP_ID,
                  })
                }
              />
            ))}
          </>
        )}

        <AdaptiveButton
          onClick={() => {
            logEvent({
              type: "click_signup_button",
              flowId: FLOW_ID,
              stepId: STEP_ID,
            });
            signup();
          }}
        >
          Signup
        </AdaptiveButton>

        {/* BACK TO LOGIN */}
        <AdaptiveButton
          onClick={() => {
            logEvent({
              type: "click_back_button",
              flowId: FLOW_ID,
              stepId: STEP_ID,
            });
            navigate("/");
          }}
          style={{
            marginTop: "10px",
            background: "transparent",
            border: "none",
            color: "#007bff",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          ← Back to Login
        </AdaptiveButton>
      </div>
    </div>
  );
}
