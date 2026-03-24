// In restaurantRoutes.js
const express = require("express");
const router = express.Router();

const { 
  registerRestaurant, 
  login, 
  getRestaurantProfile,
  getRestaurantBySlug,
  updateRestaurant,
  updatePasswords,
  // Add these new imports
  requestOtp,
  verifyOtp,
  resetPassword,
  resendOtp
} = require("../controllers/restaurantController");

const { registerRestaurantValidation } = require("../middlewares/restaurantValidation");
const { verifyToken } = require("../middlewares/auth");

// Public routes
router.post("/register", registerRestaurantValidation, registerRestaurant);
router.post("/login", login);
router.get("/by-slug/:slug", getRestaurantBySlug);

// Password reset routes (public)
router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);
router.post("/resend-otp", resendOtp);

// Protected routes
router.get("/profile", verifyToken, getRestaurantProfile);
router.put("/update/:restaurantSlug", verifyToken, updateRestaurant);
router.put("/update-passwords/:restaurantSlug", verifyToken, updatePasswords);

// In restaurantRoutes.js - add these if needed




module.exports = router;