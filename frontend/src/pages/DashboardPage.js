import { useEffect, useState } from "react";
import { useMetricsCollector } from "../context/MetricsContext";
import IndexedDBManager from "../utils/indexedDBManager";
import AdaptiveButton from "../components/AdaptiveButton";
import { AdaptiveHeading, AdaptiveParagraph } from "../components/AdaptiveText";

function fmt(v, d = 2) {
  return typeof v === "number" ? v.toFixed(d) : "0.00";
}

export default function DashboardPage() {
  // Get MetricsCollector instance from context (READ ONLY - no tracking)
  const { metricsCollectorRef } = useMetricsCollector();

  // State for dashboard display
  const [snapshotCount, setSnapshotCount] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [currentMetrics, setCurrentMetrics] = useState({});

  // Fetch and subscribe to metrics from global collector
  useEffect(() => {
    const fetchMetricsSummary = async () => {
      try {
        if (metricsCollectorRef && metricsCollectorRef.current) {
          const collector = metricsCollectorRef.current;
          const snapCount = collector.snapshots.length;
          setSnapshotCount(snapCount);
          
          // Read current metrics from the global collector's window metrics
          if (collector.windowMetrics) {
            setCurrentMetrics(collector.windowMetrics);
          }
          
          console.log("[DashboardPage] Collector snapshots:", snapCount);
        }

        const dbManager = new IndexedDBManager();
        await dbManager.init();
        const stats = await dbManager.getStats();
        setTotalSessions(stats.sessionCount || 0);
        console.log("[DashboardPage] DB stats:", stats);
      } catch (error) {
        console.error("[DashboardPage] Error fetching metrics:", error);
      }
    };

    fetchMetricsSummary();
    const interval = setInterval(fetchMetricsSummary, 1000); // Refresh every 1s for real-time display
    return () => clearInterval(interval);
  }, [metricsCollectorRef]);

  const handleExportCSV = async () => {
    try {
      const dbManager = new IndexedDBManager();
      await dbManager.init();

      const csvData = await dbManager.exportAllAsCSV();

      if (!csvData) {
        alert("No transitions to export");
        return;
      }

      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `dqn_ui_dataset_${Date.now()}.csv`;
      a.click();
    } catch (error) {
      console.error("CSV export failed:", error);
    }
  };

  const handleExportJSON = async () => {
    try {
      const dbManager = new IndexedDBManager();
      await dbManager.init();

      const jsonData = await dbManager.exportAllAsJSON();

      const blob = new Blob(
        [JSON.stringify(jsonData, null, 2)],
        { type: "application/json" }
      );

      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `dqn_ui_transitions_${Date.now()}.json`;
      a.click();
    } catch (error) {
      console.error("JSON export failed:", error);
    }
  };

  return (
    <div style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }}>
      <AdaptiveHeading level={1} style={{ marginBottom: "30px" }}>
        Analytics Dashboard
      </AdaptiveHeading>
      <AdaptiveParagraph style={{ marginBottom: "30px", color: "#666" }}>
        Real-time behavioral metrics and user analytics
      </AdaptiveParagraph>

      {/* ========== REAL-TIME METRICS CARDS ========== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          marginBottom: "40px",
        }}
      >
        {/* Total Clicks */}
        <div
          style={{
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            backgroundColor: "#f9f9f9",
          }}
        >
          <AdaptiveParagraph
            style={{ fontSize: "14px", color: "#666", margin: 0 }}
          >
            Total Clicks
          </AdaptiveParagraph>
          <AdaptiveHeading
            level={3}
            style={{ margin: "10px 0 0 0", color: "#0066cc" }}
          >
            {currentMetrics?.s_num_clicks || 0}
          </AdaptiveHeading>
        </div>

        {/* Session Duration */}
        <div
          style={{
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            backgroundColor: "#f9f9f9",
          }}
        >
          <AdaptiveParagraph
            style={{ fontSize: "14px", color: "#666", margin: 0 }}
          >
            Session Duration
          </AdaptiveParagraph>
          <AdaptiveHeading
            level={3}
            style={{ margin: "10px 0 0 0", color: "#00aa00" }}
          >
            {fmt(currentMetrics?.s_session_duration)}s
          </AdaptiveHeading>
        </div>

        {/* Mouse Distance */}
        <div
          style={{
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            backgroundColor: "#f9f9f9",
          }}
        >
          <AdaptiveParagraph
            style={{ fontSize: "14px", color: "#666", margin: 0 }}
          >
            Mouse Distance
          </AdaptiveParagraph>
          <AdaptiveHeading
            level={3}
            style={{ margin: "10px 0 0 0", color: "#ff9900" }}
          >
            {fmt(currentMetrics?.s_total_distance)} px
          </AdaptiveHeading>
        </div>

        {/* Idle Time */}
        <div
          style={{
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            backgroundColor: "#f9f9f9",
          }}
        >
          <AdaptiveParagraph
            style={{ fontSize: "14px", color: "#666", margin: 0 }}
          >
            Idle Time
          </AdaptiveParagraph>
          <AdaptiveHeading
            level={3}
            style={{ margin: "10px 0 0 0", color: "#cc0066" }}
          >
            {fmt(currentMetrics?.s_idle_time)}s
          </AdaptiveHeading>
        </div>

        {/* Velocity Mean */}
        <div
          style={{
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            backgroundColor: "#f9f9f9",
          }}
        >
          <AdaptiveParagraph
            style={{ fontSize: "14px", color: "#666", margin: 0 }}
          >
            Velocity Mean
          </AdaptiveParagraph>
          <AdaptiveHeading
            level={3}
            style={{ margin: "10px 0 0 0", color: "#0066cc" }}
          >
            {fmt(currentMetrics?.s_vel_mean)} px/ms
          </AdaptiveHeading>
        </div>

        {/* Misclicks */}
        <div
          style={{
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            backgroundColor: "#f9f9f9",
          }}
        >
          <AdaptiveParagraph
            style={{ fontSize: "14px", color: "#666", margin: 0 }}
          >
            Misclicks
          </AdaptiveParagraph>
          <AdaptiveHeading
            level={3}
            style={{ margin: "10px 0 0 0", color: "#ff6600" }}
          >
            {currentMetrics?.s_num_misclicks || 0}
          </AdaptiveHeading>
        </div>

        {/* Scroll Depth */}
        <div
          style={{
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            backgroundColor: "#f9f9f9",
          }}
        >
          <AdaptiveParagraph
            style={{ fontSize: "14px", color: "#666", margin: 0 }}
          >
            Scroll Depth
          </AdaptiveParagraph>
          <AdaptiveHeading
            level={3}
            style={{ margin: "10px 0 0 0", color: "#00aa00" }}
          >
            {fmt((currentMetrics?.s_scroll_depth || 0) * 100, 1)}%
          </AdaptiveHeading>
        </div>

        {/* Total Actions */}
        <div
          style={{
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            backgroundColor: "#f9f9f9",
          }}
        >
          <AdaptiveParagraph
            style={{ fontSize: "14px", color: "#666", margin: 0 }}
          >
            Total Actions
          </AdaptiveParagraph>
          <AdaptiveHeading
            level={3}
            style={{ margin: "10px 0 0 0", color: "#0066cc" }}
          >
            {currentMetrics?.s_num_actions || 0}
          </AdaptiveHeading>
        </div>
      </div>

      {/* ========== COLLECTION STATUS ========== */}
      <div
        style={{
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          backgroundColor: "#f0f8ff",
          marginBottom: "30px",
        }}
      >
        <AdaptiveHeading level={2} style={{ marginBottom: "15px" }}>
          Metrics Collection Status
        </AdaptiveHeading>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "15px",
          }}
        >
          <div>
            <AdaptiveParagraph
              style={{ fontSize: "14px", color: "#666", margin: 0 }}
            >
              Snapshots Collected
            </AdaptiveParagraph>
            <AdaptiveParagraph
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: "#0066cc",
                margin: "5px 0 0 0",
              }}
            >
              {snapshotCount}
            </AdaptiveParagraph>
          </div>
          <div>
            <AdaptiveParagraph
              style={{ fontSize: "14px", color: "#666", margin: 0 }}
            >
              Total Sessions
            </AdaptiveParagraph>
            <AdaptiveParagraph
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: "#00aa00",
                margin: "5px 0 0 0",
              }}
            >
              {totalSessions}
            </AdaptiveParagraph>
          </div>
        </div>
      </div>

      {/* ========== EXPORT BUTTONS ========== */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <AdaptiveButton
          onClick={handleExportJSON}
          style={{ padding: "12px 24px" }}
        >
          Export Transitions (JSON)
        </AdaptiveButton>
        <AdaptiveButton
          onClick={handleExportCSV}
          style={{ padding: "12px 24px" }}
        >
          Export Dataset (CSV)
        </AdaptiveButton>
      </div>
    </div>
  );
}
