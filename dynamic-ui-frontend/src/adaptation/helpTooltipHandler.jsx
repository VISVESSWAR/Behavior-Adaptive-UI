import { logEvent } from "../logging/eventLogger.jsx";

/**
 * Handles help tooltip activation for model action 9 (enable_tooltips)
 * Integrates with RL metrics system to track help tooltip triggers
 */
export function handleHelpTooltipAction(helpTooltipContext, uiConfig = {}) {
  if (!helpTooltipContext) {
    console.warn("[HelpTooltipAction] Context not available");
    return;
  }

  const timestamp = new Date().toISOString();

  // Log activation event for RL metrics
  logEvent({
    type: "help_tooltip_activated",
    flowId: "adaptation",
    stepId: "help_tooltip",
    action: "enable_tooltips",
    actionNumber: 9,
    uiConfig: uiConfig,
    timestamp: timestamp,
  });

  // Enable the help tooltip system
  helpTooltipContext.toggleHelpMode(true);

  // Log to metrics collector if available
  if (window.__metricsCollector) {
    window.__metricsCollector.logCustomEvent({
      type: "action_9_triggered",
      action: "enable_tooltips",
      timestamp: timestamp,
      actionIndex: 9,
    });
  }

  console.log("[HelpTooltipAction] Action 9 (enable_tooltips) triggered", {
    timestamp,
    uiConfig,
  });
}

/**
 * Activates a contextual tooltip on a specific element
 * @param {Object} helpTooltipContext - Context from useHelpTooltip
 * @param {HTMLElement} element - The element to highlight
 * @param {Object} contextData - Context data for the tooltip
 */
export function activateElementTooltip(
  helpTooltipContext,
  element,
  contextData = {}
) {
  if (!helpTooltipContext || !element) {
    return;
  }

  helpTooltipContext.activateTooltip(element, {
    type: contextData.type || "default",
    message: contextData.message,
    elementId: element.id,
    className: element.className,
    timestamp: new Date().toISOString(),
  });

  // Log the tooltip activation
  logEvent({
    type: "element_tooltip_shown",
    flowId: "adaptation",
    stepId: "help_tooltip",
    elementId: element.id,
    elementClass: element.className,
    contextType: contextData.type || "default",
    timestamp: new Date().toISOString(),
  });
}

/**
 * Dismiss the current tooltip
 * @param {Object} helpTooltipContext - Context from useHelpTooltip
 */
export function dismissElementTooltip(helpTooltipContext) {
  if (!helpTooltipContext) {
    return;
  }

  helpTooltipContext.dismissTooltip();

  // Log dismissal
  logEvent({
    type: "element_tooltip_dismissed",
    flowId: "adaptation",
    stepId: "help_tooltip",
    timestamp: new Date().toISOString(),
  });
}
