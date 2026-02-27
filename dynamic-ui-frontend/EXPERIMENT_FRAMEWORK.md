# Adaptive UI RL Experimental Framework - Implementation Guide

## Overview

This implementation adds a controlled experimental framework for comparing different Reinforcement Learning policies in the Adaptive UI system. You can now run the same application with different decision-making strategies and collect comparable data.

---

## Part 1: Multiple Transaction Paths

Each user session is randomly assigned one of 3 transaction types:

1. **bank_transfer** - Multi-step bank form (higher cognitive load)
2. **upi_payment** - Medium-complexity UPI form  
3. **qr_payment** - Minimal-step QR code payment

**How it works:**
- `pathType` is randomly assigned when `MetricsCollector` is initialized
- Logged with every snapshot for comparison across experiments
- Not shown to user (fully transparent)

**Implementation:**
- File: `src/utils/metricsCollectorSimplified.jsx`
- Method: `assignPathType()` in constructor
- Stored in: `this.pathType` field
- Included in: Every snapshot and RL log

---

## Part 2: Experiment Modes

Switch between 3 different decision strategies:

### MODE: "model" (Pure Exploitation)
```
finalAction = modelAction
```
- Uses only the DQN model's action
- No exploration
- Expected: High confidence, potentially stuck in local optima
- Use case: Testing a fully-trained policy

### MODE: "random" (Pure Exploration)
```
finalAction = random valid action
```
- Ignores the model entirely
- Selects uniformly from all 10 possible actions
- Expected: Total randomness, serves as baseline
- Use case: Understanding exploration value

### MODE: "guided" (Default - Probabilistic Mix)
```
25%   → model action (exploit known good actions)
55%   → random action (explore alternatives)
20%   → anti-model (targeted exploration of opposite actions)
```
- Balanced exploitation vs exploration
- Deterministic per run (same seed produces same decisions)
- Expected: Best real-world performance
- Use case: Production/default mode

**How to switch modes:**

1. Open: `src/utils/dqnAdapter.jsx`
2. Find line ~14: `export const EXPERIMENT_MODE = "guided";`
3. Change to:
   ```javascript
   export const EXPERIMENT_MODE = "model";    // or "random"
   ```
4. Save and reload the app

---

## Part 3: RL Logging Extension

Each decision is logged with extended payload:

```javascript
{
  timestamp: "2026-02-27T15:30:45.123Z",
  persona: "intermediate",           // user skill level
  pathType: "bank_transfer",        // transaction type
  modelAction: 3,                   // DQN model's choice
  finalAction: 5,                   // what was actually used
  source: "random",                 // decision method
  reward: 0.12,                     // computed reward
  taskTime: 23000,                  // milliseconds elapsed
  success: 1                        // 1 = completed, 0 = timeout
}
```

**Log Storage:**
- In-memory buffer: `window.__rlLogs` (array)
- Auto-logged per snapshot via `appendRLLog(entry)`
- Non-blocking async operation
- Exported as CSV for analysis

---

## Part 4: Action Execution Pipeline

Function: `decideFinalAction(modelAction, validActions)`

Located in: `src/utils/dqnAdapter.jsx` lines 95-150

**Inputs:**
- `modelAction`: Action from DQN model (0-9)
- `validActions`: Array of valid actions (default: [0,1,2,...,9])

**Returns:**
```javascript
{
  finalAction: 3,        // The action to execute
  source: "random"       // How it was selected: "model" | "random" | "anti-model"
}
```

**Flow:**
1. Check `EXPERIMENT_MODE` global constant
2. Apply mode-specific strategy:
   - **MODEL**: Return model action directly
   - **RANDOM**: Sample uniformly from valid actions
   - **GUIDED**: Use probabilistic mix with decay
3. Return `{finalAction, source}`

**Anti-Model Logic:**
Opposite actions for targeted exploration:
- button_up (1) ↔ button_down (2)
- text_up (3) ↔ text_down (4)
- font_up (5) ↔ font_down (6)
- spacing_up (7) ↔ spacing_down (8)
- noop (0) → noop, enable_tooltips (9) → enable_tooltips (no opposites)

---

## Part 5: Safety Constraints - PRESERVED

✅ **State vector shape**: Still exactly 19 features (12 mouse + 3 persona + 4 UI levels)
✅ **Backend API**: No changes to `/api/adaptive-action` contract
✅ **UI adaptation**: Existing calls unaffected, fully backward compatible
✅ **Reward function**: Original computation preserved
✅ **Determinism**: Same mode + seed = reproducible decisions per snapshot

---

## Part 6: Debug Output

Expected console logs during operation:

```
[MetricsCollector] Assigned pathType: bank_transfer
PATH: bank_transfer
MODE: guided
[MetricsCollector] DQN action fetched at snapshot time: 3
ACTION SOURCE: 🎲 RANDOM - Model: 3, Final: 5
ACTION SOURCE: random
[TransactionPage] Path type: bank_transfer
[RLLogger] Entry logged: {...}
```

---

# Usage Guide

## Running Experiments

### Step 1: Set up baseline (GUIDED mode)
```
1. Start app (MODE = "guided" by default)
2. Complete 5-10 transactions over ~5 minutes
3. In browser console:
   > window.__experimentControl.help()
4. Export logs:
   > window.__experimentControl.downloadRLLogs()
   # File saved: rl_logs_<timestamp>.csv
5. Clear logs:
   > window.__experimentControl.clearRLLogs()
```

### Step 2: Run RANDOM policy
```
1. Edit src/utils/dqnAdapter.jsx
2. Change: EXPERIMENT_MODE = "random"
3. Save, reload app
4. Complete 5-10 transactions
5. Export logs (same as Step 1, saves as new file)
```

### Step 3: Run MODEL policy
```
1. Edit src/utils/dqnAdapter.jsx
2. Change: EXPERIMENT_MODE = "model"
3. Save, reload app
4. Complete 5-10 transactions
5. Export logs
```

### Step 4: Analyze
Now you have 3 CSV files with:
- Same user behavior metrics
- Different decision policies
- Comparable reward/success metrics

Analyze with Excel, Python pandas, R, Tableau, etc.

---

## Browser Console API

Access via: `window.__experimentControl`

### View current mode
```javascript
window.__experimentControl.getMode()
// Returns: "model" | "random" | "guided"
```

### Get experiment status
```javascript
window.__experimentControl.getStatus()
// Returns: {
//   mode: "guided",
//   logsCount: 47,
//   sessionId: "session_1... ",
//   pathType: "bank_transfer"
// }
```

### Export RL logs as CSV string
```javascript
window.__experimentControl.exportRLLogs()
// Logs to console, returns CSV text
```

### Download as CSV file
```javascript
window.__experimentControl.downloadRLLogs()
// Downloads: rl_logs_<timestamp>.csv
```

### Clear all logs
```javascript
window.__experimentControl.clearRLLogs()
```

### Show help
```javascript
window.__experimentControl.help()
```

---

## Expected Results

### GUIDED MODE (DEFAULT)
- **Behavior**: Balanced exploitation + exploration
- **UI Adaptations**: Regular, varied
- **Decision Source**: Mix of model (25%), random (55%), anti (20%)
- **Typical Success Rate**: 85-95% (depends on user skill + time)

### MODEL MODE
- **Behavior**: Always trust the model
- **UI Adaptations**: Consistent, predictable
- **Decision Source**: Always "model"
- **Typical Success Rate**: 70-90% (model quality dependent)
- **Risk**: Stuck in local optima if model overfits

### RANDOM MODE
- **Behavior**: No RL at all (pure baseline)
- **UI Adaptations**: Highly variable, chaotic
- **Decision Source**: Always "random"
- **Typical Success Rate**: 40-60% (expected: below other modes)
- **Use**: Understand value of RL

---

## File Structure

```
src/
├── utils/
│   ├── dqnAdapter.jsx              # EXPERIMENT_MODE, decideFinalAction()
│   ├── metricsCollectorSimplified.jsx  # pathType, RL logging
│   ├── rlLogger.jsx                # appendRLLog, exportRLLogs
│   └── experimentControl.jsx       # Browser console API
├── pages/
│   └── TransactionPage.jsx         # pathType logging
└── App.jsx                         # setupExperimentControl()
```

---

## Implementation Details

### State Vector (UNCHANGED)
Still 19 features in exact order:
- [0-11]: Mouse behavior (session_duration, total_distance, etc.)
- [12-14]: Persona one-hot (novice_old, intermediate, expert)
- [15-18]: UI levels normalized (button, text, spacing, font)

### Snapshot Payload (EXTENDED)
Added fields:
- `pathType`: "bank_transfer" | "upi_payment" | "qr_payment"
- `actionSource`: "model" | "random" | "anti-model" | "idle" | "feedback-*"
- Existing fields preserved for backward compatibility

### Reward Calculation (UNCHANGED)
- Task reward: +0.5 (complete), -0.3 (timeout), -0.01×pathLength
- Behavior reward: user feedback * 0.5
- UI saturation penalty: -0.03 per saturated dimension
- Mouse precision bonus: +0.02 for speed < 0.4
- Misclick penalty: -0.02 per excessive misclick
- Diversity bonus: +0.01 for different actions

---

## Troubleshooting

**Issue: MODE output not changing**
- Solution: Clear browser cache, hard reload (Ctrl+Shift+R or Cmd+Shift+R)
- Check: `window.__experimentControl.getMode()` should reflect edit

**Issue: No RL logs collected**
- Solution: Make sure you've used the app for at least 20 seconds (2 snapshots minimum)
- Check: `window.__experimentControl.getStatus().logsCount > 0`

**Issue: Logs show all "model" source even in RANDOM mode**
- Solution: Reload app AFTER editing EXPERIMENT_MODE
- Check: Browser console shows "MODE: random" on load

**Issue: Transactions not completing**
- Solution: Timer runs for 10 seconds, then auto-completes
- Check: TransactionPage logs to console

---

## Next Steps

1. **Run 3 experiments** with different modes
2. **Collect CSV files** with 30+ completed transactions each
3. **Analyze metrics**:
   - Success rate by path type
   - Reward distribution by mode
   - Action source frequency
   - Task completion time
4. **Compare policies**: Which mode performs best for each persona?
5. **Iterate**: Use insights to improve model training

---

## References

- **DQN Model**: PyTorch DDQN trained on previous logs
- **State Vector**: 19 normalized features (see Part 5)
- **Action Space**: 10 discrete UI adaptation actions
- **Reward Function**: Dense shaped with task + behavioral components
- **Exploration**: Three strategies for controlled experimentation

---

**Last Updated**: February 27, 2026
**Framework Version**: 1.0
**Status**: Ready for experimental validation
