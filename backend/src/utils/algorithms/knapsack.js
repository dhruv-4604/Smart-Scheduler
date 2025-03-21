/**
 * 0/1 Knapsack Algorithm for Budget Optimization
 * This algorithm helps find the optimal set of items to include in a budget
 * with a limited amount of money to maximize the value.
 */

/**
 * Solves the 0/1 knapsack problem using dynamic programming
 * @param {Array} items - Array of items with cost and value properties
 * @param {Number} totalBudget - Maximum budget amount
 * @returns {Object} Object containing selected items and total values
 */
const knapsackOptimizer = (items, totalBudget) => {
  // Handle edge cases
  if (!items || items.length === 0 || totalBudget <= 0) {
    return {
      selectedItems: [],
      totalCost: 0,
      totalValue: 0
    };
  }

  // Convert budget to integer (multiply by 100 to handle decimals)
  const budget = Math.floor(totalBudget * 100);
  
  // Create a 2D array for dynamic programming
  // dp[i][w] represents the maximum value that can be obtained with weight less than or equal to w
  // considering first i items
  const dp = Array(items.length + 1)
    .fill()
    .map(() => Array(budget + 1).fill(0));
  
  // Fill the dp table
  for (let i = 1; i <= items.length; i++) {
    for (let w = 0; w <= budget; w++) {
      // Get current item (adjust for 0-based indexing)
      const item = items[i - 1];
      // Convert cost to integer (multiply by 100 to handle decimals)
      const itemCost = Math.floor(item.cost * 100);
      
      if (itemCost <= w) {
        // Max of (including current item, excluding current item)
        dp[i][w] = Math.max(
          item.value + dp[i - 1][w - itemCost],
          dp[i - 1][w]
        );
      } else {
        // Item cost exceeds current budget, so exclude it
        dp[i][w] = dp[i - 1][w];
      }
    }
  }
  
  // Backtrack to find which items are included
  const selectedItems = [];
  let totalCost = 0;
  let w = budget;
  
  for (let i = items.length; i > 0; i--) {
    // If the value came from including this item
    if (dp[i][w] !== dp[i - 1][w]) {
      const item = items[i - 1];
      // Mark this item as selected
      selectedItems.push({...item, isSelected: true});
      
      // Update total cost
      totalCost += item.cost;
      
      // Reduce the remaining budget
      w -= Math.floor(item.cost * 100);
    }
  }
  
  // Return the result
  return {
    selectedItems,
    totalCost,
    totalValue: dp[items.length][budget]
  };
};

/**
 * Enhanced knapsack with category constraints
 * @param {Array} items - Array of items with cost, value and category properties
 * @param {Number} totalBudget - Maximum budget amount
 * @param {Object} constraints - Category constraints (e.g., {food: 0.3} means max 30% for food)
 * @returns {Object} Object containing selected items and total values
 */
const constrainedKnapsack = (items, totalBudget, constraints = {}) => {
  // First pass: basic knapsack
  const result = knapsackOptimizer(items, totalBudget);
  
  // If no constraints or no items selected, return basic result
  if (Object.keys(constraints).length === 0 || result.selectedItems.length === 0) {
    return result;
  }
  
  // Check if constraints are satisfied
  const categoryTotals = {};
  for (const item of result.selectedItems) {
    if (item.category) {
      categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.cost;
    }
  }
  
  let constraintsSatisfied = true;
  for (const category in constraints) {
    const maxAllowed = totalBudget * constraints[category];
    if ((categoryTotals[category] || 0) > maxAllowed) {
      constraintsSatisfied = false;
      break;
    }
  }
  
  // If constraints are satisfied, return the result
  if (constraintsSatisfied) {
    return result;
  }
  
  // Otherwise, apply a greedy approach with constraints
  const selectedItems = [];
  let remainingBudget = totalBudget;
  const categorySpent = {};
  
  // Sort items by value-to-cost ratio (descending)
  const sortedItems = [...items].sort((a, b) => (b.value / b.cost) - (a.value / a.cost));
  
  for (const item of sortedItems) {
    // Check if adding this item would violate constraints
    if (item.category && constraints[item.category]) {
      const currentCategorySpent = categorySpent[item.category] || 0;
      const maxAllowed = totalBudget * constraints[item.category];
      
      if (currentCategorySpent + item.cost > maxAllowed) {
        continue; // Skip this item
      }
    }
    
    // Check if we have enough budget
    if (item.cost <= remainingBudget) {
      selectedItems.push({...item, isSelected: true});
      remainingBudget -= item.cost;
      
      // Update category spent
      if (item.category) {
        categorySpent[item.category] = (categorySpent[item.category] || 0) + item.cost;
      }
    }
  }
  
  // Calculate total value
  const totalValue = selectedItems.reduce((sum, item) => sum + item.value, 0);
  
  return {
    selectedItems,
    totalCost: totalBudget - remainingBudget,
    totalValue
  };
};

module.exports = {
  knapsackOptimizer,
  constrainedKnapsack
}; 