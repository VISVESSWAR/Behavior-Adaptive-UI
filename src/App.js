import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import useMouseTracker from "./hooks/useMouseTracker";
import useIdleTimer from "./hooks/useIdleTimer";
import useScrollDepth from "./hooks/useScrollDepth";

import HomePage from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Transaction from "./pages/Transaction";
import Recovery from "./pages/Recovery";
import Dashboard from "./pages/Dashboard";

import { UIProvider } from "./adaptation/UIContext";
import useUIVariants from "./adaptation/useUIVariants";
import {
  AdaptiveHeading,
  AdaptiveParagraph,
  AdaptiveLink,
} from "./components/AdaptiveText";
import "./index.css";

function fmt(v, d = 2) {
  return typeof v === "number" ? v.toFixed(d) : "0.00";
}

function AppHeader() {
  const metrics = useMouseTracker("global", "app");
  const idleTime = useIdleTimer("global", "app");
  const scrollDepth = useScrollDepth("global", "app");
  const ui = useUIVariants();

  return (
    <header
      className={`sticky top-0 z-50 bg-white ${ui.shadow} border-b border-gray-200`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <AdaptiveHeading level={1} className="text-gray-900">
              Adaptive UI Dashboard
            </AdaptiveHeading>
            <AdaptiveParagraph className="text-gray-600">
              Behavior-aware user interface system
            </AdaptiveParagraph>
          </div>
        </div>

        {/* === NAVIGATION === */}
        <nav className={`flex ${ui.spacing} flex-wrap`}>
          <AdaptiveLink
            as={Link}
            to="/"
            className="adaptive-element px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Home
          </AdaptiveLink>
          <AdaptiveLink
            as={Link}
            to="/login"
            className="adaptive-element px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Login
          </AdaptiveLink>
          <AdaptiveLink
            as={Link}
            to="/register"
            className="adaptive-element px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Register
          </AdaptiveLink>
          <AdaptiveLink
            as={Link}
            to="/transaction"
            className="adaptive-element px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Transaction
          </AdaptiveLink>
          <AdaptiveLink
            as={Link}
            to="/recovery"
            className="adaptive-element px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Recovery
          </AdaptiveLink>
          <AdaptiveLink
            as={Link}
            to="/dashboard"
            className="adaptive-element px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
          >
            Dashboard
          </AdaptiveLink>
        </nav>

        {/* === METRICS SNAPSHOT === */}
        <div
          className={`mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 ${ui.spacing} text-xs`}
        >
          <div className={`bg-gray-50 ${ui.cardPadding} ${ui.radius}`}>
            <AdaptiveParagraph className="text-gray-600">
              Duration
            </AdaptiveParagraph>
            <p className={`${ui.font}`}>{fmt(metrics.s_session_duration)}s</p>
          </div>
          <div className={`bg-gray-50 ${ui.cardPadding} ${ui.radius}`}>
            <AdaptiveParagraph className="text-gray-600">
              Distance
            </AdaptiveParagraph>
            <p className={`${ui.font}`}>{fmt(metrics.s_total_distance)}</p>
          </div>
          <div className={`bg-gray-50 ${ui.cardPadding} ${ui.radius}`}>
            <AdaptiveParagraph className="text-gray-600">
              Clicks
            </AdaptiveParagraph>
            <p className={`${ui.font}`}>{metrics.s_num_clicks || 0}</p>
          </div>
          <div className={`bg-gray-50 ${ui.cardPadding} ${ui.radius}`}>
            <AdaptiveParagraph className="text-gray-600">
              Idle Time
            </AdaptiveParagraph>
            <p className={`${ui.font}`}>{fmt(idleTime)}s</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <Router>
      <UIProvider>
        <AppHeader />
        <main className="min-h-screen bg-gray-50">
          {/* === ROUTES === */}
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/transaction" element={<Transaction />} />
            <Route path="/recovery" element={<Recovery />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </UIProvider>
    </Router>
  );
}
