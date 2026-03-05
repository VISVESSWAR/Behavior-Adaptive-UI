import { useState, useEffect } from "react";
import { useMetricsCollector } from "../context/MetricsContext.jsx";
import { getHelpContentForPage } from "../config/helpContent.js";
import AdaptiveButton from "./AdaptiveButton.jsx";
import { AdaptiveHeading, AdaptiveParagraph } from "./AdaptiveText.jsx";
import useUIVariants from "../adaptation/useUIVariants.jsx";

export default function HelpBar({ pageId = "default", forceOpen = false }) {
  const [isVisible, setIsVisible] = useState(false);
  const [helpContent, setHelpContent] = useState([]);
  const { metricsCollectorRef } = useMetricsCollector();
  const ui = useUIVariants();

  // Load help content for the page
  useEffect(() => {
    const content = getHelpContentForPage(pageId);
    setHelpContent(content);
  }, [pageId]);

  // Handle force open from action 9
  useEffect(() => {
    if (forceOpen) {
      setIsVisible(true);
      console.log("[HelpBar] Help menu auto-opened by action 9");
    }
  }, [forceOpen]);

  // Log visibility toggle to metrics
  const handleToggleVisibility = () => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);

    // Log to metrics collector if available
    if (metricsCollectorRef?.current) {
      const logData = {
        event: "help_toggle",
        timestamp: Date.now(),
        pageId,
        visible: newVisibility,
      };

      console.log("[HelpBar] Help visibility toggled:", logData);
    }
  };

  return (
    <div
      style={{
        backgroundColor: isVisible ? "#f0f7ff" : "transparent",
        borderBottom: isVisible ? "1px solid #d0e0f0" : "none",
        padding: isVisible ? "16px 20px" : "12px 20px",
        transition: "all 0.3s ease",
        minHeight: "44px",
      }}
    >
      {/* Help Toggle Button */}
      <AdaptiveButton
        onClick={handleToggleVisibility}
        style={{
          padding: "8px 14px",
          fontSize: "13px",
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
        }}
        title={isVisible ? "Hide help" : "Show help"}
      >
        <span style={{ fontSize: "16px" }}>?</span>
        {isVisible ? "Hide Help" : "Show Help"}
      </AdaptiveButton>

      {/* Help Content Section */}
      {isVisible && helpContent.length > 0 && (
        <div style={{ marginTop: "16px" }}>
          {helpContent.map((section) => (
            <div key={section.id} style={{ marginBottom: "20px" }}>
              <AdaptiveHeading
                level={3}
                style={{
                  marginBottom: "10px",
                  color: "#0066cc",
                  fontSize: "14px",
                }}
              >
                {section.title}
              </AdaptiveHeading>

              {section.items && section.items.length > 0 ? (
                <ul
                  style={{
                    margin: "0",
                    paddingLeft: "20px",
                    listStyleType: "disc",
                  }}
                >
                  {section.items.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: "6px" }}>
                      <AdaptiveParagraph
                        style={{
                          margin: "0",
                          color: "#555",
                          fontSize: "13px",
                          lineHeight: "1.5",
                        }}
                      >
                        {item}
                      </AdaptiveParagraph>
                    </li>
                  ))}
                </ul>
              ) : (
                <AdaptiveParagraph style={{ color: "#999", fontSize: "13px" }}>
                  No additional help available
                </AdaptiveParagraph>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No help content state */}
      {isVisible && helpContent.length === 0 && (
        <div
          style={{
            marginTop: "12px",
            color: "#999",
            fontSize: "13px",
            fontStyle: "italic",
          }}
        >
          No help content available for this page.
        </div>
      )}
    </div>
  );
}
