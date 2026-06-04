const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  visitor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  purpose: {
    type: String,
    required: [true, 'Please add a purpose of visit'],
    trim: true
  },
  scheduledTime: {
    type: Date,
    required: [true, 'Please select a date and time for the visit']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'declined', 'expired'],
    default: 'pending'
  },
  location: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
