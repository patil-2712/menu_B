// models/MasterUser.js
const mongoose = require("mongoose");

const MasterUserSchema = new mongoose.Schema({
  emailId: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
  phonePassword: {
    type: String,
    required: true
  },
  name: {
    type: String,
    default: "Master Admin"
  },
  role: {
    type: String,
    default: "master_admin"
  },
  // Lockout fields
  failedAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  },
  lastFailedAttempt: {
    type: Date,
    default: null
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

// Calculate lock duration based on failed attempts
MasterUserSchema.methods.getLockDuration = function() {
  const attempts = this.failedAttempts;
  if (attempts === 1) return 10 * 60 * 1000; // 10 minutes
  if (attempts === 2) return 60 * 60 * 1000; // 1 hour
  if (attempts >= 3) return 24 * 60 * 60 * 1000; // 24 hours
  return 0;
};

// Check if account is locked
MasterUserSchema.methods.isLocked = function() {
  if (!this.lockUntil) return false;
  return this.lockUntil > new Date();
};

// Get remaining lock time in human readable format
MasterUserSchema.methods.getRemainingLockTime = function() {
  if (!this.isLocked()) return "Not locked";
  
  const remaining = this.lockUntil - new Date();
  const minutes = Math.floor(remaining / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day(s)`;
  if (hours > 0) return `${hours} hour(s)`;
  return `${minutes} minute(s)`;
};

module.exports = mongoose.model("MasterUser", MasterUserSchema);