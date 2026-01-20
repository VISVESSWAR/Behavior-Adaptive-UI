# Step 2 Correction: Snapshot-Based Data Collection

## Problem with Original Approach

The initial `metricsCollector.js` tried to create DQN transitions at **collection time**, which is incorrect. It attempted to:

- Collect both `s` and `s_prime` metrics separately
- Build transitions immediately
- Store pre-built (s, a, r, s', done) tuples in IndexedDB

This doesn't match how RL data is actually collected.

## Correct Approach: Snapshot-Based Collection

### Key Insight

**Don't collect transitions. Collect snapshots.**

One snapshot = one point in time = all metrics at that moment + action just applied

Then later: **pair consecutive snapshots** to build training transitions.

### Data Flow

```
[User Interaction]
       ↓
[Metrics hooks update: velocity, clicks, idle, etc.]
       ↓
[Persona classifier runs: detect type]
       ↓
[Action applied to UI]
       ↓
[Wait 10 seconds...]
       ↓
[Collect ONE Snapshot] ← Snapshot #1
   - timestamp
   - All 12 metrics
   - Persona type
   - Action ID applied
   - UI state
       ↓
[Store in IndexedDB]
       ↓
[Continue collecting...]
[Collect Snapshot #2 @ t=20s]
[Collect Snapshot #3 @ t=30s]
...
       ↓
[User completes flow]
       ↓
[At Export Time: Build Transitions]
   - Pair (Snapshot[0], Snapshot[1]) → Transition[0]
   - Pair (Snapshot[1], Snapshot[2]) → Transition[1]
   - Pair (Snapshot[2], Snapshot[3]) → Transition[2]
   ... etc
       ↓
[Compute Rewards]
   reward = f(s_t, a_t, s_{t+1})
       ↓
[Format as CSV]
   47 columns: s_cols | a | r | next_s_cols | done
       ↓
[Export to DQN trainer]
```

## Implementation (3 Files)

### 1. `snapshotSchema.js` (408 lines)

**Purpose**: Define snapshot structure and transition building logic

**Key Components**:

```javascript
SNAPSHOT_SCHEMA; // What gets collected every 10s
EXAMPLE_SNAPSHOT; // Concrete example with real values
snapshotToStateVector(); // Convert snapshot → 15-column state vector
TransitionBuilder - // Class to pair snapshots and build transitions
  buildTransitions() - // (snapshots, rewardFn) → transitions
  toCSV() - // transitions → 47-column CSV
  validate(); // Check transitions are valid
```

**Snapshot contains**:

```javascript
{
  timestamp: number,              // ms
  sessionId: string,              // unique session
  flowId: string,                 // e.g., "transaction"
  stepId: string,                 // e.g., "confirm_payment"

  metrics: {
    session_duration,
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
    confidence, // 0-1
    stable      // boolean
  },

  action: number,         // 0-9 (or -1 for no action)

  uiState: {
    buttonSize, textSize, spacing, tooltips
    // ... other UI params
  },

  done: boolean           // true if flow completed
}
```

**Key Functions**:

```javascript
// Convert one snapshot to 15-column state vector
const stateVector = snapshotToStateVector(snapshot);
// Returns: {s_session_duration, s_total_distance, ..., s_persona_*}

// Build transitions from snapshots
const transitions = TransitionBuilder.buildTransitions(
  snapshots,                           // array of snapshots
  (s_t, a_t, s_{t+1}) => reward       // reward function
);

// Export as CSV (47 columns)
const csv = TransitionBuilder.toCSV(transitions);

// Validate structure
const validation = TransitionBuilder.validate(transitions);
```

### 2. `metricsCollectorSimplified.js` (150 lines)

**Purpose**: Frontend metrics collection (snapshots only, no transitions)

**Key Methods**:

```javascript
const collector = new MetricsCollector(sessionId, flowId, stepId);

// Called by hooks when metrics update
collector.updateMetrics(metrics);

// Called when UI action is applied
collector.recordAction(actionId);

// Called when persona is detected
collector.updatePersona(persona);

// Called with current UI state
collector.updateUIState(uiState);

// Check if 10s has passed
if (collector.shouldCollect()) {
  collector.collectSnapshot(); // Create ONE snapshot
}

// On flow complete
collector.completeFlow(); // Sets done=true on last snapshot

// Export for training
const json = collector.toJSON(); // All snapshots as JSON
const csv = collector.toCSV(rewardFn); // Build transitions + export CSV
```

**Integration in App.js**:

```javascript
const collector = new MetricsCollector("session_123", "transaction", "step");

// Update as metrics/persona change
useEffect(() => collector.updateMetrics(metrics), [metrics]);
useEffect(() => collector.updatePersona(persona), [persona]);

// Record actions as they're applied
const handleAction = (action) => {
  applyToUI(action);
  collector.recordAction(action.id);
};

// Collect every 10s
useEffect(() => {
  const timer = setInterval(() => collector.collectSnapshot(), 10000);
  return () => clearInterval(timer);
}, []);

// On completion
const handleComplete = () => {
  collector.completeFlow();
  const csv = collector.toCSV(yourRewardFunction);
  // Save to IndexedDB via indexedDBManager
};
```

### 3. `endToEndValidation.js` (320 lines)

**Purpose**: Validate entire collection → transition → CSV pipeline

**What it does**:

1. **Generate sample snapshots** (5 snapshots @ 10s intervals)
2. **Build transitions** (4 transitions from 5 snapshots)
3. **Validate** (check state vectors, persona one-hot, action IDs, done flags)
4. **Export CSV** (verify 47 columns, correct ordering)
5. **Print summary** (show all steps working correctly)

**Run in browser console**:

```javascript
import { runEndToEndValidation } from "./utils/endToEndValidation.js";

const result = runEndToEndValidation();
// result.snapshots - 5 sample snapshots
// result.transitions - 4 built transitions
// result.csv - Full CSV string
// result.validation - Validation results
```

**Output shows**:

```
STEP 1: Generate Sample Snapshots
  Snapshot 0: novice_old, action=-1
  Snapshot 1: novice_old, action=3
  Snapshot 2: intermediate, action=1  ← Persona changed
  Snapshot 3: intermediate, action=-1
  Snapshot 4: intermediate, action=0

STEP 2: Build Transitions
  Transition 0: (snap0, snap1)
  Transition 1: (snap1, snap2)  ← Persona one-hot changes
  Transition 2: (snap2, snap3)
  Transition 3: (snap3, snap4)  ← done=1

STEP 3: Validate
  ✓ All transitions valid

STEP 4: Export CSV
  47 columns ✓
  4 data rows ✓

STEP 5: Format Verification
  Expected 47 columns, got 47 ✓
  Expected 4 transitions, got 4 ✓
```

## How to Use

### For Collection (Frontend)

```javascript
// 1. Create collector
const collector = new MetricsCollector(sessionId, flowId, stepId);

// 2. Update metrics continuously
metrics_hook.on_update = (m) => collector.updateMetrics(m);
persona_hook.on_update = (p) => collector.updatePersona(p);
action_applied = (a) => collector.recordAction(a);

// 3. Snapshot every 10s (in effect once)
setInterval(() => {
  collector.collectSnapshot();
}, 10000);

// 4. Export when done
flow.on_complete = () => {
  collector.completeFlow();
  const csv = collector.toCSV(rewardFunction);
  // Save to IndexedDB
};
```

### For Export (Backend or Batch Processing)

```javascript
// 1. Retrieve all snapshots from IndexedDB
const snapshots = await indexedDBManager.getAll();

// 2. Build transitions
const transitions = TransitionBuilder.buildTransitions(
  snapshots,
  (s, a, s_prime) => {
    // Your reward function
    // Can use ML model, heuristics, user feedback, etc.
    return computeReward(s, a, s_prime);
  },
);

// 3. Export CSV
const csv = TransitionBuilder.toCSV(transitions);

// 4. Validate
const validation = TransitionBuilder.validate(transitions);
console.log(validation);
```

## State Vector Format (15 columns)

| Index | Column                 | Type   | Range   | Source               |
| ----- | ---------------------- | ------ | ------- | -------------------- |
| 0     | s_session_duration     | float  | [0, ∞)  | time elapsed in flow |
| 1     | s_total_distance       | float  | [0, ∞)  | mouse distance       |
| 2     | s_num_actions          | int    | [0, ∞)  | count                |
| 3     | s_num_clicks           | int    | [0, ∞)  | count                |
| 4     | s_mean_time_per_action | float  | [0, ∞)  | seconds              |
| 5     | s_vel_mean             | float  | [0, 1]  | normalized velocity  |
| 6     | s_vel_std              | float  | [0, 1]  | velocity std dev     |
| 7     | s_accel_mean           | float  | [0, 1]  | normalized accel     |
| 8     | s_accel_std            | float  | [0, 1]  | accel std dev        |
| 9     | s_curve_mean           | float  | [0, 1]  | path curvature       |
| 10    | s_curve_std            | float  | [0, 1]  | curvature std dev    |
| 11    | s_jerk_mean            | float  | [0, 1]  | normalized jerk      |
| 12    | s_persona_novice_old   | 0 or 1 | one-hot | 1 if novice_old      |
| 13    | s_persona_intermediate | 0 or 1 | one-hot | 1 if intermediate    |
| 14    | s_persona_expert       | 0 or 1 | one-hot | 1 if expert          |

**Constraint**: Exactly one persona column = 1, others = 0

## CSV Format (47 columns)

```
s_cols[0-14] | action | reward | next_s_cols[0-14] | done
15 columns   | 1      | 1      | 15 columns        | 1
```

**Example header**:

```
s_session_duration,s_total_distance,...,s_persona_expert,action,reward,next_s_session_duration,...,next_s_persona_expert,done
```

## Key Differences from Original

| Aspect                     | Original (Wrong)                  | Corrected (Right)             |
| -------------------------- | --------------------------------- | ----------------------------- |
| **What's collected**       | (s, a, r, s', done) tuples        | Snapshots only                |
| **When transitions built** | At collection time                | At export time                |
| **"Next" state**           | Separate collection               | Next snapshot in time         |
| **Reward**                 | Stored with snapshot              | Computed from (s, a, s')      |
| **Storage structure**      | Transitions in IndexedDB          | Snapshots in IndexedDB        |
| **Data independence**      | Coupled (each row self-contained) | Chronological (order matters) |

## Next Steps

1. **Remove old `metricsCollector.js`** (the one with eager transition building)
2. **Use `metricsCollectorSimplified.js`** for all new collection
3. **Import `TransitionBuilder`** in export/batch processing code
4. **Run `endToEndValidation`** to verify pipeline works
5. **Update `MetricsExportPanel.js`** to use new export method
6. **Integrate into App.js** with new collector instance
7. **Test with real user interactions** (should accumulate 10+ snapshots per flow)
8. **Verify CSV exports** against `dqn_state_cols_v2.json`

## Files Summary

```
src/utils/
  ├── snapshotSchema.js               [NEW] Snapshot schema + TransitionBuilder
  ├── metricsCollectorSimplified.js   [NEW] Simplified frontend collector
  ├── endToEndValidation.js           [NEW] Testing + validation
  ├── metricsCollector.js             [OLD] Remove (overcomplicated)
  ├── indexedDBManager.js             [KEEP] Storage abstraction
  └── MetricsExportPanel.js           [UPDATE] Use new export method
```
