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
  
  // Customer Information
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerPhone: {
    type: String,
    trim: true,
    default: null
  },
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: null
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
  
  // Order Status
  orderStatus: {
    type: String, 
    enum: ['pending', 'preparing', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  // Payment Information
 paymentMethod: {
  type: String,
  enum: ['upi', 'cash', 'card', 'upi_counter', 'pending', 'not_initiated'],
  default: 'pending'
},
  paymentStatus: {
    type: String, 
    enum: ['pending', 'paid', 'failed', 'refunded', 'not_initiated'],
    default: 'pending'
  },
  razorpayPaymentId: {
    type: String,
    default: null
  },
  razorpayOrderId: {
    type: String,
    default: null
  },
  paymentCompletedAt: {
    type: Date,
    default: null
  },
  
  nextRollNumber: {
    type: Number,
    default: 1
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
orderSchema.index({ customerPhone: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ orderStatus: 1 });

orderSchema.pre('save', function() {
  this.updatedAt = new Date();
});

module.exports = mongoose.model("Order", orderSchema);