/**
 * REWARD SHAPING - BACKEND INTEGRATION GUIDE
 *
 * This guide shows how to integrate reward shaping into your RL training pipeline.
 *
 * The reward shaping system has 3 components:
 * 1. UI Saturation Penalties - penalizes excessive UI increases
 * 2. DOWN Action Bonuses - rewards reduction when user has good metrics
 * 3. User Feedback Integration - applies human Like/Dislike signals
 *
 * Formula:
 *   final_reward = system_reward + saturation_penalty + down_bonus + 0.5 * feedback
 */

/**
 * ============================================================================
 * OPTION 1: Python Backend Integration
 * ============================================================================
 *
 * For use in your training script (e.g., backend/train_dqn.py)
 */

// Python pseudocode (after fetching snapshots from DB):
/*

import json
import numpy as np

def get_ui_saturation(ui_state, limits):
    """Check if UI dimensions are in high saturation (80%+ of max)"""
    saturation = {}
    for dim in ['button_size', 'text_size', 'spacing', 'font_weight']:
        value = ui_state.get(dim, 0)
        max_val = limits.get(dim, 1)
        percentage = value / max_val if max_val > 0 else 0
        saturation[dim] = 'high' if percentage >= 0.8 else 'low' if percentage <= 0.2 else 'optimal'
    return saturation

def calculate_saturation_penalty(ui_state, limits):
    """-0.3 for each high saturation dimension (max -0.9)"""
    saturation = get_ui_saturation(ui_state, limits)
    penalty = 0
    for zone in saturation.values():
        if zone == 'high':
            penalty -= 0.3
    return max(-0.9, penalty)

def calculate_down_action_bonus(metrics, action):
    """+0.2 bonus for DOWN actions (2,4,6,8) when low misclicks & good speed"""
    if action not in [2, 4, 6, 8]:  # Not a DOWN action
        return 0
    
    misclick_rate = metrics.get('misclicks', 0)
    mean_time_per_action = metrics.get('mean_time_per_action', 10)
    idle_time = metrics.get('idle', 0)
    
    low_misclicks = misclick_rate < 0.2
    good_speed = mean_time_per_action < 0.5 or idle_time < 0.3
    
    if low_misclicks and good_speed:
        return 0.2
    return 0

def calculate_feedback_bonus(user_feedback):
    """0.5 * user_feedback (Like=+1 gives +0.5, Dislike=-1 gives -0.5)"""
    if user_feedback is None:
        return 0
    return 0.5 * user_feedback

def shape_reward(snapshot, base_reward, ui_limits):
    """Apply all reward shaping to base system reward"""
    if not snapshot:
        return base_reward
    
    saturation_penalty = calculate_saturation_penalty(
        snapshot['ui_state'],
        ui_limits
    )
    down_bonus = calculate_down_action_bonus(
        snapshot['metrics'],
        snapshot['action']
    )
    feedback_bonus = calculate_feedback_bonus(
        snapshot.get('user_feedback', 0)
    )
    
    shaped = base_reward + saturation_penalty + down_bonus + feedback_bonus
    final_reward = np.clip(shaped, -1.0, 1.0)  # Always clip
    
    return final_reward

# In your training loop:
UI_LIMITS = {
    'button_size': 10,
    'text_size': 10,
    'font_weight': 5,
    'spacing': 8
}

transitions = []
for snapshot_t, snapshot_t1 in zip(snapshots[:-1], snapshots[1:]):
    # Compute base reward from your existing reward function
    base_reward = compute_reward(snapshot_t, snapshot_t1)
    
    # Apply reward shaping
    final_reward = shape_reward(snapshot_t, base_reward, UI_LIMITS)
    
    # Build transition with shaped reward
    transition = {
        's_t': snapshot_to_state_vector(snapshot_t),
        'a_t': snapshot_t['action'],
        'r_t': final_reward,  # Use shaped reward!
        's_t1': snapshot_to_state_vector(snapshot_t1),
        'done': snapshot_t1['done'],
        
        # Optional: attach metadata for analysis
        'metadata': {
            'base_reward': base_reward,
            'action_source': snapshot_t['action_source'],
            'user_feedback': snapshot_t.get('user_feedback', 0),
            'session_id': snapshot_t['session_id'],
        }
    }
    transitions.append(transition)

# Train DQN with shaped rewards
dqn_agent.train(transitions)

*/

/**
 * ============================================================================
 * OPTION 2: JavaScript Backend (Node.js)
 * ============================================================================
 *
 * For use in a Node.js training service
 */

// JavaScript implementation:

function getUISaturation(uiState, limits) {
  const saturation = {};
  for (const dim of ['buttonSize', 'textSize', 'spacing', 'fontWeight']) {
    const value = uiState[dim] || 0;
    const max_val = limits[dim] || 1;
    const percentage = max_val > 0 ? value / max_val : 0;
    saturation[dim] = percentage >= 0.8 ? 'high' : percentage <= 0.2 ? 'low' : 'optimal';
  }
  return saturation;
}

function calculateSaturationPenalty(uiState, limits) {
  const saturation = getUISaturation(uiState, limits);
  let penalty = 0;
  for (const zone of Object.values(saturation)) {
    if (zone === 'high') penalty -= 0.3;
  }
  return Math.max(-0.9, penalty);
}

function calculateDownActionBonus(metrics, action) {
  if (![2, 4, 6, 8].includes(action)) return 0;

  const misclickRate = metrics.misclicks || 0;
  const meanTimePerAction = metrics.mean_time_per_action || 10;
  const idleTime = metrics.idle || 0;

  const lowMisclicks = misclickRate < 0.2;
  const goodSpeed = meanTimePerAction < 0.5 || idleTime < 0.3;

  return lowMisclicks && goodSpeed ? 0.2 : 0;
}

function calculateFeedbackBonus(userFeedback) {
  if (!userFeedback) return 0;
  return 0.5 * userFeedback;
}

function shapeReward(snapshot, baseReward, uiLimits) {
  if (!snapshot) return baseReward;

  const saturation = calculateSaturationPenalty(snapshot.uiState, uiLimits);
  const downBonus = calculateDownActionBonus(snapshot.metrics, snapshot.action);
  const feedback = calculateFeedbackBonus(snapshot.userFeedback);

  const shaped = baseReward + saturation + downBonus + feedback;
  return Math.max(-1.0, Math.min(1.0, shaped));
}

// In your Node.js training service:
const UI_LIMITS = {
  buttonSize: 10,
  textSize: 10,
  fontWeight: 5,
  spacing: 8
};

async function buildTrainingTransitions(snapshots, rewardFunction) {
  const transitions = [];

  for (let i = 0; i < snapshots.length - 1; i++) {
    const snapshot_t = snapshots[i];
    const snapshot_t1 = snapshots[i + 1];

    // Compute base reward
    const baseReward = rewardFunction(snapshot_t, snapshot_t1);

    // Apply reward shaping
    const shapedReward = shapeReward(snapshot_t, baseReward, UI_LIMITS);

    // Build transition
    const transition = {
      s_t: snapshotToStateVector(snapshot_t),
      a_t: snapshot_t.action,
      r_t: shapedReward, // Shaped reward!
      s_t1: snapshotToStateVector(snapshot_t1),
      done: snapshot_t1.done,

      metadata: {
        baseReward: baseReward,
        actionSource: snapshot_t.actionSource,
        userFeedback: snapshot_t.userFeedback || 0,
        sessionId: snapshot_t.sessionId,
      }
    };

    transitions.push(transition);
  }

  return transitions;
}

/**
 * ============================================================================
 * OPTION 3: Post-Processing Utility
 * ============================================================================
 *
 * For use in a standalone dataset processing script
 */

/*

import csv
import json

def process_snapshot_file(input_csv, output_csv, reward_function, ui_limits):
    '''
    Read snapshot CSV, apply reward shaping, output training data
    '''
    
    results = []
    
    with open(input_csv, 'r') as f:
        reader = csv.DictReader(f)
        snapshots = list(reader)
    
    for i in range(len(snapshots) - 1):
        snapshot_t = snapshots[i]
        snapshot_t1 = snapshots[i + 1]
        
        # Parse JSON fields
        metrics = json.loads(snapshot_t['metrics'])
        ui_state = json.loads(snapshot_t['ui_state'])
        user_feedback = int(snapshot_t.get('user_feedback', 0))
        action = int(snapshot_t['action'])
        
        # Compute base reward
        base_reward = reward_function(snapshot_t, snapshot_t1)
        
        # Apply shaping
        saturation = calculate_saturation_penalty(ui_state, ui_limits)
        down_bonus = calculate_down_action_bonus(metrics, action)
        feedback = 0.5 * user_feedback
        
        shaped_reward = base_reward + saturation + down_bonus + feedback
        shaped_reward = max(-1.0, min(1.0, shaped_reward))
        
        results.append({
            'state_t': state_t,
            'action': action,
            'reward_base': base_reward,
            'reward_saturation': saturation,
            'reward_down_bonus': down_bonus,
            'reward_feedback': feedback,
            'reward_final': shaped_reward,
            'state_t1': state_t1,
            'done': snapshot_t1['done'],
            'session_id': snapshot_t['session_id'],
        })
    
    # Write output
    with open(output_csv, 'w') as f:
        writer = csv.DictWriter(f, fieldnames=results[0].keys())
        writer.writeheader()
        writer.writerows(results)

*/

/**
 * ============================================================================
 * DEBUGGING & ANALYSIS
 * ============================================================================
 */

/*

// Get statistics about reward shaping in your dataset:

function analyzeRewardShaping(snapshots, baseRewards, uiLimits) {
    let saturationCount = 0;
    let downBonusCount = 0;
    let feedbackCount = 0;
    
    let totalSaturation = 0;
    let totalDownBonus = 0;
    let totalFeedback = 0;
    
    snapshots.forEach((snap, i) => {
        const base = baseRewards[i];
        const saturation = calculateSaturationPenalty(snap.uiState, uiLimits);
        const downBonus = calculateDownActionBonus(snap.metrics, snap.action);
        const feedback = calculateFeedbackBonus(snap.userFeedback);
        
        if (saturation !== 0) { saturationCount++; totalSaturation += saturation; }
        if (downBonus !== 0) { downBonusCount++; totalDownBonus += downBonus; }
        if (feedback !== 0) { feedbackCount++; totalFeedback += feedback; }
    });
    
    console.log('Reward Shaping Analysis:');
    console.log(`  Saturation Penalties: ${saturationCount} / ${snapshots.length} (${(saturationCount/snapshots.length*100).toFixed(1)}%)`);
    console.log(`    Total: ${totalSaturation.toFixed(3)}, Avg: ${(totalSaturation/saturationCount || 0).toFixed(3)}`);
    console.log(`  DOWN Bonuses: ${downBonusCount} / ${snapshots.length} (${(downBonusCount/snapshots.length*100).toFixed(1)}%)`);
    console.log(`    Total: ${totalDownBonus.toFixed(3)}, Avg: ${(totalDownBonus/downBonusCount || 0).toFixed(3)}`);
    console.log(`  User Feedback: ${feedbackCount} / ${snapshots.length} (${(feedbackCount/snapshots.length*100).toFixed(1)}%)`);
    console.log(`    Total: ${totalFeedback.toFixed(3)}, Avg: ${(totalFeedback/feedbackCount || 0).toFixed(3)}`);
}

*/

/**
 * ============================================================================
 * KEY PARAMETERS TO ADJUST
 * ============================================================================
 *
 * Saturation thresholds (in getUISaturation):
 *   - High zone: >= 80% of max value
 *   - Low zone: <= 20% of max value
 *   - Optimal zone: 20-80%
 *
 * Saturation penalty: -0.3 per high dimension (max -0.9)
 *   - Adjust multiplier if penalties too aggressive/lenient
 *
 * DOWN action bonus conditions:
 *   - low_misclicks: misclick_rate < 0.2 (20%)
 *   - good_speed: mean_time_per_action < 0.5 seconds OR idle < 30%
 *   - bonus: +0.2 when both met
 *   - Adjust thresholds based on your user base
 *
 * Feedback weight: 0.5 * user_feedback
 *   - User Like (+1) → +0.5 reward
 *   - User Dislike (-1) → -0.5 reward
 *   - Adjust 0.5 multiplier for different feedback influence
 *
 * UI dimension limits:
 *   - Must match your actual UI implementation
 *   - Used to calculate saturation percentage
 *   - Verify these match frontend values!
 */

export {};
