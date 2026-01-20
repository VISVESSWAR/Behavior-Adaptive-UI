/**
 * END-TO-END VALIDATION EXAMPLE
 *
 * Shows complete flow:
 * 1. Create sample snapshots (as frontend would collect)
 * 2. Build transitions (pair consecutive snapshots)
 * 3. Export CSV (verify format)
 * 4. Validate against DQN expectations
 */

import { snapshotToStateVector, TransitionBuilder } from "./snapshotSchema.js";

/**
 * Generate sample snapshots (simulate 50 seconds of user interaction)
 * 5 snapshots @ 10-second intervals
 */
function generateSampleSnapshots() {
  const snapshots = [];

  const baseMetrics = {
    session_duration: 0,
    total_distance: 0,
    num_actions: 0,
    num_clicks: 0,
    mean_time_per_action: 0.5,
    vel_mean: 0.3,
    vel_std: 0.1,
    accel_mean: 0.2,
    accel_std: 0.1,
    curve_mean: 0.05,
    curve_std: 0.08,
    jerk_mean: 0.25,
  };

  const personaType = "novice_old"; // Will make 3 snapshots this type
  const actions = [3, 1, -1, 0, 5]; // text_up, button_up, none, noop, font_up

  // Snapshot 0 @ t=00:00
  snapshots.push({
    timestamp: 1705779000000,
    sessionId: "session_test_001",
    flowId: "transaction",
    stepId: "confirm_payment",
    metrics: {
      ...baseMetrics,
      session_duration: 0,
      total_distance: 0,
      num_actions: 0,
      num_clicks: 0,
    },
    persona: { type: personaType, confidence: 0.85, stable: true },
    action: -1, // No action at start
    uiState: { buttonSize: 0, textSize: 0, spacing: 0, tooltips: false },
    done: false,
  });

  // Snapshot 1 @ t=10s (action 3 = text_up applied)
  snapshots.push({
    timestamp: 1705779010000,
    sessionId: "session_test_001",
    flowId: "transaction",
    stepId: "confirm_payment",
    metrics: {
      ...baseMetrics,
      session_duration: 10.2,
      total_distance: 2100,
      num_actions: 18,
      num_clicks: 2,
      vel_mean: 0.32,
    },
    persona: { type: personaType, confidence: 0.87, stable: true },
    action: 3, // text_up was applied
    uiState: { buttonSize: 0, textSize: 2, spacing: 0, tooltips: false },
    done: false,
  });

  // Snapshot 2 @ t=20s (action 1 = button_up applied)
  snapshots.push({
    timestamp: 1705779020000,
    sessionId: "session_test_001",
    flowId: "transaction",
    stepId: "confirm_payment",
    metrics: {
      ...baseMetrics,
      session_duration: 20.1,
      total_distance: 4300,
      num_actions: 36,
      num_clicks: 4,
      vel_mean: 0.31,
    },
    persona: { type: "intermediate", confidence: 0.78, stable: true }, // Changed persona
    action: 1, // button_up was applied
    uiState: { buttonSize: 2, textSize: 2, spacing: 0, tooltips: false },
    done: false,
  });

  // Snapshot 3 @ t=30s (action -1 = no action)
  snapshots.push({
    timestamp: 1705779030000,
    sessionId: "session_test_001",
    flowId: "transaction",
    stepId: "confirm_payment",
    metrics: {
      ...baseMetrics,
      session_duration: 30.3,
      total_distance: 6200,
      num_actions: 52,
      num_clicks: 5,
      vel_mean: 0.33,
    },
    persona: { type: "intermediate", confidence: 0.82, stable: true },
    action: -1, // No action
    uiState: { buttonSize: 2, textSize: 2, spacing: 0, tooltips: false },
    done: false,
  });

  // Snapshot 4 @ t=40s (action 0 = noop, end of flow)
  snapshots.push({
    timestamp: 1705779040000,
    sessionId: "session_test_001",
    flowId: "transaction",
    stepId: "confirm_payment",
    metrics: {
      ...baseMetrics,
      session_duration: 40.5,
      total_distance: 8100,
      num_actions: 68,
      num_clicks: 6,
      vel_mean: 0.3,
    },
    persona: { type: "intermediate", confidence: 0.8, stable: true },
    action: 0, // noop
    uiState: { buttonSize: 2, textSize: 2, spacing: 0, tooltips: false },
    done: true, // Flow completed
  });

  return snapshots;
}

/**
 * Sample reward function
 * (In practice, this comes from user feedback or task completion)
 */
function sampleRewardFn(s_t, a_t, s_t1) {
  // Reward for progress (increase in session duration)
  const progressReward =
    (s_t1.s_session_duration - s_t.s_session_duration) * 0.1;

  // Bonus for reaching expert persona
  const personaBonus = s_t1.s_persona_expert ? 1.0 : 0.0;

  // Penalty for excessive clicks (high friction)
  const clickPenalty = s_t1.s_num_clicks > 10 ? -0.5 : 0;

  const totalReward = progressReward + personaBonus + clickPenalty;
  return Math.max(-10, Math.min(10, totalReward)); // Clip to [-10, 10]
}

/**
 * MAIN VALIDATION FLOW
 */
export function runEndToEndValidation() {
  console.log("\n" + "=".repeat(70));
  console.log("DQN DATA COLLECTION - END-TO-END VALIDATION");
  console.log("=".repeat(70) + "\n");

  // Step 1: Generate sample snapshots
  console.log("STEP 1: Generate Sample Snapshots");
  console.log("-".repeat(70));
  const snapshots = generateSampleSnapshots();
  console.log(`Generated ${snapshots.length} snapshots:\n`);

  snapshots.forEach((snap, i) => {
    const stateVec = snapshotToStateVector(snap);
    console.log(`  Snapshot ${i}:`);
    console.log(`    Time: ${new Date(snap.timestamp).toISOString()}`);
    console.log(
      `    Persona: ${snap.persona.type} (conf: ${snap.persona.confidence})`,
    );
    console.log(`    Action: ${snap.action}`);
    console.log(
      `    Metrics sum: ${Object.values(stateVec)
        .reduce((a, b) => a + b, 0)
        .toFixed(2)}`,
    );
  });

  // Step 2: Build transitions
  console.log("\n\nSTEP 2: Build Transitions (Pair Consecutive Snapshots)");
  console.log("-".repeat(70));
  const transitions = TransitionBuilder.buildTransitions(
    snapshots,
    sampleRewardFn,
  );
  console.log(
    `Built ${transitions.length} transitions from ${snapshots.length} snapshots:\n`,
  );

  transitions.forEach((trans, i) => {
    console.log(`  Transition ${i}:`);
    console.log(`    State s_t:`);
    console.log(`      - Duration: ${trans.s.s_session_duration.toFixed(2)}`);
    console.log(`      - Distance: ${trans.s.s_total_distance.toFixed(2)}`);
    console.log(
      `      - Persona: novice=${trans.s.s_persona_novice_old}, inter=${trans.s.s_persona_intermediate}, expert=${trans.s.s_persona_expert}`,
    );
    console.log(`    Action a_t: ${trans.a}`);
    console.log(`    Reward r_t: ${trans.r.toFixed(4)}`);
    console.log(`    Next state s_{t+1}:`);
    console.log(
      `      - Duration: ${trans.s_prime.s_session_duration.toFixed(2)}`,
    );
    console.log(
      `      - Distance: ${trans.s_prime.s_total_distance.toFixed(2)}`,
    );
    console.log(`    Done: ${trans.done}`);
  });

  // Step 3: Validate transitions
  console.log("\n\nSTEP 3: Validate Transitions");
  console.log("-".repeat(70));
  const validation = TransitionBuilder.validate(transitions);
  console.log(`Validation result: ${validation.valid ? "✓ PASS" : "✗ FAIL"}`);
  if (validation.errors.length > 0) {
    console.log("Errors:");
    validation.errors.forEach((err) => console.log(`  - ${err}`));
  } else {
    console.log("No errors found");
  }

  // Step 4: Export to CSV
  console.log("\n\nSTEP 4: Export to CSV Format");
  console.log("-".repeat(70));
  const csv = TransitionBuilder.toCSV(transitions);

  // Show header
  const lines = csv.split("\n");
  const header = lines[0];
  const columnCount = header.split(",").length;
  console.log(`CSV Header (${columnCount} columns):`);
  console.log(header);

  // Show first few rows
  console.log("\nFirst transition as CSV row:");
  console.log(lines[1]);

  console.log("\nAll rows:");
  for (let i = 1; i < lines.length; i++) {
    console.log(`  Row ${i}: ${lines[i].split(",").length} columns`);
  }

  // Step 5: Format verification
  console.log("\n\nSTEP 5: Format Verification");
  console.log("-".repeat(70));

  const expectedColumns = 47; // 15 + 1 + 1 + 15 + 1 = 47 (s + a + r + s' + done)

  console.log(
    `Expected columns: ${expectedColumns} (15 s + 1 action + 1 reward + 15 next_s + 1 done)`,
  );
  console.log(`Actual columns: ${columnCount}`);
  console.log(`Match: ${columnCount === expectedColumns ? "✓ YES" : "✗ NO"}`);

  // Count transitions
  const transitionCount = lines.length - 1;
  console.log(`\nExpected transitions: 4 (from 5 snapshots)`);
  console.log(`Actual transitions: ${transitionCount}`);
  console.log(`Match: ${transitionCount === 4 ? "✓ YES" : "✗ NO"}`);

  // Verify first row values
  console.log("\nFirst transition values:");
  const firstRowVals = lines[1].split(",");
  console.log(`  s_session_duration: ${firstRowVals[0]}`);
  console.log(`  s_total_distance: ${firstRowVals[1]}`);
  console.log(`  action: ${firstRowVals[12]}`);
  console.log(`  reward: ${firstRowVals[13]}`);
  console.log(`  next_s_session_duration: ${firstRowVals[28]}`);
  console.log(`  done: ${firstRowVals[46]}`);

  // Summary
  console.log("\n\nFINAL SUMMARY");
  console.log("=".repeat(70));
  console.log(`✓ Snapshots collected: ${snapshots.length}`);
  console.log(`✓ Transitions built: ${transitionCount}`);
  console.log(
    `✓ CSV format valid: ${columnCount === expectedColumns ? "YES" : "NO"}`,
  );
  console.log(`✓ All validations passed: ${validation.valid ? "YES" : "NO"}`);
  console.log("\nReady for DQN training!\n");

  return {
    snapshots,
    transitions,
    csv,
    validation,
  };
}

// Export for use in browser console or Node.js
export { generateSampleSnapshots, sampleRewardFn };
