// INTEGRATION CHECKLIST - Adaptive UI RL Experimental Framework
// Run this in browser console to verify all components are ready

export const runIntegrationCheck = () => {
  console.log("\n" + "=".repeat(70));
  console.log("ADAPTIVE UI RL EXPERIMENTAL FRAMEWORK - INTEGRATION CHECK");
  console.log("=".repeat(70) + "\n");

  const checks = [];

  // 1. Metrics Collector
  console.log("[CHECK 1] MetricsCollector Initialization");
  const hasCollector = !!window.__metricsCollector;
  const hasPathType = !!window.__metricsCollector?.pathType;
  const hasRLMethods = !!window.__metricsCollector?.getRLLogsAsCSV && !!window.__metricsCollector?.clearRLLogs;
  checks.push({ name: "✓ MetricsCollector found", pass: hasCollector });
  checks.push({ name: "✓ pathType assigned", pass: hasPathType, value: window.__metricsCollector?.pathType });
  checks.push({ name: "✓ RL export methods", pass: hasRLMethods });

  // 2. Experiment Control
  console.log("\n[CHECK 2] Experiment Control API");
  const hasControl = !!window.__experimentControl;
  const hasGetMode = !!window.__experimentControl?.getMode;
  const hasGetStatus = !!window.__experimentControl?.getStatus;
  const hasExport = !!window.__experimentControl?.exportRLLogs;
  const hasDownload = !!window.__experimentControl?.downloadRLLogs;
  checks.push({ name: "✓ ExperimentControl found", pass: hasControl });
  checks.push({ name: "✓ getMode() function", pass: hasGetMode });
  checks.push({ name: "✓ getStatus() function", pass: hasGetStatus });
  checks.push({ name: "✓ exportRLLogs() function", pass: hasExport });
  checks.push({ name: "✓ downloadRLLogs() function", pass: hasDownload });

  // 3. RL Logs Buffer
  console.log("\n[CHECK 3] RL Logs Buffer");
  const hasLogsBuffer = !!window.__rlLogs;
  const logsCount = window.__rlLogs?.length || 0;
  checks.push({ name: "✓ RL logs buffer initialized", pass: hasLogsBuffer });
  checks.push({ name: `✓ Logs collected (${logsCount} entries)`, pass: logsCount > 0 });

  // 4. Current Mode
  console.log("\n[CHECK 4] Experiment Mode");
  const mode = window.__experimentControl?.getMode?.();
  const isValidMode = ["model", "random", "guided"].includes(mode);
  checks.push({ name: `✓ Current mode: "${mode}"`, pass: isValidMode });

  // 5. Snapshot Collection
  console.log("\n[CHECK 5] Snapshot Collection");
  const hasSnapshots = window.__metricsCollector?.snapshots?.length > 0;
  const snapshotCount = window.__metricsCollector?.snapshots?.length || 0;
  const lastSnapshot = window.__metricsCollector?.snapshots?.[snapshotCount - 1];
  const hasPathTypeInSnapshot = lastSnapshot?.pathType !== undefined;
  checks.push({ name: `✓ Snapshots collected (${snapshotCount} total)`, pass: hasSnapshots });
  checks.push({ 
    name: "✓ pathType in snapshot", 
    pass: hasPathTypeInSnapshot, 
    value: lastSnapshot?.pathType 
  });

  // 6. State Vector
  console.log("\n[CHECK 6] State Vector");
  const lastAction = lastSnapshot?.action ?? -1;
  const lastModelAction = lastSnapshot?.dqnAction ?? -1;
  const validActions = lastAction >= 0 && lastAction <= 9;
  const validModel = lastModelAction >= -1 && lastModelAction <= 19;
  checks.push({ name: "✓ Actions in valid range (0-9)", pass: validActions });
  checks.push({ name: "✓ Model actions valid", pass: validModel });

  // 7. Print Results
  console.log("\n" + "=".repeat(70));
  console.log("RESULTS:");
  console.log("=".repeat(70) + "\n");
  
  let passCount = 0;
  checks.forEach(check => {
    const icon = check.pass ? "✅" : "❌";
    const value = check.value ? ` (${check.value})` : "";
    console.log(`${icon} ${check.name}${value}`);
    if (check.pass) passCount++;
  });

  const totalChecks = checks.length;
  const percentage = Math.round((passCount / totalChecks) * 100);
  
  console.log("\n" + "=".repeat(70));
  console.log(`PASS RATE: ${passCount}/${totalChecks} (${percentage}%)`);
  console.log("=".repeat(70) + "\n");

  // 8. Recommendations
  console.log("[RECOMMENDATIONS]\n");
  if (!hasSnapshots) {
    console.log("⚠️  No snapshots yet. Wait 10+ seconds for first snapshot to collect.");
  }
  if (logsCount < 2) {
    console.log("⚠️  Less than 2 logs collected. Continue using the app for more data.");
  }
  if (percentage === 100) {
    console.log("✅ All checks passed! Framework is ready for experiments.");
    console.log("\nNext steps:");
    console.log("  1. Use the app normally (complete transactions)");
    console.log("  2. After 5-10 minutes, run: window.__experimentControl.downloadRLLogs()");
    console.log("  3. Edit EXPERIMENT_MODE in src/utils/dqnAdapter.jsx");
    console.log("  4. Reload app and repeat with different modes");
    console.log("  5. Compare CSV files for analysis");
  }

  console.log("\nFor more info: window.__experimentControl.help()\n");
  
  return {
    status: percentage === 100 ? "READY" : "INCOMPLETE",
    passCount,
    totalChecks,
    percentage,
    checks
  };
};

// Auto-run on import
if (typeof window !== "undefined") {
  window.integrationCheck = runIntegrationCheck;
  console.log("Integration check registered. Run: window.integrationCheck()");
}
