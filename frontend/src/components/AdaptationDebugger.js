/**
 * Debug component to visualize UI adaptation in real-time
 * Shows persona detection, metrics, applied UI changes, and DQN predictions
 * Includes human-in-the-loop feedback (Like/Dislike buttons)
 */

import { useState } from "react";
import { logEvent } from "../logging/eventLogger";
import { useUIConfig } from "../adaptation/UIContext";
import { ACTION_SPACE } from "../adaptation/actionSpace";

export function AdaptationDebugger() {
  const { persona, uiConfig, dqnAction, dqnLoading } = useUIConfig();
  const [lastFeedback, setLastFeedback] = useState(null); // Track most recent feedback for UI feedback
  const [feedbackCount, setFeedbackCount] = useState({ like: 0, dislike: 0 });
  const [isVisible, setIsVisible] = useState(true); // Toggle debugger visibility

  //  Get decision source tracking
  const decisionInfo = window.__metricsCollector?.lastDecisionInfo;

  // Debug: log persona status
  console.log("[AdaptationDebugger] Persona:", persona, "DQN Action:", dqnAction);

  /**
   * Handle Like feedback
   * Logs user_feedback event with value +1
   * Attached to next transition during snapshot collection
   */
  const handleLike = () => {
    logEvent({
      type: "user_feedback",
      value: +1,
      timestamp: Date.now(),
    });
    setLastFeedback("like");
    setFeedbackCount((prev) => ({ ...prev, like: prev.like + 1 }));
    
    // Notify collector of feedback (global reference)
    if (window.__metricsCollector) {
      window.__metricsCollector.setLatestFeedback(+1);
      console.log("[AdaptationDebugger] 👍 Like feedback recorded");
    }
    
    // Reset after 1 second
    setTimeout(() => setLastFeedback(null), 1000);
  };

  /**
   * Handle Dislike feedback
   * Logs user_feedback event with value -1
   * Attached to next transition during snapshot collection
   */
  const handleDislike = () => {
    logEvent({
      type: "user_feedback",
      value: -1,
      timestamp: Date.now(),
    });
    setLastFeedback("dislike");
    setFeedbackCount((prev) => ({ ...prev, dislike: prev.dislike + 1 }));
    
    // Notify collector of feedback (global reference)
    if (window.__metricsCollector) {
      window.__metricsCollector.setLatestFeedback(-1);
      console.log("[AdaptationDebugger] 👎 Dislike feedback recorded");
    }
    
    // Reset after 1 second
    setTimeout(() => setLastFeedback(null), 1000);
  };

  if (!persona) {
    return (
      <>
        {isVisible && (
          <div className="fixed bottom-4 right-4 bg-red-900 bg-opacity-75 text-white text-xs p-3 rounded-lg max-w-sm z-40 font-mono">
            <div className="font-bold mb-2">⚠️ Waiting for Persona Detection...</div>
            <div>Persona is loading. Please interact with the page.</div>
          </div>
        )}
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="fixed bottom-4 right-4 bg-gray-800 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-700 z-50 font-bold text-sm"
          title={isVisible ? "Hide debugger" : "Show debugger"}
          style={{ bottom: isVisible ? "360px" : "16px" }}
        >
          {isVisible ? "✕" : "🔍"}
        </button>
      </>
    );
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-700 z-50 font-bold text-sm"
        title="Show debugger"
      >
        🔍
      </button>
    );
  }

  const m = persona.metrics;
  const modelActionName = dqnAction >= 0 && dqnAction <= 9 ? Object.values(ACTION_SPACE)[dqnAction] : "none";
  const finalActionName = decisionInfo?.finalAction >= 0 && decisionInfo?.finalAction <= 9 
    ? Object.values(ACTION_SPACE)[decisionInfo.finalAction] 
    : "none";
  // Use model action for display if decision info not available yet
  const actionName = decisionInfo?.finalAction !== undefined ? finalActionName : modelActionName;

  return (
    <>
      <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white text-xs p-3 rounded-lg max-w-sm z-40 font-mono">
        <div className="flex justify-between items-center mb-2">
          <div className="font-bold">🔄 Adaptation Status</div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-white hover:text-gray-300 font-bold ml-2 cursor-pointer"
            title="Hide debugger"
          >
            ✕
          </button>
        </div>

        {/* Persona Info */}
        <div className="mb-2 border-b border-gray-500 pb-2">
          <div>
            Persona: <span className="font-bold">{persona.persona || persona.type}</span>
          </div>
          <div> Stable: {persona.stable ? "Yes ✅" : "No ⏳"}</div>
          <div> Confidence: {(persona.confidence * 100).toFixed(0)}%</div>
        </div>

        {/* DQN Status */}
        <div className="mb-2 border-b border-gray-500 pb-2">
          <div className="font-semibold mb-1"> DQN Model:</div>
          <div>
            Status: {dqnLoading ? " Predicting..." : " Ready"}
          </div>
          <div>
            Model Action: {dqnAction >= 0 ? (
              <span className="text-blue-300">{dqnAction} ({modelActionName})</span>
            ) : (
              <span className="text-yellow-300">Using rules</span>
            )}
          </div>
          {decisionInfo && (
            <div className="mt-2 pt-2 border-t border-gray-600">
              <div className="font-semibold text-green-300 mb-1">
                 Final Action: <span className="text-yellow-300">{decisionInfo.finalAction} ({finalActionName})</span>
              </div>
              <div className="text-cyan-300 text-xs font-semibold">
                 Policy Mix → M:{decisionInfo.modelProb.toFixed(1)} R:{decisionInfo.randomProb.toFixed(1)} A:{decisionInfo.antiProb.toFixed(1)}
              </div>
              <div className="text-xs mt-1">
                Source:{" "}
                <span className="font-bold text-yellow-300">
                  {decisionInfo.source === "model" && "🎯 MODEL (Exploit)"}
                  {decisionInfo.source === "explore" && "🎲 RANDOM (Explore)"}
                  {decisionInfo.source === "idle" && "😴 IDLE (Paused)"}
                  {decisionInfo.source === "fallback" && "⚠️ FALLBACK"}
                  {decisionInfo.source === "error" && "❌ ERROR"}
                  {!['model', 'explore', 'idle', 'fallback', 'error'].includes(decisionInfo.source) && decisionInfo.source}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Metrics (RL Input) */}
        {m && (
          <div className="mb-2 border-b border-gray-500 pb-2 text-xs">
            <div className="font-semibold mb-1">📊 Behavior Metrics:</div>
            <div>
               Velocity: {(m.vel_mean * 100).toFixed(0)}%
              {m.vel_mean < 0.3 && " ⚠️ Slow"}
            </div>
            <div>
               Idle Time: {(m.idle * 100).toFixed(0)}%
              {m.idle > 0.3 && " ⚠️ High"}
            </div>
            <div>
              Hesitation: {(m.hesitation * 100).toFixed(0)}%
              {m.hesitation > 0.5 && " ⚠️ High"}
            </div>
            <div>
               Misclicks: {(m.misclicks * 100).toFixed(0)}%
              {m.misclicks > 0.4 && " ⚠️ High"}
            </div>
          </div>
        )}

        {/* UI Config State */}
        <div className="text-xs">
          <div className="font-semibold mb-1"> UI Config:</div>
          <div> Button Size: {uiConfig.buttonSize}</div>
          <div> Text Size: {uiConfig.textSize}</div>
          <div> Spacing: {uiConfig.spacing}</div>
          <div> Font Weight: {uiConfig.fontWeight}</div>
          <div> Tooltips: {uiConfig.tooltips ? "On ✅" : "Off ❌"}</div>
        </div>

        <div className="text-xs mt-2 text-gray-400">
           DQN + Rule-based adaptation active
        </div>

        {/* Human-in-the-Loop Feedback */}
        <div className="mt-3 border-t border-gray-500 pt-2">
          <div className="font-semibold mb-2 text-xs">💬 Feedback:</div>
          <div className="flex gap-2 justify-center">
            <button
              onClick={handleLike}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                lastFeedback === "like"
                  ? "bg-green-500 text-black scale-110"
                  : "bg-gray-700 hover:bg-green-600 text-white"
              }`}
              title="Click to rate the current adaptation as good"
            >
              👍 Like ({feedbackCount.like})
            </button>
            <button
              onClick={handleDislike}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                lastFeedback === "dislike"
                  ? "bg-red-500 text-black scale-110"
                  : "bg-gray-700 hover:bg-red-600 text-white"
              }`}
              title="Click to rate the current adaptation as bad"
            >
              👎 Dislike ({feedbackCount.dislike})
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-1 text-center">
            Attached to next transition for RL training
          </div>
        </div>
      </div>
      
      {/* Toggle button when hidden */}
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-700 z-50 font-bold text-sm"
        style={{ display: isVisible ? "none" : "flex" }}
        title="Show debugger"
      >
        🔍
      </button>
    </>
  );
}

