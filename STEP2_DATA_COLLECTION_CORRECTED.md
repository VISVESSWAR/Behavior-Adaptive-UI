# Data Collection Model Correction - Summary

## What Changed

The data collection architecture has been **fundamentally simplified** to match correct RL principles:

### Before (Incorrect)

```
Collect (s, a, r, s', done) tuples eagerly
 └─ Try to build transitions at collection time
 └─ Store pre-built transitions in IndexedDB
 └─ Problem: Overcomplicated, tight coupling, mismatch with RL semantics
```

### After (Correct)

```
Collect snapshots (s, a, timestamp, persona)
 └─ Store chronologically in IndexedDB
 └─ Build transitions at export time by pairing consecutive snapshots
 └─ Compute rewards from (s_t, a_t, s_{t+1})
 └─ Export as CSV (47-column DQN format)
```

## Key Insight

**You do NOT collect "next\_" metrics separately.**

They are simply the metrics from the **next snapshot in time**.

```javascript
// Example: Two consecutive snapshots in time
Snapshot @ t=00:00s  → becomes s_* in transition
Snapshot @ t=00:10s  → becomes next_s_* in same transition

Reward is NOT collected with the snapshot.
It is DERIVED from (s_t, a_t, s_{t+1}) using your reward function.
```

## Files Created

| File                                                                     | Purpose                                             | Lines |
| ------------------------------------------------------------------------ | --------------------------------------------------- | ----- |
| [snapshotSchema.js](src/utils/snapshotSchema.js)                         | Define snapshot structure + TransitionBuilder class | 408   |
| [metricsCollectorSimplified.js](src/utils/metricsCollectorSimplified.js) | Frontend collector (snapshots only)                 | 150   |
| [endToEndValidation.js](src/utils/endToEndValidation.js)                 | Test/validate entire pipeline                       | 320   |
| [STEP2_CORRECTED_APPROACH.md](STEP2_CORRECTED_APPROACH.md)               | Complete documentation                              | -     |

## Files Updated

| File                                                          | Changes                                                                  |
| ------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [MetricsExportPanel.js](src/components/MetricsExportPanel.js) | Updated to use TransitionBuilder, added validation, three export formats |

## Files to Remove

| File                            | Reason                                  |
| ------------------------------- | --------------------------------------- |
| `src/utils/metricsCollector.js` | Old version (eager transition building) |

## How to Use

### Frontend Collection (Every 10s)

```javascript
import MetricsCollector from "../utils/metricsCollectorSimplified.js";

const collector = new MetricsCollector(sessionId, flowId, stepId);

// Update metrics continuously
useEffect(() => {
  collector.updateMetrics(metrics); // from hooks
  collector.updatePersona(persona); // from classifier
  collector.recordAction(actionId); // when action applied
  collector.updateUIState(uiState);
}, [metrics, persona]);

// Collect snapshot every 10 seconds
useEffect(() => {
  const timer = setInterval(() => {
    collector.collectSnapshot(); // Creates ONE snapshot
  }, 10000);
  return () => clearInterval(timer);
}, []);

// On flow complete
const handleComplete = () => {
  collector.completeFlow(); // Sets done=true on last snapshot
  const csv = collector.toCSV(rewardFunction);
  // Save to IndexedDB
};
```

### Export (At Training Time)

```javascript
import { TransitionBuilder } from "../utils/snapshotSchema.js";

// Get snapshots from IndexedDB
const snapshots = await dbManager.getAll();
const sorted = snapshots.sort((a, b) => a.timestamp - b.timestamp);

// Build transitions (pair consecutive snapshots)
const transitions = TransitionBuilder.buildTransitions(
  sorted,
  (s_t, a_t, s_t1) => computeReward(s_t, a_t, s_t1),
);

// Export as CSV (47 columns)
const csv = TransitionBuilder.toCSV(transitions);

// Validate
const validation = TransitionBuilder.validate(transitions);
```

### Testing

```javascript
import { runEndToEndValidation } from "../utils/endToEndValidation.js";

const result = runEndToEndValidation();
console.log(result.csv); // Full CSV output
console.log(result.validation); // Validation results
```

## Snapshot Schema (What Gets Collected)

```javascript
{
  timestamp: number,              // Time of snapshot
  sessionId: string,              // Unique session
  flowId: string,                 // e.g., "transaction"
  stepId: string,                 // e.g., "confirm_payment"

  metrics: {
    session_duration,             // 12 behavioral metrics
    total_distance,
    num_actions, num_clicks,
    mean_time_per_action,
    vel_mean, vel_std,
    accel_mean, accel_std,
    curve_mean, curve_std,
    jerk_mean
  },

  persona: {
    type,       // "novice_old" | "intermediate" | "expert"
    confidence, // 0.0-1.0
    stable      // boolean
  },

  action: number,         // 0-9 (action ID), or -1 for none

  uiState: {
    buttonSize, textSize, spacing, tooltips
  },

  done: boolean           // true if flow completed
}
```

## State Vector Format (15 columns)

| #   | Column                 | Type   |
| --- | ---------------------- | ------ |
| 0   | s_session_duration     | float  |
| 1   | s_total_distance       | float  |
| 2   | s_num_actions          | int    |
| 3   | s_num_clicks           | int    |
| 4   | s_mean_time_per_action | float  |
| 5   | s_vel_mean             | float  |
| 6   | s_vel_std              | float  |
| 7   | s_accel_mean           | float  |
| 8   | s_accel_std            | float  |
| 9   | s_curve_mean           | float  |
| 10  | s_curve_std            | float  |
| 11  | s_jerk_mean            | float  |
| 12  | s_persona_novice_old   | 0 or 1 |
| 13  | s_persona_intermediate | 0 or 1 |
| 14  | s_persona_expert       | 0 or 1 |

**Constraint**: Exactly one persona column = 1 (one-hot encoding)

## CSV Format (47 columns)

```
s_cols[0-14] | action | reward | next_s_cols[0-14] | done
15 columns   | 1      | 1      | 15 columns        | 1
```

Example header:

```
s_session_duration,s_total_distance,...,s_persona_expert,action,reward,next_s_session_duration,...,next_s_persona_expert,done
```

## Next Steps

1. ✓ Create corrected modules (snapshotSchema, metricsCollectorSimplified)
2. ✓ Update MetricsExportPanel to use TransitionBuilder
3. ✓ Create end-to-end validation test
4. → **Delete old metricsCollector.js** (the overcomplicated version)
5. → **Test with real user interactions** (run 5-10 flows, export CSV)
6. → **Validate CSV** matches dqn_state_cols_v2.json format
7. → **Integrate into Step 3** (App.js, UIContext.js, Dashboard.js)

## Key Differences

| Aspect                 | Old (Wrong)           | New (Right)                |
| ---------------------- | --------------------- | -------------------------- |
| What's collected       | Transitions           | Snapshots                  |
| When transitions built | Collection time       | Export time                |
| "Next" state           | Separate collection   | Next snapshot              |
| Reward                 | Stored                | Computed                   |
| Storage                | Coupled (transitions) | Chronological (snapshots)  |
| Flexibility            | Low (fixed reward)    | High (any reward function) |

---

**Status**: Corrected architecture ready for testing. Waiting for confirmation to proceed with Step 3 integration (App.js, UIContext.js).
