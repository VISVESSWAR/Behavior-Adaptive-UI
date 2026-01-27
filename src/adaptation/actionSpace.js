export const ACTION_SPACE = {
  0: "noop",

  1: "button_up",
  2: "button_down",

  3: "text_up",
  4: "text_down",

  5: "font_up",
  6: "font_down",

  7: "spacing_up",
  8: "spacing_down",

  9: "enable_tooltips",
};

// Reverse map: action name -> action ID
export const ACTION_ID_MAP = {
  noop: 0,
  button_up: 1,
  button_down: 2,
  text_up: 3,
  text_down: 4,
  font_up: 5,
  font_down: 6,
  spacing_up: 7,
  spacing_down: 8,
  enable_tooltips: 9,
};

export function getActionId(actionName) {
  return ACTION_ID_MAP[actionName] ?? 0;
}
