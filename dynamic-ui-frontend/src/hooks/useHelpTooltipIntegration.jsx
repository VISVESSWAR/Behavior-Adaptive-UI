/**
 * Example: Integrating Help Tooltip System into a Page Component
 * 
 * This example shows how to integrate the Help Tooltip system with
 * DQN action handling in a React component.
 */

import { useRef, useEffect } from "react";
import { useHelpTooltip } from "../hooks/useHelpTooltip.jsx";
import { useUIConfig } from "../adaptation/UIContext.jsx";
import { createHelpTooltipIntegration } from "../adaptation/helpTooltipIntegration.jsx";
import { logEvent } from "../logging/eventLogger.jsx";

/**
 * Example hook for integrating help tooltips in components
 * 
 * Usage:
 * ```jsx
 * const { handleDQNAction } = useHelpTooltipIntegration();
 * 
 * // When action is applied:
 * handleDQNAction(9, "enable_tooltips");
 * ```
 */
export function useHelpTooltipIntegration() {
  const helpTooltip = useHelpTooltip();
  const { uiConfig } = useUIConfig();
  const integrationRef = useRef(null);

  // Initialize integration
  useEffect(() => {
    integrationRef.current = createHelpTooltipIntegration(
      helpTooltip,
      uiConfig
    );
  }, [helpTooltip, uiConfig]);

  /**
   * Call this when a DQN action is applied
   * @param {number} actionIndex - Action index 0-9
   * @param {string} actionName - Action name
   * @returns {boolean} - True if action 9 was triggered
   */
  const handleDQNAction = (actionIndex, actionName) => {
    if (!integrationRef.current) return false;

    const isAction9 = integrationRef.current.handleActionApplied(
      actionIndex,
      actionName,
      uiConfig
    );

    if (isAction9) {
      // Auto-find and highlight first interactive element
      integrationRef.current.findAndActivateNextElement();
    }

    return isAction9;
  };

  return {
    handleDQNAction,
    integration: integrationRef.current,
    isActive: integrationRef.current?.getIsActive?.(),
    dismiss: () => integrationRef.current?.dismiss?.(),
    toggle: (enabled) => integrationRef.current?.toggle?.(enabled),
  };
}

/**
 * Example Component: TransactionPage with Help Tooltip Integration
 * 
 * This shows how to integrate help tooltips into an existing component
 * that handles DQN actions.
 */
export function TransactionPageWithHelpExample() {
  const { handleDQNAction } = useHelpTooltipIntegration();

  // When collecting metrics snapshot and getting DQN action
  const onDQNActionSelected = (actionIndex, actionName) => {
    console.log(`[TransactionPage] DQN Action ${actionIndex}: ${actionName}`);

    // Handle action 9 (enable_tooltips) automatically
    const isHelpAction = handleDQNAction(actionIndex, actionName);

    if (isHelpAction) {
      console.log("[TransactionPage] Help tooltip activated!");
      // The help system will:
      // 1. Find the first interactive element
      // 2. Show a contextual tooltip
      // 3. Log metrics for RL training
      // No additional code needed!
    }

    // Handle other UI adaptation actions
    switch (actionName) {
      case "button_up":
        // Increase button size
        break;
      case "text_up":
        // Increase text size
        break;
      // ... other actions
    }
  };

  return (
    <div>
      {/* Your component content */}
      {/* Help tooltips will automatically appear when action 9 is triggered */}
    </div>
  );
}

/**
 * Example: Manual Help Tooltip Triggering
 * 
 * If you want to manually show help for a specific element:
 */
export function ManualHelpExample() {
  const helpTooltip = useHelpTooltip();
  const submitButtonRef = useRef(null);

  const handleShowHelp = () => {
    import("../adaptation/helpTooltipHandler.jsx").then(
      ({ activateElementTooltip }) => {
        if (submitButtonRef.current) {
          activateElementTooltip(helpTooltip, submitButtonRef.current, {
            type: "button",
            message: "Click here to submit your transaction securely.",
          });
        }
      }
    );
  };

  return (
    <div>
      <button ref={submitButtonRef} onClick={() => {}}>
        Submit Transaction
      </button>
      <button onClick={handleShowHelp}>Help?</button>
    </div>
  );
}

/**
 * Integration Points in Existing Code:
 * 
 * 1. In metricsCollectorSimplified.jsx:
 *    - When action 9 is selected, call handleDQNAction(9, "enable_tooltips")
 * 
 * 2. In applyAction.jsx:
 *    - After applying action 9, trigger help tooltip activation
 * 
 * 3. In AdaptiveButton.jsx / AdaptiveInput.jsx:
 *    - Optionally register with help system for auto-highlighting
 * 
 * 4. In page components:
 *    - Use useHelpTooltipIntegration() hook to handle action 9
 * 
 * Example in page component:
 * ```jsx
 * function MyPage() {
 *   const { handleDQNAction } = useHelpTooltipIntegration();
 *   
 *   // When DQN action is selected:
 *   const applyUIAdaptation = (action) => {
 *     handleDQNAction(action.index, action.name);
 *     // Rest of action handling...
 *   };
 *   
 *   return <div>...</div>;
 * }
 * ```
 */

export default useHelpTooltipIntegration;
