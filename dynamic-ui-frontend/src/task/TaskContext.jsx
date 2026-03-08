import { createContext, useContext, useState } from "react";

const TaskContext = createContext();

// Generate unique task_id: task_<page>_<timestamp>_<random>
function generateTaskId(pageName) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 6);
  return `task_${pageName}_${timestamp}_${random}`;
}

export function TaskProvider({ children }) {
  // Initialize taskId from localStorage if available (page refresh recovery)
  const [taskId, setTaskId] = useState(() => {
    return localStorage.getItem("current_task_id") || null;
  });
  const [taskStartTime, setTaskStartTime] = useState(null);
  const [timeLimit, setTimeLimit] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [pathSequence, setPathSequence] = useState([]);
  const [attempts, setAttempts] = useState(0);
  const [failed, setFailed] = useState(false);

  // Start page-level task with unique task_id (one attempt per page)
  const startPageTask = (pageName) => {
    const newTaskId = generateTaskId(pageName);
    const startTime = Date.now();
    setTaskId(newTaskId);
    setTaskStartTime(startTime);
    localStorage.setItem("current_task_id", newTaskId);
    localStorage.setItem("task_start_time", startTime.toString());
    setCompleted(false);
    setFailed(false);
    setPathSequence([]);
    setAttempts(0);
    console.log(`[TaskContext] Started page task: ${newTaskId} at ${startTime}`);
  };

  // Get current task_id
  const getTaskId = () => {
    return taskId || localStorage.getItem("current_task_id");
  };

  // Start task with id and time limit (in milliseconds) - legacy compatibility
  const startTask = (id, limit) => {
    const startTime = Date.now();
    setTaskId(id);
    localStorage.setItem("current_task_id", id);
    localStorage.setItem("task_start_time", startTime.toString());
    setTaskStartTime(startTime);
    setTimeLimit(limit);
    setCompleted(false);
    setFailed(false);
    setPathSequence([]);
    setAttempts(0);
    console.log(`[TaskContext] Started task: ${id}, limit: ${limit}ms, startTime: ${startTime}`);
  };

  // Mark task complete
  const completeTask = () => {
    setCompleted(true);
    console.log(`[TaskContext] Task completed: ${taskId}`);
  };

  // Log step in path sequence
  const logStep = (stepId) => {
    setPathSequence((prev) => [...prev, stepId]);
    console.log(`[TaskContext] Step logged: ${stepId}`);
  };

  // Mark task failed (timeout or error)
  const markFailed = () => {
    setFailed(true);
    console.log(`[TaskContext] Task marked as failed: ${taskId}`);
  };

  // Increment attempts counter
  const incrementAttempts = () => {
    setAttempts((prev) => prev + 1);
  };

  // Reset task state
  const resetTask = () => {
    setTaskId(null);
    setTaskStartTime(null);
    setTimeLimit(null);
    setCompleted(false);
    setFailed(false);
    setPathSequence([]);
    setAttempts(0);
    localStorage.removeItem("current_task_id");
    localStorage.removeItem("task_start_time");
    console.log("[TaskContext] Task reset and cleared from localStorage");
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
    startPageTask,
    getTaskId,
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
