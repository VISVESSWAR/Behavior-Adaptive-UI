import { useContext, useEffect, useState } from "react";
import { HelpTooltipContext } from "../context/HelpTooltipContext.jsx";

// Tooltip messages for different contexts
const TOOLTIP_MESSAGES = {
  button: "Click this button to perform the action",
  input: "Enter your information here",
  form: "Complete this form to continue",
  navigation: "Navigate using this menu",
  transaction: "Review transaction details carefully",
  recovery: "Follow the recovery steps",
  settings: "Adjust your preferences",
  default: "Need help? This element provides additional functionality",
};

export default function HelpTooltip({ forceOpen = false }) {
  const {
    isEnabled,
    activeTooltip,
    tooltipPosition,
    dismissTooltip,
    toggleHelpMode,
  } = useContext(HelpTooltipContext);

  const [isVisible, setIsVisible] = useState(false);

  // Handle action 9 - auto-enable help mode
  useEffect(() => {
    if (forceOpen) {
      toggleHelpMode(true);
      console.log("[HelpTooltip] Help mode auto-enabled by action 9");
      // Auto-disable after 30 seconds to not be intrusive
      const timer = setTimeout(() => {
        toggleHelpMode(false);
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [forceOpen, toggleHelpMode]);

  // Show/hide with fade effect
  useEffect(() => {
    if (isEnabled && activeTooltip) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isEnabled, activeTooltip]);

  if (!isEnabled || !activeTooltip) {
    return null;
  }

  // Get appropriate tooltip message
  const contextType = activeTooltip.context.type || "default";
  const customMessage = activeTooltip.context.message;
  const tooltipMessage = customMessage || TOOLTIP_MESSAGES[contextType] || TOOLTIP_MESSAGES.default;

  // Calculate tooltip position (centered above element)
  const tooltipWidth = 280;
  const tooltipHeight = 100;
  const tooltipLeft = Math.max(10, tooltipPosition.x - tooltipWidth / 2);
  const tooltipTop = tooltipPosition.y - tooltipHeight - 10;

  return (
    <div
      style={{
        position: "fixed",
        zIndex: 10000,
        pointerEvents: "none", // Non-blocking overlay
      }}
    >
      {/* Tooltip Box */}
      <div
        style={{
          position: "fixed",
          left: `${tooltipLeft}px`,
          top: `${Math.max(10, tooltipTop)}px`,
          backgroundColor: "#1f2937",
          color: "#f3f4f6",
          padding: "12px 16px",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: "500",
          maxWidth: `${tooltipWidth}px`,
          lineHeight: "1.4",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
          border: "1px solid #374151",
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0)" : "translateY(-8px)",
          transition: "all 0.2s ease-out",
          pointerEvents: "auto",
        }}
      >
        <div style={{ marginBottom: "8px", fontWeight: "600", color: "#60a5fa" }}>
          💡 Help
        </div>
        <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.5" }}>
          {tooltipMessage}
        </p>

        {/* Dismiss Button */}
        <button
          onClick={() => dismissTooltip()}
          style={{
            marginTop: "10px",
            padding: "4px 8px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "12px",
            cursor: "pointer",
            fontWeight: "500",
            pointerEvents: "auto",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#2563eb")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#3b82f6")}
        >
          Got it
        </button>
      </div>

      {/* Highlight the target element with a subtle border effect */}
      {activeTooltip.targetElement && (
        <div
          style={{
            position: "fixed",
            left: `${activeTooltip.targetElement.getBoundingClientRect().left}px`,
            top: `${activeTooltip.targetElement.getBoundingClientRect().top}px`,
            width: `${activeTooltip.targetElement.getBoundingClientRect().width}px`,
            height: `${activeTooltip.targetElement.getBoundingClientRect().height}px`,
            border: "2px solid #60a5fa",
            borderRadius: "6px",
            boxShadow: "0 0 0 3px rgba(96, 165, 250, 0.1), inset 0 0 0 2px rgba(96, 165, 250, 0.2)",
            pointerEvents: "none",
            animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
          }}
        />
      )}

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1), inset 0 0 0 2px rgba(96, 165, 250, 0.2);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(96, 165, 250, 0.05), inset 0 0 0 2px rgba(96, 165, 250, 0.3);
          }
        }
      `}</style>
    </div>
  );
}
