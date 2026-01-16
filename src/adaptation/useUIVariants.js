import { useUIConfig } from "./UIContext";
import {
  BUTTON_SIZES,
  TEXT_SIZES,
  INPUT_SIZES,
  FONT_WEIGHTS,
  SPACING_LEVELS,
} from "./uiVariants";

export default function useUIVariants() {
  const { uiConfig } = useUIConfig();

  if (!uiConfig) {
    return {
      button: BUTTON_SIZES[1],
      input: INPUT_SIZES[1],
      text: TEXT_SIZES[1],
      font: FONT_WEIGHTS[0],
      spacing: SPACING_LEVELS[1],
      tooltips: false,
    };
  }

  return {
    button: BUTTON_SIZES[uiConfig.buttonSize] || BUTTON_SIZES[1],
    input: INPUT_SIZES[uiConfig.textSize] || INPUT_SIZES[1],
    text: TEXT_SIZES[uiConfig.textSize] || TEXT_SIZES[1],
    font: FONT_WEIGHTS[uiConfig.fontWeight] || FONT_WEIGHTS[0],
    spacing: SPACING_LEVELS[uiConfig.spacing] || SPACING_LEVELS[1],
    tooltips: uiConfig.tooltips || false,
  };
}
