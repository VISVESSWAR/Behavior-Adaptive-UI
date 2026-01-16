import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useMouseTracker from "../hooks/useMouseTracker";
import useIdleTimer from "../hooks/useIdleTimer";
import useScrollDepth from "../hooks/useScrollDepth";
import { logEvent } from "../logging/eventLogger";

function fmt(v, d = 2) {
  return typeof v === "number" ? v.toFixed(d) : "0.00";
}

export default function Dashboard() {
  const flowId = "dashboard";
  const [stepId, setStepId] = useState("view_metrics");
  const [activeTab, setActiveTab] = useState("overview");

  const metrics = useMouseTracker(flowId, stepId);
  const idleTime = useIdleTimer(flowId, stepId);
  const scrollDepth = useScrollDepth(flowId, stepId);

  useEffect(() => {
    logEvent({
      type: "step_enter",
      flowId,
      stepId,
      tab: activeTab,
    });
  }, [stepId, activeTab]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Analytics Dashboard
        </h1>
        <p className="text-gray-600">
          Real-time behavioral metrics and user analytics
        </p>
      </div>

      {/* === TAB NAVIGATION === */}
      <div className="flex gap-2 mb-8 border-b border-gray-200">
        {["overview", "metrics", "session"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`adaptive-element px-6 py-3 font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? "text-blue-600 border-blue-600"
                : "text-gray-600 border-transparent hover:text-gray-900"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* === OVERVIEW TAB === */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              label: "Total Clicks",
              value: metrics.s_num_clicks || 0,
              icon: "🖱️",
            },
            {
              label: "Session Duration",
              value: `${fmt(metrics.s_session_duration)}s`,
              icon: "⏱️",
            },
            {
              label: "Mouse Distance",
              value: fmt(metrics.s_total_distance),
              icon: "📍",
            },
            { label: "Idle Time", value: `${fmt(idleTime)}s`, icon: "😴" },
            {
              label: "Velocity Mean",
              value: fmt(metrics.s_vel_mean),
              icon: "🚀",
            },
            {
              label: "Misclicks",
              value: metrics.s_num_misclicks || 0,
              icon: "❌",
            },
            {
              label: "Scroll Depth",
              value: `${fmt(scrollDepth * 100, 1)}%`,
              icon: "📜",
            },
            { label: "Actions", value: metrics.s_num_actions || 0, icon: "✋" },
          ].map((item, idx) => (
            <div key={idx} className="card-base">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    {item.label}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {item.value}
                  </p>
                </div>
                <span className="text-4xl">{item.icon}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* === METRICS TAB === */}
      {activeTab === "metrics" && (
        <div className="card-base mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Detailed Metrics
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <span className="text-gray-700 font-medium">
                Mouse Velocity (Mean)
              </span>
              <span className="text-lg font-semibold text-blue-600">
                {fmt(metrics.s_vel_mean)} px/ms
              </span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <span className="text-gray-700 font-medium">
                Mouse Velocity (Max)
              </span>
              <span className="text-lg font-semibold text-blue-600">
                {fmt(metrics.s_vel_max)} px/ms
              </span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <span className="text-gray-700 font-medium">
                Total Distance Traveled
              </span>
              <span className="text-lg font-semibold text-blue-600">
                {fmt(metrics.s_total_distance)} px
              </span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <span className="text-gray-700 font-medium">Total Actions</span>
              <span className="text-lg font-semibold text-blue-600">
                {metrics.s_num_actions || 0}
              </span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <span className="text-gray-700 font-medium">Total Clicks</span>
              <span className="text-lg font-semibold text-blue-600">
                {metrics.s_num_clicks || 0}
              </span>
            </div>
            <div className="flex justify-between items-center pb-4">
              <span className="text-gray-700 font-medium">Misclicks</span>
              <span className="text-lg font-semibold text-red-600">
                {metrics.s_num_misclicks || 0}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* === SESSION TAB === */}
      {activeTab === "session" && (
        <div className="card-base mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Session Information
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <span className="text-gray-700 font-medium">
                Session Duration
              </span>
              <span className="text-lg font-semibold text-blue-600">
                {fmt(metrics.s_session_duration)}s
              </span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <span className="text-gray-700 font-medium">Idle Time</span>
              <span className="text-lg font-semibold text-blue-600">
                {fmt(idleTime)}s
              </span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <span className="text-gray-700 font-medium">Active Time</span>
              <span className="text-lg font-semibold text-green-600">
                {fmt(metrics.s_session_duration - idleTime)}s
              </span>
            </div>
            <div className="flex justify-between items-center pb-4">
              <span className="text-gray-700 font-medium">
                Page Scroll Depth
              </span>
              <span className="text-lg font-semibold text-blue-600">
                {fmt(scrollDepth * 100, 1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* === ACTION BUTTONS === */}
      <div className="flex gap-4 flex-wrap">
        <Link
          to="/login"
          className="adaptive-element inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm hover:shadow-md"
        >
          Go to Login
        </Link>
        <Link
          to="/transaction"
          className="adaptive-element inline-block px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 shadow-sm hover:shadow-md"
        >
          New Transaction
        </Link>
        <Link
          to="/"
          className="adaptive-element inline-block px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 shadow-sm hover:shadow-md"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
