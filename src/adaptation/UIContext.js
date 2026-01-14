import { createContext, useContext, useState } from "react";
import { ACTION_SPACE } from "./actionSpace";

const UIContext = createContext();

export function UIProvider({ children }) {
  const [actionId, setActionId] = useState(0);

  const uiConfig = ACTION_SPACE[actionId];

  return (
    <UIContext.Provider value={{ uiConfig, setActionId }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUIConfig() {
  return useContext(UIContext);
}
