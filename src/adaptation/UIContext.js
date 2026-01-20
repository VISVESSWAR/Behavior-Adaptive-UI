import { createContext, useContext, useState, useEffect } from "react";
import { applyAction } from "./applyAction";
import { getActionsForPersona } from "./personaActionMapper";

const UIContext = createContext();

// Default UI state
const DEFAULT_UI_STATE = {
  buttonSize: 1,
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

  // Apply automatic persona-based adaptation when persona changes
  useEffect(() => {
    if (persona && persona.stable) {
      // Pass both persona AND metrics to action mapper for RL-based decisions
      const actions = getActionsForPersona(persona.persona, persona.metrics);
      console.log(
        `[UI Adaptation] Persona detected: ${persona.persona} (confidence: ${persona.confidence})`,
        actions,
      );

      // Apply each action sequentially
      let adaptedConfig = uiConfig;
      actions.forEach((action) => {
        adaptedConfig = applyAction(adaptedConfig, action);
        console.log(`[UI Adaptation] Applied action: ${action}`);
      });

      // Update UI config with all adaptations
      setUIConfig(adaptedConfig);
    }
  }, [persona?.persona, persona?.stable, persona?.metrics]); // Trigger when persona or metrics change

  // Apply an action to update UI state
  const dispatchAction = (action) => {
    setUIConfig((prevConfig) => applyAction(prevConfig, action));
  };

  return (
    <UIContext.Provider
      value={{ uiConfig, setUIConfig, dispatchAction, persona }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUIConfig() {
  return useContext(UIContext);
}
