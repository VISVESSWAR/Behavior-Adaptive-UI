import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useUIConfig } from "./adaptation/UIContext";
import useMouseTracker from "./hooks/useMouseTracker";
import useIdleTimer from "./hooks/useIdleTimer";
import useScrollDepth from "./hooks/useScrollDepth";
import { AdaptationDebugger } from "./components/AdaptationDebugger";

import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import HomePage from "./pages/HomePage";
import RecoveryPage from "./pages/RecoveryPage";
import TapWaitPage from "./pages/TapWaitPage";
import ScanPage from "./pages/ScanQRPage";       // QR scanning page
import FinishRecoveryPage from "./pages/FinishRecoveryPage"; // optional

export default function App() {
  useMouseTracker("global", "app");
  useIdleTimer("global", "app");
  useScrollDepth("global", "app");

  const { persona } = useUIConfig();

  return (
    <BrowserRouter>
      <header style={{ padding: "10px 20px", background: "#f5f5f5" }}>
        <div style={{ fontSize: "12px", color: "#666" }}>
          Current Persona:{" "}
          <strong>{persona?.persona || "loading..."}</strong>
        </div>
      </header>

      <main>
        <Routes>
          {/* Auth */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Main Dashboard */}
          <Route path="/home" element={<HomePage />} />

          {/* Recovery Flow */}
          <Route path="/recover" element={<RecoveryPage />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/tap-wait" element={<TapWaitPage />} />
          <Route path="/finish" element={<FinishRecoveryPage />} />
        </Routes>
      </main>

      <AdaptationDebugger />
    </BrowserRouter>
  );
}
