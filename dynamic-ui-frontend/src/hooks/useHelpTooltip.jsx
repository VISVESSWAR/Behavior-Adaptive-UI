import { useContext } from "react";
import { HelpTooltipContext } from "../context/HelpTooltipContext.jsx";

/**
 * Hook to access and control the help tooltip system
 * @returns {Object} HelpTooltip context with methods and state
 */
export function useHelpTooltip() {
  const context = useContext(HelpTooltipContext);

  if (!context) {
    throw new Error(
      "useHelpTooltip must be used within HelpTooltipProvider"
    );
  }

  return context;
}
