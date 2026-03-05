# Adaptive UI ML Integration Pipeline - Audit Report

**Date:** March 5, 2026  
**Scope:** RandomForest policy model feature schema validation and prediction pipeline  
**Status:** ✅ AUDIT COMPLETE - CORRECTIVE MEASURES IMPLEMENTED

---

## Executive Summary

The RandomForest adaptive UI model pipeline had **critical schema mismatches** that would cause predictions to fail or receive incorrect feature configurations. The audit identified 5 major issues and implemented comprehensive validation, truncation, and logging mechanisms.

---

## Issues Identified

### ❌ Issue 1: Incoming State Vector Exceeds Training Schema
**Severity:** 🔴 CRITICAL  
**Location:** Frontend → Backend Pipeline

**Problem:**
- The frontend `metricsToStateVector()` in `dqnAdapter.jsx` creates a **19-feature** state vector
- This includes 4 extra UI level features:
  - `buttonSize` (normalized 0-6)
  - `textSize` (normalized 0-6)
  - `spacing` (normalized 0-6)
  - `fontWeight` (normalized 0-6)
- The RandomForest model was trained with only **15 features**
- No truncation logic existed in the original `/adaptive-action` endpoint

**Impact:** Model receives 4 unexpected/garbage features that weren't in training data, degrading prediction quality.

---

### ❌ Issue 2: No Explicit State Vector Size Validation
**Severity:** 🔴 CRITICAL  
**Location:** `server.py` → `/adaptive-action` endpoint

**Problem:**
- Original code: `if len(state) < len(feature_columns)` only checked for insufficient features
- No check for **excess features** (>15)
- No explicit comparison to `EXPECTED_FEATURE_COUNT` constant
- Relied on dynamically loaded `feature_columns` pickle file (fragile)

**Impact:** Extra features pass validation silently and are mapped incorrectly.

---

### ❌ Issue 3: Missing Model Schema Metadata
**Severity:** 🟠 HIGH  
**Location:** `server.py` → Model initialization

**Problem:**
- `model.n_features_in_` was never printed or validated
- No assertion that loaded model matches expected 15 features
- No column order validation at startup
- Feature columns loaded from pickle file without verification

**Impact:** Cannot detect training/deployment schema mismatches at service startup.

---

### ❌ Issue 4: Feature Order Not Explicitly Enforced
**Severity:** 🟠 HIGH  
**Location:** `server.py` → `/adaptive-action` endpoint

**Problem:**
- DataFrame created with potentially wrong column order
- Relied on loaded `feature_columns` list rather than hardcoded expected schema
- No explicit `df = df[EXPECTED_FEATURE_COLUMNS]` reordering
- Feature names don't match request parameter names

**Impact:** If pickle files are corrupted or from wrong training run, silent misalignment occurs.

---

### ❌ Issue 5: Insufficient Debug Logging
**Severity:** 🟡 MEDIUM  
**Location:** `server.py` → `/adaptive-action` endpoint

**Problem:**
- No per-feature logging of values
- No log of actual feature names being used
- DataFrame state not printed
- No indication of whether features were truncated

**Impact:** Cannot diagnose prediction errors without adding custom debug code.

---

## Expected Feature Schema (Ground Truth)

The RandomForest model was trained with exactly **15 features** in this order:

| Index | Feature Name | Type | Description |
|-------|--------------|------|-------------|
| 0 | `s_session_duration` | Mouse Behavior | Total session time (normalized) |
| 1 | `s_total_distance` | Mouse Behavior | Total cursor distance (normalized) |
| 2 | `s_num_actions` | Mouse Behavior | Number of actions taken (normalized) |
| 3 | `s_num_clicks` | Mouse Behavior | Number of clicks (normalized) |
| 4 | `s_mean_time_per_action` | Mouse Behavior | Avg time per action (normalized) |
| 5 | `s_vel_mean` | Mouse Velocity | Mean velocity (normalized) |
| 6 | `s_vel_std` | Mouse Velocity | Velocity std dev (normalized) |
| 7 | `s_accel_mean` | Mouse Acceleration | Mean acceleration (normalized) |
| 8 | `s_accel_std` | Mouse Acceleration | Accel std dev (normalized) |
| 9 | `s_curve_mean` | Mouse Curvature | Mean curvature (normalized) |
| 10 | `s_curve_std` | Mouse Curvature | Curvature std dev (normalized) |
| 11 | `s_jerk_mean` | Mouse Jerk | Mean jerk (normalized) |
| 12 | `s_persona_novice_old` | Persona | One-hot: novice_old |
| 13 | `s_persona_intermediate` | Persona | One-hot: intermediate |
| 14 | `s_persona_expert` | Persona | One-hot: expert |

**TOTAL: 15 features (NOT 19)**

---

## Corrective Measures Implemented

### ✅ Fix 1: Hardcoded Expected Feature Schema
**File:** `backend/server.py`  
**Lines:** 73-92

```python
EXPECTED_FEATURE_COLUMNS = [
    "s_session_duration",      # 0
    "s_total_distance",        # 1
    "s_num_actions",           # 2
    "s_num_clicks",            # 3
    "s_mean_time_per_action",  # 4
    "s_vel_mean",              # 5
    "s_vel_std",               # 6
    "s_accel_mean",            # 7
    "s_accel_std",             # 8
    "s_curve_mean",            # 9
    "s_curve_std",             # 10
    "s_jerk_mean",             # 11
    "s_persona_novice_old",    # 12
    "s_persona_intermediate",  # 13
    "s_persona_expert"         # 14
]
EXPECTED_FEATURE_COUNT = 15
```

**Impact:** Single source of truth, independent of pickle files.

---

### ✅ Fix 2: Startup Model Validation with n_features_in_
**File:** `backend/server.py`  
**Lines:** 55-84

On startup, the server now logs:
- ✅ `model.n_features_in_` (should be 15)
- ✅ Comparison of loaded vs expected feature count
- ✅ Column-by-column order verification
- ✅ Warnings if schema doesn't match expectations

**Sample Startup Log:**
```
============================================================
RANDOMFOREST MODEL VALIDATION
Model n_features_in_: 15
Expected feature count: 15
✅ Feature count matches: 15
Loaded feature columns: ['s_session_duration', 's_total_distance', ...]
Expected feature columns: ['s_session_duration', 's_total_distance', ...]
✅ Feature column order matches!
============================================================
```

---

### ✅ Fix 3: State Vector Truncation Logic
**File:** `backend/server.py`  
**Lines:** 202-213 (in `/adaptive-action` endpoint)

```python
# Truncate extra features (UI levels from frontend not in training)
if incoming_state_length > EXPECTED_FEATURE_COUNT:
    logger.warning(
        f"⚠️  EXTRA FEATURES DETECTED: Received {incoming_state_length} features, "
        f"but only {EXPECTED_FEATURE_COUNT} expected. Truncating extra features."
    )
    state = state[:EXPECTED_FEATURE_COUNT]
```

**Behavior:**
- ✅ Silently truncates features 15-18 (UI levels)
- ✅ Logs warning with feature count
- ✅ Proceeds with only first 15 features

---

### ✅ Fix 4: Explicit Feature Validation & Logging
**File:** `backend/server.py`  
**Lines:** 165-195 (incoming state validation)

```python
logger.info(f"\n📊 STATE VECTOR VALIDATION")
logger.info(f"  Incoming state vector length: {incoming_state_length}")
logger.info(f"  Expected feature count: {EXPECTED_FEATURE_COUNT}")
logger.info(f"  Model n_features_in_: {adaptive_model.n_features_in_}")

# Rejects if insufficient features
if incoming_state_length < EXPECTED_FEATURE_COUNT:
    error_msg = (
        f"❌ INSUFFICIENT FEATURES: Expected {EXPECTED_FEATURE_COUNT} features, "
        f"got {incoming_state_length}."
    )
    raise ValueError(error_msg)
```

---

### ✅ Fix 5: Per-Feature Debug Logging
**File:** `backend/server.py`  
**Lines:** 219-228 (feature mapping loop)

```python
logger.info(f"\n📋 FEATURE MAPPING (in training order):")
for i, feature_name in enumerate(EXPECTED_FEATURE_COLUMNS):
    value = float(state[i])
    input_data[feature_name] = value
    logger.info(f"  [{i:2d}] {feature_name:30s} = {value:.6f}")
```

**Sample Output:**
```
📋 FEATURE MAPPING (in training order):
  [ 0] s_session_duration              = 0.150000
  [ 1] s_total_distance                = 0.425000
  [ 2] s_num_actions                   = 0.320000
  [ 3] s_num_clicks                    = 0.210000
  [ 4] s_mean_time_per_action          = 0.180000
  [...]
```

---

### ✅ Fix 6: Explicit Column Reordering
**File:** `backend/server.py`  
**Lines:** 230-236 (DataFrame creation)

```python
df = pd.DataFrame([input_data])
# Ensure columns are in the exact training order
df = df[EXPECTED_FEATURE_COLUMNS]

# Validate schema
if list(df.columns) != EXPECTED_FEATURE_COLUMNS:
    raise ValueError("COLUMN ORDER MISMATCH")
```

**Impact:** Even if input dict is malformed, DataFrame is reordered to match training schema.

---

### ✅ Fix 7: New `/model-info` Debug Endpoint
**File:** `backend/server.py`  
**Lines:** 346-370

**Endpoint:** `GET /model-info`

Returns comprehensive model metadata:
```json
{
  "rl_model": {
    "state_dim": 19,
    "action_dim": 10,
    "state_cols": [...]
  },
  "adaptive_model": {
    "loaded": true,
    "n_features_in": 15,
    "feature_columns": [...],
    "expected_feature_columns": [...],
    "schema_valid": true
  }
}
```

Use for quick validation: `curl http://localhost:5001/model-info`

---

## Revised Frontend Requirements

⚠️ **ACTION REQUIRED:** Frontend needs adjustment to send only 15 features, not 19.

**Current (incorrect):** `metricsToStateVector()` returns 19-element vector:
- Features 0-11: Mouse behavior (12 features) ✅
- Features 12-14: Persona (3 features) ✅
- **Features 15-18: UI levels (4 features) ❌ DON'T SEND THESE**

**Recommended Fix in `dynamic-ui-frontend/src/utils/dqnAdapter.jsx`:**

Option 1: Only return first 15 features
```javascript
export function metricsToStateVector(metrics, persona, uiState) {
  const stateVector = [
    // 1-12: Mouse behavior metrics
    Math.min(metrics.s_session_duration / 300, 1.0),
    Math.min(metrics.s_total_distance / 20000, 1.0),
    // ... 10 more
    // 13-15: Persona encoding
    persona.type === "novice_old" ? 1.0 : 0.0,
    persona.type === "intermediate" ? 1.0 : 0.0,
    persona.type === "expert" ? 1.0 : 0.0,
    // ❌ REMOVE: UI level features (15-18)
  ];
  return stateVector.slice(0, 15);  // Ensure only 15 features
}
```

---

## Testing Recommendations

### 1. Unit Test: State Vector Truncation
```bash
curl -X POST http://localhost:5001/adaptive-action \
  -H "Content-Type: application/json" \
  -d '{
    "state": [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.2, 0.2, 0.2, 0.2]
  }'
```

**Expected:**
- Warning log: "EXTRA FEATURES DETECTED: Received 19 features"
- Prediction succeeds with only first 15 features
- Log shows all 15 feature values

### 2. Unit Test: Insufficient Features
```bash
curl -X POST http://localhost:5001/adaptive-action \
  -H "Content-Type: application/json" \
  -d '{
    "state": [0.1, 0.2, 0.3, 0.4, 0.5]
  }'
```

**Expected:**
- Error: 400/500 with "INSUFFICIENT FEATURES"
- Clear message: "Expected 15 features, got 5"

### 3. Integration Test: Correct Vector
```bash
# Send exactly 15 features in correct order
curl -X POST http://localhost:5001/adaptive-action \
  -H "Content-Type: application/json" \
  -d '{
    "state": [0.15, 0.425, 0.32, 0.21, 0.18, 0.5, 0.4, 0.3, 0.25, 0.4, 0.3, 0.25, 1.0, 0.0, 0.0]
  }'
```

**Expected:**
- Success: 200 status
- Action: 0-9
- Logs show 15 features mapped correctly

### 4. Model Info Check
```bash
curl http://localhost:5001/model-info
```

**Expected:**
- `adaptive_model.n_features_in_: 15`
- `schema_valid: true`

---

## Deployment Checklist

- [ ] **Verify Redis/state persistence:** Ensure `feature_columns2.pkl` exists and contains correct 15 columns
- [ ] **Run startup logs:** Check that model validation passes on server start
- [ ] **Test with 19-feature vector:** Confirm truncation works
- [ ] **Test with 15-feature vector:** Confirm prediction succeeds
- [ ] **Check `/model-info` endpoint:** Verify schema_valid = true
- [ ] **Update frontend `dqnAdapter.jsx`:** Remove UI level features from state vector
- [ ] **Monitor logs:** Watch for "COLUMN ORDER MISMATCH" warnings during first hour of production
- [ ] **Performance test:** Confirm prediction latency unchanged

---

## File Summary

### Modified Files
1. **[backend/server.py](backend/server.py)** (CORRECTED ✅)
   - Lines 73-92: Added `EXPECTED_FEATURE_COLUMNS` constant
   - Lines 55-84: Added startup model validation with `n_features_in_` check
   - Lines 169-289: Completely rewrote `/adaptive-action` endpoint with:
     - State vector size validation
     - Feature truncation logic
     - Per-feature debug logging
     - DataFrame validation
   - Lines 346-370: Added `/model-info` debug endpoint
   - Lines 375-379: Enhanced `/health` endpoint

### Files Requiring Review
1. **[dynamic-ui-frontend/src/utils/dqnAdapter.jsx](dynamic-ui-frontend/src/utils/dqnAdapter.jsx)**
   - Action: Remove UI level features (indices 15-18) from `metricsToStateVector()`
   - Reason: These 4 features were not in RandomForest training data

---

## Appendix: Feature Schema Reference

**Training Data Generation:** These features should come from `MetricsContext` in the frontend:

```
s_session_duration     → metrics.s_session_duration
s_total_distance       → metrics.s_total_distance
s_num_actions          → metrics.s_num_actions
s_num_clicks           → metrics.s_num_clicks
s_mean_time_per_action → metrics.s_mean_time_per_action
s_vel_mean             → metrics.s_vel_mean
s_vel_std              → metrics.s_vel_std
s_accel_mean           → metrics.s_accel_mean
s_accel_std            → metrics.s_accel_std
s_curve_mean           → metrics.s_curve_mean
s_curve_std            → metrics.s_curve_std
s_jerk_mean            → metrics.s_jerk_mean
s_persona_novice_old   → (persona.type === "novice_old" ? 1.0 : 0.0)
s_persona_intermediate → (persona.type === "intermediate" ? 1.0 : 0.0)
s_persona_expert       → (persona.type === "expert" ? 1.0 : 0.0)
```

---

**Audit Completed By:** ML Integration Audit Agent  
**Date:** March 5, 2026  
**Next Review:** After frontend feature removal & production deployment
