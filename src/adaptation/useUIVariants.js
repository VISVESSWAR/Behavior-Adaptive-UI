import { useUIConfig } from "./UIContext";
import {
  BUTTON_SIZES,
  TEXT_SIZES,
  INPUT_SIZES,
  FONT_WEIGHTS,
  SPACING_LEVELS,
  BORDER_RADIUS,
  SHADOW_LEVELS,
  LINE_HEIGHTS,
  ICON_SIZES,
  CARD_PADDING,
} from "./uiVariants";

export default function useUIVariants() {
  const { uiConfig } = useUIConfig();

  return {
    button: BUTTON_SIZES[uiConfig.buttonSize] || BUTTON_SIZES[2],
    input: INPUT_SIZES[uiConfig.textSize] || INPUT_SIZES[2],
    text: TEXT_SIZES[uiConfig.textSize] || TEXT_SIZES[2],
    font: FONT_WEIGHTS[uiConfig.fontWeight] || FONT_WEIGHTS[1],
    spacing: SPACING_LEVELS[uiConfig.spacing] || SPACING_LEVELS[2],
    radius: BORDER_RADIUS[uiConfig.borderRadius] || BORDER_RADIUS[3],
    shadow: SHADOW_LEVELS[uiConfig.shadowLevel] || SHADOW_LEVELS[2],
    lineHeight: LINE_HEIGHTS[uiConfig.lineHeight] || LINE_HEIGHTS[2],
    icon: ICON_SIZES[uiConfig.iconSize] || ICON_SIZES[2],
    cardPadding: CARD_PADDING[uiConfig.cardPadding] || CARD_PADDING[2],
    tooltips: uiConfig.tooltips || false,
  };
}
