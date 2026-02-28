import React, { useState, useEffect } from "react";
import { getExperimentMode, setExperimentMode } from "../utils/dqnAdapter.jsx";

/**
 * ExperimentModeControl Component
 * 
 * Provides UI control for switching between experiment modes:
 * - "model": Pure exploitation (use DQN action)
 * - "guided": Balanced exploration (25% model, 55% random, 20% anti)
 * - "random": Pure exploration (ignore model, use random)
 */
export default function ExperimentModeControl() {
  const [currentMode, setCurrentMode] = useState(() => getExperimentMode());

  const handleModeChange = (newMode) => {
    const success = setExperimentMode(newMode);
    if (success) {
      setCurrentMode(newMode);
    }
  };

  const modes = [
    { value: "model", label: "Model", description: "Pure Exploitation" },
    { value: "guided", label: "Guided", description: "Balanced (25/55/20)" },
    { value: "random", label: "Random", description: "Pure Exploration" },
  ];

  return (
    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-gray-800">RL Experiment Mode</h3>
        <p className="text-xs text-gray-600 mt-1">Currently: <span className="font-semibold text-blue-700">{currentMode.toUpperCase()}</span></p>
      </div>

      <div className="flex gap-2">
        {modes.map((mode) => (
          <button
            key={mode.value}
            onClick={() => handleModeChange(mode.value)}
            className={`px-3 py-2 rounded text-sm font-medium transition-all ${
              currentMode === mode.value
                ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-400"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
            title={mode.description}
          >
            {mode.label}
          </button>
        ))}
      </div>

      <div className="mt-3 text-xs text-gray-700 space-y-1">
        <p><span className="font-semibold">Model:</span> Use DQN actions only</p>
        <p><span className="font-semibold">Guided:</span> Mix of model, random & anti-model</p>
        <p><span className="font-semibold">Random:</span> Random actions only</p>
      </div>
    </div>
  );
}
