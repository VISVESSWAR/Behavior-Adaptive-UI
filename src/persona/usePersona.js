import { useEffect, useRef, useState } from "react";
import { classifyPersona } from "./personaClassifier";
import { PersonaValidator } from "./personaValidator";
import { adaptMetrics } from "./metricAdapter";

export function usePersona(metrics) {
  const validatorRef = useRef(new PersonaValidator());
  const [personaState, setPersonaState] = useState({
    persona: "intermediate",
    stable: false,
    metrics: null,
  });

  useEffect(() => {
    if (!metrics) return;

    const adapted = adaptMetrics(metrics);
    if (!adapted) return;

    const { persona, confidence } = classifyPersona(adapted);
    const result = validatorRef.current.update(persona, confidence);

    setPersonaState({
      ...result,
      metrics: adapted, // Include adapted metrics for RL model
    });
  }, [metrics]);

  return personaState;
}
