import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useUIConfig } from "./adaptation/UIContext";
import useMouseTracker from "./hooks/useMouseTracker";
import useIdleTimer from "./hooks/useIdleTimer";
import useScrollDepth from "./hooks/useScrollDepth";
import { AdaptationDebugger } from "./components/AdaptationDebugger";

/* =========================
   AUTH & CORE PAGES
   ========================= */
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import HomePage from "./pages/HomePage";

/* =========================
   RECOVERY PAGES
   ========================= */
import RecoveryPage from "./pages/RecoveryPage";          // choose method
import OtpRecoverPage from "./pages/OtpRecoverPage";      // OTP input only
import ScanQRPage from "./pages/ScanQRPage";              // QR scan
import TapWaitPage from "./pages/TapWaitPage";            // waiting for peers
import FinishRecoveryPage from "./pages/FinishRecoveryPage"; // reset password
import ResetPasswordPage from "./pages/ResetPasswordPage";


export default function App() {
  // Global UX instrumentation
  useMouseTracker("global", "app");
  useIdleTimer("global", "app");
  useScrollDepth("global", "app");

  const { persona } = useUIConfig();

  return (
    <BrowserRouter>
      {/* Optional debug / persona header */}
      <header style={{ padding: "10px 20px", background: "#f5f5f5" }}>
        <div style={{ fontSize: "12px", color: "#666" }}>
          Current Persona:{" "}
          <strong>{persona?.persona || "loading..."}</strong>
        </div>
      </header>

      <main>
        <Routes>
          {/* ================= AUTH ================= */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* ================= DASHBOARD ================= */}
          <Route path="/home" element={<HomePage />} />

          {/* ================= RECOVERY FLOW ================= */}
          {/* Step 0: choose recovery method */}
          <Route path="/recover" element={<RecoveryPage />} />

          {/* OTP-based recovery */}
          <Route path="/otp-recover" element={<OtpRecoverPage />} />

          {/* Peer-based recovery */}
          <Route path="/scan" element={<ScanQRPage />} />
          <Route path="/tap-wait" element={<TapWaitPage />} />

          {/* Final step (COMMON to all methods) */}
          <Route path="/finish" element={<FinishRecoveryPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Routes>
      </main>

      <AdaptationDebugger />
    </BrowserRouter>
  );
}
