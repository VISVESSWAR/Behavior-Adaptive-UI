# Help Tooltip System

## Overview

The Help Tooltip system is a non-blocking, contextual help interface that activates when the DQN model selects action 9 (`enable_tooltips`). It provides intelligent, context-aware tooltips to guide users through the application while logging all interactions for RL metrics.

## Key Features

✅ **Global Toggle State** - Enable/disable help mode globally  
✅ **Contextual Tooltips** - Different messages for different element types  
✅ **Non-Blocking Overlay** - Doesn't interfere with user interactions  
✅ **RL Metrics Logging** - Tracks all help tooltip activations  
✅ **Smart Element Selection** - Auto-finds next interactive element  
✅ **Responsive Positioning** - Tooltips position relative to elements  

## Architecture

```
HelpTooltipContext (Global State)
    ├── isEnabled: boolean
    ├── activeTooltip: object
    ├── tooltipPosition: {x, y}
    └── Methods: activateTooltip, dismissTooltip, toggleHelpMode

HelpTooltip (Visual Component)
    ├── Non-blocking wrapper
    ├── Highlighted element
    ├── Tooltip box with message
    └── Dismiss button

helpTooltipHandler (Action Handlers)
    ├── handleHelpTooltipAction()
    ├── activateElementTooltip()
    └── dismissElementTooltip()

helpTooltipIntegration (DQN Integration)
    ├── HelpTooltipIntegration class
    ├── handleActionApplied()
    ├── findAndActivateNextElement()
    └── Context type detection

useHelpTooltip (Hook)
    └── Access context in components
```

## File Structure

```
src/
├── context/
│   └── HelpTooltipContext.jsx      # Global state management
├── components/
│   └── HelpTooltip.jsx             # Visual tooltip component
├── hooks/
│   ├── useHelpTooltip.jsx          # Context hook
│   └── useHelpTooltipIntegration.jsx # Component integration hook
└── adaptation/
    ├── helpTooltipHandler.jsx       # Action handlers + logging
    ├── helpTooltipIntegration.jsx   # DQN integration
    ├── helpTooltipConfig.jsx        # Configuration + docs
    └── applyAction.jsx              # (Integration point)
```

## Installation

No additional dependencies required! Uses React hooks and context.

## Usage

### 1. Basic Setup (Already Done in App.jsx)

```jsx
import { HelpTooltipProvider } from './context/HelpTooltipContext.jsx';
import HelpTooltip from './components/HelpTooltip.jsx';

function App() {
  return (
    <HelpTooltipProvider>
      {/* Your app */}
      <HelpTooltip />
    </HelpTooltipProvider>
  );
}
```

### 2. In Page Components

```jsx
import { useHelpTooltipIntegration } from '../hooks/useHelpTooltipIntegration.jsx';

function TransactionPage() {
  const { handleDQNAction } = useHelpTooltipIntegration();

  // When DQN action is applied:
  const onDQNAction = (actionIndex, actionName) => {
    // This handles action 9 automatically
    handleDQNAction(actionIndex, actionName);
    
    // ... handle other actions
  };

  return <div>{/* Your component */}</div>;
}
```

### 3. Manual Tooltip Triggering

```jsx
import { useHelpTooltip } from '../hooks/useHelpTooltip.jsx';
import { activateElementTooltip } from '../adaptation/helpTooltipHandler.jsx';

function MyComponent() {
  const helpTooltip = useHelpTooltip();
  const buttonRef = useRef();

  const showHelp = () => {
    activateElementTooltip(helpTooltip, buttonRef.current, {
      type: 'button',
      message: 'Click to submit your form',
    });
  };

  return (
    <>
      <button ref={buttonRef}>Submit</button>
      <button onClick={showHelp}>Show Help</button>
    </>
  );
}
```

## API Reference

### useHelpTooltip()

Hook to access help tooltip context.

```jsx
const {
  isEnabled,              // boolean: help mode on/off
  activeTooltip,          // object: current tooltip or null
  tooltipPosition,        // {x, y, elementRect}
  activateTooltip,        // fn(element, context)
  dismissTooltip,         // fn()
  toggleHelpMode,         // fn(enabled)
} = useHelpTooltip();
```

### useHelpTooltipIntegration()

Hook for DQN integration in components.

```jsx
const {
  handleDQNAction,        // fn(actionIndex, actionName) -> boolean
  integration,            // HelpTooltipIntegration instance
  isActive,              // boolean
  dismiss,               // fn()
  toggle,                // fn(enabled)
} = useHelpTooltipIntegration();
```

### handleHelpTooltipAction()

Trigger when action 9 is applied.

```jsx
import { handleHelpTooltipAction } from '../adaptation/helpTooltipHandler.jsx';

handleHelpTooltipAction(helpTooltipContext, uiConfig);
// Logs to metrics: event type "help_tooltip_activated"
```

### activateElementTooltip()

Show tooltip on a specific element.

```jsx
import { activateElementTooltip } from '../adaptation/helpTooltipHandler.jsx';

activateElementTooltip(helpTooltipContext, element, {
  type: 'button',                    // button, input, form, etc.
  message: 'Custom help text',       // Optional override
});
```

## Context Types & Default Messages

| Type | Default Message |
|------|-----------------|
| `button` | Click this button to perform the action. Try it out! |
| `input_email` | Enter your email address here. |
| `input_password` | Enter your password securely. |
| `input_text` | Type your information in this field. |
| `input_number` | Enter a number here. |
| `navigation` | Click here to navigate to a different page. |
| `form` | Fill out this form to proceed with your task. |
| `transaction` | Review your transaction details carefully before confirming. |
| `recovery` | Follow the recovery steps to regain access to your account. |
| `settings` | Adjust your preferences using these options. |
| `default` | Try interacting with this element! |

## RL Metrics Logged

### When Action 9 is Triggered

```javascript
{
  type: "help_tooltip_activated",
  flowId: "adaptation",
  stepId: "help_tooltip",
  action: "enable_tooltips",
  actionNumber: 9,
  uiConfig: { /* current UI state */ },
  timestamp: "2024-01-15T10:30:45.123Z"
}
```

### When Element Tooltip is Shown

```javascript
{
  type: "element_tooltip_shown",
  flowId: "adaptation",
  stepId: "help_tooltip",
  elementId: "submit-button",
  elementClass: "adaptive-button",
  contextType: "button",
  timestamp: "2024-01-15T10:30:46.123Z"
}
```

### When Tooltip is Dismissed

```javascript
{
  type: "element_tooltip_dismissed",
  flowId: "adaptation",
  stepId: "help_tooltip",
  timestamp: "2024-01-15T10:30:50.123Z"
}
```

## Styling & Customization

### Change Tooltip Appearance

Edit `HelpTooltip.jsx`:

```jsx
// Tooltip background color
backgroundColor: "#1f2937",

// Text color
color: "#f3f4f6",

// Border style
border: "1px solid #374151",

// Shadow
boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",

// Accent color
color: "#60a5fa",
```

### Custom Help Messages

```jsx
// Option 1: Override in activateElementTooltip
activateElementTooltip(helpTooltip, element, {
  type: 'button',
  message: 'Your custom message here',
});

// Option 2: Edit TOOLTIP_MESSAGES in HelpTooltip.jsx
const TOOLTIP_MESSAGES = {
  custom_type: "Your custom message",
};
```

### Animation Timing

Edit `HelpTooltip.jsx`:

```javascript
// Fade/transition duration
transition: "all 0.2s ease-out",

// Pulse animation speed
animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
```

## Integration with Existing Code

### In metricsCollectorSimplified.jsx

When action 9 is selected, notify the help system:

```jsx
// When snapshot includes action 9
if (snapshot.dqnAction === 9) {
  // Trigger help tooltip in next available component
  window.dispatchEvent(new CustomEvent('action9', { 
    detail: { action: 'enable_tooltips' } 
  }));
}
```

### In applyAction.jsx

After applying action 9:

```jsx
import { handleHelpTooltipAction } from '../adaptation/helpTooltipHandler.jsx';

if (action === 9 || action === 'enable_tooltips') {
  handleHelpTooltipAction(helpTooltipContext, uiState);
}
```

### In AdaptiveButton.jsx / AdaptiveInput.jsx

Register elements with help system (future enhancement):

```jsx
data-interactive="true"
data-context-type="button"
```

## Behavior

### Help Mode Activation (Action 9)

1. User action triggers DQN, model selects action 9
2. `handleHelpTooltipAction()` called
3. Help mode enabled globally
4. First interactive element found automatically
5. Contextual tooltip shown on element
6. Element highlighted with blue pulse border
7. Metrics logged: `help_tooltip_activated`

### Element Highlighting

Elements are highlighted in priority order:
1. `button:not(:disabled)` - Buttons first
2. `input:not(:disabled)` - Form inputs second
3. `a[href]` - Links third
4. `[role='button']` - Button roles
5. `[data-interactive]` - Marked elements

### Non-Blocking Behavior

- Main overlay has `pointerEvents: 'none'`
- User can click behind tooltip
- Only "Got it" button receives clicks
- Clicking element behind doesn't dismiss (by design)
- User must explicitly dismiss or press ESC

## Keyboard Shortcuts (Future)

- `?` - Show help
- `ESC` - Dismiss current tooltip
- `Tab` - Jump to next highlighted element

## Accessibility

Current:
- Semantic HTML structure
- Focus management on dismiss button
- High contrast colors (dark bg, light text)

Future:
- ARIA labels on tooltip
- Screen reader announcements
- Keyboard navigation
- Reduced motion support

## Testing

### Manual Testing

```javascript
// In browser console:
const ctx = document.querySelector('div').__reactProps.children.find(c => c.type.name === 'HelpTooltip');
// Or simpler:
const helpBtn = document.querySelector('button');
ctx.activateTooltip(helpBtn, { type: 'button' });
ctx.toggleHelpMode(true);
```

### Unit Tests

Create `HelpTooltip.test.jsx`:

```jsx
import { render } from '@testing-library/react';
import { HelpTooltipProvider } from '../context/HelpTooltipContext';
import HelpTooltip from '../components/HelpTooltip';

test('shows tooltip when enabled', () => {
  const { container } = render(
    <HelpTooltipProvider>
      <HelpTooltip />
    </HelpTooltipProvider>
  );
  // Test tooltip visibility
});
```

## Performance

- No event listeners on every element (non-intrusive)
- Single global context (minimal overhead)
- Tooltips don't re-render unless state changes
- Animations use CSS transforms (GPU accelerated)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Known Limitations

1. Only one tooltip shown at a time
2. Position calculation doesn't account for viewport edges (can overlap on small screens)
3. Touch gestures not fully optimized for mobile
4. No animation on mobile (for performance)

## Future Enhancements

- [ ] Multi-step tutorial flows
- [ ] Keyboard navigation (Tab, ESC)
- [ ] Responsive position adjustment
- [ ] Voice guidance integration
- [ ] Tooltip effectiveness analytics
- [ ] A/B testing different styles
- [ ] Gesture support for mobile
- [ ] Theming system
- [ ] Internationalization (i18n)
- [ ] Help content management system

## Troubleshooting

### Tooltip not showing

1. Check if `HelpTooltipProvider` wraps your app
2. Check if `HelpTooltip` component is mounted
3. Verify element is not hidden (`offsetParent !== null`)
4. Check DevTools: `window.__metricsCollector` should exist

### Element not highlighting

1. Verify element selector matches
2. Check CSS z-index conflicts
3. Ensure element is in viewport

### Metrics not logging

1. Check `logEvent` is imported correctly
2. Verify `window.__metricsCollector` exists
3. Check localStorage/IndexedDB for logs

## Support

For issues or questions:
1. Check this documentation
2. Review example in `useHelpTooltipIntegration.jsx`
3. Check console for error messages
4. Review metrics logs in DevTools
