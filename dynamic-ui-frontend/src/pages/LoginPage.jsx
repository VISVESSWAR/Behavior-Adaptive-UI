import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { post } from "../api.jsx";
import { useNavigate } from "react-router-dom";
import HelpBar from "../components/HelpBar.jsx";
import { logEvent } from "../logging/eventLogger.jsx";
import { useTask } from "../task/TaskContext.jsx";
import AdaptiveInput from "../components/AdaptiveInput.jsx";
import PasswordInput from "../components/PasswordInput.jsx";
import AdaptiveButton from "../components/AdaptiveButton.jsx";
import { AdaptiveHeading, AdaptiveParagraph } from "../components/AdaptiveText.jsx";
import "../styles.css";
import { Link } from "react-router-dom";
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

    // Start login task - generates unique task_id per attempt
    task.startPageTask("login");
  }, [task]);

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

      // Show success toast
      toast.success(`Welcome back, ${email.split('@')[0]}!`);

      nav("/home");
    } catch (err) {
      logEvent({
        type: "login_error",
        flowId: FLOW_ID,
        stepId: STEP_ID,
        error: err.message,
      });
      toast.error(`Login failed: ${err.message}`);
    }
  }

  return (
    <>
      <HelpBar pageId="login" />
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

        <PasswordInput
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
    </>
  );
}
