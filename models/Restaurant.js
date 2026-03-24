const mongoose = require("mongoose");

const RestaurantSchema = new mongoose.Schema({
  restaurantCode: {
    type: String,
    required: true,
    unique: true
  },
  restaurantSlug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  restaurantName: {
    type: String,
    required: true
  },
  gstNumber: String,
  gstPercentage: {  // Add this new field
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  foodLicense: String,
  mobile: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  nearestPlace: {
    type: String,
    required: true
  },
  ownerName: String,
  ownerMobile: String,
  
  kitchenUsername: {
    type: String,
    required: true,
    unique: true
  },
  kitchenPassword: {
    type: String,
    required: true
  },
  
  billingUsername: {
    type: String,
    required: true,
    unique: true
  },
  billingPassword: {
    type: String,
    required: true
  },
  
  role: {
    type: String,
    enum: ['owner', 'kitchen', 'billing'],
    default: 'owner'
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create index for restaurantSlug for faster queries
RestaurantSchema.index({ restaurantSlug: 1 });

module.exports = mongoose.model("Restaurant", RestaurantSchema);