// controllers/masterAuthController.js
const MasterUser = require("../models/MasterUser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Create Master User (For initial setup - Run once)
exports.createMasterUser = async (req, res) => {
  try {
    const { emailId, password, phoneNumber, phonePassword, name, secretKey } = req.body;
    
    // Secret key protection (remove after initial setup)
    const MASTER_SETUP_KEY = "MASTER_SETUP_2024"; // Change this!
    
    if (secretKey !== MASTER_SETUP_KEY) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Invalid setup key."
      });
    }
    
    // Check if master user already exists
    const existingUser = await MasterUser.findOne({ 
      $or: [{ emailId }, { phoneNumber }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: "Master user already exists",
        user: {
          emailId: existingUser.emailId,
          phoneNumber: existingUser.phoneNumber
        }
      });
    }
    
    // Validate inputs
    if (!emailId || !password || !phoneNumber || !phonePassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required: emailId, password, phoneNumber, phonePassword"
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }
    
    if (!/^\d{10}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be 10 digits"
      });
    }
    
    // Hash passwords
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedPhonePassword = await bcrypt.hash(phonePassword, 10);
    
    const masterUser = new MasterUser({
      emailId: emailId.toLowerCase(),
      password: hashedPassword,
      phoneNumber,
      phonePassword: hashedPhonePassword,
      name: name || "Master Admin",
      role: "master_admin",
      failedAttempts: 0,
      lockUntil: null,
      lastFailedAttempt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await masterUser.save();
    
    console.log("✅ Master user created successfully:", emailId);
    
    res.status(201).json({
      success: true,
      message: "Master user created successfully",
      user: {
        id: masterUser._id,
        emailId: masterUser.emailId,
        phoneNumber: masterUser.phoneNumber,
        name: masterUser.name,
        role: masterUser.role
      },
      warning: "⚠️ Please disable or remove this API endpoint after use!"
    });
    
  } catch (error) {
    console.error("Error creating master user:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Master Login with 4 fields
exports.masterLogin = async (req, res) => {
  try {
    const { emailId, password, phoneNumber, phonePassword } = req.body;
    
    console.log("=== MASTER LOGIN ATTEMPT ===");
    console.log("Email:", emailId);
    console.log("Phone:", phoneNumber);
    
    // Validate all fields are present
    if (!emailId || !password || !phoneNumber || !phonePassword) {
      return res.status(400).json({
        success: false,
        message: "All four fields are required: email, password, phone number, phone password"
      });
    }
    
    // Find user by email OR phone
    const user = await MasterUser.findOne({ 
      $or: [
        { emailId: emailId.toLowerCase() },
        { phoneNumber: phoneNumber }
      ]
    });
    
    // Check if user exists
    if (!user) {
      console.log("User not found");
      return res.status(401).json({
        success: false,
        message: "Invalid credentials. Please check your email, phone number, and passwords."
      });
    }
    
    // Check if account is locked
    if (user.isLocked && user.isLocked()) {
      const remainingTime = user.getRemainingLockTime();
      console.log(`Account locked for ${remainingTime}`);
      return res.status(403).json({
        success: false,
        message: `Account is locked. Please try again after ${remainingTime}.`,
        locked: true,
        remainingTime: remainingTime,
        failedAttempts: user.failedAttempts
      });
    }
    
    // Verify both passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    const isPhonePasswordValid = await bcrypt.compare(phonePassword, user.phonePassword);
    
    // Check if email matches the phone number's user
    const emailMatches = user.emailId === emailId.toLowerCase();
    const phoneMatches = user.phoneNumber === phoneNumber;
    
    // All validations must pass
    if (!isPasswordValid || !isPhonePasswordValid || !emailMatches || !phoneMatches) {
      // Increment failed attempts
      user.failedAttempts += 1;
      user.lastFailedAttempt = new Date();
      
      // Calculate lock duration based on failed attempts
      if (user.failedAttempts === 1) {
        user.lockUntil = new Date(Date.now() + 10 * 60 * 1000);
        console.log("1st failed attempt - Locking for 10 minutes");
      } else if (user.failedAttempts === 2) {
        user.lockUntil = new Date(Date.now() + 60 * 60 * 1000);
        console.log("2nd failed attempt - Locking for 1 hour");
      } else if (user.failedAttempts >= 3) {
        user.lockUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
        console.log(`3rd+ failed attempt - Locking for 24 hours`);
      }
      
      await user.save();
      
      const remainingAttempts = 3 - user.failedAttempts;
      
      return res.status(401).json({
        success: false,
        message: `Invalid credentials. ${remainingAttempts > 0 ? `${remainingAttempts} attempt(s) remaining before lockout.` : 'Account is now locked.'}`,
        failedAttempts: user.failedAttempts,
        maxAttempts: 3,
        isLocked: user.isLocked ? user.isLocked() : false,
        remainingTime: user.isLocked ? user.getRemainingLockTime() : null
      });
    }
    
    // Successful login - Reset failed attempts
    user.failedAttempts = 0;
    user.lockUntil = null;
    user.lastFailedAttempt = null;
    user.updatedAt = new Date();
    await user.save();
    
    console.log("✅ MASTER LOGIN SUCCESSFUL!");
    
    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        emailId: user.emailId,
        phoneNumber: user.phoneNumber,
        role: user.role,
        type: "master"
      },
      process.env.JWT_SECRET || "master-secret-key-2024",
      { expiresIn: "8h" }
    );
    
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        emailId: user.emailId,
        phoneNumber: user.phoneNumber,
        name: user.name,
        role: user.role
      },
      redirectUrl: "/master-dashboard"
    });
    
  } catch (error) {
    console.error("Master login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Get master user profile
exports.getMasterProfile = async (req, res) => {
  try {
    const user = await MasterUser.findById(req.user.id).select('-password -phonePassword');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error("Error fetching master profile:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// Logout
exports.masterLogout = async (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully"
  });
};

// Get all master users (Admin only)
exports.getAllMasterUsers = async (req, res) => {
  try {
    const users = await MasterUser.find({})
      .select('-password -phonePassword')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error("Error fetching master users:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// Delete master user (Admin only)
exports.deleteMasterUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await MasterUser.findByIdAndDelete(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    res.json({
      success: true,
      message: "Master user deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting master user:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};