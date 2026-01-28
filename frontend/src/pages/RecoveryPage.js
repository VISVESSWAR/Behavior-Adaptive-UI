import { useState } from "react";
import { post } from "../api";
import { useNavigate } from "react-router-dom";
import { logEvent } from "../logging/eventLogger";
import AdaptiveButton from "../components/AdaptiveButton";
import AdaptiveInput from "../components/AdaptiveInput";
import { AdaptiveHeading, AdaptiveLabel } from "../components/AdaptiveText";
import "../styles.css";

const FLOW_ID = "recovery";

export default function RecoveryPage() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState("email"); // email | method
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function validateEmail() {
    if (!email.trim()) {
      alert("Please enter your email address");
      return;
    }

    try {
      setLoading(true);
      
      logEvent({
        type: "recovery_email_submitted",
        flowId: FLOW_ID,
        stepId: "email",
        email,
        timestamp: new Date().toISOString(),
      });

      // Check email and get recovery mode options
      const decision = await post("/recover/decide", { email });

      // Store email globally for next steps
      localStorage.setItem("email", email);
      localStorage.setItem("recovery_mode", decision.recovery_mode);

      // Move to method selection
      setStep("method");
    } catch (err) {
      logEvent({
        type: "recovery_email_error",
        flowId: FLOW_ID,
        stepId: "email",
        error: err.message,
      });
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleMethodSelection(method) {
    try {
      setLoading(true);
      setSelectedMethod(method);

      logEvent({
        type: "recovery_method_selected",
        flowId: FLOW_ID,
        stepId: "method",
        method: method,
        timestamp: new Date().toISOString(),
      });

      // Route based on selected method
      if (method === "email") {
        await post("/recover/otp/start", { email });
        navigate("/otp-recover");
      } else if (method === "qr") {
        const res = await post("/recover/start", { email });
        localStorage.setItem("threshold", res.threshold);
        navigate("/scan-qr");
      } else if (method === "tap") {
        const res = await post("/recover/start", { email });
        localStorage.setItem("threshold", res.threshold);
        await post("/recover/tap/initiate", { email });
        navigate("/tap-wait");
      }
    } catch (err) {
      logEvent({
        type: "recovery_method_error",
        flowId: FLOW_ID,
        stepId: "method",
        method: method,
        error: err.message,
      });
      alert(err.message);
      setSelectedMethod(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="card">
        <AdaptiveHeading level={2}>Account Recovery</AdaptiveHeading>

        {/* ========== STEP 1: EMAIL ENTRY ========== */}
        {step === "email" && (
          <>
            <AdaptiveLabel style={{ marginBottom: "10px" }}>
              Enter your account email address
            </AdaptiveLabel>

            <AdaptiveInput
              placeholder="Account Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() =>
                logEvent({
                  type: "focus_email",
                  flowId: FLOW_ID,
                  stepId: "email",
                })
              }
              style={{ marginBottom: "20px" }}
            />
            
            <AdaptiveButton
              onClick={validateEmail}
              disabled={loading}
              style={{ marginBottom: "10px" }}
            >
              {loading ? "Validating..." : "Next"}
            </AdaptiveButton>

            <AdaptiveButton
              style={{ background: "#eee", color: "#333" }}
              onClick={() => {
                logEvent({
                  type: "click_back_button",
                  flowId: FLOW_ID,
                  stepId: "email",
                });
                navigate("/");
              }}
            >
              Back to Login
            </AdaptiveButton>
          </>
        )}

        {/* ========== STEP 2: METHOD SELECTION ========== */}
        {step === "method" && (
          <>
            <AdaptiveLabel style={{ marginBottom: "20px" }}>
              <strong>Choose your recovery method:</strong>
            </AdaptiveLabel>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              <AdaptiveButton
                onClick={() => handleMethodSelection("email")}
                disabled={loading}
                style={{
                  padding: "15px",
                  textAlign: "left",
                  opacity: selectedMethod === "email" ? 0.7 : 1,
                }}
              >
                📧 Recover via Email OTP
                <div style={{ fontSize: "12px", marginTop: "5px", opacity: 0.8 }}>
                  We'll send a code to your email
                </div>
              </AdaptiveButton>

              <AdaptiveButton
                onClick={() => handleMethodSelection("qr")}
                disabled={loading}
                style={{
                  padding: "15px",
                  textAlign: "left",
                  opacity: selectedMethod === "qr" ? 0.7 : 1,
                }}
              >
                📱 Recover via QR Scan
                <div style={{ fontSize: "12px", marginTop: "5px", opacity: 0.8 }}>
                  Scan codes from your recovery peers
                </div>
              </AdaptiveButton>

              <AdaptiveButton
                onClick={() => handleMethodSelection("tap")}
                disabled={loading}
                style={{
                  padding: "15px",
                  textAlign: "left",
                  opacity: selectedMethod === "tap" ? 0.7 : 1,
                }}
              >
                👥 Peer Approval (Tap Yes)
                <div style={{ fontSize: "12px", marginTop: "5px", opacity: 0.8 }}>
                  Your peers approve your recovery
                </div>
              </AdaptiveButton>
            </div>

            <AdaptiveButton
              style={{ background: "#eee", color: "#333" }}
              onClick={() => {
                logEvent({
                  type: "click_back_button",
                  flowId: FLOW_ID,
                  stepId: "method",
                });
                setStep("email");
                setSelectedMethod(null);
              }}
              disabled={loading}
            >
              Back
            </AdaptiveButton>
          </>
        )}
      </div>
    </div>
  );
}
