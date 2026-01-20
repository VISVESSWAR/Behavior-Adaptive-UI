# Quick Reference: Snapshot-Based Data Collection

## Three Core Files

### 1. **snapshotSchema.js** (Import: TransitionBuilder)

Defines snapshot structure and builds transitions

```javascript
import { TransitionBuilder, snapshotToStateVector } from "./snapshotSchema.js";

// Convert snapshot → 15-col state vector
const s = snapshotToStateVector(snapshot);

// Build transitions from snapshots
const transitions = TransitionBuilder.buildTransitions(
  snapshots_sorted_by_time,
  (s_t, a_t, s_t1) => reward,
);

// Export as CSV (47 columns)
const csv = TransitionBuilder.toCSV(transitions);

// Validate data
const validation = TransitionBuilder.validate(transitions);
```

### 2. **metricsCollectorSimplified.js** (Import: MetricsCollector)

Frontend collection - snapshots only

```javascript
import MetricsCollector from "./metricsCollectorSimplified.js";

const collector = new MetricsCollector(sessionId, flowId, stepId);

// Called continuously as metrics update
collector.updateMetrics(metrics);
collector.updatePersona(persona);
collector.recordAction(actionId);

// Called every 10s
if (collector.shouldCollect()) {
  collector.collectSnapshot();
}

// On flow complete
collector.completeFlow();
const csv = collector.toCSV(rewardFn);
```

### 3. **endToEndValidation.js** (For Testing)

Generates sample data and validates pipeline

```javascript
import { runEndToEndValidation } from "./endToEndValidation.js";

const result = runEndToEndValidation();
// Shows: 5 snapshots → 4 transitions → CSV export → validation ✓
```

## Data Flow

```
User Interaction (10s window)
     ↓
Metrics Hooks (velocity, clicks, idle, etc.)
     ↓
Persona Classifier (novice_old / intermediate / expert)
     ↓
UI Action Applied (button_up, text_down, etc.)
     ↓
[COLLECT SNAPSHOT] ← Contains: metrics + persona + action
     ↓
Store in IndexedDB (chronological order)
     ↓
[REPEAT every 10s...]
     ↓
User Completes Flow
     ↓
[AT EXPORT TIME]
     ↓
Build Transitions (pair snapshots[i] with snapshots[i+1])
     ↓
Compute Rewards (function of s_t, a_t, s_{t+1})
     ↓
Export CSV (47 columns) → DQN Training
```

## Snapshot Structure

```javascript
{
  timestamp: 1705779010000,           // When collected
  sessionId: "session_123",            // Unique session
  flowId: "transaction",              // Flow type
  stepId: "confirm_payment",          // Step in flow

  metrics: {                          // 12 behavioral metrics
    session_duration: 10.2,
    total_distance: 2100,
    num_actions: 18,
    num_clicks: 2,
    mean_time_per_action: 0.42,
    vel_mean: 0.31,
    vel_std: 0.18,
    accel_mean: 0.22,
    accel_std: 0.19,
    curve_mean: 0.05,
    curve_std: 0.11,
    jerk_mean: 0.27
  },

  persona: {                          // Detected persona
    type: "novice_old",
    confidence: 0.87,
    stable: true
  },

  action: 3,                          // Action ID (0-9)

  uiState: {                          // UI state after action
    buttonSize: 2,
    textSize: 5,
    spacing: 3,
    tooltips: true
  },

  done: false                         // Flow complete?
}
```

## Building Transitions

```javascript
// Input: Array of snapshots sorted by timestamp
const snapshots = [
  snapshot_at_00s,   // s_t in transition[0]
  snapshot_at_10s,   // s'_t in transition[0], s_t in transition[1]
  snapshot_at_20s,   // s'_t in transition[1], s_t in transition[2]
  ...
];

// Process: Pair consecutive snapshots
const transitions = [
  { s: snapshots[0], a: snapshots[0].action, r: f(...), s_prime: snapshots[1], done: 0 },
  { s: snapshots[1], a: snapshots[1].action, r: f(...), s_prime: snapshots[2], done: 0 },
  { s: snapshots[2], a: snapshots[2].action, r: f(...), s_prime: snapshots[3], done: 0 },
  ...
];

// CSV: Each transition becomes one row (47 columns)
```

## Key Insight

```
Snapshot @ t=00:00 }
                    } ─→ Transition @ (t=00:00 to t=00:10)
Snapshot @ t=00:10 }

                    Snapshot @ t=00:10 }
                                        } ─→ Transition @ (t=00:10 to t=00:20)
                    Snapshot @ t=00:20 }

Note: "Next state" is NOT separately collected.
      It's the NEXT snapshot in the time series.
```

## Integration Checklist

- [ ] Remove old `metricsCollector.js` (eager transition building)
- [ ] Import `MetricsCollector` from `metricsCollectorSimplified.js`
- [ ] Import `TransitionBuilder` from `snapshotSchema.js`
- [ ] Update `MetricsExportPanel.js` (done - uses TransitionBuilder)
- [ ] Create collector instance in App.js
- [ ] Wire up metric/persona/action updates
- [ ] Test with sample data (run endToEndValidation)
- [ ] Export CSV and verify 47 columns
- [ ] Validate against dqn_state_cols_v2.json
- [ ] Deploy and collect real user data

## CSV Column Mapping

```
Column Index | Name | Type | Source
0-11         | Behavioral metrics | float | From metrics object
12-14        | Persona one-hot | 0 or 1 | From persona.type
             |                 |       |
15           | action | int (0-9) | snapshot.action
16           | reward | float | Computed from (s, a, s')
             |        |       |
17-28        | Next state metrics | float | From next snapshot
29-31        | Next persona one-hot | 0 or 1 | From next snapshot
32           | done | 0 or 1 | next_snapshot.done
```

## Example Commands

```javascript
// 1. Generate test data
import { runEndToEndValidation } from "./utils/endToEndValidation.js";
const result = runEndToEndValidation();

// 2. Build transitions
import { TransitionBuilder } from "./utils/snapshotSchema.js";
const trans = TransitionBuilder.buildTransitions(
  snapshots,
  (s, a, s_prime) => Math.random() * 2 - 1, // Random reward for testing
);

// 3. Export CSV
const csv = TransitionBuilder.toCSV(trans);
console.log(csv.split("\n").slice(0, 3).join("\n")); // Show header + first row

// 4. Validate
const valid = TransitionBuilder.validate(trans);
console.log(valid); // { valid: true, errors: [], checked: X }
```

## Common Patterns

**Reward Function Examples:**

```javascript
// Simple: Time-based
(s_t, a_t, s_t1) => s_t1.s_session_duration - s_t.s_session_duration

// Realistic: Task + Persona + Efficiency
(s_t, a_t, s_t1) => {
  const progress = (s_t1.s_session_duration - s_t.s_session_duration) * 0.1;
  const efficiency = s_t1.s_num_clicks > 10 ? -0.5 : 0;
  const persona_bonus = s_t1.s_persona_expert ? 1.0 : 0;
  return progress + efficiency + persona_bonus;
}

// ML-based: Use trained model
(s_t, a_t, s_t1) => modelPredictReward(s_t, a_t, s_t1)
```

## Files & Locations

```
src/
  utils/
    ├── snapshotSchema.js              [NEW] 408 lines
    ├── metricsCollectorSimplified.js  [NEW] 150 lines
    ├── endToEndValidation.js          [NEW] 320 lines
    ├── indexedDBManager.js            [KEEP] Storage
    ├── metricsCollector.js            [DELETE] Old version
    └── ...

  components/
    └── MetricsExportPanel.js          [UPDATED] Uses TransitionBuilder

Root/
  ├── STEP2_CORRECTED_APPROACH.md          [NEW] Full docs
  ├── STEP2_DATA_COLLECTION_CORRECTED.md   [NEW] Summary
  └── ...
```

---

**Ready for Step 3 Integration (App.js, UIContext.js)**
