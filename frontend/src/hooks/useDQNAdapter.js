/**
 * DEPRECATED: useDQNAdapter - This hook was causing continuous DQN calls and UI jitter
 * DQN action fetching is now tied to the 10-second metrics snapshot collection
 * See MetricsCollector.collectSnapshot() for the correct approach
 */

import { useState } from "react";

export function useDQNAdapter(metrics, persona) {
  return -1;// deprecated
}
