const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true
  },
  restaurantCode: {
    type: String,
    required: true,
    index: true
  },
  billNumber: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  razorpayOrderId: {
    type: String,
    sparse: true
  },
  razorpayPaymentId: {
    type: String,
    sparse: true
  },
  razorpaySignature: String,
  paymentStatus: {
    type: String,
    enum: ['created', 'attempted', 'paid', 'failed', 'pending', 'not_initiated'],  // ✅ ADD 'pending' here
    default: 'not_initiated'
  },
  paymentMethod: {
    type: String,
    enum: ['upi', 'card', 'cash', 'other'],
    default: 'other'
  },
  transactionId: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

paymentSchema.index({ orderId: 1 });
paymentSchema.index({ razorpayOrderId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);