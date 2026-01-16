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
import "./index.css";

function fmt(v, d = 2) {
  return typeof v === "number" ? v.toFixed(d) : "0.00";
}

function AppHeader() {
  const metrics = useMouseTracker("global", "app");
  const idleTime = useIdleTimer("global", "app");
  const scrollDepth = useScrollDepth("global", "app");

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Adaptive UI Dashboard
            </h1>
            <p className="text-sm text-gray-600">
              Behavior-aware user interface system
            </p>
          </div>
        </div>

        {/* === NAVIGATION === */}
        <nav className="flex gap-4 flex-wrap">
          <Link
            to="/"
            className="adaptive-element px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Home
          </Link>
          <Link
            to="/login"
            className="adaptive-element px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="adaptive-element px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Register
          </Link>
          <Link
            to="/transaction"
            className="adaptive-element px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Transaction
          </Link>
          <Link
            to="/recovery"
            className="adaptive-element px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Recovery
          </Link>
          <Link
            to="/dashboard"
            className="adaptive-element px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg font-bold"
          >
            Dashboard
          </Link>
        </nav>

        {/* === METRICS SNAPSHOT === */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-gray-600">Duration</p>
            <p className="font-semibold">{fmt(metrics.s_session_duration)}s</p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-gray-600">Distance</p>
            <p className="font-semibold">{fmt(metrics.s_total_distance)}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-gray-600">Clicks</p>
            <p className="font-semibold">{metrics.s_num_clicks || 0}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-gray-600">Idle Time</p>
            <p className="font-semibold">{fmt(idleTime)}s</p>
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
