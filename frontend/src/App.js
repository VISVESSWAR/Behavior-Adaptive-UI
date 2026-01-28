import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useTask } from "./task/TaskContext";
import { MetricsProvider, useMetricsCollector } from "./context/MetricsContext";
import useMouseTracker from "./hooks/useMouseTracker";
import useIdleTimer from "./hooks/useIdleTimer";
import useScrollDepth from "./hooks/useScrollDepth";
import { usePersona } from "./persona/usePersona";
import { UIProvider, useUIConfig } from "./adaptation/UIContext";
import { AdaptationDebugger } from "./components/AdaptationDebugger";
import Navbar from "./components/Navbar";
import MetricsCollector from "./utils/metricsCollectorSimplified";

import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import HomePage from "./pages/HomePage";
import TransactionPage from "./pages/TransactionPage";
import DashboardPage from "./pages/DashboardPage";

/* =========================
   RECOVERY PAGES
   ========================= */
import RecoveryPage from "./pages/RecoveryPage"; // choose method
import OtpRecoverPage from "./pages/OtpRecoverPage"; // OTP input only
import ScanQRPage from "./pages/ScanQRPage"; // QR scan
import TapWaitPage from "./pages/TapWaitPage"; // waiting for peers
import FinishRecoveryPage from "./pages/FinishRecoveryPage"; // reset password
import ResetPasswordPage from "./pages/ResetPasswordPage";

// Internal app component that uses MetricsProvider & UIProvider
function AppContent() {
  const metricsCollectorRef = useRef(null);
  const task = useTask();
  const { metricsCollectorRef: contextCollectorRef } = useMetricsCollector();

  // Initialize global metrics collector on mount
  useEffect(() => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const metricsCollector = new MetricsCollector(sessionId, "app", "main");
    metricsCollectorRef.current = metricsCollector;
    contextCollectorRef.current = metricsCollector;
    window.__metricsCollector = metricsCollector;
    console.log(
      `[App] Initialized MetricsCollector with sessionId: ${sessionId}`,
    );
    return () => {
      console.log("[App] MetricsCollector cleanup");
      if (metricsCollectorRef.current) {
        metricsCollectorRef.current.completeFlow();
      }
      delete window.__metricsCollector;
    };
  }, [contextCollectorRef]);

  // Sync task data with MetricsCollector
  useEffect(() => {
    if (metricsCollectorRef.current && task.taskStartTime) {
      const elapsedTime = Date.now() - task.taskStartTime;
      metricsCollectorRef.current.updateTaskData({
        completed: task.completed,
        failed: task.failed,
        elapsedTime: elapsedTime,
        timeLimit: task.timeLimit,
        pathLength: task.pathSequence.length,
      });
    }
  }, [
    task.completed,
    task.failed,
    task.taskStartTime,
    task.timeLimit,
    task.pathSequence.length,
  ]);

  // Global UX instrumentation - these hooks track metrics globally
  const metrics = useMouseTracker("global", "app");
  useIdleTimer("global", "app");
  useScrollDepth("global", "app");

  // Get persona from metrics
  const persona = usePersona(metrics);

  // Get current UI configuration
  const { uiConfig } = useUIConfig();

  // Update metrics in collector EVERY render (so idle time is always tracked)
  useEffect(() => {
    if (metricsCollectorRef.current && metrics) {
      metricsCollectorRef.current.updateMetrics(metrics);
    }
  }, [metrics]);

  // Update persona in collector
  useEffect(() => {
    if (metricsCollectorRef.current && persona) {
      metricsCollectorRef.current.updatePersona(persona);
    }
  }, [persona]);

  // Update UI state in collector
  useEffect(() => {
    if (metricsCollectorRef.current) {
      metricsCollectorRef.current.updateUIState(uiConfig);
      if (persona && persona.confidence) {
        metricsCollectorRef.current.personaConfidence = persona.confidence;
        console.log(
          `[App] Updated collector context: persona=${persona.type || persona.persona}, confidence=${persona.confidence.toFixed(2)}, uiConfig=${JSON.stringify(uiConfig)}`,
        );
      }
    }
  }, [uiConfig, persona?.confidence]);

  // Collect snapshot every 10 seconds (check every second)
  useEffect(() => {
    if (!metricsCollectorRef.current) return;

    const timer = setInterval(() => {
      if (
        metricsCollectorRef.current &&
        metricsCollectorRef.current.shouldCollect()
      ) {
        const snapshot = metricsCollectorRef.current.collectSnapshot();
        if (snapshot) {
          console.log("[App] Snapshot collected:", {
            timestamp: new Date(snapshot.timestamp).toLocaleTimeString(),
            persona:
              snapshot.persona?.persona || snapshot.persona?.type || "unknown",
            action: snapshot.action,
            totalSnapshots: metricsCollectorRef.current.snapshots.length,
          });
        }
      }
    }, 1000); // Check every second if 10s has passed

    return () => clearInterval(timer);
  }, []);

  return (
    <BrowserRouter>
      <UIProvider persona={persona}>
        {/* Header with persona info */}
        <header style={{ padding: "10px 20px", background: "#f5f5f5" }}>
          <div style={{ fontSize: "12px", color: "#666" }}>
            Current Persona: <strong>{persona?.type || "loading..."}</strong> |
            Status: {persona?.stable ? "Stable" : "Learning..."}
          </div>
        </header>

        {/* Navigation Bar */}
        <Navbar />

        {/* Adaptation Debugger */}
        <AdaptationDebugger />

      <main>
        <Routes>
          {/* ================= AUTH ================= */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* ================= DASHBOARD ================= */}
          <Route path="/home" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* ================= TRANSACTION ================= */}
          <Route path="/transaction" element={<TransactionPage />} />

          {/* ================= RECOVERY FLOW ================= */}
          {/* Step 0: choose recovery method */}
          <Route path="/recover" element={<RecoveryPage />} />

          {/* OTP-based recovery */}
          <Route path="/otp-recover" element={<OtpRecoverPage />} />

          {/* Peer-based recovery */}
          <Route path="/scan-qr" element={<ScanQRPage />} />
          <Route path="/tap-wait" element={<TapWaitPage />} />

          {/* Final step (COMMON to all methods) */}
          <Route path="/finish" element={<FinishRecoveryPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Routes>
      </main>
      </UIProvider>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <MetricsProvider>
      <AppContent />
    </MetricsProvider>
  );
}
 
