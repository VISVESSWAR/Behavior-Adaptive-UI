import { createContext, useContext, useState } from "react";

const TaskContext = createContext();

export function TaskProvider({ children }) {
  const [taskId, setTaskId] = useState(null);
  const [taskStartTime, setTaskStartTime] = useState(null);
  const [timeLimit, setTimeLimit] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [pathSequence, setPathSequence] = useState([]);
  const [attempts, setAttempts] = useState(0);
  const [failed, setFailed] = useState(false);

  /**
   * Start a new task with a given id and time limit (in milliseconds)
   */
  const startTask = (id, limit) => {
    setTaskId(id);
    setTaskStartTime(Date.now());
    setTimeLimit(limit);
    setCompleted(false);
    setFailed(false);
    setPathSequence([]);
    setAttempts(0);
    console.log(`[TaskContext] Started task: ${id}, limit: ${limit}ms`);
  };

  /**
   * Mark task as completed
   */
  const completeTask = () => {
    setCompleted(true);
    console.log(`[TaskContext] Task completed: ${taskId}`);
  };

  /**
   * Log a step/page in the path sequence
   */
  const logStep = (stepId) => {
    setPathSequence((prev) => [...prev, stepId]);
    console.log(`[TaskContext] Step logged: ${stepId}`);
  };

  /**
   * Mark task as failed (timeout or other reason)
   */
  const markFailed = () => {
    setFailed(true);
    console.log(`[TaskContext] Task marked as failed: ${taskId}`);
  };

  /**
   * Increment attempts counter
   */
  const incrementAttempts = () => {
    setAttempts((prev) => prev + 1);
  };

  /**
   * Reset task state
   */
  const resetTask = () => {
    setTaskId(null);
    setTaskStartTime(null);
    setTimeLimit(null);
    setCompleted(false);
    setFailed(false);
    setPathSequence([]);
    setAttempts(0);
    console.log("[TaskContext] Task reset");
  };

  const value = {
    // State
    taskId,
    taskStartTime,
    timeLimit,
    completed,
    pathSequence,
    attempts,
    failed,
    // Methods
    startTask,
    completeTask,
    logStep,
    markFailed,
    incrementAttempts,
    resetTask,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function useTask() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTask must be used within TaskProvider");
  }
  return context;
}
