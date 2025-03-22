const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
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
  priority: {
    type: Number,
    default: 3,  // 1: High, 2: Medium, 3: Low
    min: 1,
    max: 3
  },
  deadline: {
    type: Date,
    required: true
  },
  estimatedDuration: {
    type: Number,  // in minutes
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  scheduledTime: {
    type: Date
  },
  scheduledStart: {
    type: Date
  },
  scheduledEnd: {
    type: Date
  },
  tags: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Task', TaskSchema); 