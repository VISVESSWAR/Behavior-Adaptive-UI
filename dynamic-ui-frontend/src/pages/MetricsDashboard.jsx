import { useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
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
  const [csvData, setCsvData] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [stats, setStats] = useState(null);
  const [fileLoaded, setFileLoaded] = useState(false);

  // Handle CSV file upload
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

      // Parse all metrics
      const completionTimes = getTaskCompletionTimes(rows);
      const rewardTimeSeries = getRewardTimeSeries(rows);
      const errorRates = getErrorRateByMode(rows);
      const actionFreq = getActionFrequency(rows);
      const modePerf = getModePerformance(rows);
      const rewardStats = getRewardStats(rows);

      setCsvData(rows);
      setParsedData({
        completionTimes,
        rewardTimeSeries,
        errorRates,
        actionFreq,
        modePerf,
      });
      setStats(rewardStats);
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
                transition: "background-color 0.3s",
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#1976d2")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#2196f3")}
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

          <AdaptiveParagraph style={{ marginTop: "20px", fontSize: "12px", color: "#666" }}>
            📌 Expected format: Transition logs exported from IndexedDB with columns: state vectors,
            action, experimentMode, reward, next_state vectors, done
          </AdaptiveParagraph>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="card" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <AdaptiveHeading level={2}>📊 Metrics Analysis Dashboard</AdaptiveHeading>
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

        {/* Summary Statistics */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "15px",
            marginBottom: "30px",
          }}
        >
          <StatBox label="Total Transitions" value={csvData.length} />
          <StatBox label="Avg Reward" value={stats.mean} />
          <StatBox label="Max Reward" value={stats.max} />
          <StatBox label="Min Reward" value={stats.min} />
          <StatBox label="Reward Median" value={stats.median} />
          <StatBox label="Std Deviation" value={stats.std} />
        </div>
      </div>

      {/* Task Completion Time Distribution */}
      <div className="card">
        <AdaptiveHeading level={3}>Task Completion Time Distribution</AdaptiveHeading>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={parsedData.completionTimes}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timeRange" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#2196f3" name="Completed Tasks" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Reward Over Time */}
      <div className="card">
        <AdaptiveHeading level={3}>Reward Progression & Cumulative Reward</AdaptiveHeading>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={parsedData.rewardTimeSeries}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="stepIndex" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="reward" stroke="#ff9800" name="Step Reward" />
            <Line
              type="monotone"
              dataKey="cumulative"
              stroke="#4caf50"
              name="Cumulative Reward"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Error Rate by Mode */}
      <div className="card">
        <AdaptiveHeading level={3}>Error Rate by Experiment Mode</AdaptiveHeading>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: "20px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5", borderBottom: "2px solid #ddd" }}>
                <th style={{ padding: "10px", textAlign: "left" }}>Mode</th>
                <th style={{ padding: "10px", textAlign: "right" }}>Error Rate (%)</th>
                <th style={{ padding: "10px", textAlign: "right" }}>Error Count</th>
                <th style={{ padding: "10px", textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {parsedData.errorRates.map((row, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: "1px solid #eee",
                    backgroundColor: idx % 2 === 0 ? "#fff" : "#f9f9f9",
                  }}
                >
                  <td style={{ padding: "10px", fontWeight: "bold" }}>{row.mode}</td>
                  <td style={{ padding: "10px", textAlign: "right", color: "#f44336" }}>
                    {row.errorRate}%
                  </td>
                  <td style={{ padding: "10px", textAlign: "right" }}>{row.errorCount}</td>
                  <td style={{ padding: "10px", textAlign: "right" }}>{row.totalTransitions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Error Rate Bar Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={parsedData.errorRates}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mode" />
            <YAxis label={{ value: "Error Rate (%)", angle: -90, position: "insideLeft" }} />
            <Tooltip />
            <Bar dataKey="errorRate" fill="#f44336" name="Error Rate (%)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Action Frequency Histogram */}
      <div className="card">
        <AdaptiveHeading level={3}>Action Selection Frequency</AdaptiveHeading>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={parsedData.actionFreq}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="action" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload[0]) {
                  return (
                    <div
                      style={{
                        backgroundColor: "white",
                        padding: "10px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                      }}
                    >
                      <p style={{ margin: "0 0 5px 0" }}>{payload[0].payload.action}</p>
                      <p style={{ margin: "0 0 5px 0" }}>
                        Count: {payload[0].payload.count}
                      </p>
                      <p style={{ margin: "0" }}>{payload[0].payload.percentage}%</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="count" fill="#9c27b0" name="Frequency" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Mode Performance Comparison */}
      <div className="card">
        <AdaptiveHeading level={3}>Experiment Mode Performance</AdaptiveHeading>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: "20px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5", borderBottom: "2px solid #ddd" }}>
                <th style={{ padding: "10px", textAlign: "left" }}>Mode</th>
                <th style={{ padding: "10px", textAlign: "right" }}>Avg Reward</th>
                <th style={{ padding: "10px", textAlign: "right" }}>Success Rate (%)</th>
                <th style={{ padding: "10px", textAlign: "right" }}>Avg Action</th>
                <th style={{ padding: "10px", textAlign: "right" }}>Transitions</th>
              </tr>
            </thead>
            <tbody>
              {parsedData.modePerf.map((row, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: "1px solid #eee",
                    backgroundColor: idx % 2 === 0 ? "#fff" : "#f9f9f9",
                  }}
                >
                  <td style={{ padding: "10px", fontWeight: "bold" }}>{row.mode}</td>
                  <td
                    style={{
                      padding: "10px",
                      textAlign: "right",
                      color: parseFloat(row.avgReward) > 0 ? "#4caf50" : "#f44336",
                    }}
                  >
                    {row.avgReward}
                  </td>
                  <td style={{ padding: "10px", textAlign: "right" }}>{row.successRate}%</td>
                  <td style={{ padding: "10px", textAlign: "right" }}>{row.avgAction}</td>
                  <td style={{ padding: "10px", textAlign: "right" }}>{row.transitionCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mode Reward Comparison */}
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={parsedData.modePerf}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mode" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="avgReward" fill="#2196f3" name="Avg Reward" />
            <Bar
              dataKey="successRate"
              fill="#4caf50"
              name="Success Rate (%)"
              yAxisId="right"
            />
            <YAxis yAxisId="right" orientation="right" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Export Instructions */}
      <div className="card" style={{ backgroundColor: "#f0f7ff", borderLeft: "4px solid #2196f3" }}>
        <AdaptiveHeading level={3}>💡 How to Export Logs</AdaptiveHeading>
        <AdaptiveParagraph style={{ fontSize: "14px", lineHeight: "1.6" }}>
          1. In your application, export transition logs using{" "}
          <code style={{ backgroundColor: "#fff", padding: "2px 6px", borderRadius: "3px" }}>
            indexedDBManager.exportAllAsCSV()
          </code>
          <br />
          2. Save the CSV file to your computer
          <br />
          3. Upload the file using the "Choose CSV File" button above
          <br />
          4. View comprehensive analytics and comparisons
        </AdaptiveParagraph>
      </div>
    </div>
  );
}

// Helper component for stat boxes
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
      <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
        {label}
      </div>
      <div style={{ fontSize: "20px", fontWeight: "bold", color: "#2196f3" }}>
        {value}
      </div>
    </div>
  );
}
