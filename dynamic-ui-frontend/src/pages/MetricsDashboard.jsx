import { useState } from "react";
import HelpBar from "../components/HelpBar.jsx";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  parseTransitionCSV,
  getTaskCompletionTimes,
  getRewardTimeSeries,
  getErrorRateByMode,
  getActionFrequency,
  getModePerformance,
  getRewardStats,
} from "../utils/csvParser.jsx";
import { AdaptiveHeading, AdaptiveParagraph } from "../components/AdaptiveText.jsx";

const COLORS = ["#2196f3", "#ff9800", "#4caf50", "#f44336", "#9c27b0", "#00bcd4"];

export default function MetricsDashboard() {
  return (
    <>
      <HelpBar pageId="metrics" />
      <MetricsDashboardContent />
    </>
  );
}

function MetricsDashboardContent() {
  const [csvData, setCsvData] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [stats, setStats] = useState(null);
  const [fileLoaded, setFileLoaded] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState("summary");

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target.result;
      const { rows } = parseTransitionCSV(csvText);

      if (rows.length === 0) {
        alert("No valid data found in CSV");
        return;
      }

      setCsvData(rows);
      setParsedData({
        completionTimes: getTaskCompletionTimes(rows),
        rewardTimeSeries: getRewardTimeSeries(rows),
        errorRates: getErrorRateByMode(rows),
        actionFreq: getActionFrequency(rows),
        modePerf: getModePerformance(rows),
      });

      setStats(getRewardStats(rows));
      setFileLoaded(true);
    };

    reader.readAsText(file);
  };

  if (!fileLoaded) {
    return (
      <div className="page">
        <div className="card" style={{ maxWidth: "600px", margin: "0 auto" }}>
          <AdaptiveHeading level={2}>📊 Metrics Dashboard</AdaptiveHeading>
          <AdaptiveParagraph style={{ marginBottom: "20px" }}>
            Upload your exported CSV transition logs to analyze:
          </AdaptiveParagraph>

          <div
            style={{
              border: "2px dashed #2196f3",
              borderRadius: "8px",
              padding: "30px",
              textAlign: "center",
              backgroundColor: "#f0f7ff",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "15px" }}>📁</div>

            <label
              style={{
                display: "inline-block",
                padding: "12px 24px",
                backgroundColor: "#2196f3",
                color: "white",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Choose CSV File
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
            </label>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">

      {/* HEADER */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <AdaptiveHeading level={2}>📊 Analytics Dashboard</AdaptiveHeading>

          <button
            onClick={() => {
              setCsvData(null);
              setParsedData(null);
              setStats(null);
              setFileLoaded(false);
            }}
            style={{
              padding: "8px 16px",
              backgroundColor: "#f5f5f5",
              border: "1px solid #ddd",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            ← Load Different File
          </button>
        </div>

        {/* Dropdown */}
        <div style={{ marginTop: "20px" }}>
          <label style={{ fontWeight: "bold", marginRight: "10px" }}>
            Select Analysis:
          </label>

          <select
            value={selectedPlot}
            onChange={(e) => setSelectedPlot(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          >
            <option value="summary">Summary Statistics</option>
            <option value="completion">Task Completion Distribution</option>
            <option value="reward">Reward Progression</option>
            <option value="error">Error Rate by Mode</option>
            <option value="action">Action Frequency</option>
            <option value="modePerf">Mode Performance Comparison</option>
          </select>
        </div>
      </div>

      <div className="card">

        {/* SUMMARY */}
        {selectedPlot === "summary" && (
          <>
            <AdaptiveHeading level={3}>Summary Statistics</AdaptiveHeading>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "20px",
                marginTop: "20px",
              }}
            >
              <StatBox label="Total Transitions" value={csvData.length} />
              <StatBox label="Avg Reward" value={stats.mean} />
              <StatBox label="Max Reward" value={stats.max} />
              <StatBox label="Min Reward" value={stats.min} />
              <StatBox label="Median Reward" value={stats.median} />
              <StatBox label="Std Deviation" value={stats.std} />
            </div>
          </>
        )}

        {/* COMPLETION */}
        {selectedPlot === "completion" && (
          <>
            <AdaptiveHeading level={3}>
              Task Completion Time Distribution
            </AdaptiveHeading>

            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={parsedData.completionTimes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timeRange" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#2196f3" />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}

        {/* REWARD */}
        {selectedPlot === "reward" && (
          <>
            <AdaptiveHeading level={3}>
              Reward Progression & Cumulative Reward
            </AdaptiveHeading>

            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={parsedData.rewardTimeSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stepIndex" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="reward" stroke="#ff9800" />
                <Line type="monotone" dataKey="cumulative" stroke="#4caf50" />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}

        {/* ERROR */}
        {selectedPlot === "error" && (
          <>
            <AdaptiveHeading level={3}>
              Error Rate by Experiment Mode
            </AdaptiveHeading>

            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={parsedData.errorRates}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mode" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="errorRate" fill="#f44336" />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}

        {/* ACTION */}
        {selectedPlot === "action" && (
          <>
            <AdaptiveHeading level={3}>
              Action Selection Frequency
            </AdaptiveHeading>

            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={parsedData.actionFreq}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="action" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#9c27b0" />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}

        {/* MODE PERFORMANCE */}
        {selectedPlot === "modePerf" && (
          <>
            <AdaptiveHeading level={3}>
              Experiment Mode Performance
            </AdaptiveHeading>

            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={parsedData.modePerf}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mode" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgReward" fill="#2196f3" />
                <Bar dataKey="successRate" fill="#4caf50" />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}

      </div>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div
      style={{
        padding: "15px",
        backgroundColor: "#f5f5f5",
        borderRadius: "8px",
        textAlign: "center",
        border: "1px solid #e0e0e0",
      }}
    >
      <div style={{ fontSize: "12px", color: "#666" }}>{label}</div>
      <div style={{ fontSize: "20px", fontWeight: "bold", color: "#2196f3" }}>
        {value}
      </div>
    </div>
  );
}