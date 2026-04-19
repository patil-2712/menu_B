//const Restaurant = require("../models/Restaurant");
//const bcrypt = require("bcryptjs");
//const jwt = require("jsonwebtoken");
//const { validationResult } = require("express-validator");
//const Otp = require("../models/Otp");
//const nodemailer = require("nodemailer");
//const crypto = require("crypto");
//
//// Generate OTP function
//const generateOTP = () => {
//  return crypto.randomInt(100000, 999999).toString();
//};
//
//const axios = require('axios'); // Make sure axios is installed
//
//// Send OTP email using Brevo REST API (Works on Render)
//const sendOtpEmail = async (email, otp, role) => {
//  const apiKey = process.env.BREVO_API_KEY;
//  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'patilavdhut198@gmail.com';
//  
//  if (!apiKey) {
//    console.error("❌ BREVO_API_KEY not configured");
//    // For development, just log the OTP
//    if (process.env.NODE_ENV !== 'production') {
//      console.log(`\n📧 DEVELOPMENT - OTP for ${email}: ${otp}\n`);
//      return true;
//    }
//    throw new Error("Email service not configured");
//  }
//  
//  const emailData = {
//    sender: {
//      name: "Restaurant Management",
//      email: senderEmail
//    },
//    to: [{
//      email: email,
//      name: "Customer"
//    }],
//    subject: `Password Reset OTP for ${role} Account`,
//    htmlContent: `
//      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
//        <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
//        <p>Hello,</p>
//        <p>We received a request to reset your password for your <strong>${role}</strong> account.</p>
//        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
//          <h1 style="color: #4CAF50; font-size: 36px; letter-spacing: 5px; margin: 0;">${otp}</h1>
//        </div>
//        <p>This OTP is valid for <strong>5 minutes</strong>.</p>
//        <p>If you didn't request this, please ignore this email.</p>
//        <hr style="margin: 20px 0;">
//        <p style="color: #666; font-size: 12px; text-align: center;">Restaurant Management System</p>
//      </div>
//    `
//  };
//
//  try {
//    console.log(`📧 Sending OTP to ${email} via Brevo API...`);
//    
//    const response = await axios.post('https://api.brevo.com/v3/smtp/email', emailData, {
//      headers: {
//        'api-key': apiKey,
//        'Content-Type': 'application/json'
//      },
//      timeout: 15000
//    });
//    
//    console.log(`✅ OTP email sent successfully to ${email}`);
//    return true;
//    
//  } catch (error) {
//    console.error("❌ Brevo API Error:", error.response?.data || error.message);
//    
//    if (error.response?.status === 401) {
//      console.error("⚠️ Invalid API key. Please check your BREVO_API_KEY");
//    } else if (error.response?.status === 400) {
//      console.error("⚠️ Invalid request. Check sender email is verified in Brevo");
//    }
//    
//    throw new Error(`Failed to send OTP email: ${error.response?.data?.message || error.message}`);
//  }
//};
//
//
//
//
//// Send OTP email function
////const sendOtpEmail = async (email, otp, role) => {
////  const mailOptions = {
////    from: `"Restaurant Management" <${process.env.EMAIL_FROM || 'patilavdhut198@gmail.com'}>`,
////    to: email,
////    subject: `Password Reset OTP for ${role} Account`,
////    html: `
////      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
////        <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
////        <p>Hello,</p>
////        <p>We received a request to reset your password for your <strong>${role}</strong> account.</p>
////        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
////          <h1 style="color: #4CAF50; font-size: 36px; letter-spacing: 5px; margin: 0;">${otp}</h1>
////        </div>
////        <p>This OTP is valid for <strong>5 minutes</strong>.</p>
////        <p>If you didn't request this, please ignore this email.</p>
////        <hr style="margin: 20px 0;">
////        <p style="color: #666; font-size: 12px; text-align: center;">Restaurant Management System</p>
////      </div>
////    `
////  };
////
////  try {
////    await transporter.sendMail(mailOptions);
////    console.log(`✅ OTP email sent successfully to ${email}`);
////    return true;
////  } catch (error) {
////    console.error("❌ Error sending OTP email:", error.message);
////    throw error;
////  }
////};
//
//// ==================== REGISTER RESTAURANT ====================
//exports.registerRestaurant = async (req, res) => {
//  const errors = validationResult(req);
//  if (!errors.isEmpty()) {
//    return res.status(400).json({
//      message: "Validation failed",
//      errors: errors.array()
//    });
//  }
//
//  try {
//    const {
//      restaurantCode,
//      restaurantName,
//      gstNumber,
//      gstPercentage,
//      foodLicense,
//      mobile,
//      email,
//      password,
//      city,
//      state,
//      country,
//      nearestPlace,
//      ownerName,
//      ownerMobile,
//      kitchenUsername,
//      kitchenPassword,
//      billingUsername,
//      billingPassword
//    } = req.body;
//
//    console.log("=== REGISTRATION ATTEMPT ===");
//    console.log("Restaurant Name:", restaurantName);
//    console.log("GST Percentage:", gstPercentage);
//    
//    // Create restaurant slug from restaurant name
//    let restaurantSlug = restaurantName
//      .toLowerCase()
//      .replace(/[^a-z0-9]/g, '-')
//      .replace(/-+/g, '-')
//      .replace(/^-|-$/g, '');
//    
//    console.log("Generated Slug:", restaurantSlug);
//    
//    // Check restaurant slug exists
//    let slugExists = await Restaurant.findOne({ restaurantSlug });
//    let counter = 1;
//    const originalSlug = restaurantSlug;
//    
//    // If slug exists, add numbers until we find a unique one
//    while (slugExists) {
//      console.log("Restaurant slug already exists:", restaurantSlug);
//      restaurantSlug = `${originalSlug}-${counter}`;
//      slugExists = await Restaurant.findOne({ restaurantSlug });
//      counter++;
//    }
//    
//    if (counter > 1) {
//      console.log("Using unique slug:", restaurantSlug);
//    }
//
//    // Trim usernames before saving
//    const trimmedKitchenUsername = kitchenUsername.trim();
//    const trimmedBillingUsername = billingUsername.trim();
//    
//    console.log("Trimmed Kitchen Username:", trimmedKitchenUsername);
//    console.log("Trimmed Billing Username:", trimmedBillingUsername);
//    console.log("Location:", `${city}, ${state}, ${country}`);
//    console.log("Nearest Place:", nearestPlace);
//
//    // Check email exists
//    const emailExists = await Restaurant.findOne({ email });
//    if (emailExists) {
//      console.log("Email already exists:", email);
//      return res.status(400).json({ message: "Email already registered" });
//    }
//
//    // Check kitchen username exists
//    const kitchenExists = await Restaurant.findOne({ kitchenUsername: trimmedKitchenUsername });
//    if (kitchenExists) {
//      console.log("Kitchen username already exists:", trimmedKitchenUsername);
//      return res.status(400).json({ message: "Kitchen username already exists" });
//    }
//
//    // Check billing username exists
//    const billingExists = await Restaurant.findOne({ billingUsername: trimmedBillingUsername });
//    if (billingExists) {
//      console.log("Billing username already exists:", trimmedBillingUsername);
//      return res.status(400).json({ message: "Billing username already exists" });
//    }
//
//    // Hash all passwords
//    const hashedPassword = await bcrypt.hash(password, 10);
//    const hashedKitchenPassword = await bcrypt.hash(kitchenPassword, 10);
//    const hashedBillingPassword = await bcrypt.hash(billingPassword, 10);
//
//    console.log("Creating restaurant document...");
//
//    const restaurant = new Restaurant({
//      restaurantCode,
//      restaurantSlug,
//      restaurantName,
//      gstNumber,
//      gstPercentage: gstPercentage ? parseFloat(gstPercentage) : null,
//      foodLicense,
//      mobile,
//      email,
//      password: hashedPassword,
//      city,
//      state,
//      country,
//      nearestPlace,
//      ownerName,
//      ownerMobile,
//      kitchenUsername: trimmedKitchenUsername,
//      kitchenPassword: hashedKitchenPassword,
//      billingUsername: trimmedBillingUsername,
//      billingPassword: hashedBillingPassword,
//      role: 'owner'
//    });
//
//    await restaurant.save();
//    
//    console.log("=== REGISTRATION SUCCESS ===");
//    console.log("Restaurant saved:", restaurant.restaurantName);
//    console.log("GST Percentage:", restaurant.gstPercentage);
//    console.log("Restaurant Slug:", restaurant.restaurantSlug);
//    console.log("Your Restaurant URL:", `http://localhost:5173/${restaurantSlug}/setmenu`);
//
//    res.status(201).json({
//      message: "Restaurant Registered Successfully",
//      restaurantCode,
//      restaurantSlug,
//      gstPercentage: restaurant.gstPercentage,
//      credentials: {
//        owner: { login: email, password: password },
//        kitchen: { 
//          username: trimmedKitchenUsername, 
//          password: kitchenPassword
//        },
//        billing: { 
//          username: trimmedBillingUsername, 
//          password: billingPassword
//        }
//      },
//      urls: {
//        setMenu: `http://localhost:5173/${restaurantSlug}/setmenu`
//      }
//    });
//
//  } catch (error) {
//    console.error("Registration Error:", error);
//    console.error("Error stack:", error.stack);
//    res.status(500).json({ 
//      message: "Server Error",
//      error: error.message 
//    });
//  }
//};
//
//// ==================== LOGIN ====================
//// ==================== LOGIN ====================
//exports.login = async (req, res) => {
//  try {
//    const { username, password, role } = req.body;
//
//    console.log("\n=== LOGIN ATTEMPT ===");
//    console.log("Input username:", `"${username}"`);
//    console.log("Role:", role);
//    
//    const trimmedUsername = username.trim();
//
//    let restaurant;
//    let passwordField;
//    
//    switch(role) {
//      case 'owner':
//        // ✅ UPDATED: Owner can login with email OR mobile number
//        restaurant = await Restaurant.findOne({ 
//          $or: [
//            { email: trimmedUsername },
//            { mobile: trimmedUsername }  // ← ADD THIS LINE
//          ] 
//        });
//        passwordField = 'password';
//        break;
//      case 'kitchen':
//        restaurant = await Restaurant.findOne({ 
//          kitchenUsername: trimmedUsername
//        });
//        passwordField = 'kitchenPassword';
//        break;
//      case 'billing':
//        restaurant = await Restaurant.findOne({ 
//          billingUsername: trimmedUsername
//        });
//        passwordField = 'billingPassword';
//        break;
//      default:
//        return res.status(400).json({ 
//          message: "Invalid role. Use 'owner', 'kitchen', or 'billing'" 
//        });
//    }
//
//    if (!restaurant) {
//      console.log(`ERROR: No ${role} found with username "${trimmedUsername}"`);
//      return res.status(400).json({ 
//        message: `Invalid ${role} credentials. User "${trimmedUsername}" not found.` 
//      });
//    }
//
//    const isPasswordValid = await bcrypt.compare(password, restaurant[passwordField]);
//
//    if (!isPasswordValid) {
//      console.log("ERROR: Password doesn't match");
//      return res.status(400).json({ 
//        message: `Invalid ${role} password. Please try again.` 
//      });
//    }
//
//    console.log("LOGIN SUCCESSFUL!");
//    
//    // Check if restaurant has slug, if not generate one
//    let restaurantSlug = restaurant.restaurantSlug;
//    if (!restaurantSlug) {
//      console.log("WARNING: restaurantSlug is missing, generating one...");
//      
//      restaurantSlug = restaurant.restaurantName
//        .toLowerCase()
//        .replace(/[^a-z0-9]/g, '-')
//        .replace(/-+/g, '-')
//        .replace(/^-|-$/g, '');
//      
//      if (!restaurantSlug) {
//        restaurantSlug = restaurant.restaurantCode.toLowerCase().replace('rest-', '');
//      }
//      
//      restaurant.restaurantSlug = restaurantSlug;
//      await restaurant.save();
//      
//      console.log("Generated and saved slug:", restaurantSlug);
//    }
//    
//    console.log("Using restaurant slug:", restaurantSlug);
//    
//    const tokenPayload = {
//      id: restaurant._id,
//      restaurantCode: restaurant.restaurantCode,
//      restaurantSlug: restaurantSlug,
//      restaurantName: restaurant.restaurantName,
//      role: role
//    };
//
//    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
//      expiresIn: '24h'
//    });
//
//    res.json({
//      message: "Login successful",
//      token,
//      user: {
//        restaurantCode: restaurant.restaurantCode,
//        restaurantSlug: restaurantSlug,
//        restaurantName: restaurant.restaurantName,
//        role: role,
//        gstPercentage: restaurant.gstPercentage
//      },
//      redirectUrl: `/${restaurantSlug}/setmenu`
//    });
//
//  } catch (error) {
//    console.error("Login Error:", error);
//    res.status(500).json({ 
//      message: "Server Error",
//      error: error.message 
//    });
//  }
//};
//
//// ==================== GET RESTAURANT PROFILE ====================
//exports.getRestaurantProfile = async (req, res) => {
//  try {
//    const restaurant = await Restaurant.findById(req.user.id)
//      .select('-password -kitchenPassword -billingPassword');
//    
//    if (!restaurant) {
//      return res.status(404).json({ message: "Restaurant not found" });
//    }
//    
//    console.log("Profile fetched for:", restaurant.restaurantName);
//    console.log("GST Percentage:", restaurant.gstPercentage);
//    
//    res.json(restaurant);
//  } catch (error) {
//    console.error(error);
//    res.status(500).json({ message: "Server Error" });
//  }
//};
//
//// ==================== GET RESTAURANT BY SLUG ====================
//exports.getRestaurantBySlug = async (req, res) => {
//  try {
//    const { slug } = req.params;
//    console.log("Looking for restaurant with slug:", slug);
//    
//    const restaurant = await Restaurant.findOne({ restaurantSlug: slug })
//      .select('-password -kitchenPassword -billingPassword');
//    
//    if (!restaurant) {
//      console.log("Restaurant not found for slug:", slug);
//      return res.status(404).json({ message: "Restaurant not found" });
//    }
//    
//    console.log("Found restaurant:", restaurant.restaurantName);
//    console.log("GST Percentage:", restaurant.gstPercentage);
//    
//    res.json(restaurant);
//  } catch (error) {
//    console.error(error);
//    res.status(500).json({ message: "Server Error" });
//  }
//};
//
//// ==================== UPDATE RESTAURANT ====================
//exports.updateRestaurant = async (req, res) => {
//  try {
//    const { restaurantSlug } = req.params;
//    const updateData = req.body;
//    
//    console.log("=== UPDATE RESTAURANT ===");
//    console.log("Restaurant Slug:", restaurantSlug);
//    console.log("Update Data:", updateData);
//    console.log("GST Percentage to update:", updateData.gstPercentage);
//    
//    // Check if user is owner of this restaurant
//    if (req.user.restaurantSlug !== restaurantSlug || req.user.role !== 'owner') {
//      return res.status(403).json({ 
//        message: "Access denied. Only restaurant owner can update data." 
//      });
//    }
//    
//    // Find restaurant by slug
//    const restaurant = await Restaurant.findOne({ restaurantSlug });
//    if (!restaurant) {
//      return res.status(404).json({ message: "Restaurant not found" });
//    }
//    
//    // Update ALL fields that are provided
//    const updateFields = [
//      'restaurantName', 'mobile', 'email', 'city', 'state', 'country',
//      'nearestPlace', 'ownerName', 'ownerMobile', 'gstNumber', 'gstPercentage',
//      'foodLicense', 'kitchenUsername', 'billingUsername'
//    ];
//    
//    // Check for duplicate usernames if they're being updated
//    if (updateData.kitchenUsername && 
//        updateData.kitchenUsername !== restaurant.kitchenUsername) {
//      const kitchenExists = await Restaurant.findOne({ 
//        kitchenUsername: updateData.kitchenUsername.trim(),
//        _id: { $ne: restaurant._id }
//      });
//      if (kitchenExists) {
//        return res.status(400).json({ 
//          message: "Kitchen username already exists" 
//        });
//      }
//    }
//    
//    if (updateData.billingUsername && 
//        updateData.billingUsername !== restaurant.billingUsername) {
//      const billingExists = await Restaurant.findOne({ 
//        billingUsername: updateData.billingUsername.trim(),
//        _id: { $ne: restaurant._id }
//      });
//      if (billingExists) {
//        return res.status(400).json({ 
//          message: "Billing username already exists" 
//        });
//      }
//    }
//    
//    if (updateData.email && updateData.email !== restaurant.email) {
//      const emailExists = await Restaurant.findOne({ 
//        email: updateData.email.trim(),
//        _id: { $ne: restaurant._id }
//      });
//      if (emailExists) {
//        return res.status(400).json({ 
//          message: "Email already registered" 
//        });
//      }
//    }
//    
//    // Update all fields
//    updateFields.forEach(field => {
//      if (updateData[field] !== undefined && updateData[field] !== null) {
//        if (field === 'gstPercentage') {
//          // Convert GST percentage to number if provided
//          restaurant[field] = updateData[field] ? parseFloat(updateData[field]) : null;
//        } else {
//          restaurant[field] = updateData[field].toString().trim();
//        }
//      }
//    });
//    
//    // Update restaurant slug if name changed
//    if (updateData.restaurantName && updateData.restaurantName !== restaurant.restaurantName) {
//      let newSlug = updateData.restaurantName
//        .toLowerCase()
//        .replace(/[^a-z0-9]/g, '-')
//        .replace(/-+/g, '-')
//        .replace(/^-|-$/g, '');
//      
//      // Check if new slug is available
//      const slugExists = await Restaurant.findOne({ 
//        restaurantSlug: newSlug,
//        _id: { $ne: restaurant._id }
//      });
//      
//      if (!slugExists) {
//        restaurant.restaurantSlug = newSlug;
//      }
//    }
//    
//    restaurant.updatedAt = Date.now();
//    await restaurant.save();
//    
//    // Get updated restaurant data without passwords
//    const updatedRestaurant = await Restaurant.findById(restaurant._id)
//      .select('-password -kitchenPassword -billingPassword');
//    
//    console.log("✅ Restaurant updated successfully");
//    console.log("Updated GST Percentage:", updatedRestaurant.gstPercentage);
//    console.log("Updated fields:", Object.keys(updateData).join(', '));
//    
//    res.json({
//      message: "Restaurant updated successfully",
//      restaurant: updatedRestaurant
//    });
//    
//  } catch (error) {
//    console.error("Update Error:", error);
//    res.status(500).json({ 
//      message: "Server Error",
//      error: error.message 
//    });
//  }
//};
//
//// ==================== UPDATE PASSWORDS ====================
//exports.updatePasswords = async (req, res) => {
//  try {
//    const { restaurantSlug } = req.params;
//    const { 
//      currentPassword, 
//      newPassword,
//      kitchenCurrentPassword, 
//      kitchenNewPassword,
//      billingCurrentPassword, 
//      billingNewPassword
//    } = req.body;
//    
//    console.log("=== UPDATE PASSWORDS ===");
//    console.log("Restaurant Slug:", restaurantSlug);
//    
//    // Check if user is owner of this restaurant
//    if (req.user.restaurantSlug !== restaurantSlug || req.user.role !== 'owner') {
//      return res.status(403).json({ 
//        message: "Access denied. Only restaurant owner can update passwords." 
//      });
//    }
//    
//    // Find restaurant by slug
//    const restaurant = await Restaurant.findOne({ restaurantSlug });
//    if (!restaurant) {
//      return res.status(404).json({ message: "Restaurant not found" });
//    }
//    
//    // Object to track which passwords were updated
//    const updatedPasswords = [];
//    
//    // Update owner password if provided
//    if (currentPassword && newPassword) {
//      // Verify current owner password
//      const isMatch = await bcrypt.compare(currentPassword, restaurant.password);
//      if (!isMatch) {
//        return res.status(400).json({ 
//          message: "Current owner password is incorrect" 
//        });
//      }
//      
//      // Hash and set new password
//      const hashedPassword = await bcrypt.hash(newPassword, 10);
//      restaurant.password = hashedPassword;
//      updatedPasswords.push("owner");
//    }
//    
//    // Update kitchen password if provided
//    if (kitchenCurrentPassword && kitchenNewPassword) {
//      // Verify current kitchen password
//      const isMatch = await bcrypt.compare(kitchenCurrentPassword, restaurant.kitchenPassword);
//      if (!isMatch) {
//        return res.status(400).json({ 
//          message: "Current kitchen password is incorrect" 
//        });
//      }
//      
//      // Hash and set new kitchen password
//      const hashedKitchenPassword = await bcrypt.hash(kitchenNewPassword, 10);
//      restaurant.kitchenPassword = hashedKitchenPassword;
//      updatedPasswords.push("kitchen");
//    }
//    
//    // Update billing password if provided
//    if (billingCurrentPassword && billingNewPassword) {
//      // Verify current billing password
//      const isMatch = await bcrypt.compare(billingCurrentPassword, restaurant.billingPassword);
//      if (!isMatch) {
//        return res.status(400).json({ 
//          message: "Current billing password is incorrect" 
//        });
//      }
//      
//      // Hash and set new billing password
//      const hashedBillingPassword = await bcrypt.hash(billingNewPassword, 10);
//      restaurant.billingPassword = hashedBillingPassword;
//      updatedPasswords.push("billing");
//    }
//    
//    // Check if at least one password update was attempted
//    if (updatedPasswords.length === 0) {
//      return res.status(400).json({ 
//        message: "No password update data provided" 
//      });
//    }
//    
//    restaurant.updatedAt = Date.now();
//    await restaurant.save();
//    
//    console.log("✅ Passwords updated successfully:", updatedPasswords);
//    
//    res.json({
//      message: "Passwords updated successfully",
//      updated: updatedPasswords
//    });
//    
//  } catch (error) {
//    console.error("Update Password Error:", error);
//    res.status(500).json({ 
//      message: "Server Error",
//      error: error.message 
//    });
//  }
//};
//
//// ==================== REQUEST OTP ====================
//exports.requestOtp = async (req, res) => {
//  try {
//    const { username, role } = req.body;
//    
//    console.log("\n=== OTP REQUEST ===");
//    console.log("Username:", username);
//    console.log("Role:", role);
//    
//    if (!username || !role) {
//      return res.status(400).json({ 
//        message: "Username and role are required" 
//      });
//    }
//    
//    const trimmedUsername = username.trim();
//    let restaurant;
//    let email;
//    
//    // Find restaurant based on role
//    switch(role) {
//      case 'owner':
//        restaurant = await Restaurant.findOne({ 
//          $or: [
//            { email: trimmedUsername },
//            { mobile: trimmedUsername }
//          ] 
//        });
//        if (restaurant) email = restaurant.email;
//        break;
//      case 'kitchen':
//        restaurant = await Restaurant.findOne({ 
//          kitchenUsername: trimmedUsername
//        });
//        if (restaurant) email = restaurant.email;
//        break;
//      case 'billing':
//        restaurant = await Restaurant.findOne({ 
//          billingUsername: trimmedUsername
//        });
//        if (restaurant) email = restaurant.email;
//        break;
//      default:
//        return res.status(400).json({ 
//          message: "Invalid role" 
//        });
//    }
//    
//    if (!restaurant) {
//      console.log("No account found for username:", trimmedUsername);
//      return res.status(404).json({ 
//        message: `No ${role} account found with this username` 
//      });
//    }
//    
//    // Generate OTP
//    const otp = generateOTP();
//    
//    // Delete any existing OTPs for this email and role
//    await Otp.deleteMany({ email: email, role: role });
//    
//    // Save new OTP
//    const otpRecord = new Otp({
//      email: email,
//      otp: otp,
//      role: role,
//      restaurantSlug: restaurant.restaurantSlug
//    });
//    
//    await otpRecord.save();
//    
//    // Send OTP via email
//    await sendOtpEmail(email, otp, role);
//    
//    console.log("✅ OTP generated and sent successfully");
//    console.log("Email:", email);
//    console.log("OTP:", otp);
//    
//    // Return both masked email (for display) and full email (for verification)
//    const maskedEmail = email.substring(0, 3) + '***' + email.substring(email.indexOf('@'));
//    
//    res.json({
//      message: "OTP sent successfully to your email",
//      maskedEmail: maskedEmail,
//      fullEmail: email,
//      timestamp: new Date().toISOString()
//    });
//    
//  } catch (error) {
//    console.error("OTP Request Error:", error);
//    res.status(500).json({ 
//      message: "Server Error",
//      error: error.message 
//    });
//  }
//};
//
//// ==================== VERIFY OTP ====================
//exports.verifyOtp = async (req, res) => {
//  try {
//    const { email, otp, role } = req.body;
//    
//    console.log("\n=== OTP VERIFICATION ===");
//    console.log("Email:", email);
//    console.log("OTP:", otp);
//    console.log("Role:", role);
//    
//    if (!email || !otp || !role) {
//      return res.status(400).json({ 
//        message: "Email, OTP and role are required" 
//      });
//    }
//    
//    // Find valid OTP
//    const otpRecord = await Otp.findOne({
//      email: email,
//      otp: otp,
//      role: role
//    });
//    
//    if (!otpRecord) {
//      console.log("Invalid or expired OTP");
//      return res.status(400).json({ 
//        message: "Invalid or expired OTP" 
//      });
//    }
//    
//    console.log("✅ OTP verified successfully");
//    
//    // Delete the OTP after successful verification
//    await Otp.deleteOne({ _id: otpRecord._id });
//    
//    // Generate temporary token for password reset
//    const tempToken = jwt.sign(
//      { 
//        email: email, 
//        role: role,
//        purpose: 'password_reset'
//      }, 
//      process.env.JWT_SECRET, 
//      { expiresIn: '15m' }
//    );
//    
//    res.json({
//      message: "OTP verified successfully",
//      tempToken: tempToken,
//      email: email,
//      role: role,
//      restaurantSlug: otpRecord.restaurantSlug
//    });
//    
//  } catch (error) {
//    console.error("OTP Verification Error:", error);
//    res.status(500).json({ 
//      message: "Server Error",
//      error: error.message 
//    });
//  }
//};
//
//// ==================== RESET PASSWORD ====================
//exports.resetPassword = async (req, res) => {
//  try {
//    const { email, role, newPassword, tempToken } = req.body;
//    
//    console.log("\n=== PASSWORD RESET ===");
//    console.log("Email:", email);
//    console.log("Role:", role);
//    
//    // Verify temp token
//    let decoded;
//    try {
//      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
//      if (decoded.purpose !== 'password_reset' || decoded.email !== email || decoded.role !== role) {
//        throw new Error("Invalid token");
//      }
//    } catch (error) {
//      return res.status(401).json({ 
//        message: "Invalid or expired reset token" 
//      });
//    }
//    
//    // Validate password
//    if (!newPassword || newPassword.length < 6) {
//      return res.status(400).json({ 
//        message: "Password must be at least 6 characters" 
//      });
//    }
//    
//    // Find restaurant
//    const restaurant = await Restaurant.findOne({ email: email });
//    if (!restaurant) {
//      return res.status(404).json({ 
//        message: "Restaurant not found" 
//      });
//    }
//    
//    // Hash and update password based on role
//    const hashedPassword = await bcrypt.hash(newPassword, 10);
//    
//    switch(role) {
//      case 'owner':
//        restaurant.password = hashedPassword;
//        break;
//      case 'kitchen':
//        restaurant.kitchenPassword = hashedPassword;
//        break;
//      case 'billing':
//        restaurant.billingPassword = hashedPassword;
//        break;
//      default:
//        return res.status(400).json({ 
//          message: "Invalid role" 
//        });
//    }
//    
//    restaurant.updatedAt = Date.now();
//    await restaurant.save();
//    
//    console.log("✅ Password reset successful for", role);
//    
//    res.json({
//      message: "Password reset successfully",
//      role: role,
//      timestamp: new Date().toISOString()
//    });
//    
//  } catch (error) {
//    console.error("Password Reset Error:", error);
//    res.status(500).json({ 
//      message: "Server Error",
//      error: error.message 
//    });
//  }
//};
//
//// ==================== RESEND OTP ====================
//exports.resendOtp = async (req, res) => {
//  try {
//    const { email, role } = req.body;
//    
//    console.log("\n=== RESEND OTP ===");
//    console.log("Email:", email);
//    console.log("Role:", role);
//    
//    if (!email || !role) {
//      return res.status(400).json({ 
//        message: "Email and role are required" 
//      });
//    }
//    
//    // Delete existing OTPs
//    await Otp.deleteMany({ email: email, role: role });
//    
//    // Generate new OTP
//    const otp = generateOTP();
//    
//    // Save new OTP
//    const otpRecord = new Otp({
//      email: email,
//      otp: otp,
//      role: role
//    });
//    
//    await otpRecord.save();
//    
//    // Send OTP via email
//    await sendOtpEmail(email, otp, role);
//    
//    console.log("✅ New OTP sent successfully");
//    
//    res.json({
//      message: "New OTP sent successfully",
//      email: email.substring(0, 3) + '***' + email.substring(email.indexOf('@'))
//    });
//    
//  } catch (error) {
//    console.error("Resend OTP Error:", error);
//    res.status(500).json({ 
//      message: "Server Error",
//      error: error.message 
//    });
//  }
//};
//
//// ==================== GET ALL RESTAURANTS (Admin only - optional) ====================
//exports.getAllRestaurants = async (req, res) => {
//  try {
//    const restaurants = await Restaurant.find({})
//      .select('-password -kitchenPassword -billingPassword')
//      .sort({ createdAt: -1 });
//    
//    console.log(`Found ${restaurants.length} restaurants`);
//    
//    res.json({
//      count: restaurants.length,
//      restaurants: restaurants
//    });
//  } catch (error) {
//    console.error("Get All Restaurants Error:", error);
//    res.status(500).json({ 
//      message: "Server Error",
//      error: error.message 
//    });
//  }
//};
//
//// ==================== DELETE RESTAURANT (Admin only - optional) ====================
//exports.deleteRestaurant = async (req, res) => {
//  try {
//    const { restaurantSlug } = req.params;
//    
//    console.log("=== DELETE RESTAURANT ===");
//    console.log("Restaurant Slug:", restaurantSlug);
//    
//    const restaurant = await Restaurant.findOne({ restaurantSlug });
//    
//    if (!restaurant) {
//      return res.status(404).json({ message: "Restaurant not found" });
//    }
//    
//    await Restaurant.deleteOne({ restaurantSlug });
//    
//    console.log("✅ Restaurant deleted successfully:", restaurant.restaurantName);
//    
//    res.json({
//      message: "Restaurant deleted successfully",
//      deletedRestaurant: {
//        name: restaurant.restaurantName,
//        slug: restaurant.restaurantSlug
//      }
//    });
//  } catch (error) {
//    console.error("Delete Restaurant Error:", error);
//    res.status(500).json({ 
//      message: "Server Error",
//      error: error.message 
//    });
//  }
//};
const Restaurant = require("../models/Restaurant");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const Otp = require("../models/Otp");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Generate OTP function
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const axios = require('axios');

// Send OTP email using Brevo REST API (Works on Render)
const sendOtpEmail = async (email, otp, role) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'patilavdhut198@gmail.com';
  
  if (!apiKey) {
    console.error("❌ BREVO_API_KEY not configured");
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n📧 DEVELOPMENT - OTP for ${email}: ${otp}\n`);
      return true;
    }
    throw new Error("Email service not configured");
  }
  
  const emailData = {
    sender: {
      name: "Restaurant Management",
      email: senderEmail
    },
    to: [{
      email: email,
      name: "Customer"
    }],
    subject: `Password Reset OTP for ${role} Account`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password for your <strong>${role}</strong> account.</p>
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
          <h1 style="color: #4CAF50; font-size: 36px; letter-spacing: 5px; margin: 0;">${otp}</h1>
        </div>
        <p>This OTP is valid for <strong>5 minutes</strong>.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="margin: 20px 0;">
        <p style="color: #666; font-size: 12px; text-align: center;">Restaurant Management System</p>
      </div>
    `
  };

  try {
    console.log(`📧 Sending OTP to ${email} via Brevo API...`);
    
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', emailData, {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    console.log(`✅ OTP email sent successfully to ${email}`);
    return true;
    
  } catch (error) {
    console.error("❌ Brevo API Error:", error.response?.data || error.message);
    throw new Error(`Failed to send OTP email: ${error.response?.data?.message || error.message}`);
  }
};

// ==================== REGISTER RESTAURANT ====================
exports.registerRestaurant = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array()
    });
  }

  try {
    const {
      restaurantCode,
      restaurantName,
      gstNumber,
      gstPercentage,
      foodLicense,
      mobile,
      email,
      password,
      city,
      state,
      country,
      nearestPlace,
      latitude,
      longitude,
      ownerName,
      ownerMobile,
      kitchenUsername,
      kitchenPassword,
      billingUsername,
      billingPassword
    } = req.body;

    console.log("=== REGISTRATION ATTEMPT ===");
    console.log("Restaurant Name:", restaurantName);
    console.log("GST Percentage:", gstPercentage);
    console.log("Latitude:", latitude);
    console.log("Longitude:", longitude);
    
    // Create restaurant slug from restaurant name
    let restaurantSlug = restaurantName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    console.log("Generated Slug:", restaurantSlug);
    
    // Check restaurant slug exists
    let slugExists = await Restaurant.findOne({ restaurantSlug });
    let counter = 1;
    const originalSlug = restaurantSlug;
    
    while (slugExists) {
      console.log("Restaurant slug already exists:", restaurantSlug);
      restaurantSlug = `${originalSlug}-${counter}`;
      slugExists = await Restaurant.findOne({ restaurantSlug });
      counter++;
    }
    
    if (counter > 1) {
      console.log("Using unique slug:", restaurantSlug);
    }

    // Trim usernames before saving
    const trimmedKitchenUsername = kitchenUsername ? kitchenUsername.trim() : '';
    const trimmedBillingUsername = billingUsername ? billingUsername.trim() : '';
    
    console.log("Trimmed Kitchen Username:", trimmedKitchenUsername);
    console.log("Trimmed Billing Username:", trimmedBillingUsername);

    // Check email exists
    const emailExists = await Restaurant.findOne({ email });
    if (emailExists) {
      console.log("Email already exists:", email);
      return res.status(400).json({ message: "Email already registered" });
    }

    // Check kitchen username exists
    if (trimmedKitchenUsername) {
      const kitchenExists = await Restaurant.findOne({ kitchenUsername: trimmedKitchenUsername });
      if (kitchenExists) {
        console.log("Kitchen username already exists:", trimmedKitchenUsername);
        return res.status(400).json({ message: "Kitchen username already exists" });
      }
    }

    // Check billing username exists
    if (trimmedBillingUsername) {
      const billingExists = await Restaurant.findOne({ billingUsername: trimmedBillingUsername });
      if (billingExists) {
        console.log("Billing username already exists:", trimmedBillingUsername);
        return res.status(400).json({ message: "Billing username already exists" });
      }
    }

    // Hash all passwords
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedKitchenPassword = await bcrypt.hash(kitchenPassword, 10);
    const hashedBillingPassword = await bcrypt.hash(billingPassword, 10);

    console.log("Creating restaurant document...");

    const restaurant = new Restaurant({
      restaurantCode,
      restaurantSlug,
      restaurantName,
      gstNumber: gstNumber || null,
      gstPercentage: gstPercentage ? parseFloat(gstPercentage) : null,
      foodLicense: foodLicense || null,
      mobile,
      email,
      password: hashedPassword,
      city,
      state,
      country,
      nearestPlace,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      ownerName: ownerName || null,
      ownerMobile: ownerMobile || null,
      kitchenUsername: trimmedKitchenUsername,
      kitchenPassword: hashedKitchenPassword,
      billingUsername: trimmedBillingUsername,
      billingPassword: hashedBillingPassword,
      role: 'owner',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    await restaurant.save();
    
    console.log("=== REGISTRATION SUCCESS ===");
    console.log("Restaurant saved:", restaurant.restaurantName);
    console.log("GST Percentage:", restaurant.gstPercentage);
    console.log("Latitude:", restaurant.latitude);
    console.log("Longitude:", restaurant.longitude);
    console.log("Restaurant Slug:", restaurant.restaurantSlug);

    res.status(201).json({
      message: "Restaurant Registered Successfully",
      restaurantCode,
      restaurantSlug,
      gstPercentage: restaurant.gstPercentage,
      location: {
        latitude: restaurant.latitude,
        longitude: restaurant.longitude
      },
      credentials: {
        owner: { login: email, password: password },
        kitchen: { 
          username: trimmedKitchenUsername, 
          password: kitchenPassword
        },
        billing: { 
          username: trimmedBillingUsername, 
          password: billingPassword
        }
      },
      urls: {
        setMenu: `http://localhost:5173/${restaurantSlug}/setmenu`
      }
    });

  } catch (error) {
    console.error("Registration Error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      message: "Server Error",
      error: error.message 
    });
  }
};

// ==================== LOGIN ====================
exports.login = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    console.log("\n=== LOGIN ATTEMPT ===");
    console.log("Input username:", `"${username}"`);
    console.log("Role:", role);
    
    const trimmedUsername = username ? username.trim() : '';

    let restaurant;
    let passwordField;
    
    switch(role) {
      case 'owner':
        restaurant = await Restaurant.findOne({ 
          $or: [
            { email: trimmedUsername },
            { mobile: trimmedUsername }
          ] 
        });
        passwordField = 'password';
        break;
      case 'kitchen':
        restaurant = await Restaurant.findOne({ 
          kitchenUsername: trimmedUsername
        });
        passwordField = 'kitchenPassword';
        break;
      case 'billing':
        restaurant = await Restaurant.findOne({ 
          billingUsername: trimmedUsername
        });
        passwordField = 'billingPassword';
        break;
      default:
        return res.status(400).json({ 
          message: "Invalid role. Use 'owner', 'kitchen', or 'billing'" 
        });
    }

    if (!restaurant) {
      console.log(`ERROR: No ${role} found with username "${trimmedUsername}"`);
      return res.status(400).json({ 
        message: `Invalid ${role} credentials. User "${trimmedUsername}" not found.` 
      });
    }

    const isPasswordValid = await bcrypt.compare(password, restaurant[passwordField]);

    if (!isPasswordValid) {
      console.log("ERROR: Password doesn't match");
      return res.status(400).json({ 
        message: `Invalid ${role} password. Please try again.` 
      });
    }

    console.log("LOGIN SUCCESSFUL!");
    
    // Check if restaurant has slug, if not generate one
    let restaurantSlug = restaurant.restaurantSlug;
    if (!restaurantSlug) {
      console.log("WARNING: restaurantSlug is missing, generating one...");
      
      restaurantSlug = restaurant.restaurantName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      if (!restaurantSlug) {
        restaurantSlug = restaurant.restaurantCode.toLowerCase().replace('rest-', '');
      }
      
      restaurant.restaurantSlug = restaurantSlug;
      await restaurant.save();
      
      console.log("Generated and saved slug:", restaurantSlug);
    }
    
    console.log("Using restaurant slug:", restaurantSlug);
    
    const tokenPayload = {
      id: restaurant._id,
      restaurantCode: restaurant.restaurantCode,
      restaurantSlug: restaurantSlug,
      restaurantName: restaurant.restaurantName,
      role: role
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: '24h'
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        restaurantCode: restaurant.restaurantCode,
        restaurantSlug: restaurantSlug,
        restaurantName: restaurant.restaurantName,
        role: role,
        gstPercentage: restaurant.gstPercentage,
        location: {
          latitude: restaurant.latitude,
          longitude: restaurant.longitude
        }
      },
      redirectUrl: `/${restaurantSlug}/setmenu`
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ 
      message: "Server Error",
      error: error.message 
    });
  }
};

// ==================== GET RESTAURANT PROFILE ====================
exports.getRestaurantProfile = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.user.id)
      .select('-password -kitchenPassword -billingPassword');
    
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    
    console.log("Profile fetched for:", restaurant.restaurantName);
    console.log("GST Percentage:", restaurant.gstPercentage);
    console.log("Location:", restaurant.latitude, restaurant.longitude);
    
    res.json(restaurant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ==================== GET RESTAURANT BY SLUG ====================
exports.getRestaurantBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    console.log("Looking for restaurant with slug:", slug);
    
    const restaurant = await Restaurant.findOne({ restaurantSlug: slug })
      .select('-password -kitchenPassword -billingPassword');
    
    if (!restaurant) {
      console.log("Restaurant not found for slug:", slug);
      return res.status(404).json({ message: "Restaurant not found" });
    }
    
    console.log("Found restaurant:", restaurant.restaurantName);
    console.log("GST Percentage:", restaurant.gstPercentage);
    console.log("Location:", restaurant.latitude, restaurant.longitude);
    
    res.json(restaurant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ==================== UPDATE RESTAURANT ====================
exports.updateRestaurant = async (req, res) => {
  try {
    const { restaurantSlug } = req.params;
    const updateData = req.body;
    
    console.log("=== UPDATE RESTAURANT ===");
    console.log("Restaurant Slug:", restaurantSlug);
    console.log("Update Data:", updateData);
    
    // Check if user is owner of this restaurant
    if (req.user.restaurantSlug !== restaurantSlug || req.user.role !== 'owner') {
      return res.status(403).json({ 
        message: "Access denied. Only restaurant owner can update data." 
      });
    }
    
    // Find restaurant by slug
    const restaurant = await Restaurant.findOne({ restaurantSlug });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    
    // Update ALL fields that are provided
    const updateFields = [
      'restaurantName', 'mobile', 'email', 'city', 'state', 'country',
      'nearestPlace', 'ownerName', 'ownerMobile', 'gstNumber', 'gstPercentage',
      'foodLicense', 'kitchenUsername', 'billingUsername', 'latitude', 'longitude'
    ];
    
    // Check for duplicate usernames if they're being updated
    if (updateData.kitchenUsername && 
        updateData.kitchenUsername !== restaurant.kitchenUsername) {
      const kitchenExists = await Restaurant.findOne({ 
        kitchenUsername: updateData.kitchenUsername.trim(),
        _id: { $ne: restaurant._id }
      });
      if (kitchenExists) {
        return res.status(400).json({ 
          message: "Kitchen username already exists" 
        });
      }
    }
    
    if (updateData.billingUsername && 
        updateData.billingUsername !== restaurant.billingUsername) {
      const billingExists = await Restaurant.findOne({ 
        billingUsername: updateData.billingUsername.trim(),
        _id: { $ne: restaurant._id }
      });
      if (billingExists) {
        return res.status(400).json({ 
          message: "Billing username already exists" 
        });
      }
    }
    
    if (updateData.email && updateData.email !== restaurant.email) {
      const emailExists = await Restaurant.findOne({ 
        email: updateData.email.trim(),
        _id: { $ne: restaurant._id }
      });
      if (emailExists) {
        return res.status(400).json({ 
          message: "Email already registered" 
        });
      }
    }
    
    // Update all fields
    updateFields.forEach(field => {
      if (updateData[field] !== undefined && updateData[field] !== null) {
        if (field === 'gstPercentage') {
          restaurant[field] = updateData[field] ? parseFloat(updateData[field]) : null;
        } else if (field === 'latitude' || field === 'longitude') {
          restaurant[field] = updateData[field] ? parseFloat(updateData[field]) : null;
        } else {
          restaurant[field] = updateData[field].toString().trim();
        }
      }
    });
    
    // Update restaurant slug if name changed
    if (updateData.restaurantName && updateData.restaurantName !== restaurant.restaurantName) {
      let newSlug = updateData.restaurantName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      const slugExists = await Restaurant.findOne({ 
        restaurantSlug: newSlug,
        _id: { $ne: restaurant._id }
      });
      
      if (!slugExists) {
        restaurant.restaurantSlug = newSlug;
      }
    }
    
    restaurant.updatedAt = Date.now();
    await restaurant.save();
    
    // Get updated restaurant data without passwords
    const updatedRestaurant = await Restaurant.findById(restaurant._id)
      .select('-password -kitchenPassword -billingPassword');
    
    console.log("✅ Restaurant updated successfully");
    console.log("Updated Location:", updatedRestaurant.latitude, updatedRestaurant.longitude);
    
    res.json({
      message: "Restaurant updated successfully",
      restaurant: updatedRestaurant
    });
    
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ 
      message: "Server Error",
      error: error.message 
    });
  }
};

// ==================== UPDATE PASSWORDS ====================
exports.updatePasswords = async (req, res) => {
  try {
    const { restaurantSlug } = req.params;
    const { 
      currentPassword, 
      newPassword,
      kitchenCurrentPassword, 
      kitchenNewPassword,
      billingCurrentPassword, 
      billingNewPassword
    } = req.body;
    
    console.log("=== UPDATE PASSWORDS ===");
    console.log("Restaurant Slug:", restaurantSlug);
    
    // Check if user is owner of this restaurant
    if (req.user.restaurantSlug !== restaurantSlug || req.user.role !== 'owner') {
      return res.status(403).json({ 
        message: "Access denied. Only restaurant owner can update passwords." 
      });
    }
    
    // Find restaurant by slug
    const restaurant = await Restaurant.findOne({ restaurantSlug });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    
    // Object to track which passwords were updated
    const updatedPasswords = [];
    
    // Update owner password if provided
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, restaurant.password);
      if (!isMatch) {
        return res.status(400).json({ 
          message: "Current owner password is incorrect" 
        });
      }
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      restaurant.password = hashedPassword;
      updatedPasswords.push("owner");
    }
    
    // Update kitchen password if provided
    if (kitchenCurrentPassword && kitchenNewPassword) {
      const isMatch = await bcrypt.compare(kitchenCurrentPassword, restaurant.kitchenPassword);
      if (!isMatch) {
        return res.status(400).json({ 
          message: "Current kitchen password is incorrect" 
        });
      }
      
      const hashedKitchenPassword = await bcrypt.hash(kitchenNewPassword, 10);
      restaurant.kitchenPassword = hashedKitchenPassword;
      updatedPasswords.push("kitchen");
    }
    
    // Update billing password if provided
    if (billingCurrentPassword && billingNewPassword) {
      const isMatch = await bcrypt.compare(billingCurrentPassword, restaurant.billingPassword);
      if (!isMatch) {
        return res.status(400).json({ 
          message: "Current billing password is incorrect" 
        });
      }
      
      const hashedBillingPassword = await bcrypt.hash(billingNewPassword, 10);
      restaurant.billingPassword = hashedBillingPassword;
      updatedPasswords.push("billing");
    }
    
    if (updatedPasswords.length === 0) {
      return res.status(400).json({ 
        message: "No password update data provided" 
      });
    }
    
    restaurant.updatedAt = Date.now();
    await restaurant.save();
    
    console.log("✅ Passwords updated successfully:", updatedPasswords);
    
    res.json({
      message: "Passwords updated successfully",
      updated: updatedPasswords
    });
    
  } catch (error) {
    console.error("Update Password Error:", error);
    res.status(500).json({ 
      message: "Server Error",
      error: error.message 
    });
  }
};

// ==================== REQUEST OTP ====================
exports.requestOtp = async (req, res) => {
  try {
    const { username, role } = req.body;
    
    console.log("\n=== OTP REQUEST ===");
    console.log("Username:", username);
    console.log("Role:", role);
    
    if (!username || !role) {
      return res.status(400).json({ 
        message: "Username and role are required" 
      });
    }
    
    const trimmedUsername = username.trim();
    let restaurant;
    let email;
    
    switch(role) {
      case 'owner':
        restaurant = await Restaurant.findOne({ 
          $or: [
            { email: trimmedUsername },
            { mobile: trimmedUsername }
          ] 
        });
        if (restaurant) email = restaurant.email;
        break;
      case 'kitchen':
        restaurant = await Restaurant.findOne({ 
          kitchenUsername: trimmedUsername
        });
        if (restaurant) email = restaurant.email;
        break;
      case 'billing':
        restaurant = await Restaurant.findOne({ 
          billingUsername: trimmedUsername
        });
        if (restaurant) email = restaurant.email;
        break;
      default:
        return res.status(400).json({ 
          message: "Invalid role" 
        });
    }
    
    if (!restaurant) {
      console.log("No account found for username:", trimmedUsername);
      return res.status(404).json({ 
        message: `No ${role} account found with this username` 
      });
    }
    
    const otp = generateOTP();
    await Otp.deleteMany({ email: email, role: role });
    
    const otpRecord = new Otp({
      email: email,
      otp: otp,
      role: role,
      restaurantSlug: restaurant.restaurantSlug
    });
    
    await otpRecord.save();
    await sendOtpEmail(email, otp, role);
    
    console.log("✅ OTP generated and sent successfully");
    
    const maskedEmail = email.substring(0, 3) + '***' + email.substring(email.indexOf('@'));
    
    res.json({
      message: "OTP sent successfully to your email",
      maskedEmail: maskedEmail,
      fullEmail: email,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("OTP Request Error:", error);
    res.status(500).json({ 
      message: "Server Error",
      error: error.message 
    });
  }
};

// ==================== VERIFY OTP ====================
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp, role } = req.body;
    
    console.log("\n=== OTP VERIFICATION ===");
    console.log("Email:", email);
    console.log("OTP:", otp);
    console.log("Role:", role);
    
    if (!email || !otp || !role) {
      return res.status(400).json({ 
        message: "Email, OTP and role are required" 
      });
    }
    
    const otpRecord = await Otp.findOne({
      email: email,
      otp: otp,
      role: role
    });
    
    if (!otpRecord) {
      console.log("Invalid or expired OTP");
      return res.status(400).json({ 
        message: "Invalid or expired OTP" 
      });
    }
    
    console.log("✅ OTP verified successfully");
    await Otp.deleteOne({ _id: otpRecord._id });
    
    const tempToken = jwt.sign(
      { 
        email: email, 
        role: role,
        purpose: 'password_reset'
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '15m' }
    );
    
    res.json({
      message: "OTP verified successfully",
      tempToken: tempToken,
      email: email,
      role: role,
      restaurantSlug: otpRecord.restaurantSlug
    });
    
  } catch (error) {
    console.error("OTP Verification Error:", error);
    res.status(500).json({ 
      message: "Server Error",
      error: error.message 
    });
  }
};

// ==================== RESET PASSWORD ====================
exports.resetPassword = async (req, res) => {
  try {
    const { email, role, newPassword, tempToken } = req.body;
    
    console.log("\n=== PASSWORD RESET ===");
    console.log("Email:", email);
    console.log("Role:", role);
    
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
      if (decoded.purpose !== 'password_reset' || decoded.email !== email || decoded.role !== role) {
        throw new Error("Invalid token");
      }
    } catch (error) {
      return res.status(401).json({ 
        message: "Invalid or expired reset token" 
      });
    }
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        message: "Password must be at least 6 characters" 
      });
    }
    
    const restaurant = await Restaurant.findOne({ email: email });
    if (!restaurant) {
      return res.status(404).json({ 
        message: "Restaurant not found" 
      });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    switch(role) {
      case 'owner':
        restaurant.password = hashedPassword;
        break;
      case 'kitchen':
        restaurant.kitchenPassword = hashedPassword;
        break;
      case 'billing':
        restaurant.billingPassword = hashedPassword;
        break;
      default:
        return res.status(400).json({ 
          message: "Invalid role" 
        });
    }
    
    restaurant.updatedAt = Date.now();
    await restaurant.save();
    
    console.log("✅ Password reset successful for", role);
    
    res.json({
      message: "Password reset successfully",
      role: role,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Password Reset Error:", error);
    res.status(500).json({ 
      message: "Server Error",
      error: error.message 
    });
  }
};

// ==================== RESEND OTP ====================
exports.resendOtp = async (req, res) => {
  try {
    const { email, role } = req.body;
    
    console.log("\n=== RESEND OTP ===");
    console.log("Email:", email);
    console.log("Role:", role);
    
    if (!email || !role) {
      return res.status(400).json({ 
        message: "Email and role are required" 
      });
    }
    
    await Otp.deleteMany({ email: email, role: role });
    
    const otp = generateOTP();
    
    const otpRecord = new Otp({
      email: email,
      otp: otp,
      role: role
    });
    
    await otpRecord.save();
    await sendOtpEmail(email, otp, role);
    
    console.log("✅ New OTP sent successfully");
    
    res.json({
      message: "New OTP sent successfully",
      email: email.substring(0, 3) + '***' + email.substring(email.indexOf('@'))
    });
    
  } catch (error) {
    console.error("Resend OTP Error:", error);
    res.status(500).json({ 
      message: "Server Error",
      error: error.message 
    });
  }
};

// ==================== GET ALL RESTAURANTS ====================
exports.getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({})
      .select('-password -kitchenPassword -billingPassword')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${restaurants.length} restaurants`);
    
    res.json({
      count: restaurants.length,
      restaurants: restaurants
    });
  } catch (error) {
    console.error("Get All Restaurants Error:", error);
    res.status(500).json({ 
      message: "Server Error",
      error: error.message 
    });
  }
};

// ==================== DELETE RESTAURANT ====================
exports.deleteRestaurant = async (req, res) => {
  try {
    const { restaurantSlug } = req.params;
    
    console.log("=== DELETE RESTAURANT ===");
    console.log("Restaurant Slug:", restaurantSlug);
    
    const restaurant = await Restaurant.findOne({ restaurantSlug });
    
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    
    await Restaurant.deleteOne({ restaurantSlug });
    
    console.log("✅ Restaurant deleted successfully:", restaurant.restaurantName);
    
    res.json({
      message: "Restaurant deleted successfully",
      deletedRestaurant: {
        name: restaurant.restaurantName,
        slug: restaurant.restaurantSlug
      }
    });
  } catch (error) {
    console.error("Delete Restaurant Error:", error);
    res.status(500).json({ 
      message: "Server Error",
      error: error.message 
    });
  }
};