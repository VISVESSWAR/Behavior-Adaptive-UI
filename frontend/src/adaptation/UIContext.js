import { createContext, useContext, useState, useEffect } from "react";
import { applyAction } from "./applyAction";
import { getActionsForPersona, getCooldownManager } from "./personaActionMapper";
import { getActionId } from "./actionSpace";

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

  // 🔹 Read DQN action from collector (single source of truth)
  useEffect(() => {
    const interval = setInterval(() => {
      if (window.__metricsCollector) {
        const action = window.__metricsCollector.currentDQNAction ?? -1;
        setDQNAction(prev => (prev !== action ? action : prev));
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // 🔹 Apply adaptation ONLY when snapshot-level action changes
  useEffect(() => {
    if (!personaStable) return;

    // Tick cooldown each decision cycle
    cooldownManager.tick();

    let actions = [];

    if (dqnAction >= 0 && dqnAction <= 9) {
      actions = [dqnAction];
      console.log(`[UI Adaptation] Using DQN action: ${dqnAction}`);
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

  }, [personaType, personaStable, dqnAction]);

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