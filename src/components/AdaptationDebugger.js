/**
 * Debug component to visualize UI adaptation in real-time
 * Shows persona detection, metrics, and applied UI changes
 */

import { useUIConfig } from "../adaptation/UIContext";

export function AdaptationDebugger() {
  const { persona, uiConfig } = useUIConfig();

  if (!persona) return null;

  const m = persona.metrics;

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white text-xs p-3 rounded-lg max-w-sm z-40 font-mono">
      <div className="font-bold mb-2">Adaptation Status</div>

      {/* Persona Info */}
      <div className="mb-2 border-b border-gray-500 pb-2">
        <div>
          Persona: <span className="font-bold">{persona.persona}</span>
        </div>
        <div>Stable: {persona.stable ? "Yes" : "No"}</div>
        <div>Confidence: {(persona.confidence * 100).toFixed(0)}%</div>
      </div>

      {/* Metrics (RL Input) */}
      {m && (
        <div className="mb-2 border-b border-gray-500 pb-2 text-xs">
          <div className="font-semibold mb-1">Behavior Metrics:</div>
          <div>
            Velocity: {(m.vel_mean * 100).toFixed(0)}%
            {m.vel_mean < 0.3 && " [Slow]"}
          </div>
          <div>
            Idle Time: {(m.idle * 100).toFixed(0)}%{m.idle > 0.5 && " [High]"}
          </div>
          <div>
            Hesitation: {(m.hesitation * 100).toFixed(0)}%
            {m.hesitation > 0.5 && " [High]"}
          </div>
          <div>
            Misclicks: {(m.misclicks * 100).toFixed(0)}%
            {m.misclicks > 0.4 && " [High]"}
          </div>
        </div>
      )}

      {/* UI Config State */}
      <div className="text-xs">
        <div className="font-semibold mb-1">UI Config:</div>
        <div>Button Size: {uiConfig.buttonSize}</div>
        <div>Text Size: {uiConfig.textSize}</div>
        <div>Spacing: {uiConfig.spacing}</div>
        <div>Font Weight: {uiConfig.fontWeight}</div>
        <div>Tooltips: {uiConfig.tooltips ? "On" : "Off"}</div>
      </div>

      <div className="text-xs mt-2 text-gray-400">
        RL-based UI adaptation active
      </div>
    </div>
  );
}
