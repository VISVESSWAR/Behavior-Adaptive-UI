/**
 * Metrics Export & Collection Status Component
 * CORRECTED VERSION: Works with snapshots (not transitions)
 * Builds transitions at export time
 */

import { useState, useEffect } from "react";
import IndexedDBManager from "../utils/indexedDBManager";
import { TransitionBuilder } from "../utils/snapshotSchema";
import {
  AdaptiveHeading,
  AdaptiveParagraph,
  AdaptiveLabel,
} from "./AdaptiveText";
import { AdaptiveButton } from "./AdaptiveButton";

export function MetricsExportPanel() {
  const [stats, setStats] = useState(null);
  const [exportFormat, setExportFormat] = useState("csv"); // csv, json-snapshots, json-transitions
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const dbManager = new IndexedDBManager();
      await dbManager.init();
      const stats = await dbManager.getStats();
      setStats(stats);
    } catch (error) {
      console.error("[MetricsExportPanel] Error loading stats:", error);
    }
  };

  /**
   * Default reward function
   * Customize based on your task/feedback
   */
  const defaultRewardFunction = (s_t, a_t, s_t1) => {
    // Reward for session progress
    const progressReward =
      (s_t1.s_session_duration - s_t.s_session_duration) * 0.1;

    // Bonus for reaching expert persona
    const personaBonus = s_t1.s_persona_expert ? 1.0 : 0.0;

    // Penalty for excessive clicks
    const clickPenalty = s_t1.s_num_clicks > 10 ? -0.5 : 0;

    const totalReward = progressReward + personaBonus + clickPenalty;
    return Math.max(-10, Math.min(10, totalReward)); // Clip to [-10, 10]
  };

  const handleExport = async () => {
    if (!stats || stats.recordCount === 0) {
      setMessage("No data to export");
      return;
    }

    setExporting(true);
    setMessage("Exporting...");

    try {
      const dbManager = new IndexedDBManager();
      await dbManager.init();

      // Get all snapshots
      const allSnapshots = await dbManager.getAll();
      const sortedSnapshots = allSnapshots.sort(
        (a, b) => (a.timestamp || 0) - (b.timestamp || 0),
      );

      let data;
      let filename;
      let fileType;

      if (exportFormat === "csv") {
        // Build transitions from snapshots and export as CSV
        const transitions = TransitionBuilder.buildTransitions(
          sortedSnapshots,
          defaultRewardFunction,
        );
        data = TransitionBuilder.toCSV(transitions);
        filename = `dqn_ui_dataset_${Date.now()}.csv`;
        fileType = "text/csv";
        setMessage(
          `Exported ${sortedSnapshots.length} snapshots as ${transitions.length} transitions (CSV)`,
        );
      } else if (exportFormat === "json-snapshots") {
        // Export raw snapshots
        const json = {
          metadata: {
            snapshotCount: sortedSnapshots.length,
            exportedAt: new Date().toISOString(),
          },
          snapshots: sortedSnapshots,
        };
        data = JSON.stringify(json, null, 2);
        filename = `dqn_ui_snapshots_${Date.now()}.json`;
        fileType = "application/json";
        setMessage(`Exported ${sortedSnapshots.length} snapshots as JSON`);
      } else if (exportFormat === "json-transitions") {
        // Export transitions as JSON
        const transitions = TransitionBuilder.buildTransitions(
          sortedSnapshots,
          defaultRewardFunction,
        );
        const json = {
          metadata: {
            snapshotCount: sortedSnapshots.length,
            transitionCount: transitions.length,
            exportedAt: new Date().toISOString(),
          },
          transitions: transitions,
        };
        data = JSON.stringify(json, null, 2);
        filename = `dqn_ui_transitions_${Date.now()}.json`;
        fileType = "application/json";
        setMessage(`Exported ${transitions.length} transitions as JSON`);
      }

      // Trigger download
      const blob = new Blob([data], { type: fileType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("[MetricsExportPanel] Export error:", error);
      setMessage("Export failed: " + error.message);
    } finally {
      setExporting(false);
    }
  };

  const handleValidate = async () => {
    if (!stats || stats.recordCount === 0) {
      setMessage("No data to validate");
      return;
    }

    try {
      const dbManager = new IndexedDBManager();
      await dbManager.init();

      const allSnapshots = await dbManager.getAll();
      const sortedSnapshots = allSnapshots.sort(
        (a, b) => (a.timestamp || 0) - (b.timestamp || 0),
      );

      const transitions = TransitionBuilder.buildTransitions(
        sortedSnapshots,
        defaultRewardFunction,
      );

      const validation = TransitionBuilder.validate(transitions);

      if (validation.valid) {
        setMessage(
          `Validation passed! ${transitions.length} transitions ready for DQN training.`,
        );
      } else {
        setMessage(`Validation errors: ${validation.errors.join("; ")}`);
      }
    } catch (error) {
      console.error("[MetricsExportPanel] Validation error:", error);
      setMessage("Validation failed: " + error.message);
    }
  };

  const handleClear = async () => {
    if (!window.confirm("Clear all collected data? This cannot be undone.")) {
      return;
    }

    try {
      const dbManager = new IndexedDBManager();
      await dbManager.init();
      await dbManager.clear();
      setMessage("Data cleared");
      setStats(null);
      await loadStats();
    } catch (error) {
      console.error("[MetricsExportPanel] Clear error:", error);
      setMessage("Clear failed");
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (!stats) {
    return (
      <div className="card-base">
        <AdaptiveHeading level={3} className="text-gray-900 mb-4">
          Metrics Export
        </AdaptiveHeading>
        <AdaptiveParagraph className="text-gray-600">
          Loading statistics...
        </AdaptiveParagraph>
      </div>
    );
  }

  return (
    <div className="card-base">
      <AdaptiveHeading level={3} className="text-gray-900 mb-6">
        DQN Training Data Export (Snapshot-Based)
      </AdaptiveHeading>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <AdaptiveLabel className="text-gray-600 block text-sm">
            Snapshots Collected
          </AdaptiveLabel>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {stats.recordCount || 0}
          </p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <AdaptiveLabel className="text-gray-600 block text-sm">
            Transitions (from pairing)
          </AdaptiveLabel>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {Math.max(0, (stats.recordCount || 1) - 1)}
          </p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <AdaptiveLabel className="text-gray-600 block text-sm">
            Data Size
          </AdaptiveLabel>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {formatBytes(stats.storageSize || 0)}
          </p>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <AdaptiveLabel className="text-gray-600 block text-sm">
            Last Updated
          </AdaptiveLabel>
          <p className="text-sm text-orange-600 mt-1">
            {stats.lastUpdated
              ? new Date(stats.lastUpdated).toLocaleString()
              : "Never"}
          </p>
        </div>
      </div>

      {/* Export Format Selection */}
      <div className="mb-6">
        <AdaptiveLabel className="text-gray-700 block mb-3">
          Export Format
        </AdaptiveLabel>
        <div className="flex gap-4 flex-wrap">
          <label className="flex items-center">
            <input
              type="radio"
              value="csv"
              checked={exportFormat === "csv"}
              onChange={(e) => setExportFormat(e.target.value)}
              className="mr-2"
            />
            <span className="text-gray-700">CSV (47-col DQN)</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="json-snapshots"
              checked={exportFormat === "json-snapshots"}
              onChange={(e) => setExportFormat(e.target.value)}
              className="mr-2"
            />
            <span className="text-gray-700">JSON (Snapshots)</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="json-transitions"
              checked={exportFormat === "json-transitions"}
              onChange={(e) => setExportFormat(e.target.value)}
              className="mr-2"
            />
            <span className="text-gray-700">JSON (Transitions)</span>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <AdaptiveButton
          onClick={handleExport}
          disabled={exporting || stats.recordCount === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
        >
          {exporting ? "Exporting..." : "Export Data"}
        </AdaptiveButton>

        <AdaptiveButton
          onClick={handleValidate}
          disabled={stats.recordCount === 0}
          className="bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-400"
        >
          Validate
        </AdaptiveButton>

        <AdaptiveButton
          onClick={handleClear}
          disabled={stats.recordCount === 0}
          className="bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-400"
        >
          Clear All
        </AdaptiveButton>
      </div>

      {/* Message */}
      {message && (
        <div className="bg-blue-100 border border-blue-300 text-blue-700 px-4 py-3 rounded">
          {message}
        </div>
      )}

      {/* Info */}
      <div className="bg-gray-50 p-4 rounded-lg mt-6">
        <AdaptiveLabel className="text-gray-700 block font-semibold mb-2">
          Format Information
        </AdaptiveLabel>
        <AdaptiveParagraph className="text-gray-600 text-sm">
          Snapshot-based collection: Frontend emits snapshots every 10s (metrics
          + persona + action). At export time, consecutive snapshots are paired
          to build DQN transitions (s, a, r, s', done). CSV is DQN-compatible
          (47 columns) and ready for fine-tuning.
        </AdaptiveParagraph>
      </div>
    </div>
  );
}
