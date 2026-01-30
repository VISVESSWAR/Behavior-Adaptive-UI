/**
 * REWARD SHAPING - PRACTICAL CODE EXAMPLES
 *
 * Real-world usage patterns for human feedback and reward shaping
 */

/**
 * ============================================================================
 * EXAMPLE 1: Using Reward Shaping in DQN Training
 * ============================================================================
 */

import { shapeReward, getRewardShapingStats, DEFAULT_UI_LIMITS } from './rewardShaping.js';
import { computeReward } from './rewardFunction.js';

// Example: Training loop with reward shaping

async function trainDQNWithShaping(snapshots, dqnModel) {
  console.log(`[Training] Processing ${snapshots.length} snapshots with reward shaping`);

  // Build training transitions with shaped rewards
  const transitions = [];

  for (let i = 0; i < snapshots.length - 1; i++) {
    const snapshot_t = snapshots[i];
    const snapshot_t1 = snapshots[i + 1];

    // Compute base system reward
    const baseReward = computeReward(snapshot_t, snapshot_t1);

    // Apply reward shaping
    const { final: shapedReward, breakdown } = shapeReward(
      snapshot_t,
      baseReward,
      DEFAULT_UI_LIMITS
    );

    // Build transition
    const transition = {
      state: snapshot_t,
      action: snapshot_t.action,
      reward: shapedReward, // Use shaped reward!
      nextState: snapshot_t1,
      done: snapshot_t1.done,

      // Store original for analysis
      baseReward: baseReward,
      hasRewardShaping: breakdown.hasHighSaturation || breakdown.hasDownBonus || breakdown.hasUserFeedback,
    };

    transitions.push(transition);
  }

  // Log shaping statistics
  const stats = getRewardShapingStats(
    snapshots.slice(0, -1),
    transitions.map((t) => t.baseReward),
    DEFAULT_UI_LIMITS
  );
  console.log('[Training] Reward Shaping Stats:', stats);

  // Train DQN
  for (const transition of transitions) {
    await dqnModel.train(
      transition.state,
      transition.action,
      transition.reward,
      transition.nextState,
      transition.done
    );
  }

  return transitions;
}

/**
 * ============================================================================
 * EXAMPLE 2: Analyzing User Feedback Impact
 * ============================================================================
 */

function analyzeFeedbackImpact(snapshots, baseRewards) {
  console.log('\n📊 User Feedback Impact Analysis:');

  let likeCount = 0;
  let dislikeCount = 0;
  let noFeedbackCount = 0;

  let likeRewardDelta = [];
  let dislikeRewardDelta = [];

  for (let i = 0; i < snapshots.length; i++) {
    const feedback = snapshots[i].userFeedback || 0;
    const baseReward = baseRewards[i];
    const { final: shapedReward } = shapeReward(snapshots[i], baseReward, DEFAULT_UI_LIMITS);
    const delta = shapedReward - baseReward;

    if (feedback === 1) {
      likeCount++;
      likeRewardDelta.push(delta);
      console.log(
        `  ✓ Like (snap ${i}): +${delta.toFixed(3)} reward delta`
      );
    } else if (feedback === -1) {
      dislikeCount++;
      dislikeRewardDelta.push(delta);
      console.log(
        `  ✗ Dislike (snap ${i}): ${delta.toFixed(3)} reward delta`
      );
    } else {
      noFeedbackCount++;
    }
  }

  // Summary
  const avgLikeDelta = likeRewardDelta.length > 0
    ? likeRewardDelta.reduce((a, b) => a + b, 0) / likeRewardDelta.length
    : 0;
  const avgDislikeDelta = dislikeRewardDelta.length > 0
    ? dislikeRewardDelta.reduce((a, b) => a + b, 0) / dislikeRewardDelta.length
    : 0;

  console.log(`\n  Summary:`);
  console.log(`    Likes: ${likeCount} (avg delta: +${avgLikeDelta.toFixed(3)})`);
  console.log(`    Dislikes: ${dislikeCount} (avg delta: ${avgDislikeDelta.toFixed(3)})`);
  console.log(`    No feedback: ${noFeedbackCount}`);
}

/**
 * ============================================================================
 * EXAMPLE 3: Detecting High Saturation Issues
 * ============================================================================
 */

function analyzeUISaturation(snapshots, baseRewards) {
  console.log('\n🎨 UI Saturation Analysis:');

  let saturationIssues = [];

  for (let i = 0; i < snapshots.length; i++) {
    const snapshot = snapshots[i];
    const baseReward = baseRewards[i];
    const { saturation, final } = shapeReward(snapshot, baseReward, DEFAULT_UI_LIMITS);

    if (saturation < -0.1) { // Significant saturation penalty
      saturationIssues.push({
        index: i,
        timestamp: snapshot.timestamp,
        uiState: snapshot.uiState,
        penalty: saturation.toFixed(3),
        action: snapshot.action,
        actionName: ['noop', 'button_up', 'button_down', 'text_up', 'text_down', 'font_up', 'font_down', 'spacing_up', 'spacing_down', 'tooltips'][snapshot.action],
      });
    }
  }

  if (saturationIssues.length > 0) {
    console.log(`  Found ${saturationIssues.length} snapshots with high saturation penalties:`);
    saturationIssues.slice(0, 5).forEach((issue) => {
      console.log(`    Snap ${issue.index} (${new Date(issue.timestamp).toISOString()})`);
      console.log(`      UI: ${JSON.stringify(issue.uiState)}`);
      console.log(`      Penalty: ${issue.penalty}`);
      console.log(`      Action: ${issue.actionName}`);
    });

    if (saturationIssues.length > 5) {
      console.log(`    ... and ${saturationIssues.length - 5} more`);
    }
  } else {
    console.log('  No high saturation issues detected ✅');
  }
}

/**
 * ============================================================================
 * EXAMPLE 4: DOWN Action Bonus Effectiveness
 * ============================================================================
 */

function analyzeDownBonusEffectiveness(snapshots, baseRewards) {
  console.log('\n📉 DOWN Action Bonus Analysis:');

  const downActions = [2, 4, 6, 8]; // button_down, text_down, spacing_down, font_down
  let downActionSnapshots = [];
  let downWithBonus = 0;

  for (let i = 0; i < snapshots.length; i++) {
    const snapshot = snapshots[i];
    if (!downActions.includes(snapshot.action)) continue;

    const baseReward = baseRewards[i];
    const { downBonus, final } = shapeReward(snapshot, baseReward, DEFAULT_UI_LIMITS);

    downActionSnapshots.push({
      index: i,
      action: snapshot.action,
      metrics: snapshot.metrics,
      bonus: downBonus,
      finalReward: final,
    });

    if (downBonus > 0) downWithBonus++;
  }

  if (downActionSnapshots.length > 0) {
    console.log(`  Total DOWN actions: ${downActionSnapshots.length}`);
    console.log(`  DOWN actions with bonus: ${downWithBonus} (${((downWithBonus / downActionSnapshots.length) * 100).toFixed(1)}%)`);

    const bonusSnapshots = downActionSnapshots.filter((s) => s.bonus > 0);
    if (bonusSnapshots.length > 0) {
      const avgBonus = bonusSnapshots.reduce((a, b) => a + b.bonus, 0) / bonusSnapshots.length;
      console.log(`  Average bonus when triggered: +${avgBonus.toFixed(3)}`);
    }

    // Show examples
    if (bonusSnapshots.length > 0) {
      console.log(`  Example bonus-triggered DOWN action:`);
      const example = bonusSnapshots[0];
      console.log(`    Metrics: misclicks=${(example.metrics.misclicks * 100).toFixed(1)}%, speed=${example.metrics.mean_time_per_action.toFixed(2)}s`);
    }
  } else {
    console.log('  No DOWN actions in dataset');
  }
}

/**
 * ============================================================================
 * EXAMPLE 5: Curriculum Learning with Reward Shaping
 * ============================================================================
 */

function buildCurriculumTransitions(snapshots, baseRewards) {
  console.log('\n📚 Building Curriculum Learning Batches:');

  // Separate transitions by source and feedback
  const batchExploitation = [];
  const batchExploration = [];
  const batchWithPositiveFeedback = [];

  for (let i = 0; i < snapshots.length - 1; i++) {
    const snapshot = snapshots[i];
    const baseReward = baseRewards[i];
    const { final: shapedReward } = shapeReward(snapshot, baseReward, DEFAULT_UI_LIMITS);

    const transition = {
      state: snapshot,
      action: snapshot.action,
      reward: shapedReward,
      actionSource: snapshot.actionSource,
      userFeedback: snapshot.userFeedback || 0,
    };

    // Curriculum 1: Model-generated actions (exploitation learning)
    if (snapshot.actionSource === 'model') {
      batchExploitation.push(transition);
    }

    // Curriculum 2: Exploration actions (discovery learning)
    if (snapshot.actionSource === 'explore') {
      batchExploration.push(transition);
    }

    // Curriculum 3: Positive user feedback (reward learning)
    if (snapshot.userFeedback === 1) {
      batchWithPositiveFeedback.push(transition);
    }
  }

  console.log(`  📖 Exploitation batch: ${batchExploitation.length} transitions`);
  console.log(`  🎲 Exploration batch: ${batchExploration.length} transitions`);
  console.log(`  👍 Positive feedback batch: ${batchWithPositiveFeedback.length} transitions`);

  // Train curriculum: start with positive feedback, add exploration, then exploitation
  return {
    phase1_positive: batchWithPositiveFeedback,
    phase2_exploration: batchExploration,
    phase3_exploitation: batchExploitation,
  };
}

/**
 * ============================================================================
 * EXAMPLE 6: Exporting Shaped Rewards for Analysis
 * ============================================================================
 */

function exportRewardShapingData(snapshots, baseRewards, outputPath) {
  console.log(`\n💾 Exporting reward shaping data to ${outputPath}`);

  const data = snapshots.map((snapshot, i) => {
    const baseReward = baseRewards[i];
    const { base, saturation, downBonus, feedback, final, breakdown } = shapeReward(
      snapshot,
      baseReward,
      DEFAULT_UI_LIMITS
    );

    return {
      timestamp: snapshot.timestamp,
      sessionId: snapshot.sessionId,
      action: snapshot.action,
      personaType: snapshot.persona.type,
      reward_base: base.toFixed(4),
      reward_saturation: saturation.toFixed(4),
      reward_down_bonus: downBonus.toFixed(4),
      reward_feedback: feedback.toFixed(4),
      reward_final: final.toFixed(4),
      user_feedback: snapshot.userFeedback || 0,
      action_source: snapshot.actionSource,
      ui_saturation_text: snapshot.uiState.textSize,
      ui_saturation_spacing: snapshot.uiState.spacing,
      ui_saturation_button: snapshot.uiState.buttonSize,
      metrics_misclicks: snapshot.metrics.misclicks?.toFixed(2) || '0',
      metrics_speed: snapshot.metrics.mean_time_per_action?.toFixed(2) || '0',
    };
  });

  // In real implementation, write to CSV
  console.log(`  Total records: ${data.length}`);
  console.log(`  Sample record:`, JSON.stringify(data[0], null, 2));

  return data;
}

/**
 * ============================================================================
 * EXAMPLE 7: Real-time Dashboard Metrics
 * ============================================================================
 */

function getDashboardMetrics(snapshots, baseRewards) {
  const recentSnapshots = snapshots.slice(-100); // Last 100 snapshots
  const recentBaseRewards = baseRewards.slice(-100);

  let totalRewarding = 0;
  let totalShaped = 0;
  let shapingActive = 0;

  recentSnapshots.forEach((snapshot, i) => {
    const baseReward = recentBaseRewards[i];
    const { final } = shapeReward(snapshot, baseReward, DEFAULT_UI_LIMITS);
    totalRewarding += baseReward;
    totalShaped += final;
    if (Math.abs(final - baseReward) > 0.01) {
      shapingActive++;
    }
  });

  return {
    avgBaseReward: (totalRewarding / recentSnapshots.length).toFixed(3),
    avgShapedReward: (totalShaped / recentSnapshots.length).toFixed(3),
    shapingActiveRate: ((shapingActive / recentSnapshots.length) * 100).toFixed(1),
    recentCount: recentSnapshots.length,
  };
}

/**
 * ============================================================================
 * EXAMPLE 8: Debugging Specific Transitions
 * ============================================================================
 */

function debugTransition(snapshot, baseReward, limits = DEFAULT_UI_LIMITS) {
  const { base, saturation, downBonus, feedback, final, breakdown } = shapeReward(
    snapshot,
    baseReward,
    limits
  );

  console.log('\n🔍 Transition Reward Breakdown:');
  console.log(`  Base Reward: ${base.toFixed(3)}`);
  console.log(`  Saturation Penalty: ${saturation.toFixed(3)} ${breakdown.hasHighSaturation ? '⚠️' : '✓'}`);
  console.log(`  DOWN Bonus: ${downBonus.toFixed(3)} ${breakdown.hasDownBonus ? '✅' : ''}`);
  console.log(`  User Feedback Bonus: ${feedback.toFixed(3)} ${breakdown.hasUserFeedback ? '👤' : ''}`);
  console.log(`  ─────────────────────────`);
  console.log(`  Final Reward: ${final.toFixed(3)}`);
  console.log(`  Change: ${(final - base > 0 ? '+' : '')}{final - base}.toFixed(3)}`);

  console.log(`\n  Action: ${snapshot.action}`);
  console.log(`  UI State:`, JSON.stringify(snapshot.uiState));
  console.log(`  User Feedback: ${snapshot.userFeedback || 'none'}`);
}

/**
 * Usage examples:
 *
 * // Train DQN with reward shaping:
 * const snapshots = await fetchSnapshots();
 * const baseRewards = snapshots.map((s, i) => computeReward(s, snapshots[i+1]));
 * await trainDQNWithShaping(snapshots, dqnModel);
 *
 * // Analyze feedback impact:
 * analyzeFeedbackImpact(snapshots, baseRewards);
 * analyzeUISaturation(snapshots, baseRewards);
 * analyzeDownBonusEffectiveness(snapshots, baseRewards);
 *
 * // Build curriculum:
 * const curriculum = buildCurriculumTransitions(snapshots, baseRewards);
 * await dqnModel.trainOnPhase(curriculum.phase1_positive);
 * await dqnModel.trainOnPhase(curriculum.phase2_exploration);
 * await dqnModel.trainOnPhase(curriculum.phase3_exploitation);
 *
 * // Export and analyze:
 * const data = exportRewardShapingData(snapshots, baseRewards, './rewards.csv');
 * const metrics = getDashboardMetrics(snapshots, baseRewards);
 */

export {
  trainDQNWithShaping,
  analyzeFeedbackImpact,
  analyzeUISaturation,
  analyzeDownBonusEffectiveness,
  buildCurriculumTransitions,
  exportRewardShapingData,
  getDashboardMetrics,
  debugTransition,
};
