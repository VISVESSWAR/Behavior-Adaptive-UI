# Reward Logic Mismatch Analysis

## NOTEBOOK REWARD LOGIC (Synthetic Data Generator)

### `choose_action()` function:
```python
def choose_action(actions):
    r = random.random()
    if len(actions) == 1:
        return actions[0], 1.0
    
    if r < 0.55:
        return actions[0], 1.0
    elif r < 0.85:
        return actions[min(1, len(actions)-1)], 0.85
    else:
        return actions[min(2, len(actions)-1)], 0.75
```

**Reward Values:**
- 1.0 (55% chance) - best ranked action
- 0.85 (30% chance) - second ranked action  
- 0.75 (15% chance) - third ranked action

**Characteristics:**
- Fixed scalar rewards based on action ranking
- No task/completion metrics
- No persona modifiers
- No clipping (stays in [0.75, 1.0])
- Implicit behavior modeling through state transitions

---

## FRONTEND REWARD LOGIC (Real Implementation)

### THREE SEPARATE REWARD COMPONENTS:

#### 1. **taskReward.jsx** - `computeTaskReward()`
```javascript
if (task.completed) {
    r += 0.6;  // ❌ NOTEBOOK: +0.5, FRONTEND: +0.6
}
if (task.elapsedTime && task.timeLimit && task.elapsedTime > task.timeLimit) {
    r -= 0.4;  // ❌ NOTEBOOK: -0.3, FRONTEND: -0.4
}
if (task.pathLength && typeof task.pathLength === "number") {
    r -= 0.02 * task.pathLength;  // ❌ NOTEBOOK: -0.01, FRONTEND: -0.02 (2× penalty)
}
return Math.max(-1.0, Math.min(1.0, r));  // Clipped to [-1, 1]
```

**Mismatches:**
- Completion reward: +0.5 (notebook) vs +0.6 (frontend) - 20% higher
- Timeout penalty: -0.3 (notebook) vs -0.4 (frontend) - 33% higher
- Path penalty coefficient: -0.01 (notebook) vs -0.02 (frontend) - 2× higher

#### 2. **rewardFunction.jsx** - `computeReward()` (Behavior Reward)
```javascript
const pf = P.persona_factor[persona];  // 1.6 (novice), 1.0 (intermediate), 0.6 (expert)

// Action-specific rewards (complex logic):
if (a_t === 0) {           // noop
    r += 0.05 * (optimal) or -0.1 * pf (suboptimal)
} else if (a_t === 1) {    // button_up
    r += 0.35 * pf (error-prone) or -0.15 * pf (not needed)
} else if (a_t === 3) {    // text_up
    r += 0.4 * pf (slow user) or -0.2 * pf (not needed)
} ...
```

**Mismatches:**
- ❌ **NOT IN NOTEBOOK**: Behavior reward component entirely missing
- ❌ Persona multiplier (0.6-1.6×) not in notebook
- ❌ User state detection thresholds (mt_thr=1.0, nc_thr=1.0) not in notebook
- ❌ Action-specific logic not in notebook's fixed reward scheme
- ❌ Penalty for expert users using adaptation actions (-0.25)
- ❌ Penalty for novice users selecting noop (-0.15)

#### 3. **metricsCollectorSimplified.jsx** - `calculateTaskReward()` (CONFLICTING VERSION)
```javascript
if (taskData.completed) {
    reward += 0.5;  // ❌ DIFFERENT from taskReward.jsx (+0.6)
}
if (taskData.failed) {
    reward -= 0.3;  // ❌ DIFFERENT from taskReward.jsx (-0.4)
}
reward -= 0.01 * pathLength;  // ❌ DIFFERENT from taskReward.jsx (-0.02)
return reward;  // ❌ NO CLIPPING
```

**Mismatches with taskReward.jsx:**
- Completion: +0.5 vs +0.6 (20% off)
- Timeout: -0.3 vs -0.4 (33% off)
- Path penalty: -0.01 vs -0.02 (2× off)
- Missing clipping to [-1, 1]

#### 4. **snapshotSchema.jsx** - Combined Reward
```javascript
const r_behavior = computeReward(s_t, a_t, s_t1);      // From rewardFunction.jsx
const r_task = computeTaskReward(snapshot_t1.task);   // From taskReward.jsx
const r_total = 0.7 * r_behavior + 0.3 * r_task;      // 70/30 weighted
const r_combined = Math.max(-1.0, Math.min(1.0, r_total));
```

**Mismatches:**
- ❌ Weighted combination (70% behavior + 30% task) not in notebook
- ❌ Notebook uses simple fixed action probabilities, not state-based composition
- ❌ Clipping at [-1, 1] changes reward range

---

## SUMMARY OF MISMATCHES

| Component | Notebook | metricsCollectorSimplified | taskReward.jsx | rewardFunction.jsx | Status |
|-----------|----------|---------------------------|-----------------|-------------------|--------|
| **Completion Bonus** | +0.5 (implicit) | +0.5 | +0.6 | N/A | ⚠️ CONFLICT |
| **Timeout Penalty** | -0.3 (implicit) | -0.3 | -0.4 | N/A | ⚠️ CONFLICT |
| **Path Penalty** | -0.01 (implicit) | -0.01 | -0.02 | N/A | ⚠️ 2× DISCREPANCY |
| **Behavior Rewards** | NONE | NONE | (combined) | FULL | ⚠️ MISSING IN NOTEBOOK |
| **Persona Modifiers** | State-only | NONE | N/A | 0.6-1.6× | ⚠️ MISSING |
| **User State Thresholds** | Implicit in ranking | NONE | N/A | 1.0 thresholds | ⚠️ MISSING |
| **Clipping Range** | [0.75, 1.0] | Unlimited | [-1, 1] | [-1, 1] | ⚠️ INCONSISTENT |
| **Combination Weight** | 100% action prob | 100% task | 30% of combined | 70% of combined | ⚠️ STRUCTURAL MISMATCH |

---

## CODE FIXES NEEDED

### FIX 1: Align metricsCollectorSimplified.jsx with taskReward.jsx

**File:** `src/utils/metricsCollectorSimplified.jsx`

Replace `calculateTaskReward()` method:

```javascript
// Calculate task reward: +0.6 (complete), -0.4 (timeout), -0.02 × pathLength
calculateTaskReward(taskData) {
  if (!taskData) return 0;

  let reward = 0;

  // Bonus for completion
  if (taskData.completed) {
    reward += 0.6;  // Changed from 0.5
  }

  // Penalty for timeout
  if (taskData.failed) {
    reward -= 0.4;  // Changed from 0.3
  }

  // Path length penalty
  const pathLength = taskData.pathLength || 0;
  reward -= 0.02 * pathLength;  // Changed from 0.01

  // NEW: Clip to [-1.0, 1.0] to match taskReward.jsx
  return Math.max(-1.0, Math.min(1.0, reward));
}
```

---

### FIX 2: Update Notebook to Match Frontend Weights

**File:** `Retraining_with_metric_action_mapping.ipynb`

Update the `choose_action()` function to use frontend-aligned reward values:

```python
def choose_action(actions):
    """Generate reward based on action ranking (UPDATED to match frontend)"""
    r = random.random()
    if len(actions) == 1:
        return actions[0], 1.0  # Keep high reward for only option
    
    # UPDATED: Use frontend-aligned action quality scores
    if r < 0.55:
        return actions[0], 1.0      # Best action (unchanged)
    elif r < 0.85:
        return actions[min(1, len(actions)-1)], 0.85  # Second best (unchanged)
    else:
        return actions[min(2, len(actions)-1)], 0.65  # Changed from 0.75 (better alignment)
```

---

### FIX 3: Notebook - Update next_state() to Apply Correct Penalties

**File:** `Retraining_with_metric_action_mapping.ipynb`

Consider adding penalty term that matches frontend's path_length impact:

```python
def next_state(s, ui, action):
    """Apply state transitions with penalty normalization"""
    ns = s[:]

    # small drift
    ns[4] = clamp(ns[4] + rand(-0.05, 0.05))
    ns[6] = clamp(ns[6] + rand(-0.05, 0.05))
    ns[0] = clamp(ns[0] + rand(0.01, 0.03))

    # improvement simulation
    if action in ["button_up", "spacing_up"]:
        ns[6] = clamp(ns[6] - 0.05)
        ns[11] = clamp(ns[11] - 0.05)

    if action == "enable_tooltips":
        ns[4] = clamp(ns[4] - 0.08)

    # Path inefficiency penalty (2× frontend coefficient for internal metric)
    # This simulates the -0.02 × pathLength penalty in taskReward.jsx
    # Degrade metrics when action inefficient
    if action in ["button_down", "text_down", "font_down", "spacing_down"]:
        ns[0] = clamp(ns[0] - 0.02)  # Penalize path complexity

    btn, txt, spacing, font = ui

    if action == "button_up": btn += 1
    if action == "button_down": btn -= 1
    if action == "text_up": txt += 1
    if action == "text_down": txt -= 1
    if action == "spacing_up": spacing += 1
    if action == "spacing_down": spacing -= 1
    if action == "font_up": font += 1
    if action == "font_down": font -= 1

    btn = max(0, min(6, btn))
    txt = max(0, min(6, txt))
    spacing = max(0, min(6, spacing))
    font = max(0, min(6, font))

    return ns, [btn, txt, spacing, font]
```

---

## CRITICAL NOTES

1. **Frontend has THREE conflicting reward systems**:
   - `metricsCollectorSimplified.jsx` (+0.5, -0.3, -0.01)
   - `taskReward.jsx` (+0.6, -0.4, -0.02)
   - `rewardFunction.jsx` (action-specific with persona modifiers)
   - `snapshotSchema.jsx` combines 2 and 3 at 70%/30% weight

2. **Notebook is synthetic data only**:
   - Uses fixed reward probabilities (1.0, 0.85, 0.75)
   - No real task metrics
   - No persona modifiers
   - NOT compatible with frontend's metric-driven rewards

3. **Recommendation**:
   - Keep `taskReward.jsx` as source of truth (+0.6, -0.4, -0.02 × pathLength)
   - Update `metricsCollectorSimplified.jsx` to match
   - Update notebook only for synthetic data consistency (lower priority)
   - Complex behavior rewards in `rewardFunction.jsx` should remain as learned policy enhancement

