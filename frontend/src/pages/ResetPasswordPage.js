import { useState } from "react";
import { post } from "../api";
import { useNavigate } from "react-router-dom";
import AdaptiveButton from "../components/AdaptiveButton";
import AdaptiveInput from "../components/AdaptiveInput";
import { AdaptiveHeading, AdaptiveParagraph } from "../components/AdaptiveText";
import "../styles.css";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const email = localStorage.getItem("email");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  async function resetPassword() {
    if (password !== confirm) {
      alert("Passwords do not match");
      return;
    }

    try {
      await post("/recover/reset-password", {
        email,
        newPassword: password
      });

      alert("Password reset successful");
      localStorage.clear();
      navigate("/");
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="page">
      <div className="card">
        <AdaptiveHeading level={2}>Set New Password</AdaptiveHeading>

        <AdaptiveParagraph>
          Account: <strong>{email}</strong>
        </AdaptiveParagraph>

        <AdaptiveInput
          type="password"
          placeholder="New Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <AdaptiveInput
          type="password"
          placeholder="Confirm Password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
        />

        <AdaptiveButton onClick={resetPassword}>
          Reset Password
        </AdaptiveButton>

        <AdaptiveButton
          style={{ background: "#eee", color: "#333" }}
          onClick={() => navigate("/recover")}
        >
          Back
        </AdaptiveButton>
      </div>
    </div>
  );
}
