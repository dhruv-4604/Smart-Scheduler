/**
 * Job Scheduling Algorithms for Task Management
 * Implements various scheduling algorithms including:
 * 1. Earliest Deadline First (EDF)
 * 2. Priority-based Scheduling
 * 3. Shortest Job First (SJF)
 */

/**
 * Earliest Deadline First (EDF) algorithm
 * @param {Array} tasks - Array of task objects
 * @returns {Array} Sorted array of tasks
 */
const earliestDeadlineFirst = (tasks) => {
  // Clone tasks to avoid modifying the original array
  const sortedTasks = [...tasks];
  
  // Sort by deadline (ascending)
  return sortedTasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
};

/**
 * Priority-based Scheduling
 * @param {Array} tasks - Array of task objects
 * @returns {Array} Sorted array of tasks
 */
const priorityScheduling = (tasks) => {
  // Clone tasks to avoid modifying the original array
  const sortedTasks = [...tasks];
  
  // Sort by priority (ascending, where 1 is highest priority)
  return sortedTasks.sort((a, b) => a.priority - b.priority);
};

/**
 * Shortest Job First (SJF) algorithm
 * @param {Array} tasks - Array of task objects
 * @returns {Array} Sorted array of tasks
 */
const shortestJobFirst = (tasks) => {
  // Clone tasks to avoid modifying the original array
  const sortedTasks = [...tasks];
  
  // Sort by estimated duration (ascending)
  return sortedTasks.sort((a, b) => a.estimatedDuration - b.estimatedDuration);
};

/**
 * Weighted combination of multiple scheduling algorithms
 * @param {Array} tasks - Array of task objects
 * @param {Object} weights - Weights for different algorithms (0-1)
 * @returns {Array} Array of tasks with calculated schedules
 */
const smartScheduling = (tasks, weights = { deadline: 0.5, priority: 0.3, duration: 0.2 }) => {
  if (!tasks || tasks.length === 0) {
    return [];
  }

  // Clone tasks to avoid modifying the original array
  const tasksCopy = tasks.map(task => ({...task}));
  
  // Calculate scores based on different criteria
  tasksCopy.forEach(task => {
    // Deadline score (closer deadline = higher score)
    const deadlineTime = new Date(task.deadline).getTime();
    const now = Date.now();
    const maxDeadline = Math.max(...tasksCopy.map(t => new Date(t.deadline).getTime()));
    const deadlineScore = 1 - ((deadlineTime - now) / (maxDeadline - now + 1));
    
    // Priority score (higher priority = higher score)
    const priorityScore = (4 - task.priority) / 3; // Convert 1-3 to 1-0.33 scale
    
    // Duration score (shorter duration = higher score)
    const maxDuration = Math.max(...tasksCopy.map(t => t.estimatedDuration));
    const durationScore = 1 - (task.estimatedDuration / maxDuration);
    
    // Calculate weighted score
    task.score = (
      weights.deadline * deadlineScore +
      weights.priority * priorityScore +
      weights.duration * durationScore
    );
  });
  
  // Sort by combined score (descending)
  const sortedTasks = tasksCopy.sort((a, b) => b.score - a.score);
  
  // Assign actual scheduled times
  let currentTime = new Date();
  
  return sortedTasks.map(task => {
    // Set scheduledStart to the current time
    task.scheduledStart = new Date(currentTime);
    
    // Calculate scheduledEnd by adding the estimated duration
    const durationMs = task.estimatedDuration * 60 * 1000; // Convert minutes to milliseconds
    currentTime = new Date(currentTime.getTime() + durationMs);
    task.scheduledEnd = new Date(currentTime);
    
    return task;
  });
};

module.exports = {
  earliestDeadlineFirst,
  priorityScheduling,
  shortestJobFirst,
  smartScheduling
}; 