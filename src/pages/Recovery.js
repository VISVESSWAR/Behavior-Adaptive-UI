import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import AdaptiveButton from "../components/AdaptiveButton";
import AdaptiveInput from "../components/AdaptiveInput";
import {
  AdaptiveHeading,
  AdaptiveParagraph,
  AdaptiveLabel,
  AdaptiveLink,
} from "../components/AdaptiveText";
import useMouseTracker from "../hooks/useMouseTracker";
import useIdleTimer from "../hooks/useIdleTimer";
import useScrollDepth from "../hooks/useScrollDepth";
import { logEvent } from "../logging/eventLogger";

export default function Recovery() {
  const flowId = "recovery";
  const navigate = useNavigate();
  const [stepId, setStepId] = useState("enter_email");
  const [email, setEmail] = useState("");
  const [recoveryMethod, setRecoveryMethod] = useState(null);
  const [verified, setVerified] = useState(false);

  useMouseTracker(flowId, stepId);
  useIdleTimer(flowId, stepId);
  useScrollDepth(flowId, stepId);

  useEffect(() => {
    logEvent({ type: "step_enter", flowId, stepId });
  }, [stepId]);

  const handleEmailSubmit = () => {
    if (!email.trim()) {
      return;
    }
    logEvent({
      type: "recovery_email_submitted",
      flowId,
      email,
    });
    setStepId("select_method");
  };

  const handleQRFlow = () => {
    setRecoveryMethod("qr");
    logEvent({
      type: "recovery_method_selected",
      flowId,
      method: "qr",
    });
    setStepId("qr_scan");
  };

  const handleTapYesFlow = () => {
    setRecoveryMethod("tap_yes");
    logEvent({
      type: "recovery_method_selected",
      flowId,
      method: "tap_yes",
    });
    setStepId("waiting_approval");
  };

  const simulateQRScan = () => {
    logEvent({
      type: "qr_scanned",
      flowId,
    });
    setStepId("qr_verified");
    setTimeout(() => {
      setVerified(true);
      setStepId("reset_password");
    }, 2000);
  };

  const simulateTapYes = () => {
    logEvent({
      type: "approval_confirmed",
      flowId,
      method: "tap_yes",
    });
    setStepId("tap_yes_verified");
    setTimeout(() => {
      setVerified(true);
      setStepId("reset_password");
    }, 2000);
  };

  const handlePasswordReset = (e) => {
    e.preventDefault();
    logEvent({
      type: "password_reset_success",
      flowId,
      email,
    });
    setStepId("success");
    setTimeout(() => navigate("/login"), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <AdaptiveHeading level={1} className="text-gray-900 mb-2">
          Account Recovery
        </AdaptiveHeading>
        <AdaptiveParagraph className="text-gray-600">
          Recover access to your account
        </AdaptiveParagraph>
      </div>

      {/* === ENTER EMAIL === */}
      {stepId === "enter_email" && (
        <div className="card-base max-w-md mx-auto space-y-6">
          <div>
            <AdaptiveLabel className="block text-gray-700 mb-2">
              Registered Email
            </AdaptiveLabel>
            <AdaptiveInput
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleEmailSubmit()}
            />
          </div>
          <AdaptiveButton onClick={handleEmailSubmit} className="w-full">
            Find Account
          </AdaptiveButton>
          <AdaptiveParagraph className="text-center text-gray-600">
            <AdaptiveLink
              as={Link}
              to="/login"
              className="text-blue-600 hover:text-blue-700"
            >
              Back to Login
            </AdaptiveLink>
          </AdaptiveParagraph>
        </div>
      )}

      {/* === SELECT RECOVERY METHOD === */}
      {stepId === "select_method" && (
        <div>
          <div className="card-base max-w-md mx-auto mb-8 text-center">
            <AdaptiveParagraph className="text-gray-600 mb-2">
              Verification email sent to:
            </AdaptiveParagraph>
            <AdaptiveParagraph className="text-gray-900">
              {email}
            </AdaptiveParagraph>
          </div>

          <AdaptiveParagraph className="text-center text-gray-700 mb-6">
            Choose a recovery method:
          </AdaptiveParagraph>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">
            {/* QR CODE METHOD */}
            <div
              className="card-base text-center cursor-pointer hover:shadow-lg transform hover:scale-105"
              onClick={handleQRFlow}
            >
              <div className="text-5xl mb-4">📱</div>
              <AdaptiveHeading level={3} className="text-gray-900 mb-2">
                QR Code Scan
              </AdaptiveHeading>
              <AdaptiveParagraph className="text-gray-600 mb-4">
                Scan a QR code sent to your email to verify
              </AdaptiveParagraph>
              <AdaptiveButton className="w-full">Use QR Code</AdaptiveButton>
            </div>

            {/* TAP YES METHOD */}
            <div
              className="card-base text-center cursor-pointer hover:shadow-lg transform hover:scale-105"
              onClick={handleTapYesFlow}
            >
              <div className="text-5xl mb-4">👆</div>
              <AdaptiveHeading level={3} className="text-gray-900 mb-2">
                Tap Yes
              </AdaptiveHeading>
              <AdaptiveParagraph className="text-gray-600 mb-4">
                Approve the recovery request with a tap
              </AdaptiveParagraph>
              <AdaptiveButton className="w-full bg-green-600 hover:bg-green-700">
                Use Tap Yes
              </AdaptiveButton>
            </div>
          </div>

          <div className="text-center">
            <AdaptiveButton
              onClick={() => setStepId("enter_email")}
              className="bg-gray-400 hover:bg-gray-500"
            >
              Back
            </AdaptiveButton>
          </div>
        </div>
      )}

      {/* === QR SCAN FLOW === */}
      {stepId === "qr_scan" && (
        <div className="card-base max-w-md mx-auto text-center space-y-6 py-12">
          <div>
            <div className="bg-gray-200 w-48 h-48 mx-auto rounded-lg flex items-center justify-center mb-6 border-2 border-dashed border-gray-400">
              <div className="text-6xl">📦</div>
            </div>
            <p className="text-gray-900 font-bold text-lg mb-2">
              Ready to Scan
            </p>
            <p className="text-gray-600 mb-6">
              Point your camera at the QR code sent to your email
            </p>
          </div>
          <AdaptiveButton
            onClick={simulateQRScan}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Simulate QR Scan
          </AdaptiveButton>
          <AdaptiveButton
            onClick={() => setStepId("select_method")}
            className="w-full bg-gray-400 hover:bg-gray-500"
          >
            Back
          </AdaptiveButton>
        </div>
      )}

      {/* === QR VERIFIED === */}
      {stepId === "qr_verified" && (
        <div className="card-base max-w-md mx-auto text-center py-12">
          <div className="inline-block">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          </div>
          <p className="text-gray-600 font-medium">Verifying QR code...</p>
        </div>
      )}

      {/* === WAITING FOR APPROVAL (TAP YES FLOW) === */}
      {stepId === "waiting_approval" && (
        <div className="card-base max-w-md mx-auto text-center space-y-6 py-12">
          <div className="text-5xl mb-4">⏳</div>
          <p className="text-gray-900 font-bold text-lg">
            Waiting for Approval
          </p>
          <p className="text-gray-600">
            A recovery request has been sent to your registered devices
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Tap "Yes" on your phone or other device to approve
          </p>

          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-blue-800">
              💡 In a real scenario, you would approve this on your mobile
              device. For now, click the button below to simulate approval.
            </p>
          </div>

          <AdaptiveButton
            onClick={simulateTapYes}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Simulate "Tap Yes" Approval
          </AdaptiveButton>
          <AdaptiveButton
            onClick={() => setStepId("select_method")}
            className="w-full bg-gray-400 hover:bg-gray-500"
          >
            Back
          </AdaptiveButton>
        </div>
      )}

      {/* === TAP YES VERIFIED === */}
      {stepId === "tap_yes_verified" && (
        <div className="card-base max-w-md mx-auto text-center py-12">
          <div className="text-5xl mb-4">✅</div>
          <p className="text-gray-600 font-medium">Approval confirmed!</p>
          <p className="text-gray-600 text-sm mt-2">
            Proceeding to password reset...
          </p>
        </div>
      )}

      {/* === RESET PASSWORD === */}
      {stepId === "reset_password" && verified && (
        <form
          onSubmit={handlePasswordReset}
          className="card-base max-w-md mx-auto space-y-6"
        >
          <h2 className="text-xl font-bold text-gray-900">Set New Password</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <AdaptiveInput
              type="password"
              placeholder="Enter new password"
              required
              minLength="6"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <AdaptiveInput
              type="password"
              placeholder="Confirm your password"
              required
              minLength="6"
            />
          </div>

          <AdaptiveButton
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Reset Password
          </AdaptiveButton>
        </form>
      )}

      {/* === SUCCESS === */}
      {stepId === "success" && (
        <div className="card-base max-w-md mx-auto text-center py-12">
          <div className="text-6xl mb-4">🎉</div>
          <p className="text-gray-900 font-bold text-2xl mb-2">
            Recovery Successful!
          </p>
          <p className="text-gray-600 mb-2">Your password has been reset</p>
          <p className="text-sm text-gray-500">Redirecting to login...</p>
        </div>
      )}
    </div>
  );
}
