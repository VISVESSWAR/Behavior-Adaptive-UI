// metrics must be NORMALIZED (0–1) OR consistently scaled
export function classifyPersona(m) {
  if (!m) return { persona: "intermediate", confidence: 0.5 };

  const {
    vel_mean,
    idle,
    hesitation,
    misclicks
  } = m;

  // Novice / elderly
  if (
    vel_mean < 0.4 &&
    (idle > 0.6 || hesitation > 0.6 || misclicks > 0.3)
  ) {
    return { persona: "novice_old", confidence: 0.85 };
  }

  // Expert
  if (
    vel_mean > 0.7 &&
    idle < 0.3 &&
    hesitation < 0.3 &&
    misclicks < 0.2
  ) {
    return { persona: "expert", confidence: 0.85 };
  }

  // Default
  return { persona: "intermediate", confidence: 0.7 };
}
