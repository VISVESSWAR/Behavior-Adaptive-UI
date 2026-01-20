import { Link } from "react-router-dom";
import useMouseTracker from "../hooks/useMouseTracker";
import useIdleTimer from "../hooks/useIdleTimer";
import useScrollDepth from "../hooks/useScrollDepth";
import { useEffect } from "react";
import { logEvent } from "../logging/eventLogger";
import {
  AdaptiveHeading,
  AdaptiveParagraph,
  AdaptiveLink,
} from "../components/AdaptiveText";

export default function HomePage() {
  const flowId = "home";
  const stepId = "landing";

  useMouseTracker(flowId, stepId);
  useIdleTimer(flowId, stepId);
  useScrollDepth(flowId, stepId);

  useEffect(() => {
    logEvent({
      type: "page_view",
      flowId,
      stepId,
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* === HERO SECTION === */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-16">
          <AdaptiveHeading level={1} className="text-gray-900 mb-4">
            Adaptive UI System
          </AdaptiveHeading>
          <AdaptiveParagraph className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Experience a user interface that adapts to your behavior. Our system
            learns and adjusts UI elements based on how you interact, providing
            the perfect experience for every user type.
          </AdaptiveParagraph>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <AdaptiveLink
              as={Link}
              to="/login"
              className="adaptive-element inline-block px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Get Started
            </AdaptiveLink>
            <AdaptiveLink
              as={Link}
              to="/dashboard"
              className="adaptive-element inline-block px-8 py-4 bg-white text-blue-600 rounded-lg border-2 border-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              View Dashboard
            </AdaptiveLink>
          </div>
        </div>
      </section>

      {/* === FEATURES SECTION === */}
      <section className="bg-white py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AdaptiveHeading
            level={2}
            className="text-gray-900 text-center mb-12"
          >
            Key Features
          </AdaptiveHeading>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Smart Adaptation",
                description:
                  "UI elements adapt in real-time based on user behavior patterns and interaction styles",
              },
              {
                title: "Behavior Analytics",
                description:
                  "Comprehensive tracking of mouse movements, clicks, scroll depth, and idle time",
              },
              {
                title: "Persona Recognition",
                description:
                  "Automatically detects user type (novice, intermediate, expert) for optimal UX",
              },
              {
                title: "Responsive Design",
                description:
                  "Seamless experience across all devices with Tailwind CSS styling",
              },
              {
                title: "Secure & Fast",
                description:
                  "Built with modern React best practices and optimized performance",
              },
              {
                title: "Real-time Updates",
                description:
                  "Live metrics tracking with instant feedback and adaptive adjustments",
              },
            ].map((feature, idx) => (
              <div key={idx} className="card-base">
                <AdaptiveHeading level={3} className="text-gray-900 mb-2">
                  {feature.title}
                </AdaptiveHeading>
                <AdaptiveParagraph className="text-gray-600">
                  {feature.description}
                </AdaptiveParagraph>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === FLOWS SECTION === */}
      <section className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AdaptiveHeading
            level={2}
            className="text-gray-900 text-center mb-12"
          >
            Available Flows
          </AdaptiveHeading>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { name: "Home", path: "/", color: "blue" },
              { name: "Login", path: "/login", color: "purple" },
              {
                name: "Register",
                path: "/register",
                color: "green",
              },
              {
                name: "Transaction",
                path: "/transaction",
                color: "amber",
              },
              { name: "Recovery", path: "/recovery", color: "red" },
            ].map((flow, idx) => (
              <AdaptiveLink
                key={idx}
                as={Link}
                to={flow.path}
                className="card-base text-center hover:border-gray-400 hover:border-2 transform hover:scale-105"
              >
                <AdaptiveHeading level={3} className="text-gray-900">
                  {flow.name}
                </AdaptiveHeading>
              </AdaptiveLink>
            ))}
          </div>
        </div>
      </section>

      {/* === HOW IT WORKS === */}
      <section className="bg-white py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AdaptiveHeading
            level={2}
            className="text-gray-900 text-center mb-12"
          >
            How It Works
          </AdaptiveHeading>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                title: "Track Behavior",
                description:
                  "System monitors your interactions - clicks, mouse movements, scrolling, and idle time",
              },
              {
                step: "2",
                title: "Analyze Metrics",
                description:
                  "Data is collected and analyzed to understand your interaction patterns",
              },
              {
                step: "3",
                title: "Detect Persona",
                description:
                  "Algorithm identifies whether you're a novice, intermediate, or expert user",
              },
              {
                step: "4",
                title: "Adapt UI",
                description:
                  "Interface automatically adjusts button sizes, text, spacing, and visual cues",
              },
            ].map((item, idx) => (
              <div key={idx} className="card-base">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg mb-4">
                  {item.step}
                </div>
                <AdaptiveHeading level={3} className="text-gray-900 mb-2">
                  {item.title}
                </AdaptiveHeading>
                <AdaptiveParagraph className="text-gray-600">
                  {item.description}
                </AdaptiveParagraph>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === CTA SECTION === */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="card-base text-center">
          <AdaptiveHeading level={2} className="text-gray-900 mb-4">
            Ready to Experience Adaptive UI?
          </AdaptiveHeading>
          <AdaptiveParagraph className="text-gray-600 mb-8">
            Start exploring our system and see how it adapts to your needs
          </AdaptiveParagraph>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <AdaptiveLink
              as={Link}
              to="/login"
              className="adaptive-element inline-block px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg hover:shadow-xl"
            >
              Sign In
            </AdaptiveLink>
            <AdaptiveLink
              as={Link}
              to="/register"
              className="adaptive-element inline-block px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-lg hover:shadow-xl"
            >
              Create Account
            </AdaptiveLink>
            <AdaptiveLink
              as={Link}
              to="/dashboard"
              className="adaptive-element inline-block px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg hover:shadow-xl"
            >
              View Analytics
            </AdaptiveLink>
          </div>
        </div>
      </section>

      {/* === FOOTER === */}
      <footer className="bg-gray-900 text-gray-300 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>
            © 2026 Adaptive UI System. Building smarter user experiences through
            behavior analytics.
          </p>
        </div>
      </footer>
    </div>
  );
}
