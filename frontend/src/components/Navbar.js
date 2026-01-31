import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import AdaptiveButton from "./AdaptiveButton";

export default function Navbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Check initial auth state
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  // Listen for auth changes (both storage and custom events)
  useEffect(() => {
    // Handle storage changes from other tabs
    const handleStorageChange = () => {
      const token = localStorage.getItem("token");
      setIsAuthenticated(!!token);
    };

    // Handle custom auth event from same tab
    const handleAuthChange = () => {
      const token = localStorage.getItem("token");
      setIsAuthenticated(!!token);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth-change", handleAuthChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth-change", handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    navigate("/");
  };

  return (
    <nav
      style={{
        padding: "15px 20px",
        backgroundColor: "#f5f5f5",
        borderBottom: "1px solid #ddd",
        display: "flex",
        gap: "8px",
        alignItems: "center",
        justifyContent: "flex-start",
        flexWrap: "wrap",
      }}
    >
      {!isAuthenticated && (
        <>
          <Link to="/" style={{ textDecoration: "none" }}>
            <AdaptiveButton style={{ padding: "8px 16px", whiteSpace: "nowrap" }}>Login</AdaptiveButton>
          </Link>

          <Link to="/signup" style={{ textDecoration: "none" }}>
            <AdaptiveButton style={{ padding: "8px 16px", whiteSpace: "nowrap" }}>
              Register
            </AdaptiveButton>
          </Link>
        </>
      )}

      <Link to="/recover" style={{ textDecoration: "none" }}>
        <AdaptiveButton style={{ padding: "8px 16px", whiteSpace: "nowrap" }}>
          Recovery
        </AdaptiveButton>
      </Link>

      {isAuthenticated && (
        <>
          <Link to="/transaction" style={{ textDecoration: "none" }}>
            <AdaptiveButton style={{ padding: "8px 16px", whiteSpace: "nowrap" }}>
              Transaction
            </AdaptiveButton>
          </Link>

          <Link to="/home" style={{ textDecoration: "none" }}>
            <AdaptiveButton style={{ padding: "8px 16px", whiteSpace: "nowrap" }}>Home</AdaptiveButton>
          </Link>

          <Link to="/dashboard" style={{ textDecoration: "none" }}>
            <AdaptiveButton
              style={{
                padding: "8px 16px",
                backgroundColor: "#0066cc",
                whiteSpace: "nowrap",
              }}
            >
              Dashboard
            </AdaptiveButton>
          </Link>

          <AdaptiveButton
            onClick={handleLogout}
            style={{ 
              padding: "8px 16px",
              backgroundColor: "#dc2626",
              whiteSpace: "nowrap",
            }}
          >
            Logout
          </AdaptiveButton>
        </>
      )}
    </nav>
  );
}
