const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  // Restaurant Information
  restaurantSlug: {
    type: String,
    required: true
  },
  restaurantCode: {
    type: String,
    required: true
  },
  restaurantName: {
    type: String,
    required: true
  },
  
  // Order Information
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  billNumber: {
    type: String,
    required: true
  },
  
  // Customer Information (from order)
  customerName: {
    type: String,
    default: 'Guest'
  },
  tableNumber: {
    type: String,
    default: 'Takeaway'
  },
  
  // Timestamps from order
  orderDate: {
    type: String, // Store as string for easy display
    required: true
  },
  orderTime: {
    type: String, // Store as string for easy display
    required: true
  },
  
  // Ratings (1-5 stars)
  serviceRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  foodRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  cleanlinessRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  overallRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  
  // Comments
  comments: {
    type: String,
    default: ''
  },
  
  // Feedback metadata
  submittedAt: {
    type: Date,
    default: Date.now
  },
  
  // Contact information (optional)
  customerEmail: {
    type: String,
    default: ''
  },
  customerPhone: {
    type: String,
    default: ''
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'archived'],
    default: 'pending'
  },
  
  // Response from restaurant (optional)
  restaurantResponse: {
    type: String,
    default: ''
  },
  respondedAt: {
    type: Date
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Index for efficient queries
feedbackSchema.index({ restaurantSlug: 1, submittedAt: -1 });
feedbackSchema.index({ billNumber: 1 });
feedbackSchema.index({ restaurantCode: 1 });

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;