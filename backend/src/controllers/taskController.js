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
  try {
    // Get algorithm weights from request body or use defaults
    const { weights } = req.body || { weights: { deadline: 0.5, priority: 0.3, duration: 0.2 } };
    
    // Get all pending tasks for user
    const tasks = await Task.find({ 
      user: req.user.id,
      status: { $ne: 'completed' }
    });
    
    if (tasks.length === 0) {
      return res.json({ message: 'No tasks to schedule', scheduledTasks: [] });
    }
    
    // Apply scheduling algorithm
    const scheduledTasks = smartScheduling(tasks, weights);
    
    // Update tasks in database with scheduled times
    const updatePromises = scheduledTasks.map(task => 
      Task.findByIdAndUpdate(
        task._id,
        {
          scheduledStart: task.scheduledStart,
          scheduledEnd: task.scheduledEnd
        },
        { new: true }
      )
    );
    
    // Wait for all updates to complete
    const updatedTasks = await Promise.all(updatePromises);
    
    res.json({ message: 'Tasks scheduled successfully', scheduledTasks: updatedTasks });
  } catch (error) {
    console.error('Schedule tasks error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  scheduleTasks
}; 