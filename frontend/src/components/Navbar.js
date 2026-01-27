import { Link } from "react-router-dom";
import AdaptiveButton from "./AdaptiveButton";

export default function Navbar() {
  return (
    <nav
      style={{
        padding: "15px 20px",
        backgroundColor: "#f5f5f5",
        borderBottom: "1px solid #ddd",
        display: "flex",
        gap: "10px",
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <Link to="/" style={{ textDecoration: "none" }}>
        <AdaptiveButton style={{ padding: "8px 16px" }}>Login</AdaptiveButton>
      </Link>

      <Link to="/signup" style={{ textDecoration: "none" }}>
        <AdaptiveButton style={{ padding: "8px 16px" }}>
          Register
        </AdaptiveButton>
      </Link>

      <Link to="/recover" style={{ textDecoration: "none" }}>
        <AdaptiveButton style={{ padding: "8px 16px" }}>
          Recovery
        </AdaptiveButton>
      </Link>

      <Link to="/transaction" style={{ textDecoration: "none" }}>
        <AdaptiveButton style={{ padding: "8px 16px" }}>
          Transaction
        </AdaptiveButton>
      </Link>

      <Link to="/home" style={{ textDecoration: "none" }}>
        <AdaptiveButton style={{ padding: "8px 16px" }}>Home</AdaptiveButton>
      </Link>

      <Link to="/dashboard" style={{ textDecoration: "none" }}>
        <AdaptiveButton
          style={{
            padding: "8px 16px",
            backgroundColor: "#0066cc",
            color: "white",
          }}
        >
          Dashboard
        </AdaptiveButton>
      </Link>
    </nav>
  );
}
