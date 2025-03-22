const { validationResult } = require('express-validator');
const Task = require('../models/Task');
const { smartScheduling } = require('../utils/algorithms/jobScheduling');

/**
 * @desc Get all tasks for logged in user
 * @route GET /api/tasks
 * @access Private
 */
const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc Get single task by ID
 * @route GET /api/tasks/:id
 * @access Private
 */
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    // Check if task exists
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if task belongs to user
    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Get task by ID error:', error.message);
    
    // Check if error is due to invalid ID format
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc Get all scheduled tasks for logged in user
 * @route GET /api/tasks/scheduled
 * @access Private
 */
const getScheduledTasks = async (req, res) => {
  try {
    console.log('Fetching scheduled tasks for user:', req.user.id);
    
    // Get all tasks with any form of scheduledTime
    const scheduledTasks = await Task.find({ 
      user: req.user.id,
      $or: [
        // Check for string scheduledTime (legacy format)
        { scheduledTime: { $exists: true, $ne: null } },
        // Check for object scheduledTime with start field
        { 'scheduledTime.start': { $exists: true, $ne: null } }
      ]
    }).sort({ 
      // MongoDB doesn't support $or in sort - use a single field
      'scheduledTime.start': 1
    });
    
    console.log(`Found ${scheduledTasks.length} scheduled tasks`);
    
    // Format the response to ensure consistent data structure
    const formattedTasks = scheduledTasks.map(task => {
      const taskObj = task.toObject();
      
      // If task has string scheduledTime, convert to object format
      if (taskObj.scheduledTime && typeof taskObj.scheduledTime === 'string') {
        const startTime = new Date(taskObj.scheduledTime);
        const endTime = new Date(startTime.getTime() + (taskObj.estimatedDuration * 60 * 1000));
        
        taskObj.scheduledTime = {
          start: startTime,
          end: endTime
        };
      }
      
      return taskObj;
    });
    
    res.json(formattedTasks);
  } catch (error) {
    console.error('Get scheduled tasks error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc Get all scheduled tasks for today for logged in user
 * @route GET /api/tasks/scheduled/today
 * @access Private
 */
const getTodayScheduledTasks = async (req, res) => {
  try {
    // Calculate the start and end of today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    console.log(`Looking for tasks scheduled between ${today.toISOString()} and ${tomorrow.toISOString()}`);
    
    // Get scheduled tasks for today - using improved query
    const todayScheduledTasks = await Task.find({ 
      user: req.user.id,
      $or: [
        // Check for string scheduledTime format (legacy)
        {
          scheduledTime: { 
            $gte: today, 
            $lt: tomorrow 
          }
        },
        // Check for object scheduledTime format with start field
        {
          'scheduledTime.start': { 
            $gte: today, 
            $lt: tomorrow 
          }
        }
      ]
    }).sort({ 'scheduledTime.start': 1 });
    
    console.log(`Found ${todayScheduledTasks.length} tasks scheduled for today`);
    
    res.json(todayScheduledTasks);
  } catch (error) {
    console.error('Get today scheduled tasks error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc Create a new task
 * @route POST /api/tasks
 * @access Private
 */
const createTask = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    title,
    description,
    priority,
    deadline,
    estimatedDuration,
    tags
  } = req.body;

  try {
    // Create new task
    const newTask = new Task({
      user: req.user.id,
      title,
      description,
      priority: priority || 3,
      deadline,
      estimatedDuration,
      tags
    });
    
    // Save task to database
    const task = await newTask.save();
    
    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc Update a task
 * @route PUT /api/tasks/:id
 * @access Private
 */
const updateTask = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    title,
    description,
    priority,
    deadline,
    estimatedDuration,
    status,
    tags
  } = req.body;

  // Build task update object
  const taskFields = {};
  if (title) taskFields.title = title;
  if (description !== undefined) taskFields.description = description;
  if (priority) taskFields.priority = priority;
  if (deadline) taskFields.deadline = deadline;
  if (estimatedDuration) taskFields.estimatedDuration = estimatedDuration;
  if (status) taskFields.status = status;
  if (tags) taskFields.tags = tags;

  try {
    let task = await Task.findById(req.params.id);
    
    // Check if task exists
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if task belongs to user
    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Update task
    task = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: taskFields },
      { new: true }
    );
    
    res.json(task);
  } catch (error) {
    console.error('Update task error:', error.message);
    
    // Check if error is due to invalid ID format
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc Delete a task
 * @route DELETE /api/tasks/:id
 * @access Private
 */
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    // Check if task exists
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if task belongs to user
    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Remove task
    await task.deleteOne();
    
    res.json({ message: 'Task removed' });
  } catch (error) {
    console.error('Delete task error:', error.message);
    
    // Check if error is due to invalid ID format
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc Schedule tasks using smart algorithm
 * @route POST /api/tasks/schedule
 * @access Private
 */
const scheduleTasks = async (req, res) => {
  console.log('=== Begin Task Scheduling ===');
  
  try {
    // Get pending and in-progress tasks for user
    const tasks = await Task.find({ 
      user: req.user.id,
      status: { $in: ['pending', 'in-progress'] }
    });
    
    if (!tasks || tasks.length === 0) {
      console.log('No tasks found to schedule');
      return res.json({ message: 'No tasks to schedule', scheduledTasks: [] });
    }
    
    console.log(`Found ${tasks.length} tasks to schedule`);
    
    // Apply scheduling algorithm
    let scheduledTasks;
    try {
      scheduledTasks = smartScheduling(tasks);
      console.log(`Algorithm returned ${scheduledTasks ? scheduledTasks.length : 0} scheduled tasks`);
    } catch (algorithmError) {
      console.error('Algorithm error:', algorithmError);
      return res.status(500).json({ 
        message: 'Error running scheduling algorithm', 
        error: algorithmError.message
      });
    }
    
    if (!scheduledTasks || scheduledTasks.length === 0) {
      console.log('No tasks were scheduled');
      return res.json({ 
        message: 'No tasks could be scheduled',
        scheduledTasks: []
      });
    }
    
    // Update tasks in database with scheduled times
    const updatedTasks = [];
    const errors = [];
    
    for (const task of scheduledTasks) {
      try {
        if (!task._id) {
          console.error('Task has no ID:', task);
          continue;
        }
        
        console.log(`Saving task ${task._id} scheduled times`);
        
        // Update the task in database
        const updatedTask = await Task.findByIdAndUpdate(
          task._id,
          {
            scheduledTime: new Date(task.scheduledStart),
            scheduledStart: new Date(task.scheduledStart),
            scheduledEnd: new Date(task.scheduledEnd)
          },
          { new: true }
        );
        
        if (updatedTask) {
          console.log(`Successfully scheduled task ${task._id}`);
          updatedTasks.push(updatedTask);
        } else {
          console.log(`Could not find task with ID ${task._id}`);
        }
      } catch (err) {
        console.error(`Error updating task ${task._id}:`, err);
        errors.push({
          taskId: task._id,
          error: err.message
        });
      }
    }
    
    console.log(`Successfully scheduled ${updatedTasks.length} tasks`);
    console.log('=== End Task Scheduling ===');
    
    return res.json({ 
      message: `Scheduled ${updatedTasks.length} tasks successfully`, 
      scheduledTasks: updatedTasks,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Schedule tasks error:', error);
    console.log('=== End Task Scheduling (with error) ===');
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc Schedule a specific task
 * @route PUT /api/tasks/:id/schedule
 * @access Private
 */
const scheduleTask = async (req, res) => {
  try {
    const { scheduledTime } = req.body;
    
    // Validate input
    if (!scheduledTime) {
      return res.status(400).json({ message: 'Scheduled time is required' });
    }
    
    console.log('Scheduling task with time:', scheduledTime);
    
    // Find task
    const task = await Task.findById(req.params.id);
    
    // Check if task exists
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if task belongs to user
    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Parse scheduled time - handle both string and object format
    let scheduledStartTime;
    let scheduledEndTime;

    try {
      if (typeof scheduledTime === 'string' || scheduledTime instanceof Date) {
        // Handle string or Date object format
        scheduledStartTime = new Date(scheduledTime);
        
        // Calculate end time based on estimated duration
        const estimatedDuration = task.estimatedDuration || 60; // Default to 1 hour if not set
        scheduledEndTime = new Date(scheduledStartTime.getTime() + (estimatedDuration * 60 * 1000));
      } 
      else if (typeof scheduledTime === 'object' && scheduledTime !== null) {
        // Handle object format with start/end properties
        if (scheduledTime.start) {
          scheduledStartTime = new Date(scheduledTime.start);
          
          if (scheduledTime.end) {
            scheduledEndTime = new Date(scheduledTime.end);
          } else {
            // Calculate end time if not provided
            const estimatedDuration = task.estimatedDuration || 60;
            scheduledEndTime = new Date(scheduledStartTime.getTime() + (estimatedDuration * 60 * 1000));
          }
        } else {
          return res.status(400).json({ message: 'Invalid scheduled time format: Missing start time' });
        }
      } 
      else {
        return res.status(400).json({ message: 'Invalid scheduled time format' });
      }
    } catch (parseError) {
      console.error('Error parsing scheduled time:', parseError);
      return res.status(400).json({ message: `Invalid date format: ${parseError.message}` });
    }
    
    // Check if dates are valid
    if (isNaN(scheduledStartTime.getTime()) || isNaN(scheduledEndTime.getTime())) {
      return res.status(400).json({ message: 'Invalid scheduled time: Time is not a valid date' });
    }
    
    console.log(`Scheduling task ${task._id} from ${scheduledStartTime.toISOString()} to ${scheduledEndTime.toISOString()}`);
    
    // Create the scheduledTime object with the new format
    const newScheduledTime = {
      start: scheduledStartTime,
      end: scheduledEndTime
    };
    
    // Update task with scheduled time
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { 
        scheduledTime: newScheduledTime,
        scheduled: true
      },
      { new: true }
    );
    
    res.json({ message: 'Task scheduled successfully', task: updatedTask });
  } catch (error) {
    console.error('Schedule task error:', error.message);
    
    // Check if error is due to invalid ID format
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc Unschedule a task
 * @route PUT /api/tasks/:id/unschedule
 * @access Private
 */
const unscheduleTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    // Check if task exists
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if task belongs to user
    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Check if task is scheduled
    if (!task.scheduledTime) {
      return res.status(400).json({ message: 'Task is not scheduled' });
    }
    
    // Update task to remove scheduling information
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { 
        $unset: { 
          scheduledTime: 1,
          scheduledStart: 1,
          scheduledEnd: 1
        } 
      },
      { new: true }
    );
    
    res.json({ message: 'Task unscheduled successfully', task: updatedTask });
  } catch (error) {
    console.error('Unschedule task error:', error.message);
    
    // Check if error is due to invalid ID format
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc Get task statistics for logged in user
 * @route GET /api/tasks/stats
 * @access Private
 */
const getTaskStats = async (req, res) => {
  try {
    // Get total count of tasks
    const totalTasks = await Task.countDocuments({ user: req.user.id });
    
    // Get count of tasks by status
    const pendingTasks = await Task.countDocuments({ 
      user: req.user.id,
      status: 'pending'
    });
    
    const inProgressTasks = await Task.countDocuments({ 
      user: req.user.id,
      status: 'in-progress'
    });
    
    const completedTasks = await Task.countDocuments({ 
      user: req.user.id,
      status: 'completed'
    });
    
    // Get count of tasks by priority
    const highPriorityTasks = await Task.countDocuments({
      user: req.user.id,
      priority: 1
    });
    
    const mediumPriorityTasks = await Task.countDocuments({
      user: req.user.id,
      priority: 2
    });
    
    const lowPriorityTasks = await Task.countDocuments({
      user: req.user.id,
      priority: 3
    });
    
    // Get count of scheduled tasks
    const scheduledTasks = await Task.countDocuments({
      user: req.user.id,
      scheduledTime: { $exists: true, $ne: null }
    });
    
    // Get count of today's scheduled tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayScheduledTasks = await Task.countDocuments({
      user: req.user.id,
      scheduledTime: { $gte: today, $lt: tomorrow }
    });
    
    // Get count of overdue tasks
    const overdueTasks = await Task.countDocuments({
      user: req.user.id,
      deadline: { $lt: new Date() },
      status: { $ne: 'completed' }
    });
    
    // Get tasks due in the next 7 days
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    const tasksDueThisWeek = await Task.countDocuments({
      user: req.user.id,
      deadline: { $gte: today, $lte: nextWeek },
      status: { $ne: 'completed' }
    });
    
    // Calculate completion rate
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    // Calculate average task duration for completed tasks
    const completedTasksData = await Task.find({
      user: req.user.id,
      status: 'completed'
    });
    
    let totalDuration = 0;
    completedTasksData.forEach(task => {
      totalDuration += task.estimatedDuration || 0;
    });
    
    const averageDuration = completedTasksData.length > 0 ? totalDuration / completedTasksData.length : 0;
    
    // Return statistics
    res.json({
      totalTasks,
      byStatus: {
        pending: pendingTasks,
        inProgress: inProgressTasks,
        completed: completedTasks
      },
      byPriority: {
        high: highPriorityTasks,
        medium: mediumPriorityTasks,
        low: lowPriorityTasks
      },
      scheduledTasks,
      todayScheduledTasks,
      overdueTasks,
      tasksDueThisWeek,
      completionRate: completionRate.toFixed(2),
      averageDuration: Math.round(averageDuration)
    });
  } catch (error) {
    console.error('Get task stats error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc Find available time slots for scheduling tasks
 * @route GET /api/tasks/available-slots
 * @access Private
 */
const getAvailableTimeSlots = async (req, res) => {
  try {
    // Get date parameters or use today
    const { date, duration } = req.query;
    
    // Convert duration to minutes if provided, default to 60
    const requiredDuration = parseInt(duration) || 60;
    
    // Parse date or use today
    const targetDate = date ? new Date(date) : new Date();
    
    // Set time to midnight for the target date
    targetDate.setHours(0, 0, 0, 0);
    
    // Create end date (midnight of the next day)
    const endDate = new Date(targetDate);
    endDate.setDate(endDate.getDate() + 1);
    
    // Get all scheduled tasks for the user on the target date
    const scheduledTasks = await Task.find({
      user: req.user.id,
      scheduledTime: { 
        $gte: targetDate,
        $lt: endDate
      }
    }).sort({ scheduledTime: 1 });
    
    // Define business hours (9 AM to 5 PM)
    const businessStart = new Date(targetDate);
    businessStart.setHours(9, 0, 0, 0);
    
    const businessEnd = new Date(targetDate);
    businessEnd.setHours(17, 0, 0, 0);
    
    // Initialize available slots array
    const availableSlots = [];
    
    // If no scheduled tasks, return the entire business day
    if (scheduledTasks.length === 0) {
      availableSlots.push({
        start: businessStart,
        end: businessEnd,
        durationMinutes: (businessEnd - businessStart) / (60 * 1000)
      });
      
      return res.json({ 
        date: targetDate,
        availableSlots 
      });
    }
    
    // Find gaps between scheduled tasks
    let currentTime = new Date(businessStart);
    
    // Check if there's a gap between business start and first task
    if (scheduledTasks[0].scheduledTime > businessStart) {
      availableSlots.push({
        start: businessStart,
        end: scheduledTasks[0].scheduledTime,
        durationMinutes: (scheduledTasks[0].scheduledTime - businessStart) / (60 * 1000)
      });
    }
    
    // Check gaps between tasks
    for (let i = 0; i < scheduledTasks.length - 1; i++) {
      const currentTask = scheduledTasks[i];
      const nextTask = scheduledTasks[i + 1];
      
      // Calculate current task end time
      const currentTaskEnd = new Date(currentTask.scheduledTime);
      currentTaskEnd.setMinutes(
        currentTaskEnd.getMinutes() + (currentTask.estimatedDuration || 0)
      );
      
      // If there's a gap between current task end and next task start
      if (nextTask.scheduledTime > currentTaskEnd) {
        availableSlots.push({
          start: currentTaskEnd,
          end: nextTask.scheduledTime,
          durationMinutes: (nextTask.scheduledTime - currentTaskEnd) / (60 * 1000)
        });
      }
    }
    
    // Check if there's a gap between last task and business end
    const lastTask = scheduledTasks[scheduledTasks.length - 1];
    const lastTaskEnd = new Date(lastTask.scheduledTime);
    lastTaskEnd.setMinutes(
      lastTaskEnd.getMinutes() + (lastTask.estimatedDuration || 0)
    );
    
    if (lastTaskEnd < businessEnd) {
      availableSlots.push({
        start: lastTaskEnd,
        end: businessEnd,
        durationMinutes: (businessEnd - lastTaskEnd) / (60 * 1000)
      });
    }
    
    // Filter slots that can accommodate the required duration
    const suitableSlots = availableSlots.filter(
      slot => slot.durationMinutes >= requiredDuration
    );
    
    res.json({
      date: targetDate,
      requiredDuration,
      availableSlots: suitableSlots
    });
  } catch (error) {
    console.error('Get available time slots error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc Check task data integrity and provide diagnostic information
 * @route GET /api/tasks/diagnostics
 * @access Private
 */
const getTaskDiagnostics = async (req, res) => {
  try {
    // Get all tasks for user
    const tasks = await Task.find({ user: req.user.id });
    
    if (tasks.length === 0) {
      return res.json({ 
        message: 'No tasks found for diagnostic',
        tasksCount: 0,
        issues: []
      });
    }
    
    // Initialize diagnostic results
    const diagnostics = {
      tasksCount: tasks.length,
      tasksWithInvalidDeadline: 0,
      tasksWithInvalidDuration: 0,
      tasksWithInvalidScheduledTime: 0,
      issues: []
    };
    
    // Check each task for potential issues
    tasks.forEach(task => {
      const issues = [];
      
      // Check deadline
      const deadline = new Date(task.deadline);
      if (isNaN(deadline.getTime())) {
        diagnostics.tasksWithInvalidDeadline++;
        issues.push('Invalid deadline date');
      }
      
      // Check estimated duration
      if (typeof task.estimatedDuration !== 'number' || 
          isNaN(task.estimatedDuration) || 
          task.estimatedDuration <= 0) {
        diagnostics.tasksWithInvalidDuration++;
        issues.push('Invalid estimated duration');
      }
      
      // Check scheduled time if it exists
      if (task.scheduledTime) {
        const scheduledTime = new Date(task.scheduledTime);
        if (isNaN(scheduledTime.getTime())) {
          diagnostics.tasksWithInvalidScheduledTime++;
          issues.push('Invalid scheduled time');
        }
      }
      
      // Check scheduled start if it exists
      if (task.scheduledStart) {
        const scheduledStart = new Date(task.scheduledStart);
        if (isNaN(scheduledStart.getTime())) {
          issues.push('Invalid scheduled start time');
        }
      }
      
      // Check scheduled end if it exists
      if (task.scheduledEnd) {
        const scheduledEnd = new Date(task.scheduledEnd);
        if (isNaN(scheduledEnd.getTime())) {
          issues.push('Invalid scheduled end time');
        }
      }
      
      // If issues were found, add to the list
      if (issues.length > 0) {
        diagnostics.issues.push({
          taskId: task._id,
          title: task.title,
          issues: issues
        });
      }
    });
    
    // Add summary
    diagnostics.summary = {
      healthy: diagnostics.issues.length === 0,
      message: diagnostics.issues.length === 0 
        ? 'All tasks appear to be healthy' 
        : `Found ${diagnostics.issues.length} tasks with issues`
    };
    
    res.json(diagnostics);
  } catch (error) {
    console.error('Task diagnostics error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc Update task status
 * @route PATCH /api/tasks/:id/status
 * @access Private
 */
const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status
    if (!status || !['pending', 'in-progress', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    // Find task by ID
    let task = await Task.findById(req.params.id);
    
    // Check if task exists
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if task belongs to user
    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Update task status
    task.status = status;
    
    // If marking as completed, set completed flag and completedAt timestamp
    if (status === 'completed') {
      task.completed = true;
      task.completedAt = new Date();
    } else {
      // Reset completed flag if un-completing task
      task.completed = false;
      task.completedAt = null;
    }
    
    // Save updated task
    await task.save();
    
    res.json(task);
  } catch (error) {
    console.error('Update task status error:', error.message);
    
    // Check if error is due to invalid ID format
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getTasks,
  getTaskById,
  getScheduledTasks,
  getTodayScheduledTasks,
  createTask,
  updateTask,
  deleteTask,
  scheduleTasks,
  scheduleTask,
  unscheduleTask,
  getTaskStats,
  getAvailableTimeSlots,
  getTaskDiagnostics,
  updateTaskStatus
}; 