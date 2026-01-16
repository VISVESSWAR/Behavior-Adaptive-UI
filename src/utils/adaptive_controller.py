from persona_classifier import classify_persona
from persona_validator import PersonaValidator
from rl_agent import get_action   # your existing DQN inference

validator = PersonaValidator()

def adaptive_step(mouse_features, state):
    persona_raw, conf = classify_persona(mouse_features)
    persona, status = validator.update(persona_raw, conf)

    action = get_action(state, persona)

    log = {
        "persona_raw": persona_raw,
        "persona_final": persona,
        "confidence": conf,
        "stability": status,
        "action": action
    }

    return action, log
