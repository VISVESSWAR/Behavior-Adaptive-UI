import React from "react";

/**
 * AdaptiveDemoControls - Developer-only component for simulating user behavior states
 * 
 * Allows manual control to simulate different behavioral conditions for demonstration purposes.
 * Only renders in development mode.
 * 
 * Simulation states:
 * - confused: Simulates confused user behavior
 * - novice: Simulates novice user behavior  
 * - expert: Simulates expert user behavior
 * - null: Resets simulation (normal mode)
 */
export default function AdaptiveDemoControls() {
  // Only render in development mode
//   if (process.env.NODE_ENV !== "development") {
//     return null;
//   }

  const handleSimulate = (mode) => {
    window.__adaptiveDemoMode = mode;
    console.log(`[AdaptiveUI Demo] Mode set to: ${mode || "null (reset)"}`);
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "16px",
        left: "16px",
        zIndex: 9999,
        backgroundColor: "#1f2937",
        border: "2px solid #3b82f6",
        borderRadius: "8px",
        padding: "12px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        maxWidth: "260px",
      }}
    >
      <div
        style={{
          color: "#e5e7eb",
          fontSize: "11px",
          fontWeight: "600",
          marginBottom: "8px",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        🔧 Adaptive Demo Mode
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <button
          onClick={() => handleSimulate("confused")}
          style={{
            padding: "6px 10px",
            fontSize: "12px",
            fontWeight: "500",
            border: "1px solid #ef4444",
            backgroundColor: "#7f1d1d",
            color: "#fecaca",
            borderRadius: "4px",
            cursor: "pointer",
            transition: "all 200ms ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#991b1b";
            e.target.style.borderColor = "#fca5a5";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "#7f1d1d";
            e.target.style.borderColor = "#ef4444";
          }}
        >
          👤 Simulate Confused
        </button>

        <button
          onClick={() => handleSimulate("novice")}
          style={{
            padding: "6px 10px",
            fontSize: "12px",
            fontWeight: "500",
            border: "1px solid #f59e0b",
            backgroundColor: "#78350f",
            color: "#fed7aa",
            borderRadius: "4px",
            cursor: "pointer",
            transition: "all 200ms ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#92400e";
            e.target.style.borderColor = "#fbbf24";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "#78350f";
            e.target.style.borderColor = "#f59e0b";
          }}
        >
          📚 Simulate Novice
        </button>

        <button
          onClick={() => handleSimulate("expert")}
          style={{
            padding: "6px 10px",
            fontSize: "12px",
            fontWeight: "500",
            border: "1px solid #10b981",
            backgroundColor: "#064e3b",
            color: "#a7f3d0",
            borderRadius: "4px",
            cursor: "pointer",
            transition: "all 200ms ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#065f46";
            e.target.style.borderColor = "#6ee7b7";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "#064e3b";
            e.target.style.borderColor = "#10b981";
          }}
        >
          ⭐ Simulate Expert
        </button>

        <button
          onClick={() => handleSimulate(null)}
          style={{
            padding: "6px 10px",
            fontSize: "12px",
            fontWeight: "500",
            border: "1px solid #6b7280",
            backgroundColor: "#374151",
            color: "#d1d5db",
            borderRadius: "4px",
            cursor: "pointer",
            transition: "all 200ms ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#4b5563";
            e.target.style.borderColor = "#9ca3af";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "#374151";
            e.target.style.borderColor = "#6b7280";
          }}
        >
          🔄 Reset Simulation
        </button>
      </div>

      <div
        style={{
          color: "#9ca3af",
          fontSize: "10px",
          marginTop: "8px",
          paddingTop: "8px",
          borderTop: "1px solid #4b5563",
        }}
      >
        Mode: <strong>{window.__adaptiveDemoMode || "normal"}</strong>
      </div>
    </div>
  );
}
