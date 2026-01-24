import {
  BUTTON_SIZES,
  TEXT_SIZES,
  FONT_WEIGHTS,
  SPACING_LEVELS,
} from "./uiVariants";

export function applyAction(uiState, action) {
  const next = { ...uiState };

  switch (action) {
    case "button_up":
      next.buttonSize = Math.min(next.buttonSize + 1, BUTTON_SIZES.length - 1);
      break;

    case "button_down":
      next.buttonSize = Math.max(next.buttonSize - 1, 0);
      break;

    case "text_up":
      next.textSize = Math.min(next.textSize + 1, TEXT_SIZES.length - 1);
      break;

    case "text_down":
      next.textSize = Math.max(next.textSize - 1, 0);
      break;

    case "font_up":
      next.fontWeight = Math.min(next.fontWeight + 1, FONT_WEIGHTS.length - 1);
      break;

    case "font_down":
      next.fontWeight = Math.max(next.fontWeight - 1, 0);
      break;

    case "spacing_up":
      next.spacing = Math.min(next.spacing + 1, SPACING_LEVELS.length - 1);
      break;

    case "spacing_down":
      next.spacing = Math.max(next.spacing - 1, 0);
      break;

    case "enable_tooltips":
      next.tooltips = true;
      break;

    default:
      break;
  }

  return next;
}
