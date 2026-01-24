import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useUIConfig } from "./adaptation/UIContext";
import useMouseTracker from "./hooks/useMouseTracker";
import useIdleTimer from "./hooks/useIdleTimer";
import useScrollDepth from "./hooks/useScrollDepth";
import { AdaptationDebugger } from "./components/AdaptationDebugger";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import HomePage from "./pages/HomePage";

export default function App() {
  // Global metrics collection
  useMouseTracker("global", "app");
  useIdleTimer("global", "app");
  useScrollDepth("global", "app");

  const { persona } = useUIConfig();

  return (
    <BrowserRouter>
      <header style={{ padding: "10px 20px", background: "#f5f5f5" }}>
        <div style={{ fontSize: "12px", color: "#666" }}>
          Current Persona: <strong>{persona?.persona || "loading..."}</strong>
        </div>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/home" element={<HomePage />} />
        </Routes>
      </main>

      <AdaptationDebugger />
    </BrowserRouter>
  );
}
