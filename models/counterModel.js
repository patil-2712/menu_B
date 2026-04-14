// models/counterModel.js
const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  restaurantCode: {
    type: String,
    required: true
  },
  sequence_value: {
    type: Number,
    default: 1
  }
});

// ✅ Remove the custom index on _id to avoid the warning
// counterSchema.index({ _id: 1, restaurantCode: 1 }, { unique: true });

// Instead, just index restaurantCode for faster queries
counterSchema.index({ restaurantCode: 1 });

module.exports = mongoose.model("Counter", counterSchema);