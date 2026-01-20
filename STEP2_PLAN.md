Real-Time Metrics Collection & Storage System

# STORAGE STRATEGY: Hybrid Approach (Recommended)

Option 1: LOCAL STORAGE ONLY
Pros:

- Simple, no backend needed
- Fast access
  Cons:
- 5-10MB limit (fills up quickly)
- Not suitable for long sessions
- Data lost if browser cache cleared
- Cannot accumulate for model retraining

Option 2: IndexedDB ONLY
Pros:

- 50MB+ storage limit
- Can store large datasets
- Suitable for model retraining
- Persistent even if cache cleared
  Cons:
- More complex to implement
- Requires async operations

Option 3: HYBRID (RECOMMENDED)
localStorage: Recent session metrics (quick access)
IndexedDB: Full historical dataset (for retraining)

WORKFLOW:

1. Collect metrics every N seconds
2. Store in localStorage (recent cache)
3. Periodically flush to IndexedDB (persistent storage)
4. Export from IndexedDB for model retraining
5. Clear old data to manage storage

Recommended Choice: HYBRID (localStorage + IndexedDB)

Why:

- Fast real-time access to recent metrics
- Persistent storage for accumulation
- Manageable storage footprint
- Ready for DQN retraining

# IMPLEMENTATION PLAN

Step 2a: Create Metrics Collector
File: src/utils/metricsCollector.js

class MetricsCollector {

- Aggregates metrics every N seconds
- Stores in localStorage as "current_session"
- Tracks timestamp, user behavior, UI state
  }

Step 2b: Create IndexedDB Manager
File: src/utils/indexedDBManager.js

class IndexedDBManager {

- Initializes DB with "metrics" store
- Saves complete session data
- Retrieves historical data
- Exports as JSON
- Manages storage (cleanup old records)
  }

Step 2c: Add Metrics Export UI
File: src/pages/MetricsExport.js (or button in Dashboard)

UI Controls:

- View current session metrics
- Download historical data (JSON/CSV)
- Clear old metrics
- Export for DQN retraining

Step 2d: Integrate with App
Update src/App.js:

- Initialize collector on mount
- Pass collected metrics to UI
- Show metrics in Dashboard/Export page

# METRICS TO COLLECT

For each snapshot (every 5 seconds):
{
timestamp: "2026-01-20T10:30:45Z",
sessionId: "unique-session-id",

    // Behavior metrics
    metrics: {
      vel_mean: 0.45,
      idle: 0.2,
      hesitation: 0.15,
      misclicks: 0.3
    },

    // Persona state
    persona: {
      type: "novice_old",
      confidence: 0.85,
      stable: true
    },

    // UI adaptation state
    uiState: {
      buttonSize: 2,
      textSize: 5,
      spacing: 3,
      tooltips: true
    },

    // User feedback (optional)
    feedback: {
      taskCompleted: true,
      satisfactionScore: 4, // 1-5 scale
      errorCount: 2
    }

}

# DATA STRUCTURE IN STORAGE

localStorage "current_session":
[
{metrics_snapshot_1},
{metrics_snapshot_2},
...
]

IndexedDB "metrics" store:
{
id: auto-increment,
sessionId: "abc123",
data: {full metrics snapshot},
timestamp: "2026-01-20T10:30:45Z"
}

# QUESTIONS FOR CONFIRMATION

1. Do you want HYBRID (localStorage + IndexedDB) approach?
   Or just one of them?

2. Collection frequency: Every 5 seconds? 10 seconds?

3. Session duration: How long should we keep in memory?

4. Export format: JSON or CSV for DQN retraining?

Confirm answers and I'll implement Step 2a-d.
