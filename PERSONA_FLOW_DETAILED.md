Persona-Based UI Adaptation: Complete Flow

# STEP-BY-STEP PROCESS

## STAGE 1: METRIC COLLECTION (Real-Time)

Raw Metrics Captured:
useMouseTracker.js: - s_vel_mean: Average mouse velocity (pixels/second) - s_total_distance: Total distance mouse traveled - s_num_clicks: Total number of clicks - s_num_misclicks: Number of clicks that missed targets (approximate) - s_mean_time_per_action: Average time between actions (hesitation)

useIdleTimer.js: - idle_time: Seconds of inactivity

useScrollDepth.js: - scroll metrics (currently collected but not used in persona)

Metrics are updated in real-time as user interacts with the page.

## STAGE 2: METRIC NORMALIZATION (0-1 Scale)

File: metricAdapter.js
Function: adaptMetrics(raw)

Normalization Formula:
vel_mean = Math.min(raw.s_vel_mean / 3000, 1)
Purpose: Normalize velocity to 0-1 scale
Threshold: 3000 pixels/sec is considered "normal" speed
Result: 0 = very slow, 1 = very fast

idle = Math.min(raw.idle_time / 10, 1)
Purpose: Normalize idle time
Threshold: 10 seconds is max idle before capped at 1
Result: 0 = no idle, 1 = idle for 10+ seconds

hesitation = Math.min(raw.s_mean_time_per_action / 2, 1)
Purpose: How much time between actions
Threshold: 2 seconds per action is max
Result: 0 = quick actions, 1 = 2+ sec delay between actions

misclicks = Math.min(raw.s_num_misclicks / 10, 1)
Purpose: How many missed clicks
Threshold: 10+ misclicks is max
Result: 0 = no misclicks, 1 = 10+ misclicks

## STAGE 3: PERSONA CLASSIFICATION

File: personaClassifier.js
Function: classifyPersona(adapted_metrics)

Classification Rules (Threshold-Based):

NOVICE_OLD:
IF vel_mean < 0.4
AND (idle > 0.6 OR hesitation > 0.6 OR misclicks > 0.3)
=> persona = "novice_old", confidence = 0.85

Meaning: Slow mouse movement + signs of struggle
(long pauses, hesitation, or frequent misclicks)

EXPERT:
IF vel_mean > 0.7
AND idle < 0.3
AND hesitation < 0.3
AND misclicks < 0.2
=> persona = "expert", confidence = 0.85

Meaning: Fast, confident, precise movements with no delays

INTERMEDIATE:
Default fallback
=> persona = "intermediate", confidence = 0.7

## STAGE 4: PERSONA VALIDATION & STABILIZATION

File: personaValidator.js
Class: PersonaValidator

Purpose: Prevent UI from flicking due to temporary metric spikes

Logic:

- Tracks persona history (last 3 detections)
- Waits for 2+ consecutive detections before setting stable = true
- Only triggers UI adaptation when stable = true

Example:
T1: novice_old detected → stable = false
T2: novice_old detected again → stable = true (ADAPTATION STARTS)
T3: novice_old → continues
T4: intermediate detected → stable = false (RESET)
T5: intermediate detected again → stable = true (NEW ADAPTATION)

## STAGE 5: ACTION SELECTION (Metric-Driven + Fallback)

File: personaActionMapper.js
Function: getActionsForPersona(persona, metrics)

TWO-TIER DECISION SYSTEM:

TIER 1: METRIC-SPECIFIC RULES (Simulated RL)
If any metric condition is met, apply that action immediately:

Rule 1: High Misclicks (> 40%)
Trigger: misclicks > 0.4
Action: ACTION_SPACE[1] = "button_up"
Rationale: Larger buttons easier to click accurately
Log: [RL Simulation] High misclicks (45%) => button_up

Rule 2: High Idle Time (> 50%)
Trigger: idle > 0.5
Action: ACTION_SPACE[3] = "text_up"
Rationale: Vision issues - need bigger text
Log: [RL Simulation] High idle time (62%) => text_up

Rule 3: High Hesitation (> 50%)
Trigger: hesitation > 0.5
Action: ACTION_SPACE[7] = "spacing_up"
Rationale: More spacing reduces cognitive load
Log: [RL Simulation] High hesitation (58%) => spacing_up

Rule 4: Low Velocity (< 30%)
Trigger: vel_mean < 0.3
Action: ACTION_SPACE[9] = "enable_tooltips"
Rationale: Slow movement indicates inexperience, need guidance
Log: [RL Simulation] Low velocity (25%) => enable_tooltips

TIER 2: PERSONA-BASED FALLBACK
If NO metric rules trigger, use persona-based rules:

novice_old:
Actions: [button_up, text_up, spacing_up, enable_tooltips]
Rationale: Full accessibility suite

expert:
Actions: [button_down, text_down, spacing_down]
Rationale: Compact, minimal UI

intermediate:
Actions: [noop] (no changes)
Rationale: Default UI is balanced

## STAGE 6: ACTION APPLICATION

File: applyAction.js
Function: applyAction(currentUIState, action)

Action Bounds (using array lengths):

ACTION_SPACE[1] = "button_up"
buttonSize = min(buttonSize + 1, BUTTON_SIZES.length - 1)
Current: 1 => 2 => 3 => ... => 6 (max)
CSS Classes: px-3py-1 text-sm => px-4py-2 text-base => px-5py-3 text-lg => ...

ACTION_SPACE[2] = "button_down"
buttonSize = max(buttonSize - 1, 0)
Current: 3 => 2 => 1 => 0 (min)

ACTION_SPACE[3] = "text_up"
textSize = min(textSize + 1, TEXT_SIZES.length - 1)
text-base => text-lg => text-xl => ...

ACTION_SPACE[4] = "text_down"
textSize = max(textSize - 1, 0)

ACTION_SPACE[7] = "spacing_up"
spacing = min(spacing + 1, SPACING_LEVELS.length - 1)
gap-2 => gap-3 => gap-4 => ...

ACTION_SPACE[8] = "spacing_down"
spacing = max(spacing - 1, 0)

ACTION_SPACE[9] = "enable_tooltips"
tooltips = true

## STAGE 7: UI RENDERING (Components Update)

File: UIContext.js
Hook: useUIConfig() in components

Flow:

1. applyAction() updates state immutably
2. setUIConfig() triggers re-render
3. Components call useUIVariants()
4. useUIVariants() reads uiConfig and maps to CSS classes
5. Components re-render with new classes

Example:
OLD: <button className="px-4 py-2 text-base">Click</button>
=> After button_up
NEW: <button className="px-5 py-3 text-lg">Click</button>

# COMPLETE FLOW EXAMPLE

SCENARIO: User has high misclicks

T=0s:
Raw: s_num_misclicks = 5

T=1s:
Raw: s_num_misclicks = 10
Normalized: misclicks = min(10/10, 1) = 1.0 (100%)

T=2s:
Classification: vel_mean=0.2, misclicks=1.0
=> Matches no persona rule (vel_mean not < 0.4 with struggle signs yet)
=> persona = "intermediate", confidence = 0.7

T=3s:
Raw update: idle_time = 5 sec, s_vel_mean = 800
Normalized: idle = 0.5, vel_mean = 0.267, hesitation = 0.3, misclicks = 1.0
Classification: vel_mean < 0.4 AND misclicks > 0.3
=> persona = "novice_old", confidence = 0.85, stable = false

T=4s (next frame):
Persona still: "novice_old", confidence = 0.85
=> stable = true (TRIGGERS ADAPTATION)

Action Selection:
Check metric rules first:
misclicks (1.0) > 0.4? YES => button_up
idle (0.5) > 0.5? NO
hesitation (0.3) > 0.5? NO
vel_mean (0.267) < 0.3? YES => enable_tooltips

    Selected actions: [button_up, enable_tooltips]

Application:
applyAction(uiState, "button_up")
buttonSize: 1 => 2
Result: {"buttonSize": 2, "textSize": 4, ...}

    applyAction(newState, "enable_tooltips")
      tooltips: false => true
      Result: {"buttonSize": 2, "tooltips": true, ...}

Rendering:
AdaptiveButton reads uiConfig.buttonSize = 2
=> BUTTON_SIZES[2] = "px-4 py-2 text-base"
=> Button renders LARGER

    Components check uiConfig.tooltips = true
    => Tooltips display on hover

T=5s onwards:
User sees larger buttons and helpful tooltips
More accurate clicks => misclicks decrease
=> Persona might shift back to "intermediate" or "expert"

# KEY POINTS TO REMEMBER

1. METRIC-FIRST: Metric rules take priority over persona
   => Immediate response to specific issues

2. STABILITY CHECK: Only adapts when persona stable = true
   => Prevents flicker from temporary metric spikes

3. BIDIRECTIONAL: Can increase or decrease UI sizes
   => Expert users get compact UI automatically

4. REAL-TIME: Metrics updated every interaction
   => Responsive to behavior changes

5. BOUNDED: All adjustments stay within min/max levels
   => Cannot go to 0 or beyond array length

# NEXT: DQN MODEL INTEGRATION

Current: Hardcoded rules decide actions
Future: DQN model will learn optimal actions

State Input: [vel_mean, idle, hesitation, misclicks, current_ui_state]
Model Output: [action_probability_for_each_action]
Selected: argmax(action_probabilities)

The pipeline stays identical - just replace:
getActionsForPersona(persona, metrics)
With:
dqnModel.predict(state) => best_action
