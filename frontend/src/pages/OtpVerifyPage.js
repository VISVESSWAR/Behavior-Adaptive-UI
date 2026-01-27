import { useEffect, useState } from "react";
import { post } from "../api";
import { useNavigate } from "react-router-dom";
import AdaptiveButton from "../components/AdaptiveButton";
import AdaptiveInput from "../components/AdaptiveInput";
import { AdaptiveHeading, AdaptiveParagraph } from "../components/AdaptiveText";
import "../styles.css";
import { logEvent } from "../logging/eventLogger";
export default function OtpRecoverPage() {
  const navigate = useNavigate();
  const email = localStorage.getItem("email");

  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  /* Countdown timer */
  useEffect(() => {
    if (timer === 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  async function verifyOtp() {
    try {
      await post("/recover/otp/verify", { email, otp });

      // ✅ Recovery verified → go to common reset page
      navigate("/reset-password");
    } catch (err) {
      alert(err.message);
    }
  }

  async function resendOtp() {
    try {
      await post("/recover/otp/start", { email });
      setTimer(60);
      setCanResend(false);
      alert("OTP resent to email");
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="page">
      <div className="card">
        <AdaptiveHeading level={2}>Verify OTP</AdaptiveHeading>

        <AdaptiveParagraph>
          Enter the OTP sent to <strong>{email}</strong>
        </AdaptiveParagraph>

        <AdaptiveInput
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          onFocus={() =>
            logEvent({
              type: "focus_otp",
              flowId: "recovery",
              stepId: "otp_verify",
            })
          }
        />

        <AdaptiveButton
          onClick={() => {
            logEvent({
              type: "click_verify_otp_button",
              flowId: "recovery",
              stepId: "otp_verify",
            });
            verifyOtp();
          }}
        >
          Verify OTP
        </AdaptiveButton>

        {!canResend ? (
          <AdaptiveParagraph>Resend OTP in {timer}s</AdaptiveParagraph>
        ) : (
          <AdaptiveButton
            onClick={() => {
              logEvent({
                type: "click_resend_otp_button",
                flowId: "recovery",
                stepId: "otp_verify",
              });
              resendOtp();
            }}
          >
            Resend OTP
          </AdaptiveButton>
        )}

        <AdaptiveButton
          style={{ background: "#eee", color: "#333" }}
          onClick={() => {
            logEvent({
              type: "click_back_button",
              flowId: "recovery",
              stepId: "otp_verify",
            });
            navigate("/recover");
          }}
        >
          Back
        </AdaptiveButton>
      </div>
    </div>
  );
}
