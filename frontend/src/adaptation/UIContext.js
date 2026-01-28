import { createContext, useContext, useState, useEffect } from "react";
import { applyAction } from "./applyAction";
import { getActionsForPersona } from "./personaActionMapper";

const UIContext = createContext();

// Default UI state
const DEFAULT_UI_STATE = {
  buttonSize: 1,
  textSize: 5,
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

  // Apply automatic persona-based adaptation when persona changes and becomes stable
  useEffect(() => {
    if (persona && persona.stable && persona.type) {
      const personaType = persona.type || persona.persona;

      // Get recommended actions based on stable persona and metrics
      const actions = getActionsForPersona(personaType, persona.metrics);
      console.log(
        `[UI Adaptation] Persona stable: ${personaType} (confidence: ${persona.confidence?.toFixed(2) || "N/A"})`,
        { persona, recommendedActions: actions },
      );

      // Apply each action sequentially to UI config
      let adaptedConfig = { ...uiConfig };
      actions.forEach((action) => {
        adaptedConfig = applyAction(adaptedConfig, action, personaType);
      });

      // Update UI config with all persona-based adaptations
      if (JSON.stringify(adaptedConfig) !== JSON.stringify(uiConfig)) {
        console.log(
          `[UI Adaptation] UI config updated for persona: ${personaType}`,
          { previousConfig: uiConfig, newConfig: adaptedConfig },
        );
        setUIConfig(adaptedConfig);
      }
    }
  }, [persona?.type, persona?.stable, persona?.metrics]); // Trigger when persona type changes or becomes stable

  // Apply an action to update UI state (can be called manually or from persona adaptation)
  const dispatchAction = (action, actionPersona = null) => {
    const personaStr = actionPersona || persona?.type || null;
    setUIConfig((prevConfig) => applyAction(prevConfig, action, personaStr));
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
