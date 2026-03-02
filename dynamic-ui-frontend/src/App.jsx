import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Toaster } from "react-hot-toast";
import { useTask } from "./task/TaskContext.jsx";
import { MetricsProvider, useMetricsCollector } from "./context/MetricsContext.jsx";
import { HelpTooltipProvider } from "./context/HelpTooltipContext.jsx";
import useMouseTracker from "./hooks/useMouseTracker.jsx";
import useIdleTimer from "./hooks/useIdleTimer.jsx";
import useScrollDepth from "./hooks/useScrollDepth.jsx";
import { usePersona } from "./persona/usePersona.jsx";
import { UIProvider, useUIConfig } from "./adaptation/UIContext.jsx";
import { AdaptationDebugger } from "./components/AdaptationDebugger.jsx";
import HelpTooltip from "./components/HelpTooltip.jsx";
import Navbar from "./components/Navbar.jsx";
import MetricsCollector from "./utils/metricsCollectorSimplified.jsx";
import { setupExperimentControl } from "./utils/experimentControl.jsx";

import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import TransactionPage from "./pages/TransactionPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import MetricsDashboard from "./pages/MetricsDashboard.jsx";

/* =========================
   RECOVERY PAGES
   ========================= */
import RecoveryPage from "./pages/RecoveryPage.jsx"; // choose method
import OtpRecoverPage from "./pages/OtpRecoverPage.jsx"; // OTP input only
import ScanQRPage from "./pages/ScanQRPage.jsx"; // QR scan
import TapWaitPage from "./pages/TapWaitPage.jsx"; // waiting for peers
import FinishRecoveryPage from "./pages/FinishRecoveryPage.jsx"; // reset password
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";

// ProtectedRoute component to redirect logged-in users away from auth pages
function AuthRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  if (isAuthenticated === null) return null; // Loading
  if (isAuthenticated) return <Navigate to="/home" />; // Redirect logged-in users away from auth pages
  return children;
}

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
    
    // Initialize experiment control utilities
    setupExperimentControl();
    
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
  // CRITICAL: collectSnapshot is now async and fetches DQN action at snapshot time
  useEffect(() => {
    if (!metricsCollectorRef.current) return;

    const timer = setInterval(async () => {
      // Update countdown timer
      if (typeof window !== "undefined" && window.__metricsCollector) {
        const snapshotStartTime = window.__metricsCollector.snapshotStartTime || Date.now();
        const elapsed = Math.floor((Date.now() - snapshotStartTime) / 1000);
        window.__metricsCollector.timeRemaining = Math.max(0, 10 - elapsed);
      }

      if (
        metricsCollectorRef.current &&
        metricsCollectorRef.current.shouldCollect()
      ) {
        const snapshot = await metricsCollectorRef.current.collectSnapshot();
        if (snapshot) {
          console.log("[App] Snapshot collected:", {
            timestamp: new Date(snapshot.timestamp).toLocaleTimeString(),
            persona:
              snapshot.persona?.persona || snapshot.persona?.type || "unknown",
            action: snapshot.action,
            dqnAction: snapshot.dqnAction,
            totalSnapshots: metricsCollectorRef.current.snapshots.length,
          });
        }
      }
    }, 1000); // Check every second if 10s has passed

    return () => clearInterval(timer);
  }, []);

  return (
    <BrowserRouter>
      <HelpTooltipProvider>
        <UIProvider persona={persona} metrics={metrics}>
          {/* Toast notification system */}
          <Toaster position="top-right" />

          

          {/* Navigation Bar */}
          <Navbar />

          {/* Help Tooltip System - Activated by action 9 */}
          <HelpTooltip />

          {/* Adaptation Debugger */}
          <AdaptationDebugger />

      <main>
        <Routes>
          {/* ================= AUTH ================= */}
          <Route path="/" element={<AuthRoute><LoginPage /></AuthRoute>} />
          <Route path="/signup" element={<AuthRoute><SignupPage /></AuthRoute>} />

          {/* ================= DASHBOARD ================= */}
          <Route path="/home" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/metrics" element={<MetricsDashboard />} />

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
      </HelpTooltipProvider>
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
 
