/**
 * CSV Parser for exported transition logs and RL metrics
 * Handles both transition CSV and RL logs for analysis
 */

/**
 * Parse transition CSV (from indexedDBManager.exportAllAsCSV)
 * Format: 15 state cols | action | experimentMode | reward | 15 next_state cols | done
 */
export function parseTransitionCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = lines[0].split(',');
  const rows = lines.slice(1).map(line => {
    const values = line.split(',');
    return headers.reduce((obj, header, idx) => {
      obj[header] = values[idx];
      return obj;
    }, {});
  });

  return { headers, rows };
}

/**
 * Extract task completion time distribution from transitions
 * Uses metadata timestamps to calculate task durations
 */
export function getTaskCompletionTimes(transitions) {
  // Group transitions by session and task
  const taskGroups = {};
  
  transitions.forEach(t => {
    // Extract numeric values and metadata
    const sessionId = t.s_session_duration || 0; // Approximation
    const done = parseInt(t.done) === 1;
    
    if (done) {
      taskGroups[sessionId] = (taskGroups[sessionId] || 0) + 1;
    }
  });

  // Convert to time buckets (0-10s, 10-20s, etc.)
  const buckets = {
    '0-10s': 0,
    '10-20s': 0,
    '20-30s': 0,
    '30-40s': 0,
    '40-50s': 0,
    '50-60s': 0,
    '60+s': 0,
  };

  Object.values(taskGroups).forEach(duration => {
    const seconds = Math.floor(duration);
    if (seconds < 10) buckets['0-10s']++;
    else if (seconds < 20) buckets['10-20s']++;
    else if (seconds < 30) buckets['20-30s']++;
    else if (seconds < 40) buckets['30-40s']++;
    else if (seconds < 50) buckets['40-50s']++;
    else if (seconds < 60) buckets['50-60s']++;
    else buckets['60+s']++;
  });

  return Object.entries(buckets).map(([timeRange, count]) => ({
    timeRange,
    count,
  }));
}

/**
 * Extract reward over time from transitions
 * Groups rewards by action index for trend analysis
 */
export function getRewardTimeSeries(transitions) {
  return transitions.slice(0, 100).map((t, idx) => ({
    stepIndex: idx,
    reward: parseFloat(t.reward) || 0,
    cumulative: transitions.slice(0, idx + 1).reduce((sum, tr) => sum + parseFloat(tr.reward || 0), 0),
  }));
}

/**
 * Calculate error rate by experiment mode
 * Error = negative reward (< -0.1)
 */
export function getErrorRateByMode(transitions) {
  const modeStats = {};

  transitions.forEach(t => {
    const mode = t.experimentMode || 'unknown';
    const reward = parseFloat(t.reward) || 0;
    const isError = reward < -0.1;

    if (!modeStats[mode]) {
      modeStats[mode] = { total: 0, errors: 0 };
    }
    modeStats[mode].total++;
    if (isError) modeStats[mode].errors++;
  });

  return Object.entries(modeStats).map(([mode, stats]) => ({
    mode,
    errorRate: stats.total > 0 ? ((stats.errors / stats.total) * 100).toFixed(2) : 0,
    totalTransitions: stats.total,
    errorCount: stats.errors,
  }));
}

/**
 * Get action frequency histogram
 * Action values: 0-9 (ten possible actions)
 */
export function getActionFrequency(transitions) {
  const frequency = {};

  transitions.forEach(t => {
    const action = parseInt(t.action) || -1;
    if (action >= 0 && action <= 9) {
      frequency[`Action ${action}`] = (frequency[`Action ${action}`] || 0) + 1;
    } else if (action !== -1) {
      frequency['Unknown'] = (frequency['Unknown'] || 0) + 1;
    }
  });

  return Object.entries(frequency).map(([action, count]) => ({
    action,
    count,
    percentage: ((count / transitions.length) * 100).toFixed(1),
  }));
}

/**
 * Get mode performance comparison
 * Calculates average reward and success rate per mode
 */
export function getModePerformance(transitions) {
  const modeStats = {};

  transitions.forEach(t => {
    const mode = t.experimentMode || 'unknown';
    const reward = parseFloat(t.reward) || 0;
    const done = parseInt(t.done) === 1;

    if (!modeStats[mode]) {
      modeStats[mode] = {
        totalReward: 0,
        count: 0,
        completions: 0,
        avgAction: 0,
        actionCount: 0,
      };
    }
    modeStats[mode].totalReward += reward;
    modeStats[mode].count++;
    if (done) modeStats[mode].completions++;
    
    const action = parseInt(t.action);
    if (!isNaN(action)) {
      modeStats[mode].avgAction += action;
      modeStats[mode].actionCount++;
    }
  });

  return Object.entries(modeStats).map(([mode, stats]) => ({
    mode,
    avgReward: (stats.totalReward / stats.count).toFixed(3),
    successRate: stats.count > 0 ? ((stats.completions / stats.count) * 100).toFixed(1) : 0,
    transitionCount: stats.count,
    avgAction: stats.actionCount > 0 ? (stats.avgAction / stats.actionCount).toFixed(2) : 'N/A',
  }));
}

/**
 * Get reward distribution statistics
 * Min, max, mean, median
 */
export function getRewardStats(transitions) {
  const rewards = transitions
    .map(t => parseFloat(t.reward) || 0)
    .filter(r => !isNaN(r))
    .sort((a, b) => a - b);

  if (rewards.length === 0) {
    return { min: 0, max: 0, mean: 0, median: 0, std: 0 };
  }

  const min = Math.min(...rewards);
  const max = Math.max(...rewards);
  const mean = rewards.reduce((a, b) => a + b, 0) / rewards.length;
  const median = rewards[Math.floor(rewards.length / 2)];
  
  const variance = rewards.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / rewards.length;
  const std = Math.sqrt(variance);

  return {
    min: min.toFixed(3),
    max: max.toFixed(3),
    mean: mean.toFixed(3),
    median: median.toFixed(3),
    std: std.toFixed(3),
  };
}
