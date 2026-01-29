/**
 * DEPRECATED: useDQNAdapter - This hook was causing continuous DQN calls and UI jitter
 * DQN action fetching is now tied to the 10-second metrics snapshot collection
 * See MetricsCollector.collectSnapshot() for the correct approach
 */

import { useState } from "react";

export function useDQNAdapter(metrics, persona) {
  // This hook is kept for backward compatibility but does nothing
  // DQN actions are now fetched synchronously during snapshot collection
  const [dqnAction, setDQNAction] = useState(-1);
  const [loading, setLoading] = useState(false);

  return {
    dqnAction: -1, // Always return -1 to use rule-based fallback
    loading: false,
  };
}
