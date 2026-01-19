# RL-Based UI Adaptation Rules (Simulated)

## Overview

The system now includes **hardcoded RL simulation rules** that automatically adapt the UI based on detected user behavior metrics. These rules simulate what a trained DQN model would learn.

## Current Adaptation Rules

### Rule 1: High Misclicks → Increase Button Size

**When:** `misclicks > 40%`
**Action:** `button_up` (increase button padding and text)
**Rationale:** Larger buttons are easier to click accurately, reducing further misclicks

```
misclicks = Math.min(raw.s_num_misclicks / 10, 1)
```

### Rule 2: High Idle Time → Increase Text Size

**When:** `idle > 50%`
**Action:** `text_up` (increase text size)
**Rationale:** Elderly users or those with vision issues need larger text to read comfortably

```
idle = Math.min(raw.idle_time / 10, 1)
```

### Rule 3: High Hesitation → Increase Spacing

**When:** `hesitation > 50%`
**Action:** `spacing_up` (increase gap/padding between elements)
**Rationale:** More spacing reduces cognitive load and makes UI less overwhelming

```
hesitation = Math.min(raw.s_mean_time_per_action / 2, 1)
```

### Rule 4: Low Velocity → Enable Tooltips

**When:** `vel_mean < 30%`
**Action:** `enable_tooltips` (show helpful tooltips)
**Rationale:** Slow mouse movements indicate inexperience; tooltips provide guidance

```
vel_mean = Math.min(raw.s_vel_mean / 3000, 1)
```

## Metric-First Design

The current implementation prioritizes **metric-based rules** over persona classification:

1. If any metric rule triggers → apply those actions
2. If no metric rule triggers → fall back to persona-based adaptation
3. This allows fine-grained, moment-by-moment adaptation

## Console Output

Watch the browser console for:

```
[RL Simulation] High misclicks (45%) → button_up
[RL Simulation] High idle time (62%) → text_up
[RL Simulation] High hesitation (58%) → spacing_up
[RL Simulation] Low velocity (25%) → enable_tooltips
[UI Adaptation] Persona detected: novice_old (confidence: 85%)
[UI Adaptation] Applied action: button_up
```

## Future: DQN Integration

Later, these hardcoded rules will be replaced with:

- **State:** Current metrics (velocity, idle, hesitation, misclicks)
- **Action:** UI adaptations (button_up, text_up, spacing_up, etc.)
- **Reward:** User task completion rate, error rate, engagement
- **Learning:** DQN learns optimal action for each state combination

The structure is already in place to swap out `getActionsForPersona()` with a call to the RL model.

## Testing the Simulation

1. Open DevTools (F12) → Console tab
2. Interact to trigger different behaviors:
   - **High misclicks:** Click buttons rapidly or slightly off-target
   - **High idle time:** Pause for 10+ seconds
   - **High hesitation:** Move mouse slowly and pause before actions
3. Watch the debugger (bottom-right) show:
   - Metric percentages changing
   - UI config values adjusting
   - Console logs showing which rules triggered
