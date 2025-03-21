const { validationResult } = require('express-validator');
const Budget = require('../models/Budget');
const { knapsackOptimizer, constrainedKnapsack } = require('../utils/algorithms/knapsack');

/**
 * @desc Get all budgets for logged in user
 * @route GET /api/budgets
 * @access Private
 */
const getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(budgets);
  } catch (error) {
    console.error('Get budgets error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc Get single budget by ID
 * @route GET /api/budgets/:id
 * @access Private
 */
const getBudgetById = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);
    
    // Check if budget exists
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    // Check if budget belongs to user
    if (budget.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    res.json(budget);
  } catch (error) {
    console.error('Get budget by ID error:', error.message);
    
    // Check if error is due to invalid ID format
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc Create a new budget
 * @route POST /api/budgets
 * @access Private
 */
const createBudget = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    title,
    description,
    totalAmount,
    items
  } = req.body;

  try {
    // Create new budget
    const newBudget = new Budget({
      user: req.user.id,
      title,
      description,
      totalAmount,
      items: items || []
    });
    
    // Save budget to database
    const budget = await newBudget.save();
    
    res.status(201).json(budget);
  } catch (error) {
    console.error('Create budget error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc Update a budget
 * @route PUT /api/budgets/:id
 * @access Private
 */
const updateBudget = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    title,
    description,
    totalAmount,
    items
  } = req.body;

  // Build budget update object
  const budgetFields = {};
  if (title) budgetFields.title = title;
  if (description !== undefined) budgetFields.description = description;
  if (totalAmount) budgetFields.totalAmount = totalAmount;
  if (items) budgetFields.items = items;

  try {
    let budget = await Budget.findById(req.params.id);
    
    // Check if budget exists
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    // Check if budget belongs to user
    if (budget.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Update budget
    budget = await Budget.findByIdAndUpdate(
      req.params.id,
      { $set: budgetFields },
      { new: true }
    );
    
    res.json(budget);
  } catch (error) {
    console.error('Update budget error:', error.message);
    
    // Check if error is due to invalid ID format
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc Delete a budget
 * @route DELETE /api/budgets/:id
 * @access Private
 */
const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);
    
    // Check if budget exists
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    // Check if budget belongs to user
    if (budget.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Remove budget
    await budget.deleteOne();
    
    res.json({ message: 'Budget removed' });
  } catch (error) {
    console.error('Delete budget error:', error.message);
    
    // Check if error is due to invalid ID format
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc Add item to budget
 * @route POST /api/budgets/:id/items
 * @access Private
 */
const addBudgetItem = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    name,
    cost,
    value,
    category
  } = req.body;

  try {
    const budget = await Budget.findById(req.params.id);
    
    // Check if budget exists
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    // Check if budget belongs to user
    if (budget.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Create new item
    const newItem = {
      name,
      cost,
      value,
      category,
      isSelected: false
    };
    
    // Add to items array
    budget.items.push(newItem);
    
    // Save to database
    await budget.save();
    
    res.json(budget);
  } catch (error) {
    console.error('Add budget item error:', error.message);
    
    // Check if error is due to invalid ID format
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc Remove item from budget
 * @route DELETE /api/budgets/:id/items/:itemId
 * @access Private
 */
const removeBudgetItem = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);
    
    // Check if budget exists
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    // Check if budget belongs to user
    if (budget.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Get remove index
    const removeIndex = budget.items.findIndex(
      item => item._id.toString() === req.params.itemId
    );
    
    if (removeIndex === -1) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    // Remove item
    budget.items.splice(removeIndex, 1);
    
    // Save to database
    await budget.save();
    
    res.json(budget);
  } catch (error) {
    console.error('Remove budget item error:', error.message);
    
    // Check if error is due to invalid ID format
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Budget or item not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc Optimize budget using knapsack algorithm
 * @route POST /api/budgets/:id/optimize
 * @access Private
 */
const optimizeBudget = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);
    
    // Check if budget exists
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    // Check if budget belongs to user
    if (budget.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Get category constraints if any
    const { constraints } = req.body || { constraints: {} };
    
    // Apply knapsack algorithm
    let result;
    
    if (Object.keys(constraints).length > 0) {
      result = constrainedKnapsack(budget.items, budget.totalAmount, constraints);
    } else {
      result = knapsackOptimizer(budget.items, budget.totalAmount);
    }
    
    // Update budget with optimized items
    budget.optimizedItems = result.selectedItems;
    
    // Save to database
    await budget.save();
    
    // Return result
    res.json({
      message: 'Budget optimized successfully',
      budget,
      optimizationDetails: {
        totalCost: result.totalCost,
        totalValue: result.totalValue,
        itemsSelected: result.selectedItems.length
      }
    });
  } catch (error) {
    console.error('Optimize budget error:', error.message);
    
    // Check if error is due to invalid ID format
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
  addBudgetItem,
  removeBudgetItem,
  optimizeBudget
}; 