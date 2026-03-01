import { createContext, useState, useCallback } from "react";

export const HelpTooltipContext = createContext();

export function HelpTooltipProvider({ children }) {
  // Global state for help tooltip system
  const [isEnabled, setIsEnabled] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Activate help tooltip with context
  const activateTooltip = useCallback((element, context = {}) => {
    if (!element) return;

    // Get element position
    const rect = element.getBoundingClientRect();
    const position = {
      x: rect.left + rect.width / 2,
      y: rect.top - 10, // Position above element
      elementRect: rect,
    };

    setTooltipPosition(position);
    setActiveTooltip({
      context,
      targetElement: element,
      timestamp: new Date().toISOString(),
    });
  }, []);

  // Dismiss current tooltip
  const dismissTooltip = useCallback(() => {
    setActiveTooltip(null);
  }, []);

  // Toggle help tooltip system
  const toggleHelpMode = useCallback((enabled) => {
    setIsEnabled(enabled);
    if (!enabled) {
      dismissTooltip();
    }
  }, [dismissTooltip]);

  const value = {
    isEnabled,
    setIsEnabled,
    activeTooltip,
    tooltipPosition,
    activateTooltip,
    dismissTooltip,
    toggleHelpMode,
  };

  return (
    <HelpTooltipContext.Provider value={value}>
      {children}
    </HelpTooltipContext.Provider>
  );
}
