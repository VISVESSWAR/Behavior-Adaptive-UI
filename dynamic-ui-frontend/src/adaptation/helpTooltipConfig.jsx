// Help Tooltip System Configuration
// Complete documentation available in HELP_TOOLTIP_SYSTEM.md

export const HELP_TOOLTIP_CONFIG = {
  // Action number that triggers help mode
  ACTION_NUMBER: 9,
  ACTION_NAME: "enable_tooltips",

  // Tooltip styling
  TOOLTIP_WIDTH: 280,
  TOOLTIP_BG: "#1f2937",
  TOOLTIP_TEXT: "#f3f4f6",
  TOOLTIP_ACCENT: "#60a5fa",
  TOOLTIP_SHADOW: "0 10px 25px rgba(0, 0, 0, 0.3)",

  // Animation
  ANIMATION_DURATION_MS: 200,
  FADE_IN_DELAY_MS: 100,

  // Element highlighting
  HIGHLIGHT_COLOR: "#60a5fa",
  HIGHLIGHT_BORDER: "2px solid #60a5fa",

  // Priority for element selection
  ELEMENT_PRIORITY: [
    "button:not(:disabled)",
    "input:not(:disabled)",
    "a[href]",
    "[role='button']",
    "[data-interactive]",
  ],
};

export const CONTEXT_TYPES = {
  BUTTON: "button",
  INPUT_EMAIL: "input_email",
  INPUT_PASSWORD: "input_password",
  INPUT_TEXT: "input_text",
  INPUT_NUMBER: "input_number",
  NAVIGATION: "navigation",
  FORM: "form",
  TRANSACTION: "transaction",
  RECOVERY: "recovery",
  SETTINGS: "settings",
  DEFAULT: "default",
};

export const HELP_MESSAGES = {
  button: "Click this button to perform the action. Try it out!",
  input_email: "Enter your email address here.",
  input_password: "Enter your password securely.",
  input_text: "Type your information in this field.",
  input_number: "Enter a number here.",
  navigation: "Click here to navigate to a different page.",
  form: "Fill out this form to proceed with your task.",
  transaction: "Review your transaction details carefully before confirming.",
  recovery: "Follow the recovery steps to regain access to your account.",
  settings: "Adjust your preferences using these options.",
  default: "Try interacting with this element!",
};
