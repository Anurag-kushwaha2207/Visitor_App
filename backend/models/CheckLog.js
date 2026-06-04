const mongoose = require('mongoose');

const CheckLogSchema = new mongoose.Schema({
  pass: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pass',
    required: true
  },
  visitor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  checkInTime: {
    type: Date,
    default: Date.now
  },
  checkOutTime: {
    type: Date,
    default: null
  },
  securityOfficer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['inside', 'completed'],
    default: 'inside'
  },
  location: {
    type: String,
    default: 'Main Entrance'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('CheckLog', CheckLogSchema);
