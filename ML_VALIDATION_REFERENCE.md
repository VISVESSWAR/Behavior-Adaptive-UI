# ML Pipeline Validation Logic - Quick Reference

## Current Validation Flow (CORRECTED)

```
┌─────────────────────────────────────────┐
│  CLIENT SENDS STATE VECTOR              │
│  (May be 15 or 19 features)             │
└────────────────┬────────────────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ PARSE JSON REQUEST     │
        │ Extract: state array   │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────────────┐
        │ VALIDATE STATE LENGTH          │
        │ if len < 15: REJECT ❌         │
        │ if len ≥ 15: PROCEED ✅        │
        └────────┬───────────────────────┘
                 │
                 ▼
        ┌────────────────────────────────┐
        │ TRUNCATE EXTRA FEATURES        │
        │ if len > 15:                   │
        │   state = state[:15]           │
        │   log WARNING                  │
        └────────┬───────────────────────┘
                 │
                 ▼
        ┌────────────────────────────────┐
        │ EXTRACT FEATURES (15 only)     │
        │ for i=0 to 14:                 │
        │   map state[i] →               │
        │   EXPECTED_FEATURE_COLUMNS[i]  │
        │   log each feature value       │
        └────────┬───────────────────────┘
                 │
                 ▼
        ┌────────────────────────────────┐
        │ CREATE PANDAS DATAFRAME        │
        │ df = DataFrame([input_data])   │
        │ df = df[EXPECTED_COLS]  ◄──┐   │
        │ Force exact column order  │   │
        └────────┬───────────────────────┘
                 │
                 ▼
        ┌────────────────────────────────┐
        │ VALIDATE DATAFRAME SCHEMA      │
        │ assert df.columns ==           │
        │   EXPECTED_FEATURE_COLUMNS     │
        └────────┬───────────────────────┘
                 │
                 ▼
        ┌────────────────────────────────┐
        │ RUN RANDOMFOREST PREDICTION    │
        │ action = model.predict(df)     │
        └────────┬───────────────────────┘
                 │
                 ▼
        ┌────────────────────────────────┐
        │ RETURN PREDICTION              │
        │ {                              │
        │   "action": 0-9,               │
        │   "action_name": "...",        │
        │   "feature_count": 15,         │
        │   "reason": "RF prediction"    │
        │ }                              │
        └────────────────────────────────┘
```

---

## Feature Schema (HARDCODED CONSTANT)

```python
EXPECTED_FEATURE_COLUMNS = [
    "s_session_duration",        # [0]  - Mouse behavior
    "s_total_distance",          # [1]  - Mouse behavior
    "s_num_actions",             # [2]  - Mouse behavior
    "s_num_clicks",              # [3]  - Mouse behavior
    "s_mean_time_per_action",    # [4]  - Mouse behavior
    "s_vel_mean",                # [5]  - Mouse velocity
    "s_vel_std",                 # [6]  - Mouse velocity
    "s_accel_mean",              # [7]  - Mouse acceleration
    "s_accel_std",               # [8]  - Mouse acceleration
    "s_curve_mean",              # [9]  - Mouse curvature
    "s_curve_std",               # [10] - Mouse curvature
    "s_jerk_mean",               # [11] - Mouse jerk
    "s_persona_novice_old",      # [12] - Persona (one-hot)
    "s_persona_intermediate",    # [13] - Persona (one-hot)
    "s_persona_expert"           # [14] - Persona (one-hot)
]
EXPECTED_FEATURE_COUNT = 15
```

**CRITICAL:** This constant is the single source of truth.

---

## State Vector Validation Checklist

### At Server Startup
```
✓ Load RandomForest model from pickle
✓ Read model.n_features_in_
✓ Assert model.n_features_in_ == 15
✓ Log: "✅ Feature count matches: 15"
✓ Load feature_columns from pickle
✓ Assert loaded columns match EXPECTED_FEATURE_COLUMNS
✓ Log: "✅ Feature column order matches!"
```

### Per Prediction Request
```
✓ Parse incoming state array
✓ Check len(state) >= 15 (REJECT if insufficient)
✓ Check len(state) <= 19 (WARN + TRUNCATE if >15)
✓ Extract state[0:15] into dict with feature names
✓ Create DataFrame with explicit column order
✓ Reorder df[EXPECTED_FEATURE_COLUMNS]
✓ Log all 15 features with values
✓ Assert df.columns matches expected order
✓ Run prediction
✓ Return action with feature_count=15
```

---

## Error Scenarios & Responses

### Scenario 1: Too Few Features (< 15)
```
REQUEST:  {"state": [0.1, 0.2, 0.3, ..., 0.5]}  // 8 features

VALIDATION FAILS:
  ❌ INSUFFICIENT FEATURES
  Expected 15 features, got 8

HTTP 500 + JSON:
{
  "error": "INSUFFICIENT FEATURES: Expected 15, got 8",
  "action": 0,
  "fallback": true
}

LOG:
  ERROR: INSUFFICIENT FEATURES at /adaptive-action
```

### Scenario 2: Too Many Features (> 15)  ✅ GRACEFUL
```
REQUEST:  {"state": [0.1, 0.2, ..., 0.6, 0.2, 0.2, 0.2, 0.2]}  // 19 features

VALIDATION SUCCEEDS (with warning):
  ⚠️ EXTRA FEATURES DETECTED
  Received 19 features, expected 15
  Truncating extra features

HTTP 200 + JSON:
{
  "action": 3,
  "action_name": "text_up",
  "feature_count": 15,
  "reason": "RandomForest model prediction"
}

LOG:
  WARNING: EXTRA FEATURES DETECTED at /adaptive-action
  INFO: Truncated state vector to 15 features
  INFO: Running prediction with first 15 features only
```

### Scenario 3: Correct Features (== 15)  ✅ IDEAL
```
REQUEST:  {"state": [0.15, 0.425, 0.32, 0.21, 0.18, 0.5, 0.4, 0.3, 0.25, 0.4, 0.3, 0.25, 1.0, 0.0, 0.0]}

VALIDATION SUCCEEDS:
  ✓ State vector length: 15
  ✓ Expected feature count: 15
  ✓ All features mapped

HTTP 200 + JSON:
{
  "action": 1,
  "action_name": "button_up",
  "feature_count": 15,
  "reason": "RandomForest model prediction"
}

LOG:
  INFO: STATE VECTOR VALIDATION - PASSED
  INFO: FEATURE MAPPING (in training order):
  [0] s_session_duration = 0.150000
  [1] s_total_distance = 0.425000
  ... [all 15 features logged]
  INFO: PREDICTION SUCCESSFUL
```

---

## Debug Endpoints

### 1. Model Info Endpoint
```bash
GET /model-info
```

Returns:
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
    "feature_columns": [15 feature names],
    "expected_feature_columns": [15 feature names],
    "schema_valid": true
  }
}
```

Use to verify:
- ✓ `adaptive_model.loaded == true`
- ✓ `n_features_in == 15`
- ✓ `schema_valid == true`

### 2. Health Check Endpoint (Enhanced)
```bash
GET /health
```

Returns:
```json
{
  "status": "ok",
  "adaptive_model_loaded": true,
  "rl_model_loaded": true
}
```

---

## Frontend: State Vector Generation

**Current (INCORRECT):** Sends 19 features
```javascript
export function metricsToStateVector(metrics, persona, uiState) {
  const stateVector = [
    // 0-11: Mouse behavior (12 features)
    Math.min(metrics.s_session_duration / 300, 1.0),      // ✓
    Math.min(metrics.s_total_distance / 20000, 1.0),      // ✓
    // ... 10 more mouse metrics
    // 12-14: Persona (3 features)
    persona.type === "novice_old" ? 1.0 : 0.0,            // ✓
    persona.type === "intermediate" ? 1.0 : 0.0,          // ✓
    persona.type === "expert" ? 1.0 : 0.0,                // ✓
    // 15-18: UI levels (4 features) ❌ EXTRA - NOT IN TRAINING
    (uiState?.buttonSize || 0) / 6.0,
    (uiState?.textSize || 0) / 6.0,
    (uiState?.spacing || 0) / 6.0,
    (uiState?.fontWeight || 0) / 6.0,
  ];
  return stateVector;  // Returns 19 elements
}
```

**Recommended (WITH FIX):** Only send 15 features
```javascript
export function metricsToStateVector(metrics, persona, uiState) {
  const stateVector = [
    // 0-11: Mouse behavior (12 features)
    Math.min(metrics.s_session_duration / 300, 1.0),
    Math.min(metrics.s_total_distance / 20000, 1.0),
    Math.min(metrics.s_num_actions / 500, 1.0),
    Math.min(metrics.s_num_clicks / 100, 1.0),
    Math.min(metrics.s_mean_time_per_action / 3, 1.0),
    Math.min(metrics.s_vel_mean / 2000, 1.0),
    Math.min(metrics.s_vel_std / 1500, 1.0),
    Math.min(Math.abs(metrics.s_accel_mean) / 1000, 1.0),
    Math.min(metrics.s_accel_std / 10000, 1.0),
    Math.min(metrics.s_curve_mean / 0.5, 1.0),
    Math.min(metrics.s_curve_std / 0.5, 1.0),
    Math.min(Math.abs(metrics.s_jerk_mean) / 1000, 1.0),
    // 12-14: Persona (3 features)
    persona.type === "novice_old" ? 1.0 : 0.0,
    persona.type === "intermediate" ? 1.0 : 0.0,
    persona.type === "expert" ? 1.0 : 0.0,
    // ❌ REMOVED: UI level features (no longer sent)
  ];
  
  // Safety check
  console.assert(stateVector.length === 15, 
    `Expected 15 features, got ${stateVector.length}`);
  
  return stateVector;  // Returns exactly 15 elements
}
```

---

## Logging Output Examples

### Startup Log (Model Validation)
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

### Request Log (Prediction with Perfect Input)
```
======================================================================
ADAPTIVE ACTION REQUEST RECEIVED
======================================================================

📊 STATE VECTOR VALIDATION
  Incoming state vector length: 15
  Expected feature count: 15
  Model n_features_in_: 15

📋 FEATURE MAPPING (in training order):
  [ 0] s_session_duration              = 0.150000
  [ 1] s_total_distance                = 0.425000
  [ 2] s_num_actions                   = 0.320000
  [ 3] s_num_clicks                    = 0.210000
  [ 4] s_mean_time_per_action          = 0.180000
  [ 5] s_vel_mean                      = 0.500000
  [ 6] s_vel_std                       = 0.400000
  [ 7] s_accel_mean                    = 0.300000
  [ 8] s_accel_std                     = 0.250000
  [ 9] s_curve_mean                    = 0.400000
  [10] s_curve_std                     = 0.300000
  [11] s_jerk_mean                     = 0.250000
  [12] s_persona_novice_old            = 1.000000
  [13] s_persona_intermediate          = 0.000000
  [14] s_persona_expert                = 0.000000

📝 DATAFRAME FOR PREDICTION:
  Shape: (1, 15)
  Columns: ['s_session_duration', 's_total_distance', ...]

🤖 Running RandomForest prediction...
  Predicted action: 1

✅ PREDICTION SUCCESSFUL
  Action: 1 (button_up)
  Features used: 15
======================================================================
```

### Request Log (With Extra Features - Truncation)
```
======================================================================
ADAPTIVE ACTION REQUEST RECEIVED
======================================================================

📊 STATE VECTOR VALIDATION
  Incoming state vector length: 19
  Expected feature count: 15
  Model n_features_in_: 15

⚠️  EXTRA FEATURES DETECTED: Received 19 features, but only 15 expected. 
    Truncating extra features.
  Truncated state vector to: 15 features

📋 FEATURE MAPPING (in training order):
  [0] s_session_duration = 0.150000
  ...
  [14] s_persona_expert = 0.000000

📝 DATAFRAME FOR PREDICTION:
  Shape: (1, 15)
  Columns: [...]

🤖 Running RandomForest prediction...
  Predicted action: 2

✅ PREDICTION SUCCESSFUL
  Action: 2 (button_down)
  Features used: 15
======================================================================
```

---

**Reference Document**  
Version: 1.0  
Last Updated: March 5, 2026
