import React, { useState, useEffect } from "react";
import { getLastAdaptiveResponse } from "../utils/dqnAdapter.jsx";

/**
 * AdaptiveDecisionPanel - Displays the current model decision
 *
 * Shows:
 * - Current persona type
 * - Predicted action name
 * - Model confidence (0-1)
 *
 * Updates whenever a new adaptive-action response is received.
 */
export default function AdaptiveDecisionPanel() {
  const [decision, setDecision] = useState(null);

  // Poll for adaptive response updates every 500ms
  useEffect(() => {
    const interval = setInterval(() => {
      const response = getLastAdaptiveResponse();
      if (response) {
        setDecision(response);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  if (!decision) {
    return null;
  }

  // Get current persona from global state
  const currentPersona = window.__currentPersona;
  const personaDisplayName =
    currentPersona?.type ||
    currentPersona?.persona ||
    "unknown";

  return (
    <div
      style={{
        position: "fixed",
        bottom: "16px",
        left: "16px",
        zIndex: 9998,
        backgroundColor: "#0f172a",
        border: "1.5px solid #0ea5e9",
        borderRadius: "6px",
        padding: "12px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        minWidth: "220px",
      }}
    >
      {/* Header */}
      <div
        style={{
          color: "#0ea5e9",
          fontSize: "11px",
          fontWeight: "700",
          marginBottom: "8px",
          textTransform: "uppercase",
          letterSpacing: "0.8px",
        }}
      >
        ⚙️ Adaptive Decision
      </div>

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        {/* Persona */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              color: "#cbd5e1",
              fontSize: "12px",
              fontWeight: "500",
            }}
          >
            Persona:
          </span>
          <span
            style={{
              color: "#fbbf24",
              fontSize: "12px",
              fontWeight: "600",
              backgroundColor: "#78350f",
              padding: "2px 6px",
              borderRadius: "3px",
            }}
          >
            {personaDisplayName}
          </span>
        </div>

        {/* Action */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              color: "#cbd5e1",
              fontSize: "12px",
              fontWeight: "500",
            }}
          >
            Action:
          </span>
          <span
            style={{
              color: "#86efac",
              fontSize: "12px",
              fontWeight: "600",
              backgroundColor: "#1b4332",
              padding: "2px 6px",
              borderRadius: "3px",
            }}
          >
            {decision.action_name || "unknown"}
          </span>
        </div>

        {/* Confidence */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              color: "#cbd5e1",
              fontSize: "12px",
              fontWeight: "500",
            }}
          >
            Confidence:
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <div
              style={{
                width: "50px",
                height: "4px",
                backgroundColor: "#1e293b",
                borderRadius: "2px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${(decision.confidence || 0) * 100}%`,
                  height: "100%",
                  backgroundColor:
                    (decision.confidence || 0) > 0.7
                      ? "#10b981"
                      : (decision.confidence || 0) > 0.5
                        ? "#f59e0b"
                        : "#ef4444",
                  transition: "width 300ms ease",
                }}
              />
            </div>
            <span
              style={{
                color: "#94a3b8",
                fontSize: "11px",
                fontWeight: "500",
                minWidth: "28px",
              }}
            >
              {((decision.confidence || 0) * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Reason */}
      {decision.reason && (
        <div
          style={{
            marginTop: "8px",
            paddingTop: "8px",
            borderTop: "1px solid #334155",
            color: "#94a3b8",
            fontSize: "10px",
            fontStyle: "italic",
          }}
        >
          {decision.reason}
        </div>
      )}
    </div>
  );
}
