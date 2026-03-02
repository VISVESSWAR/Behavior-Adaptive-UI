import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import AdaptiveButton from "./AdaptiveButton.jsx";

export default function Navbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  /* ---------- AUTH STATE ---------- */

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      setIsAuthenticated(!!token);
    };

    checkAuth();

    window.addEventListener("storage", checkAuth);
    window.addEventListener("auth-change", checkAuth);

    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("auth-change", checkAuth);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("auth-change"));
    navigate("/");
  };

  /* ---------- NAV ITEMS ---------- */

  let navigationItems = [];

  if (!isAuthenticated) {
    navigationItems = [
      { label: "Login", path: "/" },
      { label: "Recovery", path: "/recover" },
      { label: "Register", path: "/signup" },
    ];
  } else {
    navigationItems = [
      { label: "Home", path: "/home" },
      { label: "Dashboard", path: "/dashboard" },
      { label: "Transaction", path: "/transaction" },
      { label: "Metrics", path: "/metrics" },
      { label: "Recovery", path: "/recover" },
      { label: "Logout", action: handleLogout },
    ];
  }

  // Alphabetical sort
  // navigationItems.sort((a, b) => a.label.localeCompare(b.label));

  const getActiveStyle = (path) =>
    location.pathname === path ? "bg-blue-600 text-white" : "bg-transparent";

  /* ---------- RENDER ---------- */

  return (
    <nav className="w-full border-b bg-gray-100 px-6 py-3">
      <div className="flex items-center justify-start">
        {/* Hamburger (md and below) */}
        <div
          className="md:hidden text-2xl cursor-pointer"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-3">
          {navigationItems.map((item) =>
            item.action ? (
              <AdaptiveButton
                key={item.label}
                onClick={item.action}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-600 hover:text-white border border-gray-300 transition"
              >
                {item.label}
              </AdaptiveButton>
            ) : (
              <Link key={item.label} to={item.path}>
                <AdaptiveButton
                  className={`px-4 py-2 bg-blue-700 hover:bg-blue-600 hover:text-white border border-blue-300 transition ${getActiveStyle(item.path)}`}
                >
                  {item.label}
                </AdaptiveButton>
              </Link>
            ),
          )}
        </div>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="flex flex-col gap-2 mt-4 md:hidden">
          {navigationItems.map((item) =>
            item.action ? (
              <AdaptiveButton
                key={item.label}
                onClick={() => {
                  item.action();
                  setMenuOpen(false);
                }}
                className={`px-4 py-2 w-full bg-blue-700 hover:bg-blue-600 hover:text-white border border-blue-300 transition ${getActiveStyle(item.path)}`}
              >
                {item.label}
              </AdaptiveButton>
            ) : (
              <Link
                key={item.label}
                to={item.path}
                onClick={() => setMenuOpen(false)}
              >
                <AdaptiveButton
                  className={`px-4 py-2 w-full bg-blue-700 hover:bg-blue-600 hover:text-white border border-blue-300 transition ${getActiveStyle(item.path)}`}
                >
                  {item.label}
                </AdaptiveButton>
              </Link>
            ),
          )}
        </div>
      )}
    </nav>
  );
}
