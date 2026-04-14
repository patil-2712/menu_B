const mongoose = require("mongoose");

const MenuSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
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
  restaurantName: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,  // Now stores Cloudinary URL
    default: null
  },
  type: {
    type: String,
    enum: ['Veg', 'Non-Veg'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  isAvailable: {
    type: Boolean,
    default: true
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

module.exports = mongoose.model("Menu", MenuSchema);