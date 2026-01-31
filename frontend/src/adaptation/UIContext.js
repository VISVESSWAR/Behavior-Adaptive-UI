import { createContext, useContext, useState, useEffect } from "react";
import { applyAction } from "./applyAction";
import { getActionsForPersona, getCooldownManager } from "./personaActionMapper";
import { getActionId, ACTION_SPACE } from "./actionSpace";

const UIContext = createContext();

const DEFAULT_UI_STATE = {
  buttonSize: 2,
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

export function UIProvider({ children, persona = null }) {
  const [uiConfig, setUIConfig] = useState(DEFAULT_UI_STATE);
  const [dqnAction, setDQNAction] = useState(-1);
  const [finalAction, setFinalAction] = useState(-1); // Track final action separately
  const cooldownManager = getCooldownManager();

  const personaType = persona?.persona || persona?.type;
  const personaStable = persona?.stable;

  // Load saved preferences
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setUIConfig(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load UI preferences:", e);
      }
    }
  }, []);

  // Persist preferences
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(uiConfig));
  }, [uiConfig]);

  // 🔹 Read FINAL action from collector (after exploration + cooldown)
  // Keep model action only for debugging display
  useEffect(() => {
    const interval = setInterval(() => {
      if (window.__metricsCollector) {
        // Use final action (after exploration + cooldown) for UI adaptation
        const newFinalAction = window.__metricsCollector.currentFinalAction ?? -1;
        // Keep model action only for debugging in AdaptationDebugger
        const modelAction = window.__metricsCollector.currentModelAction ?? -1;
        
        // Update final action state to trigger UI adaptation
        setFinalAction(prev => {
          if (prev !== newFinalAction) {
            console.log(`[UIContext] Final action changed: ${prev} → ${newFinalAction}, Model action: ${modelAction}`);
            return newFinalAction;
          }
          return prev;
        });
        
        setDQNAction(prev => (prev !== modelAction ? modelAction : prev));
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // 🔹 Apply adaptation ONLY when snapshot-level action changes
  // Use FINAL action (after exploration + cooldown), not model action
  useEffect(() => {
    if (!personaStable) return;

    // Tick cooldown each decision cycle
    cooldownManager.tick();

    let actions = [];

    if (finalAction >= 0 && finalAction <= 9) {
      // 🔹 CRITICAL: Convert action ID (number) to action name (string)
      const actionName = ACTION_SPACE[finalAction];
      if (actionName && actionName !== "noop") { // Skip noop action
        actions = [actionName];
        console.log(`[UI Adaptation] Applying final action: ${finalAction} (${actionName})`);
      } else {
        console.log(`[UI Adaptation] Final action is noop (${finalAction}), skipping`);
      }
    } else {
      actions = getActionsForPersona(personaType, null, cooldownManager);
      console.log(`[UI Adaptation] Using rule-based actions for ${personaType}`);
    }

    if (actions.length === 0) return;

    // ✅ FIX: Functional state update to avoid stale uiConfig
    setUIConfig(prevConfig => {
      let adaptedConfig = { ...prevConfig };

      actions.forEach(action => {
        adaptedConfig = applyAction(adaptedConfig, action);

        // Apply cooldown to prevent rapid repeats
        cooldownManager.applyCooldown(action);

        if (window.__metricsCollector) {
          window.__metricsCollector.recordAction(getActionId(action));
        }
      });

      console.log(
        `[Current UI State] buttonSize:${adaptedConfig.buttonSize}, textSize:${adaptedConfig.textSize}, spacing:${adaptedConfig.spacing}, tooltips:${adaptedConfig.tooltips}`
      );

      return adaptedConfig;
    });

  }, [personaType, personaStable, finalAction]); // finalAction is now a state dependency

  const dispatchAction = action => {
    setUIConfig(prev => applyAction(prev, action));
    
    // Apply cooldown to manually dispatched actions
    cooldownManager.applyCooldown(action);
    
    if (window.__metricsCollector) {
      window.__metricsCollector.recordAction(action);
    }
  };

  return (
    <UIContext.Provider value={{ uiConfig, dispatchAction, persona, dqnAction }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUIConfig() {
  return useContext(UIContext);
}