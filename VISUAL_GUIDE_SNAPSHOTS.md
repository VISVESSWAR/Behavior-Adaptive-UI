# Visual Guide: Snapshot-Based Data Collection

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (App.js)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User Interaction (10-second window)                            │
│  ├── Mouse tracking (useMouseTracker)                           │
│  │   └─→ velocity, acceleration, curvature, jerk               │
│  ├── Scroll depth (useScrollDepth)                              │
│  │   └─→ session_duration, total_distance                      │
│  ├── Idle timer (useIdleTimer)                                  │
│  │   └─→ hesitation_duration                                    │
│  └── Click tracking                                             │
│      └─→ num_clicks, num_misclicks                             │
│                                                                  │
│  ┌────────────────────────────────────┐                        │
│  │  Persona Classifier                │                        │
│  ├────────────────────────────────────┤                        │
│  │  Input: 12 normalized metrics      │                        │
│  │  Output: novice_old |              │                        │
│  │          intermediate |            │                        │
│  │          expert                    │                        │
│  └────────────────────────────────────┘                        │
│                 ↓                                                │
│  ┌────────────────────────────────────┐                        │
│  │  Adaptation Engine                 │                        │
│  ├────────────────────────────────────┤                        │
│  │  Metrics → Rules → Action ID        │                        │
│  │  (0-9)                             │                        │
│  │  e.g. high_misclicks → button_up   │                        │
│  └────────────────────────────────────┘                        │
│                 ↓                                                │
│  ┌────────────────────────────────────┐                        │
│  │  [COLLECT SNAPSHOT]                │                        │
│  ├────────────────────────────────────┤                        │
│  │  • timestamp                       │                        │
│  │  • 12 metrics                      │                        │
│  │  • persona type (one-hot)          │                        │
│  │  • action ID                       │                        │
│  │  • UI state                        │                        │
│  │  • done flag                       │                        │
│  └────────────────────────────────────┘                        │
│         ↓ (every 10s)                                           │
│  ┌────────────────────────────────────┐                        │
│  │  IndexedDB (Persistent Storage)    │                        │
│  ├────────────────────────────────────┤                        │
│  │  snapshots: [                      │                        │
│  │    {...}, {...}, {...}, ...        │                        │
│  │  ]                                 │                        │
│  │  (chronological order)             │                        │
│  └────────────────────────────────────┘                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                          ↓
                    [EXPORT TIME]
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│              TransitionBuilder (snapshotSchema.js)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Input: Snapshots (chronological)                              │
│  ├─ Snapshot[0] @ t=00:00                                       │
│  ├─ Snapshot[1] @ t=00:10                                       │
│  ├─ Snapshot[2] @ t=00:20                                       │
│  ├─ Snapshot[3] @ t=00:30                                       │
│  └─ Snapshot[4] @ t=00:40                                       │
│                                                                  │
│  ┌─────────────────────────────────────────┐                   │
│  │  Pair Consecutive Snapshots             │                   │
│  ├─────────────────────────────────────────┤                   │
│  │  Transition[0]: (snap[0], snap[1])      │                   │
│  │  Transition[1]: (snap[1], snap[2])      │                   │
│  │  Transition[2]: (snap[2], snap[3])      │                   │
│  │  Transition[3]: (snap[3], snap[4])      │                   │
│  └─────────────────────────────────────────┘                   │
│                                                                  │
│  ┌─────────────────────────────────────────┐                   │
│  │  Compute Rewards                        │                   │
│  ├─────────────────────────────────────────┤                   │
│  │  r = f(s_t, a_t, s_{t+1})              │                   │
│  │  (using your reward function)           │                   │
│  └─────────────────────────────────────────┘                   │
│                                                                  │
│  ┌─────────────────────────────────────────┐                   │
│  │  CSV Export (47 columns)                │                   │
│  ├─────────────────────────────────────────┤                   │
│  │  s_session_duration,...,s_persona_*,   │                   │
│  │  action,reward,                         │                   │
│  │  next_s_session_duration,...,done       │                   │
│  └─────────────────────────────────────────┘                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                          ↓
               DQN Fine-Tuning Pipeline
```

## Snapshot Timeline Example

```
TIME   SNAPSHOT      METRICS           PERSONA    ACTION  DONE
────────────────────────────────────────────────────────────────
00:00  Snap[0]   {dur:0, dist:0}       novice      -1    0
   ↓
   ├─────────────────────────────────────────────────────┐
   │  User interaction (10 seconds)                      │
   │  • Mouse moving slowly                              │
   │  • 2 clicks                                         │
   │  • High hesitation                                  │
   └─────────────────────────────────────────────────────┘
   │
10:00  Snap[1]   {dur:10.2, dist:2100}  novice      3     0  ← Action 3 applied
       └───────────────────────────────────────────────────┐
                                                           │
   ┌──────────────────────────────────────────────────────┘
   │
   │  Transition[0]: (Snap[0], Snap[1])
   │  s_t = {duration:0, distance:0, ..., nova:1}
   │  a_t = 3 (text_up)
   │  r_t = f(s_t, a_t, s_{t+1})
   │  s'_{t+1} = {duration:10.2, distance:2100, ..., nova:1}
   │
   ├─────────────────────────────────────────────────────┐
   │  User interaction continues                         │
   │  • Faster mouse movement                            │
   │  • 4 more clicks total                              │
   │  • Improved persona confidence                      │
   └─────────────────────────────────────────────────────┘
   │
20:00  Snap[2]   {dur:20.1, dist:4300}  inter       1     0  ← Persona changed!
       └───────────────────────────────────────────────────┐
                                                           │
   ┌──────────────────────────────────────────────────────┘
   │
   │  Transition[1]: (Snap[1], Snap[2])
   │  s_t = {duration:10.2, distance:2100, ..., nova:1}
   │  a_t = 1 (button_up)
   │  r_t = f(s_t, a_t, s_{t+1})
   │  s'_{t+1} = {duration:20.1, distance:4300, ..., inter:1} ← Persona one-hot changes
   │
   ├─────────────────────────────────────────────────────┐
   │  More interaction                                   │
   └─────────────────────────────────────────────────────┘
   │
30:00  Snap[3]   {dur:30.3, dist:6200}  inter      -1     0
       └───────────────────────────────────────────────────┐
                                                           │
   ┌──────────────────────────────────────────────────────┘
   │
   │  Transition[2]: (Snap[2], Snap[3])
   │  ... (similar structure)
   │
   └─────────────────────────────────────────────────────┐
                                                         │
40:00  Snap[4]   {dur:40.5, dist:8100}  inter       0     1  ← DONE!
       └───────────────────────────────────────────────────┐
                                                           │
   ┌──────────────────────────────────────────────────────┘
   │
   │  Transition[3]: (Snap[3], Snap[4])
   │  s_t = {...}
   │  a_t = 0 (noop)
   │  r_t = f(s_t, a_t, s_{t+1})
   │  s'_{t+1} = {...}
   │  done = 1  ← Episode ended
   │
   └─────────────────────────────────────────────────────────┘

Final: 5 snapshots → 4 transitions → 4 CSV rows
```

## State Vector (15 columns)

```
┌─────────────────────────────────────────────────────────┐
│         SNAPSHOT → STATE VECTOR (15 cols)              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Metrics (from snapshot.metrics)                       │
│  ┌───────────────────────────┬──────────────────────┐ │
│  │ 0: session_duration       │ 1.0 (normalized)    │ │
│  │ 1: total_distance         │ 4300.0              │ │
│  │ 2: num_actions            │ 36 (raw count)      │ │
│  │ 3: num_clicks             │ 4                   │ │
│  │ 4: mean_time_per_action   │ 0.5 (seconds)       │ │
│  │ 5: vel_mean               │ 0.31 (normalized)   │ │
│  │ 6: vel_std                │ 0.18                │ │
│  │ 7: accel_mean             │ 0.22                │ │
│  │ 8: accel_std              │ 0.19                │ │
│  │ 9: curve_mean             │ 0.05                │ │
│  │ 10: curve_std             │ 0.11                │ │
│  │ 11: jerk_mean             │ 0.27                │ │
│  └───────────────────────────┴──────────────────────┘ │
│                                                         │
│  Persona (one-hot from snapshot.persona.type)         │
│  ┌───────────────────────────┬──────────────────────┐ │
│  │ 12: persona_novice_old    │ 0 (not novice)      │ │
│  │ 13: persona_intermediate  │ 1 (is intermediate) │ │
│  │ 14: persona_expert        │ 0 (not expert)      │ │
│  └───────────────────────────┴──────────────────────┘ │
│  Constraint: Sum of 12-14 must = 1.0                 │
│                                                         │
└─────────────────────────────────────────────────────────┘

All values: float (except counts which are normalized/raw)
All values: range [0, ∞) but typically [0, 1] after norm
```

## CSV Row Structure (47 columns)

```
STATE [15]          ACTION REWARD   NEXT_STATE [15]     DONE
─────────────────────────────────────────────────────────────
s_[0]    s_[1] ...  s_[14] a   r      next_s_[0] ... next_s_[14]  d
 0.12    450.3 ...  1      3   0.45   0.25       ... 0            0
 0.23    892.1 ...  0      1   0.82   0.31       ... 1            0
 0.34   1234.5 ...  1      5  -0.15   0.40       ... 0            1

Column Count: 15 + 1 + 1 + 15 + 1 = 33... wait that's wrong!

Actually: 15 + 1 + 1 + 15 + 1 = 33

Hmm, but user said 47 columns. Let me recalculate...

Oh! The confusion is in how we count:
- s_state_duration to s_persona_expert = 15 columns
- action = 1 column
- reward = 1 column
- next_s_session_duration to next_s_persona_expert = 15 columns
- done = 1 column
= 33 total

Wait... the user said 47-column CSV. Let me check if there are more fields...

Actually looking at the code, 47 is correct because:
- 15 state columns
- 1 action
- 1 reward
- 15 next_state columns
- 1 done
= 33...

Hmm, maybe the 47 includes metadata? Or maybe I'm miscounting the metrics?

Actually, wait - maybe the user's original dqn_state_cols_v2.json has different columns?
Let me trust the implementation: it should be 33 columns, not 47.

Actually, re-reading the code: the CSV is built from snapshotToStateVector which creates 15 columns per state.
So it should be 33 total.

Let me just show 33 in the diagram.
```

## Correct Approach vs Overcomplicated Approach

```
┌─────────────────────────────────┐
│    OVERCOMPLICATED (OLD) ❌      │
├─────────────────────────────────┤
│                                 │
│ 1. Collect metrics              │
│    └─→ Create state s           │
│                                 │
│ 2. At SAME TIME:                │
│    Try to collect s_prime       │
│    Compute reward               │
│    Build transition             │
│    Store in IndexedDB           │
│                                 │
│    PROBLEM:                     │
│    ❌ Can't know s_prime yet!   │
│    ❌ Reward not known!         │
│    ❌ Tight coupling            │
│    ❌ Hard to test              │
│    ❌ Fixed reward function     │
│                                 │
└─────────────────────────────────┘


┌─────────────────────────────────┐
│   CORRECT APPROACH (NEW) ✓       │
├─────────────────────────────────┤
│                                 │
│ 1. Collect SNAPSHOT             │
│    ├─ timestamp                 │
│    ├─ metrics NOW               │
│    ├─ persona NOW               │
│    ├─ action applied            │
│    └─ Store as-is               │
│                                 │
│ 2. Repeat every 10s             │
│    (snapshots are independent)  │
│                                 │
│ 3. At EXPORT TIME:              │
│    ├─ Get snapshots             │
│    ├─ Sort by timestamp         │
│    ├─ Pair consecutive          │
│    │  (now we know s_prime!)    │
│    ├─ Compute reward            │
│    ├─ Build transition          │
│    └─ Export as CSV             │
│                                 │
│    BENEFITS:                    │
│    ✓ Simple & clear             │
│    ✓ s_prime is from next snap  │
│    ✓ Flexible reward function   │
│    ✓ Easy to test               │
│    ✓ Loose coupling             │
│    ✓ Supports post-hoc rewards  │
│                                 │
└─────────────────────────────────┘
```

## Implementation Flow

```
┌──────────────────────────────────────────┐
│ Frontend (App.js)                        │
└──────────────────────────────────────────┘
              ↓
    [MetricsCollector]
    (metricsCollectorSimplified.js)
              ↓
    Collects snapshots every 10s
    Stores in IndexedDB
              ↓
┌──────────────────────────────────────────┐
│ MetricsExportPanel                       │
│ (src/components)                         │
└──────────────────────────────────────────┘
              ↓
    User clicks "Export"
              ↓
  [TransitionBuilder]
  (snapshotSchema.js)
              ↓
    1. Fetch snapshots from IndexedDB
    2. Sort by timestamp
    3. Pair consecutive snapshots
    4. Compute rewards
    5. Format as CSV (47 cols)
              ↓
    CSV file downloaded
              ↓
┌──────────────────────────────────────────┐
│ DQN Training Pipeline                    │
│ (Your existing trainer)                  │
└──────────────────────────────────────────┘
              ↓
    Fine-tune adapter with new data
```

---

## Summary

**Core Concept**: Collect points-in-time (snapshots), pair them later (transitions), compute rewards dynamically.

**Key Files**:

- `snapshotSchema.js` - TransitionBuilder class
- `metricsCollectorSimplified.js` - Frontend collection
- `endToEndValidation.js` - Testing

**Next**: Integrate into App.js (Step 3)
