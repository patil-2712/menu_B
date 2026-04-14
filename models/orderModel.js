// models/orderModel.js
const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  itemId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Menu',
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true,
    min: 1
  },
  price: { 
    type: Number, 
    required: true,
    min: 0
  },
  total: { 
    type: Number, 
    required: true
  },
  category: {
    type: String
  },
  type: {
    type: String,
    enum: ['Veg', 'Non-Veg']
  },
  gstPercentage: { 
    type: Number, 
    default: 18 
  },
  itemStatus: { 
    type: String, 
    enum: ['pending', 'preparing', 'completed'],
    default: 'pending'
  },
  rollNumber: {
    type: Number,
    required: true
  }
});

const orderSchema = new mongoose.Schema({
  // Restaurant Information
  restaurantCode: {
    type: String,
    required: true,
    index: true
  },
  restaurantName: {
    type: String,
    required: true
  },
  restaurantSlug: {
    type: String,
    required: true,
    index: true
  },
  
  // Order Information
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  gstNumber: String,
  gstPercentage: {
    type: Number,
    default: 18
  },
  billNumber: { 
    type: Number,
    required: true 
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  tableNumber: {
    type: String,
    required: true
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
   discount: {
    type: Number,
    default: 0,
    min: 0
  },
  discountType: {
    type: String,
    enum: ['amount', 'percentage'],
    default: 'amount'
  },
  discountedTotal: {
    type: Number,
    default: function() {
      return this.total || 0;
    }
  },
  gstAmount: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  status: { 
    type: String, 
    enum: ['pending', 'preparing', 'completed', 'cancelled'],
    default: 'pending'
  },
  nextRollNumber: {
    type: Number,
    default: 1
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'cancelled'],
    default: 'pending'
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

// Compound index for restaurant-specific bill numbers
orderSchema.index({ restaurantCode: 1, billNumber: 1 }, { unique: true });

// ✅ FIXED: Update updatedAt timestamp on save
orderSchema.pre('save', function() {
  this.updatedAt = new Date();
   // ✅ Make sure next exists before calling it
});

module.exports = mongoose.model("Order", orderSchema);