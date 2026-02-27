# Adaptive UI RL Experimental Framework - Quick Reference

## What Changed

### 1. New Files Created
- `src/utils/rlLogger.jsx` - RL logging to memory buffer
- `src/utils/experimentControl.jsx` - Browser console API
- `src/utils/integrationCheck.jsx` - Verification utilities
- `EXPERIMENT_FRAMEWORK.md` - Full documentation

### 2. Files Modified
- `src/utils/dqnAdapter.jsx` - Added EXPERIMENT_MODE, decideFinalAction()
- `src/utils/metricsCollectorSimplified.jsx` - Added pathType, RL logging
- `src/pages/TransactionPage.jsx` - Added pathType logging
- `src/App.jsx` - Added experimentControl initialization

### 3. Core Features Added

#### EXPERIMENT_MODE Constant
**File**: `src/utils/dqnAdapter.jsx` line 14
```javascript
export const EXPERIMENT_MODE = "guided"; // "model" | "random" | "guided"
```
- **"model"**: Pure exploitation (use DQN action)
- **"random"**: Pure exploration (random actions)
- **"guided"**: Balanced (25% model, 55% random, 20% anti)

#### decideFinalAction() Function
**File**: `src/utils/dqnAdapter.jsx` lines 99-150
```javascript
decideFinalAction(modelAction, validActions)
  → { finalAction, source }
```
- Implements mode-specific decision logic
- Returns action and decision source
- Includes anti-model (opposite action) logic

#### pathType Assignment
**File**: `src/utils/metricsCollectorSimplified.jsx` lines ~85
```javascript
assignPathType() → "bank_transfer" | "upi_payment" | "qr_payment"
```
- Randomly assigned per session
- Stored in `this.pathType`
- Includes in every snapshot

#### RL Logging
**File**: `src/utils/rlLogger.jsx`
```javascript
appendRLLog(entry) → async void
exportRLLogs() → CSV string
clearRLLogs() → void
```
- Extended payload: timestamp, persona, pathType, modelAction, finalAction, source, reward, taskTime, success
- Non-blocking async
- Stored in `window.__rlLogs` memory buffer

#### Browser Console API
**File**: `src/utils/experimentControl.jsx`
```javascript
window.__experimentControl.getMode()
window.__experimentControl.getStatus()
window.__experimentControl.exportRLLogs()
window.__experimentControl.downloadRLLogs()
window.__experimentControl.clearRLLogs()
window.__experimentControl.help()
```

---

## Integration Points

### Snapshot Creation
**File**: `src/utils/metricsCollectorSimplified.jsx` (collectSnapshot method)

**Added**:
- `snapshot.pathType` = this.pathType
- RL logging after transition saved:
  ```javascript
  appendRLLog({
    timestamp, persona, pathType,
    modelAction, finalAction, source,
    reward, taskTime, success
  })
  ```

### Action Decision
**File**: `src/utils/metricsCollectorSimplified.jsx` (lines ~438)

**Changed from**:
```javascript
const explorationResult = this.explorer.selectAction(dqnAction);
finalAction = explorationResult.action;
```

**Changed to**:
```javascript
const decisionResult = decideFinalAction(dqnAction);
finalAction = decisionResult.finalAction;
actionSource = decisionResult.source;
console.log(`MODE: ${EXPERIMENT_MODE}`);
console.log(`ACTION SOURCE: ${actionSource}`);
```

### App Initialization
**File**: `src/App.jsx` (lines ~54)

**Added**:
```javascript
import { setupExperimentControl } from "./utils/experimentControl.jsx";
...
setupExperimentControl(); // In useEffect
```

---

## Console Commands Summary

```javascript
// Check if framework is ready
window.integrationCheck()

// View current settings
window.__experimentControl.getStatus()
// {mode: "guided", logsCount: 42, sessionId: "...", pathType: "bank_transfer"}

// Export data
window.__experimentControl.downloadRLLogs()
// Downloads: rl_logs_<timestamp>.csv

// Or get as string
const csv = window.__experimentControl.exportRLLogs()
console.log(csv)

// Clear for new experiment
window.__experimentControl.clearRLLogs()

// Show help
window.__experimentControl.help()
```

---

## How to Switch Modes

1. **Open file**: `src/utils/dqnAdapter.jsx`
2. **Find line 14**: `export const EXPERIMENT_MODE = "guided";`
3. **Edit to**: 
   - `"model"` for exploitation-only
   - `"random"` for exploration baseline
   - `"guided"` for balanced (default)
4. **Save file**
5. **Hard reload browser**: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
6. **Verify**: `window.__experimentControl.getMode()` should show new mode

---

## Typical Experiment Flow

```
────────────────────────────────────────────────────────────
SESSION 1: MODE="guided" (5-10 minutes)
────────────────────────────────────────────────────────────
1. Start app (MODE already set to "guided")
2. Complete 5-10 transactions
3. Browser console:
   > window.__experimentControl.downloadRLLogs()
   # File: rl_logs_1234567890.csv
   
────────────────────────────────────────────────────────────
SESSION 2: MODE="model" (repeat)
────────────────────────────────────────────────────────────
1. Edit src/utils/dqnAdapter.jsx → EXPERIMENT_MODE = "model"
2. Save and reload
3. Complete 5-10 transactions
4. Export logs
   # File: rl_logs_9876543210.csv

────────────────────────────────────────────────────────────
SESSION 3: MODE="random" (repeat)
────────────────────────────────────────────────────────────
1. Edit → EXPERIMENT_MODE = "random"
2. Reload and complete transactions
3. Export logs
   # File: rl_logs_5555555555.csv

────────────────────────────────────────────────────────────
ANALYSIS
────────────────────────────────────────────────────────────
Compare 3 CSV files:
- Success rate by mode
- Reward distribution
- Decision source frequency (model vs random vs anti)
- Task completion time
- Personas affected differently?
```

---

## CSV Format

Each row in exported CSV:
```
timestamp,persona,pathType,modelAction,finalAction,source,reward,taskTime,success
2026-02-27T15:30:45.123Z,intermediate,bank_transfer,3,5,random,0.12,23000,1
2026-02-27T15:30:55.456Z,novice_old,upi_payment,2,2,model,0.08,31000,1
2026-02-27T15:31:05.789Z,expert,qr_payment,7,4,anti-model,-0.05,15000,0
...
```

**Fields**:
- `timestamp`: When decision was made
- `persona`: User skill level (novice_old, intermediate, expert)
- `pathType`: Transaction type (bank_transfer, upi_payment, qr_payment)
- `modelAction`: DQN model's recommendation (0-9)
- `finalAction`: Action actually executed (0-9)
- `source`: Decision method (model, random, anti-model)
- `reward`: Dense shaped reward (float -1 to 1)
- `taskTime`: Milliseconds since task started
- `success`: 1 = task completed, 0 = timeout

---

## Debugging Tips

### Issue: Mode not changing
```javascript
// Verify reload worked:
window.__experimentControl.getMode() // should show new value

// Check browser cache:
// Hard reload: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

### Issue: No logs being collected
```javascript
// Check status:
window.__experimentControl.getStatus()
// logsCount should increase after 10 seconds

// Manual check:
window.__rlLogs.length // should be > 0
```

### Issue: Snapshots not being created
```javascript
// Open browser console
// Should see: [MetricsCollector] Starting snapshot collection...
// every 10 seconds
```

### Issue: Wrong pathType in logs
```javascript
// pathType is assigned once at app start, not changeable
// Clear logs and reload to get new pathType:
window.__experimentControl.clearRLLogs()
// Hard reload browser
// New sessions will have new random pathType
```

---

## Files to Review

1. **Main Implementation**:
   - `src/utils/dqnAdapter.jsx` - EXPERIMENT_MODE, decideFinalAction
   - `src/utils/metricsCollectorSimplified.jsx` - pathType, RL logging

2. **API & Control**:
   - `src/utils/experimentControl.jsx` - Browser console API
   - `src/utils/rlLogger.jsx` - Logging infrastructure

3. **Documentation**:
   - `EXPERIMENT_FRAMEWORK.md` - Full guide
   - This file (quick reference)

4. **Verification**:
   - `src/utils/integrationCheck.jsx` - Runtime checks
   - Run: `window.integrationCheck()`

---

## Key Constants & Thresholds

```javascript
// Decision Sources (always one of):
"model"      // 25% in GUIDED mode
"random"     // 55% in GUIDED mode
"anti-model" // 20% in GUIDED mode

// Valid Actions (0-9):
0 = noop
1 = button_up
2 = button_down
3 = text_up
4 = text_down
5 = font_up
6 = font_down
7 = spacing_up
8 = spacing_down
9 = enable_tooltips

// Snapshot Interval: 10 seconds
// Cache Duration: 500ms
// Task Time Limit: 60 seconds
```

---

## What Stayed the Same

✅ State vector: 19 features (12 mouse + 3 persona + 4 UI)
✅ Backend API: `/api/adaptive-action` unchanged
✅ Reward function: Original computation preserved
✅ UI adaptation: Existing calls work as before
✅ Task completion: Still tracked same way
✅ Database storage: IndexedDB persistence unchanged

---

**Status**: ✅ Ready for controlled experiments
**Last Updated**: February 27, 2026
**Framework Version**: 1.0
