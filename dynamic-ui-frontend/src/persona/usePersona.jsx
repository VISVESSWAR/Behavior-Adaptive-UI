import { useEffect, useRef, useState } from "react";
import { classifyPersona } from "./personaClassifier.jsx";
import { PersonaValidator } from "./personaValidator.jsx";
import { adaptMetrics } from "./metricAdapter.jsx";

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

  setPersonaState(prev => {
    if (
      prev.persona === result.persona &&
      prev.stable === result.stable &&
      prev.confidence === result.confidence
    ) {
      return prev; // 🚀 prevents rerender loop
    }

    return {
      ...result,
      metrics: adapted
    };
  });

}, [metrics]);

  return personaState;
}
