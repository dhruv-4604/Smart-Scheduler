const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const taskController = require('../controllers/taskController');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// @route   GET /api/tasks
// @desc    Get all tasks
// @access  Private
router.get('/', taskController.getTasks);

// @route   GET /api/tasks/:id
// @desc    Get task by ID
// @access  Private
router.get('/:id', taskController.getTaskById);

// @route   POST /api/tasks
// @desc    Create a task
// @access  Private
router.post(
  '/',
  [
    check('title', 'Title is required').not().isEmpty(),
    check('deadline', 'Deadline is required').not().isEmpty(),
    check('estimatedDuration', 'Estimated duration is required').isNumeric()
  ],
  taskController.createTask
);

// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Private
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

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', taskController.deleteTask);

// @route   POST /api/tasks/schedule
// @desc    Schedule tasks using algorithm
// @access  Private
router.post('/schedule', taskController.scheduleTasks);

module.exports = router; 