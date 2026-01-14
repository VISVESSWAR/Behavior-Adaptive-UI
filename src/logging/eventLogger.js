import { SESSION_ID } from "./session";

const logs = [];

export const logEvent = ({
  type,
  flowId,
  stepId,
  value = {},
}) => {
  logs.push({
    session_id: SESSION_ID,
    flow_id: flowId,
    step_id: stepId,
    event_type: type,
    timestamp: Date.now(),
    ...value
  });
};

export const getLogs = () => logs;
