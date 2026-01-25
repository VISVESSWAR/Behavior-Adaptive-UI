import { useState, useEffect } from "react";
import { post } from "../api";
import { useNavigate, Link } from "react-router-dom";
import useMouseTracker from "../hooks/useMouseTracker";
import useIdleTimer from "../hooks/useIdleTimer";
import { logEvent } from "../logging/eventLogger";
import AdaptiveInput from "../components/AdaptiveInput";
import AdaptiveButton from "../components/AdaptiveButton";
import { AdaptiveHeading, AdaptiveParagraph } from "../components/AdaptiveText";
import "../styles.css";

const FLOW_ID = "authentication";
const STEP_ID = "login";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigate();

  // Metrics collection for this page
  useMouseTracker(FLOW_ID, STEP_ID);
  useIdleTimer(FLOW_ID, STEP_ID);

  useEffect(() => {
    logEvent({
      type: "page_view",
      flowId: FLOW_ID,
      stepId: STEP_ID,
      timestamp: new Date().toISOString(),
    });
  }, []);

  async function login() {
    try {
      logEvent({
        type: "login_attempt",
        flowId: FLOW_ID,
        stepId: STEP_ID,
        email,
      });

      const res = await post("/auth/login", { email, password });
      localStorage.setItem("token", res.token);

      logEvent({
        type: "login_success",
        flowId: FLOW_ID,
        stepId: STEP_ID,
        email,
      });

      nav("/home");
    } catch (err) {
      logEvent({
        type: "login_error",
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
        <AdaptiveHeading level={2}>Login</AdaptiveHeading>

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

        <AdaptiveButton onClick={login}>Login</AdaptiveButton>
        
        <AdaptiveButton
          variant="secondary"
          onClick={() => {
            logEvent({
              type: "recovery_initiated",
              flowId: FLOW_ID,
              stepId: STEP_ID,
              timestamp: new Date().toISOString(),
            });
            nav("/recover");
          }}
        >
          Recover Account
        </AdaptiveButton>

        <AdaptiveParagraph className="link">
          New user? <Link to="/signup">Signup here</Link>
        </AdaptiveParagraph>
      </div>
    </div>
  );
}
