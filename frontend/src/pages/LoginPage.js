import { useState, useEffect } from "react";
import { post } from "../api";
import { useNavigate, Link } from "react-router-dom";
import { logEvent } from "../logging/eventLogger";
import { useTask } from "../task/TaskContext";
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
  const task = useTask();

  // Start task on mount
  useEffect(() => {
    logEvent({
      type: "page_view",
      flowId: FLOW_ID,
      stepId: STEP_ID,
      timestamp: new Date().toISOString(),
    });

    // Start login task with 45 second time limit
    task.startTask("login_task", 45000);
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

      // Dispatch custom event to update navbar immediately
      window.dispatchEvent(new Event("auth-change"));

      logEvent({
        type: "login_success",
        flowId: FLOW_ID,
        stepId: STEP_ID,
        email,
      });

      // Mark task as completed on successful login
      task.completeTask();

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
          onFocus={() => {
            task.logStep("login_email");
            logEvent({
              type: "focus_email",
              flowId: FLOW_ID,
              stepId: STEP_ID,
            });
          }}
        />

        <AdaptiveInput
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onFocus={() => {
            task.logStep("login_password");
            logEvent({
              type: "focus_password",
              flowId: FLOW_ID,
              stepId: STEP_ID,
            });
          }}
        />

        <AdaptiveButton
          onClick={() => {
            task.logStep("login_submit");
            logEvent({
              type: "click_login_button",
              flowId: FLOW_ID,
              stepId: STEP_ID,
            });
            login();
          }}
        >
          Login
        </AdaptiveButton>

        <AdaptiveButton
          variant="secondary"
          onClick={() => {
            logEvent({
              type: "click_recover_button",
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
