const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// @route   GET /api/budgets
// @desc    Get all budgets
// @access  Private
router.get('/', budgetController.getBudgets);

// @route   GET /api/budgets/:id
// @desc    Get budget by ID
// @access  Private
router.get('/:id', budgetController.getBudgetById);

// @route   POST /api/budgets
// @desc    Create a budget
// @access  Private
router.post(
  '/',
  [
    check('title', 'Title is required').not().isEmpty(),
    check('totalAmount', 'Total amount is required').isNumeric()
  ],
  budgetController.createBudget
);

// @route   PUT /api/budgets/:id
// @desc    Update a budget
// @access  Private
router.put(
  '/:id',
  [
    check('title', 'Title is required').optional().not().isEmpty(),
    check('totalAmount', 'Total amount must be a number').optional().isNumeric()
  ],
  budgetController.updateBudget
);

// @route   DELETE /api/budgets/:id
// @desc    Delete a budget
// @access  Private
router.delete('/:id', budgetController.deleteBudget);

// @route   POST /api/budgets/:id/items
// @desc    Add item to budget
// @access  Private
router.post(
  '/:id/items',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('cost', 'Cost is required and must be a number').isNumeric(),
    check('value', 'Value is required and must be a number').isNumeric()
  ],
  budgetController.addBudgetItem
);

// @route   DELETE /api/budgets/:id/items/:itemId
// @desc    Remove item from budget
// @access  Private
router.delete('/:id/items/:itemId', budgetController.removeBudgetItem);

// @route   POST /api/budgets/:id/optimize
// @desc    Optimize budget using knapsack algorithm
// @access  Private
router.post('/:id/optimize', budgetController.optimizeBudget);

module.exports = router; 