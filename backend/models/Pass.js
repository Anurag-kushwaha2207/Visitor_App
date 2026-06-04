const mongoose = require('mongoose');

const PassSchema = new mongoose.Schema({
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  passCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  qrCodePayload: {
    type: String,
    required: true
  },
  validFrom: {
    type: Date,
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'used', 'expired', 'revoked'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Pass', PassSchema);
