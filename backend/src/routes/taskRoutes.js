const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const taskController = require('../controllers/taskController');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// Test route - no auth needed for testing
router.get('/test', (req, res) => {
  res.json({ message: 'Task API is working' });
});

// Get all tasks for logged in user
router.get('/', taskController.getTasks);

// Get task statistics
router.get('/stats', taskController.getTaskStats);

// Get task data integrity diagnostics
router.get('/diagnostics', taskController.getTaskDiagnostics);

// Get all scheduled tasks
router.get('/scheduled', taskController.getScheduledTasks);

// Get tasks scheduled for today
router.get('/scheduled/today', taskController.getTodayScheduledTasks);

// Add an alias for the same endpoint without "scheduled/" prefix
// For compatibility with dashboard component
router.get('/today', taskController.getTodayScheduledTasks);

// Find available time slots for scheduling
router.get('/available-slots', taskController.getAvailableTimeSlots);

// Schedule tasks using algorithm
router.post('/schedule', taskController.scheduleTasks);

// Create a task
router.post(
  '/',
  [
    check('title', 'Title is required').not().isEmpty(),
    check('deadline', 'Deadline is required').not().isEmpty(),
    check('estimatedDuration', 'Estimated duration is required').isNumeric()
  ],
  taskController.createTask
);

// Unschedule a task
router.put('/:id/unschedule', taskController.unscheduleTask);

// Schedule a specific task
router.put('/:id/schedule', [
  check('scheduledTime', 'Scheduled time is required').not().isEmpty()
], taskController.scheduleTask);

// Update task status
router.patch('/:id/status', [
  check('status', 'Status is required').not().isEmpty(),
  check('status', 'Status must be valid').isIn(['pending', 'in-progress', 'completed'])
], taskController.updateTaskStatus);

// Get task by ID
router.get('/:id', taskController.getTaskById);

// Update a task
router.put(
  '/:id',
  [
    check('title', 'Title is required').optional().not().isEmpty(),
    check('deadline', 'Deadline must be a valid date').optional(),
    check('estimatedDuration', 'Estimated duration must be a number').optional().isNumeric(),
    check('priority', 'Priority must be between 1 and 3').optional().isInt({ min: 1, max: 3 }),
    check('status', 'Status must be valid').optional().isIn(['pending', 'in-progress', 'completed'])
  ],
  taskController.updateTask
);

// Delete a task
router.delete('/:id', taskController.deleteTask);

module.exports = router; 