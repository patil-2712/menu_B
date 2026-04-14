// routes/feedbackRoutes.js
const express = require('express');
const router = express.Router();
const { 
  submitFeedback,
  getFeedbackByRestaurant,
  getFeedbackByOrder,
  getAllFeedback,
  updateFeedbackStatus,
  addRestaurantResponse,
  getFeedbackStats,
  getRecentFeedback,
  getFeedbackSummary,
  exportFeedback,
  getFeedbackByDateRange
} = require('../controllers/feedbackController');

// Public routes
router.post('/submit', submitFeedback);
router.get('/order/:restaurantCode/:billNumber', getFeedbackByOrder);

// Restaurant-specific routes
router.get('/restaurant/:restaurantSlug', getFeedbackByRestaurant);
router.get('/stats/:restaurantSlug', getFeedbackStats);
router.get('/recent/:restaurantSlug', getRecentFeedback);

// CHANGED: Removed ? from parameter and created separate routes for optional slug
router.get('/summary', getFeedbackSummary); // No slug
router.get('/summary/:restaurantSlug', getFeedbackSummary); // With slug

// CHANGED: Removed ? from parameter and created separate routes for optional slug  
router.get('/date-range', getFeedbackByDateRange); // No slug
router.get('/date-range/:restaurantSlug', getFeedbackByDateRange); // With slug

// Admin routes
router.get('/all', getAllFeedback);

// CHANGED: Removed ? from parameter and created separate routes for optional slug
router.get('/export', exportFeedback); // No slug
router.get('/export/:restaurantSlug', exportFeedback); // With slug

router.put('/:feedbackId/status', updateFeedbackStatus);
router.put('/:feedbackId/response', addRestaurantResponse);

module.exports = router;