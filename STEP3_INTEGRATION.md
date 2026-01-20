# STEP 3: Integration Guide - Wire Everything Together

This document shows exact code changes needed to activate metrics collection.

# FILE 1: src/App.js (CHANGES)

Add at top of file:
import MetricsCollector from "./utils/metricsCollector";
import IndexedDBManager from "./utils/indexedDBManager";

In App component:

const collectorRef = useRef(new MetricsCollector());
const dbManagerRef = useRef(null);

// Initialize IndexedDB on mount
useEffect(() => {
const initDB = async () => {
const dbManager = new IndexedDBManager();
await dbManager.init();
dbManagerRef.current = dbManager;
console.log("[App] IndexedDB initialized");
};
initDB();
}, []);

// Periodically flush collected transitions to IndexedDB
useEffect(() => {
const saveInterval = setInterval(async () => {
if (collectorRef.current.transitions.length > 0 && dbManagerRef.current) {
try {
const count = await dbManagerRef.current.saveTransitions(
collectorRef.current.transitions
);
console.log(`[App] Saved ${count} transitions to IndexedDB`);
collectorRef.current.transitions = []; // Clear after saving
} catch (error) {
console.error("[App] Failed to save transitions:", error);
}
}
}, 30000); // Save every 30 seconds

    return () => clearInterval(saveInterval);

}, []);

// Record metrics every 10 seconds
useEffect(() => {
const recordInterval = setInterval(() => {
if (persona && metrics && uiConfig) {
collectorRef.current.recordMetrics(
metrics,
persona,
uiConfig,
"global",
"app"
);
}
}, 10000); // Every 10 seconds

    return () => clearInterval(recordInterval);

}, [metrics, persona, uiConfig]);

// Make collector globally accessible for UIContext
window.\_\_metricsCollector = collectorRef.current;

// Rest of App component remains the same
return (
<Router>
<UIProvider persona={persona}>
<AppHeader />
<AdaptationDebugger />
<main className="min-h-screen bg-gray-50">
<Routes>
<Route path="/" element={<HomePage />} />
<Route path="/login" element={<Login />} />
<Route path="/register" element={<Register />} />
<Route path="/transaction" element={<Transaction />} />
<Route path="/recovery" element={<Recovery />} />
<Route path="/dashboard" element={<Dashboard />} />
</Routes>
</main>
</UIProvider>
</Router>
);

# FILE 2: src/adaptation/UIContext.js (CHANGES)

In the dispatchAction function:

const dispatchAction = (action) => {
// Get current state before update
const prevStateBuffer = window.\_\_metricsCollector?.stateBuffer;

    // Apply action to UI
    setUIConfig((prevConfig) => applyAction(prevConfig, action));

    // Record transition asynchronously
    if (window.__metricsCollector && prevStateBuffer) {
      setTimeout(() => {
        const newStateBuffer = window.__metricsCollector.stateBuffer;
        const reward = 0.5; // Placeholder - replace with actual reward logic

        window.__metricsCollector.createTransition(
          prevStateBuffer,
          action,
          reward,
          newStateBuffer,
          false // done = false (not a terminal state)
        );
      }, 100); // Wait for state update
    }

};

# FILE 3: src/pages/Dashboard.js (CHANGES)

Add import at top:
import { MetricsExportPanel } from "../components/MetricsExportPanel";

Find the return statement with tabs. Add this after the metrics tab:

{/_ === EXPORT TAB === _/}
{activeTab === "export" && (
<div>
<MetricsExportPanel />
</div>
)}

Add "Export" to the tab list (around line 60):

const tabs = [
"overview",
"metrics",
"export", // ADD THIS
];

Update the tab button rendering to include:

{tabs.map((tab) => (
<button
key={tab}
onClick={() => setActiveTab(tab)}
className={`px-4 py-2 font-medium rounded-lg transition ${
        activeTab === tab
          ? "bg-blue-600 text-white"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`} >
{tab.charAt(0).toUpperCase() + tab.slice(1)}
</button>
))}

# VERIFICATION STEPS

After making changes:

1. Check Console on App Load
   Should see:
   "[App] IndexedDB initialized"
   "[MetricsCollector] buildStateVector() called"

2. Interact with UI
   Should see metrics being recorded:
   "[MetricsCollector] Transition recorded: action=1, reward=0.500, done=0"

3. Check Dashboard > Export Tab
   Should see:
   - "Transitions Collected: X"
   - "Sessions: 1"
   - "Data Size: Y KB"
   - Export/Clear buttons enabled

4. Export Data
   Should download CSV file named:
   "dqn_ui_dataset_TIMESTAMP.csv"

5. Verify CSV Format
   Open in Excel/text editor:
   - 47 columns
   - First row: header
   - Data rows with proper values

# TESTING CHECKLIST

[ ] App loads without errors
[ ] IndexedDB initialized on startup
[ ] Console shows metric collection logs
[ ] Dashboard Export tab appears
[ ] Metrics collection shows increasing counts
[ ] Can export as CSV
[ ] Can export as JSON
[ ] CSV has 47 columns
[ ] State columns have correct values
[ ] Action column has 0-9 values
[ ] Persona one-hot encoding correct (sum=1)
[ ] Can clear data

# TROUBLESHOOTING

Issue: "Cannot read property 'transitions' of undefined"
Fix: Ensure collectorRef is initialized before use
Add null checks in saveInterval

Issue: "IndexedDB is not defined"
Fix: Check browser console for errors
Ensure browser supports IndexedDB
Try in incognito mode

Issue: Export creates empty file
Fix: Ensure transitions were created
Check Dashboard Export tab shows count > 0
Verify recordMetrics is being called

Issue: Persona one-hot wrong
Fix: Check personaValidator returning correct persona type
Verify buildStateVector logic
Check state printed in console

# EXPECTED LOGS (FIRST 60 SECONDS)

T=0s:
[App] IndexedDB initialized
[MetricsCollector] recordMetrics() called

T=10s:
[MetricsCollector] Transition recorded: action=0, reward=0.500, done=0

T=20s:
[MetricsCollector] Transition recorded: action=1, reward=0.500, done=0

T=30s:
[MetricsCollector] Saved 3 transitions to IndexedDB
[MetricsCollector] Session cleared

T=40s:
[MetricsCollector] Transition recorded: action=2, reward=0.500, done=0

T=50s:
[MetricsCollector] Transition recorded: action=3, reward=0.500, done=0

T=60s:
[MetricsCollector] Saved 2 transitions to IndexedDB

# NEXT AFTER INTEGRATION (STEP 4)

1. Test with Real Users
   - Have users interact with app
   - Collect 100+ transitions
   - Monitor storage size

2. Export First Dataset
   - Download CSV from Dashboard
   - Verify format
   - Check state/action/reward distributions

3. Prepare DQN Fine-Tuning
   - Load pre-trained model
   - Load new CSV data
   - Test training loop

4. Fine-Tune Model
   - Use new UI data
   - Continue training
   - Evaluate on test set

5. Deploy Updated Model
   - Version the model
   - Update DQN loader
   - Monitor performance

# CODE READY TO COPY-PASTE

All three files (MetricsCollector, IndexedDBManager, MetricsExportPanel) are
production-ready and require no modifications.

Just add the integration code shown above to:

- App.js (add imports + useEffects)
- UIContext.js (update dispatchAction)
- Dashboard.js (add tab + MetricsExportPanel)

Then test and you're ready for DQN fine-tuning!
