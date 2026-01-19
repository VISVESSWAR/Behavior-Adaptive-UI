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

export default function Login() {
  const flowId = "login";
  const navigate = useNavigate();
  const [stepId, setStepId] = useState("enter_username");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useMouseTracker(flowId, stepId);
  useIdleTimer(flowId, stepId);
  useScrollDepth(flowId, stepId);

  useEffect(() => {
    logEvent({
      type: "step_enter",
      flowId,
      stepId,
    });
  }, [stepId]);

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    setStepId("authenticating");
    logEvent({
      type: "login_attempt",
      flowId,
      username,
      success: true,
    });
    setTimeout(() => {
      navigate("/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="card-base text-center mb-8">
          <AdaptiveHeading level={1} className="text-gray-900 mb-2">
            Welcome Back
          </AdaptiveHeading>
          <AdaptiveParagraph className="text-gray-600">
            Sign in to your account
          </AdaptiveParagraph>
        </div>

        {stepId === "enter_username" && (
          <div className="card-base space-y-6">
            <div>
              <AdaptiveLabel className="block text-gray-700 mb-2">
                Username
              </AdaptiveLabel>
              <AdaptiveInput
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && setStepId("enter_password")
                }
              />
            </div>
            <AdaptiveButton
              onClick={() => setStepId("enter_password")}
              className="w-full"
            >
              Continue
            </AdaptiveButton>
            <AdaptiveParagraph className="text-center text-gray-600">
              Don't have an account?{" "}
              <AdaptiveLink
                as={Link}
                to="/register"
                className="text-blue-600 hover:text-blue-700"
              >
                Register here
              </AdaptiveLink>
            </AdaptiveParagraph>
          </div>
        )}

        {stepId === "enter_password" && (
          <div className="card-base space-y-6">
            <div>
              <AdaptiveLabel className="block text-gray-700 mb-2">
                Password
              </AdaptiveLabel>
              <AdaptiveInput
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
              />
              {error && (
                <AdaptiveParagraph className="text-red-600 mt-2">
                  {error}
                </AdaptiveParagraph>
              )}
            </div>
            <div className="flex gap-3">
              <AdaptiveButton
                onClick={() => setStepId("enter_username")}
                className="flex-1 bg-gray-400 hover:bg-gray-500"
              >
                Back
              </AdaptiveButton>
              <AdaptiveButton onClick={handleLogin} className="flex-1">
                Login
              </AdaptiveButton>
            </div>
            <AdaptiveParagraph className="text-center text-gray-600">
              <AdaptiveLink
                as={Link}
                to="/recovery"
                className="text-blue-600 hover:text-blue-700"
              >
                Forgot password?
              </AdaptiveLink>
            </AdaptiveParagraph>
          </div>
        )}

        {stepId === "authenticating" && (
          <div className="card-base text-center py-12">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            </div>
            <AdaptiveParagraph className="text-gray-600">
              Authenticating...
            </AdaptiveParagraph>
            <AdaptiveParagraph className="text-gray-500 mt-2">
              Redirecting to dashboard
            </AdaptiveParagraph>
          </div>
        )}
      </div>
    </div>
  );
}
