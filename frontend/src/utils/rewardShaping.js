// Reward shaping: saturation penalties + down action bonuses + feedback integration; clipped to [-1.0, 1.0]

import { getUISaturation } from "../adaptation/uiSaturation";

// UI saturation penalty: penalize excessive UI increases (high saturation = bad UX); returns 0 if unknown
export function calculateSaturationPenalty(uiState, limits) {
  if (!uiState || !limits) return 0;

  const saturation = getUISaturation(uiState, limits);
  if (!saturation || saturation.text === null || saturation.spacing === null) {
    return 0; // Unknown saturation = neutral (no reward modification)
  }

  let penalty = 0;

  // -0.3 for each high saturation dimension (max -0.9 for all 4 high)
  if (saturation.text === "high") penalty -= 0.3;
  if (saturation.spacing === "high") penalty -= 0.3;
  if (saturation.button === "high") penalty -= 0.3;
  if (saturation.font === "high") penalty -= 0.3; // Added for completeness

  return Math.max(-0.9, penalty); // Clip to prevent excessive penalty
}

// DOWN action bonus: reward DOWN actions when user shows good metrics (low misclicks, good speed); returns 0 if unknown
export function calculateDownActionBonus(metrics, action) {
  if (!metrics || action === undefined) return 0;

  // Don't penalize idle periods, just be neutral
  if (metrics.misclicks === null || metrics.mouseSpeed === null) {
    return 0;
  }

  // DOWN actions: 2 (button_down), 4 (text_down), 6 (spacing_down), 8 (font_down)
  const isDownAction = [2, 4, 6, 8].includes(action);
  if (!isDownAction) return 0;

  // Check user behavior metrics
  const misclickRate = metrics.misclicks || 0; // Normalized 0-1
  const meanTimePerAction = metrics.mean_time_per_action || 10; // Seconds
  const idleTime = metrics.idle || 0; // Normalized 0-1

  const lowMisclicks = misclickRate < 0.2; // Less than 20% misclick rate
  const goodSpeed = meanTimePerAction < 0.5 || idleTime < 0.3; // < 0.5s per action OR not idle

  if (lowMisclicks && goodSpeed) {
    console.log(
      `[RewardShaping] 📉 DOWN bonus triggered (misclicks=${(misclickRate * 100).toFixed(1)}%, speed=${meanTimePerAction.toFixed(2)}s)`
    );
    return 0.2;
  }

  return 0;
}

// User Feedback Bonus
// Applies human-in-the-loop feedback from Like/Dislike buttons
// Formula: feedback_bonus = 0.5 * user_feedback
// Like (+1) → +0.5 bonus, Dislike (-1) → -0.5 penalty, None (0) → no bonus/penalty
// @param {number} userFeedback - User feedback value (-1, 0, or +1)
// @returns {number} - Bonus/penalty in [-0.5, 0.5]
export function calculateFeedbackBonus(userFeedback) {
  if (userFeedback === undefined || userFeedback === null) return 0;

  const bonus = 0.5 * userFeedback;

  if (userFeedback === 1) {
    console.log("[RewardShaping] 👍 Like feedback bonus: +0.5");
  } else if (userFeedback === -1) {
    console.log("[RewardShaping] 👎 Dislike feedback penalty: -0.5");
  }

  return bonus;
}

// Complete reward shaping: combines all modifications (saturation + down bonus + feedback); clipped to [-1.0, 1.0]
export function shapeReward(snapshot, baseReward, limits) {
  if (!snapshot || baseReward === undefined) {
    return {
      base: baseReward || 0,
      saturation: 0,
      downBonus: 0,
      feedback: 0,
      final: baseReward || 0,
      details: "Invalid snapshot or missing baseReward",
    };
  }

  // Calculate components
  const saturationPenalty = calculateSaturationPenalty(snapshot.uiState, limits);
  const downBonus = calculateDownActionBonus(snapshot.metrics, snapshot.action);
  const feedbackBonus = calculateFeedbackBonus(snapshot.userFeedback);

  // Combine all components
  const shaped = baseReward + saturationPenalty + downBonus + feedbackBonus;
  // CRITICAL: Always clip to [-1.0, 1.0] - never allow out-of-range rewards for training stability
  const finalReward = Math.max(-1.0, Math.min(1.0, shaped));

  // Log reward shaping details
  if (saturationPenalty !== 0 || downBonus !== 0 || feedbackBonus !== 0) {
    console.log(
      `[RewardShaping] Base: ${baseReward.toFixed(3)} | Saturation: ${saturationPenalty.toFixed(3)} | Down: ${downBonus.toFixed(3)} | Feedback: ${feedbackBonus.toFixed(3)} | Final: ${finalReward.toFixed(3)}`
    );
  }

  return {
    base: baseReward,
    saturation: saturationPenalty,
    downBonus: downBonus,
    feedback: feedbackBonus,
    final: finalReward,
    breakdown: {
      hasHighSaturation: saturationPenalty < 0,
      hasDownBonus: downBonus > 0,
      hasUserFeedback: feedbackBonus !== 0,
    },
  };
}

// UI Dimension Limits (defaults)
// Adjust based on your actual UI implementation
export const DEFAULT_UI_LIMITS = {
  buttonSize: 10,
  textSize: 10,
  fontWeight: 5,
  spacing: 8,
};

// INTEGRATION: import { shapeReward } from './rewardShaping'; const { final } = shapeReward(snapshot, baseReward, limits);

// Get reward shaping statistics from snapshot array with base rewards
export function getRewardShapingStats(snapshots, baseRewards, limits) {
  if (!snapshots || snapshots.length === 0) return null;

  let totalSaturationPenalty = 0;
  let totalDownBonus = 0;
  let totalFeedbackBonus = 0;
  let saturationTriggered = 0;
  let downBonusTriggered = 0;
  let feedbackTriggered = 0;

  snapshots.forEach((snapshot, i) => {
    const baseReward = baseRewards[i] || 0;
    const shaped = shapeReward(snapshot, baseReward, limits);

    totalSaturationPenalty += shaped.saturation;
    totalDownBonus += shaped.downBonus;
    totalFeedbackBonus += shaped.feedback;

    if (shaped.breakdown.hasHighSaturation) saturationTriggered++;
    if (shaped.breakdown.hasDownBonus) downBonusTriggered++;
    if (shaped.breakdown.hasUserFeedback) feedbackTriggered++;
  });

  return {
    snapshots: snapshots.length,
    saturationPenaltyTotal: totalSaturationPenalty.toFixed(3),
    saturationPenaltyAvg: (totalSaturationPenalty / snapshots.length).toFixed(3),
    saturationTriggeredCount: saturationTriggered,
    saturationTriggeredPct: ((saturationTriggered / snapshots.length) * 100).toFixed(1),
    downBonusTotal: totalDownBonus.toFixed(3),
    downBonusAvg: (totalDownBonus / snapshots.length).toFixed(3),
    downBonusTriggeredCount: downBonusTriggered,
    downBonusTriggeredPct: ((downBonusTriggered / snapshots.length) * 100).toFixed(1),
    feedbackBonusTotal: totalFeedbackBonus.toFixed(3),
    feedbackBonusAvg: (totalFeedbackBonus / snapshots.length).toFixed(3),
    feedbackTriggeredCount: feedbackTriggered,
    feedbackTriggeredPct: ((feedbackTriggered / snapshots.length) * 100).toFixed(1),
  };
}

export default shapeReward;
