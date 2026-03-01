import { handleHelpTooltipAction, activateElementTooltip } from "./helpTooltipHandler.jsx";
import { ACTION_SPACE } from "./actionSpace.jsx";

/**
 * Integrates help tooltip system with DQN action application
 * Triggers help tooltips when model action 9 (enable_tooltips) is selected
 */
export class HelpTooltipIntegration {
  constructor(helpTooltipContext, uiConfig) {
    this.helpTooltipContext = helpTooltipContext;
    this.uiConfig = uiConfig;
    this.isActive = false;
  }

  /**
   * Should be called when an action is selected by the DQN model
   * @param {number} actionIndex - The action index (0-9)
   * @param {string} actionName - The action name (e.g., "enable_tooltips")
   * @param {Object} uiConfig - Current UI configuration
   */
  handleActionApplied(actionIndex, actionName, uiConfig = {}) {
    // Action 9 is "enable_tooltips"
    if (actionIndex === 9 || actionName === "enable_tooltips") {
      handleHelpTooltipAction(this.helpTooltipContext, uiConfig);
      this.isActive = true;
      return true;
    }
    return false;
  }

  /**
   * Activates a tooltip on the next interactive element
   * Called automatically after action 9 is triggered
   */
  findAndActivateNextElement() {
    if (!this.isActive || !this.helpTooltipContext) {
      return;
    }

    // Find interactive elements in priority order
    const prioritySelectors = [
      "button:not(:disabled)",      // First priority: buttons
      "input:not(:disabled)",       // Second: inputs
      "a[href]",                     // Third: links
      "[role='button']",             // Fourth: button roles
      "[data-interactive]",          // Fifth: marked interactive elements
    ];

    for (const selector of prioritySelectors) {
      const element = document.querySelector(selector);
      if (element && element.offsetParent !== null) { // Element is visible
        const contextType = this.getElementContextType(element);
        activateElementTooltip(this.helpTooltipContext, element, {
          type: contextType,
          message: this.getContextMessage(contextType),
        });
        return;
      }
    }
  }

  /**
   * Determine context type based on element
   */
  getElementContextType(element) {
    const tag = element.tagName.toLowerCase();
    const className = element.className || "";

    if (tag === "button" || element.getAttribute("role") === "button") {
      return "button";
    }
    if (tag === "input") {
      const type = element.getAttribute("type") || "text";
      return `input_${type}`;
    }
    if (tag === "a") {
      return "navigation";
    }
    if (className.includes("form")) {
      return "form";
    }
    if (className.includes("transaction")) {
      return "transaction";
    }
    if (className.includes("recovery")) {
      return "recovery";
    }
    return "default";
  }

  /**
   * Get contextual help message for element type
   */
  getContextMessage(contextType) {
    const messages = {
      button: "Click this button to perform the action. Try it out!",
      input_email: "Enter your email address here.",
      input_password: "Enter your password securely.",
      input_text: "Type your information in this field.",
      input_number: "Enter a number here.",
      navigation: "Click here to navigate to a different page.",
      form: "Fill out this form to proceed with your task.",
      transaction: "Review your transaction details carefully before confirming.",
      recovery: "Follow the recovery steps to regain access to your account.",
      settings: "Adjust your preferences using these options.",
      default: "Try interacting with this element!",
    };

    return messages[contextType] || messages.default;
  }

  /**
   * Dismiss the current tooltip
   */
  dismiss() {
    if (this.helpTooltipContext) {
      this.helpTooltipContext.dismissTooltip();
    }
  }

  /**
   * Toggle help mode on/off
   */
  toggle(enabled) {
    if (this.helpTooltipContext) {
      this.helpTooltipContext.toggleHelpMode(enabled);
      this.isActive = enabled;
    }
  }

  /**
   * Check if help mode is active
   */
  getIsActive() {
    return this.isActive && this.helpTooltipContext?.isEnabled;
  }
}

/**
 * Hook to create help tooltip integration
 * Usage: const helpIntegration = useHelpTooltipIntegration()
 */
export function createHelpTooltipIntegration(helpTooltipContext, uiConfig) {
  return new HelpTooltipIntegration(helpTooltipContext, uiConfig);
}
