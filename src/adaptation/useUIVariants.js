import {
  BUTTON_SIZES,
  TEXT_SIZES,
  FONT_WEIGHTS,
  SPACING_LEVELS
} from "./uiLevels";

export default function getUIVariants(uiState) {
  return {
    button: BUTTON_SIZES[uiState.buttonSize],
    text: TEXT_SIZES[uiState.textSize],
    font: FONT_WEIGHTS[uiState.fontWeight],
    spacing: SPACING_LEVELS[uiState.spacing],
    tooltips: uiState.tooltips
  };
}
