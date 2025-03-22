/**
 * Job Scheduling Algorithms for Task Management
 * Implements various scheduling algorithms including:
 * 1. Earliest Deadline First (EDF)
 * 2. Priority-based Scheduling
 * 3. Shortest Job First (SJF)
 * 4. Smart Scheduling (weighted combination)
 */

/**
 * Helper function to safely convert a value to date
 * @param {any} value - Value to convert to date
 * @returns {Date|null} - Valid Date object or null if invalid
 */
const safeDate = (value) => {
  if (!value) return null;
  
  try {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  } catch (e) {
    return null;
  }
};

/**
 * Helper function to safely get a numeric value
 * @param {any} value - Value to convert to number
 * @param {number} defaultValue - Default value if conversion fails
 * @returns {number} - Valid number or default value
 */
const safeNumber = (value, defaultValue = 0) => {
  if (value === undefined || value === null) return defaultValue;
  
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

/**
 * Earliest Deadline First (EDF) algorithm
 * @param {Array} tasks - Array of task objects
 * @returns {Array} Sorted array of tasks
 */
const earliestDeadlineFirst = (tasks) => {
  // Clone tasks to avoid modifying the original array
  const validTasks = tasks.filter(task => safeDate(task.deadline) !== null);
  
  // Sort by deadline (ascending)
  return [...validTasks].sort((a, b) => 
    safeDate(a.deadline).getTime() - safeDate(b.deadline).getTime()
  );
};

/**
 * Priority-based Scheduling
 * @param {Array} tasks - Array of task objects
 * @returns {Array} Sorted array of tasks
 */
const priorityScheduling = (tasks) => {
  // Clone tasks to avoid modifying the original array
  const validTasks = tasks.filter(task => 
    typeof task.priority === 'number' && !isNaN(task.priority)
  );
  
  // Sort by priority (ascending, where 1 is highest priority)
  return [...validTasks].sort((a, b) => a.priority - b.priority);
};

/**
 * Shortest Job First (SJF) algorithm
 * @param {Array} tasks - Array of task objects
 * @returns {Array} Sorted array of tasks
 */
const shortestJobFirst = (tasks) => {
  // Clone tasks to avoid modifying the original array
  const validTasks = tasks.filter(task => 
    typeof task.estimatedDuration === 'number' && 
    !isNaN(task.estimatedDuration) && 
    task.estimatedDuration > 0
  );
  
  // Sort by estimated duration (ascending)
  return [...validTasks].sort((a, b) => a.estimatedDuration - b.estimatedDuration);
};

/**
 * Job Scheduling Algorithms for Task Management
 * Implements a simple, robust scheduling algorithm
 */

/**
 * Simple and robust smart scheduling algorithm
 * @param {Array} tasks - Array of task objects
 * @param {Object} weights - Priority weights (not used in this simplified version)
 * @returns {Array} Array of tasks with scheduled times
 */
const smartScheduling = (tasks) => {
  console.log(`Starting scheduling with ${tasks ? tasks.length : 0} tasks`);
  
  // Early return for invalid input
  if (!Array.isArray(tasks) || tasks.length === 0) {
    console.log('No tasks to schedule');
    return [];
  }

  // Start with a clean array of valid tasks
  const validTasks = [];
  
  // Filter and simplify tasks to avoid MongoDB document issues
  for (const task of tasks) {
    try {
      // Basic task info
      const id = task._id ? task._id.toString() : null;
      const title = task.title || 'Untitled Task';
      const duration = Number(task.estimatedDuration) || 30; // Default 30 minutes
      
      // Skip tasks without ID
      if (!id) {
        console.log(`Skipping task without ID: ${title}`);
        continue;
      }
      
      // Create a simplified task object with only what we need
      validTasks.push({
        _id: id,
        title: title,
        estimatedDuration: duration,
        priority: Number(task.priority) || 3
      });
    } catch (error) {
      console.error('Error processing task:', error);
      // Skip problematic tasks
    }
  }
  
  console.log(`Found ${validTasks.length} valid tasks to schedule`);
  
  // Sort tasks by priority (ascending, where 1 is highest)
  validTasks.sort((a, b) => a.priority - b.priority);
  
  // Start scheduling at 9 AM today
  let currentDate = new Date();
  currentDate.setHours(9, 0, 0, 0);
  
  // If it's already past 5 PM, start tomorrow
  if (currentDate.getHours() >= 17) {
    currentDate.setDate(currentDate.getDate() + 1);
    currentDate.setHours(9, 0, 0, 0);
  }
  
  console.log(`Starting scheduling at ${currentDate.toISOString()}`);
  
  // Schedule each task sequentially
  const scheduledTasks = [];
  
  for (const task of validTasks) {
    try {
      // Create explicit new Date objects for start time
      const startTime = new Date(currentDate);
      
      // Calculate end time (add duration in milliseconds)
      const durationMs = (task.estimatedDuration || 30) * 60 * 1000;
      const endTime = new Date(startTime.getTime() + durationMs);
      
      // Advance current time to next slot (after this task plus a 15-minute break)
      currentDate = new Date(endTime.getTime() + 15 * 60 * 1000);
      
      // If we're past 5 PM, move to next day at 9 AM
      if (currentDate.getHours() >= 17) {
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(9, 0, 0, 0);
      }
      
      // Add the scheduled task with explicit string conversion for MongoDB
      scheduledTasks.push({
        _id: task._id,
        title: task.title,
        scheduledStart: startTime,
        scheduledEnd: endTime,
        estimatedDuration: task.estimatedDuration
      });
      
      console.log(`Scheduled task "${task.title}" from ${startTime.toISOString()} to ${endTime.toISOString()}`);
    } catch (error) {
      console.error(`Error scheduling task ${task.title}:`, error);
      // Skip tasks that cause errors
    }
  }
  
  console.log(`Successfully scheduled ${scheduledTasks.length} tasks`);
  return scheduledTasks;
};

module.exports = {
  earliestDeadlineFirst,
  priorityScheduling,
  shortestJobFirst,
  smartScheduling
}; 