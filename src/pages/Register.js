import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import AdaptiveButton from "../components/AdaptiveButton";
import AdaptiveInput from "../components/AdaptiveInput";
import useMouseTracker from "../hooks/useMouseTracker";
import useIdleTimer from "../hooks/useIdleTimer";
import useScrollDepth from "../hooks/useScrollDepth";
import { logEvent } from "../logging/eventLogger";

export default function Register() {
  const flowId = "register";
  const navigate = useNavigate();
  const [stepId, setStepId] = useState("enter_email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  useMouseTracker(flowId, stepId);
  useIdleTimer(flowId, stepId);
  useScrollDepth(flowId, stepId);

  useEffect(() => {
    logEvent({ type: "step_enter", flowId, stepId });
  }, [stepId]);

  const handleRegister = () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setStepId("registering");
    logEvent({
      type: "registration_attempt",
      flowId,
      email,
      success: true,
    });
    setTimeout(() => {
      setStepId("success");
      setTimeout(() => navigate("/login"), 2000);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="card-base text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Account
          </h1>
          <p className="text-gray-600">Join us today</p>
        </div>

        {stepId === "enter_email" && (
          <div className="card-base space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <AdaptiveInput
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && setStepId("set_password")
                }
              />
            </div>
            <AdaptiveButton
              onClick={() => setStepId("set_password")}
              className="w-full"
            >
              Continue
            </AdaptiveButton>
            <p className="text-center text-gray-600 text-sm">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        )}

        {stepId === "set_password" && (
          <div className="card-base space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <AdaptiveInput
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <AdaptiveInput
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleRegister()}
              />
              {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
            </div>
            <div className="flex gap-3">
              <AdaptiveButton
                onClick={() => setStepId("enter_email")}
                className="flex-1 bg-gray-400 hover:bg-gray-500"
              >
                Back
              </AdaptiveButton>
              <AdaptiveButton onClick={handleRegister} className="flex-1">
                Register
              </AdaptiveButton>
            </div>
          </div>
        )}

        {stepId === "registering" && (
          <div className="card-base text-center py-12">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            </div>
            <p className="text-gray-600 font-medium">
              Creating your account...
            </p>
          </div>
        )}

        {stepId === "success" && (
          <div className="card-base text-center py-12">
            <div className="text-5xl mb-4">✅</div>
            <p className="text-gray-900 font-bold text-lg mb-2">
              Account Created!
            </p>
            <p className="text-gray-600">Redirecting to login...</p>
          </div>
        )}
      </div>
    </div>
  );
}
