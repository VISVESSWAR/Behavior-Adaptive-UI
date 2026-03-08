import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { post } from "../api.jsx";
import { useNavigate } from "react-router-dom";
import HelpBar from "../components/HelpBar.jsx";
import { logEvent } from "../logging/eventLogger.jsx";
import AdaptiveButton from "../components/AdaptiveButton.jsx";
import PasswordInput from "../components/PasswordInput.jsx";
import { AdaptiveHeading, AdaptiveParagraph } from "../components/AdaptiveText.jsx";
import "../styles.css";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const email = localStorage.getItem("email");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // Start task on mount
  useEffect(() => {
    logEvent({
      type: "page_view",
      flowId: "recovery",
      stepId: "reset_password",
      timestamp: new Date().toISOString(),
    });
  }, []);

  async function resetPassword() {
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const loadingToast = toast.loading("Resetting password...");
      await post("/recover/reset-password", {
        email,
        newPassword: password,
      });
      toast.dismiss(loadingToast);
      toast.success("Password reset successful");
      localStorage.clear();
      navigate("/");
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <>
      <HelpBar pageId="recovery" />
      <div className="page">
      <div className="card">
        <AdaptiveHeading level={2}>Set New Password</AdaptiveHeading>

        <AdaptiveParagraph>
          Account: <strong>{email}</strong>
        </AdaptiveParagraph>

        <PasswordInput
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onFocus={() =>
            logEvent({
              type: "focus_new_password",
              flowId: "recovery",
              stepId: "reset_password",
            })
          }
        />

        <PasswordInput
          placeholder="Confirm Password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onFocus={() =>
            logEvent({
              type: "focus_confirm_password",
              flowId: "recovery",
              stepId: "reset_password",
            })
          }
        />

        <AdaptiveButton
          onClick={() => {
            logEvent({
              type: "click_reset_password_button",
              flowId: "recovery",
              stepId: "reset_password",
            });
            resetPassword();
          }}
        >
          Reset Password
        </AdaptiveButton>

        <AdaptiveButton
          style={{ background: "#eee", color: "#333" }}
          onClick={() => {
            logEvent({
              type: "click_back_button",
              flowId: "recovery",
              stepId: "reset_password",
            });
            navigate("/recover");
          }}
        >
          Back
        </AdaptiveButton>
      </div>
      </div>
    </>
  );
}
