import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { post } from "../api.jsx";
import { useNavigate } from "react-router-dom";
import HelpBar from "../components/HelpBar.jsx";
import { useTask } from "../task/TaskContext.jsx";
import { logEvent } from "../logging/eventLogger.jsx";
import AdaptiveButton from "../components/AdaptiveButton.jsx";
import AdaptiveInput from "../components/AdaptiveInput.jsx";
import { AdaptiveHeading, AdaptiveLabel } from "../components/AdaptiveText.jsx";
import "../styles.css";

const FLOW_ID = "recovery";

export default function RecoveryPage() {
  const task = useTask();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState("email"); // email | method
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [methods, setMethods] = useState({
    email: false,
    peer: false,
    device: false
  });

  const navigate = useNavigate();

  // Start task on mount
  useEffect(() => {
    logEvent({
      type: "page_view",
      flowId: "recovery",
      stepId: "recovery",
      timestamp: new Date().toISOString(),
    });
    
    task.startPageTask("recovery");
  }, [task]);

  async function validateEmail() {
    if (!email.trim()) {
      toast.error("Please enter your email address");
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

      // Fetch available recovery methods from secure endpoint
      const optionsResponse = await post("/recover/options", { identifier: email });
      
      // Store available methods
      setMethods(optionsResponse.methods);

      logEvent({
        type: "recovery_methods_fetched",
        flowId: FLOW_ID,
        stepId: "email",
        email,
        availableMethods: optionsResponse.methods,
        timestamp: new Date().toISOString(),
      });

      // Store email for next steps
      localStorage.setItem("email", email);
      localStorage.setItem("recoveryMethods", JSON.stringify(optionsResponse.methods));

      // Move to method selection
      setStep("method");
    } catch (err) {
      logEvent({
        type: "recovery_email_error",
        flowId: FLOW_ID,
        stepId: "email",
        error: err.message,
      });
      toast.error(err.message);
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
      toast.error(err.message);
      setSelectedMethod(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <HelpBar pageId="recovery" />
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

            {/* Show warning if no methods available */}
            {!methods.email && !methods.peer && !methods.device && (
              <div
                style={{
                  padding: "15px",
                  marginBottom: "20px",
                  backgroundColor: "#fff3cd",
                  border: "1px solid #ffc107",
                  borderRadius: "4px",
                  color: "#856404",
                  fontSize: "14px",
                }}
              >
                <strong>⚠️ No Recovery Methods Available</strong>
                <div style={{ marginTop: "8px", fontSize: "13px" }}>
                  Unfortunately, no recovery methods have been configured for this account. 
                  Please contact support for assistance.
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              {/* Email OTP Recovery - Only show if enabled */}
              {methods.email && (
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
              )}

              {/* QR Scan Recovery - Only show if peer recovery enabled */}
              {methods.peer && (
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
              )}

              {/* Peer Approval (Tap) - Only show if peer recovery enabled */}
              {methods.peer && (
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
              )}

              {/* Device Recovery - Reserved for future use */}
              {methods.device && (
                <AdaptiveButton
                  onClick={() => handleMethodSelection("device")}
                  disabled={loading}
                  style={{
                    padding: "15px",
                    textAlign: "left",
                    opacity: selectedMethod === "device" ? 0.7 : 1,
                  }}
                >
                  🔐 Recover via Trusted Device
                  <div style={{ fontSize: "12px", marginTop: "5px", opacity: 0.8 }}>
                    Use a previously trusted device
                  </div>
                </AdaptiveButton>
              )}
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
    </>
  );
}
