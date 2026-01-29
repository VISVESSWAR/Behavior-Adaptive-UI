import { createContext, useContext, useState, useEffect } from "react";
import { applyAction } from "./applyAction";
import { getActionsForPersona } from "./personaActionMapper";
import { getActionId } from "./actionSpace";

const UIContext = createContext();

// Default UI state
const DEFAULT_UI_STATE = {
  buttonSize: 3,
  textSize: 2,
  fontWeight: 2,
  spacing: 1,
  borderRadius: 3,
  shadowLevel: 2,
  lineHeight: 2,
  iconSize: 2,
  cardPadding: 2,
  tooltips: false,
};

const STORAGE_KEY = "ui_preferences";

export function UIProvider({ children, persona = null, metrics = null }) {
  const [uiConfig, setUIConfig] = useState(DEFAULT_UI_STATE);
  const [dqnAction, setDQNAction] = useState(-1);
  const [dqnLoading, setDQNLoading] = useState(false);

  // Load saved preferences on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUIConfig(parsed);
      } catch (error) {
        console.error("Failed to load UI preferences:", error);
      }
    }
  }, []);

  // Save to localStorage whenever uiConfig changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(uiConfig));
  }, [uiConfig]);

  // Monitor DQN action from MetricsCollector
  // DQN action is fetched at snapshot time (every 10 seconds)
  useEffect(() => {
    if (!window.__metricsCollector) return;

    const checkDQNAction = setInterval(() => {
      const dqn = window.__metricsCollector.currentDQNAction;
      if (dqn !== undefined && dqn !== null && dqn !== dqnAction) {
        setDQNAction(dqn);
        console.log(`[UIContext] DQN action updated from collector: ${dqn}`);
      }
    }, 500); // Check every 500ms for new DQN action

    return () => clearInterval(checkDQNAction);
  }, [dqnAction]);

  // Apply automatic persona-based adaptation
  // CRITICAL: Only adapt when DQN action changes (every 10 seconds with snapshot)
  // Fallback to rule-based if DQN unavailable
  useEffect(() => {
    if (!persona || !persona.stable) return;

    let actions = [];

    // PRIORITY 1: Use DQN model prediction if available (fetched at snapshot time)
    if (dqnAction >= 0 && dqnAction <= 9) {
      actions = [dqnAction];
      console.log(
        `[UI Adaptation] Using DQN action: ${dqnAction} for persona ${persona.persona || persona.type}`,
      );
    } 
    // PRIORITY 2: Fallback to rule-based actions
    else {
      actions = getActionsForPersona(persona.persona || persona.type, persona.metrics);
      console.log(
        `[UI Adaptation] Persona detected: ${persona.persona || persona.type} (confidence: ${persona.confidence?.toFixed(2)})`,
        `Using ${actions.length} rule-based actions`,
      );
    }

    // Apply each action sequentially
    if (actions.length > 0) {
      let adaptedConfig = { ...uiConfig };
      actions.forEach((action) => {
        adaptedConfig = applyAction(adaptedConfig, action);
        console.log(
          `[Current UI State] Applied action: ${action} | buttonSize: ${adaptedConfig.buttonSize}, textSize: ${adaptedConfig.textSize}, spacing: ${adaptedConfig.spacing}, tooltips: ${adaptedConfig.tooltips}`,
        );

        // Record each automatic action to metrics collector
        if (window.__metricsCollector) {
          const actionId = getActionId(action);
          window.__metricsCollector.recordAction(actionId);
        }
      });

      // Update UI config with all adaptations
      setUIConfig(adaptedConfig);
    }
  }, [persona?.stable, persona?.type, dqnAction]);

  // Apply an action to update UI state (manual dispatch)
  const dispatchAction = (action) => {
    setUIConfig((prevConfig) => applyAction(prevConfig, action));

    // Record action in metrics collector if available
    if (window.__metricsCollector) {
      window.__metricsCollector.recordAction(action);
      console.log(`[UIContext] Manual action recorded: ${action}`);
    }
  };

  return (
    <UIContext.Provider
      value={{ uiConfig, setUIConfig, dispatchAction, persona, dqnAction, dqnLoading }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUIConfig() {
  return useContext(UIContext);
}
