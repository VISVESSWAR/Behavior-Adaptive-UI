import React, { createContext, useContext, useRef } from "react";

const MetricsContext = createContext(null);

export function MetricsProvider({ children }) {
  const metricsCollectorRef = useRef(null);

  return (
    <MetricsContext.Provider value={{ metricsCollectorRef }}>
      {children}
    </MetricsContext.Provider>
  );
}

export function useMetricsCollector() {
  const context = useContext(MetricsContext);
  if (!context) {
    console.warn(
      "[useMetricsCollector] Not wrapped in MetricsProvider. Returning null.",
    );
    return { metricsCollectorRef: { current: null } };
  }
  return context;
}
