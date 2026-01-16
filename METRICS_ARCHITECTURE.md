# Metrics Collection Architecture

## Overview

The system collects comprehensive behavioral metrics across all pages through three main tracking mechanisms:

1. **Mouse Tracker** - Tracks cursor movements and clicks
2. **Idle Timer** - Measures inactivity periods
3. **Scroll Depth** - Tracks how far users scroll
4. **Event Logger** - Records custom events and user actions

## Metrics Collected

### Mouse Tracking Metrics

```javascript
{
  s_session_duration: number,    // Total session time in seconds
  s_total_distance: number,      // Total pixels traveled by mouse
  s_vel_mean: number,            // Average velocity (pixels/ms)
  s_vel_max: number,             // Maximum velocity (pixels/ms)
  s_num_clicks: number,          // Total click count
  s_num_actions: number,         // Total user actions
  s_num_misclicks: number        // Clicks outside intended target
}
```

### Time Metrics

```javascript
{
  idle_time: number,             // Total idle time in seconds
  session_duration: number,      // Total session time
  active_time: number            // session_duration - idle_time
}
```

### Scroll Metrics

```javascript
{
  scroll_depth: number,          // 0-1 (0% to 100% of page)
  scroll_depth_percent: string   // Human readable "75%"
}
```

### Custom Events

```javascript
{
  type: string,                  // Event type (see below)
  flowId: string,                // Current flow (login, register, etc)
  stepId: string,                // Current step in flow
  ts: number,                    // Timestamp from eventLogger
  // Additional properties based on event type
}
```

## Event Types by Page

### Global Events

**`page_view`**

```javascript
{
  type: "page_view",
  flowId: "home" | "login" | "register" | "transaction" | "recovery" | "dashboard"
}
```

### Login Flow Events

**`step_enter`**

```javascript
{
  type: "step_enter",
  flowId: "login",
  stepId: "enter_username" | "enter_password" | "authenticating"
}
```

**`login_attempt`**

```javascript
{
  type: "login_attempt",
  flowId: "login",
  username: string,
  success: boolean
}
```

### Register Flow Events

**`step_enter`**

```javascript
{
  type: "step_enter",
  flowId: "register",
  stepId: "enter_email" | "set_password" | "registering" | "success"
}
```

**`registration_attempt`**

```javascript
{
  type: "registration_attempt",
  flowId: "register",
  email: string,
  success: boolean
}
```

### Transaction Flow Events

**`step_enter`**

```javascript
{
  type: "step_enter",
  flowId: "transaction",
  stepId: "select_service" | "confirm_payment" | "processing" | "success"
}
```

**`service_selected`**

```javascript
{
  type: "service_selected",
  flowId: "transaction",
  service: string  // "Money Transfer" | "Bill Payment" | etc
}
```

**`payment_attempt`**

```javascript
{
  type: "payment_attempt",
  flowId: "transaction",
  service: string,
  amount: string
}
```

### Recovery Flow Events

**`step_enter`**

```javascript
{
  type: "step_enter",
  flowId: "recovery",
  stepId: "enter_email" | "select_method" | "qr_scan" |
          "qr_verified" | "waiting_approval" |
          "tap_yes_verified" | "reset_password" | "success"
}
```

**`recovery_email_submitted`**

```javascript
{
  type: "recovery_email_submitted",
  flowId: "recovery",
  email: string
}
```

**`recovery_method_selected`**

```javascript
{
  type: "recovery_method_selected",
  flowId: "recovery",
  method: "qr" | "tap_yes"
}
```

**`qr_scanned`**

```javascript
{
  type: "qr_scanned",
  flowId: "recovery"
}
```

**`approval_confirmed`**

```javascript
{
  type: "approval_confirmed",
  flowId: "recovery",
  method: "tap_yes"
}
```

**`password_reset_success`**

```javascript
{
  type: "password_reset_success",
  flowId: "recovery",
  email: string
}
```

### Dashboard Events

**`step_enter`** (Tab navigation)

```javascript
{
  type: "step_enter",
  flowId: "dashboard",
  stepId: "view_metrics",
  tab: "overview" | "metrics" | "session"
}
```

## Data Storage

### Local Storage Structure

```javascript
// localStorage key: "behavior_logs"
// Value: JSON array of events

[
  {
    ts: 1705430000000, // Timestamp in milliseconds
    type: "page_view",
    flowId: "home",
  },
  {
    ts: 1705430001000,
    type: "step_enter",
    flowId: "login",
    stepId: "enter_username",
  },
  // ... more events
];
```

### Accessing Logs

```javascript
import { getLogs, clearLogs } from "../logging/eventLogger";

// Get all logged events
const logs = getLogs();

// Clear all logs
clearLogs();
```

## Metrics Calculation

### Mouse Distance

Calculated by tracking consecutive mouse positions and summing the Euclidean distances:

```javascript
distance = √((x₂-x₁)² + (y₂-y₁)²)
total_distance = sum of all distances
```

### Velocity

```javascript
velocity = distance / time_delta
velocity_mean = average of all velocity measurements
velocity_max = maximum velocity recorded
```

### Idle Time

Time elapsed since last user interaction (mouse movement, click, or keyboard input):

```javascript
idle_time = current_time - last_interaction_time;
// Resets on any user action
```

### Scroll Depth

Percentage of page scrolled:

```javascript
scroll_depth = current_scroll_position / (page_height - viewport_height);
// 0 = top of page, 1 = bottom of page
```

## Hooks Integration

### useMouseTracker Hook

```javascript
import useMouseTracker from "../hooks/useMouseTracker";

// Usage in component
const metrics = useMouseTracker("flowId", "stepId");

// Returns metrics object with all mouse tracking data
// Automatically tracks: clicks, distance, velocity, actions, misclicks
```

### useIdleTimer Hook

```javascript
import useIdleTimer from "../hooks/useIdleTimer";

// Usage in component
const idleTime = useIdleTimer("flowId", "stepId");

// Returns idle time in seconds (number)
// Automatically resets on user interaction
```

### useScrollDepth Hook

```javascript
import useScrollDepth from "../hooks/useScrollDepth";

// Usage in component
const scrollDepth = useScrollDepth("flowId", "stepId");

// Returns scroll depth as decimal (0-1)
// Can multiply by 100 for percentage
```

## Real-time Metrics Display

The app header displays 4 key metrics in real-time:

1. **Session Duration** - Total time in current session
2. **Mouse Distance** - Total pixels moved
3. **Clicks** - Total click count
4. **Idle Time** - Total idle time

These metrics are:

- Updated every 100ms
- Displayed in the sticky header
- Visible on all pages
- Used for persona classification

## Persona Classification

The collected metrics feed into persona detection:

```python
def classify_persona(metrics):
    """
    metrics = {
      'speed': float,         # velocity_mean normalized
      'idle': float,          # idle_time percentage
      'hesitation': float,    # frequency of velocity changes
      'entropy': float        # randomness of interactions
    }
    """

    # Novice/Elderly: Slow, high idle/hesitation
    if speed < 0.4 and (idle > 0.6 or hesitation > 0.6):
        return "novice_old", confidence=0.9

    # Expert: Fast, low idle/hesitation, high entropy
    if speed > 0.7 and idle < 0.3 and hesitation < 0.3 and entropy > 0.6:
        return "expert", confidence=0.9

    # Intermediate: Everything else
    return "intermediate", confidence=0.7
```

## Adaptive Adjustments Based on Persona

### Novice/Elderly Users

- **Button Size:** Level 4 (`px-8 py-5 text-2xl`)
- **Input Size:** Level 4 (larger touch targets)
- **Font:** `font-bold` for clarity
- **Spacing:** Level 3 (`gap-6`) for breathing room
- **Tooltips:** Enabled

### Intermediate Users

- **Button Size:** Level 1 (`px-4 py-2 text-base`) - DEFAULT
- **Input Size:** Level 1 (standard sizing)
- **Font:** `font-normal` to `font-semibold`
- **Spacing:** Level 1-2 (`gap-2` to `gap-3`)
- **Tooltips:** Optional

### Expert Users

- **Button Size:** Level 0 (`px-3 py-1 text-sm`) - Compact
- **Input Size:** Level 0 (minimal)
- **Font:** `font-normal` for density
- **Spacing:** Level 0 (`gap-2`) for compact layout
- **Tooltips:** Disabled

## Analysis & Reporting

### Key Metrics to Track

1. **User Efficiency**

   - Clicks per action
   - Distance per interaction
   - Velocity patterns

2. **User Engagement**

   - Scroll depth by page
   - Time spent per step
   - Idle time patterns

3. **Error Patterns**

   - Misclick frequency
   - Navigation hesitation
   - Form submission attempts

4. **Persona Accuracy**
   - Confidence scores
   - Metric distribution
   - Persona switches

### Export & Analysis

Logs can be exported for analysis:

```javascript
// Get logs from localStorage
const logs = getLogs();

// Export as JSON
const jsonData = JSON.stringify(logs, null, 2);

// Export as CSV
const csv = logs
  .map((log) => `${log.ts},${log.type},${log.flowId},${log.stepId},...`)
  .join("\n");
```

## Integration with UI System

The metrics drive the adaptive UI:

```javascript
// In adaptation/UIContext.js
const [metrics, setMetrics] = useState({...});

// Classify user persona
const persona = classifyPersona(metrics);

// Select UI configuration
const uiConfig = ACTION_SPACE[persona];

// Components access via useUIVariants() hook
const ui = useUIVariants();
// ui.button, ui.input, ui.text, etc are adapted
```

## Best Practices

1. **Always log flow context:**

   ```javascript
   logEvent({
     type: "action_type",
     flowId: "current_flow",
     stepId: "current_step",
     // additional properties
   });
   ```

2. **Use consistent naming:**

   - flowId: lowercase, snake_case
   - stepId: lowercase, snake_case
   - Type: lowercase, snake_case

3. **Include timestamps:**

   - eventLogger automatically adds `ts`
   - All events timestamped in milliseconds

4. **Track important transitions:**

   - Form submissions
   - Page navigation
   - Method selections
   - Success/failure states

5. **Avoid logging sensitive data:**
   - Passwords (log attempt only)
   - Credit cards
   - Personal ID numbers
   - Only log necessary identifiers (email, username)

## Troubleshooting

### Metrics Not Appearing

1. Check that hooks are called before component render
2. Verify flowId and stepId are provided
3. Check browser console for errors

### Idle Timer Not Working

1. Ensure mouse tracking is initialized
2. Check that page has focus
3. Verify idle threshold (default 3 seconds)

### Scroll Depth Always 0

1. Check that page has scrollable content
2. Verify viewport height < content height
3. Test on pages with sufficient content

### Event Logs Not Saved

1. Check localStorage is enabled
2. Verify browser storage quota
3. Clear localStorage and retry

## Performance Considerations

- Metrics tracking is optimized for performance
- Mouse tracking uses throttling (100ms intervals)
- Event logging is non-blocking
- localStorage usage monitored (~10KB per 1000 events)
- Logs can be cleared to free space
