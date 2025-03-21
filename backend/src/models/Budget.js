const mongoose = require('mongoose');

const BudgetItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  cost: {
    type: Number,
    required: true
  },
  value: {
    type: Number,
    required: true  // Importance/value metric (1-10)
  },
  category: {
    type: String
  },
  isSelected: {
    type: Boolean,
    default: false
  }
});

const BudgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  totalAmount: {
    type: Number,
    required: true
  },
  items: [BudgetItemSchema],
  optimizedItems: [BudgetItemSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Budget', BudgetSchema); 