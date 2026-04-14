const mongoose = require('mongoose');

const customerRequestSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  billNumber: {
    type: Number,
    required: true
  },
  restaurantSlug: {
    type: String,
    required: true,
    index: true
  },
  restaurantCode: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  tableNumber: {
    type: String,
    required: true
  },
  requestType: {
    type: String,
    enum: ['water', 'tissue', 'bill', 'other'],
    required: true
  },
  requestMessage: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'acknowledged', 'completed', 'cancelled'],
    default: 'pending'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  acknowledgedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  staffResponse: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
customerRequestSchema.index({ restaurantSlug: 1, status: 1, requestedAt: -1 });
customerRequestSchema.index({ orderId: 1 });
customerRequestSchema.index({ billNumber: 1 });

// CORRECTED pre-save middleware
customerRequestSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (next) next();
});

// Alternative: Use function with proper async handling
// customerRequestSchema.pre('save', async function() {
//   this.updatedAt = new Date();
// });

module.exports = mongoose.model('CustomerRequest', customerRequestSchema);